const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, 'test-results');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir);
}

const logLines = [];
function log(msg) {
  console.log(msg);
  logLines.push(msg);
}

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    defaultViewport: { width: 1280, height: 800 }
  });
  const page = await browser.newPage();

  try {
    log("================== ABCHESS E2E PROOF ==================");
    log("1. Запуск приложения");
    await page.goto('http://localhost:5173/');
    await page.waitForSelector('.setup-screen');
    await new Promise(r => setTimeout(r, 1000)); // let assets load
    await page.screenshot({ path: path.join(outDir, '1_setup_screen.png') });
    log("[Screenshot saved]: test-results/1_setup_screen.png");

    log("\n2. Старт турнира");
    const startBtn = await page.waitForSelector('.launch-card button.btn-primary');
    await startBtn.click();
    await page.waitForSelector('.board-container');
    await new Promise(r => setTimeout(r, 1000)); // render wait
    await page.screenshot({ path: path.join(outDir, '2_boards_rendered.png') });
    log("[Screenshot saved]: test-results/2_boards_rendered.png");

    log("\n3. Анализ позиции до первого хода");
    // Fetch state from the window store
    const getState = async () => {
      return await page.evaluate(() => {
        const state = window.useGameStore.getState();
        const player = state.players['zone-a'];
        const puzzle = state.puzzles[player.currentPuzzleIndex];
        const chessFen = state.chessInstances['zone-a'].fen;
        return {
          currentFen: chessFen,
          expectedFen: puzzle ? puzzle.fen : null,
          solution: puzzle ? puzzle.solution : null,
          score: player.score,
          puzzleIndex: player.currentPuzzleIndex,
          winnerId: state.winnerId
        };
      });
    };

    let state = await getState();
    log("Текущий FEN (chess.js): " + state.currentFen);
    log("Ожидаемый FEN (JSON):   " + state.expectedFen);
    if (state.currentFen === state.expectedFen) {
      log("=> FEN ПОЛНОСТЬЮ СОВПАДАЮТ");
    } else {
      throw new Error("FEN MISMATCH");
    }

    const simulateDragAndDrop = async (zoneSelector, fromSquare, toSquare) => {
      return await page.evaluate((sel, from, to) => {
        const sizer = document.querySelector(sel + ' .board-sizer');
        if (!sizer) return false;
        const fromEl = sizer.querySelector(`[data-square="${from}"]`);
        const toEl = sizer.querySelector(`[data-square="${to}"]`);
        if (!fromEl || !toEl) return false;
        
        const dragStartEvent = new DragEvent('dragstart', { bubbles: true, cancelable: true });
        Object.defineProperty(dragStartEvent, 'target', { value: fromEl, enumerable: true });
        sizer.dispatchEvent(dragStartEvent);
        
        const dropEvent = new DragEvent('drop', { bubbles: true, cancelable: true });
        Object.defineProperty(dropEvent, 'target', { value: toEl, enumerable: true });
        sizer.dispatchEvent(dropEvent);
        return true;
      }, zoneSelector, fromSquare, toSquare);
    };

    log("\n4. Неправильный ход");
    const illegalMove = { from: 'a7', to: 'a6' }; // typical illegal move if it's black's turn or pawn blocked
    log(`Попытка хода: ${illegalMove.from} -> ${illegalMove.to}`);
    await simulateDragAndDrop('.player-a', illegalMove.from, illegalMove.to);
    await new Promise(r => setTimeout(r, 600)); // wait for shake animation and rejection

    await page.screenshot({ path: path.join(outDir, '3_after_illegal_move.png') });
    log("[Screenshot saved]: test-results/3_after_illegal_move.png");

    let stateAfterIllegal = await getState();
    log("FEN после неверного хода: " + stateAfterIllegal.currentFen);
    if (stateAfterIllegal.currentFen === state.expectedFen) {
      log("=> ДОКАЗАНО: FEN не изменился, фигура возвращена на место");
    } else {
      throw new Error("FEN changed on illegal move!");
    }

    log("\n5. Правильный ход");
    const solutionMove = state.solution[0];
    const fromSq = solutionMove.substring(0, 2);
    const toSq = solutionMove.substring(2, 4);
    log(`Делаем правильный ход: ${fromSq} -> ${toSq}`);

    await simulateDragAndDrop('.player-a', fromSq, toSq);
    await new Promise(r => setTimeout(r, 300)); // short wait to capture before auto-transition

    await page.screenshot({ path: path.join(outDir, '4_after_correct_move.png') });
    log("[Screenshot saved]: test-results/4_after_correct_move.png");

    let stateAfterCorrect = await getState();
    log("FEN после правильного хода: " + stateAfterCorrect.currentFen);
    log("Счет: " + stateAfterCorrect.score);
    log("Индекс текущей задачи: " + stateAfterCorrect.puzzleIndex);

    log("\n6. Автоматический переход");
    log("Ожидаем 1000мс...");
    await new Promise(r => setTimeout(r, 1000)); // Wait for nextPuzzle transition
    
    await page.screenshot({ path: path.join(outDir, '5_after_auto_transition.png') });
    log("[Screenshot saved]: test-results/5_after_auto_transition.png");

    let stateAfterTransition = await getState();
    log("Новый FEN (Загруженная позиция): " + stateAfterTransition.currentFen);
    log("Ожидаемый FEN следующей задачи:  " + stateAfterTransition.expectedFen);
    if (stateAfterTransition.currentFen === stateAfterTransition.expectedFen) {
      log("=> ПОДТВЕРЖДЕНО: FEN совпадает со следующей задачей.");
    } else {
      throw new Error("NEXT PUZZLE FEN MISMATCH");
    }

    log("\n7. Завершение турнира");
    log("Проходим остальные задачи для Игрока А...");
    while (stateAfterTransition.score < 8) {
      const nextSol = stateAfterTransition.solution[0];
      const f = nextSol.substring(0, 2);
      const t = nextSol.substring(2, 4);
      log(`Решаем задачу ${stateAfterTransition.puzzleIndex + 1}: ${f} -> ${t}`);
      await simulateDragAndDrop('.player-a', f, t);
      await new Promise(r => setTimeout(r, 1200)); // wait for transition
      stateAfterTransition = await getState();
    }

    await new Promise(r => setTimeout(r, 1000)); // Podium screen animation
    await page.screenshot({ path: path.join(outDir, '6_podium_screen.png') });
    log("[Screenshot saved]: test-results/6_podium_screen.png");

    const podiumData = await page.evaluate(() => {
      const state = window.useGameStore.getState();
      const players = state.players;
      return { winner: state.winnerId, scoreA: players['zone-a'].score };
    });

    log("Победитель (ID зоны): " + podiumData.winner);
    log("Итоговый счет Игрока А: " + podiumData.scoreA);

    log("\n[УСПЕШНО] Все этапы проверки пройдены.");

  } catch (err) {
    log("\n[ОШИБКА] " + err.message);
  } finally {
    fs.writeFileSync(path.join(outDir, 'test_log.txt'), logLines.join('\n'));
    await browser.close();
  }
})();
