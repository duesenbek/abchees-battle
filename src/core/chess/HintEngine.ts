import { Chess } from 'chess.js';
import type { Puzzle, HintData } from './types';

const PIECE_NAMES: Record<string, string> = {
  k: 'Король',
  q: 'Ферзь',
  r: 'Ладья',
  b: 'Слон',
  n: 'Конь',
  p: 'Пешка',
};

/**
 * HintEngine — computes the next hint for a puzzle.
 * Never reads JSON directly. Always asks for puzzle + moveIndex.
 */
export class HintEngine {
  /**
   * Compute the hint for the next expected player move.
   *
   * @param puzzle       The current puzzle
   * @param moveIndex    The index in puzzle.solution[] of the next move to hint
   *                     (= number of moves already played, including opponent replies)
   * @returns HintData or null if no hint is available
   */
  public static getHint(puzzle: Puzzle, moveIndex: number): HintData | null {
    const entry = puzzle.solution[moveIndex];
    if (!entry) return null;

    try {
      // Replay from puzzle start up to the current position
      const chess = new Chess(puzzle.fen);
      for (let i = 0; i < moveIndex; i++) {
        const step = puzzle.solution[i];
        if (!step) return null;
        const result = chess.move(step);
        if (!result) return null;
      }

      // Now apply the hint move to get from/to
      const currentFen = chess.fen();
      const tempChess = new Chess(currentFen);
      const moveObj = tempChess.move(entry);
      if (!moveObj) return null;

      const from = moveObj.from;
      const to = moveObj.to;
      const pieceType = moveObj.piece; // 'k','q','r','b','n','p'
      const pieceName = PIECE_NAMES[pieceType] ?? 'Фигура';

      const text = HintEngine.buildHintText(puzzle, moveIndex, pieceName, from, to, moveObj.flags);

      return {
        piece: pieceName,
        from,
        to,
        highlight: [from, to],
        text,
      };
    } catch {
      return null;
    }
  }

  private static buildHintText(
    puzzle: Puzzle,
    moveIndex: number,
    pieceName: string,
    from: string,
    to: string,
    flags: string,
  ): string {
    const isCapture = flags.includes('c') || flags.includes('e');
    const isPromotion = flags.includes('p');
    const isCheck = flags.includes('ch') || flags.includes('k+');

    if (puzzle.type === 'mate-in-1' || puzzle.type === 'mate-in-2') {
      if (moveIndex === puzzle.solution.length - 1) {
        return `${pieceName} с ${from} на ${to} — мат!`;
      }
      return `${pieceName} начинает комбинацию: с ${from} на ${to}.`;
    }

    if (isPromotion) {
      return `Пешка с ${from} достигает ${to} и превращается в ферзя!`;
    }

    if (isCapture) {
      return `${pieceName} с ${from} бьёт фигуру на ${to}.`;
    }

    if (isCheck) {
      return `${pieceName} с ${from} на ${to} — шах!`;
    }

    return `${pieceName} с ${from} на ${to}.`;
  }
}
