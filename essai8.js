/* Nouvelle organisation : accueil à trois portes, menu latéral, sac en perspective. */
const { chromium } = require('playwright');
const { allerVue } = require('./nav-essai');
const fs = require('fs');
const F = '/home/claude/polices/node_modules/@fontsource/';
const face = (fam, file, w) => `@font-face{font-family:"${fam}";font-weight:${w};src:url(data:font/woff2;base64,${fs.readFileSync(F + file).toString('base64')}) format("woff2");}`;
const POLICES = [face('Barlow Condensed', 'barlow-condensed/files/barlow-condensed-latin-600-normal.woff2', 600), face('Barlow Condensed', 'barlow-condensed/files/barlow-condensed-latin-700-normal.woff2', 700),
  face('Atkinson Hyperlegible', 'atkinson-hyperlegible/files/atkinson-hyperlegible-latin-400-normal.woff2', 400), face('Atkinson Hyperlegible', 'atkinson-hyperlegible/files/atkinson-hyperlegible-latin-700-normal.woff2', 700),
  face('Caveat', 'caveat/files/caveat-latin-700-normal.woff2', 700)].join('\n');
const MOY = { dr: 225, b3: 205, b5: 190, f4: 168, f5: 163, f6: 150, f7: 140, f8: 130, f9: 112, pw: 100 };
const LARGEURS = (process.env.LARGEURS || '390,360,390s,1280').split(',');
(async () => {
  const D = 'shots8'; fs.mkdirSync(D, { recursive: true });
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const res = {}, errs = [];
  for (const L of LARGEURS) {
    const sombre = L.endsWith('s'), w = parseInt(L, 10), h = w > 900 ? 860 : w === 360 ? 740 : 844, nom = L;
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, colorScheme: sombre ? 'dark' : 'light', hasTouch: w < 900 });
    const page = await ctx.newPage(); const r = res[nom] = {};
    page.on('pageerror', e => errs.push(nom + ' PAGEERROR ' + e.message));
    page.on('console', m => { if (m.type() === 'error' && !/fonts\.g|ERR_|Failed to load resource/.test(m.text())) errs.push(nom + ' CONSOLE ' + m.text()); });
    await page.goto('file://' + __dirname + '/dist/index.html');
    await page.addStyleTag({ content: POLICES }); await page.evaluate(() => document.fonts.ready);
    await page.click('[data-a="commencer"]'); await page.fill('#q-prenom', 'Benjamin'); await page.fill('#q-index', '18'); await page.click('[data-a="q-suite"]');
    await page.click('[data-k="objectif"][data-v="score"]'); await page.click('[data-a="q-suite"]');
    await page.click('[data-a="lieu"][data-v="practice"]');
    for (let i = 0; i < 8 && await page.locator('[data-a="q-suite"]').count(); i++) await page.click('[data-a="q-suite"]');
    await page.waitForSelector('.tete');
    r.apresQuestionnaire = await page.evaluate(() => location.hash + ' ' + document.getElementById('app').className);
    /* Aller au sac par le menu */
    const menu = async (v, s) => { await allerVue(page, v, s); await page.waitForTimeout(150); };
    await menu('sac');
    for (const [id, v] of Object.entries(MOY)) {
      await page.click(`#c-synthese [data-a="sac-fiche-club"][data-id="${id}"]`); if (!(await page.locator('#feuille').count())) await page.click('[data-a="sac-modifier"]');
      await page.fill('#sac-val', String(v)); await page.press('#sac-val', 'Enter'); await page.waitForSelector('#feuille', { state: 'detached' });
    }
    await page.evaluate(() => { const f = document.getElementById('fete'); if (f) f.hidden = true; const m = document.getElementById('message'); if (m) m.hidden = true; });
    await menu('accueil');
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${D}/${nom}-1-accueil.png` });
    await page.screenshot({ path: `${D}/${nom}-1b-accueil-long.png`, fullPage: true });
    r.portes = await page.$$eval('.golf-etiq', l => l.map(p => p.textContent));
    r.etiquettes = await page.evaluate(() => { const l = [...document.querySelectorAll('.golf-etiq')].map(e => e.getBoundingClientRect()); const o = []; l.forEach((a, i) => l.slice(i + 1).forEach((b, j) => { if (a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom) o.push(i + '-' + (i + j + 1)); })); return o.length ? 'CHEVAUCHEMENT ' + o.join(' ') : 'ok'; });
    r.debord = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    /* Barre des rubriques et recherche des fonctions */
    r.barre = await page.$$eval('#barre .barre-item', l => l.map(b => b.textContent + (b.getAttribute('aria-current') ? ' ●' : '') + (b.scrollWidth > b.clientWidth ? ' DÉBORDE' : '')).join(' | '));
    await page.click('.tete [data-a="recherche"]'); await page.waitForSelector('#recherche-q');
    r.rechercheFocus = await page.evaluate(() => document.activeElement.id);
    await page.fill('#recherche-q', 'wedge'); await page.dispatchEvent('#recherche-q', 'input');
    r.rechercheWedge = await page.$$eval('#recherche-l li:not([hidden]) .recherche-item', l => l.map(x => x.textContent).join(' | '));
    await page.screenshot({ path: `${D}/${nom}-2-recherche.png` });
    await page.keyboard.press('Escape'); await page.waitForTimeout(250);
    r.rechercheFermee = await page.locator('#recherche-q').count();
    /* Le sac : sortir un club */
    /* L'accueil « Mon jeu » (19/11) n'a plus l'étiquette du sac : on passe par la rubrique Mon sac. */
    if (await page.locator('.golf-etiq.e-sac').count()) await page.click('.golf-etiq.e-sac'); else await allerVue(page, 'sac');
    await page.waitForTimeout(300);
    /* V4-02 : plus de sac 3D ; le tableau ouvre directement la fiche du club. */
    r.sansSac3D = await page.locator('#sac-scene, .c3d').count();
    await page.screenshot({ path: `${D}/${nom}-3-sac.png` });
    await page.click('#c-synthese [data-a="sac-fiche-club"][data-id="dr"]'); await page.waitForSelector('#feuille');
    r.ficheDriver = await page.$eval('#feuille h2', x => x.textContent);
    await page.screenshot({ path: `${D}/${nom}-5-fiche.png` });
    await page.keyboard.press('Escape'); await page.waitForTimeout(250);
    /* Les autres pages par le menu */
    for (const [v, s] of [['parcours'], ['practice'], ['exercices', 'defis'], ['bilan', 'sg'], ['profil']]) {
      await menu(v, s); await page.waitForTimeout(250);
      r['page-' + v] = await page.evaluate(() => location.hash + ' · ' + document.querySelector('#vue h1').textContent.slice(0, 40));
      await page.screenshot({ path: `${D}/${nom}-6-${v}.png` });
    }
    /* Lancer une partie depuis l'accueil, puis le bouton flottant */
    await menu('accueil');
    if (await page.locator('.golf-etiq.e-parcours').count()) await page.click('.golf-etiq.e-parcours'); else await allerVue(page, 'parcours');
    await page.waitForTimeout(300);
    r.depart = await page.evaluate(() => location.hash + ' · ' + !!document.getElementById('dp-pc') + !!document.getElementById('dp-nom'));
    await ctx.close();
  }
  await browser.close();
  console.log(JSON.stringify(res, null, 1)); console.log('ERREURS', errs);
})();
