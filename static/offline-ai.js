/**
 * Knightfall Chess Studio - Offline Client Chess Engine & AI
 * 100% self-contained client-side engine for offline PWA play
 */

(function () {
  // Piece values for positional evaluation
  const PIECE_VALUES = {
    p: 100,
    n: 320,
    b: 330,
    r: 500,
    q: 900,
    k: 20000
  };

  // Positional Piece-Square Tables (White perspective; flipped for Black)
  const PST = {
    p: [
      0,  0,  0,  0,  0,  0,  0,  0,
      50, 50, 50, 50, 50, 50, 50, 50,
      10, 10, 20, 30, 30, 20, 10, 10,
       5,  5, 10, 25, 25, 10,  5,  5,
       0,  0,  0, 20, 20,  0,  0,  0,
       5, -5,-10,  0,  0,-10, -5,  5,
       5, 10, 10,-20,-20, 10, 10,  5,
       0,  0,  0,  0,  0,  0,  0,  0
    ],
    n: [
      -50,-40,-30,-30,-30,-30,-40,-50,
      -40,-20,  0,  0,  0,  0,-20,-40,
      -30,  0, 10, 15, 15, 10,  0,-30,
      -30,  5, 15, 20, 20, 15,  5,-30,
      -30,  0, 15, 20, 20, 15,  0,-30,
      -30,  5, 10, 15, 15, 10,  5,-30,
      -40,-20,  0,  5,  5,  0,-20,-40,
      -50,-40,-30,-30,-30,-30,-40,-50
    ],
    b: [
      -20,-10,-10,-10,-10,-10,-10,-20,
      -10,  0,  0,  0,  0,  0,  0,-10,
      -10,  0,  5, 10, 10,  5,  0,-10,
      -10,  5,  5, 10, 10,  5,  5,-10,
      -10,  0, 10, 10, 10, 10,  0,-10,
      -10, 10, 10, 10, 10, 10, 10,-10,
      -10,  5,  0,  0,  0,  0,  5,-10,
      -20,-10,-10,-10,-10,-10,-10,-20
    ],
    r: [
        0,  0,  0,  0,  0,  0,  0,  0,
        5, 10, 10, 10, 10, 10, 10,  5,
       -5,  0,  0,  0,  0,  0,  0, -5,
       -5,  0,  0,  0,  0,  0,  0, -5,
       -5,  0,  0,  0,  0,  0,  0, -5,
       -5,  0,  0,  0,  0,  0,  0, -5,
       -5,  0,  0,  0,  0,  0,  0, -5,
        0,  0,  0,  5,  5,  0,  0,  0
    ],
    q: [
      -20,-10,-10, -5, -5,-10,-10,-20,
      -10,  0,  0,  0,  0,  0,  0,-10,
      -10,  0,  5,  5,  5,  5,  0,-10,
       -5,  0,  5,  5,  5,  5,  0, -5,
        0,  0,  5,  5,  5,  5,  0, -5,
      -10,  5,  5,  5,  5,  5,  0,-10,
      -10,  0,  5,  0,  0,  0,  0,-10,
      -20,-10,-10, -5, -5,-10,-10,-20
    ],
    k: [
      -30,-40,-40,-50,-50,-40,-40,-30,
      -30,-40,-40,-50,-50,-40,-40,-30,
      -30,-40,-40,-50,-50,-40,-40,-30,
      -30,-40,-40,-50,-50,-40,-40,-30,
      -20,-30,-30,-40,-40,-30,-30,-20,
      -10,-20,-20,-20,-20,-20,-20,-10,
       20, 20,  0,  0,  0,  0, 20, 20,
       20, 30, 10,  0,  0, 10, 30, 20
    ]
  };

  const SQUARES = [
    'a8','b8','c8','d8','e8','f8','g8','h8',
    'a7','b7','c7','d7','e7','f7','g7','h7',
    'a6','b6','c6','d6','e6','f6','g6','h6',
    'a5','b5','c5','d5','e5','f5','g5','h5',
    'a4','b4','c4','d4','e4','f4','g4','h4',
    'a3','b3','c3','d3','e3','f3','g3','h3',
    'a2','b2','c2','d2','e2','f2','g2','h2',
    'a1','b1','c1','d1','e1','f1','g1','h1'
  ];

  function generateChess960FEN() {
    const pieces = new Array(8);
    const emptyIndices = () => pieces.map((p, i) => p === undefined ? i : -1).filter(i => i !== -1);
    const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];

    // 1. Light-square bishop on even square
    const b1 = rand([0, 2, 4, 6]);
    pieces[b1] = 'B';
    // 2. Dark-square bishop on odd square
    const b2 = rand([1, 3, 5, 7]);
    pieces[b2] = 'B';
    // 3. Queen
    const q = rand(emptyIndices());
    pieces[q] = 'Q';
    // 4. Two Knights
    const n1 = rand(emptyIndices());
    pieces[n1] = 'N';
    const n2 = rand(emptyIndices());
    pieces[n2] = 'N';
    // 5. Remaining 3 slots: Rook, King, Rook (King between rooks)
    const rem = emptyIndices();
    pieces[rem[0]] = 'R';
    pieces[rem[1]] = 'K';
    pieces[rem[2]] = 'R';

    const whiteRank = pieces.join('');
    const blackRank = whiteRank.toLowerCase();
    return `${blackRank}/pppppppp/8/8/8/8/PPPPPPPP/${whiteRank} w KQkq - 0 1`;
  }

  class OfflineChessEngine {
    constructor() {
      this.gameId = null;
      this.mode = 'ai';
      this.playerColor = 'white';
      this.level = 'club';
      this.variant = 'classical';
      this.chess = new Chess();
      this.lastMove = '';
      this.historyMoves = []; // { number, san, uci }
    }

    newGame(mode = 'ai', playerColor = 'white', level = 'club', variant = 'classical') {
      this.gameId = 'offline-' + Date.now().toString(36);
      this.mode = mode;
      this.playerColor = playerColor;
      this.level = level;
      this.variant = variant;

      if (variant === 'chess960') {
        this.chess.load(generateChess960FEN());
      } else if (variant === 'knights') {
        this.chess.load('rn1qk1nr/pppppppp/8/8/8/8/PPPPPPPP/RN1QK1NR w KQkq - 0 1');
      } else {
        this.chess.reset();
      }

      this.lastMove = '';
      this.historyMoves = [];

      // If computer plays white, make opening move
      if (this.mode === 'ai' && this.playerColor === 'black') {
        this.makeAIMove();
      }

      this.saveToStorage();
      return this.getState();
    }

    loadGame(gameId) {
      const stored = localStorage.getItem('knightfall-offline-state');
      if (stored) {
        try {
          const data = JSON.parse(stored);
          if (data.game_id === gameId) {
            this.gameId = data.game_id;
            this.mode = data.mode;
            this.playerColor = data.player_color;
            this.level = data.level;
            this.variant = data.variant || 'classical';
            this.lastMove = data.last_move || '';
            this.chess.load(data.fen);
            this.historyMoves = data.moves || [];
            return this.getState();
          }
        } catch (_) {}
      }
      return this.newGame(this.mode, this.playerColor, this.level, this.variant);
    }

    saveToStorage() {
      const state = this.getState();
      localStorage.setItem('knightfall-offline-state', JSON.stringify(state));
    }

    makePlayerMove(uci) {
      const from = uci.slice(0, 2);
      const to = uci.slice(2, 4);
      const promotion = uci.length > 4 ? uci[4] : undefined;

      const moveResult = this.chess.move({ from, to, promotion });
      if (!moveResult) {
        throw new Error('Illegal move');
      }

      this.lastMove = uci;
      const turnNum = Math.floor(this.historyMoves.length / 2) + 1;
      this.historyMoves.push({
        number: turnNum,
        san: moveResult.san,
        uci: uci
      });

      // AI response if applicable
      if (this.mode === 'ai' && !this.chess.game_over() && this.getTurn() !== this.playerColor) {
        this.makeAIMove();
      }

      this.saveToStorage();
      return this.getState();
    }

    makeAIMove() {
      const moves = this.chess.moves({ verbose: true });
      if (!moves.length) return;

      let bestMove = null;

      if (this.level === 'casual') {
        // Casual: random or immediate capture
        const captures = moves.filter(m => m.captured);
        bestMove = captures.length && Math.random() > 0.4
          ? captures[Math.floor(Math.random() * captures.length)]
          : moves[Math.floor(Math.random() * moves.length)];
      } else {
        // Club (depth 2) or Strong (depth 3)
        const depth = this.level === 'strong' ? 3 : 2;
        const isMaximizing = this.chess.turn() === 'w';
        let bestValue = isMaximizing ? -Infinity : Infinity;

        // Shuffle moves to prevent deterministic repetitive games
        const shuffled = moves.sort(() => Math.random() - 0.5);

        for (const move of shuffled) {
          this.chess.move(move);
          const val = this.minimax(depth - 1, -Infinity, Infinity, !isMaximizing);
          this.chess.undo();

          if (isMaximizing) {
            if (val > bestValue) {
              bestValue = val;
              bestMove = move;
            }
          } else {
            if (val < bestValue) {
              bestValue = val;
              bestMove = move;
            }
          }
        }
      }

      if (bestMove) {
        const uci = bestMove.from + bestMove.to + (bestMove.promotion || '');
        this.chess.move(bestMove);
        this.lastMove = uci;
        const turnNum = Math.floor(this.historyMoves.length / 2) + 1;
        this.historyMoves.push({
          number: turnNum,
          san: bestMove.san,
          uci: uci
        });
      }
    }

    minimax(depth, alpha, beta, isMaximizing) {
      if (depth === 0 || this.chess.game_over()) {
        return this.evaluateBoard();
      }

      const moves = this.chess.moves({ verbose: true });

      if (isMaximizing) {
        let maxEval = -Infinity;
        for (const move of moves) {
          this.chess.move(move);
          const evaluation = this.minimax(depth - 1, alpha, beta, false);
          this.chess.undo();
          maxEval = Math.max(maxEval, evaluation);
          alpha = Math.max(alpha, evaluation);
          if (beta <= alpha) break;
        }
        return maxEval;
      } else {
        let minEval = Infinity;
        for (const move of moves) {
          this.chess.move(move);
          const evaluation = this.minimax(depth - 1, alpha, beta, true);
          this.chess.undo();
          minEval = Math.min(minEval, evaluation);
          beta = Math.min(beta, evaluation);
          if (beta <= alpha) break;
        }
        return minEval;
      }
    }

    evaluateBoard() {
      let total = 0;
      const board = this.chess.board();

      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const piece = board[r][c];
          if (!piece) continue;

          const type = piece.type;
          const isWhite = piece.color === 'w';
          const val = PIECE_VALUES[type] || 0;

          // PST index
          const pstIndex = isWhite ? r * 8 + c : (7 - r) * 8 + c;
          const posVal = (PST[type] && PST[type][pstIndex]) || 0;

          const pieceScore = val + posVal;
          total += isWhite ? pieceScore : -pieceScore;
        }
      }
      return total;
    }

    undo() {
      if (!this.historyMoves.length) return this.getState();

      if (this.mode === 'ai') {
        // Undo both player and computer moves
        this.chess.undo();
        this.historyMoves.pop();
        if (this.historyMoves.length && this.getTurn() !== this.playerColor) {
          this.chess.undo();
          this.historyMoves.pop();
        }
      } else {
        this.chess.undo();
        this.historyMoves.pop();
      }

      this.lastMove = this.historyMoves.length ? this.historyMoves[this.historyMoves.length - 1].uci : '';
      this.saveToStorage();
      return this.getState();
    }

    resign() {
      this.saveToStorage();
      const state = this.getState();
      state.done = true;
      state.result = this.playerColor === 'white' ? 'black' : 'white';
      state.status = `${this.playerColor === 'white' ? 'White' : 'Black'} resigned.`;
      return state;
    }

    getTurn() {
      return this.chess.turn() === 'w' ? 'white' : 'black';
    }

    getState() {
      const fen = this.chess.fen();
      const turn = this.getTurn();

      // Board pieces map
      const pieces = {};
      const board = this.chess.board();
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const p = board[r][c];
          if (p) {
            const sq = SQUARES[r * 8 + c];
            pieces[sq] = p.color === 'w' ? p.type.toUpperCase() : p.type.toLowerCase();
          }
        }
      }

      // Legal moves
      const verboseMoves = this.chess.moves({ verbose: true });
      const legalMoves = verboseMoves.map(m => ({
        uci: m.from + m.to + (m.promotion || ''),
        from: m.from,
        to: m.to,
        promotion: m.promotion || ''
      }));

      // Check square
      let checkSquare = '';
      if (this.chess.in_check()) {
        const kingColor = turn === 'white' ? 'K' : 'k';
        for (const [sq, p] of Object.entries(pieces)) {
          if (p === kingColor) {
            checkSquare = sq;
            break;
          }
        }
      }

      // Game status & completion
      const inCheck = this.chess.in_check();
      const inCheckmate = this.chess.in_checkmate();
      const inDraw = this.chess.in_draw();
      const done = inCheckmate || inDraw;

      let result = '';
      let status = `${turn[0].toUpperCase() + turn.slice(1)} to move.`;

      if (inCheckmate) {
        result = turn === 'white' ? 'black' : 'white';
        status = `Checkmate! ${result[0].toUpperCase() + result.slice(1)} wins.`;
      } else if (inDraw) {
        result = 'draw';
        status = 'Game drawn.';
      } else if (inCheck) {
        status += ' Check!';
      }

      return {
        game_id: this.gameId,
        fen: fen,
        pieces: pieces,
        turn: turn,
        player_color: this.playerColor,
      let hillDone = false;
      if (this.variant === 'king_hill') {
        const hillSquares = ['d4', 'e4', 'd5', 'e5'];
        for (const sq of hillSquares) {
          if (pieces[sq] === 'K') {
            done = true;
            result = 'white';
            status = 'White wins! Royal King claimed the hill!';
            hillDone = true;
            break;
          }
          if (pieces[sq] === 'k') {
            done = true;
            result = 'black';
            status = 'Black wins! Royal King claimed the hill!';
            hillDone = true;
            break;
          }
        }
      }

      return {
        game_id: this.gameId,
        fen: fen,
        pieces: pieces,
        turn: turn,
        player_color: this.playerColor,
        mode: this.mode,
        level: this.level,
        variant: this.variant,
        last_move: this.lastMove,
        check_square: checkSquare,
        legal_moves: done ? [] : legalMoves,
        moves: this.historyMoves,
        done: done,
        status: status,
        result: result,
        engine: 'Offline Client AI (Local)',
        engine_is_stockfish: false,
        is_offline: true,
        pgn: this.chess.pgn()
      };
    }
  }

  window.OfflineChessEngine = OfflineChessEngine;
  window.offlineEngine = new OfflineChessEngine();
})();
