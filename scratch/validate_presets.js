import { Chess } from 'chess.js';
import fs from 'fs';
import path from 'path';

const puzzlesDir = 'c:/Users/Bekzat/Desktop/abchess-duel/src/data/puzzles';
const files = fs.readdirSync(puzzlesDir).filter(f => f.endsWith('.json'));

let totalErrors = 0;

for (const file of files) {
  console.log(`\nChecking ${file}...`);
  const filePath = path.join(puzzlesDir, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  
  if (!data.puzzles || !Array.isArray(data.puzzles)) {
    console.error(`  [ERROR] No puzzles array in ${file}`);
    totalErrors++;
    continue;
  }

  for (const p of data.puzzles) {
    // 1. Check FEN legality
    let chess;
    try {
      chess = new Chess(p.fen);
    } catch (e) {
      console.error(`  [ERROR] Puzzle ${p.id} ("${p.title}"): Invalid FEN: "${p.fen}". Error: ${e.message}`);
      totalErrors++;
      continue;
    }

    // Check if both kings exist
    const boardStr = chess.fen();
    if (!boardStr.includes('K') || !boardStr.includes('k')) {
      console.error(`  [ERROR] Puzzle ${p.id} ("${p.title}"): FEN missing King(s): "${p.fen}"`);
      totalErrors++;
      continue;
    }

    // 2. Check solution moves legality
    let movesValid = true;
    const tempChess = new Chess(p.fen);
    for (let i = 0; i < p.solution.length; i++) {
      const move = p.solution[i];
      try {
        const res = tempChess.move(move);
        if (!res) {
          console.error(`  [ERROR] Puzzle ${p.id} ("${p.title}"): Move ${i + 1} "${move}" is illegal in FEN "${tempChess.fen()}"`);
          movesValid = false;
          totalErrors++;
          break;
        }
      } catch (err) {
        console.error(`  [ERROR] Puzzle ${p.id} ("${p.title}"): Move ${i + 1} "${move}" failed: ${err.message}`);
        movesValid = false;
        totalErrors++;
        break;
      }
    }

    if (!movesValid) continue;

    // 3. For mate-in-1 or mate-in-2, verify checkmate at the end
    if (p.type && (p.type.startsWith('mate-in') || p.validation === 'checkmate')) {
      if (!tempChess.isGameOver() || !tempChess.isCheckmate()) {
        console.error(`  [ERROR] Puzzle ${p.id} ("${p.title}"): Solution does not lead to checkmate. Final FEN: "${tempChess.fen()}"`);
        totalErrors++;
      }
    }
  }
}

console.log(`\nValidation complete. Total errors found: ${totalErrors}`);
if (totalErrors > 0) {
  process.exit(1);
} else {
  console.log('All presets are 100% valid!');
  process.exit(0);
}
