import { Chess } from 'chess.js';
import type { Puzzle } from './types';
import type { MoveOutcome } from './types';

/**
 * MoveValidator — checks a player's move against a puzzle solution.
 * Never touches UI. Pure chess logic.
 */
export class MoveValidator {
  /**
   * Validate a move played by the player against the puzzle solution.
   *
   * @param puzzle         The current puzzle
   * @param historyLength  Number of moves already played (= chess.history().length BEFORE this move)
   * @param from           Source square (e.g. "e2")
   * @param to             Target square (e.g. "e4")
   * @param promotion      Promotion piece (default 'q')
   * @param positionFen    FEN of the position BEFORE the move was applied
   * @param afterMoveFen   FEN AFTER the move was applied (used to check checkmate)
   */
  public static validate(
    puzzle: Puzzle,
    historyLength: number,
    from: string,
    to: string,
    promotion: string,
    positionFen: string,
    afterMoveFen: string,
  ): MoveOutcome {
    const solution = puzzle.solution;
    const moveIndex = historyLength; // The index in solution[] we are checking now

    // For mate-in-1 or single-move puzzles: accept any move from solution[]
    const isSingleMove = puzzle.type === 'mate-in-1' || solution.length === 1;

    const isMatch = this.moveMatchesSolutionEntry(positionFen, from, to, promotion, solution[moveIndex]);

    // For single-move puzzles also accept any alternative solution entry
    const isAltMatch =
      isSingleMove &&
      solution.some((entry) => this.moveMatchesSolutionEntry(positionFen, from, to, promotion, entry));

    // Also accept if the move produces real checkmate (for mate-in-1/checkmate validation)
    const isRealCheckmate =
      (puzzle.type === 'mate-in-1' || puzzle.validation === 'checkmate') &&
      this.fenIsCheckmate(afterMoveFen);

    const valid = isMatch || isAltMatch || isRealCheckmate;

    if (!valid) {
      return { result: 'incorrect', needsOpponentReply: false };
    }

    // Determine if this is the last player move in the solution
    const nextIndex = moveIndex + 1;
    const isLastMove = nextIndex >= solution.length || isRealCheckmate;

    if (isLastMove) {
      return { result: 'completed', needsOpponentReply: false };
    }

    // There is an opponent reply at solution[nextIndex]
    return { result: 'correct', needsOpponentReply: true };
  }

  /**
   * Check whether a (from, to, promotion) triple matches a solution entry string.
   * Supports both UCI (e2e4, e7e8q) and SAN (Nf3, Qxf7+#).
   */
  private static moveMatchesSolutionEntry(
    fen: string,
    from: string,
    to: string,
    promotion: string,
    entry: string | undefined,
  ): boolean {
    if (!entry) return false;
    try {
      const temp = new Chess(fen);
      const moveObj = temp.move(entry);
      if (!moveObj) return false;
      const promoMatch =
        !moveObj.promotion ||
        moveObj.promotion === promotion ||
        promotion === 'q';
      return moveObj.from === from && moveObj.to === to && promoMatch;
    } catch {
      return false;
    }
  }

  /** Check if a given FEN represents a checkmate position */
  private static fenIsCheckmate(fen: string): boolean {
    try {
      return new Chess(fen).isCheckmate();
    } catch {
      return false;
    }
  }
}
