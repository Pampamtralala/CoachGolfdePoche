/* Captures de contrôle : accueil de départ, questionnaire, fiche défaut, conditions, exercices, profil, distances, grand écran. */
const { chromium } = require('playwright');
const fs = require('fs');
const F = '/home/claude/polices/node_modules/@fontsource/';
const face = (fam, file, w) => `@font-face{font-family:"${fam}";font-weight:${w};src:url(data:font/woff2;base64,${fs.readFileSync(F + file).toString('base64')}) format("woff2");}`;
const POLICES = [face('Barlow Condensed', 'barlow-condensed/files/barlow-condensed-latin-600-normal.woff2', 600), face('Barlow Condensed', 'barlow-condensed/files/barlow-condensed-latin-700-normal.woff2', 700),
  face('Atkinson Hyperlegible', 'atkinson-hyperlegible/files/atkinson-hyperlegible-latin-400-normal.woff2', 400), face('Atkinson Hyperlegible', 'atkinson-hyperlegible/files/atkinson-hyperlegible-latin-700-normal.woff2', 700),
  face('Caveat', 'caveat/files/caveat-latin-700-normal.woff2', 700)].join('\n');
const { listeSac, pageClub, reglagesClub, allerVue, menuAction } = require('./nav-essai');
(async () => {
  const sombre = !!process.env.SOMBRE, D = process.env.DOSSIER || 'shots6';
  fs.mkdirSync(D, { recursive: true });
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, colorScheme: sombre ? 'dark' : 'light' });
  const page = await ctx.newPage();
  const errs = [], res = {};
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.g|ERR_|Failed to load resource/.test(m.text())) errs.push('CONSOLE ' + m.text()); });
  const polices = async () => { await page.addStyleTag({ content: POLICES }); await page.evaluate(() => document.fonts.ready); };
  const vue = async n => { await page.waitForTimeout(450); await page.screenshot({ path: `${D}/${n}.png` }); };
  await page.goto('file://' + __dirname + '/dist/index.html'); await polices();
  await vue('60-depart');
  await page.click('[data-a="commencer"]'); await vue('61-questionnaire');
  await page.fill('#q-prenom', 'Benjamin'); await page.fill('#q-index', '18'); await page.click('[data-a="q-suite"]');
  await page.click('[data-k="objectif"][data-v="score"]'); await vue('62-objectif');
  await page.click('[data-a="q-suite"]');
  for (const l of ['practice', 'putting', 'zone', 'parcours', 'maison']) await page.click(`[data-a="lieu"][data-v="${l}"]`);
  await page.click('[data-a="q-suite"]'); await vue('63-coups');
  await page.click('[data-a="q-suite"]'); await page.click('[data-a="q-suite"]');
  await page.click('[data-a="defaut"][data-v="slice"]'); await page.click('[data-a="defaut"][data-v="putt_dosage_s"]');
  for (let i = 0; i < 4 && await page.locator('[data-a="q-suite"]').count(); i++) await page.click('[data-a="q-suite"]');
  await page.waitForSelector('.tete .ident');
  /* Fiche défaut plein écran, puis un exercice ouvert depuis elle, puis retour */
  await allerVue(page, 'bilan', 'defauts'); await vue('64-defauts');
  await allerVue(page, 'bilan', 'defauts'); /* UX06 : défauts dans la rubrique Erreurs */
  res.carteDefaut = await page.$eval('.defaut', x => x.textContent.replace(/\s+/g, ' ').slice(0, 200));
  await page.click('.defaut [data-a="defaut-fiche"]');
  res.fichePlein = await page.$eval('#feuille', f => f.classList.contains('plein') + ' · ' + Math.round(f.getBoundingClientRect().top) + ' px · ' + f.querySelectorAll('.cause').length + ' causes');
  await vue('65-fiche-defaut');
  await page.click('#feuille .cause .puce');
  res.exoDepuisFiche = await page.textContent('#f-titre');
  await page.keyboard.press('Escape');
  res.retourFiche = (await page.locator('#feuille.plein').count()) + ' fiche défaut · ' + await page.textContent('#f-titre');
  await page.keyboard.press('Escape');
  res.ferme = await page.locator('#feuille').count();
  /* Conditions du jour */
  await allerVue(page, 'jour'); await page.waitForTimeout(1300); await vue('66-jour');
  /* Depuis l'accueil « Mon jeu » (19/11), les conditions du jour s'ouvrent par la recherche des fonctions. */
  if (await page.locator('#vue [data-a="cond-ouvrir"]').count()) await page.click('#vue [data-a="cond-ouvrir"]'); else await menuAction(page, 'cond-ouvrir');
  await vue('67-conditions-vide');
  await page.click('[data-a="cond"][data-k="vent"][data-v="3"]'); await page.click('[data-a="cond"][data-k="temp"][data-v="1"]');
  res.conseils = await page.$$eval('#feuille .constats li', l => l.map(x => x.textContent));
  await vue('68-conditions');
  await page.keyboard.press('Escape'); await page.waitForTimeout(1300);
  res.tuile = await page.locator('[data-a="cond-ouvrir"]').count() ? await page.$eval('[data-a="cond-ouvrir"]', b => b.textContent.replace(/\s+/g, ' ')) : 'tuile retirée de l\'accueil (19/11)';
  await vue('69-jour-conditions');
  res.etatConditions = await page.evaluate(() => JSON.parse(localStorage.getItem('coachgolf.v1')).conditions);
  /* Exercices, profil, distances */
  await allerVue(page, 'exercices'); await vue('70-exercices');
  await page.click('[data-a="exo"][data-id="dr_porte"]'); await vue('71-fiche-exo');
  await page.keyboard.press('Escape');
  await allerVue(page, 'profil'); await vue('72-profil');
  await allerVue(page, 'distances');
  for (const [c, v] of [['dr', [210, 220, 200]], ['f7', [148, 152, 150]], ['f9', [122]], ['sw', [70]]]) {
    await reglagesClub(page, c);
    await page.fill('#sac-val', String(Math.round(v.reduce((a, b) => a + b, 0) / v.length))); await page.press('#sac-val', 'Enter'); await page.waitForSelector('#feuille', { state: 'detached' }); await listeSac(page);
  }
  await page.click('[data-a="sac-onglet"][data-v="wedges"]'); 
  for (const [w, a, v] of [['sw', 'a1', 30], ['sw', 'a2', 45], ['gw', 'a2', 62], ['pw', 'a3', 92]]) { await page.fill(`#w-${w}-${a}`, String(v)); await page.dispatchEvent(`#w-${w}-${a}`, 'change'); }
  await page.click('[data-a="sac-onglet"][data-v="distances"]'); await page.evaluate(() => window.scrollTo(0, 0)); await vue('73-distances');
  await page.click('[data-a="sac-onglet"][data-v="wedges"]'); await page.evaluate(() => document.getElementById('graph-wedges').scrollIntoView({ block: 'center' })); await vue('74-wedges');
  res.ticks = await page.evaluate(() => Array.from(document.querySelectorAll('canvas')).map(c => { const ch = Chart.getChart(c); return ch.scales.x.ticks.map(t => t.label).filter(Boolean).join(',') + ' rot ' + ch.scales.x.labelRotation; }));
  /* Jauge du cycle, animation terminée */
  await allerVue(page, 'plan');
  for (const id of ['c1-s1-1', 'c1-s1-2']) await page.click(`[data-a="fait"][data-id="${id}"]`);
  await page.click('#fete .fete').catch(() => {});
  await allerVue(page, 'jour'); await page.waitForTimeout(1600);
  res.jauge = await page.locator('.golf-etiq.e-practice').count() ? await page.$eval('.golf-etiq.e-practice', c => c.textContent) : 'jauge retirée de l\'accueil (19/11)';
  await page.screenshot({ path: `${D}/76-jauge.png`, clip: { x: 0, y: 300, width: 390, height: 280 } });
  /* Grand écran */
  await page.setViewportSize({ width: 1200, height: 860 }); await page.waitForTimeout(200);
  await allerVue(page, 'jour'); await page.waitForTimeout(1300); await page.screenshot({ path: `${D}/75-jour-large.png` });
  res.largeur = await page.evaluate(() => document.documentElement.scrollWidth);
  console.log(JSON.stringify({ res, errs }, null, 1));
  await browser.close();
})().catch(e => { console.error('ECHEC', String(e.stack || e.message).split('\n').slice(0, 8).join('\n')); process.exit(1); });
