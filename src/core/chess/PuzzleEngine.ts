import type { Puzzle, BoardState, MoveOutcome, HintData } from './types';
import { ChessEngine } from './ChessEngine';
import { MoveValidator } from './MoveValidator';
import { HintEngine } from './HintEngine';

/**
 * PuzzleEngine — manages the state of ONE puzzle for ONE zone.
 *
 * This is the authoritative chess state for a player during a puzzle.
 * The GameEngine creates one PuzzleEngine per zone and delegates all
 * chess operations to it. The UI never touches chess.js directly.
 */
export class PuzzleEngine {
  private engine: ChessEngine;
  private puzzle: Puzzle;

  constructor(puzzle: Puzzle) {
    this.puzzle = puzzle;
    this.engine = new ChessEngine(puzzle.fen);
  }

  /** Load a new puzzle, resetting engine to its starting FEN */
  loadPuzzle(puzzle: Puzzle): void {
    this.puzzle = puzzle;
    this.engine = new ChessEngine(puzzle.fen);
  }

  /** Reset current puzzle to its starting position */
  resetToStart(): void {
    this.engine.load(this.puzzle.fen);
  }

  /**
   * Apply a player move.
   *
   * If the move is incorrect:
   *   - Rolls back to puzzle.fen immediately in the engine
   *   - Returns { result: 'incorrect', needsOpponentReply: false }
   *
   * If correct or completed:
   *   - Move remains applied in the engine
   *   - Caller should call applyOpponentReply() after if needsOpponentReply === true
   */
  applyMove(from: string, to: string, promotion = 'q'): MoveOutcome {
    const fenBefore = this.engine.fen;
    const historyLength = this.engine.history().length;

    // Apply move physically
    const moveObj = this.engine.move({ from, to, promotion });
    if (!moveObj) {
      // Illegal move by chess rules — reset and return incorrect
      this.engine.load(this.puzzle.fen);
      return { result: 'incorrect', needsOpponentReply: false };
    }

    const fenAfter = this.engine.fen;

    // Validate against puzzle solution
    const outcome = MoveValidator.validate(
      this.puzzle,
      historyLength,
      from,
      to,
      promotion,
      fenBefore,
      fenAfter,
    );

    if (outcome.result === 'incorrect') {
      // Reset engine to puzzle start
      this.engine.load(this.puzzle.fen);
    }

    return outcome;
  }

  /**
   * Apply the opponent's automatic reply from the solution.
   * Call this only after applyMove() returns needsOpponentReply === true.
   * Returns true if the reply was applied successfully.
   */
  applyOpponentReply(): boolean {
    const historyLength = this.engine.history().length;
    const replyMove = this.puzzle.solution[historyLength];
    if (!replyMove) return false;

    const result = this.engine.move(replyMove);
    return result !== null;
  }

  /**
   * Compute a hint for the next player move.
   * moveIndex = how many moves (player + opponent) have been played so far
   */
  getHint(): HintData | null {
    const moveIndex = this.engine.history().length;
    return HintEngine.getHint(this.puzzle, moveIndex);
  }

  /**
   * Get the current board state for rendering.
   * This is the ONLY way UI should get board information.
   */
  getBoardState(): BoardState {
    const fen = this.engine.fen;
    const legalMoves = this.engine.allLegalMoves();
    const isCheckmate = this.engine.isCheckmate();
    const isInCheck = this.engine.inCheck();
    const checkSquare = isInCheck ? this.engine.kingSquare() : null;

    // Get last move from history
    const history = this.engine.historyVerbose();
    const lastMoveObj = history[history.length - 1] ?? null;
    const lastMove = lastMoveObj ? { from: lastMoveObj.from, to: lastMoveObj.to } : null;

    return {
      fen,
      legalMoves,
      lastMove,
      checkSquare,
      isInCheck,
      isCheckmate,
    };
  }

  /** Current puzzle */
  get currentPuzzle(): Puzzle {
    return this.puzzle;
  }

  /** Number of moves played so far (player + opponent) */
  get movesPlayed(): number {
    return this.engine.history().length;
  }
}
