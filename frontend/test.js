import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

  await page.goto('http://localhost:5173/');
  
  // click "Use Test Pattern Instead"
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const testPatternBtn = btns.find(b => b.innerText.includes('Use Test Pattern'));
    if (testPatternBtn) testPatternBtn.click();
  });

  await new Promise(r => setTimeout(r, 2000));
  await browser.close();
})();
