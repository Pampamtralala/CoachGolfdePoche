/* Refonte : barre des cinq rubriques, recherche, tableau de bord d'accueil, chiffres clés, coaching (progression, badges,
   historique), historique des mesures, modes de saisie (express et détaillé), état de la sauvegarde. */
const { chromium } = require('playwright');
const fs = require('fs');
const { allerVue, menuAction, saisirTrou } = require('./nav-essai');
const F = '/home/claude/polices/node_modules/@fontsource/';
const face = (fam, file, w) => `@font-face{font-family:"${fam}";font-weight:${w};src:url(data:font/woff2;base64,${fs.readFileSync(F + file).toString('base64')}) format("woff2");}`;
const POLICES = [face('Barlow Condensed', 'barlow-condensed/files/barlow-condensed-latin-600-normal.woff2', 600), face('Barlow Condensed', 'barlow-condensed/files/barlow-condensed-latin-700-normal.woff2', 700),
  face('Atkinson Hyperlegible', 'atkinson-hyperlegible/files/atkinson-hyperlegible-latin-400-normal.woff2', 400), face('Atkinson Hyperlegible', 'atkinson-hyperlegible/files/atkinson-hyperlegible-latin-700-normal.woff2', 700),
  face('Manrope', 'manrope/files/manrope-latin-700-normal.woff2', 700), face('Manrope', 'manrope/files/manrope-latin-800-normal.woff2', 800)].join('\n');
const CLE = 'coachgolf.v1';
function partie(g, pars) {
  let s0 = g; const al = () => (s0 = (s0 * 16807) % 2147483647) / 2147483647;
  return pars.map((par, k) => { const gir = al() < 0.3 ? 1 : 0, putts = al() < 0.2 ? 3 : al() < 0.2 ? 1 : 2, pen = al() < 0.08 ? 1 : 0; const s = par - 2 + (gir ? 0 : 1) + putts + pen + (al() < 0.3 ? 1 : 0);
    return [pen ? 0 : 1, s - putts <= par - 2 ? 1 : 0, putts, pen, s, par, pen ? 1 : 0, par === 3 ? 0 : 1, gir ? 4 : 2, 0, 0]; });
}
(async () => {
  const D = 'shots12'; fs.mkdirSync(D, { recursive: true });
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const res = {}, errs = [], ko = [];
  const verifie = (c, m) => { if (!c) ko.push(m); };
  for (const [w, h, sombre] of [[390, 844, false], [360, 760, true], [1280, 860, false]]) {
    const nom = w + (sombre ? 's' : ''), r = res[nom] = {};
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: w > 900 ? 1 : 2, colorScheme: sombre ? 'dark' : 'light', hasTouch: w < 900, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    page.on('pageerror', e => errs.push(nom + ' PAGEERROR ' + e.message));
    page.on('console', m => { if (m.type() === 'error' && !/fonts\.g|ERR_|Failed to load resource/.test(m.text())) errs.push(nom + ' CONSOLE ' + m.text()); });
    const vue = n => page.screenshot({ path: `${D}/${nom}-${n}.png` });
    const lire = () => page.evaluate(k => JSON.parse(localStorage.getItem(k)), CLE);
    const ecrire = e => page.evaluate(([k, e]) => localStorage.setItem(k, JSON.stringify(e)), [CLE, e]);
    const recharger = async () => { await page.reload(); await page.addStyleTag({ content: POLICES }); await page.evaluate(() => document.fonts.ready); };
    const largeur = () => page.evaluate(() => document.documentElement.scrollWidth);
    await page.goto('file://' + __dirname + '/dist/index.html'); await page.addStyleTag({ content: POLICES }); await page.evaluate(() => document.fonts.ready);
    await page.click('[data-a="commencer"]'); await page.fill('#q-prenom', 'Benjamin'); await page.fill('#q-index', '18'); await page.click('[data-a="q-suite"]');
    await page.click('[data-k="objectif"][data-v="score"]'); await page.click('[data-a="q-suite"]');
    for (const l of ['practice', 'putting', 'parcours']) await page.click(`[data-a="lieu"][data-v="${l}"]`);
    for (let i = 0; i < 8 && await page.locator('[data-a="q-suite"]').count(); i++) await page.click('[data-a="q-suite"]');
    await page.waitForSelector('.tete');
    let e = await lire();
    r.indexHistDepart = JSON.stringify(e.indexHist);
    verifie(e.indexHist.length === 1 && e.indexHist[0].v === 18, nom + ' index noté au départ : ' + r.indexHistDepart);
    /* Données réelles de joueur : parties, mesures, séances, historique d'index */
    const pars = [4, 4, 3, 5, 4, 4, 3, 4, 5, 4, 4, 3, 4, 5, 4, 3, 4, 5], j = n => new Date(Date.now() - n * 864e5).toISOString();
    e.parties = [1, 2, 3, 4, 5, 6, 7, 8].map((g, i) => ({ d: j(60 - i * 7), trous: partie(g * 13, pars), o: 0 }));
    Object.assign(e.carnet.clubs, { dr: [215, 220, 205, 225, 210], f6: [152, 155, 158, 150, 157], f7: [142, 146, 144, 148, 140, 145], f8: [134, 136, 131, 138, 135], pw: [110, 112, 108, 111, 109], sw: [86, 90, 88] });
    e.carnet.series = [{ d: j(10), c: 'f7', v: [142, 146, 144, 148, 140], l: [2, -4, 0, 5, -1] }];
    e.indexHist = [{ d: j(90), v: 19.4 }, { d: j(45), v: 18.7 }, { d: j(5), v: 18 }];
    e.fait = { 'c1-s1-1': true, 'c1-s1-2': true };
    e.defis = { vingt: { niv: 1, essais: 3, coups: 0, ok: 0, record: 17, hist: [{ d: j(3), v: 17, s: 48 }], temps: 48 } };
    e.maj += 1; await ecrire(e); await recharger();

    /* ---- Accueil ---- */
    r.barre = await page.$$eval('#barre .barre-item', l => l.map(b => b.textContent + (b.getAttribute('aria-current') ? ' ●' : '')).join(' | '));
    verifie(/^Accueil ● \| Performance \| Jouer \| Sac \| Activité$/.test(r.barre), nom + ' barre : ' + r.barre);
    r.statut = await page.textContent('#statut-tete');
    /* Accueil « Mon jeu » (UX04) : performance, indicateurs clés, enseignements, dernière partie, actions rapides. */
    r.accueil = (await page.textContent('.mon-jeu h1')).replace(/\s+/g, ' ').trim() + ' · ' + await page.$$eval('#vue .acces-rapides button', l => l.map(b => b.textContent.trim()).join(' | '));
    r.cartes = await page.$$eval('#vue h2', l => l.map(x => x.textContent));
    verifie(/^Mon jeu/.test(r.accueil) && /Nouvelle partie|Reprendre/.test(r.accueil) && r.cartes.includes('Dernière partie') && r.cartes.includes('Performance générale') && r.cartes.includes('Indicateurs clés'), nom + ' accueil Mon jeu : ' + r.accueil + ' · ' + r.cartes.join(' | '));
    await vue('01-accueil');
    await page.evaluate(() => document.querySelector('#mj-kpi').scrollIntoView({ block: 'start' })); await page.waitForTimeout(80);
    await vue('02-tableau-de-bord');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await page.waitForTimeout(80);
    await vue('02b-tableau-bas');
    r.largeurAccueil = await largeur();
    r.deborde = await page.evaluate(w => Array.from(document.querySelectorAll('#vue *')).filter(x => x.getBoundingClientRect().right > w + 1).slice(0, 4).map(x => x.tagName + '.' + x.className + ' ' + Math.round(x.getBoundingClientRect().right)).join(' | '), w);
    verifie(r.largeurAccueil <= w, nom + ' accueil sans débordement : ' + r.largeurAccueil + ' · ' + r.deborde);
    /* Dernière partie : la carte s'ouvre */
    await page.click('.carte-tb.derniere'); await page.waitForSelector('#feuille .carte-score');
    await page.keyboard.press('Escape'); await page.waitForSelector('#feuille', { state: 'detached' });

    /* ---- Statistiques ---- */
    await allerVue(page, 'bilan');
    r.kpi = await page.$$eval('.kpi', l => l.map(x => x.querySelector('.kpi-t').textContent + ' ' + x.querySelector('.kpi-v').textContent));
    verifie(r.kpi.length >= 5 && r.kpi.every(x => /\d/.test(x)), nom + ' chiffres clés : ' + r.kpi.join(' | '));
    r.reco = await page.$$eval('.kpi-r', l => l.length);
    r.evolIndex = await page.locator('.evol-index .courbe-index path').count();
    await page.click('[data-a="st-derniers"][data-v="10"]');
    r.fenetre10 = await page.textContent('.stats-echantillon');
    verifie(/Sur \d+ parties/.test(r.fenetre10), nom + ' filtre 10 parties : ' + r.fenetre10);
    await page.evaluate(() => window.scrollTo(0, 0)); await vue('03-statistiques');
    r.largeurStats = await largeur(); verifie(r.largeurStats <= w, nom + ' statistiques sans débordement');

    /* ---- Coaching (dans Analyses) ---- */
    await allerVue(page, 'practice');
    r.progression = await page.textContent('.progression');
    r.badges = await page.$$eval('.badge', l => l.map(x => (x.classList.contains('obtenu') ? '✓ ' : '· ') + x.querySelector('b').textContent));
    const obtenus = r.badges.filter(x => x[0] === '✓').map(x => x.slice(2));
    verifie(obtenus.includes('Première partie') && obtenus.includes('Habitué') && obtenus.includes('Au practice') && obtenus.includes('Défi relevé') && !obtenus.includes('Cycle bouclé'), nom + ' badges calculés : ' + r.badges.join(', '));
    r.historique = await page.$$eval('#historique li', l => l.map(x => x.textContent.replace(/\s+/g, ' ').trim()));
    await vue('04-progresser');
    await page.evaluate(() => document.getElementById('badges').scrollIntoView()); await page.waitForTimeout(80); await vue('05-badges');
    await page.click('#vue [data-a="onglet"][data-v="exercices"]');
    r.exercicesBarre = (await page.$$eval('#barre [aria-current="page"]', l => l.length)) + ' · profil ' + await page.locator('.tete .ident[aria-current="page"]').count();
    verifie(r.exercicesBarre === '0 · profil 1', nom + ' exercices rangés sous le profil (coaching) : ' + r.exercicesBarre);
    await page.click('#vue .retour'); r.retour = await page.evaluate(() => location.hash);

    /* ---- Mon sac ---- */
    await allerVue(page, 'sac');
    r.historiqueMesures = await page.$$eval('#c-historique li', l => l.map(x => x.textContent.replace(/\s+/g, ' ').trim()));
    verifie(r.historiqueMesures.length === 1 && /Fer 7 · 5 balles/.test(r.historiqueMesures[0]), nom + ' historique des mesures : ' + r.historiqueMesures.join(' | '));
    await vue('06-sac');

    /* ---- Recherche ---- */
    await page.click('.tete [data-a="recherche"]'); await page.waitForSelector('#recherche-q');
    await page.fill('#recherche-q', 'defi'); await page.dispatchEvent('#recherche-q', 'input');
    r.rechercheDefi = await page.$$eval('#recherche-l li:not([hidden]) .recherche-item', l => l.map(x => x.textContent));
    verifie(r.rechercheDefi.includes('Défis'), nom + ' recherche sans accent : ' + r.rechercheDefi.join(' | '));
    await page.fill('#recherche-q', 'zzz'); await page.dispatchEvent('#recherche-q', 'input');
    r.rechercheVide = await page.isVisible('.vide-recherche');
    await page.fill('#recherche-q', 'wedges'); await page.dispatchEvent('#recherche-q', 'input');
    await vue('07-recherche');
    await page.click('#recherche-l li:not([hidden]) [data-s="c-wedges"]');
    r.apresRecherche = await page.evaluate(() => location.hash + ' ' + Math.round(document.getElementById('c-wedges').getBoundingClientRect().top));

    /* ---- Jouer : modes de saisie ---- */
    await allerVue(page, 'parcours');
    r.modes = await page.$$eval('.modes .mode', l => l.map(x => x.querySelector('b').textContent + (x.getAttribute('aria-pressed') === 'true' ? ' ●' : '')));
    await page.click('.mode[data-v="express"]');
    e = await lire(); verifie(e.modeSaisie === 'express', nom + ' mode express enregistré');
    await vue('08-jouer');
    await page.click('.cta-partie'); await page.fill('#dp-nom', 'Golf de Test'); await page.click('[data-a="pt-nouvelle"]'); await page.waitForSelector('#calque-partie .pave');
    r.paveExpress = await page.evaluate(() => ['.pv-sjc', '.pv-coups', '.pv-evit', '.pv-plus', '.pv-putts', '.pv-penal', '.pv-mode'].map(s => s + (document.querySelector('#calque-partie ' + s) ? '✓' : '✗')).join(' '));
    verifie(/pv-sjc✗ .pv-coups✗ .pv-evit✗ .pv-plus✗ .pv-putts✓ .pv-penal✓ .pv-mode✓/.test(r.paveExpress), nom + ' pavé express : ' + r.paveExpress);
    await vue('09-pave-express');
    await page.click('#calque-partie [data-a="mode-saisie"][data-v="detail"]');
    r.paveDetail = await page.evaluate(() => ['.pv-sjc', '.pv-coups', '.pv-evit', '.pv-plus'].map(s => s + (document.querySelector('#calque-partie ' + s) ? '✓' : '✗')).join(' '));
    verifie(!/✗/.test(r.paveDetail), nom + ' pavé détaillé : ' + r.paveDetail);
    await saisirTrou(page, [1, 0, 2, 0, 5, 4, 0, 0, 0, 0, 0]);
    await page.click('#calque-partie [data-a="pt-fermer"]');
    r.bandeau = await page.textContent('.bandeau-partie');
    await allerVue(page, 'accueil');
    r.accesReprendre = await page.textContent('.acces-rapides .btn.principal');
    verifie(/Reprendre ma partie/.test(r.accesReprendre), nom + ' accès rapide reprend la partie : ' + r.accesReprendre);   /* libellé de l'accueil « Mon jeu » */

    /* ---- Profil : objectif et données ---- */
    await allerVue(page, 'profil');
    /* UX03 : le profil s'ouvre depuis l'en-tête et n'a pas d'entrée dans la barre. */
    r.profilBarre = await page.$$eval('#barre [aria-current="page"]', l => l.map(b => b.textContent).join('') || 'aucune entrée');
    verifie(r.profilBarre === 'aucune entrée', nom + ' profil : aucune entrée de la barre marquée');
    r.donnees = await page.textContent('#donnees h2');
    await page.evaluate(() => document.getElementById('objectif-index').scrollIntoView()); await page.waitForTimeout(80);
    await vue('10-profil');
    r.largeurProfil = await largeur(); verifie(r.largeurProfil <= w, nom + ' profil sans débordement');
    await ctx.close();
  }
  console.log(JSON.stringify({ res, ko, errs }, null, 1));
  await browser.close();
})().catch(e => { console.error('ECHEC', String(e.stack || e.message).split('\n').filter(l => !/retrying|waiting|scrolling|stable/.test(l)).slice(0, 12).join('\n')); process.exit(1); });
