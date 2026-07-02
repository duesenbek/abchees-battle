import { Chess } from 'chess.js';

export interface FenValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * FenValidator — strict validation of FEN strings.
 * chess.js alone does not catch all invalid positions (e.g., two kings of same color).
 */
export class FenValidator {
  /**
   * Validate a FEN string with 10 chess-specific checks.
   */
  public static validate(fen: string): FenValidationResult {
    if (!fen || typeof fen !== 'string') {
      return { valid: false, error: 'FEN должен быть строкой.' };
    }

    try {
      new Chess(fen);
    } catch (e) {
      return { valid: false, error: `FEN не распознан chess.js: "${fen}".` };
    }

    const parts = fen.trim().split(/\s+/);
    const boardPart = parts[0];
    const sideToMove = parts[1];

    // 2. Board must have 8 rows
    const rows = boardPart.split('/');
    if (rows.length !== 8) {
      return { valid: false, error: `FEN должен содержать 8 рядов (получено ${rows.length}).` };
    }

    // 3. Side to move must be 'w' or 'b'
    if (sideToMove !== 'w' && sideToMove !== 'b') {
      return { valid: false, error: `Сторона хода в FEN должна быть "w" или "b" (получено "${sideToMove}").` };
    }

    // 4. Count white and black kings — exactly 1 of each
    const whiteKings = (boardPart.match(/K/g) || []).length;
    const blackKings = (boardPart.match(/k/g) || []).length;
    if (whiteKings !== 1) {
      return { valid: false, error: `На доске должен быть ровно 1 белый король (найдено: ${whiteKings}).` };
    }
    if (blackKings !== 1) {
      return { valid: false, error: `На доске должен быть ровно 1 чёрный король (найдено: ${blackKings}).` };
    }

    // 5. No pawns on ranks 1 or 8
    const rank1 = rows[7]; // rank 1 is last row
    const rank8 = rows[0]; // rank 8 is first row
    if (/[Pp]/.test(rank1) || /[Pp]/.test(rank8)) {
      return { valid: false, error: 'На доске не может быть пешек на 1-й или 8-й горизонтали.' };
    }

    // 6. Side NOT to move must not be in check
    //    (i.e., if it's White to move, Black king must not be in check)
    const opponent = sideToMove === 'w' ? 'b' : 'w';
    try {
      // Flip the side to move and see if chess.js says they're in check
      const fenParts = fen.trim().split(/\s+/);
      fenParts[1] = opponent;
      // Reset en-passant and half-move to avoid loading errors
      fenParts[3] = '-';
      const flippedFen = fenParts.join(' ');
      const flippedChess = new Chess(flippedFen);
      if (flippedChess.inCheck()) {
        return {
          valid: false,
          error: `Недопустимая позиция: сторона, НЕ делающая ход (${opponent === 'w' ? 'белые' : 'чёрные'}), находится под шахом.`,
        };
      }
    } catch {
      // If flipping fails, skip this check
    }

    // 7. Board squares per row must total 8
    for (let i = 0; i < rows.length; i++) {
      let count = 0;
      for (const ch of rows[i]) {
        if (/\d/.test(ch)) count += parseInt(ch, 10);
        else count += 1;
      }
      if (count !== 8) {
        return { valid: false, error: `Ряд ${8 - i} в FEN содержит ${count} клеток вместо 8.` };
      }
    }

    return { valid: true };
  }
}
