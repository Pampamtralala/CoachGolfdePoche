/* Composant autonome livrable/sac-de-golf-3d.html : sélection, bulle, saisie, aperçu, stockage. */
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const D = 'shots-sac3d'; fs.mkdirSync(D, { recursive: true });
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const res = {}, errs = [];
  for (const [w, sombre] of [[390, false], [360, false], [390, true], [900, false]]) {
    const nom = w + (sombre ? '-sombre' : '');
    const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, deviceScaleFactor: 2, colorScheme: sombre ? 'dark' : 'light', hasTouch: w < 500 });
    const page = await ctx.newPage(); const r = res[nom] = {};
    page.on('pageerror', e => errs.push(nom + ' PAGEERROR ' + e.message));
    page.on('console', m => { if (m.type() === 'error') errs.push(nom + ' CONSOLE ' + m.text()); });
    await page.goto('file://' + __dirname + '/livrable/sac-de-golf-3d.html');
    await page.evaluate(() => localStorage.clear()); await page.reload(); await page.waitForTimeout(300);
    await page.screenshot({ path: `${D}/${nom}-1.png`, fullPage: true });
    r.alertes = await page.$$eval('.c3d.alerte .c3d-tete', l => l.map(b => b.dataset.id).join(' '));
    r.debord = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    await page.click('.c3d-tete[data-id="fer5"]'); await page.waitForTimeout(600);
    r.sel = await page.$eval('.c3d.sel .c3d-bulle', x => x.textContent) + ' · ' + await page.$eval('.sdg-info', x => x.textContent.replace(/\s+/g, ' ').trim().slice(0, 110));
    r.pressed = await page.getAttribute('.c3d-tete[data-id="fer5"]', 'aria-pressed');
    await page.screenshot({ path: `${D}/${nom}-2-sel.png` });
    await page.click('.c3d-tete[data-id="fer5"]'); await page.waitForTimeout(300);
    r.modale = await page.$eval('.sdg-modale', d => d.open) + ' ' + await page.inputValue('#sdg-m-val');
    await page.fill('#sdg-m-val', '157'); await page.waitForTimeout(100);
    r.apercu = await page.$eval('.c3d.sel .c3d-bulle', x => x.textContent) + ' · ' + await page.$$eval('.sdg-modale .sdg-m-voisins li', l => l.map(x => x.className + '|' + x.textContent).join(' / '));
    await page.screenshot({ path: `${D}/${nom}-3-modale.png` });
    await page.click('.sdg-m-fermer'); await page.waitForTimeout(250);
    r.annule = await page.$eval('.c3d.sel .c3d-bulle', x => x.textContent);
    await page.click('[data-role="modifier"]'); await page.fill('#sdg-m-val', '156'); await page.press('#sdg-m-val', 'Enter'); await page.waitForTimeout(300);
    r.enregistre = await page.$eval('.c3d.sel .c3d-bulle', x => x.textContent) + ' · stockage ' + await page.evaluate(() => JSON.parse(localStorage.getItem('sdg.sac.v1')).find(c => c.id === 'fer5').distance);
    r.focus = await page.evaluate(() => document.activeElement.dataset.id);
    const b = await page.$eval('.s3d', e => { const r = e.getBoundingClientRect(); return [r.left + 6, r.top + 6]; });
    await page.mouse.click(b[0], b[1]); await page.waitForTimeout(300);
    r.vide = await page.$$eval('.c3d.sel', l => l.length) + ' · ' + await page.$eval('.sdg-info', x => x.textContent.trim());
    await page.click('.c3d-tete[data-id="putter"]'); await page.waitForTimeout(400);
    r.putter = await page.$eval('.sdg-info', x => x.textContent.trim()) + ' · bulle ' + await page.$eval('.c3d.sel .c3d-bulle', x => x.textContent);
    await page.click('.c3d-tete[data-id="putter"]'); r.putterModale = await page.$eval('.sdg-modale', d => d.open);
    await page.reload(); await page.waitForTimeout(200);
    r.persiste = await page.evaluate(() => JSON.parse(localStorage.getItem('sdg.sac.v1')).find(c => c.id === 'fer5').distance);
    await ctx.close();
  }
  await browser.close();
  console.log(JSON.stringify(res, null, 1)); console.log('ERREURS', errs);
})();
