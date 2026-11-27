/* Roadmap UX V4 : mesure du texte visible (caractères et mots) sur les écrans principaux, à 390 px, avec un carnet
   type (12 parties, un parcours, un sac mesuré). Même jeu de données à chaque mesure, pour comparer avant / après.
   Usage : node mesure-texte.js [fichier-de-sortie.json] */
const { chromium } = require('playwright');
const fs = require('fs');
const CLE = 'coachgolf.v1';
const PARS = [4, 4, 3, 5, 4, 4, 3, 5, 4];
(async () => {
  const sortie = process.argv[2] || 'mesures-ux/texte.json';
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const page = await (await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, reducedMotion: 'reduce' })).newPage();
  await page.goto('file://' + __dirname + '/dist/index.html');
  await page.click('[data-a="ac-sans-index"]'); await page.click('.carnet-form button[type="submit"]'); await page.waitForSelector('.tete');
  const partie = (i, m) => ({ id: 'p_mt' + (100 + i), d: new Date(Date.UTC(2026, 5, 1) + i * 7 * 864e5).toISOString(), o: 0, pc: 'p1', renseigne: PARS.map(() => 7),
    trous: PARS.map((p, k) => { const t = [1, 1, 2, 0, p, p, 0, 0, 0, 0, 0]; if (k === 1) { t[0] = 0; t[1] = 0; t[6] = 3; t[4] += 1; } if (m && k === 2) { t[2] = 3; t[4] += 1; } return t; }) });
  const e = await page.evaluate(k => JSON.parse(localStorage.getItem(k)), CLE);
  e.profil.sansIndex = false; e.profil.index = 24.6; e.parcours = [{ id: 'p1', nom: 'La Jonchère', pars: PARS }];
  e.parties = Array.from({ length: 12 }, (_, i) => partie(i, i >= 6)); e.carnet = e.carnet || {}; e.carnet.sac = ['dr', 'b3', 'f7', 'f8', 'pw'];
  e.carnet.clubs = { dr: [205, 210, 215], f7: [135, 137, 140] }; e.maj = Date.now();
  await page.evaluate(([k, v]) => localStorage.setItem(k, JSON.stringify(v)), [CLE, e]);
  await page.reload(); await page.waitForSelector('.tete');
  const mesure = () => page.evaluate(() => {
    const vue = document.querySelector('#vue'), w = document.createTreeWalker(vue, NodeFilter.SHOW_TEXT); let c = 0, m = 0;
    while (w.nextNode()) { const n = w.currentNode, p = n.parentElement, s = n.textContent.replace(/\s+/g, ' ').trim();
      if (!s || !p || p.closest('.vh, [hidden], details:not([open]) > :not(summary)')) continue;
      const r = p.getBoundingClientRect(); if (!r.width || getComputedStyle(p).visibility === 'hidden') continue;
      c += s.length; m += s.split(' ').length; }
    return { caracteres: c, mots: m, hauteur: document.documentElement.scrollHeight };
  });
  const res = { date: new Date().toISOString().slice(0, 10), largeur: 390, ecrans: {} };
  for (const [nom, v] of [['accueil', 'accueil'], ['analyses-performance', 'bilan'], ['jouer', 'parcours'], ['sac', 'sac'], ['journal', 'journal']]) {
    const b = await page.$(`#barre [data-v="${v}"]`); if (!b) continue;
    await b.click(); await page.waitForTimeout(80); res.ecrans[nom] = await mesure();
  }
  /* V4-04 : quelques rubriques d'analyse en plus (KPI, aides). */
  for (const [r, fam] of [['mej', 'secteurs'], ['putting', 'secteurs'], ['comprendre', 'comprendre']]) {
    await page.click('#barre [data-v="bilan"]'); await page.waitForTimeout(60);
    const f = await page.$(`[data-a="famille"][data-v="${fam}"]`); if (f) { await f.click(); await page.waitForTimeout(60); }
    const c = await page.$(`[data-a="rubrique"][data-v="${r}"]`);
    if (c) { await c.click(); await page.waitForTimeout(80); } else if (r !== fam) continue; res.ecrans['analyses-' + r] = await mesure();
  }
  fs.writeFileSync(sortie, JSON.stringify(res, null, 1));
  console.log(JSON.stringify(res));
  await browser.close();
})().catch(e => { console.log('ECHEC', e.message); process.exit(1); });
