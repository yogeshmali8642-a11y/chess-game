from __future__ import annotations

import os
import random
import threading
from pathlib import Path
from typing import Any

import chess
import chess.engine
import chess.pgn
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

ROOT = Path(__file__).resolve().parent
STATIC = ROOT / "static"

app = FastAPI(title="Knightfall Chess", version="1.0.0")
app.mount("/static", StaticFiles(directory=STATIC), name="static")

# This starter is intended for local play. Each browser receives its own game ID.
GAMES: dict[str, "Game"] = {}
GAMES_LOCK = threading.Lock()
ENGINE_LOCK = threading.Lock()
ENGINE: chess.engine.SimpleEngine | None = None
ENGINE_PATH: str | None = None

PIECE_VALUES = {
    chess.PAWN: 100,
    chess.KNIGHT: 320,
    chess.BISHOP: 335,
    chess.ROOK: 500,
    chess.QUEEN: 900,
    chess.KING: 0,
}
LEVELS = {
    "club":         {"skill": 5,  "time": 0.20, "fallback_depth": 2},
    "master":       {"skill": 12, "time": 0.40, "fallback_depth": 3},
    "yogesh":       {"skill": 18, "time": 0.80, "fallback_depth": 4},
    "master_yogesh":{"skill": 20, "time": 1.50, "fallback_depth": 5},
}


def find_stockfish() -> str | None:
    configured = os.getenv("STOCKFISH_PATH", "").strip().strip('"')
    candidates = [configured] if configured else []
    candidates += ["stockfish", "stockfish.exe"]
    for candidate in candidates:
        if not candidate:
            continue
        try:
            engine = chess.engine.SimpleEngine.popen_uci(candidate)
            engine.quit()
            return candidate
        except (OSError, chess.engine.EngineError, chess.engine.EngineTerminatedError):
            continue
    return None


def load_engine() -> None:
    """Find an installed Stockfish. The app also has a lightweight Python fallback."""
    global ENGINE, ENGINE_PATH
    path = find_stockfish()
    if not path:
        ENGINE = None
        ENGINE_PATH = None
        return
    try:
        ENGINE = chess.engine.SimpleEngine.popen_uci(path)
        ENGINE_PATH = path
    except (OSError, chess.engine.EngineError, chess.engine.EngineTerminatedError):
        ENGINE = None
        ENGINE_PATH = None


@app.on_event("startup")
def startup() -> None:
    load_engine()


@app.on_event("shutdown")
def shutdown() -> None:
    global ENGINE
    if ENGINE is not None:
        try:
            ENGINE.quit()
        except Exception:
            pass
        ENGINE = None


class NewGameRequest(BaseModel):
    mode: str = Field(default="ai", pattern="^(ai|local)$")
    player_color: str = Field(default="white", pattern="^(white|black)$")
    level: str = Field(default="club", pattern="^(club|master|yogesh|master_yogesh)$")
    variant: str = Field(default="classical")
    initial_fen: str | None = None


class MoveRequest(BaseModel):
    uci: str = Field(min_length=4, max_length=5)


class Game:
    def __init__(self, mode: str, player_color: str, level: str, variant: str = "classical", initial_fen: str | None = None):
        self.variant = variant
        if initial_fen:
            self.board = chess.Board(initial_fen)
        elif variant == "chess960":
            fischer_index = random.randint(0, 959)
            self.board = chess.Board.from_chess960_pos(fischer_index)
        elif variant == "knights":
            # Royal Knights Duel setup
            self.board = chess.Board("rn1qk1nr/pppppppp/8/8/8/8/PPPPPPPP/RN1QK1NR w KQkq - 0 1")
        else:
            self.board = chess.Board()

        self.mode = mode
        self.player_color = chess.WHITE if player_color == "white" else chess.BLACK
        self.level = level
        self.created_engine = "stockfish" if ENGINE is not None else "python-fallback"
        self.resigned_result: str | None = None
        self.lock = threading.RLock()


def get_game(game_id: str) -> Game:
    game = GAMES.get(game_id)
    if game is None:
        raise HTTPException(status_code=404, detail="Game not found. Start a new game.")
    return game


def terminal_message(board: chess.Board, resigned_result: str | None = None) -> tuple[bool, str, str | None]:
    if resigned_result is not None:
        if resigned_result == "1-0":
            return True, "White wins by resignation.", "white"
        if resigned_result == "0-1":
            return True, "Black wins by resignation.", "black"
        return True, "Game drawn.", "draw"
    if board.is_checkmate():
        winner = "Black" if board.turn == chess.WHITE else "White"
        return True, f"Checkmate. {winner} wins.", winner.lower()
    if board.is_stalemate():
        return True, "Draw by stalemate.", "draw"
    if board.is_insufficient_material():
        return True, "Draw by insufficient material.", "draw"
    if board.is_seventyfive_moves():
        return True, "Draw by the 75-move rule.", "draw"
    if board.is_fivefold_repetition():
        return True, "Draw by fivefold repetition.", "draw"
    if board.is_variant_end():
        return True, "Game over.", "draw"
    check = " · Check" if board.is_check() else ""
    turn = "White" if board.turn == chess.WHITE else "Black"
    return False, f"{turn} to move{check}.", None


def fallback_evaluate(board: chess.Board, perspective: chess.Color) -> int:
    """Small material/position evaluator used only when Stockfish is unavailable."""
    if board.is_checkmate():
        return -100_000 if board.turn == perspective else 100_000
    if board.is_stalemate() or board.is_insufficient_material() or board.is_fivefold_repetition() or board.is_seventyfive_moves():
        return 0

    score = 0
    for square, piece in board.piece_map().items():
        value = PIECE_VALUES[piece.piece_type]
        file_idx = chess.square_file(square)
        rank_idx = chess.square_rank(square)
        # Mild center preference and development encouragement.
        center = 7 - (abs(3.5 - file_idx) + abs(3.5 - rank_idx))
        positional = int(center * (2 if piece.piece_type in (chess.KNIGHT, chess.BISHOP, chess.QUEEN) else 1))
        if piece.piece_type == chess.PAWN:
            progress = rank_idx if piece.color == chess.WHITE else 7 - rank_idx
            positional += progress * 2
        term = value + positional
        score += term if piece.color == perspective else -term
    if board.is_check():
        score += -20 if board.turn == perspective else 20
    return score


def move_order_score(board: chess.Board, move: chess.Move) -> int:
    score = 0
    if board.is_capture(move):
        victim = board.piece_at(move.to_square)
        attacker = board.piece_at(move.from_square)
        score += 10_000 + (PIECE_VALUES[victim.piece_type] if victim else 100) - (PIECE_VALUES[attacker.piece_type] // 10 if attacker else 0)
    if move.promotion:
        score += 8_000 + PIECE_VALUES.get(move.promotion, 0)
    if board.gives_check(move):
        score += 500
    return score


def minimax(board: chess.Board, depth: int, alpha: int, beta: int, perspective: chess.Color) -> int:
    if depth == 0 or board.is_game_over(claim_draw=False):
        return fallback_evaluate(board, perspective)

    moves = list(board.legal_moves)
    moves.sort(key=lambda m: move_order_score(board, m), reverse=True)
    maximizing = board.turn == perspective
    best = -1_000_000 if maximizing else 1_000_000
    for move in moves:
        board.push(move)
        score = minimax(board, depth - 1, alpha, beta, perspective)
        board.pop()
        if maximizing:
            best = max(best, score)
            alpha = max(alpha, best)
        else:
            best = min(best, score)
            beta = min(beta, best)
        if beta <= alpha:
            break
    return best


def python_fallback_move(board: chess.Board, level: str) -> chess.Move:
    legal = list(board.legal_moves)
    if not legal:
        raise RuntimeError("No legal moves available.")
    if level == "casual":
        # Still avoids completely random blunders by preferring simple captures/checks.
        scored = sorted(legal, key=lambda m: move_order_score(board, m), reverse=True)
        pool = scored[: max(1, min(8, len(scored)))]
        return random.choice(pool)

    perspective = board.turn
    depth = LEVELS[level]["fallback_depth"]
    moves = sorted(legal, key=lambda m: move_order_score(board, m), reverse=True)
    best_move = moves[0]
    best_score = -1_000_000
    alpha = -1_000_000
    beta = 1_000_000
    # Randomize exact ties so the fallback does not repeat the same line every game.
    random.shuffle(moves)
    moves.sort(key=lambda m: move_order_score(board, m), reverse=True)
    for move in moves:
        board.push(move)
        score = minimax(board, depth - 1, alpha, beta, perspective)
        board.pop()
        if score > best_score:
            best_score = score
            best_move = move
        alpha = max(alpha, best_score)
    return best_move


def choose_engine_move(game: Game) -> chess.Move:
    board = game.board
    if ENGINE is not None:
        settings = LEVELS[game.level]
        with ENGINE_LOCK:
            try:
                ENGINE.configure({"Skill Level": settings["skill"]})
                result = ENGINE.play(board, chess.engine.Limit(time=settings["time"]))
                if result.move is not None:
                    return result.move
            except (chess.engine.EngineError, chess.engine.EngineTerminatedError, OSError):
                pass
    return python_fallback_move(board, game.level)


def maybe_play_ai(game: Game) -> None:
    board = game.board
    if game.mode != "ai" or board.is_game_over(claim_draw=False):
        return
    if board.turn == game.player_color:
        return
    move = choose_engine_move(game)
    if move in board.legal_moves:
        board.push(move)


def game_payload(game_id: str, game: Game) -> dict[str, Any]:
    board = game.board
    done, message, result = terminal_message(board, game.resigned_result)
    move_history: list[dict[str, Any]] = []
    replay = board.root()
    for move in board.move_stack:
        side = "white" if replay.turn == chess.WHITE else "black"
        san = replay.san(move)
        move_history.append({
            "number": replay.fullmove_number,
            "color": side,
            "san": san,
            "uci": move.uci(),
        })
        replay.push(move)

    legal_moves = [] if done else [
        {"uci": move.uci(), "from": chess.square_name(move.from_square), "to": chess.square_name(move.to_square),
         "promotion": chess.piece_symbol(move.promotion) if move.promotion else None}
        for move in board.legal_moves
    ]
    pieces = {chess.square_name(square): piece.symbol() for square, piece in board.piece_map().items()}
    last_move = board.peek().uci() if board.move_stack else None
    check_square = chess.square_name(board.king(board.turn)) if board.is_check() else None
    return {
        "game_id": game_id,
        "fen": board.fen(),
        "pieces": pieces,
        "turn": "white" if board.turn == chess.WHITE else "black",
        "player_color": "white" if game.player_color == chess.WHITE else "black",
        "mode": game.mode,
        "level": game.level,
        "last_move": last_move,
        "check_square": check_square,
        "legal_moves": legal_moves,
        "moves": move_history,
        "done": done,
        "status": message,
        "result": result,
        "engine": "Stockfish" if ENGINE is not None else "Python fallback",
        "engine_is_stockfish": ENGINE is not None,
        "variant": getattr(game, "variant", "classical"),
        "pgn": export_pgn(board, game.resigned_result),
    }


def export_pgn(board: chess.Board, resigned_result: str | None = None) -> str:
    game = chess.pgn.Game.from_board(board)
    game.headers["Event"] = "Knightfall Chess"
    game.headers["Site"] = "Local game"
    game.headers["Date"] = "????.??.??"
    game.headers["Round"] = "-"
    game.headers["White"] = "Human" if board.root().turn == chess.WHITE else "Computer"
    game.headers["Black"] = "Human" if board.root().turn == chess.BLACK else "Computer"
    game.headers["Result"] = resigned_result or (board.result(claim_draw=False) if board.is_game_over(claim_draw=False) else "*")
    import io
    output = io.StringIO()
    print(game, file=output, end="\n")
    return output.getvalue().strip()


@app.get("/")
def index() -> FileResponse:
    return FileResponse(STATIC / "index.html")


@app.get("/clear-cache")
def clear_cache_page() -> FileResponse:
    return FileResponse(STATIC / "clear-cache.html")


@app.get("/health")
def health() -> dict[str, Any]:
    return {"ok": True, "engine": "Stockfish" if ENGINE is not None else "Python fallback"}


@app.post("/api/new")
def new_game(request: NewGameRequest) -> dict[str, Any]:
    import uuid
    game_id = uuid.uuid4().hex
    game = Game(request.mode, request.player_color, request.level, request.variant, request.initial_fen)
    with GAMES_LOCK:
        GAMES[game_id] = game
    with game.lock:
        maybe_play_ai(game)
        return game_payload(game_id, game)


@app.get("/api/state/{game_id}")
def state(game_id: str) -> dict[str, Any]:
    game = get_game(game_id)
    with game.lock:
        return game_payload(game_id, game)


@app.post("/api/move/{game_id}")
def make_move(game_id: str, request: MoveRequest) -> dict[str, Any]:
    game = get_game(game_id)
    with game.lock:
        board = game.board
        if board.is_game_over(claim_draw=False) or game.resigned_result is not None:
            raise HTTPException(status_code=409, detail="The game has ended.")
        try:
            move = chess.Move.from_uci(request.uci.lower())
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid move notation.")
        if move not in board.legal_moves:
            raise HTTPException(status_code=400, detail="That move is not legal.")
        if game.mode == "ai" and board.turn != game.player_color:
            raise HTTPException(status_code=409, detail="It is the computer's turn.")
        board.push(move)
        maybe_play_ai(game)
        return game_payload(game_id, game)


@app.post("/api/undo/{game_id}")
def undo(game_id: str) -> dict[str, Any]:
    game = get_game(game_id)
    with game.lock:
        board = game.board
        if game.resigned_result is not None:
            game.resigned_result = None
        if not board.move_stack:
            return game_payload(game_id, game)
        if game.mode == "ai":
            # Undo the human move plus the AI reply; at the start, remove what is available.
            pops = min(2, len(board.move_stack))
        else:
            pops = 1
        for _ in range(pops):
            board.pop()
        return game_payload(game_id, game)


@app.post("/api/resign/{game_id}")
def resign(game_id: str) -> dict[str, Any]:
    game = get_game(game_id)
    with game.lock:
        if not game.board.is_game_over(claim_draw=False) and game.resigned_result is None:
            # The player whose turn it is resigns. In AI mode, only allow human resignation.
            if game.mode == "ai" and game.board.turn != game.player_color:
                raise HTTPException(status_code=409, detail="Wait for the computer to finish its move.")
            game.resigned_result = "0-1" if game.board.turn == chess.WHITE else "1-0"
        return game_payload(game_id, game)


# Serve service worker at the root scope so it can cache the app shell.
@app.get("/sw.js")
def service_worker() -> FileResponse:
    return FileResponse(STATIC / "sw.js", media_type="application/javascript")


@app.get("/manifest.webmanifest")
def manifest() -> FileResponse:
    return FileResponse(STATIC / "manifest.webmanifest", media_type="application/manifest+json")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=False)
