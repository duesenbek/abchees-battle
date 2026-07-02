import { Chess, type Move } from 'chess.js';

/**
 * ChessEngine — thin, stateful wrapper around chess.js.
 * Contains zero business logic. All decisions are made by callers.
 */
export class ChessEngine {
  private game: Chess;

  constructor(fen?: string) {
    if (fen && fen !== 'start') {
      this.game = new Chess(fen);
    } else {
      this.game = new Chess();
    }
  }

  /** Current FEN string */
  get fen(): string {
    return this.game.fen();
  }

  /** Whose turn: 'w' or 'b' */
  get turn(): 'w' | 'b' {
    return this.game.turn();
  }

  /**
   * Apply a move. Accepts UCI (e2e4, e7e8q) or SAN (Nf3, Qxf7+).
   * Returns the Move object on success, null on failure.
   */
  move(moveInput: string | { from: string; to: string; promotion?: string }): Move | null {
    try {
      const result = this.game.move(moveInput as any);
      return result ?? null;
    } catch {
      return null;
    }
  }

  /** Undo the last move. Returns the undone Move or null. */
  undo(): Move | null {
    return this.game.undo() ?? null;
  }

  /**
   * Load a FEN string into the engine (replaces current position).
   * Returns true on success.
   */
  load(fen: string): boolean {
    try {
      this.game.load(fen);
      return true;
    } catch {
      return false;
    }
  }

  /** All legal moves from a square, or all legal moves if no square given */
  moves(square?: string): Move[] {
    if (square) {
      return this.game.moves({ square: square as any, verbose: true }) as Move[];
    }
    return this.game.moves({ verbose: true }) as Move[];
  }

  /** Legal destination squares for pieces on a given square */
  legalDestinations(square: string): string[] {
    return this.moves(square).map((m) => m.to);
  }

  /** All legal destination squares grouped by source square */
  allLegalMoves(): Record<string, string[]> {
    const result: Record<string, string[]> = {};
    const moves = this.moves();
    for (const m of moves) {
      if (!result[m.from]) result[m.from] = [];
      result[m.from].push(m.to);
    }
    return result;
  }

  /** Move history as SAN strings */
  history(): string[] {
    return this.game.history();
  }

  /** Verbose move history as Move objects */
  historyVerbose(): Move[] {
    return this.game.history({ verbose: true }) as Move[];
  }

  isCheckmate(): boolean {
    return this.game.isCheckmate();
  }

  isDraw(): boolean {
    return this.game.isDraw();
  }

  isGameOver(): boolean {
    return this.game.isGameOver();
  }

  inCheck(): boolean {
    return this.game.inCheck();
  }

  /** Find which square the current side's king is on (for highlighting) */
  kingSquare(): string | null {
    const board = this.game.board();
    const turn = this.game.turn();
    for (const row of board) {
      for (const sq of row) {
        if (sq && sq.type === 'k' && sq.color === turn) {
          return sq.square;
        }
      }
    }
    return null;
  }

  /**
   * Get the piece on a square.
   * Returns e.g. { type: 'n', color: 'w' } or null.
   */
  pieceAt(square: string): { type: string; color: 'w' | 'b' } | null {
    return this.game.get(square as any) ?? null;
  }

  /** Reset to starting position */
  reset(): void {
    this.game.reset();
  }

  /** Clone this engine at the current position */
  clone(): ChessEngine {
    return new ChessEngine(this.fen);
  }
}
