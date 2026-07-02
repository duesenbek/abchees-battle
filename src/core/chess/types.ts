// ─── Puzzle Types ─────────────────────────────────────────────────────────────

export type PuzzleType = 'mate-in-1' | 'mate-in-2' | 'best-move' | 'tactics' | 'tactic';
export type PuzzleValidationType = 'strict' | 'checkmate' | 'exact-moves';

export interface Puzzle {
  id: string;
  type: PuzzleType;
  validation: PuzzleValidationType;
  title: string;
  fen: string;
  solution: string[];
  description?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  tags?: string[];
}

export interface PuzzleFile {
  schemaVersion: number;
  packTitle?: string;
  packDescription?: string;
  packDifficulty?: string;
  puzzles: Puzzle[];
}

// ─── Hint Types ───────────────────────────────────────────────────────────────

export interface HintData {
  piece: string;       // Piece type, e.g. "Knight"
  from: string;        // Source square, e.g. "h6"
  to: string;          // Target square, e.g. "f7"
  highlight: string[]; // Squares to highlight [from, to]
  text: string;        // Human-readable hint text in Russian
}

// ─── Board State ──────────────────────────────────────────────────────────────

export interface BoardState {
  fen: string;
  /** Legal move destinations by source square */
  legalMoves: Record<string, string[]>;
  lastMove: { from: string; to: string } | null;
  checkSquare: string | null;  // King square if in check
  isInCheck: boolean;
  isCheckmate: boolean;
}

// ─── Move Result ──────────────────────────────────────────────────────────────

export type MoveResult = 'correct' | 'incorrect' | 'completed';

export interface MoveOutcome {
  result: MoveResult;
  needsOpponentReply: boolean;
}

// ─── Zone State (exposed to UI) ───────────────────────────────────────────────

export interface ZoneState {
  playerName: string;
  avatar?: string;
  puzzleIndex: number;
  score: number;
  errors: number;
  attempts: number;
  hintsUsed: number;
  timeSpent: number;
  isFinished: boolean;
  boardState: BoardState;
  /** The active hint, set after requestHint(), cleared on next move or puzzle change */
  hint: HintData | null;
  /** Result of the last move attempt */
  lastMoveResult: MoveResult | null;
}

// ─── Game Settings ────────────────────────────────────────────────────────────

export interface GameSettings {
  isMuted: boolean;
  showMoveHints: boolean;
  showSolutionHints: boolean;
  maxSolutionHintsPerPuzzle: number;
  maxAttemptsPerPuzzle: number;
  boardTheme: 'zone' | 'classic' | 'emerald';
  defaultTimeLimit: number;
  isMenuOpen: boolean;
}

// ─── JSON Validation Result ───────────────────────────────────────────────────

export interface JsonValidationResult {
  success: boolean;
  puzzles?: Puzzle[];
  packTitle?: string;
  packDescription?: string;
  packDifficulty?: string;
  error?: string;
  warnings?: string[];
}
