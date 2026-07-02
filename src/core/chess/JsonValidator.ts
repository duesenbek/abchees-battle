import { Chess } from 'chess.js';
import { FenValidator } from './FenValidator';
import type { Puzzle, PuzzleType, JsonValidationResult } from './types';

const VALID_TYPES: PuzzleType[] = ['mate-in-1', 'mate-in-2', 'best-move', 'tactics', 'tactic'];
const VALID_VALIDATIONS = ['strict', 'checkmate', 'exact-moves'];

/**
 * JsonValidator — the authoritative parser and validator for puzzle JSON packs.
 *
 * Every imported puzzle passes through this validator before it can be played.
 * Invalid puzzles are skipped with a descriptive warning. Valid puzzles are
 * returned as a typed Puzzle[] array.
 */
export class JsonValidator {
  public static validate(data: unknown): JsonValidationResult {
    if (!data || typeof data !== 'object') {
      return { success: false, error: 'Неверная структура JSON. Ожидается объект.' };
    }

    const obj = data as Record<string, unknown>;

    if (typeof obj.schemaVersion !== 'number') {
      return { success: false, error: 'Поле schemaVersion обязательно и должно быть числом.' };
    }

    if (obj.schemaVersion !== 1) {
      return {
        success: false,
        error: `Поддерживается только schemaVersion: 1. Получено: ${obj.schemaVersion}`,
      };
    }

    if (!Array.isArray(obj.puzzles)) {
      return { success: false, error: 'Поле puzzles обязательно и должно быть массивом.' };
    }

    const validatedPuzzles: Puzzle[] = [];
    const warnings: string[] = [];
    const seenIds = new Set<string>();

    for (let i = 0; i < obj.puzzles.length; i++) {
      const p = obj.puzzles[i] as Record<string, unknown>;
      const label = `Задача #${i + 1}`;

      // ── id ────────────────────────────────────────────────────────────────
      if (p.id === undefined || p.id === null || p.id === '') {
        warnings.push(`${label}: отсутствует поле id. Пропущена.`);
        continue;
      }
      const id = String(p.id);
      if (seenIds.has(id)) {
        warnings.push(`${label}: дубликат id "${id}". Пропущена.`);
        continue;
      }

      // ── title ─────────────────────────────────────────────────────────────
      if (!p.title || typeof p.title !== 'string') {
        warnings.push(`${label} (id="${id}"): отсутствует или некорректно поле title. Пропущена.`);
        continue;
      }

      // ── FEN ───────────────────────────────────────────────────────────────
      if (!p.fen || typeof p.fen !== 'string') {
        warnings.push(`${label} (id="${id}"): отсутствует поле fen. Пропущена.`);
        continue;
      }
      const fenResult = FenValidator.validate(p.fen as string);
      if (!fenResult.valid) {
        warnings.push(`${label} (id="${id}"): некорректный FEN — ${fenResult.error} Пропущена.`);
        continue;
      }

      // ── type ──────────────────────────────────────────────────────────────
      const puzzleType = (p.type as string) || 'best-move';
      if (!VALID_TYPES.includes(puzzleType as PuzzleType)) {
        warnings.push(
          `${label} (id="${id}"): неизвестный тип "${puzzleType}". Допустимые: ${VALID_TYPES.join(', ')}. Пропущена.`,
        );
        continue;
      }

      // ── validation ────────────────────────────────────────────────────────
      const validationType = (p.validation as string) || 'strict';
      if (!VALID_VALIDATIONS.includes(validationType)) {
        warnings.push(
          `${label} (id="${id}"): неизвестный режим validation "${validationType}". Пропущена.`,
        );
        continue;
      }

      // ── solution ──────────────────────────────────────────────────────────
      if (!Array.isArray(p.solution) || (p.solution as unknown[]).length === 0) {
        warnings.push(`${label} (id="${id}"): solution должен быть непустым массивом. Пропущена.`);
        continue;
      }

      const solution = (p.solution as unknown[]).map(String);

      // ── Simulate all solution moves ────────────────────────────────────────
      let simValid = true;
      const chess = new Chess(p.fen as string);

      for (let mi = 0; mi < solution.length; mi++) {
        const moveStr = solution[mi];

        // Check UCI format (4-5 chars): e2e4 or e7e8q
        const isUCI = /^[a-h][1-8][a-h][1-8][qrbn]?$/.test(moveStr);
        // Alternatively it could be SAN — let chess.js decide
        const result = chess.move(moveStr);

        if (!result) {
          // Check if piece exists at source (for better error messages)
          if (isUCI) {
            const from = moveStr.slice(0, 2);
            const piece = chess.get(from as any);
            if (!piece) {
              warnings.push(
                `${label} (id="${id}"): ход ${mi + 1} "${moveStr}" — фигура на ${from} не найдена. Пропущена.`,
              );
            } else {
              warnings.push(
                `${label} (id="${id}"): ход ${mi + 1} "${moveStr}" нелегален в текущей позиции. Пропущена.`,
              );
            }
          } else {
            warnings.push(
              `${label} (id="${id}"): ход ${mi + 1} "${moveStr}" нелегален или нераспознан. Пропущена.`,
            );
          }
          simValid = false;
          break;
        }
      }

      if (!simValid) continue;

      // ── Type-specific post-simulation checks ──────────────────────────────
      if (puzzleType === 'mate-in-1') {
        if (solution.length !== 1) {
          warnings.push(
            `${label} (id="${id}"): mate-in-1 должен содержать ровно 1 ход (получено ${solution.length}). Пропущена.`,
          );
          continue;
        }
        if (!chess.isCheckmate()) {
          warnings.push(
            `${label} (id="${id}"): решение mate-in-1 не приводит к мату. Пропущена.`,
          );
          continue;
        }
      }

      if (puzzleType === 'mate-in-2') {
        if (solution.length !== 3) {
          warnings.push(
            `${label} (id="${id}"): mate-in-2 должен содержать ровно 3 хода (ход, ответ, мат; получено ${solution.length}). Пропущена.`,
          );
          continue;
        }
        if (!chess.isCheckmate()) {
          warnings.push(
            `${label} (id="${id}"): решение mate-in-2 не приводит к мату. Пропущена.`,
          );
          continue;
        }
      }

      // ── All checks passed ─────────────────────────────────────────────────
      seenIds.add(id);
      validatedPuzzles.push({
        id,
        type: puzzleType as PuzzleType,
        validation: validationType as Puzzle['validation'],
        title: p.title as string,
        fen: p.fen as string,
        solution,
        description: typeof p.description === 'string' ? p.description : undefined,
        difficulty: ['easy', 'medium', 'hard'].includes(p.difficulty as string)
          ? (p.difficulty as Puzzle['difficulty'])
          : undefined,
        tags: Array.isArray(p.tags) ? (p.tags as string[]) : undefined,
      });
    }

    if (validatedPuzzles.length === 0) {
      const detail = warnings.length > 0 ? `\n${warnings.join('\n')}` : '';
      return {
        success: false,
        error: `В файле не найдено ни одной валидной задачи.${detail}`,
      };
    }

    return {
      success: true,
      puzzles: validatedPuzzles,
      packTitle: typeof obj.packTitle === 'string' ? obj.packTitle : undefined,
      packDescription: typeof obj.packDescription === 'string' ? obj.packDescription : undefined,
      packDifficulty: typeof obj.packDifficulty === 'string' ? obj.packDifficulty : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }
}
