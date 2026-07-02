const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, 'test-results');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir);
}

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    defaultViewport: { width: 1440, height: 900 }
  });
  const page = await browser.newPage();

  try {
    await page.goto('http://localhost:5173/');
    
    // Wait for setup screen
    await page.waitForSelector('.setup-screen');
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(outDir, '01_linear_setup.png') });
    await page.screenshot({ path: path.join(outDir, '09_teacher_panel.png') });
    
    const puzzleLibrary = await page.$('.setup-content');
    if (puzzleLibrary) {
      await puzzleLibrary.screenshot({ path: path.join(outDir, '10_puzzle_library.png') });
    }

    // Go to import tab
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('.setup-nav-item'));
      const importTab = tabs.find(t => t.textContent.includes('Импорт JSON'));
      if (importTab) importTab.click();
    });
    await new Promise(r => setTimeout(r, 500));
    
    const importScreenEmpty = await page.$('.setup-content');
    if (importScreenEmpty) {
      await importScreenEmpty.screenshot({ path: path.join(outDir, '14_audit_setup.png') });
    }

    // Capture winner screen by simulating a very short game
    await page.evaluate(() => {
      // Switch to settings tab
      const tabs = Array.from(document.querySelectorAll('.setup-nav-item'));
      const settingsTab = tabs.find(t => t.textContent.includes('Настройки турнира'));
      if (settingsTab) settingsTab.click();
    });
    await new Promise(r => setTimeout(r, 500));

    await page.evaluate(() => {
      // Find the number input for time limit and set it to 1
      const input = document.querySelector('input[type="number"]');
      if (input) {
        // React requires native value setter for events to trigger
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
        nativeInputValueSetter?.call(input, 1);
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('blur', { bubbles: true }));
      }
    });
    
    // Click start tournament
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button.btn-primary'));
      const startBtn = btns.find(b => b.textContent.includes('Начать турнир'));
      if (startBtn) startBtn.click();
    });
    
    // Wait for game area
    await page.waitForSelector('main');
    await new Promise(r => setTimeout(r, 2000));
    
    await page.screenshot({ path: path.join(outDir, '14_audit_game.png') });

    const header = await page.$('header');
    if (header) {
      await header.screenshot({ path: path.join(outDir, '03_header_only.png') });
    }

    const playerCard = await page.$('.game-zone > div:first-child');
    if (playerCard) {
      await playerCard.screenshot({ path: path.join(outDir, '04_player_card.png') });
    }

    const puzzleCard = await page.$('.game-zone > div:last-child');
    if (puzzleCard) {
      await puzzleCard.screenshot({ path: path.join(outDir, '05_puzzle_card.png') });
    }

    const boardArea = await page.$('.game-zone .board-container');
    if (boardArea) {
      // Find the parent div of the board container for a better screenshot (padding etc)
      const wrapper = await page.evaluateHandle((el) => el.parentElement, boardArea);
      await wrapper.screenshot({ path: path.join(outDir, '06_board_area.png') });
    }

    const gameLayout = await page.$('main > div:last-child');
    if (gameLayout) {
      await gameLayout.screenshot({ path: path.join(outDir, '07_game_layout.png') });
      await gameLayout.screenshot({ path: path.join(outDir, '13_animations.png') });
    }

    const hudBlock = await page.$('main > div:first-child > div');
    if (hudBlock) {
      await hudBlock.screenshot({ path: path.join(outDir, '08_hud.png') });
    }

    // Wait for winner screen (timer is 1 sec, so it will finish quickly)
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(outDir, '14_audit_winner.png') });
  } catch (err) {
    console.error(err);
  } finally {
    await browser.close();
  }
})();
