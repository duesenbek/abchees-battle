import type { Puzzle } from '../types';
import defaultPuzzlesRaw from '../../data/puzzles/mate1.json';
import { type PuzzleFile } from '../types';

export class PuzzleApiService {
  public async fetchDailyPuzzles(): Promise<Puzzle[]> {
    const puzzles = (defaultPuzzlesRaw as unknown as PuzzleFile).puzzles;
    return new Promise(resolve => setTimeout(() => resolve(puzzles), 500));
  }
}

export const puzzleApiService = new PuzzleApiService();
