const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:5173/');
  await page.waitForSelector('.setup-screen');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button.btn-primary'));
    const startBtn = btns.find(b => b.textContent.includes('Начать турнир'));
    if (startBtn) startBtn.click();
  });
  await page.waitForSelector('.board-block');
  await new Promise(r => setTimeout(r, 2000));
  
  const pieceInfo = await page.evaluate(() => {
    const sizer = document.querySelector('.board-sizer').getBoundingClientRect();
    const wp = document.querySelector('[data-piece="wP"]').getBoundingClientRect();
    const bp = document.querySelector('[data-piece="bP"]').getBoundingClientRect();
    return {
      sizer: { width: sizer.width, height: sizer.height, x: sizer.x, y: sizer.y },
      wp: { width: wp.width, height: wp.height, x: wp.x, y: wp.y },
      bp: { width: bp.width, height: bp.height, x: bp.x, y: bp.y }
    };
  });
  console.log(pieceInfo);
  await page.screenshot({path: 'debug-pieces.png'});
  await browser.close();
})();
