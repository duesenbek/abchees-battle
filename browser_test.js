import puppeteer from 'puppeteer';

// Helper to delay execution
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runBrowserTest() {
  console.log('=== LAUNCHING PUPPETEER BROWSER TEST ===');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Pipe browser console to terminal
  page.on('console', msg => console.log('[Browser Console]', msg.text()));
  
  // Set viewport to a standard desktop resolution
  await page.setViewport({ width: 1280, height: 800 });
  
  console.log('Navigating to http://localhost:5173...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  
  // 1. Verify Setup Main Menu Screen
  console.log('Verifying Setup Screen elements...');
  const title = await page.$eval('h1', el => el.textContent);
  console.log('Main menu title:', title);
  if (!title.includes('ABCHESS Battle')) {
    throw new Error('Title does not match ABCHESS Battle!');
  }
  
  // 2. Click "Start Tournament" (Начать турнир)
  console.log('Clicking "Начать турнир" button...');
  const startBtnSelector = 'button';
  const buttons = await page.$$(startBtnSelector);
  let startBtn = null;
  for (const btn of buttons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text.includes('Начать турнир')) {
      startBtn = btn;
      break;
    }
  }
  
  if (!startBtn) {
    throw new Error('Could not find "Начать турнир" button!');
  }
  
  await startBtn.click();
  console.log('Waiting for tournament transition to complete...');
  await delay(1500); // Wait for the transition to active screen
  
  // 3. Verify Active Gameplay Screen
  console.log('Verifying active game elements...');
  const url = page.url();
  console.log('Current page URL:', url);
  
  // Solutions array for players in order
  const solutions = [
    { from: 'h5', to: 'f7' }, // Puzzle 1
    { from: 'e1', to: 'e8' }, // Puzzle 2
    { from: 'd1', to: 'h5' }, // Puzzle 3 (Fool's Mate)
    { from: 'b2', to: 'b1' }, // Puzzle 4
    { from: 'b2', to: 'b1' }, // Puzzle 5 (Kiss of Death)
    { from: 'h5', to: 'g5' }, // Puzzle 6
    { from: 'c3', to: 'd4' }, // Puzzle 7
    { from: 'e2', to: 'e4' }  // Puzzle 8
  ];
  
  // Simulate solving all 8 puzzles for Player A (zone-a)
  // Let's first locate the board of Player A
  // Player A is on the left side of the screen.
  // In our GameZone layout, the chessboard is inside a div with class "player-a"
  for (let i = 0; i < solutions.length; i++) {
    const step = solutions[i];
    console.log(`\n--- SOLVING PUZZLE ${i + 1} / ${solutions.length} ---`);
    
    // Read the current score of Player A
    // Player A card score is inside the container for player-a
    // Let's select the score element
    const scoreVal = await page.evaluate(() => {
      const spans = Array.from(document.querySelectorAll('.player-a span'));
      const labelSpan = spans.find(el => el.textContent.trim() === 'Счёт');
      if (labelSpan && labelSpan.nextElementSibling) {
        return labelSpan.nextElementSibling.textContent.trim();
      }
      return 'unknown';
    });
    console.log(`Current Score: ${scoreVal}`);
    
    // Find the piece on the 'from' square of the player-a board
    const boardSelector = '.player-a';
    await page.waitForSelector(boardSelector);
    
    // React-chessboard renders square elements with data-square attribute
    // In our customized setup, white orientation is used.
    const fromSelector = `.player-a [data-square="${step.from}"]`;
    const toSelector = `.player-a [data-square="${step.to}"]`;
    const pieceSelector = `${fromSelector} [data-piece]`;
    
    console.log(`Waiting for piece to appear on ${step.from}...`);
    try {
      await page.waitForSelector(pieceSelector, { timeout: 4000 });
    } catch {
      console.warn(`Timeout waiting for piece on ${step.from}. Diagnostics:`);
      const diagnostics = await page.evaluate(() => {
        const board = document.querySelector('.player-a');
        if (!board) return 'No board with selector .player-a found!';
        const squares = Array.from(board.querySelectorAll('[data-square]'));
        const pieces = squares.map(sq => {
          const piece = sq.querySelector('[data-piece]');
          return piece ? `${sq.getAttribute('data-square')}: ${piece.getAttribute('data-piece')}` : null;
        }).filter(Boolean);
        return `Squares found: ${squares.length}. Pieces found: ${pieces.length}. Placements: ${pieces.join(', ')}`;
      });
      console.log(diagnostics);
    }
    
    const fromEl = await page.waitForSelector(fromSelector);
    const toEl = await page.waitForSelector(toSelector);
    
    console.log(`Programmatically dragging from ${step.from} to ${step.to} using HTML5 events...`);
    await page.evaluate((fromSel, toSel) => {
      const source = document.querySelector(fromSel);
      const target = document.querySelector(toSel);
      if (!source || !target) {
        console.error('Could not find source or target element:', fromSel, toSel);
        return;
      }
      
      const piece = source.querySelector('[data-piece]');
      if (!piece) {
        console.error('Could not find piece inside square:', fromSel);
        return;
      }
      
      const dataTransfer = new DataTransfer();
      
      const dragstart = new DragEvent('dragstart', {
        bubbles: true,
        cancelable: true,
        dataTransfer
      });
      piece.dispatchEvent(dragstart);
      
      const dragenter = new DragEvent('dragenter', {
        bubbles: true,
        cancelable: true,
        dataTransfer
      });
      target.dispatchEvent(dragenter);
      
      const dragover = new DragEvent('dragover', {
        bubbles: true,
        cancelable: true,
        dataTransfer
      });
      target.dispatchEvent(dragover);
      
      const drop = new DragEvent('drop', {
        bubbles: true,
        cancelable: true,
        dataTransfer
      });
      target.dispatchEvent(drop);
      
      const dragend = new DragEvent('dragend', {
        bubbles: true,
        cancelable: true,
        dataTransfer
      });
      piece.dispatchEvent(dragend);
    }, fromSelector, toSelector);
    
    console.log('Move dispatched. Waiting for verification feedback...');
    await delay(1600); // Wait for the transition delay and animation
  }
  
  // 4. Verify Winner Screen / Podium Screen
  console.log('\n--- VERIFYING PODIUM SCREEN ---');
  await delay(1000); // additional buffer time
  
  // Check if PodiumScreen is displayed
  const hasPodium = await page.evaluate(() => {
    return !!document.querySelector('.text-gradient-gold') || document.body.innerText.includes('Победитель');
  });
  
  console.log('Podium screen visible:', hasPodium);
  
  const bodyText = await page.evaluate(() => document.body.innerText);
  if (bodyText.includes('Все задачи решены') || bodyText.includes('Победитель') || bodyText.includes('Новый турнир')) {
    console.log('SUCCESS: Podium screen is successfully displayed!');
  } else {
    throw new Error('FAILED: Podium screen not detected!');
  }
  
  await browser.close();
  console.log('=== BROWSER TEST PASSED SUCCESSFULLY ===');
}

runBrowserTest().catch((err) => {
  console.error('TEST FAILED:', err.message);
  process.exit(1);
});
