/* P03 : trois niveaux de saisie (express, standard, expert), mise en jeu en trois états (non renseignée / jouable / ratée),
   changement de niveau sans perte, partie terminée complétée après coup. */
const { chromium } = require('playwright');
const fs = require('fs');
const E = require('./src/engine-plus.js');
const CLE = 'coachgolf.v1', P = '#calque-partie ';
(async () => {
  const D = 'shots17'; fs.mkdirSync(D, { recursive: true });
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const res = {}, errs = [], ko = [];
  const verifie = (c, m) => { if (!c) ko.push(m); };
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  const vue = n => page.screenshot({ path: `${D}/${n}.png` });
  const lire = () => page.evaluate(k => JSON.parse(localStorage.getItem(k)), CLE);
  const r = res;
  await page.goto('file://' + __dirname + '/dist/index.html');
  await page.click('[data-a="commencer"]'); await page.fill('#q-prenom', 'Benjamin'); await page.fill('#q-index', '18'); await page.click('[data-a="q-suite"]');
  await page.click('[data-k="objectif"][data-v="score"]'); await page.click('[data-a="q-suite"]');
  for (const l of ['practice', 'putting', 'parcours']) await page.click(`[data-a="lieu"][data-v="${l}"]`);
  for (let i = 0; i < 8 && await page.locator('[data-a="q-suite"]').count(); i++) await page.click('[data-a="q-suite"]');
  await page.waitForSelector('.tete');
  /* Jouer : trois niveaux proposés */
  await page.click('#barre [data-a="onglet"][data-v="parcours"]');
  r.modes = await page.$$eval('.modes .mode b', l => l.map(x => x.textContent).join(' | '));
  verifie(r.modes === 'Express | Standard | Expert', 'trois niveaux : ' + r.modes);
  await page.click('.cta-partie'); await page.fill('#dp-nom', 'Golf de Test'); await page.click('[data-a="pt-nouvelle"]'); await page.waitForSelector(P + '.pave');
  /* Express : score, putts, pénalités ; pas de mise en jeu */
  r.express = await page.evaluate(() => ['.pv-score', '.pv-putts', '.pv-penal', '.pv-mej', '.pv-gir', '.pv-coups', '.pv-evit', '.pv-plus'].map(s => s + (document.querySelector('#calque-partie ' + s) ? '✓' : '✗')).join(' '));
  verifie(r.express === '.pv-score✓ .pv-putts✓ .pv-penal✓ .pv-mej✗ .pv-gir✗ .pv-coups✗ .pv-evit✗ .pv-plus✗', 'express : ' + r.express);
  r.boutonsMode = await page.$$eval(P + '.pv-mode button', l => l.map(b => b.textContent + (b.getAttribute('aria-pressed') === 'true' ? '●' : '')).join(' '));
  await vue('01-express');
  await page.click('#pt-suiv');   /* trou 1 noté en express */
  /* Standard : mise en jeu non renseignée par défaut, club de départ, GIR déduit ; pas de coups */
  await page.click(P + '[data-a="mode-saisie"][data-v="standard"]');
  r.standard = await page.evaluate(() => ['.pv-mej', '.pv-gir', '.pv-coups', '.pv-evit', '.pv-plus'].map(s => s + (document.querySelector('#calque-partie ' + s) ? '✓' : '✗')).join(' '));
  r.mejVide = await page.$$eval(P + '.pv-mej [aria-pressed="true"]', l => l.length);
  verifie(r.standard === '.pv-mej✓ .pv-gir✓ .pv-coups✗ .pv-evit✗ .pv-plus✗' && r.mejVide === 0, 'standard : ' + r.standard + ' · enfoncés : ' + r.mejVide);
  await page.click(P + '[data-a="pv-mej"][data-v="j"]');
  r.jouable = await page.$$eval(P + '.pv-mej [aria-pressed="true"]', l => l.map(b => b.dataset.v).join());
  await page.click(P + '[data-a="pv-mej"][data-v="j"]');
  r.annule = await page.$$eval(P + '.pv-mej [aria-pressed="true"]', l => l.length);
  verifie(r.jouable === 'j' && r.annule === 0, 'second appui : retour à « non renseignée »');
  await page.click(P + '[data-a="pv-mej"][data-v="r"]');
  await page.click(P + '[data-a="pt-set"][data-k="6"][data-v="1"]');
  await page.click(P + '[data-a="pt-set"][data-k="7"][data-v="1"]');
  await vue('02-standard');
  let e = await lire();
  r.trou2 = JSON.stringify({ t: e.partie.trous[1].slice(0, 8), rens: e.partie.renseigne[1], rens1: e.partie.renseigne[0] });
  verifie(e.partie.trous[1][0] === 0 && e.partie.trous[1][6] === 1 && e.partie.trous[1][7] === 1 && e.partie.renseigne[1] === 3 && e.partie.renseigne[0] === 0, 'trou 2 : ratée à gauche, driver, renseigné ; trou 1 (express) non renseigné : ' + r.trou2);
  /* Expert : tout ; retour en express : rien de perdu */
  await page.click(P + '[data-a="mode-saisie"][data-v="detail"]');
  r.expert = await page.evaluate(() => ['.pv-mej', '.pv-coups', '.pv-evit', '.pv-plus', '.pv-sjc'].map(s => s + (document.querySelector('#calque-partie ' + s) ? '✓' : '✗')).join(' '));
  verifie(/pv-mej✓ .pv-coups✓ .pv-evit✓ .pv-plus✓/.test(r.expert), 'expert : ' + r.expert);
  await page.click(P + '[data-a="mode-saisie"][data-v="express"]');
  e = await lire();
  verifie(e.modeSaisie === 'express' && e.partie.trous[1][6] === 1 && e.partie.renseigne[1] === 3, 'retour en express : données gardées');
  await page.click(P + '[data-a="mode-saisie"][data-v="standard"]');
  r.retrouve = await page.$$eval(P + '.pv-mej [aria-pressed="true"]', l => l.map(b => b.dataset.v).join());
  verifie(r.retrouve === 'r', 'de nouveau en standard : « ratée » retrouvée');
  await page.click('#pt-suiv');
  /* Reprise d'une partie interrompue */
  await page.reload(); await page.waitForSelector('.tete');
  e = await lire();
  verifie(e.partie && e.partie.i === 2 && e.modeSaisie === 'standard' && e.partie.renseigne[1] === 3, 'reprise après rechargement');
  await page.waitForTimeout(300); if (!(await page.locator(P + '.pave').count())) await page.click('[data-a="pt-reprendre"]'); await page.waitForSelector(P + '.pave');
  /* Fin de partie en express, 9 trous */
  await page.click(P + '[data-a="mode-saisie"][data-v="express"]');
  for (let i = 0; i < 20 && await page.locator(P + '.pave').count(); i++) await page.click('#pt-suiv');
  if (await page.locator('[data-a="ok-terminer"], [data-a="pt-ok-terminer"]').count()) await page.click('[data-a="ok-terminer"], [data-a="pt-ok-terminer"]');
  await page.waitForSelector('.partie.express, .partie.bilan');
  e = await lire();
  const pt = e.parties[0];
  r.partie = JSON.stringify({ n: pt.trous.length, rens: pt.renseigne, id: pt.id });
  const MJ = E.misesEnJeu(pt.trous, pt.renseigne);
  verifie(e.parties.length === 1 && pt.renseigne && MJ.n === 1 && MJ.ratees === 1 && MJ.inconnues === E.misesEnJeu(pt.trous).n - 1, 'partie enregistrée : une seule mise en jeu renseignée, les autres inconnues : ' + JSON.stringify(MJ));
  /* Carte : « ? » pour les mises en jeu non renseignées */
  await page.click(P + '[data-a="pt-bilan-fermer"]');
  await page.click('#barre [data-a="onglet"][data-v="accueil"]');
  await page.click('.carte-tb.derniere'); await page.waitForSelector('#feuille .carte-score.trous');
  r.stat = (await page.textContent('#feuille dl.stats div')).replace(/\s+/g, ' ');
  r.dep = await page.$$eval('#feuille .carte-score.trous tbody tr:not(.total) td:nth-child(4)', l => l.map(x => x.textContent.trim().slice(0, 1)).join(''));
  verifie(/Mises en jeu jouables\s*0\/1/.test(r.stat) && /non renseignées/.test(r.stat) && (r.dep.match(/\?/g) || []).length === MJ.inconnues, 'carte : ' + r.stat + ' · ' + r.dep);
  await vue('03-carte');
  /* Compléter la partie après coup */
  await page.click('[data-a="pt-editer"]'); await page.waitForSelector(P + '.pave');
  r.edition = (await page.textContent(P + '.pv-corps')).includes('Tu complètes une partie déjà enregistrée');
  await page.click(P + '[data-a="mode-saisie"][data-v="standard"]');
  await page.click(P + '[data-a="pv-mej"][data-v="j"]');   /* trou 1 : jouable */
  /* Fermer sans terminer : l'originale ne bouge pas */
  await page.click(P + '[data-a="pt-fermer"]');
  e = await lire();
  verifie(r.edition && e.parties.length === 1 && e.parties[0].renseigne[0] === 0 && e.partie && e.partie.edition && e.partie.renseigne[0] === 1, 'édition en cours : originale intacte');
  await page.reload(); await page.waitForSelector('.tete');
  e = await lire(); verifie(e.partie && e.partie.edition === true, 'édition conservée au rechargement');
  await page.waitForTimeout(300); if (!(await page.locator(P + '.pave').count())) await page.click('[data-a="pt-reprendre"]'); await page.waitForSelector(P + '.pave');
  for (let i = 0; i < 20 && await page.locator(P + '.pave').count(); i++) await page.click('#pt-suiv');
  await page.waitForSelector('.partie.express, .partie.bilan');
  e = await lire();
  r.apres = JSON.stringify({ n: e.parties.length, id: e.parties[0].id, rens0: e.parties[0].renseigne[0], t0: e.parties[0].trous[0][0] });
  verifie(e.parties.length === 1 && e.parties[0].id === pt.id && e.parties[0].renseigne[0] === 1 && e.parties[0].trous[0][0] === 1 && !e.partie, 'partie complétée : remplacée à sa place, sans doublon : ' + r.apres);
  r.largeur = await page.evaluate(() => document.documentElement.scrollWidth);
  verifie(r.largeur === 390, 'pas de débordement : ' + r.largeur);
  console.log(JSON.stringify({ res, ko, errs }, null, 1));
  await browser.close();
})().catch(e => { console.error('ECHEC', String(e.stack || e.message).split('\n').filter(l => !/retrying|waiting|scrolling|stable/.test(l)).slice(0, 10).join('\n')); process.exit(1); });
