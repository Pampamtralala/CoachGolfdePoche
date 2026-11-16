/* Sac de golf dans l'appli : rendu à 390, 360, sombre et grand écran ; fiche, aperçu, composition. */
const { chromium } = require('playwright');
const fs = require('fs');
const F = '/home/claude/polices/node_modules/@fontsource/';
const face = (fam, file, w) => `@font-face{font-family:"${fam}";font-weight:${w};src:url(data:font/woff2;base64,${fs.readFileSync(F + file).toString('base64')}) format("woff2");}`;
const POLICES = [face('Barlow Condensed', 'barlow-condensed/files/barlow-condensed-latin-600-normal.woff2', 600), face('Barlow Condensed', 'barlow-condensed/files/barlow-condensed-latin-700-normal.woff2', 700),
  face('Atkinson Hyperlegible', 'atkinson-hyperlegible/files/atkinson-hyperlegible-latin-400-normal.woff2', 400), face('Atkinson Hyperlegible', 'atkinson-hyperlegible/files/atkinson-hyperlegible-latin-700-normal.woff2', 700),
  face('Caveat', 'caveat/files/caveat-latin-700-normal.woff2', 700)].join('\n');
const { allerVue } = require('./nav-essai');
const fiche = async (page, id) => { await page.click(`#sac-scene [data-id="${id}"]`); if (!(await page.locator('#feuille').count())) await page.click('[data-a="sac-modifier"]'); await page.waitForSelector('#feuille'); };
const MOY = { dr: 225, b3: 205, b5: 190, f4: 168, f5: 163, f6: 150, f7: 140, f8: 130, f9: 112, pw: 100 };
(async () => {
  const D = 'shots7'; fs.mkdirSync(D, { recursive: true });
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const res = {}, errs = [];
  for (const [w, h, sombre] of [[390, 844, false], [360, 740, false], [390, 844, true], [1200, 900, false]]) {
    const nom = w + (sombre ? '-sombre' : '');
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, colorScheme: sombre ? 'dark' : 'light', hasTouch: w < 500 });
    const page = await ctx.newPage();
    page.on('pageerror', e => errs.push(nom + ' PAGEERROR ' + e.message));
    page.on('console', m => { if (m.type() === 'error' && !/fonts\.g|ERR_|Failed to load resource/.test(m.text())) errs.push(nom + ' CONSOLE ' + m.text()); });
    await page.goto('file://' + __dirname + '/dist/index.html');
    await page.addStyleTag({ content: POLICES }); await page.evaluate(() => document.fonts.ready);
    await page.click('[data-a="commencer"]'); await page.fill('#q-prenom', 'Benjamin'); await page.fill('#q-index', '18'); await page.click('[data-a="q-suite"]');
    await page.click('[data-k="objectif"][data-v="score"]'); await page.click('[data-a="q-suite"]');
    await page.click('[data-a="lieu"][data-v="practice"]');
    for (let i = 0; i < 8 && await page.locator('[data-a="q-suite"]').count(); i++) await page.click('[data-a="q-suite"]');
    await page.waitForSelector('.tete .ident');
    await allerVue(page, 'sac');
    for (const [id, v] of Object.entries(MOY)) { await fiche(page, id); await page.fill('#sac-val', String(v)); await page.press('#sac-val', 'Enter'); await page.waitForSelector('#feuille', { state: 'detached' }); }
    await page.evaluate(() => { const f = document.getElementById('fete'); if (f) f.hidden = true; const m = document.getElementById('message'); if (m) m.hidden = true; });
    await page.evaluate(() => document.querySelector('.sac-carte').scrollIntoView({ block: 'start' }));
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${D}/${nom}-1-sac.png` });
    res[nom] = {
      largeur: await page.evaluate(() => document.documentElement.scrollWidth),
      debord: await page.evaluate(() => [...document.querySelectorAll('.c3d-tete')].filter(b => { const r = b.getBoundingClientRect(); return r.left < 0 || r.right > innerWidth; }).map(b => b.dataset.id)),
      chevauche: await page.evaluate(() => { const o = []; document.querySelectorAll('.sac-rang').forEach((r, ri) => { const l = [...r.querySelectorAll('.sac-etiq')].map(e => e.getBoundingClientRect()); l.forEach((a, i) => { if (l[i + 1] && a.right > l[i + 1].left + .5) o.push(ri + ':' + i); }); }); return o; }),
      alertes: await page.$$eval('#sac-scene .c3d.alerte .c3d-tete', l => l.map(b => b.dataset.id).join(' ')),
      score: await page.$eval('#sac-bilan .sac-score', x => x.textContent)
    };
    await page.evaluate(() => document.getElementById('sac-bilan').scrollIntoView({ block: 'start' })); await page.waitForTimeout(200);
    await page.screenshot({ path: `${D}/${nom}-2-bilan.png` });
    await page.evaluate(() => document.querySelector('.sac-carte').scrollIntoView({ block: 'start' }));
    await fiche(page, 'f5'); await page.waitForTimeout(350);
    await page.screenshot({ path: `${D}/${nom}-3-fiche.png` });
    await page.fill('#sac-val', '157'); await page.waitForTimeout(150);
    res[nom].apercu = await page.$$eval('#sac-voisins li', l => l.map(x => x.className + '|' + x.textContent).join(' / '));
    await page.screenshot({ path: `${D}/${nom}-4-apercu.png` });
    await page.click('.sac-balles summary'); await page.waitForTimeout(150);
    await page.evaluate(() => { const f = document.getElementById('feuille'); f.scrollTop = f.scrollHeight; });
    await page.screenshot({ path: `${D}/${nom}-5-fiche-bas.png` });
    await page.keyboard.press('Escape'); await page.waitForTimeout(250);
    res[nom].apresEchap = await page.$eval('#sac-scene .c3d.sel .c3d-bulle > span', x => x.textContent) + ' · feuille : ' + await page.locator('#feuille').count();
    await page.click('[data-a="sac-composer"]'); await page.waitForTimeout(350);
    await page.screenshot({ path: `${D}/${nom}-6-composer.png` });
    await page.keyboard.press('Escape');
    if (w === 390 && !sombre) {
      /* Sac parfaitement étagé : fête */
      for (const [id, v] of Object.entries({ f4: 175, f5: 162, f9: 118, pw: 106, sw: 94 })) { await fiche(page, id); await page.fill('#sac-val', String(v)); await page.press('#sac-val', 'Enter'); await page.waitForSelector('#feuille', { state: 'detached' }); }
      res.parfait = await page.$eval('#sac-bilan', x => x.textContent.replace(/\s+/g, ' ').slice(0, 90));
      res.fete = await page.$eval('#fete', x => x.hidden ? '' : x.textContent);
      await page.evaluate(() => document.querySelector('.sac-carte').scrollIntoView({ block: 'start' })); await page.waitForTimeout(300);
      await page.screenshot({ path: `${D}/${nom}-7-parfait.png` });
      /* Putter */
      await page.click('#sac-scene [data-id="putter"]'); res.putter = await page.$eval('#sac-info', x => x.textContent.replace(/\s+/g, ' '));
      await page.keyboard.press('Escape');
      /* Retirer un club */
      await fiche(page, 'b5'); await page.click('[data-a="sac-retirer"]');
      res.retire = await page.$$eval('#sac-scene .c3d-tete', l => l.map(b => b.dataset.id).join(' ')) + ' · ' + await page.textContent('#message');
      res.focusRetire = await page.evaluate(() => document.activeElement.getAttribute('data-a'));
    }
    await ctx.close();
  }
  await browser.close();
  console.log(JSON.stringify(res, null, 1)); console.log('ERREURS', errs);
})();
