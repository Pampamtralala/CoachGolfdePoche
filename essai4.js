/* Essai à l'écran : carte de score, parcours, saisie détaillée, objectifs, trous noirs. */
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
  const sombre = !!process.env.SOMBRE, dossier = process.env.DOSSIER || 'shots4';
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

  /* ---- Profil de départ, sans défaut ---- */
  await ouvrir();
  await page.click('[data-a="commencer"]');
  await page.fill('#q-prenom', 'Benjamin'); await page.fill('#q-index', '18');
  await page.click('[data-a="q-suite"]');
  await page.click('[data-k="objectif"][data-v="score"]'); await page.click('[data-a="q-suite"]');
  for (const l of ['practice', 'putting', 'zone', 'sable', 'parcours', 'maison']) await page.click(`[data-a="lieu"][data-v="${l}"]`);
  for (let i = 0; i < 5 && await page.locator('[data-a="q-suite"]').count(); i++) await page.click('[data-a="q-suite"]');
  await page.waitForSelector('.tete .ident');

  /* ---- Départ d'une partie sur un nouveau parcours ---- */
  await onglet('carnet');
  await page.click('[data-a="dp-ouvrir"]');
  res.departSansParcours = await page.$$eval('.depart label, .depart legend', l => l.map(x => x.textContent).join(' | '));
  await page.click('[data-a="pt-nouvelle"]');
  res.erreurNom = await page.textContent('#dp-err');
  await page.click('[data-a="dp-set"][data-k="L"][data-v="9"]');
  res.choix9 = await page.$$eval('[data-k="jeu"]', l => l.map(x => x.textContent + (x.getAttribute('aria-pressed') === 'true' ? '*' : '')).join(' | '));
  await page.click('[data-a="dp-set"][data-k="L"][data-v="18"]');
  await page.fill('#dp-nom', 'Golf des <b>Essais</b>');
  await vue('20-depart');
  await page.click('[data-a="pt-nouvelle"]');
  await page.waitForSelector(P + '.partie');
  /* Depuis le 19/11, la saisie démarre en score express : ce scénario teste le mode détaillé. */
  await page.click(P + '[data-a="mode-saisie"][data-v="detail"]');
  res.trou1 = (await page.textContent('#pt-titre')) + ' · par ' + (await page.textContent(P + '.pv-info b')) + ' · ' + await scoreAffiche();
  res.surtitre = await page.textContent(P + '.pv-cumul');
  /* Le pavé : par, putts et pénalités déplacent le score d'autant ; le moins s'arrête au minimum possible. */
  await page.click(P + '[data-a="pv-par"]'); const s1 = await scoreAffiche();
  await page.click(P + '[data-a="pv-putts"][data-d="1"]'); const s2 = await scoreAffiche();
  await page.click(P + '[data-a="pv-penal"][data-d="1"]'); const s3 = await scoreAffiche();
  await page.click(P + '[data-a="pt-score"][data-d="1"]'); const s4 = await scoreAffiche();
  await page.click(P + '.pv-penal-moins'); const s5 = await scoreAffiche();
  await page.click(P + '[data-a="pv-putts"][data-d="-1"]'); const s6 = await scoreAffiche();
  res.scoreSuit = [s1, s2, s3, s4, s5, s6].join(' → ');
  verifie(res.scoreSuit.split(' → ').map(x => parseInt(x, 10)).join(',') === '6,7,8,9,8,7', 'le score suit le par, les putts et les pénalités : ' + res.scoreSuit);
  await page.click(P + '[data-a="pv-par"]'); await page.click(P + '[data-a="pv-par"]');
  for (let i = 0; i < 8; i++) await page.click(P + '[data-a="pt-score"][data-d="-1"]').catch(() => {});
  res.scoreMini = (await scoreAffiche()) + ' · moins désactivé : ' + await page.$eval(P + '[data-a="pt-score"][data-d="-1"]', b => b.disabled);
  verifie(parseInt(res.scoreMini, 10) === 3, 'score minimum = putts + 1 : ' + res.scoreMini);
  await page.click(P + '[data-a="pt-score"][data-d="1"]'); await page.click(P + '[data-a="pt-score"][data-d="1"]');
  res.girDeduit = await page.textContent(P + '.pv-gir');
  await vue('21-saisie-simple');
  /* Saisie détaillée */
  await page.click(P + '.pv-plus summary');
  res.detailJouable = await page.$$eval(P + '.pt-sous > span', l => l.map(x => x.textContent).join(' | '));
  await page.click(P + '[data-a="pv-mej"][data-v="r"]');
  await pt(6, 3); await pt(7, 1); await pt(8, 3);
  res.detailRatee = await page.$$eval(P + '.pt-sous > span', l => l.map(x => x.textContent).join(' | '));
  await pt(7, 1); const sansClub = await page.$$eval(P + '[data-k="7"][aria-pressed="true"]', l => l.length); await pt(7, 1);
  verifie(sansClub === 0, 'un second appui retire la réponse détaillée');
  res.partieDetail = await page.evaluate(() => { const p = document.querySelector('.partie'); return { large: p.scrollWidth, haut: p.scrollHeight, ecran: innerHeight }; });
  await haut('#calque-partie', '22-saisie-detail', 2);
  await page.click(P + '[data-a="pv-par"]'); await page.click(P + '[data-a="pv-par"]');
  res.par3SansClub = await page.$$eval(P + '.pt-sous > span', l => l.map(x => x.textContent).join(' | ')) + ' · mise en jeu : ' + await page.locator(P + '.pv-mej').count();
  /* Partie complète : le trou 1 d'abord, puis les autres. */
  const jeu = partieType(11).map(trouPave);
  const saisir = async (i) => { await saisirTrou(page, jeu[i]); };
  await saisir(0);
  res.trou2 = (await page.textContent('#pt-titre')) + ' · club repris : ' + await page.$$eval(P + '[data-k="7"][aria-pressed="true"]', l => l.map(x => x.textContent).join(''));
  await saisir(1); await saisir(2);
  await recharger();
  await page.waitForSelector(P + '.partie');
  res.apresRechargement = (await page.textContent('#pt-titre')) + ' · ' + await page.textContent(P + '.pv-cumul');
  for (let i = 3; i < 18; i++) await saisir(i);
  await page.waitForSelector('.partie.express'); res.express = res.express || await page.$$eval('.xp-points li b', l => l.map(x => x.textContent).join(' | ')); await page.click('[data-a="pt-express-chiffres"]'); await page.waitForSelector('.partie.bilan');
  res.bilanChiffres = await page.$$eval('.cinq > div', l => l.map(x => x.querySelector('dt').textContent + ' ' + x.querySelector('dd').textContent).join(' | '));
  res.bilanTextes = await page.$$eval('.partie.bilan > p', l => l.map(x => x.textContent));
  await vue('23-bilan-partie');
  let e = await lire();
  const stJeu = E.statsTrous(jeu);
  verifie(e.partie === null && e.parties.length === 1 && canon(e.parties[0].trous) === canon(jeu), 'partie enregistrée à l\'identique : ' + canon(e.parties[0] && e.parties[0].trous));
  verifie(e.parcours.length === 1 && e.parcours[0].nom === 'Golf des <b>Essais</b>' && canon(e.parcours[0].pars) === canon(PARS) && e.parties[0].pc === e.parcours[0].id && e.parties[0].o === 0, 'parcours créé, pars retenus');
  verifie(e.detail === true, 'préférence de saisie détaillée retenue');
  const ind = e.profil.indicateurs;
  res.indicateurs = ['drive_jeu', 'fers_gir', 'putt_3', 'strat_penal', 'strat_cata'].map(k => k + '=' + ind[k].val + '/' + ind[k].src).join(' ');
  verifie(ind.strat_cata.src === 'partie' && ind.strat_cata.val === stJeu.C, 'trous catastrophe mesurés');
  /* Carte de score */
  await page.click(P + '[data-a="pt-bilan-carte"]');
  await page.waitForSelector('#feuille .carte-score.trous');
  res.carteTitre = (await page.textContent('#feuille .surtitre')) + ' · ' + await page.textContent('#f-titre');
  res.carteTotaux = await page.$$eval('#feuille tr.total', l => l.map(r => Array.from(r.cells).map(c => c.textContent).join(' ')));
  /* Avec un index, la carte ajoute la colonne des points Stableford (depuis le 17/11). */
  /* Mises en jeu : jouables parmi les par 4 et 5 renseignés (P03), et non plus parmi tous les trous. */
  const mjJeu = E.misesEnJeu(jeu);
  verifie(res.carteTotaux[2].startsWith(['Total', stJeu.PAR, stJeu.S, mjJeu.jouables + '/' + mjJeu.n, stJeu.G, stJeu.P, stJeu.X].join(' ')) && /^\d+$/.test(res.carteTotaux[2].split(' ')[7] || '0'), 'totaux de la carte : ' + res.carteTotaux[2]);
  res.carteBalise = await page.$$eval('#feuille b', l => l.length);
  await haut('#feuille', '24-carte', 2);
  await page.keyboard.press('Escape');

  /* ---- Plusieurs parties : parcours, trous noirs, objectifs ---- */
  e = await lire();
  const id = e.parcours[0].id, jours = n => new Date(Date.now() - n * 864e5).toISOString();
  const anciennes = [21, 22, 23, 24, 25].map((g, i) => ({ d: jours(40 - i * 7), trous: partieType(g), pc: id, o: 0 }));
  anciennes.push({ d: jours(3), trous: partieType(31).slice(9), pc: id, o: 9 });
  e.parties = anciennes.concat(e.parties); e.maj += 1;
  await ecrire(e); await recharger();
  /* UX03 : le tableau des parties et l'index estimé sont dans Journal ; les parcours restent dans Jouer. */
  await onglet('parties');
  e = await lire();
  res.tableParties = await page.$$eval('.parties tbody tr', l => l.map(r => Array.from(r.cells).map(c => c.textContent).join(' ; ')));
  const idx = E.indexEstime(e.parties, p => e.parcours.find(x => x.id === p.pc) || null, 18);
  res.indexEstime = (await page.textContent('.index-estime .main')) + ' (calculé ' + idx.v + ', ' + idx.n + ' parties, ' + idx.k + ' retenues)';
  verifie(res.indexEstime.startsWith(String(idx.v).replace('.', ',') + ' '), 'index estimé affiché = calculé');
  res.indexTexte = await page.textContent('.index-estime .aide');
  await onglet('carnet');
  res.listeParcours = await page.textContent('#c-parcours .ligne');
  res.largeurCarnet = await largeur();
  await long('25-carnet', 2);
  await page.click('[data-a="pc-ouvrir"]');
  await page.waitForSelector('#feuille canvas');
  const an = E.analyseParcours(e.parties, e.parcours[0]);
  res.noirsCalcules = an.noirs.map(x => (x.h + 1) + ':' + fmt(x.moy) + ':' + x.causes.map(c => c.id).join('+')).join(' ');
  res.noirsAffiches = await page.$$eval('#feuille .noir h4', l => l.map(x => x.textContent).join(' | '));
  res.noirsTextes = await page.$$eval('#feuille .noir', l => l.map(x => Array.from(x.querySelectorAll('header p, .constats li, .plan-jeu p, .puce')).map(y => y.textContent).join(' // ')));
  res.introNoirs = await page.$$eval('#feuille > p', l => l.map(x => x.textContent));
  res.barres = await page.evaluate(() => { const ch = Chart.getChart(document.querySelector('#feuille canvas')); return ch.data.datasets[0].backgroundColor.map(c => c === getComputedStyle(document.documentElement).getPropertyValue('--g-moins').trim() ? 'noir' : '-').join(' '); });
  verifie(res.noirsAffiches.split(' | ').length === an.noirs.length && an.noirs.length >= 2, 'trous noirs affichés = calculés');
  await haut('#feuille', '26-parcours', 3);
  /* Par, SSS, slope */
  await page.click('#feuille [data-a="pc-par"][data-v="2"]');
  e = await lire();
  verifie(e.parcours[0].pars[2] === 4 && e.parties.every(p => p.o === 9 || p.trous[2][5] === 4), 'par changé : les parties suivent');
  await page.click('#feuille [data-a="pc-par"][data-v="2"]'); await page.click('#feuille [data-a="pc-par"][data-v="2"]');
  verifie((await lire()).parcours[0].pars[2] === 3, 'cycle des pars : retour à 3');
  await page.click('#feuille details:has([data-f="pc-carte"]) summary');
  await page.fill('#rp-s0', '99'); await page.click('#feuille form[data-f="pc-carte"] button[type="submit"]');
  res.erreurSSS = await page.textContent('#pc-carte-err');
  await page.fill('#rp-n0', 'Jaune'); await page.fill('#rp-s0', '70,4'); await page.fill('#rp-l0', '128');
  await page.click('#feuille form[data-f="pc-carte"] button[type="submit"]');
  await page.click('#feuille details:has([data-f="pc-infos"]) summary');
  await page.fill('#pc-nom', 'Golf des Essais'); await page.click('#feuille form[data-f="pc-infos"] button[type="submit"]');
  e = await lire();
  verifie(e.parcours[0].sss === 70.4 && e.parcours[0].slope === 128 && e.parcours[0].nom === 'Golf des Essais', 'SSS, slope et nom enregistrés');
  await page.keyboard.press('Escape');
  await onglet('parties');
  const idx2 = E.indexEstime(e.parties, p => e.parcours.find(x => x.id === p.pc) || null, 18);
  res.indexAvecSlope = (await page.textContent('.index-estime .main')) + ' (calculé ' + idx2.v + ')';
  verifie(res.indexAvecSlope.startsWith(String(idx2.v).replace('.', ',') + ' '), 'index estimé avec SSS et slope');
  await onglet('carnet');
  /* Le plan du trou noir s'affiche pendant la saisie. */
  await page.click('[data-a="dp-ouvrir"]');
  res.departConnu = (await page.$eval('#dp-pc', s => s.options[s.selectedIndex].textContent)) + ' · ' + await page.$$eval('[data-k="jeu"]', l => l.map(x => x.textContent).join(' | '));
  await page.click('[data-a="dp-set"][data-k="jeu"][data-v="retour"]');
  await page.click('[data-a="pt-nouvelle"]');
  res.retour = (await page.textContent('#pt-titre')) + ' · par ' + await page.textContent(P + '.pv-info b');
  await page.click('#pt-suiv'); await page.click('#pt-suiv');
  res.planEnJeu = (await page.textContent('#pt-titre')) + ' · ' + (await page.locator(P + '.pt-plan').count() ? await page.textContent(P + '.pt-plan') : 'aucun plan');
  await vue('27-saisie-trou-noir');
  await page.click(P + '[data-a="pt-fermer"]'); await page.click('[data-a="pt-abandonner"]'); await page.click('.dialogue [data-a="pt-ok-abandon"]');

  /* ---- Bilan : objectifs, coups gagnés, relevés ---- */
  await onglet('bilan');
  await allerVue(page, 'bilan', 'sg'); if (!(await page.$eval('#releves', x => x.classList.contains('ouvert')))) await page.click('[data-a="pli"][data-v="releves"]');
  e = await lire();
  const cible = E.cibleAuto(18), O = E.objectifs(cible), f5 = E.statsFenetre(e.parties, 5);
  /* UX07 : les objectifs suivent le filtre commun (10 parties par défaut) ; on choisit 5 parties. */
  await page.click('#sg [data-a="st-derniers"][data-v="5"]');
  res.objectifsLignes = await page.$$eval('.objectifs tbody tr', l => l.map(r => Array.from(r.cells).map(c => c.textContent.trim()).join(' ; ')));
  res.objectifsMarques = await page.$$eval('.objectifs tbody .marque', l => l.map(x => x.className.replace('marque', '').trim() || 'repere').join(' '));
  verifie(res.objectifsLignes[0].includes(fmt(f5.vals.score)) && res.objectifsLignes[2].includes(f5.vals.gir.toFixed(1).replace('.', ',')) && res.objectifsLignes[2].includes(O.gir.toFixed(1).replace('.', ',')), 'objectifs affichés = calculés');
  res.objectifsTexte = await page.$$eval('#pli-sg > p', l => l.map(x => x.textContent));
  await page.click('#sg [data-a="st-derniers"][data-v="20"]');
  res.fenetre20 = (await page.$eval('#sg [data-a="st-derniers"][aria-pressed="true"]', b => b.textContent)) + ' · ' + await page.$eval('.objectifs tbody tr', r => r.cells[1].textContent);
  await page.click('#sg [data-a="st-derniers"][data-v="5"]');
  const sg = E.coupsGagnes(e.parties, cible);
  res.sgAffiche = await valeursGraphe(page, '#sg canvas');
  res.sgAttendu = sg.secteurs.map(s => fmt(s.sg)).join(' ');
  verifie(res.sgAffiche === res.sgAttendu, 'coups gagnés affichés = calculés');
  verifie(Math.abs(sg.total - (sg.ref.s - sg.joueur.s)) <= 0.35, 'total des secteurs = écart de score réel : ' + sg.total + ' / ' + (sg.ref.s - sg.joueur.s).toFixed(2));
  await page.click('#sg details.calcul summary');
  res.tableSG = await page.$$eval('#sg details.calcul tbody tr', l => l.map(r => Array.from(r.cells).map(c => c.textContent).join(' ; ')));
  res.releves = await page.$$eval('#releves .constats li', l => l.map(x => x.textContent));
  res.largeurBilan = await largeur();
  await page.evaluate(() => document.getElementById('sg').scrollIntoView());
  await vue('28-objectifs');
  await page.evaluate(() => window.scrollBy(0, 700)); await vue('29-coups-gagnes');
  await page.evaluate(() => document.getElementById('releves').scrollIntoView()); await vue('30-releves');
  await page.click('#releves [data-a="sym-ajouter"]');
  e = await lire();
  res.defautAjoute = Object.keys(e.profil.symptomes).join('+') + ' · carte : ' + await page.locator('#defaut-slice').count() + ' · bouton restant : ' + await page.locator('#releves [data-a="sym-ajouter"]').count();
  res.releveApres = (await page.$$eval('#releves .constats li', l => l.map(x => x.textContent)))[0];

  /* ---- Ancienne sauvegarde : parties à quatre chiffres, sans parcours ---- */
  const avant = await lire();
  const vieux = JSON.parse(JSON.stringify(avant)); vieux.maj += 5;
  delete vieux.parcours; delete vieux.detail;
  vieux.parties = [{ d: jours(60), trous: partieType(5).map(t => t.slice(0, 4)) }];
  await ecrire(vieux); await recharger();
  await onglet('plan'); await page.click('[data-a="fait"][data-id="c1-m1"]'); await page.click('[data-a="fait"][data-id="c1-m1"]');
  await onglet('parties');
  e = await lire();
  verifie(e.parties.length === 1 && e.parties[0].trous.every(t => t.length === 9 && t[4] === 0 && t[5] === 0) && canon(e.parties[0].trous.map(t => t.slice(0, 4))) === canon(vieux.parties[0].trous) && e.parties[0].pc === null && canon(e.parcours) === '[]' && e.detail === false, 'ancienne partie conservée');
  res.vieilleLigne = await page.$$eval('.parties tbody tr', l => l.map(r => Array.from(r.cells).map(c => c.textContent).join(' ; ')));
  res.sansParcours = await page.locator('#c-parcours').count() + ' bloc parcours · index : ' + await page.locator('.index-estime').count();
  await page.click('[data-a="pt-carte"]');
  res.vieilleCarte = (await page.textContent('#f-titre')) + ' · ' + await page.textContent('#feuille .aide');
  await page.keyboard.press('Escape');
  await onglet('bilan');
  res.vieuxSG = await valeursGraphe(page, '#sg canvas');
  res.vieuxObjectifs = await page.$$eval('.objectifs tbody tr', l => l.map(r => r.cells[1].textContent.trim()).join(' '));
  const sgVieux = E.coupsGagnes(vieux.parties, cible);
  verifie(res.vieuxSG === sgVieux.secteurs.map(s => (s.sg == null ? 'non mesuré' : fmt(s.sg))).join(' '), 'ancienne partie : ancien modèle, rattrapage non mesuré');

  /* ---- Sauvegarde : aller-retour, puis données hostiles ---- */
  await ecrire(Object.assign({}, avant, { maj: avant.maj + 10 })); await recharger();
  const plein = await lire();
  await onglet('profil');
  await page.click('[data-a="exporter"]');
  const code = await page.inputValue('#d-code');
  await page.click('.dialogue [data-a="fermer-dialogue"]');
  await page.click('[data-a="effacer"]'); await page.click('[data-a="ok-effacer"]');
  await page.click('[data-a="importer"]'); await page.fill('#d-code', code); await page.click('[data-a="ok-importer"]');
  verifie(sansVolatil(await lire()) === sansVolatil(plein), 'export puis restauration : état identique');
  res.tailleSauvegardeKo = +(code.length / 1024).toFixed(1);
  const MAL = '<img src=x onerror="window.__xss=1">';
  const mal = JSON.parse(JSON.stringify(plein)); mal.maj += 50;
  mal.parcours = [{ id: 'p1', nom: MAL + ' "\'>' + MAL, pars: PARS.map((v, i) => (i === 0 ? MAL : i === 1 ? 9 : v)), sss: MAL, slope: 9999 },
    { id: MAL, nom: 'x', pars: PARS }, { id: 'p1', nom: 'doublon', pars: PARS }, { id: 'p2', nom: 'court', pars: [4, 4] }, MAL, null, { id: 'constructor', pars: PARS }, { id: 'p3', nom: 123, pars: PARS.slice(0, 9), sss: 70.44, slope: 120.6 }];
  mal.parties = [{ d: MAL, pc: 'p1', o: MAL, trous: partieType(3).map((t, i) => (i === 0 ? [1, 0, 2, 0, MAL, 4, MAL, 99, -1] : i === 1 ? [1, 0, 3, 2, 1, 4, 3, 2, 9] : i === 2 ? [0, 1, 0, 0, 2, 3, 3, 4, 4] : t)) },
    { d: 'x', pc: 'constructor', o: 9, trous: partieType(4) }, { d: 'x', pc: 'p3', o: 9, trous: partieType(4).slice(0, 9) }, { pc: MAL, trous: partieType(4).map(t => t.slice(0, 5)) }];
  mal.partie = { d: MAL, n: 18, i: 2, pc: MAL, o: 9, trous: [[1, 1, 1, 1, 4, 4, 0, 1, 2], MAL, [1, 0, 2, 0, 30, 7, 0, 0, 0], [0, 1, 3, 1]] };
  mal.detail = MAL;
  await page.click('[data-a="importer"]');
  await page.fill('#d-code', Buffer.from(JSON.stringify(mal), 'utf8').toString('base64'));
  await page.click('[data-a="ok-importer"]');
  await page.waitForSelector('.tete .ident');
  for (const o of ['carnet', 'parties', 'bilan', 'exercices', 'plan', 'profil']) await onglet(o);
  await onglet('plan'); await page.click('[data-a="fait"][data-id="c1-m1"]'); await page.click('[data-a="fait"][data-id="c1-m1"]');
  const apresImport = await lire();
  await onglet('carnet');
  await page.click('[data-a="pt-reprendre"]'); await page.keyboard.press('Escape');
  await page.click('[data-a="pc-ouvrir"]'); await page.keyboard.press('Escape');
  await onglet('parties'); await page.click('[data-a="pt-carte"]'); await page.keyboard.press('Escape'); await onglet('carnet');
  await page.click('[data-a="pt-abandonner"]'); await page.click('.dialogue [data-a="pt-ok-abandon"]');
  await page.click('[data-a="dp-ouvrir"]');
  res.hostileOptions = await page.$$eval('#dp-pc option', l => l.map(o => o.textContent).join(' | '));
  await page.click('[data-a="dp-annuler"]');
  e = await lire();
  res.hostile = {
    xss: await page.evaluate(() => (window.__xss ? 'INJECTION' : 'aucune') + ' · img:' + document.querySelectorAll('img').length),
    parcours: e.parcours.map(p => p.id + ':' + p.pars.length + ':' + p.pars.slice(0, 3).join('') + ':' + p.sss + ':' + p.slope + ':' + JSON.stringify(p.nom).slice(0, 30)).join(' || '),
    parties: e.parties.map(p => p.trous.length + ' trous, pc ' + p.pc + ', o ' + p.o).join(' | '),
    trousSuspects: canon(e.parties[0].trous.slice(0, 3)),
    quatrieme: e.parties[3] ? canon(e.parties[3].trous[0]) : 'rejetée',
    detail: e.detail, enCours: canon(apresImport.partie)
  };

  /* ---- Petit écran : 360 px ---- */
  await ecrire(Object.assign({}, plein, { maj: plein.maj + 100, partie: null })); await recharger();
  await page.setViewportSize({ width: 360, height: 740 });
  await recharger();
  const l360 = {};
  for (const o of ['carnet', 'parties', 'bilan']) { await onglet(o); l360[o] = await largeur(); }
  await page.evaluate(() => document.getElementById('sg').scrollIntoView()); await vue('31-objectifs-360');
  await onglet('carnet');
  await page.click('[data-a="pc-ouvrir"]');
  l360.parcours = await page.$eval('#feuille', f => f.scrollWidth + '/' + f.clientWidth);
  await page.evaluate(() => { const f = document.getElementById('feuille'); const el = f.querySelector('.pars'); f.scrollTop = el.offsetTop - 60; });
  await vue('32-parcours-360');
  await page.keyboard.press('Escape');
  await onglet('parties'); await page.click('[data-a="pt-carte"]');
  l360.carte = await page.$eval('#feuille', f => f.scrollWidth + '/' + f.clientWidth);
  await vue('33-carte-360');
  await page.keyboard.press('Escape');
  await onglet('carnet'); await page.click('[data-a="dp-ouvrir"]'); await page.click('[data-a="pt-nouvelle"]');
  await page.click(P + '[data-a="pv-mej"][data-v="r"]');
  res.partie360 = await page.evaluate(() => { const p = document.querySelector('.partie'); return { large: p.scrollWidth, haut: p.scrollHeight, ecran: innerHeight }; });
  res.debordements360 = await page.$$eval('#calque-partie button', l => l.filter(b => b.scrollWidth > b.clientWidth + 1).map(b => b.textContent).join(' | '));
  await haut('#calque-partie', '34-saisie-360', 2);
  /* Depuis le 19/11, la saisie démarre en mode express : « Plus de détails » n'existe qu'en mode détail. */
  if (!(await page.locator(P + '[data-a="pt-detail"]').count())) await page.click(P + '[data-a="mode-saisie"][data-v="detail"]');
  await page.click(P + '[data-a="pt-detail"]');
  res.partie360Simple = await page.evaluate(() => { const p = document.querySelector('.partie'); return { haut: p.scrollHeight, ecran: innerHeight }; });
  await vue('35-saisie-simple-360');
  res.largeurs360 = l360;

  console.log(JSON.stringify({ res, ko, errs }, null, 1));
  await browser.close();
})().catch(e => { console.error('ECHEC', String(e.stack || e.message).split('\n').filter(l => !/retrying|waiting|scrolling|stable/.test(l)).slice(0, 12).join('\n')); process.exit(1); });
