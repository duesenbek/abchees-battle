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
  
  const innerHtml = await page.evaluate(() => {
    const el = document.querySelector('[data-piece="wP"]');
    return el ? el.innerHTML : 'not found';
  });
  console.log('wP innerHTML:', innerHtml);
  
  const computedStyle = await page.evaluate(() => {
     const svg = document.querySelector('[data-piece="wP"] svg');
     if (!svg) return 'no svg';
     const style = window.getComputedStyle(svg);
     return {
       display: style.display,
       visibility: style.visibility,
       opacity: style.opacity,
       width: style.width,
       height: style.height,
       fill: style.fill,
       color: style.color
     };
  });
  console.log('wP SVG style:', computedStyle);
  await browser.close();
})();
