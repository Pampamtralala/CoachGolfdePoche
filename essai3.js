/* Essai à l'écran des outils : carnet, partie en direct, coups gagnés, défis, schémas. */
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
const SCHEMAS = ['dr_porte', 'fe_porte_int', 'fe_barriere', 'fe_alignement', 'dr_pied_recule', 'fe_ligne', 'fe_tee_devant', 'bu_ligne', 'pc_porte', 'pc_cadran', 'pl_echelle', 'pl_point_haut', 'we_horloge', 'ap_serviette', 'we_echelle'];
const canon = o => JSON.stringify(o, (k, v) => (v && typeof v === 'object' && !Array.isArray(v) ? Object.keys(v).sort().reduce((a, c) => (a[c] = v[c], a), {}) : v));
const sansVolatil = e => { const c = JSON.parse(JSON.stringify(e)); delete c.maj; if (c.profil) delete c.profil.indexTexte; return canon(c); };

const { allerVue, menuAction, lirePave, saisirTrou, trouPave } = require('./nav-essai');
/* Valeurs d'un graphique lues dans sa description (canvas aria-label). */
const valeursGraphe = (page, sel) => page.$eval(sel, c => c.getAttribute('aria-label').replace(/\.$/, '').split(' : ').slice(1).join(' : ').split(' ; ').map(x => x.replace(/^.*? (?=[+−]?\d+,\d|non mesuré)/, '')).join(' '));

(async () => {
  const sombre = !!process.env.SOMBRE, dossier = process.env.DOSSIER || 'shots3';
  fs.mkdirSync(dossier, { recursive: true });
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, colorScheme: sombre ? 'dark' : 'light' });
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

  /* ---- Profil de départ, puis sauvegarde d'avant les outils ---- */
  await ouvrir();
  await page.click('[data-a="commencer"]');
  await page.fill('#q-prenom', 'Benjamin'); await page.fill('#q-index', '18');
  await page.click('[data-a="q-suite"]');
  await page.click('[data-k="objectif"][data-v="score"]'); await page.click('[data-a="q-suite"]');
  for (const l of ['practice', 'putting', 'zone', 'sable', 'parcours', 'maison']) await page.click(`[data-a="lieu"][data-v="${l}"]`);
  await page.click('[data-a="q-suite"]'); await page.click('[data-a="q-suite"]'); await page.click('[data-a="q-suite"]');
  await page.click('[data-a="defaut"][data-v="slice"]');
  for (let i = 0; i < 3 && await page.locator('[data-a="q-suite"]').count(); i++) await page.click('[data-a="q-suite"]');
  let e = await lire();
  ['carnet', 'defis', 'parties', 'partie', 'cibleSG', 'parcours', 'detail'].forEach(k => delete e[k]);
  const ancien = JSON.parse(JSON.stringify(e)); delete ancien.indexHist; delete ancien.modeSaisie;
  await ecrire(e); await recharger();
  await page.waitForSelector('.tete .ident');
  res.ancienneSauvegarde = await page.textContent('.tete .ident');
  res.onglets = await page.$$eval('#menu .menu-item', l => l.map(b => b.textContent + (b.scrollWidth > b.clientWidth ? ' DÉBORDE' : '')).join(' | '));
  await onglet('plan'); await page.click('[data-a="fait"][data-id="c1-m1"]'); await page.click('[data-a="fait"][data-id="c1-m1"]');
  e = await lire();
  verifie(canon(e.carnet) === canon({ clubs: {}, wedges: {}, sac: null, lofts: {}, wedgesPerso: [], series: [] }) && Array.isArray(e.parties) && e.partie === null && e.profil.indexVise === null && canon(e.defis) === '{}', 'valeurs par défaut des outils');
  verifie(canon(e.parcours) === '[]' && e.detail === false, 'valeurs par défaut de la carte de score');
  const reste = JSON.parse(JSON.stringify(e)); ['carnet', 'defis', 'parties', 'partie', 'cibleSG', 'parcours', 'detail'].forEach(k => delete reste[k]); delete reste.profil.indexVise; delete reste.modeSaisie; delete reste.indexHist;
  verifie(sansVolatil(reste) === sansVolatil(ancien), 'ancienne sauvegarde conservée à l\'identique : ' + Object.keys(Object.assign({}, reste, ancien)).filter(k => JSON.stringify(reste[k]) !== JSON.stringify(ancien[k])).map(k => k + '=' + String(JSON.stringify(reste[k])).slice(0, 80) + ' / ' + String(JSON.stringify(ancien[k])).slice(0, 80)).join(' ; '));

  /* ---- Carnet de distances ---- */
  await onglet('distances');
  res.largeurCarnetVide = await largeur();
  await vue('10-carnet-vide');
  /* Sac de golf : chaque club s'ouvre dans une fiche, balle par balle ou moyenne directe */
  res.sacVide = await page.$$eval('#sac-scene .c3d-tete', l => l.map(b => b.dataset.id).join(' '));
  const ficheClub = async club => { await page.click(`#sac-scene [data-a="sac-club"][data-id="${club}"]`); if (!(await page.locator('#feuille').count())) await page.click('[data-a="sac-modifier"]'); await page.waitForSelector('#feuille'); };
  const fermer = async () => { await page.click('#f-fermer'); await page.waitForSelector('#feuille', { state: 'detached' }); };
  const ajouter = async (club, vals) => {
    await ficheClub(club);
    if (!(await page.$eval('.sac-balles', d => d.open))) await page.click('.sac-balles summary');
    for (const v of vals) { await page.fill('#sac-balle', String(v)); await page.click('.sac-balle button[type="submit"]'); }
    await fermer();
  };
  await ajouter('f7', [150, 152, 148, 155, 140]);
  await ajouter('f5', [170]); await ajouter('f6', [168]); await ajouter('f9', [120]); await ajouter('dr', [215, 225, 205]); await ajouter('b3', [190]); await ajouter('pw', [105]);
  await ficheClub('pw'); await page.click('.sac-balles summary'); await page.fill('#sac-balle', 'abc'); await page.click('.sac-balle button[type="submit"]');
  res.erreurMesure = await page.textContent('#sac-balle-err');
  /* Moyenne directe avec aperçu en direct, puis annulation : rien n'est enregistré */
  await page.fill('#sac-val', '96');
  res.apercuVoisins = await page.$$eval('#sac-voisins li', l => l.map(x => x.className + '|' + x.textContent));
  res.apercuSac = await page.$eval('#sac-scene .c3d.sel .c3d-bulle > span', x => x.textContent);
  await fermer();
  res.sacApresAnnulation = await page.$eval('#sac-scene .c3d.sel .c3d-bulle > span', x => x.textContent);
  e = await lire();
  verifie(canon(e.carnet.clubs.pw) === '[105]', 'aperçu annulé : ' + canon(e.carnet.clubs.pw));
  await ficheClub('f8'); res.estimationF8 = await page.inputValue('#sac-val');
  await page.fill('#sac-val', '5'); await page.press('#sac-val', 'Enter');
  res.erreurMoyenne = await page.textContent('#sac-err');
  await page.fill('#sac-val', '136'); await page.press('#sac-val', 'Enter');
  await page.waitForSelector('#feuille', { state: 'detached' });
  e = await lire();
  verifie(canon(e.carnet.clubs.f8) === '[136]', 'moyenne directe : ' + canon(e.carnet.clubs.f8));
  res.focusApresSaisie = await page.evaluate(() => document.activeElement && document.activeElement.dataset.id);
  res.rangs = await page.$eval('#c-distances canvas', c => c.getAttribute('aria-label'));
  res.constatsClubs = await page.$$eval('#sac-bilan .sac-ecarts li', l => l.map(x => x.textContent.replace(/\s+/g, ' ').trim()));
  res.alertesSac = await page.$$eval('#sac-scene .c3d.alerte .c3d-tete', l => l.map(b => b.dataset.id).join(' '));
  res.scoreSac = await page.$eval('#sac-bilan .sac-score', x => x.textContent);
  await ficheClub('f7');
  res.relevesF7 = await page.$$eval('#feuille .releves .puce', l => l.length);
  res.ficheF7 = await page.$eval('#feuille', x => x.textContent.replace(/\s+/g, ' ').slice(0, 260));
  await page.click('#feuille .releves [data-v="4"]');
  e = await lire();
  verifie(canon(e.carnet.clubs.f7) === '[150,152,148,155]', 'mesure retirée : ' + canon(e.carnet.clubs.f7));
  await page.fill('#sac-balle', '140'); await page.click('.sac-balle button[type="submit"]');
  await fermer();
  /* Composition : sortir le bois 5, mettre le gap wedge et le lob wedge */
  await page.click('[data-a="sac-composer"]');
  await page.click('#feuille [data-a="sac-basculer"][data-id="b5"]'); await page.click('#feuille [data-a="sac-basculer"][data-id="gw"]'); await page.click('#feuille [data-a="sac-basculer"][data-id="lw"]');
  await fermer();
  e = await lire();
  res.sacCompose = (e.carnet.sac || []).join(' ');
  res.sacScene = await page.$$eval('#sac-scene .c3d-tete', l => l.map(b => b.dataset.id).join(' '));
  await vue('10b-sac');
  /* Matrice de wedges */
  const wedge = async (w, am, v) => { await page.fill(`#w-${w}-${am}`, String(v)); await page.dispatchEvent(`#w-${w}-${am}`, 'change'); };
  await wedge('sw', 'a1', 30); await wedge('sw', 'a2', 45); await wedge('sw', 'a3', 62); await wedge('gw', 'a2', 75);
  await wedge('lw', 'a1', 'xx');
  res.erreurWedge = await page.textContent('#w-err');
  await wedge('lw', 'a1', '');
  res.constatsWedges = await page.$$eval('#graph-wedges .constats li', l => l.map(x => x.textContent));
  res.pointsWedges = await page.evaluate(() => { const ch = Chart.getChart(document.querySelector('#graph-wedges canvas')); return ch ? ch.data.datasets.reduce((n, d) => n + d.data.length, 0) / 2 : 0; });
  e = await lire();
  verifie(canon(e.carnet.wedges) === canon({ sw: { a1: 30, a2: 45, a3: 62 }, gw: { a2: 75 } }), 'matrice enregistrée : ' + canon(e.carnet.wedges));
  res.largeurCarnet = await largeur();
  await long('11-carnet', 3);
  await onglet('carnet');

  /* ---- Partie en direct ---- */
  const J = i => (i % 3 === 0 ? 0 : 1), G = i => (i % 4 === 1 ? 1 : 0), P = [2, 2, 3, 1, 2, 2, 2, 3, 2, 1, 2, 2, 4, 2, 2, 2, 2, 3], X = i => (i === 3 ? 2 : i === 12 ? 1 : 0);
  const trous = []; for (let i = 0; i < 18; i++) trous.push([J(i), G(i), P[i], X(i)]);
  const complet = t => trouPave(t.concat([E.scoreSuggere(4, t[1], t[2], t[3]), 4, 0, 0, 0]));
  const saisir = async i => { await saisirTrou(page, complet(trous[i])); };
  const demarrer = async n => {
    await page.click('[data-a="dp-ouvrir"]');
    if (await page.locator('#dp-nom').count()) await page.fill('#dp-nom', 'Golf des Essais');
    if (n === 9) await page.click('[data-a="dp-set"][data-k="jeu"][data-v="aller"]');
    await page.click('[data-a="pt-nouvelle"]');
  };
  await demarrer(18);
  res.partieOuverte = await page.textContent('#pt-titre');
  res.defautsCoches = await page.$$eval('#calque-partie [aria-pressed="true"]', l => l.map(b => b.textContent).join(' '));
  res.fondPartie = await page.$eval('.partie', el => getComputedStyle(el).backgroundColor);
  await saisir(0); await saisir(1);
  await vue('12-partie-trou');
  await recharger();
  await page.waitForSelector('#calque-partie .partie');
  res.apresRechargementPartie = await page.textContent('#pt-titre');
  await page.click('[data-a="pt-prec"]');
  res.retourTrou2 = (await page.textContent('#pt-titre')) + ' ' + await page.$$eval('#calque-partie [aria-pressed="true"]', l => l.map(b => b.textContent).join(' '));
  await page.click('#pt-suiv');
  for (let i = 2; i < 18; i++) await saisir(i);
  await page.waitForSelector('.partie.express'); res.express = res.express || await page.$$eval('.xp-points li b', l => l.map(x => x.textContent).join(' | ')); await page.click('[data-a="pt-express-chiffres"]'); await page.waitForSelector('.partie.bilan');
  res.cinqChiffres = await page.$$eval('.cinq .main', l => l.map(x => x.textContent).join(' '));
  res.texteBilanPartie = await page.$$eval('.partie.bilan > p', l => l.map(x => x.textContent));
  await vue('13-partie-bilan');
  e = await lire();
  verifie(e.partie === null && e.parties.length === 1 && canon(e.parties[0].trous) === canon(trous.map(complet)), 'partie enregistrée');
  const ind = e.profil.indicateurs;
  res.indicateurs = ['drive_jeu', 'fers_gir', 'putt_3', 'strat_penal', 'strat_cata'].map(k => k + '=' + ind[k].val + '/' + ind[k].src).join(' ');
  /* Coups gagnés */
  await page.click('#calque-partie [data-a="pt-voir-sg"]');
  res.ongletApresPartie = await page.evaluate(() => location.hash);
  const attendu = E.coupsGagnes(e.parties, E.cibleAuto(18));
  const fmt = v => (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toFixed(1).replace('.', ',');
  res.sgAffiche = await valeursGraphe(page, '#sg canvas');
  res.sgAttendu = attendu.secteurs.map(s => fmt(s.sg)).join(' ');
  verifie(res.sgAffiche === res.sgAttendu, 'coups gagnés affichés = calculés');
  res.sgTextes = await page.$$eval('#pli-sg > p', l => l.map(x => x.textContent));
  res.sgCible = await page.textContent('#sg .cible .main');
  await page.evaluate(() => document.getElementById('sg').scrollIntoView());
  await vue('14-coups-gagnes');
  await page.click('#sg [data-a="sg-cible"][data-d="-1"]');
  res.sgCibleApres = (await page.textContent('#sg .cible .main')) + ' → ' + await valeursGraphe(page, '#sg canvas');
  verifie((await lire()).profil.indexVise === 12, 'objectif d\'index enregistré : ' + (await lire()).profil.indexVise);
  await page.click('#sg details.calcul summary');
  res.tableSG = await page.$$eval('#sg details.calcul tbody tr', l => l.map(r => Array.from(r.cells).map(c => c.textContent).join(' ; ')));
  await page.click('#sg [data-a="voir-exos"]').catch(() => {});
  res.apresVoirExos = await page.evaluate(() => location.hash) + ' · ' + await page.$eval('.filtres [aria-pressed="true"]', b => b.textContent);
  res.largeurBilan = await (async () => { await onglet('bilan'); return largeur(); })();
  /* Partie trop courte, abandon, suppression */
  await onglet('carnet');
  res.tableParties = await page.$$eval('.parties tbody tr', l => l.map(r => Array.from(r.cells).map(c => c.textContent).join(' ')));
  await demarrer(9);
  await page.click('#pt-suiv'); await page.click('#pt-suiv'); await page.click('#pt-suiv');
  await page.click('[data-a="pt-terminer"]');
  res.dialogueCourt = await page.textContent('.dialogue p');
  await page.click('.dialogue [data-a="pt-ok-abandon"]');
  e = await lire();
  verifie(e.partie === null && e.parties.length === 1, 'partie courte abandonnée');
  res.calqueFerme = await page.$eval('#calque-partie', c => c.hidden);

  /* ---- Défis ---- */
  await onglet('exercices');
  await page.click('.filtres [data-v="tous"]');
  res.defis = await page.$$eval('.defis .ligne', l => l.length);
  res.largeurExercices = await largeur();
  await page.click('[data-a="defi"][data-id="onze"]');
  for (let i = 0; i < 5; i++) await page.click('#feuille [data-a="defi-coup"][data-v="1"]');
  res.evtNiveau = await page.textContent('#feuille .evt');
  res.feuilleReanimee = await page.$eval('#feuille', el => el.classList.contains('entre'));
  await page.click('#feuille [data-a="defi-coup"][data-v="1"]'); await page.click('#feuille [data-a="defi-coup"][data-v="1"]');
  await page.click('#feuille [data-a="defi-coup"][data-v="0"]');
  res.evtRate = await page.textContent('#feuille .evt');
  res.statsOnze = await page.$$eval('#feuille .stats dd', l => l.map(x => x.textContent).join(' '));
  await page.click('#feuille [data-a="defi-annuler"]');
  res.apresAnnulation = (await page.textContent('#feuille .compteur .main')) + ' · ' + await page.$$eval('#feuille .stats dd', l => l.map(x => x.textContent).join(' '));
  await page.click('#feuille [data-a="defi-coup"][data-v="1"]');
  await vue('15-defi-serie');
  await page.keyboard.press('Escape');
  res.carteOnze = await page.textContent('[data-a="defi"][data-id="onze"]');
  e = await lire();
  verifie(e.defis.onze.niv === 1 && e.defis.onze.cours.s === 3 && e.defis.onze.essais === 1 && e.defis.onze.coups === 8, 'état du défi : ' + canon(e.defis.onze));
  /* Comptage relié à un test : score d'exercice et bilan */
  const avantApp = (await lire()).profil.indicateurs.app_proche;
  await page.click('[data-a="defi"][data-id="approches"]');
  for (const v of [1, 1, 0, 1, 1, 0, 1, 0, 1, 1]) await page.click(`#feuille [data-a="defi-coup"][data-v="${v}"]`);
  res.evtCompte = await page.textContent('#feuille .evt');
  await vue('16-defi-compte');
  e = await lire();
  verifie(canon(e.scores.ap_test10.map(x => x.v)) === '[7]' && e.profil.indicateurs.app_proche.val === 7 && e.profil.indicateurs.app_proche.src === 'test' && e.defis.approches.niv === 3, 'score et bilan mis à jour par le défi');
  res.finCompte = (await page.textContent('#feuille .compteur .main')) + ' · ' + (await page.$$eval('#feuille .coups li', l => l.map(x => x.className[0] || '-').join(''))) + ' · ' + await page.textContent('#feuille [data-a="defi-rejouer"]');
  await page.click('#feuille [data-a="defi-annuler"]');
  e = await lire();
  res.apresAnnulationCompte = await page.$$eval('#feuille [data-a="defi-coup"]', l => l.length) + ' boutons de coup';
  verifie(!e.scores.ap_test10 && canon(e.profil.indicateurs.app_proche) === canon(avantApp) && e.defis.approches.cours.l.length === 9 && e.defis.approches.niv === 0, 'annulation du dernier coup : score et bilan rétablis');
  await page.keyboard.press('Escape');
  /* Depuis une fiche d'exercice */
  await page.click('[data-a="filtre-palier"]');
  await page.click('[data-a="exo"][data-id="pc_cadran"]');
  res.boutonOutil = await page.textContent('#feuille .outil .btn');
  await page.click('#feuille .outil .btn');
  res.defiDepuisFiche = await page.textContent('#f-titre');
  for (let i = 0; i < 3; i++) await page.click('#feuille [data-a="defi-coup"][data-v="1"]');
  await page.click('#feuille [data-a="defi-fin"]');
  e = await lire();
  verifie(canon(e.scores.pc_cadran.map(x => x.v)) === '[3]' && e.defis.cadran.cours === null, 'fin de séance : meilleure série notée');
  await page.keyboard.press('Escape');
  await page.click('[data-a="exo"][data-id="fe_distances"]');
  await page.click('#feuille .outil .btn');
  res.outilCarnet = await page.evaluate(() => location.hash) + ' · feuille fermée : ' + !(await page.locator('#feuille').count());

  /* ---- Schémas ---- */
  await onglet('exercices');
  const capturerSchemas = async (ids, suffixe) => {
    const fichiers = [];
    for (const id of ids) {
      await page.click(`[data-a="exo"][data-id="${id}"]`);
      const sch = page.locator('#feuille .schema');
      const n = await sch.count();
      verifie(n === 1, 'schéma présent pour ' + id);
      if (n) {
        const info = await sch.evaluate(el => ({ anim: el.querySelectorAll('animate, animateMotion, animateTransform').length, legende: el.querySelector('figcaption').textContent, alt: el.querySelector('svg').getAttribute('aria-label').length }));
        verifie(info.anim > 0 && info.alt > 40, 'animation et description pour ' + id);
        res['legende_' + id + suffixe] = info.legende;
        await page.waitForTimeout(1400);
        const f = `${dossier}/schema-${id}${suffixe}.png`;
        await sch.locator('svg').screenshot({ path: f }); fichiers.push(f);
      }
      await page.keyboard.press('Escape');
    }
    return fichiers;
  };
  const planche = async (fichiers, nom, cols) => {
    const w = 400, metas = await Promise.all(fichiers.map(f => sharp(f).resize({ width: w }).toBuffer({ resolveWithObject: true })));
    const lignes = Math.ceil(metas.length / cols), hs = [];
    for (let r = 0; r < lignes; r++) hs.push(Math.max(...metas.slice(r * cols, r * cols + cols).map(m => m.info.height)));
    const comp = []; let y = 0;
    for (let r = 0; r < lignes; r++) { metas.slice(r * cols, r * cols + cols).forEach((m, c) => comp.push({ input: m.data, left: c * (w + 8), top: y })); y += hs[r] + 8; }
    await sharp({ create: { width: cols * (w + 8), height: y, channels: 3, background: sombre ? '#222' : '#888' } }).composite(comp).png().toFile(`${dossier}/${nom}.png`);
  };
  const droitier = await capturerSchemas(SCHEMAS, '');
  await planche(droitier.slice(0, 8), 'planche-schemas-1', 2);
  await planche(droitier.slice(8), 'planche-schemas-2', 2);
  await page.click('[data-a="exo"][data-id="dr_porte"]');
  await page.evaluate(() => { document.getElementById('feuille').scrollTop = 0; });
  await vue('17-fiche-schema');
  await page.keyboard.press('Escape');
  e = await lire(); e.profil.lateralite = 'G'; e.maj += 1; await ecrire(e); await recharger();
  await onglet('exercices');
  const gaucher = await capturerSchemas(['dr_porte', 'fe_alignement', 'we_horloge', 'dr_pied_recule'], '-g');
  await planche(gaucher, 'planche-schemas-gaucher', 2);
  e = await lire(); e.profil.lateralite = 'D'; e.maj += 1; await ecrire(e); await recharger();

  /* ---- Sauvegarde : aller-retour, puis données hostiles dans les nouveaux champs ---- */
  const avant = await lire();
  await onglet('profil');
  await page.click('[data-a="exporter"]');
  const code = await page.inputValue('#d-code');
  await page.click('.dialogue [data-a="fermer-dialogue"]');
  await page.click('[data-a="effacer"]'); await page.click('[data-a="ok-effacer"]');
  await page.click('[data-a="importer"]'); await page.fill('#d-code', code); await page.click('[data-a="ok-importer"]');
  verifie(sansVolatil(await lire()) === sansVolatil(avant), 'export puis restauration : état identique');
  res.tailleSauvegardeKo = +(code.length / 1024).toFixed(1);
  const MAL = '<img src=x onerror="window.__xss=1">';
  const mal = JSON.parse(JSON.stringify(avant)); mal.maj += 5;
  mal.carnet = { clubs: { f7: [MAL, 150, -4, 99999, 151.6], dr: MAL, constructor: [200], [MAL]: [100] }, wedges: { sw: { a1: MAL, a2: 45, a9: 50 }, pw: MAL, __proto__: { a1: 10 } } };
  mal.defis = { onze: { niv: 99, essais: MAL, coups: -3, ok: 500, record: MAL, parNiv: MAL, hist: [{ d: MAL, v: MAL }, { v: 4 }], cours: { s: MAL, m: 2, e: 1 } }, approches: { cours: { l: [1, MAL, 0, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1] } }, [MAL]: { niv: 1 }, constructor: {} };
  mal.parties = [{ d: MAL, trous: trous.map((t, i) => (i === 0 ? [MAL, 0, 2, 0] : i === 1 ? [1, 0, 99, 0] : t)) }, { d: 'x', trous: [[1, 0, 2, 0]] }, MAL, null, { trous: MAL }];
  mal.partie = { d: MAL, n: 9, i: 99, trous: [[1, 1, 1, 1], MAL, [1, 0, 9, 0]] };
  mal.cibleSG = MAL;
  await page.click('[data-a="importer"]');
  await page.fill('#d-code', Buffer.from(JSON.stringify(mal), 'utf8').toString('base64'));
  await page.click('[data-a="ok-importer"]');
  await page.waitForSelector('.tete .ident');
  for (const o of ['carnet', 'bilan', 'exercices', 'plan', 'profil']) await onglet(o);
  await onglet('carnet'); await page.click('[data-a="pt-reprendre"]'); await page.keyboard.press('Escape');
  await onglet('exercices'); await page.click('[data-a="defi"][data-id="onze"]'); await page.keyboard.press('Escape');
  e = await lire();
  res.hostile = {
    xss: await page.evaluate(() => (window.__xss ? 'INJECTION' : 'aucune') + ' · img:' + document.querySelectorAll('img').length),
    clubs: canon(e.carnet.clubs), wedges: canon(e.carnet.wedges),
    onze: canon(e.defis.onze), approches: canon(e.defis.approches), defisCles: Object.keys(e.defis).join('+'),
    parties: e.parties.length + ' partie(s), ' + e.parties.map(p => p.trous.length).join('+') + ' trous',
    partie: canon(e.partie), indexVise: e.profil.indexVise
  };

  /* ---- Petit écran : 360 px ---- */
  await page.setViewportSize({ width: 360, height: 740 });
  await page.evaluate(k => { const e = JSON.parse(localStorage.getItem(k)); e.partie = null; e.maj += 1; localStorage.setItem(k, JSON.stringify(e)); }, CLE);
  await recharger();
  const l360 = {};
  for (const o of ['carnet', 'bilan', 'exercices']) { await onglet(o); l360[o] = await largeur(); }
  res.largeurs360 = l360;
  res.onglets360 = await page.$$eval('.tete > *', l => l.map(b => (b.scrollWidth > b.clientWidth + 1 ? b.textContent + ' DÉBORDE' : 'ok')).join(' '));
  await onglet('carnet'); await demarrer(18);
  res.partie360 = await page.evaluate(() => { const p = document.querySelector('.partie'); return { large: p.scrollWidth, haut: p.scrollHeight, ecran: innerHeight }; });
  await vue('18-partie-360');

  console.log(JSON.stringify({ res, ko, errs }, null, 1));
  await browser.close();
})().catch(e => { console.error('ECHEC', String(e.stack || e.message).split('\n').filter(l => !/retrying|waiting|scrolling|stable/.test(l)).slice(0, 12).join('\n')); process.exit(1); });
