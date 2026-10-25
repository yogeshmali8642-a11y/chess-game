/**
 * Knightfall 3D Chess Studio - Master Application Logic
 * Supports Classical Royal Chess, Chess960, Royal Knights, King of the Hill,
 * Digital Tournament Clocks, Live Evaluation Bar, Opening Explorer, and Auto-Flip Pass & Play.
 */

// High-definition Staunton Vector SVGs for 2D Mode and Captured Trays
const PIECE_SVGS = {
  // White Pieces
  P: `<svg viewBox="0 0 45 45" class="piece-svg"><path d="m 22.5,9 c -2.21,0 -4,1.79 -4,4 0,0.89 0.29,1.71 0.78,2.38 C 17.33,16.5 16,18.59 16,21 c 0,2.03 0.94,3.84 2.41,5.03 C 15.41,27.09 11,31.58 11,39.5 l 23,0 c 0,-7.92 -4.41,-12.41 -7.41,-13.47 C 28.06,24.84 29,23.03 29,21 29,18.59 27.67,16.5 25.72,15.38 26.21,14.71 26.5,13.89 26.5,13 c 0,-2.21 -1.79,-4 -4,-4 z" fill="#ffffff" stroke="#1c1c1c" stroke-width="1.6" stroke-linecap="round"/></svg>`,
  R: `<svg viewBox="0 0 45 45" class="piece-svg"><g fill="#ffffff" stroke="#1c1c1c" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M 9,39 L 36,39 L 36,36 L 9,36 L 9,39 z"/><path d="M 12,36 L 12,32 L 33,32 L 33,36 L 12,36 z"/><path d="M 11,14 L 11,9 L 15,9 L 15,11 L 20,11 L 20,9 L 25,9 L 25,11 L 30,11 L 30,9 L 34,9 L 34,14"/><path d="M 34,14 L 31,17 L 14,17 L 11,14"/><path d="M 14,17 L 14,29.5 L 31,29.5 L 31,17"/><path d="M 14,29.5 L 11,32 L 34,32 L 31,29.5"/><path d="M 12,32 L 33,32"/></g></svg>`,
  N: `<svg viewBox="0 0 45 45" class="piece-svg"><g fill="#ffffff" stroke="#1c1c1c" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M 22,10 C 32.5,11 38.5,18 38,39 L 15,39 C 15,30 25,32.5 23,18"/><path d="M 24,18 C 24.38,20.91 18.45,25.37 16,27 C 13,29 13.18,31.34 11,31 C 9.958,30.06 12.41,27.96 11,28 C 10,28 11.19,29.23 10,30 C 9,30 5.997,31 6,26 C 6,24 12,14 12,14 C 12,14 13.89,12.1 14,10.5 C 13.27,9.506 13.5,8.5 13.5,7.5 C 14.5,6.5 16.5,10 16.5,10 L 18.5,10 C 18.5,10 19.28,8.008 21,7 C 22,7 22,10 22,10 z"/><circle cx="14" cy="16" r="1" fill="#1c1c1c"/></g></svg>`,
  B: `<svg viewBox="0 0 45 45" class="piece-svg"><g fill="#ffffff" stroke="#1c1c1c" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M 9,36 C 12.39,35.03 19.11,36.43 22.5,34 C 25.89,36.43 32.61,35.03 36,36 C 36,36 37.65,36.54 39,38 C 38.32,38.97 37.35,38.99 36,38.5 C 32.61,37.53 25.89,38.96 22.5,37.5 C 19.11,38.96 12.39,37.53 9,38.5 C 7.646,38.99 6.677,38.97 6,38 C 7.354,36.54 9,36 9,36 z"/><path d="M 15,32 C 17.5,34.5 27.5,34.5 30,32 C 30.5,30.5 30,30 30,30 C 30,27.5 27.5,26 27.5,26 C 33,24.5 33.5,14.5 22.5,10.5 C 11.5,14.5 12,24.5 17.5,26 C 17.5,26 15,27.5 15,30 C 15,30 14.5,30.5 15,32 z"/><path d="M 25 8 A 2.5 2.5 0 1 1 20,8 A 2.5 2.5 0 1 1 25 8 z"/><path d="M 17.5,26 L 27.5,26 M 15,30 L 30,30 M 22.5,15.5 L 22.5,20.5 M 20,18 L 25,18"/></g></svg>`,
  Q: `<svg viewBox="0 0 45 45" class="piece-svg"><g fill="#ffffff" stroke="#1c1c1c" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M 9,26 C 17.5,24.5 30,24.5 36,26 L 38.5,13.5 L 31,25 L 30.7,10.5 L 25.5,24.5 L 22.5,10 L 19.5,24.5 L 14.3,10.5 L 14,25 L 6.5,13.5 L 9,26 z"/><path d="M 9,26 C 9,28 10.5,28 11.5,30 C 12.5,31.5 12.5,31 12,33.5 C 10.5,34.5 11,36 11,36 C 11.5,36.5 17,36 22.5,36 C 28,36 33.5,36.5 34,36 C 34,36 34.5,34.5 33,33.5 C 32.5,31 32.5,31.5 33.5,30 C 34.5,28 36,28 36,26 C 27.5,24.5 17.5,24.5 9,26 z"/><path d="M 11.5,30 C 15,29 30,29 33.5,30 M 12,33.5 C 18,32.5 27,32.5 33,33.5"/><circle cx="6" cy="12" r="2"/><circle cx="14" cy="9" r="2"/><circle cx="22.5" cy="8" r="2"/><circle cx="31" cy="9" r="2"/><circle cx="39" cy="12" r="2"/></g></svg>`,
  K: `<svg viewBox="0 0 45 45" class="piece-svg"><g fill="#ffffff" stroke="#1c1c1c" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M 22.5,11.63 L 22.5,6"/><path d="M 20,8 L 25,8"/><path d="M 22.5,25 C 22.5,25 27,17.5 25.5,14.5 C 24,11.5 21,11.5 22.5,25 z"/><path d="M 12.5,37 C 15.5,40 29.5,40 32.5,37 C 33,36 33.5,34 32.5,33 C 31,31.5 30,31.5 30,31.5 C 30,31.5 30.5,27.5 28.5,25 C 26.5,22.5 22.5,23.5 22.5,23.5 C 22.5,23.5 18.5,22.5 16.5,25 C 14.5,27.5 15,31.5 15,31.5 C 15,31.5 14,31.5 12.5,33 C 11.5,34 12,36 12.5,37 z"/><path d="M 12.5,30 C 15.5,27 29.5,27 32.5,30"/><path d="M 12,33.5 C 18,31.5 27,31.5 33,33.5"/></g></svg>`,

  // Black Pieces
  p: `<svg viewBox="0 0 45 45" class="piece-svg"><path d="m 22.5,9 c -2.21,0 -4,1.79 -4,4 0,0.89 0.29,1.71 0.78,2.38 C 17.33,16.5 16,18.59 16,21 c 0,2.03 0.94,3.84 2.41,5.03 C 15.41,27.09 11,31.58 11,39.5 l 23,0 c 0,-7.92 -4.41,-12.41 -7.41,-13.47 C 28.06,24.84 29,23.03 29,21 29,18.59 27.67,16.5 25.72,15.38 26.21,14.71 26.5,13.89 26.5,13 c 0,-2.21 -1.79,-4 -4,-4 z" fill="#202224" stroke="#ffffff" stroke-width="1.3" stroke-linecap="round"/></svg>`,
  r: `<svg viewBox="0 0 45 45" class="piece-svg"><g fill="#202224" stroke="#ffffff" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M 9,39 L 36,39 L 36,36 L 9,36 L 9,39 z"/><path d="M 12.5,32 L 12.5,36 L 32.5,36 L 32.5,32 L 12.5,32 z"/><path d="M 12,36 L 12,32 L 33,32 L 33,36 L 12,36 z"/><path d="M 14,29.5 L 14,16.5 L 31,16.5 L 31,29.5 L 14,29.5 z"/><path d="M 14,16.5 L 11,13.5 L 34,13.5 L 31,16.5 L 14,16.5 z"/><path d="M 11,13.5 L 11,9 L 15,9 L 15,11 L 20,11 L 20,9 L 25,9 L 25,11 L 30,11 L 30,9 L 34,9 L 34,13.5 L 11,13.5 z"/></g></svg>`,
  n: `<svg viewBox="0 0 45 45" class="piece-svg"><g fill="#202224" stroke="#ffffff" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M 22,10 C 32.5,11 38.5,18 38,39 L 15,39 C 15,30 25,32.5 23,18"/><path d="M 24,18 C 24.38,20.91 18.45,25.37 16,27 C 13,29 13.18,31.34 11,31 C 9.958,30.06 12.41,27.96 11,28 C 10,28 11.19,29.23 10,30 C 9,30 5.997,31 6,26 C 6,24 12,14 12,14 C 12,14 13.89,12.1 14,10.5 C 13.27,9.506 13.5,8.5 13.5,7.5 C 14.5,6.5 16.5,10 16.5,10 L 18.5,10 C 18.5,10 19.28,8.008 21,7 C 22,7 22,10 22,10 z"/><circle cx="14" cy="16" r="1" fill="#ffffff"/></g></svg>`,
  b: `<svg viewBox="0 0 45 45" class="piece-svg"><g fill="#202224" stroke="#ffffff" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M 9,36 C 12.39,35.03 19.11,36.43 22.5,34 C 25.89,36.43 32.61,35.03 36,36 C 36,36 37.65,36.54 39,38 C 38.32,38.97 37.35,38.99 36,38.5 C 32.61,37.53 25.89,38.96 22.5,37.5 C 19.11,38.96 12.39,37.53 9,38.5 C 7.646,38.99 6.677,38.97 6,38 C 7.354,36.54 9,36 9,36 z"/><path d="M 15,32 C 17.5,34.5 27.5,34.5 30,32 C 30.5,30.5 30,30 30,30 C 30,27.5 27.5,26 27.5,26 C 33,24.5 33.5,14.5 22.5,10.5 C 11.5,14.5 12,24.5 17.5,26 C 17.5,26 15,27.5 15,30 C 15,30 14.5,30.5 15,32 z"/><path d="M 25 8 A 2.5 2.5 0 1 1 20,8 A 2.5 2.5 0 1 1 25 8 z"/><path d="M 17.5,26 L 27.5,26 M 15,30 L 30,30 M 22.5,15.5 L 22.5,20.5 M 20,18 L 25,18" stroke="#ffffff"/></g></svg>`,
  q: `<svg viewBox="0 0 45 45" class="piece-svg"><g fill="#202224" stroke="#ffffff" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M 9,26 C 17.5,24.5 30,24.5 36,26 L 38.5,13.5 L 31,25 L 30.7,10.5 L 25.5,24.5 L 22.5,10 L 19.5,24.5 L 14.3,10.5 L 14,25 L 6.5,13.5 L 9,26 z"/><path d="M 9,26 C 9,28 10.5,28 11.5,30 C 12.5,31.5 12.5,31 12,33.5 C 10.5,34.5 11,36 11,36 C 11.5,36.5 17,36 22.5,36 C 28,36 33.5,36.5 34,36 C 34,36 34.5,34.5 33,33.5 C 32.5,31 32.5,31.5 33.5,30 C 34.5,28 36,28 36,26 C 27.5,24.5 17.5,24.5 9,26 z"/><circle cx="6" cy="12" r="2"/><circle cx="14" cy="9" r="2"/><circle cx="22.5" cy="8" r="2"/><circle cx="31" cy="9" r="2"/><circle cx="39" cy="12" r="2"/></g></svg>`,
  k: `<svg viewBox="0 0 45 45" class="piece-svg"><g fill="#202224" stroke="#ffffff" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M 22.5,11.63 L 22.5,6"/><path d="M 20,8 L 25,8"/><path d="M 22.5,25 C 22.5,25 27,17.5 25.5,14.5 C 24,11.5 21,11.5 22.5,25 z"/><path d="M 12.5,37 C 15.5,40 29.5,40 32.5,37 C 33,36 33.5,34 32.5,33 C 31,31.5 30,31.5 30,31.5 C 30,31.5 30.5,27.5 28.5,25 C 26.5,22.5 22.5,23.5 22.5,23.5 C 22.5,23.5 18.5,22.5 16.5,25 C 14.5,27.5 15,31.5 15,31.5 C 15,31.5 14,31.5 12.5,33 C 11.5,34 12,36 12.5,37 z"/><path d="M 12.5,30 C 15.5,27 29.5,27 32.5,30"/><path d="M 12,33.5 C 18,31.5 27,31.5 33,33.5"/></g></svg>`
};

const PIECE_VALUES = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
const FILES = 'abcdefgh';

// Classic Chess Openings Dictionary
const OPENINGS = [
  { moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5'], name: 'Ruy Lopez (Spanish Opening)' },
  { moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4'], name: 'Italian Game (Giuoco Piano)' },
  { moves: ['e4', 'e5', 'Nf3', 'Nc6', 'd4'], name: 'Scotch Game' },
  { moves: ['e4', 'e5', 'Nf3', 'Nf6'], name: 'Petrov Defense (Russian Game)' },
  { moves: ['e4', 'e5', 'f4'], name: "King's Gambit" },
  { moves: ['e4', 'e5', 'Nc3'], name: 'Vienna Game' },
  { moves: ['e4', 'c5', 'Nf3', 'd6'], name: 'Sicilian Defense (Classical)' },
  { moves: ['e4', 'c5', 'Nf3', 'e6'], name: 'Sicilian Defense (French Variation)' },
  { moves: ['e4', 'c5'], name: 'Sicilian Defense' },
  { moves: ['d4', 'd5', 'c4'], name: "Queen's Gambit" },
  { moves: ['d4', 'd5', 'Bf4'], name: 'London System' },
  { moves: ['e4', 'e6'], name: 'French Defense' },
  { moves: ['e4', 'c6'], name: 'Caro-Kann Defense' },
  { moves: ['d4', 'Nf6', 'c4', 'g6'], name: "King's Indian Defense" },
  { moves: ['d4', 'Nf6', 'c4', 'e6'], name: 'Nimzo-Indian Defense' },
  { moves: ['e4', 'd5'], name: 'Scandinavian Defense' },
  { moves: ['c4'], name: 'English Opening' },
  { moves: ['Nf3'], name: 'Réti Opening' },
  { moves: ['d4', 'f5'], name: 'Dutch Defense' },
  { moves: ['e4', 'e5'], name: "King's Pawn Game (Open Game)" },
  { moves: ['d4', 'd5'], name: "Queen's Pawn Game (Closed Game)" },
  { moves: ['e4'], name: "King's Pawn Opening" },
  { moves: ['d4'], name: "Queen's Pawn Opening" }
];

// Dual Digital Tournament Chess Clocks Manager
class ChessClock {
  constructor() {
    this.whiteSeconds = 600;
    this.blackSeconds = 600;
    this.increment = 0;
    this.enabled = true;
    this.timer = null;
    this.lastTick = 0;
  }

  setup(timeOption) {
    this.stop();
    if (timeOption === 'none') {
      this.enabled = false;
      const oppEl = $('opponentClock');
      const plyEl = $('playerClock');
      if (oppEl) oppEl.textContent = '∞';
      if (plyEl) plyEl.textContent = '∞';
      return;
    }
    this.enabled = true;
    if (timeOption === '3+2') {
      this.whiteSeconds = 180;
      this.blackSeconds = 180;
      this.increment = 2;
    } else {
      const mins = parseInt(timeOption, 10) || 10;
      this.whiteSeconds = mins * 60;
      this.blackSeconds = mins * 60;
      this.increment = 0;
    }
    this.render();
  }

  start(turn, onTimeout) {
    if (!this.enabled) return;
    this.stop();
    this.lastTick = performance.now();
    this.timer = setInterval(() => {
      const now = performance.now();
      const delta = (now - this.lastTick) / 1000;
      this.lastTick = now;

      if (turn === 'white') {
        this.whiteSeconds = Math.max(0, this.whiteSeconds - delta);
        if (this.whiteSeconds <= 0) {
          this.stop();
          if (onTimeout) onTimeout('white');
        }
      } else {
        this.blackSeconds = Math.max(0, this.blackSeconds - delta);
        if (this.blackSeconds <= 0) {
          this.stop();
          if (onTimeout) onTimeout('black');
        }
      }
      this.render();
    }, 100);
  }

  switchTurn(newTurn, onTimeout) {
    if (!this.enabled) return;
    if (newTurn === 'white' && this.increment) {
      this.blackSeconds += this.increment;
    } else if (newTurn === 'black' && this.increment) {
      this.whiteSeconds += this.increment;
    }
    this.start(newTurn, onTimeout);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  formatTime(s) {
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    if (mins < 1) {
      const tenths = Math.floor((s % 1) * 10);
      return `${secs}.${tenths}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  render() {
    if (!this.enabled) return;
    const oppIsWhite = (game && game.player_color === 'black');
    const oppSec = oppIsWhite ? this.whiteSeconds : this.blackSeconds;
    const plySec = oppIsWhite ? this.blackSeconds : this.whiteSeconds;

    const oppEl = $('opponentClock');
    const plyEl = $('playerClock');
    if (oppEl) {
      oppEl.textContent = this.formatTime(oppSec);
      oppEl.classList.toggle('urgent', oppSec <= 30 && oppSec > 0);
    }
    if (plyEl) {
      plyEl.textContent = this.formatTime(plySec);
      plyEl.classList.toggle('urgent', plySec <= 30 && plySec > 0);
    }
  }
}

let game = null;
let selectedSquare = null;
let selectedMoves = [];
let flipped = false;
let is3DMode = true;
let currentTheme = localStorage.getItem('knightfall-theme') || 'royal';
let toastTimer = null;
let installPrompt = null;
let chess3dInstance = null;
let isOffline = !navigator.onLine;
const chessClock = new ChessClock();

const $ = (id) => document.getElementById(id);

// Toast helper
function showToast(message) {
  const toast = $('toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2400);
}

// Check connectivity and server availability
async function checkServerOnline() {
  if (!navigator.onLine) return false;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const res = await fetch('/health', { signal: controller.signal });
    clearTimeout(timeoutId);
    return res.ok;
  } catch (_) {
    return false;
  }
}

// API client
async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.detail || `Request failed (${response.status})`);
  return data;
}

function setBusy(value) {
  document.body.classList.toggle('busy', value);
}

// Timeout handler when a clock reaches 0:00
function onTimeLoss(loserColor) {
  if (!game || game.done) return;
  const winner = loserColor === 'white' ? 'black' : 'white';
  game.done = true;
  game.result = winner;
  game.status = `Time out! ${winner[0].toUpperCase() + winner.slice(1)} wins on time.`;
  if (window.chessAudio) window.chessAudio.playGameEnd(winner === game.player_color);
  render();
}

// Start New Game
async function startGame({ playSound = true } = {}) {
  setBusy(true);
  const mode = document.querySelector('.segment-btn.active')?.dataset.mode || 'ai';
  const player_color = $('colorSelect').value;
  const level = $('levelSelect').value;
  const variant = $('variantSelect')?.value || 'classical';
  const timeOption = $('timeSelect')?.value || '10';

  try {
    if (!isOffline && navigator.onLine) {
      try {
        const payload = { mode, player_color, level, variant };
        game = await api('/api/new', { method: 'POST', body: JSON.stringify(payload) });
        isOffline = false;
      } catch (err) {
        console.warn('Backend server unavailable, switching to offline engine:', err);
        isOffline = true;
        game = window.offlineEngine.newGame(mode, player_color, level, variant);
        showToast('Playing in Offline Mode');
      }
    } else {
      isOffline = true;
      game = window.offlineEngine.newGame(mode, player_color, level, variant);
    }

    localStorage.setItem('knightfall-game-id', game.game_id);
    selectedSquare = null;
    selectedMoves = [];

    // Auto-flip board if human is playing Black
    flipped = (game.mode === 'ai' && game.player_color === 'black');

    // Initialize Tournament Clock
    chessClock.setup(timeOption);
    chessClock.start('white', onTimeLoss);

    render();
    if (playSound && window.chessAudio) window.chessAudio.playMove();

    if (game.mode === 'ai' && game.moves.length === 1) {
      showToast('The computer opens. Your move.');
    }
  } catch (err) {
    showToast(err.message);
  } finally {
    setBusy(false);
  }
}

// Move from the guided setup into the existing game surface.
function enterGameMode() {
  document.body.classList.add('game-active');
  const shell = document.querySelector('.app-shell');
  if (chess3dInstance) chess3dInstance.resize();
  if (shell && shell.requestFullscreen) shell.requestFullscreen().catch(() => {});
}

function leaveGameMode() {
  if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {});
  document.body.classList.remove('game-active');
  document.querySelector('.topbar-controls')?.classList.remove('customize-open');
  $('setupWizard').hidden = false;
  $('landingScreen').hidden = true;
}

function syncWizardToGameControls() {
  const mode = document.querySelector('.wizard-mode.active')?.dataset.wizardMode || 'ai';
  const modeButton = mode === 'ai' ? $('aiModeButton') : $('localModeButton');
  modeButton.click();
  $('variantSelect').value = $('wizardVariantSelect').value;
  $('timeSelect').value = $('wizardTimeSelect').value;
  $('colorSelect').value = $('wizardColorSelect').value;
  $('levelSelect').value = $('wizardLevelSelect').value;
}

// Load Existing or Start New
async function loadExistingGame() {
  const id = localStorage.getItem('knightfall-game-id');
  if (id) {
    try {
      if (!isOffline && navigator.onLine) {
        try {
          game = await api(`/api/state/${id}`);
          isOffline = false;
        } catch (_) {
          isOffline = true;
          game = window.offlineEngine.loadGame(id);
        }
      } else {
        isOffline = true;
        game = window.offlineEngine.loadGame(id);
      }
      flipped = (game.mode === 'ai' && game.player_color === 'black');
      const timeOption = $('timeSelect')?.value || '10';
      chessClock.setup(timeOption);
      if (!game.done) chessClock.start(game.turn, onTimeLoss);
      render();
      return;
    } catch (_) {
      localStorage.removeItem('knightfall-game-id');
    }
  }
  await startGame({ playSound: false });
}

// Square Click Handler (called from 3D raycast or 2D button click)
function onSquareClick(square) {
  if (!game || game.done) return;
  if (game.mode === 'ai' && game.turn !== game.player_color) {
    showToast('Computer is thinking. Please wait.');
    return;
  }

  const piece = game.pieces[square];

  // Deselect if clicking the same square
  if (selectedSquare === square) {
    selectedSquare = null;
    selectedMoves = [];
    render();
    return;
  }

  // If a piece is already selected, check if target square is a legal move
  if (selectedSquare) {
    const candidates = selectedMoves.filter(m => m.to === square);
    if (candidates.length) {
      if (candidates.some(m => m.promotion)) {
        showPromotionChoices(candidates);
      } else {
        sendMove(candidates[0].uci);
      }
      return;
    }
  }

  // Select own piece
  const isOwnPiece = piece && ((piece === piece.toUpperCase()) === (game.turn === 'white'));
  if (isOwnPiece) {
    selectedSquare = square;
    selectedMoves = game.legal_moves.filter(m => m.from === square);
  } else {
    selectedSquare = null;
    selectedMoves = [];
  }
  render();
}

// Promotion Choices Dialog
function showPromotionChoices(candidates) {
  const isWhite = game.turn === 'white';
  const kinds = ['q', 'r', 'b', 'n'];
  const modal = $('promotionModal');
  const choicesContainer = $('promotionChoices');

  choicesContainer.innerHTML = kinds.map(k => {
    const key = isWhite ? k.toUpperCase() : k;
    return `<button class="promotion-piece-btn" data-promo="${k}">${PIECE_SVGS[key]}</button>`;
  }).join('');

  choicesContainer.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      const move = candidates.find(m => m.promotion === btn.dataset.promo);
      if (move) sendMove(move.uci);
      modal.hidden = true;
    });
  });

  modal.hidden = false;
}

// Send move (with offline auto-fallback & friend auto-flip)
async function sendMove(uci) {
  setBusy(true);
  const prevPieceCount = Object.keys(game.pieces).length;
  selectedSquare = null;
  selectedMoves = [];
  $('promotionModal').hidden = true;

  try {
    let updatedGame;
    if (isOffline) {
      updatedGame = window.offlineEngine.makePlayerMove(uci);
    } else {
      try {
        updatedGame = await api(`/api/move/${game.game_id}`, {
          method: 'POST',
          body: JSON.stringify({ uci })
        });
      } catch (err) {
        console.warn('Backend unavailable, continuing in offline mode:', err);
        isOffline = true;
        window.offlineEngine.chess.load(game.fen);
        window.offlineEngine.mode = game.mode;
        window.offlineEngine.playerColor = game.player_color;
        window.offlineEngine.level = game.level;
        window.offlineEngine.variant = game.variant || 'classical';
        window.offlineEngine.historyMoves = [...game.moves];
        updatedGame = window.offlineEngine.makePlayerMove(uci);
        showToast('Switched to Offline Mode');
      }
    }

    const newPieceCount = Object.keys(updatedGame.pieces).length;
    const isCapture = newPieceCount < prevPieceCount;
    const isCheck = updatedGame.status && updatedGame.status.includes('Check');

    game = updatedGame;

    // Switch Tournament Clock
    if (game.done) {
      chessClock.stop();
    } else {
      chessClock.switchTurn(game.turn, onTimeLoss);
    }

    // Auto-Flip in Pass & Play (Friend Game) Mode
    if (game.mode === 'local' && !game.done) {
      const autoFlip = $('autoFlipCheck')?.checked ?? true;
      if (autoFlip) {
        if (game.turn === 'black') {
          flipped = true;
          if (chess3dInstance) chess3dInstance.setCameraPreset('opponent');
        } else {
          flipped = false;
          if (chess3dInstance) chess3dInstance.setCameraPreset('player');
        }
      }
    }

    // Trigger Audio
    if (window.chessAudio) {
      if (game.done) {
        window.chessAudio.playGameEnd(game.result === game.player_color);
      } else if (isCheck) {
        window.chessAudio.playCheck();
      } else if (isCapture) {
        window.chessAudio.playCapture();
      } else {
        window.chessAudio.playMove();
      }
    }

    render();
  } catch (err) {
    showToast(err.message);
    render();
  } finally {
    setBusy(false);
  }
}

// Undo move
async function undoMove() {
  if (!game || !game.moves.length) return;
  setBusy(true);
  try {
    if (isOffline) {
      game = window.offlineEngine.undo();
    } else {
      try {
        game = await api(`/api/undo/${game.game_id}`, { method: 'POST' });
      } catch (_) {
        isOffline = true;
        game = window.offlineEngine.undo();
      }
    }
    selectedSquare = null;
    selectedMoves = [];
    if (!game.done) chessClock.start(game.turn, onTimeLoss);
    if (window.chessAudio) window.chessAudio.playMove();
    render();
  } catch (err) {
    showToast(err.message);
  } finally {
    setBusy(false);
  }
}

// Resign game
async function resignGame() {
  if (!game || game.done) return;
  if (!confirm('Are you sure you want to resign this match?')) return;
  setBusy(true);
  try {
    chessClock.stop();
    if (isOffline) {
      game = window.offlineEngine.resign();
    } else {
      try {
        game = await api(`/api/resign/${game.game_id}`, { method: 'POST' });
      } catch (_) {
        isOffline = true;
        game = window.offlineEngine.resign();
      }
    }
    if (window.chessAudio) window.chessAudio.playGameEnd(false);
    render();
  } catch (err) {
    showToast(err.message);
  } finally {
    setBusy(false);
  }
}

// Copy PGN
async function copyPGN() {
  if (!game) return;
  try {
    await navigator.clipboard.writeText(game.pgn || '');
    showToast('PGN game notation copied to clipboard!');
  } catch (_) {
    showToast('Clipboard access was blocked by browser.');
  }
}

// Copy FEN
async function copyFEN() {
  if (!game) return;
  try {
    await navigator.clipboard.writeText(game.fen || '');
    showToast('FEN position string copied to clipboard!');
  } catch (_) {
    showToast('Clipboard access was blocked by browser.');
  }
}

// Level display names
const LEVEL_NAMES = {
  club:         '⚔️ Club Player · 1500',
  master:       '🏆 Master · 2200',
  yogesh:       '🔥 Yogesh · 2700',
  master_yogesh:'👑 Master Yogesh · 3000+'
};

// Game Analysis — runs when game ends
function showGameAnalysis() {
  if (!game || !game.done || !game.moves) return;

  const analysisCard = $('analysisCard');
  if (!analysisCard) return;
  analysisCard.style.display = 'block';

  const moves = game.moves;
  const totalMoves = moves.length;

  // Count captures: a capture move in SAN contains 'x'
  const captures = moves.filter(m => m.san && m.san.includes('x')).length;

  // Count checks: SAN contains '+' or '#'
  const checks = moves.filter(m => m.san && (m.san.includes('+') || m.san.includes('#'))).length;

  // Material score from last position
  const matValues = { p:1, n:3, b:3, r:5, q:9 };
  let whiteMat = 0, blackMat = 0;
  for (const [, p] of Object.entries(game.pieces || {})) {
    const val = matValues[p.toLowerCase()] || 0;
    if (p === p.toUpperCase()) whiteMat += val; else blackMat += val;
  }
  const totalMat = whiteMat + blackMat || 1;
  const whitePct = Math.round((whiteMat / totalMat) * 100);

  // Accuracy estimate based on result vs level
  const levelAccuracy = { club: 72, master: 82, yogesh: 90, master_yogesh: 96 };
  const baseAcc = levelAccuracy[game.level] || 75;
  const accuracy = game.result === game.player_color
    ? Math.min(99, baseAcc + Math.floor(Math.random() * 6))
    : Math.max(50, baseAcc - 8 + Math.floor(Math.random() * 8));

  $('analysisTotalMoves').textContent = totalMoves;
  $('analysisCaptures').textContent = captures;
  $('analysisChecks').textContent = checks;
  $('analysisAccuracy').textContent = `${accuracy}%`;

  // Result bar
  const fill = $('analysisResultFill');
  const label = $('analysisResultLabel');
  if (fill && label) {
    fill.style.width = `${whitePct}%`;
    if (game.result === 'draw') {
      label.textContent = 'Draw — Balanced Game';
    } else if (game.result === 'white') {
      label.textContent = whitePct > 60 ? 'White Dominant' : 'White Wins';
    } else {
      label.textContent = whitePct < 40 ? 'Black Dominant' : 'Black Wins';
    }
  }

  // Move-by-move review list
  const listEl = $('analysisMovesList');
  if (!listEl) return;
  const rows = [];
  for (let i = 0; i < moves.length; i += 2) {
    const wMove = moves[i];
    const bMove = moves[i + 1];

    const renderTag = (m) => {
      if (!m) return '';
      if (m.san.includes('#')) return '<span class="analysis-move-tag tag-checkmate">MATE</span>';
      if (m.san.includes('+')) return '<span class="analysis-move-tag tag-check">CHECK</span>';
      if (m.san.includes('x')) return '<span class="analysis-move-tag tag-capture">✕</span>';
      return '';
    };

    rows.push(`
      <div class="analysis-move-row">
        <span class="analysis-move-num">${wMove.number}.</span>
        <span class="analysis-move-san analysis-move-white">${wMove.san}</span>
        ${renderTag(wMove)}
        <span class="analysis-move-san analysis-move-black">${bMove ? bMove.san : '···'}</span>
        ${renderTag(bMove)}
      </div>`);
  }
  listEl.innerHTML = rows.join('');
  listEl.scrollTop = listEl.scrollHeight;
}

// Live Evaluation Bar update
function updateEvaluation() {
  if (!game || !game.pieces) return;
  let score = 0;
  for (const [sq, p] of Object.entries(game.pieces)) {
    const isW = p === p.toUpperCase();
    const val = PIECE_VALUES[p.toLowerCase()] || 0;
    score += isW ? val : -val;
  }
  const scoreInPawns = (score / 1).toFixed(1);
  const evalScoreEl = $('evalBarScore');
  const evalFillEl = $('evalBarFill');
  if (evalScoreEl && evalFillEl) {
    evalScoreEl.textContent = (score > 0 ? '+' : '') + scoreInPawns;
    const height = Math.max(5, Math.min(95, 50 + (score / 10) * 45));
    evalFillEl.style.height = `${height}%`;
  }
}

// Opening Explorer update
function updateOpening() {
  const openingEl = $('openingName');
  if (!openingEl) return;
  if (!game || !game.moves || !game.moves.length) {
    if (game && game.variant === 'chess960') {
      openingEl.textContent = 'Fischer Random (Chess960)';
    } else if (game && game.variant === 'knights') {
      openingEl.textContent = 'Royal Knights Duel';
    } else if (game && game.variant === 'king_hill') {
      openingEl.textContent = 'King of the Hill (Royal Quest)';
    } else {
      openingEl.textContent = 'Classical Royal Chess';
    }
    return;
  }
  const moveSans = game.moves.map(m => m.san);
  for (const op of OPENINGS) {
    if (op.moves.every((m, idx) => moveSans[idx] === m)) {
      openingEl.textContent = op.name;
      return;
    }
  }
  openingEl.textContent = game.moves.length > 6 ? 'Custom Tactical Battle' : 'Classical Development';
}

// Calculate captured pieces and material differences
function computeCapturedPieces() {
  if (!game || !game.pieces) return { whiteCaptured: [], blackCaptured: [], whiteDiff: 0 };

  const startingCount = {
    P: 8, N: 2, B: 2, R: 2, Q: 1,
    p: 8, n: 2, b: 2, r: 2, q: 1
  };

  const currentCount = {
    P: 0, N: 0, B: 0, R: 0, Q: 0,
    p: 0, n: 0, b: 0, r: 0, q: 0
  };

  for (const piece of Object.values(game.pieces)) {
    if (currentCount[piece] !== undefined) {
      currentCount[piece]++;
    }
  }

  const whiteLost = [];
  const blackLost = [];
  let whiteMaterial = 0;
  let blackMaterial = 0;

  ['P', 'N', 'B', 'R', 'Q'].forEach(k => {
    const lost = startingCount[k] - (currentCount[k] || 0);
    for (let i = 0; i < lost; i++) whiteLost.push(k);
    whiteMaterial += (currentCount[k] || 0) * PIECE_VALUES[k.toLowerCase()];
  });

  ['p', 'n', 'b', 'r', 'q'].forEach(k => {
    const lost = startingCount[k] - (currentCount[k] || 0);
    for (let i = 0; i < lost; i++) blackLost.push(k);
    blackMaterial += (currentCount[k] || 0) * PIECE_VALUES[k];
  });

  return {
    whiteLost,
    blackLost,
    whiteDiff: whiteMaterial - blackMaterial
  };
}

// Render Captured Pieces Trays
function renderCaptures() {
  const { whiteLost, blackLost, whiteDiff } = computeCapturedPieces();
  const isPlayerWhite = game.player_color === 'white';

  const playerCaptured = isPlayerWhite ? blackLost : whiteLost;
  const opponentCaptured = isPlayerWhite ? whiteLost : blackLost;
  const playerAdv = isPlayerWhite ? whiteDiff : -whiteDiff;

  const renderList = (list) => {
    return list.map(p => `<span class="captured-item">${PIECE_SVGS[p]}</span>`).join('');
  };

  $('playerCaptures').innerHTML = renderList(playerCaptured);
  $('opponentCaptures').innerHTML = renderList(opponentCaptured);

  const playerAdvEl = $('playerAdvantage');
  const oppAdvEl = $('opponentAdvantage');

  if (playerAdv > 0) {
    playerAdvEl.textContent = `+${playerAdv}`;
    playerAdvEl.hidden = false;
    oppAdvEl.hidden = true;
  } else if (playerAdv < 0) {
    oppAdvEl.textContent = `+${Math.abs(playerAdv)}`;
    oppAdvEl.hidden = false;
    playerAdvEl.hidden = true;
  } else {
    playerAdvEl.hidden = true;
    oppAdvEl.hidden = true;
  }
}

// Render 2D Chessboard
function render2DBoard() {
  const boardEl = $('board2d');
  if (!boardEl || !game) return;

  const squares = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const displayRow = flipped ? 7 - r : r;
      const displayCol = flipped ? 7 - c : c;
      const rank = 8 - displayRow;
      const file = FILES[displayCol];
      const square = `${file}${rank}`;

      const piece = game.pieces[square] || '';
      const isLight = (displayRow + displayCol) % 2 === 0;
      const isSelected = selectedSquare === square;
      const isLastMove = game.last_move && (game.last_move.slice(0, 2) === square || game.last_move.slice(2, 4) === square);
      const isCheck = game.check_square === square;

      const classes = ['square-2d', isLight ? 'light' : 'dark'];
      if (isSelected) classes.push('selected');
      if (isLastMove) classes.push('last-move');
      if (isCheck) classes.push('check-square');

      const rankCoord = displayCol === (flipped ? 7 : 0) ? `<span class="coord-2d coord-rank">${rank}</span>` : '';
      const fileCoord = displayRow === (flipped ? 0 : 7) ? `<span class="coord-2d coord-file">${file}</span>` : '';

      const legal = selectedMoves.filter(m => m.to === square);
      let dot = '';
      if (legal.length) {
        dot = game.pieces[square] ? '<span class="capture-ring-2d"></span>' : '<span class="legal-dot-2d"></span>';
      }

      const pieceSvg = piece ? PIECE_SVGS[piece] || '' : '';
      squares.push(`<button class="${classes.join(' ')}" data-sq="${square}" role="gridcell" aria-label="${square}">${rankCoord}${fileCoord}${pieceSvg}${dot}</button>`);
    }
  }

  boardEl.innerHTML = squares.join('');
  boardEl.querySelectorAll('.square-2d').forEach(el => {
    el.addEventListener('click', () => onSquareClick(el.dataset.sq));
  });
}

// Render Moves Table
function renderMoves() {
  const moves = game.moves || [];
  $('moveCounter').textContent = `${String(moves.length).padStart(2, '0')} PLY`;
  $('recordStatus').textContent = moves.length
    ? `${Math.ceil(moves.length / 2)} move${moves.length >= 4 ? 's' : ''} recorded`
    : 'Waiting for opening move';

  const moveListEl = $('moveList');
  if (!moves.length) {
    moveListEl.innerHTML = `
      <div class="empty-moves-placeholder">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path></svg>
        <strong>Game ready</strong>
        <small>Moves will be recorded in algebraic notation</small>
      </div>`;
    return;
  }

  const rows = [];
  for (let i = 0; i < moves.length; i += 2) {
    const white = moves[i];
    const black = moves[i + 1];
    const lastIndex = moves.length - 1;
    rows.push(`
      <div class="move-entry-row">
        <span class="move-num">${white.number}.</span>
        <span class="move-san ${i === lastIndex ? 'latest' : ''}">${white.san}</span>
        <span class="move-san ${i + 1 === lastIndex ? 'latest' : black ? '' : 'text-dim'}">${black ? black.san : '···'}</span>
      </div>`);
  }
  moveListEl.innerHTML = rows.join('');
  moveListEl.scrollTop = moveListEl.scrollHeight;
}

// Master Render Function
function render() {
  if (!game) return;

  // 1. Update 3D Board
  if (chess3dInstance) {
    chess3dInstance.update(game, selectedSquare, selectedMoves, flipped);
  }

  // 2. Update 2D Board
  render2DBoard();

  // 3. Update Moves Table
  renderMoves();

  // 4. Update Captured Pieces & Advantage
  renderCaptures();

  // 5. Update Evaluation Bar & Opening
  updateEvaluation();
  updateOpening();

  // 6. Update Clocks
  chessClock.render();

  // 7. Update Status Bars and Player Cards
  const isAI = game.mode === 'ai';
  const isHumanTurn = !isAI || game.turn === game.player_color;
  const isComputerThinking = isAI && !isHumanTurn && !game.done;

  const indicator = $('statusIndicator');
  indicator.classList.toggle('black-turn', game.turn === 'black');

  const turnLabel = $('turnLabel');
  if (game.done) {
    turnLabel.textContent = 'Game Complete';
  } else if (isComputerThinking) {
    turnLabel.innerHTML = `Computer thinking <span class="thinking-wave"><span></span><span></span><span></span></span>`;
  } else {
    turnLabel.textContent = `${game.turn[0].toUpperCase() + game.turn.slice(1)} to move`;
  }

  $('checkLabel').hidden = !game.status.includes('Check') || game.done;

  const isPlayerWhite = game.player_color === 'white';
  const playerCard = $('playerCard');
  const opponentCard = $('opponentCard');

  const playerIsActive = (isPlayerWhite && game.turn === 'white') || (!isPlayerWhite && game.turn === 'black');
  playerCard.classList.toggle('active-turn', playerIsActive && !game.done);
  opponentCard.classList.toggle('active-turn', !playerIsActive && !game.done);

  $('playerName').textContent = game.mode === 'local' ? (game.turn === 'white' ? 'White · Player 1' : 'White') : 'You';
  $('playerSub').textContent = `Playing as ${isPlayerWhite ? 'White' : 'Black'}`;
  $('opponentName').textContent = isAI ? 'Knightfall Engine' : (game.mode === 'local' ? (game.turn === 'black' ? 'Black · Player 2' : 'Black') : 'Player 2');
  $('opponentSub').textContent = isAI
    ? `${LEVEL_NAMES[game.level] || game.level} · ${game.engine_is_stockfish ? 'Stockfish' : 'Python AI'}`
    : 'Friend Pass & Play';

  $('opponentTurnPill').textContent = isComputerThinking ? 'THINKING' : (game.mode === 'local' && game.turn === 'black' ? 'ACTIVE' : 'OPPONENT');
  $('playerTurnPill').textContent = (game.mode === 'local' && game.turn === 'white') ? 'ACTIVE' : 'YOUR TURN';

  // Offline badge & engine status
  $('offlineStatusBadge').hidden = !isOffline;
  if (isOffline) {
    $('engineStatusBadge').textContent = 'Offline AI Engine';
  } else {
    $('engineStatusBadge').textContent = game.engine_is_stockfish ? 'Stockfish Engine' : 'Python Chess Fallback';
  }

  $('undoButton').disabled = !game.moves.length;
  $('resignButton').disabled = game.done;

  const overlay = $('boardOverlay');
  overlay.hidden = !game.done;
  if (game.done) {
    $('overlayTitle').textContent = game.result === 'draw'
      ? 'Game Drawn'
      : (game.result === game.player_color ? '🏆 Victory!' : 'Game Over');
    $('overlayText').textContent = game.status;
    showGameAnalysis();
  } else {
    const ac = $('analysisCard');
    if (ac) ac.style.display = 'none';
  }
}

// Mode Toggle (3D vs 2D)
function setViewMode(mode3D) {
  is3DMode = mode3D;
  $('btnView3D').classList.toggle('active', is3DMode);
  $('btnView2D').classList.toggle('active', !is3DMode);

  $('board3d').style.display = is3DMode ? 'block' : 'none';
  $('cameraToolbar').style.display = is3DMode ? 'flex' : 'none';
  $('board2dWrap').hidden = is3DMode;

  if (is3DMode && chess3dInstance) {
    chess3dInstance.resize();
  }
  render();
}

// Theme Change Handler
function onThemeChange(theme) {
  currentTheme = theme;
  localStorage.setItem('knightfall-theme', theme);
  if (chess3dInstance) {
    chess3dInstance.setTheme(theme);
  }
  const themes2D = {
    royal: { light: '#f5eedc', dark: '#5a2d1d' },
    emerald: { light: '#eeebd0', dark: '#41684c' },
    wood: { light: '#ded2b9', dark: '#8a5233' },
    midnight: { light: '#dce9f5', dark: '#1f2937' },
    marble: { light: '#f3f4f6', dark: '#374151' }
  };
  const t = themes2D[theme] || themes2D.royal;
  document.querySelectorAll('.square-2d.light').forEach(el => el.style.background = t.light);
  document.querySelectorAll('.square-2d.dark').forEach(el => el.style.background = t.dark);
}

// Initialize Application
window.addEventListener('DOMContentLoaded', async () => {
  // Initialize 3D Engine
  const container3d = $('board3d');
  chess3dInstance = new window.Chess3D();
  chess3dInstance.init(container3d, onSquareClick);
  chess3dInstance.setTheme(currentTheme);

  // Set initial theme in select
  $('themeSelect').value = currentTheme;
  $('themeSelect').addEventListener('change', (e) => onThemeChange(e.target.value));

  // View Mode Buttons
  $('btnView3D').addEventListener('click', () => setViewMode(true));
  $('btnView2D').addEventListener('click', () => setViewMode(false));

  // Camera Presets
  document.querySelectorAll('.cam-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.cam-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (chess3dInstance) chess3dInstance.setCameraPreset(btn.dataset.cam);
    });
  });

  // Sound Toggle Button
  const soundBtn = $('soundToggleBtn');
  const soundIcon = $('soundIcon');
  soundBtn.addEventListener('click', () => {
    if (window.chessAudio) {
      const enabled = window.chessAudio.toggleSound();
      soundIcon.textContent = enabled ? '🔊' : '🔇';
      soundBtn.classList.toggle('active', enabled);
      showToast(enabled ? 'Sound enabled' : 'Sound muted');
    }
  });
  if (window.chessAudio && !window.chessAudio.enabled) {
    soundIcon.textContent = '🔇';
    soundBtn.classList.remove('active');
  }

  // Action Buttons
  $('undoButton').addEventListener('click', undoMove);
  $('flipButton').addEventListener('click', () => {
    flipped = !flipped;
    render();
    if (chess3dInstance) chess3dInstance.setCameraPreset(flipped ? 'opponent' : 'player');
  });
  $('resignButton').addEventListener('click', resignGame);
  $('copyPgnButton').addEventListener('click', copyPGN);
  $('copyFenButton').addEventListener('click', copyFEN);
  $('startGameButton').addEventListener('click', startGame);
  $('overlayNewGame').addEventListener('click', startGame);
  $('cancelPromotion').addEventListener('click', () => {
    $('promotionModal').hidden = true;
  });
  const analysisNewBtn = $('analysisNewGameBtn');
  if (analysisNewBtn) analysisNewBtn.addEventListener('click', startGame);

  // Mode segmented control (Vs Computer vs Pass & Play)
  $('aiModeButton').addEventListener('click', () => {
    $('aiModeButton').classList.add('active');
    $('localModeButton').classList.remove('active');
    $('autoFlipRow').style.display = 'none';
    $('colorField').style.opacity = '1';
    $('colorSelect').disabled = false;
    $('levelField').style.opacity = '1';
    $('levelSelect').disabled = false;
  });

  $('localModeButton').addEventListener('click', () => {
    $('localModeButton').classList.add('active');
    $('aiModeButton').classList.remove('active');
    $('autoFlipRow').style.display = 'block'; // Show auto-flip toggle for Pass & Play!
    $('colorField').style.opacity = '0.45';
    $('colorSelect').disabled = true;
    $('levelField').style.opacity = '0.45';
    $('levelSelect').disabled = true;
  });

  // PWA Install Prompt — stash the event for the custom Install button.
  // Chrome logs "Banner not shown" when preventDefault() is used; that is
  // expected until the user clicks Install (which calls prompt()).
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true;
  window.addEventListener('beforeinstallprompt', (e) => {
    if (isStandalone) return;
    e.preventDefault();
    installPrompt = e;
    const btn = $('installButton');
    if (btn) btn.hidden = false;
  });
  $('installButton').addEventListener('click', async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    installPrompt = null;
    $('installButton').hidden = true;
  });

  // Guided landing -> setup -> game flow.
  $('beginMatchButton').addEventListener('click', () => {
    $('landingScreen').hidden = true;
    $('setupWizard').hidden = false;
  });
  $('wizardBackButton').addEventListener('click', () => {
    $('setupWizard').hidden = true;
    $('landingScreen').hidden = false;
  });
  document.querySelectorAll('.wizard-mode').forEach(button => {
    button.addEventListener('click', () => {
      document.querySelectorAll('.wizard-mode').forEach(item => item.classList.remove('active'));
      button.classList.add('active');
      const local = button.dataset.wizardMode === 'local';
      $('wizardColorField').classList.toggle('is-disabled', local);
      $('wizardLevelField').classList.toggle('is-disabled', local);
      $('wizardColorSelect').disabled = local;
      $('wizardLevelSelect').disabled = local;
    });
  });
  $('launchMatchButton').addEventListener('click', async () => {
    syncWizardToGameControls();
    await startGame({ playSound: true });
    enterGameMode();
    $('setupWizard').hidden = true;
  });
  $('customizeToggle').addEventListener('click', () => {
    document.querySelector('.topbar-controls')?.classList.toggle('customize-open');
  });
  window.addEventListener('appinstalled', () => {
    installPrompt = null;
    const btn = $('installButton');
    if (btn) btn.hidden = true;
  });

  // Online / Offline state transitions
  window.addEventListener('offline', () => {
    isOffline = true;
    showToast('Offline mode activated');
    render();
  });

  window.addEventListener('online', async () => {
    const serverUp = await checkServerOnline();
    if (serverUp) {
      isOffline = false;
      showToast('Connected to Knightfall Server');
    } else {
      isOffline = true;
    }
    render();
  });

  // Service Worker Registration
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }

  // The first screen is intentionally the landing page. Existing saved games remain
  // available through the normal setup flow so opening the app is always predictable.
});
