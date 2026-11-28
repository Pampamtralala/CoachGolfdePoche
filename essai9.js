/* Wedges par loft : ajout depuis la composition du sac, loft précisé, changement de loft, matrice, sac en perspective. */
const { chromium } = require('playwright');
const fs = require('fs');
const { listeSac, reglagesClub, allerVue } = require('./nav-essai');
/* Toucher la partie visible d'une tête : la lame d'un fer ou d'un wedge est en haut à droite de sa boîte. */
const toucher = async (page, id) => { await reglagesClub(page, id); };
const F = '/home/claude/polices/node_modules/@fontsource/';
const face = (fam, file, w) => `@font-face{font-family:"${fam}";font-weight:${w};src:url(data:font/woff2;base64,${fs.readFileSync(F + file).toString('base64')}) format("woff2");}`;
const POLICES = [face('Barlow Condensed', 'barlow-condensed/files/barlow-condensed-latin-600-normal.woff2', 600), face('Barlow Condensed', 'barlow-condensed/files/barlow-condensed-latin-700-normal.woff2', 700),
  face('Atkinson Hyperlegible', 'atkinson-hyperlegible/files/atkinson-hyperlegible-latin-400-normal.woff2', 400), face('Atkinson Hyperlegible', 'atkinson-hyperlegible/files/atkinson-hyperlegible-latin-700-normal.woff2', 700), face('Manrope', 'manrope/files/manrope-latin-700-normal.woff2', 700), face('Manrope', 'manrope/files/manrope-latin-800-normal.woff2', 800)].join('\n');
(async () => {
  const D = 'shots9'; fs.mkdirSync(D, { recursive: true });
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const res = {}, errs = [], ko = [];
  const verifie = (c, m) => { if (!c) ko.push(m); };
  for (const [w, sombre] of [[390, false], [360, true]]) {
    const nom = w + (sombre ? 's' : ''), r = res[nom] = {};
    const ctx = await browser.newContext({ viewport: { width: w, height: 844 }, deviceScaleFactor: 2, colorScheme: sombre ? 'dark' : 'light', hasTouch: true });
    const page = await ctx.newPage();
    page.on('pageerror', e => errs.push(nom + ' PAGEERROR ' + e.message));
    page.on('console', m => { if (m.type() === 'error' && !/fonts\.g|ERR_|Failed to load resource/.test(m.text())) errs.push(nom + ' CONSOLE ' + m.text()); });
    await page.goto('file://' + __dirname + '/dist/index.html'); await page.addStyleTag({ content: POLICES }); await page.evaluate(() => document.fonts.ready);
    await page.click('[data-a="commencer"]'); await page.fill('#q-prenom', 'Benjamin'); await page.fill('#q-index', '18'); await page.click('[data-a="q-suite"]');
    await page.click('[data-k="objectif"][data-v="score"]'); await page.click('[data-a="q-suite"]'); await page.click('[data-a="lieu"][data-v="practice"]');
    for (let i = 0; i < 8 && await page.locator('[data-a="q-suite"]').count(); i++) await page.click('[data-a="q-suite"]');
    await page.waitForSelector('.tete');
    const lire = () => page.evaluate(() => JSON.parse(localStorage.getItem('coachgolf.v1')).carnet);
    await allerVue(page, 'sac');
    /* Composer : ajouter 52° en un toucher, 60° au clavier */
    await page.click('[data-a="sac-composer"]'); await page.waitForSelector('#feuille');
    r.lofts = await page.$$eval('#feuille [data-a="sac-wedge-ajout"]', l => l.map(b => b.textContent).join(' '));
    await page.click('#feuille [data-a="sac-wedge-ajout"][data-v="52"]');
    r.apres52 = await page.$$eval('#feuille fieldset:last-of-type .opt', l => l.map(b => b.textContent + (b.getAttribute('aria-pressed') === 'true' ? '✓' : '')).join(' | '));
    r.focus52 = await page.evaluate(() => document.activeElement.dataset.id);
    await page.fill('#sac-loft-neuf', '52'); await page.click('.sac-loft button[type="submit"]');
    r.doublon = await page.textContent('#sac-wedge-err');
    await page.fill('#sac-loft-neuf', '80'); await page.click('.sac-loft button[type="submit"]');
    r.horsBornes = await page.textContent('#sac-wedge-err');
    await page.fill('#sac-loft-neuf', '60'); await page.press('#sac-loft-neuf', 'Enter');
    await page.waitForTimeout(150);
    await page.screenshot({ path: `${D}/${nom}-1-composer.png`, fullPage: false });
    await page.evaluate(() => { const f = document.getElementById('feuille'); f.scrollTop = f.scrollHeight; });
    await page.screenshot({ path: `${D}/${nom}-1b-composer-bas.png` });
    let e = await lire();
    r.etat = JSON.stringify({ sac: e.sac, perso: e.wedgesPerso });
    verifie(JSON.stringify(e.wedgesPerso) === '[52,60]', 'wedges ajoutés : ' + JSON.stringify(e.wedgesPerso));
    verifie((e.sac || []).join(' ') === 'dr b3 b5 f4 f5 f6 f7 f8 f9 pw w52 sw w60', 'sac rangé par loft : ' + (e.sac || []).join(' '));
    /* Sac plein : on ne peut plus ajouter ; on fait de la place, puis un wedge ajouté sorti du sac sans mesure disparaît */
    r.plein = await page.$eval('#feuille .sac-plein', x => x.textContent) + ' · bloc ajout : ' + await page.locator('.sac-ajout-wedge').count();
    await page.click('#feuille [data-a="sac-basculer"][data-id="f4"]');
    await page.fill('#sac-loft-neuf', '64'); await page.press('#sac-loft-neuf', 'Enter'); await page.waitForTimeout(100);
    await page.click('#feuille [data-a="sac-basculer"][data-id="w64"]');
    r.apres64 = await page.$$eval('#feuille fieldset:last-of-type .opt', l => l.map(b => b.textContent).join(' | '));
    await page.click('#feuille [data-a="sac-basculer"][data-id="f4"]');
    e = await lire(); verifie(JSON.stringify(e.wedgesPerso) === '[52,60]', 'wedge 64° oublié : ' + JSON.stringify(e.wedgesPerso));
    await page.click('#f-fermer'); await page.waitForSelector('#feuille', { state: 'detached' });
    await listeSac(page); r.scene = await page.$$eval('#c-synthese [data-a="sac-fiche-club"]', l => l.map(b => b.dataset.id).join(' '));
    /* Distances, puis loft précisé sur le sand wedge */
    for (const [id, v] of [['pw', 102], ['w52', 90], ['sw', 78], ['w60', 64]]) {
      await toucher(page, id); if (!(await page.locator('#feuille').count())) await page.click('[data-a="sac-modifier"]');
      await page.fill('#sac-val', String(v)); await page.press('#sac-val', 'Enter'); await page.waitForSelector('#feuille', { state: 'detached' });
    }
    await toucher(page, 'sw'); if (!(await page.locator('#feuille').count())) await page.click('[data-a="sac-modifier"]');
    r.ficheSW = await page.$eval('#feuille', x => x.textContent.replace(/\s+/g, ' ').slice(0, 170));
    await page.fill('#sac-loft-club', '52'); await page.click('.sac-loft button[type="submit"]');
    r.conflit = await page.textContent('#sac-loft-err');
    await page.fill('#sac-loft-club', '56'); await page.press('#sac-loft-club', 'Enter'); await page.waitForTimeout(150);
    r.titreSW = await page.textContent('#f-titre');
    await page.screenshot({ path: `${D}/${nom}-2-fiche-sw.png` });
    await page.click('#f-fermer'); await page.waitForSelector('#feuille', { state: 'detached' });
    /* Changer le loft du wedge 52° en 50° : ses mesures le suivent */
    await toucher(page, 'w52'); if (!(await page.locator('#feuille').count())) await page.click('[data-a="sac-modifier"]');
    await page.fill('#sac-loft-club', '50'); await page.press('#sac-loft-club', 'Enter'); await page.waitForTimeout(150);
    r.titreW50 = await page.textContent('#f-titre');
    e = await lire();
    verifie(e.references && e.references.w50 === 90 && e.references.w52 == null, 'référence déplacée : ' + JSON.stringify(e.references));
    verifie(JSON.stringify(e.wedgesPerso) === '[50,60]' && e.lofts.sw === 56 && e.sac.includes('w50') && !e.sac.includes('w52'), 'loft changé : ' + JSON.stringify(e));
    await page.click('#f-fermer'); await page.waitForSelector('#feuille', { state: 'detached' });
    r.ecarts = await page.$$eval('#sac-bilan .sac-ecarts li', l => l.map(x => x.querySelector('.sac-paire').textContent + ' ' + x.querySelector('.sac-val').textContent).slice(-4).join(' | '));
    await page.click('[data-a="sac-onglet"][data-v="wedges"]'); r.matrice = await page.$$eval('#c-wedges tbody th', l => l.map(x => x.textContent).join(' | '));
    await page.screenshot({ path: `${D}/${nom}-3-sac.png` });
    await page.waitForTimeout(200);
    await page.screenshot({ path: `${D}/${nom}-4-matrice.png` });
    /* Matrice : saisir une distance pour le wedge 60° */
    await page.fill('#w-w60-a2', '45'); await page.press('#w-w60-a2', 'Tab'); await page.waitForTimeout(150);
    e = await lire(); verifie(e.wedges.w60 && e.wedges.w60.a2 === 45, 'matrice w60 : ' + JSON.stringify(e.wedges));
    /* Rechargement : tout persiste */
    await page.reload(); await page.waitForSelector('.tete'); await allerVue(page, 'sac');
    await listeSac(page); r.apresRechargement = await page.$$eval('#c-synthese [data-a="sac-fiche-club"]', l => l.map(b => b.dataset.id).join(' '));
    verifie(r.apresRechargement.includes('w50') && r.apresRechargement.includes('w60'), 'persistance : ' + r.apresRechargement);
    await ctx.close();
  }
  await browser.close();
  console.log(JSON.stringify({ res, ko, errs }, null, 1));
})().catch(e => { console.error('ECHEC', String(e.stack || e.message).split('\n').slice(0, 30).join('\n')); process.exit(1); });
