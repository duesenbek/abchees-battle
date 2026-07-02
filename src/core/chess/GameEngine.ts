import { create } from 'zustand';
import type { Puzzle, ZoneState, GameSettings, HintData, BoardState } from './types';
import { PuzzleEngine } from './PuzzleEngine';

// ─── Default puzzles ──────────────────────────────────────────────────────────
import defaultPuzzlesRaw from '../../data/puzzles/mate1.json';
import type { PuzzleFile } from './types';

const defaultPuzzles: Puzzle[] = (defaultPuzzlesRaw as unknown as PuzzleFile).puzzles as Puzzle[];

const DEFAULT_DURATION = 180;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateZoneIds(count: number): string[] {
  return Array.from({ length: count }, (_, i) => `zone-${String.fromCharCode(97 + i)}`);
}

function makeEmptyBoardState(): BoardState {
  return {
    fen: 'start',
    legalMoves: {},
    lastMove: null,
    checkSquare: null,
    isInCheck: false,
    isCheckmate: false,
  };
}

function makeInitialZoneState(playerName: string, avatar: string | undefined, puzzle: Puzzle): ZoneState {
  const engine = new PuzzleEngine(puzzle);
  return {
    playerName,
    avatar,
    puzzleIndex: 0,
    score: 0,
    errors: 0,
    attempts: 0,
    hintsUsed: 0,
    timeSpent: 0,
    isFinished: false,
    boardState: engine.getBoardState(),
    hint: null,
    lastMoveResult: null,
  };
}

// ─── Store Types ──────────────────────────────────────────────────────────────

interface GameEngineStore {
  // ── Core state ─────────────────────────────────────────────────────────────
  status: 'setup' | 'active' | 'completed';
  puzzles: Puzzle[];
  zones: Record<string, ZoneState>;
  winnerId: string | null;
  timeLeft: number;
  customPuzzles: Puzzle[] | null;
  settings: GameSettings;

  // PuzzleEngines are kept outside Zustand state (not serializable)
  // Accessed via the module-level map below

  // ── Actions ────────────────────────────────────────────────────────────────
  initGame: (playerNames: string[], avatars?: string[]) => void;
  startGame: () => void;
  resetGame: () => void;
  exitToMenu: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  toggleMenu: () => void;
  closeMenu: () => void;
  tick: () => void;
  finishGame: (winnerId: string | null) => void;

  // ── Chess actions ──────────────────────────────────────────────────────────
  makeMove: (zoneId: string, from: string, to: string, promotion?: string) => 'correct' | 'incorrect' | 'completed';
  requestHint: (zoneId: string) => HintData | null;

  // ── Settings ───────────────────────────────────────────────────────────────
  setCustomPuzzles: (puzzles: Puzzle[] | null) => void;
  setSettings: (partial: Partial<GameSettings>) => void;
  // Compatibility shims used by AdminPanel / existing components
  setDefaultTimeLimit: (s: number) => void;
  setBoardTheme: (theme: 'zone' | 'classic' | 'emerald') => void;
  setShowMoveHints: (v: boolean) => void;
  setShowSolutionHints: (v: boolean) => void;
  setMaxSolutionHintsPerPuzzle: (n: number) => void;
  setMaxAttemptsPerPuzzle: (n: number) => void;
  toggleMute: () => void;

  // ── Compatibility read-only shims ──────────────────────────────────────────
  // (so existing components like Leaderboard, PodiumScreen keep working)
  readonly isMuted: boolean;
  readonly isPaused: boolean;
  readonly isMenuOpen: boolean;
  readonly boardTheme: 'zone' | 'classic' | 'emerald';
  readonly showMoveHints: boolean;
  readonly showSolutionHints: boolean;
  readonly maxSolutionHintsPerPuzzle: number;
  readonly maxAttemptsPerPuzzle: number;
  readonly defaultTimeLimit: number;
  // Shim for old components still using players / chessInstances
  readonly players: Record<string, {
    id: string;
    playerName: string;
    avatar?: string;
    currentPuzzleIndex: number;
    score: number;
    isFinished: boolean;
    timeSpent: number;
    errors: number;
    currentFen: string;
    attemptsOnPuzzle: number;
    hintsUsed: number;
  }>;
  readonly chessInstances: Record<string, { getLegalMoves: (sq: string) => { to: string }[]; isCheckmate: () => boolean; inCheck: () => boolean; history: () => string[] }>;

  // Needed by GameZone for solution hint compatibility
  useSolutionHint: (zoneId: string) => { from: string; to: string } | null;
  setPlayerName: (zoneId: string, name: string) => void;
  setDuration: (seconds: number) => void;
  checkWinner: () => void;
}

// ─── PuzzleEngine instances (not in Zustand — mutable, not serializable) ──────

const puzzleEngines: Record<string, PuzzleEngine> = {};

// ─── Store ────────────────────────────────────────────────────────────────────

export const useGameStore = create<GameEngineStore>((set, get) => ({
  status: 'setup',
  puzzles: defaultPuzzles,
  zones: {},
  winnerId: null,
  timeLeft: DEFAULT_DURATION,
  customPuzzles: null,
  settings: {
    isMuted: false,
    showMoveHints: true,
    showSolutionHints: true,
    maxSolutionHintsPerPuzzle: 1,
    maxAttemptsPerPuzzle: 0,
    boardTheme: 'zone',
    defaultTimeLimit: DEFAULT_DURATION,
    isMenuOpen: false,
  },

  // ── Compatibility shims (derived from settings) ───────────────────────────
  get isMuted() { return get().settings.isMuted; },
  get isPaused() { return get().settings.isMenuOpen; },
  get isMenuOpen() { return get().settings.isMenuOpen; },
  get boardTheme() { return get().settings.boardTheme; },
  get showMoveHints() { return get().settings.showMoveHints; },
  get showSolutionHints() { return get().settings.showSolutionHints; },
  get maxSolutionHintsPerPuzzle() { return get().settings.maxSolutionHintsPerPuzzle; },
  get maxAttemptsPerPuzzle() { return get().settings.maxAttemptsPerPuzzle; },
  get defaultTimeLimit() { return get().settings.defaultTimeLimit; },

  // ── players shim (for Leaderboard, PodiumScreen, HUD) ─────────────────────
  get players() {
    const { zones } = get();
    const result: GameEngineStore['players'] = {};
    for (const [id, zone] of Object.entries(zones)) {
      result[id] = {
        id,
        playerName: zone.playerName,
        avatar: zone.avatar,
        currentPuzzleIndex: zone.puzzleIndex,
        score: zone.score,
        isFinished: zone.isFinished,
        timeSpent: zone.timeSpent,
        errors: zone.errors,
        currentFen: zone.boardState.fen,
        attemptsOnPuzzle: zone.attempts,
        hintsUsed: zone.hintsUsed,
      };
    }
    return result;
  },

  // ── chessInstances shim (for GameZone move hints) ─────────────────────────
  get chessInstances() {
    const engines = puzzleEngines;
    const result: GameEngineStore['chessInstances'] = {};
    for (const [id, engine] of Object.entries(engines)) {
      result[id] = {
        getLegalMoves: (sq: string) => {
          const zone = get().zones[id];
          const lm = zone?.boardState.legalMoves[sq] ?? [];
          return lm.map((to) => ({ to }));
        },
        isCheckmate: () => get().zones[id]?.boardState.isCheckmate ?? false,
        inCheck: () => get().zones[id]?.boardState.isInCheck ?? false,
        history: () => {
          return engine ? [] : []; // history not needed externally
        },
      };
    }
    return result;
  },

  // ── initGame ──────────────────────────────────────────────────────────────
  initGame: (playerNames: string[], avatars?: string[]) => {
    const { customPuzzles, settings } = get();
    const activePuzzles = customPuzzles || defaultPuzzles;
    const count = Math.min(playerNames.length, 4);
    const zoneIds = generateZoneIds(count);

    const zones: Record<string, ZoneState> = {};
    const firstPuzzle = activePuzzles[0];

    for (let i = 0; i < zoneIds.length; i++) {
      const id = zoneIds[i];
      const name = playerNames[i] || `Игрок ${String.fromCharCode(65 + i)}`;
      const avatar = avatars?.[i];

      if (firstPuzzle) {
        puzzleEngines[id] = new PuzzleEngine(firstPuzzle);
        zones[id] = makeInitialZoneState(name, avatar, firstPuzzle);
      } else {
        zones[id] = {
          playerName: name,
          avatar,
          puzzleIndex: 0,
          score: 0,
          errors: 0,
          attempts: 0,
          hintsUsed: 0,
          timeSpent: 0,
          isFinished: false,
          boardState: makeEmptyBoardState(),
          hint: null,
          lastMoveResult: null,
        };
      }
    }

    set({
      puzzles: activePuzzles,
      zones,
      status: 'setup',
      winnerId: null,
      timeLeft: settings.defaultTimeLimit,
    });
  },

  // ── startGame ─────────────────────────────────────────────────────────────
  startGame: () => {
    const { puzzles, zones, settings } = get();
    const updatedZones = { ...zones };

    for (const id of Object.keys(zones)) {
      const zone = zones[id];
      const puzzle = puzzles[zone.puzzleIndex];
      if (puzzle) {
        puzzleEngines[id] = new PuzzleEngine(puzzle);
        updatedZones[id] = {
          ...zone,
          boardState: puzzleEngines[id].getBoardState(),
          hint: null,
          lastMoveResult: null,
        };
      }
    }

    set({
      status: 'active',
      zones: updatedZones,
      timeLeft: settings.defaultTimeLimit,
    });
  },

  // ── resetGame ─────────────────────────────────────────────────────────────
  resetGame: () => {
    const { customPuzzles, settings, zones } = get();
    const activePuzzles = customPuzzles || defaultPuzzles;
    const firstPuzzle = activePuzzles[0];
    const newZones: Record<string, ZoneState> = {};

    for (const [id, zone] of Object.entries(zones)) {
      if (firstPuzzle) {
        puzzleEngines[id] = new PuzzleEngine(firstPuzzle);
        newZones[id] = {
          ...makeInitialZoneState(zone.playerName, zone.avatar, firstPuzzle),
        };
      } else {
        newZones[id] = {
          ...zone,
          puzzleIndex: 0,
          score: 0,
          errors: 0,
          attempts: 0,
          hintsUsed: 0,
          timeSpent: 0,
          isFinished: false,
          boardState: makeEmptyBoardState(),
          hint: null,
          lastMoveResult: null,
        };
      }
    }

    set({
      puzzles: activePuzzles,
      zones: newZones,
      status: 'setup',
      winnerId: null,
      timeLeft: settings.defaultTimeLimit,
    });
  },

  // ── exitToMenu ────────────────────────────────────────────────────────────
  exitToMenu: () => {
    get().resetGame();
    set({ status: 'setup' });
  },

  // ── pauseGame / resumeGame ─────────────────────────────────────────────────
  pauseGame: () => set((s) => ({ settings: { ...s.settings, isMenuOpen: true } })),
  resumeGame: () => set((s) => ({ settings: { ...s.settings, isMenuOpen: false } })),
  toggleMenu: () =>
    set((s) => ({ settings: { ...s.settings, isMenuOpen: !s.settings.isMenuOpen } })),
  closeMenu: () => set((s) => ({ settings: { ...s.settings, isMenuOpen: false } })),

  // ── finishGame ────────────────────────────────────────────────────────────
  finishGame: (winnerId) => set({ status: 'completed', winnerId }),

  // ── checkWinner ───────────────────────────────────────────────────────────
  checkWinner: () => {
    const { zones } = get();
    const ids = Object.keys(zones);
    const finished = ids.filter((id) => zones[id].isFinished);

    if (finished.length > 0) {
      // Mark all zones as finished
      const updatedZones = { ...zones };
      for (const id of ids) {
        updatedZones[id] = { ...updatedZones[id], isFinished: true };
      }

      // Find the winner (highest score, then lowest time)
      let winnerId: string | null = null;
      let maxScore = -1;
      let isTie = false;

      for (const id of ids) {
        const score = zones[id].score;
        if (score > maxScore) {
          maxScore = score;
          winnerId = id;
          isTie = false;
        } else if (score === maxScore) {
          isTie = true;
        }
      }

      if (isTie) winnerId = null;
      set({ zones: updatedZones, timeLeft: 0 });
      get().finishGame(winnerId);
    }
  },

  // ── makeMove ──────────────────────────────────────────────────────────────
  makeMove: (zoneId, from, to, promotion = 'q') => {
    const { status, puzzles, zones, settings } = get();
    if (status !== 'active') return 'incorrect';
    if (settings.isMenuOpen) return 'incorrect';

    const zone = zones[zoneId];
    if (!zone || zone.isFinished) return 'incorrect';

    const engine = puzzleEngines[zoneId];
    const puzzle = puzzles[zone.puzzleIndex];
    if (!engine || !puzzle) return 'incorrect';

    const outcome = engine.applyMove(from, to, promotion);

    if (outcome.result === 'incorrect') {
      // Engine already reset to puzzle.fen internally
      const newAttempts = zone.attempts + 1;
      const shouldAutoSkip =
        settings.maxAttemptsPerPuzzle > 0 && newAttempts >= settings.maxAttemptsPerPuzzle;

      // Update zone: increment errors/attempts, keep fen from engine (reset)
      set({
        zones: {
          ...zones,
          [zoneId]: {
            ...zone,
            errors: zone.errors + 1,
            attempts: newAttempts,
            lastMoveResult: 'incorrect',
            hint: null,
            // boardState is still the PUZZLE start FEN (engine already reset)
            boardState: engine.getBoardState(),
          },
        },
      });

      if (shouldAutoSkip) {
        setTimeout(() => {
          const current = get();
          if (current.status === 'active') {
            moveToNextPuzzle(zoneId);
          }
        }, 1200);
      }

      return 'incorrect';
    }

    if (outcome.result === 'correct') {
      // Correct intermediate move — update board state then schedule opponent reply
      set({
        zones: {
          ...zones,
          [zoneId]: {
            ...zone,
            lastMoveResult: 'correct',
            hint: null,
            boardState: engine.getBoardState(),
          },
        },
      });

      if (outcome.needsOpponentReply) {
        setTimeout(() => {
          const current = get();
          if (current.status !== 'active') return;
          const currentZone = current.zones[zoneId];
          if (!currentZone || currentZone.isFinished) return;

          const applied = engine.applyOpponentReply();
          if (applied) {
            set({
              zones: {
                ...current.zones,
                [zoneId]: {
                  ...currentZone,
                  boardState: engine.getBoardState(),
                },
              },
            });
          }
        }, 500);
      }

      return 'correct';
    }

    // result === 'completed'
    const newScore = zone.score + 1;
    set({
      zones: {
        ...zones,
        [zoneId]: {
          ...zone,
          score: newScore,
          attempts: 0,
          hintsUsed: 0,
          lastMoveResult: 'completed',
          hint: null,
          boardState: engine.getBoardState(),
        },
      },
    });

    setTimeout(() => {
      const current = get();
      if (current.status === 'active') {
        moveToNextPuzzle(zoneId);
      }
    }, 900);

    return 'completed';
  },

  // ── requestHint ───────────────────────────────────────────────────────────
  requestHint: (zoneId) => {
    const { zones, settings } = get();
    if (!settings.showSolutionHints) return null;

    const zone = zones[zoneId];
    if (!zone || zone.isFinished) return null;

    if (
      settings.maxSolutionHintsPerPuzzle > 0 &&
      zone.hintsUsed >= settings.maxSolutionHintsPerPuzzle
    ) {
      return null;
    }

    const engine = puzzleEngines[zoneId];
    if (!engine) return null;

    const hint = engine.getHint();
    if (!hint) return null;

    set({
      zones: {
        ...zones,
        [zoneId]: {
          ...zone,
          hintsUsed: zone.hintsUsed + 1,
          hint,
        },
      },
    });

    return hint;
  },

  // ── useSolutionHint (backward-compat shim for GameZone) ───────────────────
  useSolutionHint: (zoneId) => {
    const hint = get().requestHint(zoneId);
    if (!hint) return null;
    return { from: hint.from, to: hint.to };
  },

  // ── tick ──────────────────────────────────────────────────────────────────
  tick: () => {
    const { timeLeft, status, settings, zones } = get();
    if (status !== 'active' || settings.isMenuOpen) return;

    // Track time spent per active player
    const updatedZones = { ...zones };
    for (const id of Object.keys(zones)) {
      if (!zones[id].isFinished) {
        updatedZones[id] = { ...zones[id], timeSpent: zones[id].timeSpent + 1 };
      }
    }

    if (timeLeft <= 1) {
      // Time's up — determine winner by score
      let winnerId: string | null = null;
      let maxScore = -1;
      let isTie = false;

      for (const id of Object.keys(updatedZones)) {
        const score = updatedZones[id].score;
        if (score > maxScore) {
          maxScore = score;
          winnerId = id;
          isTie = false;
        } else if (score === maxScore) {
          isTie = true;
        }
      }

      if (isTie) winnerId = null;
      set({ zones: updatedZones, timeLeft: 0 });
      get().finishGame(winnerId);
    } else {
      set({ zones: updatedZones, timeLeft: timeLeft - 1 });
    }
  },

  // ── Settings ───────────────────────────────────────────────────────────────
  setSettings: (partial) =>
    set((s) => ({ settings: { ...s.settings, ...partial } })),
  setCustomPuzzles: (puzzles) => set({ customPuzzles: puzzles }),
  setDefaultTimeLimit: (s) =>
    set((st) => ({ settings: { ...st.settings, defaultTimeLimit: s }, timeLeft: s })),
  setBoardTheme: (theme) =>
    set((s) => ({ settings: { ...s.settings, boardTheme: theme } })),
  setShowMoveHints: (v) =>
    set((s) => ({ settings: { ...s.settings, showMoveHints: v } })),
  setShowSolutionHints: (v) =>
    set((s) => ({ settings: { ...s.settings, showSolutionHints: v } })),
  setMaxSolutionHintsPerPuzzle: (n) =>
    set((s) => ({ settings: { ...s.settings, maxSolutionHintsPerPuzzle: n } })),
  setMaxAttemptsPerPuzzle: (n) =>
    set((s) => ({ settings: { ...s.settings, maxAttemptsPerPuzzle: n } })),
  toggleMute: () =>
    set((s) => ({ settings: { ...s.settings, isMuted: !s.settings.isMuted } })),
  setPlayerName: (zoneId, name) => {
    const { zones } = get();
    if (zones[zoneId]) {
      set({ zones: { ...zones, [zoneId]: { ...zones[zoneId], playerName: name } } });
    }
  },
  setDuration: (seconds) =>
    set((s) => ({ settings: { ...s.settings, defaultTimeLimit: seconds }, timeLeft: seconds })),
}));

// ─── nextPuzzle helper (module-level, not in store to avoid circular refs) ────

function moveToNextPuzzle(zoneId: string) {
  const { puzzles, zones } = useGameStore.getState();
  const zone = zones[zoneId];
  if (!zone || zone.isFinished) return;

  const nextIndex = zone.puzzleIndex + 1;
  const isFinished = nextIndex >= puzzles.length;

  if (!isFinished) {
    const nextPuzzle = puzzles[nextIndex];
    puzzleEngines[zoneId] = new PuzzleEngine(nextPuzzle);

    useGameStore.setState({
      zones: {
        ...useGameStore.getState().zones,
        [zoneId]: {
          ...zone,
          puzzleIndex: nextIndex,
          attempts: 0,
          hintsUsed: 0,
          hint: null,
          lastMoveResult: null,
          boardState: puzzleEngines[zoneId].getBoardState(),
        },
      },
    });
  } else {
    useGameStore.setState({
      zones: {
        ...useGameStore.getState().zones,
        [zoneId]: {
          ...zone,
          puzzleIndex: nextIndex,
          isFinished: true,
          hint: null,
          lastMoveResult: null,
        },
      },
    });
    useGameStore.getState().checkWinner();
  }
}

// Dev helper
if (typeof window !== 'undefined') {
  (window as any).useGameStore = useGameStore;
}
