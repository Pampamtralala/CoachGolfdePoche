/* Essai à l'écran : accueil du jour, onglets, bilan replié, graphiques au doigt, gestes, tampon, grand écran. */
const { chromium } = require('playwright');
const sharp = require('sharp');
const fs = require('fs');
const E = require('./src/engine-plus.js');
const F = '/home/claude/polices/node_modules/@fontsource/';
const face = (fam, file, w) => `@font-face{font-family:"${fam}";font-weight:${w};font-style:normal;src:url(data:font/woff2;base64,${fs.readFileSync(F + file).toString('base64')}) format("woff2");}`;
const POLICES = [
  face('Barlow Condensed', 'barlow-condensed/files/barlow-condensed-latin-600-normal.woff2', 600),
  face('Barlow Condensed', 'barlow-condensed/files/barlow-condensed-latin-700-normal.woff2', 700),
  face('Atkinson Hyperlegible', 'atkinson-hyperlegible/files/atkinson-hyperlegible-latin-400-normal.woff2', 400),
  face('Atkinson Hyperlegible', 'atkinson-hyperlegible/files/atkinson-hyperlegible-latin-700-normal.woff2', 700),
  face('Caveat', 'caveat/files/caveat-latin-700-normal.woff2', 700)
].join('\n');
const CLE = 'coachgolf.v1';
const canon = o => JSON.stringify(o, (k, v) => (v && typeof v === 'object' && !Array.isArray(v) ? Object.keys(v).sort().reduce((a, c) => (a[c] = v[c], a), {}) : v));
const sansVolatil = e => { const c = JSON.parse(JSON.stringify(e)); delete c.maj; if (c.profil) delete c.profil.indexTexte; return canon(c); };
const fmt = v => (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toFixed(1).replace('.', ',');

/* Parcours d'essai : pars, et une partie type que l'on fait varier. */
const PARS = [4, 5, 3, 4, 4, 3, 5, 4, 4, 4, 4, 3, 5, 4, 4, 4, 3, 5];
function partieType(graine) {
  let g = graine; const alea = () => (g = (g * 16807) % 2147483647) / 2147483647;
  return PARS.map((par, i) => {
    let j = alea() < 0.65 ? 1 : 0, gr = alea() < 0.25 ? 1 : 0, p = alea() < 0.2 ? 3 : alea() < 0.25 ? 1 : 2, x = 0, extra = alea() < 0.3 ? 1 : 0;
    if (i === 3) { j = 0; gr = 0; x = alea() < 0.8 ? 2 : 1; extra = 1; }          /* trou 4 : pénalités */
    if (i === 11) { gr = 0; extra = 1 + (alea() < 0.5 ? 1 : 0); }                  /* trou 12 : par 3 jamais touché */
    if (i === 15) { p = alea() < 0.8 ? 3 : 4; }                                    /* trou 16 : putts */
    if (gr) extra = 0;
    const s = par - 2 + (gr ? 0 : 1) + p + x + extra;
    const cote = j ? 0 : (alea() < 0.75 ? 3 : alea() < 0.5 ? 1 : 2), club = par === 3 ? 0 : (i % 5 === 1 ? 2 : 1);
    const p1 = gr ? (alea() < 0.5 ? 4 : 3) : (alea() < 0.4 ? 2 : alea() < 0.5 ? 3 : 1);
    return [j, gr, p, x, s, par, cote, club, p ? p1 : 0];
  });
}

const { allerVue, menuAction, lirePave, saisirTrou, trouPave } = require('./nav-essai');
/* Valeurs d'un graphique lues dans sa description (canvas aria-label). */
const valeursGraphe = (page, sel) => page.$eval(sel, c => c.getAttribute('aria-label').replace(/\.$/, '').split(' : ').slice(1).join(' : ').split(' ; ').map(x => x.replace(/^.*? (?=[+−]?\d+,\d|non mesuré)/, '')).join(' '));

(async () => {
  const sombre = !!process.env.SOMBRE, dossier = process.env.DOSSIER || 'shots5';
  fs.mkdirSync(dossier, { recursive: true });
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, colorScheme: sombre ? 'dark' : 'light', hasTouch: true });
  const page = await ctx.newPage();
  const errs = [], res = {}, ko = [];
  const verifie = (cond, msg) => { if (!cond) ko.push(msg); };
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.g|ERR_|Failed to load resource/.test(m.text())) errs.push('CONSOLE ' + m.text()); });
  const polices = async () => {
    await page.addStyleTag({ content: POLICES });
    await page.evaluate(() => Promise.all(['600 20px "Barlow Condensed"', '700 20px "Barlow Condensed"', '400 17px "Atkinson Hyperlegible"', '700 17px "Atkinson Hyperlegible"', '700 30px "Caveat"'].map(f => document.fonts.load(f))));
    await page.addStyleTag({ content: 'body.capture #onglets{display:none}' });
  };
  const ouvrir = async () => { await page.goto('file://' + __dirname + '/dist/index.html'); await polices(); };
  const recharger = async () => { await page.reload(); await polices(); };
  const lire = () => page.evaluate(k => JSON.parse(localStorage.getItem(k)), CLE);
  const ecrire = e => page.evaluate(([k, v]) => localStorage.setItem(k, v), [CLE, JSON.stringify(e)]);
  const onglet = async n => { await allerVue(page, n); };
  const largeur = () => page.evaluate(() => document.documentElement.scrollWidth);
  const vue = n => page.screenshot({ path: `${dossier}/${n}.png` });
  const long = async (n, max) => {
    await page.evaluate(() => document.body.classList.add('capture'));
    const buf = await page.screenshot({ fullPage: true });
    await page.evaluate(() => document.body.classList.remove('capture'));
    const meta = await sharp(buf).metadata(), H = 1760, nb = Math.min(max || 4, Math.ceil(meta.height / H));
    for (let i = 0; i < nb; i++) await sharp(buf).extract({ left: 0, top: i * H, width: meta.width, height: Math.min(H, meta.height - i * H) }).toFile(`${dossier}/${n}-${i + 1}.png`);
  };
  /* Capture toute la hauteur d'un élément défilant (fiche ou écran de partie). */
  const haut = async (sel, n, max) => {
    const el = page.locator(sel);
    const dims = await el.evaluate(x => ({ h: x.scrollHeight, c: x.clientHeight }));
    const nb = Math.min(max || 3, Math.ceil(dims.h / dims.c));
    await page.waitForTimeout(350);
    for (let i = 0; i < nb; i++) { await el.evaluate((x, y) => { x.scrollTop = y; }, i * dims.c); await page.waitForTimeout(60); await vue(`${n}-${i + 1}`); }
    await el.evaluate(x => { x.scrollTop = 0; });
  };
  const P = '#calque-partie ';
  const pt = (k, v) => page.click(`${P}[data-a="pt-set"][data-k="${k}"][data-v="${v}"]`);
  const scoreAffiche = async () => (await page.textContent(P + '.pv-score .main')) + ' ' + await page.textContent(P + '.pv-score small');

  const glisser = (sel, dx, dy) => page.evaluate(([sel, dx, dy]) => {
    const el = document.querySelector(sel), r = el.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + Math.min(r.height / 2, 200);
    const tch = (cx, cy) => new Touch({ identifier: 1, target: el, clientX: cx, clientY: cy });
    el.dispatchEvent(new TouchEvent('touchstart', { bubbles: true, touches: [tch(x, y)], changedTouches: [tch(x, y)] }));
    el.dispatchEvent(new TouchEvent('touchmove', { bubbles: true, touches: [tch(x + dx / 2, y + dy / 2)], changedTouches: [tch(x + dx / 2, y + dy / 2)] }));
    el.dispatchEvent(new TouchEvent('touchmove', { bubbles: true, touches: [tch(x + dx, y + dy)], changedTouches: [tch(x + dx, y + dy)] }));
    el.dispatchEvent(new TouchEvent('touchend', { bubbles: true, touches: [], changedTouches: [tch(x + dx, y + dy)] }));
  }, [sel, dx, dy]);
  /* Touche un élément d'un graphique Chart.js et lit l'infobulle affichée. */
  const toucherGraphe = (sel, ds, i) => page.evaluate(([sel, ds, i]) => {
    const cv = document.querySelector(sel), ch = Chart.getChart(cv), el = ch.getDatasetMeta(ds).data[i], r = cv.getBoundingClientRect();
    const x = r.left + el.x, y = r.top + el.y - (el.height ? 0 : 0);
    const tch = new Touch({ identifier: 7, target: cv, clientX: x, clientY: y });
    cv.dispatchEvent(new TouchEvent('touchstart', { bubbles: true, cancelable: true, touches: [tch], changedTouches: [tch] }));
    return new Promise(res => setTimeout(() => {
      const tt = ch.tooltip;
      res(tt && tt.opacity > 0 ? [].concat(tt.title || [], ...(tt.body || []).map(b => b.lines), tt.afterBody || []).join(' | ') : 'aucune infobulle');
    }, 450));
  }, [sel, ds, i]);
  const fete = async () => (await page.locator('#fete .fete').count()) ? (await page.textContent('#fete .fete-tampon')) + ' | ' + await page.textContent('#fete .fete-texte') : 'aucun';

  /* ---- Profil ---- */
  await ouvrir();
  await page.click('[data-a="commencer"]');
  await page.fill('#q-prenom', 'Benjamin'); await page.fill('#q-index', '18');
  await page.click('[data-a="q-suite"]');
  await page.click('[data-k="objectif"][data-v="score"]'); await page.click('[data-a="q-suite"]');
  for (const l of ['practice', 'putting', 'zone', 'sable', 'parcours', 'maison']) await page.click(`[data-a="lieu"][data-v="${l}"]`);
  await page.click('[data-a="q-suite"]'); await page.click('[data-a="q-suite"]'); await page.click('[data-a="q-suite"]');
  await page.click('[data-a="defaut"][data-v="slice"]');
  for (let i = 0; i < 4 && await page.locator('[data-a="q-suite"]').count(); i++) await page.click('[data-a="q-suite"]');
  await page.waitForSelector('.tete .ident');

  /* ---- Bilan replié, sur téléphone ---- */
  res.apresQuestionnaire = await page.evaluate(() => location.hash);
  res.une = await page.$$eval('.une > p', l => l.map(x => x.textContent));
  res.plis = await page.$$eval('.pli', l => l.map(x => x.id + ':' + (x.classList.contains('ouvert') ? 'ouvert' : 'replié') + ':' + (x.querySelector('.pli-resume') || {}).textContent).join(' | '));
  res.sommaire = await page.$$eval('#menu [data-v="bilan"]', l => l.map(x => x.textContent).join(' '));
  res.hauteurBilan = await page.evaluate(() => document.documentElement.scrollHeight);
  await vue('40-bilan-replie');
  await allerVue(page, 'bilan', 'defauts');
  res.sommaireOuvre = await page.$eval('#defauts', x => x.classList.contains('ouvert') + ' · haut à ' + Math.round(x.getBoundingClientRect().top) + ' px');
  await vue('41-bilan-defauts');
  await page.click('[data-a="pli"][data-v="defauts"]');
  res.pliReferme = await page.$eval('#defauts', x => x.classList.contains('ouvert'));
  await allerVue(page, 'bilan', 'carte'); /* UX06 : la carte est dans Performance générale */
  if (!(await page.$eval('#carte', x => x.classList.contains('ouvert')))) await page.click('[data-a="pli"][data-v="carte"]');
  res.commentCarte = await page.$$eval('#carte details.comment summary', l => l.map(x => x.textContent).join('|'));
  res.onglets = await page.$$eval('#menu .menu-titre', l => l.map(b => b.textContent.trim() + (b.scrollWidth > b.clientWidth ? ' DÉBORDE' : '') + (b.querySelector('svg') ? '' : ' SANS ICÔNE')).join(' | '));

  /* ---- Aujourd'hui, sans partie ---- */
  await allerVue(page, 'accueil');
  res.jourTitre = await page.textContent('h1');
  res.jourCartes = await page.$$eval('.golf-etiq, .en-bref', l => l.map(x => x.className + ' : ' + x.textContent.replace(/\s+/g, ' ').trim().slice(0, 140)));
  res.ongletJour = await page.evaluate(() => location.hash);
  await long('42-jour-vide', 2);
  /* L'accueil « Mon jeu » (19/11) ne montre plus la séance du jour : elle est dans Progresser. */
  if (await page.locator('#vue [data-a="voir-seance"]').count()) await page.click('#vue [data-a="voir-seance"]'); else await allerVue(page, 'practice');
  res.voirSeance = (await page.evaluate(() => location.hash)) + ' · ' + await page.textContent('h1');
  res.avancementPlan = await page.$$eval('.avancement p', l => l.map(x => x.textContent).join(' | '));
  /* Séance faite : le tampon, puis la semaine bouclée */
  await page.click('[data-a="fait"][data-id="c1-s1-1"]');
  res.feteSeance = await fete();
  await page.waitForTimeout(700); await vue('43-fete-seance');
  res.messagePosition = await page.evaluate(() => { const f = document.getElementById('fete').getBoundingClientRect(); return 'bas du tampon ' + Math.round(f.bottom) + ' · bas de l’écran ' + innerHeight; });
  await page.click('#fete .fete');
  await page.click('[data-a="fait"][data-id="c1-s1-2"]');
  res.feteSemaine = await fete(); await page.click('#fete .fete');
  await page.click('[data-a="fait"][data-id="c1-s1-2"]');
  res.feteAnnulation = await fete();
  await page.click('[data-a="fait"][data-id="c1-m1"]').catch(() => {}); res.feteMission = await fete(); await page.click('#fete .fete').catch(() => {});
  res.avancementApres = await page.$$eval('.avancement p', l => l.map(x => x.textContent).join(' | ')) + ' · segments : ' + await page.$$eval('.avancement .avance:first-of-type span', l => l.map(x => (x.className ? '■' : '□')).join(''));
  await page.evaluate(() => window.scrollTo(0, 0)); await vue('44-plan-avancement');

  /* ---- Exercice noté : message en bas, record ---- */
  await page.click('[data-a="exo"][data-id="dr_fairway"]');
  await page.fill('#sc-val', '4'); await page.click('#feuille form button[type="submit"]');
  res.messageBas = await page.evaluate(() => { const m = document.getElementById('message'), r = m.getBoundingClientRect(); return (m.hidden ? 'caché' : m.textContent) + ' · haut à ' + Math.round(r.top) + ' px sur ' + innerHeight; });
  await page.fill('#sc-val', '6'); await page.click('#feuille form button[type="submit"]');
  res.feteRecord = await fete(); await page.click('#fete .fete');
  await page.fill('#sc-val', '5'); await page.click('#feuille form button[type="submit"]');
  res.pasDeRecord = await fete();
  res.chiffresNets = await page.evaluate(() => getComputedStyle(document.querySelector('#feuille .histo .marque')).fontFamily.split(',')[0] + ' · tampon : ' + getComputedStyle(document.querySelector('.tampon') || document.body).fontFamily.split(',')[0]);
  /* Touche retour : ferme la fiche */
  const avantRetour = await page.evaluate(() => location.hash);
  await page.goBack(); await page.waitForTimeout(150);
  res.retourFiche = 'fiche : ' + await page.locator('#feuille').count() + ' · onglet : ' + (await page.evaluate(() => location.hash)) + ' · adresse ' + avantRetour + ' → ' + await page.evaluate(() => location.hash);
  /* Glisser vers le bas : ferme la fiche ; un petit glissement la laisse ouverte */
  await page.click('[data-a="exo"][data-id="dr_fairway"]'); await page.waitForTimeout(300);
  await glisser('#feuille', 0, 60);
  const petit = await page.locator('#feuille').count();
  await glisser('#feuille', 0, 180);
  res.glisserFiche = 'après 60 px : ' + petit + ' fiche · après 180 px : ' + await page.locator('#feuille').count() + ' fiche';
  /* Fiche puis dialogue : retour ferme le dialogue, puis la fiche */
  await allerVue(page, 'profil');
  res.profilEnTete = (await page.textContent('h1')) + ' · en-tête actif : ' + await page.$eval('.tete .ident', b => b.getAttribute('aria-current'));
  await page.click('[data-a="exporter"]');
  await page.goBack(); await page.waitForTimeout(150);
  res.retourDialogue = 'dialogue : ' + await page.locator('.dialogue').count() + ' · vue : ' + await page.textContent('h1');

  /* ---- Parties : bande des scores, écran clair, glissement, record ---- */
  await menuAction(page, 'partie-rapide');
  res.boutonPartie = (await page.evaluate(() => location.hash)) + ' · formulaire : ' + await page.locator('.depart').count();
  await page.fill('#dp-nom', 'Golf des Essais'); await page.click('[data-a="pt-nouvelle"]');
  await page.waitForSelector(P + '.partie');
  res.bande0 = await page.$$eval(P + '.pt-bande button', l => l.length + ' cases · ' + l.filter(b => b.disabled).length + ' inactives');
  await saisirTrou(page, [1, 1, 1, 0, 4, 5, 0, 0, 0], false);
  await glisser('#calque-partie .partie', -160, 6); await page.waitForTimeout(100);
  res.glisserSuivant = await page.textContent('#pt-titre');
  await glisser('#calque-partie .partie', 12, 160);
  res.glisserVertical = await page.textContent('#pt-titre');
  await page.click(P + '[data-a="pv-penal"][data-d="1"]'); await page.click(P + '[data-a="pv-penal"][data-d="1"]'); await page.click('#pt-suiv'); await page.click('#pt-suiv');
  await glisser('#calque-partie .partie', 170, -4); await page.waitForTimeout(100);
  res.glisserPrecedent = await page.textContent('#pt-titre');
  res.bande = await page.$$eval(P + '.pt-bande button', l => l.slice(0, 5).map(b => b.textContent + ':' + b.className.trim() + (b.disabled ? ':inactif' : '')).join(' | '));
  await page.click(P + '.pt-bande button[data-v="0"]');
  res.allerTrou1 = (await page.textContent('#pt-titre')) + ' · score ' + await page.textContent(P + '.pv-score .main');
  await page.click(P + '.pt-bande button[data-v="3"]');
  res.allerTrou4 = await page.textContent('#pt-titre');
  await vue('45-saisie-bande');
  await page.click(P + '[data-a="pt-theme"]');
  res.ecranClair = await page.evaluate(() => { const p = document.querySelector('.partie'); return p.className + ' · fond ' + getComputedStyle(p).backgroundColor + ' · texte ' + getComputedStyle(p).color; });
  await vue('46-saisie-claire');
  res.titreOnglet = await page.$eval('#barre [data-v="parcours"]', b => b.textContent.trim());
  /* Retour du téléphone : ferme l'écran de partie, la partie reste en cours */
  await page.goBack(); await page.waitForTimeout(150);
  res.retourPartie = 'écran : ' + await page.locator(P + '.partie').count() + ' · en cours : ' + !!(await lire()).partie;
  await allerVue(page, 'accueil');
  res.jourEnCours = await page.$$eval('.golf-etiq.vif', l => l.map(x => x.textContent).join(''));
  await menuAction(page, 'partie-rapide');
  res.reprise = await page.textContent('#pt-titre');
  await page.click(P + '[data-a="pt-fermer"]'); await allerVue(page, 'carnet'); await page.click('[data-a="pt-abandonner"]'); await page.click('.dialogue [data-a="pt-ok-abandon"]');

  /* Parties enregistrées : sept sur le même parcours */
  let e = await lire();
  const id = e.parcours[0].id, jours = n => new Date(Date.now() - n * 864e5).toISOString();
  e.parcours[0].pars = PARS.slice();
  e.parties = [21, 22, 23, 24, 25, 26].map((g, i) => ({ d: jours(44 - i * 7), trous: partieType(g), pc: id, o: 0 }));
  e.maj += 1; await ecrire(e); await recharger();
  res.accueilParDefaut = (await page.evaluate(() => location.hash)) + ' · ' + await page.textContent('h1');
  res.jourCartesPlein = await page.$$eval('.golf-etiq, .en-bref', l => l.map(x => x.className + ' : ' + x.textContent.replace(/\s+/g, ' ').trim().slice(0, 160)));
  res.largeurJour = await largeur();
  await long('47-jour', 2);
  /* Une meilleure partie : le tampon « record » */
  e = await lire();
  e.partie = { d: jours(0), n: 18, i: 17, pc: id, o: 0, trous: PARS.map(par => [1, 1, 2, 0, par, par, 0, 0, 0]) };
  e.maj += 1; await ecrire(e); await recharger();
  await page.waitForSelector(P + '.partie'); await page.click('#pt-suiv');
  await page.waitForSelector('.partie.express'); res.express = res.express || await page.$$eval('.xp-points li b', l => l.map(x => x.textContent).join(' | ')); await page.click('[data-a="pt-express-chiffres"]'); await page.waitForSelector('.partie.bilan');
  res.recordPartie = await page.textContent('.partie.bilan h2');
  await vue('48-bilan-record');
  await page.click(P + '[data-a="pt-voir-sg"]');
  res.voirAnalyse = (await page.evaluate(() => location.hash)) + ' · objectifs ouverts : ' + await page.$eval('#sg', x => x.classList.contains('ouvert'));

  /* ---- Graphiques au doigt ---- */
  await page.evaluate(() => document.querySelector('#sg .graphe-cj').scrollIntoView({ block: 'center' })); await page.waitForTimeout(900);
  res.detailSecteur = await toucherGraphe('#sg canvas', 0, 3);
  res.sgDescription = await page.$eval('#sg canvas', c => c.getAttribute('aria-label'));
  await vue('49-graphe-detail');
  res.unePlein = await page.$$eval('.une > p', l => l.map(x => x.textContent));
  res.resumes = await page.$$eval('.pli-resume', l => l.map(x => x.textContent).join(' | '));
  await page.evaluate(() => window.scrollTo(0, 0)); await vue('50-bilan-une');
  await allerVue(page, 'carnet');
  await page.click('[data-a="pc-ouvrir"]'); await page.waitForTimeout(300);
  await page.waitForTimeout(900);
  res.detailTrou = await toucherGraphe('#feuille canvas', 0, 3);
  await vue('51-parcours-detail');
  await page.keyboard.press('Escape');
  res.aidesCarnet = await page.$$eval('#vue details.comment summary', l => l.map(x => x.textContent).join(' | '));
  res.texteCarnet = await page.$$eval('#vue > section > p, #vue > section > .aide', l => l.map(x => x.textContent.slice(0, 60)));
  await long('52-carnet', 3);

  /* ---- Défi : niveau validé, record ---- */
  await allerVue(page, 'exercices');
  await page.click('[data-a="defi"][data-id="onze"]');
  for (let i = 0; i < 3; i++) await page.click('#feuille [data-a="defi-coup"][data-v="1"]');
  await page.click('#feuille [data-a="defi-coup"][data-v="0"]');
  res.fetePremierEssai = await fete();
  for (let i = 0; i < 4; i++) await page.click('#feuille [data-a="defi-coup"][data-v="1"]');
  await page.click('#feuille [data-a="defi-coup"][data-v="0"]');
  res.feteRecordDefi = await fete(); await page.click('#fete .fete');
  for (let i = 0; i < 5; i++) await page.click('#feuille [data-a="defi-coup"][data-v="1"]');
  res.feteNiveau = await fete();
  await page.waitForTimeout(700); await vue('53-fete-defi');
  await page.click('#fete .fete'); await page.keyboard.press('Escape');

  /* ---- Petit écran ---- */
  await page.setViewportSize({ width: 360, height: 740 });
  await recharger();
  const l360 = {};
  for (const o of ['jour', 'plan', 'bilan', 'exercices', 'carnet', 'profil']) { await allerVue(page, o); l360[o] = await largeur(); }
  res.largeurs360 = l360;
  res.onglets360 = await page.$$eval('.tete > *', l => l.map(b => (b.scrollWidth > b.clientWidth + 1 ? b.textContent.trim() + ' DÉBORDE' : 'ok')).join(' '));
  res.entete360 = await page.$eval('.tete', h => h.scrollWidth + '/' + h.clientWidth + ' · ' + Math.round(h.getBoundingClientRect().height) + ' px de haut');
  await allerVue(page, 'accueil'); await vue('54-jour-360');
  await allerVue(page, 'bilan'); await vue('55-bilan-360');

  /* ---- Grand écran : deux colonnes, tout ouvert ---- */
  await page.setViewportSize({ width: 1200, height: 900 });
  await recharger();
  await allerVue(page, 'bilan');
  res.large = await page.evaluate(() => {
    const cols = Array.from(document.querySelectorAll('.colonnes > .col')).map(c => Math.round(c.getBoundingClientRect().left) + '+' + Math.round(c.getBoundingClientRect().width));
    return { colonnes: cols.join(' | '), plisOuverts: document.querySelectorAll('.pli.ouvert').length + '/' + document.querySelectorAll('.pli').length, boutonsPli: document.querySelectorAll('.pli-tete').length, sommaire: document.querySelectorAll('.sommaire').length, largeur: document.documentElement.scrollWidth };
  });
  await page.screenshot({ path: `${dossier}/56-bilan-large.png` });
  await allerVue(page, 'accueil');
  res.jourLarge = await page.$$eval('.golf-etiq', l => l.map(x => Math.round(x.getBoundingClientRect().left)).join(' '));
  await page.screenshot({ path: `${dossier}/57-jour-large.png` });
  await page.setViewportSize({ width: 390, height: 844 }); await page.waitForTimeout(200);
  res.retourEtroit = await page.evaluate(() => document.querySelectorAll('.golf-etiq').length + ' cartes · largeur ' + document.documentElement.scrollWidth);
  await allerVue(page, 'bilan');
  res.plisEtroit = await page.$$eval('.pli-tete', l => l.length);

  console.log(JSON.stringify({ res, ko, errs }, null, 1));
  await browser.close();
})().catch(e => { console.error('ECHEC', String(e.stack || e.message).split('\n').filter(l => !/retrying|waiting|scrolling|stable/.test(l)).slice(0, 14).join('\n')); process.exit(1); });
