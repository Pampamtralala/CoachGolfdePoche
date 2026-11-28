/* Stratégie et analyse : point posé sur l'ellipse (série et coup), fourchette jouable, se joue comme, visée anti-pénalité,
   erreurs évitables, notes sur 100, priorité de la semaine, objectif d'index. */
const { chromium } = require('playwright');
const fs = require('fs');
const { listeSac, pageClub, reglagesClub, allerVue, menuAction, saisirTrou } = require('./nav-essai');
const S = require('./src/engine-strategie.js');
const A = require('./src/engine-analyse.js');
const F = '/home/claude/polices/node_modules/@fontsource/';
const face = (fam, file, w) => `@font-face{font-family:"${fam}";font-weight:${w};src:url(data:font/woff2;base64,${fs.readFileSync(F + file).toString('base64')}) format("woff2");}`;
const POLICES = [face('Barlow Condensed', 'barlow-condensed/files/barlow-condensed-latin-600-normal.woff2', 600), face('Barlow Condensed', 'barlow-condensed/files/barlow-condensed-latin-700-normal.woff2', 700),
  face('Atkinson Hyperlegible', 'atkinson-hyperlegible/files/atkinson-hyperlegible-latin-400-normal.woff2', 400), face('Atkinson Hyperlegible', 'atkinson-hyperlegible/files/atkinson-hyperlegible-latin-700-normal.woff2', 700), face('Manrope', 'manrope/files/manrope-latin-700-normal.woff2', 700), face('Manrope', 'manrope/files/manrope-latin-800-normal.woff2', 800)].join('\n');
const CLE = 'coachgolf.v1';
const ELL = { W: 320, H: 236, cx: 160, cy: 108, dx: 138, dy: 88 };
/* Parties anciennes notées avec le pavé (11 cases) : putting fragile, quelques doubles approches. */
function partiePave(g, pars) {
  let s0 = g; const alea = () => (s0 = (s0 * 16807) % 2147483647) / 2147483647;
  return pars.map((par, k) => {
    const gir = alea() < 0.3 ? 1 : 0, p1 = gir ? (alea() < 0.5 ? 4 : 3) : (alea() < 0.5 ? 2 : 3), putts = alea() < 0.22 ? 3 : alea() < 0.2 ? 1 : 2;
    const dbl = !gir && alea() < 0.15 ? 1 : 0, pen = k % 7 === 3 && alea() < 0.6 ? 1 : 0, bk = !gir && alea() < 0.15 ? (alea() < 0.4 ? 1 : 2) : 0;
    const s = par - 2 + (gir ? 0 : 1) + putts + pen + dbl;
    return [pen ? 0 : 1, s - putts <= par - 2 ? 1 : 0, putts, pen, s, par, pen ? 1 : 0, par === 3 ? 0 : 1, p1, dbl ? 2 : 0, bk];
  });
}

(async () => {
  const D = 'shots11'; fs.mkdirSync(D, { recursive: true });
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const res = {}, errs = [], ko = [];
  const verifie = (c, m) => { if (!c) ko.push(m); };
  for (const [w, sombre] of [[390, false], [360, true]]) {
    const nom = w + (sombre ? 's' : ''), r = res[nom] = {};
    const ctx = await browser.newContext({ viewport: { width: w, height: 844 }, deviceScaleFactor: 2, colorScheme: sombre ? 'dark' : 'light', hasTouch: true, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    page.on('pageerror', e => errs.push(nom + ' PAGEERROR ' + e.message));
    page.on('console', m => { if (m.type() === 'error' && !/fonts\.g|ERR_|Failed to load resource/.test(m.text())) errs.push(nom + ' CONSOLE ' + m.text()); });
    const vue = n => page.screenshot({ path: `${D}/${nom}-${n}.png` });
    const lire = () => page.evaluate(k => JSON.parse(localStorage.getItem(k)), CLE);
    const ecrire = e => page.evaluate(([k, e]) => localStorage.setItem(k, JSON.stringify(e)), [CLE, e]);
    const recharger = async () => { await page.reload(); await page.addStyleTag({ content: POLICES }); await page.evaluate(() => document.fonts.ready); };
    /* Toucher l'ellipse à l (latéral) et dd (profondeur) mètres. */
    const poser = async (ctxe, l, dd) => {
      const b = page.locator(`.ell-cible[data-ctx="${ctxe}"]`);
      const rx = +(await b.getAttribute('data-rx')), ry = +(await b.getAttribute('data-ry'));
      const bb = await b.locator('svg').boundingBox();
      const x = (ELL.cx + l / rx * ELL.dx) / ELL.W * bb.width, y = (ELL.cy - dd / ry * ELL.dy) / ELL.H * bb.height;
      await b.click({ position: { x: x + (bb.x - (await b.boundingBox()).x), y: y + (bb.y - (await b.boundingBox()).y) } });
    };
    await page.goto('file://' + __dirname + '/dist/index.html'); await page.addStyleTag({ content: POLICES }); await page.evaluate(() => document.fonts.ready);
    await page.click('[data-a="commencer"]'); await page.fill('#q-prenom', 'Benjamin'); await page.fill('#q-index', '18'); await page.click('[data-a="q-suite"]');
    await page.click('[data-k="objectif"][data-v="score"]'); await page.click('[data-a="q-suite"]');
    for (const l of ['practice', 'putting', 'parcours']) await page.click(`[data-a="lieu"][data-v="${l}"]`);
    for (let i = 0; i < 8 && await page.locator('[data-a="q-suite"]').count(); i++) await page.click('[data-a="q-suite"]');
    await page.waitForSelector('.tete');
    /* Distances des autres clubs du sac */
    let e = await lire();
    Object.assign(e.carnet.clubs, { dr: [215, 220, 205, 225, 210], b3: [195, 200], b5: [182, 186], f4: [168], f5: [160, 163], f6: [152, 155, 158, 150, 157], f8: [134, 136, 131, 138, 135], f9: [124, 122], pw: [110, 112], sw: [86, 90, 88] });
    e.maj += 1; await ecrire(e); await recharger();

    /* ---- 1. V4-03 : plus de série au practice. Onze coups de fer 7 joués en partie, avec leur direction ;
       une ancienne série archivée (avec directions) ne doit plus compter. ---- */
    const balles = [[4, 2], [-6, -3], [9, 1], [2, 4], [-3, -1], [12, 5], [0, -6], [6, 3], [-8, 0], [3, 2], [-2, -5]];
    const dists = balles.map(([l, dd]) => 140 + dd), ls = balles.map(([l]) => l);
    const pars11 = [4, 4, 3, 5, 4, 4, 3, 4, 5, 4, 4, 3, 4, 5, 4, 3, 4, 5];
    e = await lire();
    e.parties = [{ d: new Date(Date.now() - 2 * 864e5).toISOString(), o: 0,
      trous: pars11.map(par => [1, 0, 2, 0, par + 1, par, 0, par === 3 ? 0 : 1, 2, 0, 0]),
      coups: pars11.map((par, k) => k < balles.length ? [{ c: 'f7', d: dists[k], l: ls[k] }] : []) }];
    e.carnet.series = [{ d: new Date(Date.now() - 9 * 864e5).toISOString(), c: 'f7', v: [100, 102, 98], l: [30, 30, 30] }];
    e.maj += 1; await ecrire(e); await recharger();
    verifie(await page.locator('[data-a="serie-ouvrir"]').count() === 0, nom + ' plus de série de balles');
    const se = { l: ls };

    /* ---- 2. Sac : fourchette et ellipse, points touchables ---- */
    await allerVue(page, 'sac');
    /* V4-S04 : la fiche du club est une page ; la dispersion y est repliée. */
    const toucher = async id => { await pageClub(page, id); await page.$$eval('#club-page .club-dispersion', l => l.forEach(d => { d.open = true; })); };
    const fo = S.fourchette(dists);
    await vue('02-sac-fourchette');
    await toucher('f7'); await page.waitForSelector('#club-page .sac-ellipse');
    r.bulle = await page.$eval('#club-page .ell-fourchette', x => x.textContent);
    verifie(r.bulle.includes(fo.bas + '–' + fo.haut), nom + ' fiche avec la fourchette ' + fo.bas + '–' + fo.haut + ' : ' + r.bulle);
    r.fourchetteFiche = await page.textContent('#club-page .ell-fourchette');
    r.pointsFiche = await page.$$eval('#club-page .sac-ellipse .ell-pt', l => l.length);
    verifie(r.pointsFiche === 11, nom + ' onze points sur l\'ellipse : ' + r.pointsFiche);
    const el = S.ellipseClub(dists, se.l, 18);
    r.ellipseCalc = JSON.stringify({ d: el.d, cx: el.cx, rx: el.rx, ry: el.ry, estL: el.estimeeL });
    r.chiffres = await page.$eval('#club-page .sac-ellipse .disp-chiffres', x => x.textContent.replace(/\s+/g, ' ').trim());
    verifie(r.chiffres.includes('±' + el.rx), nom + ' latéral affiché = calculé (±' + el.rx + ') : ' + r.chiffres);
    await page.click('#club-page .sac-ellipse .ell-pt[data-v="0"]', { force: true });
    r.legendePoint = await page.textContent('#ell-legende');
    verifie(/Coup du trou 1/.test(r.legendePoint) && /droite/.test(r.legendePoint), nom + ' point touché : ' + r.legendePoint);
    await page.evaluate(() => document.querySelector('#club-page .sac-ellipse').scrollIntoView({ block: 'start' })); await page.waitForTimeout(100);
    await vue('03-fiche-ellipse');
    await listeSac(page);

    /* ---- 3. Parcours : se joue comme, visée, coup posé sur l'ellipse, erreurs ---- */
    await menuAction(page, 'partie-rapide'); await page.fill('#dp-nom', 'Golf de Test'); await page.click('[data-a="pt-nouvelle"]');
    await page.waitForSelector('#calque-partie .pave');
    if (!(await page.locator('.pv-sjc').count())) await page.click('#calque-partie [data-a="mode-saisie"][data-v="detail"]');   /* express par défaut */
    r.ligneSansDistance = await page.textContent('.pv-sjc');
    await page.click('[data-a="pv-par"]'); await page.click('[data-a="pv-par"]'); /* par 3 */
    await page.click('[data-a="pv-long"]'); await page.fill('#pv-long', '145'); await page.press('#pv-long', 'Enter');
    r.ligne = await page.textContent('.pv-sjc');
    verifie(/145 m/.test(r.ligne), nom + ' ligne du pavé : ' + r.ligne);
    await page.click('.pv-sjc'); await page.waitForSelector('.pv-panneau.sjc');
    await page.click('[data-a="sjc-vent"][data-v="face"]'); await page.click('[data-a="sjc-force"][data-v="2"]');
    for (let i = 0; i < 5; i++) await page.click('[data-a="sjc-pente"][data-d="1"]');
    await page.click('[data-a="sjc-temp"][data-v="froid"]');
    const att = S.seJoueComme(145, { vent: 'face', force: 2, pente: 5, temp: 'froid' });
    r.seJoue = await page.textContent('.sjc-resultat .main');
    verifie(+r.seJoue === att.d, nom + ' se joue comme ' + att.d + ' : ' + r.seJoue);
    e = await lire();
    const clubs = ['dr', 'b3', 'b5', 'f4', 'f5', 'f6', 'f7', 'f8', 'f9', 'pw', 'sw'].map(id => ({ id, f: S.fourchette(e.carnet.clubs[id] || []) }));
    const conseil = S.clubPour(att.d, clubs);
    r.conseil = await page.textContent('.sjc-conseil');
    r.clubSurligne = await page.$$eval('.sjc-clubs li.conseil b', l => l.map(x => x.textContent).join(''));
    verifie(r.clubSurligne === { f5: '5', f6: '6', f4: '4', b5: '5' }[conseil.id] || r.clubSurligne.includes(conseil.id.slice(1)), nom + ' club conseillé ' + conseil.id + ' : ' + r.conseil + ' / ' + r.clubSurligne);
    verifie(await page.locator('.sjc-sac').count() === 0, nom + ' plus de petit sac 3D dans la stratégie');
    await vue('04-se-joue-comme');
    await page.evaluate(() => { const p = document.querySelector('.pv-panneau'); p.scrollTop = p.scrollHeight; }); await vue('04b-se-joue-comme-bas');
    /* Visée : eau à gauche, drapeau à gauche */
    await page.click('[data-a="strat-ouvrir"]'); await page.waitForSelector('.pv-panneau.strat');
    r.conseilSansDanger = await page.textContent('.strat-conseil b');
    await page.click('[data-a="strat-danger"][data-k="g"]'); await page.click('[data-a="strat-danger"][data-k="g"]');
    await page.click('.strat-zone[data-p="milieu"][data-c="gauche"]', { force: true });
    r.conseilEau = await page.textContent('.strat-conseil');
    verifie(/à droite du drapeau/.test(r.conseilEau) && /% de ta dispersion reste en sécurité/.test(r.conseilEau), nom + ' visée loin de l\'eau : ' + r.conseilEau);
    r.coteGauche = await page.textContent('.strat-cote.g');
    await page.click('[data-a="strat-green"][data-v="p"]');
    r.conseilPetit = await page.textContent('.strat-conseil b');
    await vue('05-visee');
    await page.evaluate(() => { const p = document.querySelector('.pv-panneau'); p.scrollTop = p.scrollHeight; }); await vue('05b-visee-bas');
    e = await lire();
    r.dangersMemo = JSON.stringify({ d: e.parcours[0].dangers[0], g: e.parcours[0].greens[0] });
    verifie(e.parcours[0].dangers[0] && e.parcours[0].dangers[0].g === 'eau' && e.parcours[0].greens[0] === 'p', nom + ' dangers retenus pour le trou : ' + r.dangersMemo);
    /* Noter le coup avec le club conseillé, direction posée sur l'ellipse */
    await page.click('[data-a="strat-noter"]'); await page.waitForSelector('.pv-panneau .ell-cible[data-ctx="coup"]');
    r.clubCoup = await page.$eval('.pv-clubs [aria-pressed="true"]', b => b.getAttribute('data-id'));
    /* Le panneau reste sur l'ellipse après le toucher (il ne remonte pas en haut). */
    await page.evaluate(() => document.querySelector('.pv-panneau .ell-cible[data-ctx="coup"]').scrollIntoView({ block: 'center' }));
    const hautAvant = await page.$eval('.pv-panneau', p => p.scrollTop);
    await poser('coup', 7, -4);
    const hautApres = await page.$eval('.pv-panneau', p => p.scrollTop);
    r.defilement = hautAvant + ' → ' + hautApres;
    verifie(hautAvant > 0 && Math.abs(hautApres - hautAvant) <= 2, nom + ' le panneau reste sur l\'ellipse : ' + r.defilement);
    r.coupApresPoint = (await page.inputValue('#pv-dist')) + ' m · ' + await page.textContent('.pv-panneau .ell-reglage b');
    verifie(/^ m · [6-8]\s*m à droite/.test(r.coupApresPoint), nom + ' coup posé : direction seulement, distance non remplie : ' + r.coupApresPoint);
    await vue('06-coup-ellipse');
    await page.click('#pv-coup-ok');
    r.coupListe = await page.textContent('.pv-coups-liste');
    /* Erreurs évitables : 3 putts depuis 2 à 5 m, bunker */
    await page.click('[data-a="pv-putts"][data-d="1"]');
    r.chip3putts = await page.$eval('[data-a="pv-evit"][data-v="4"]', b => b.getAttribute('aria-pressed') + (b.disabled ? ' désactivé' : ''));
    if (!(await page.locator('.pv-plus[open]').count())) await page.click('.pv-plus summary');
    await page.click('[data-a="pt-set"][data-k="8"][data-v="3"]');
    r.chip3auto = await page.$eval('[data-a="pv-evit"][data-v="4"]', b => b.getAttribute('aria-pressed') + (b.disabled ? ' désactivé' : '') + ' · ' + b.querySelector('small').textContent);
    verifie(/^true désactivé/.test(r.chip3auto), nom + ' trois-putts court déduit : ' + r.chip3auto);
    await page.click('[data-a="pt-set"][data-k="10"][data-v="1"]');
    await page.evaluate(() => document.querySelector('.pv-evit').scrollIntoView({ block: 'center' })); await page.waitForTimeout(80);
    await vue('07-erreurs');
    await page.click('#pt-suiv');
    /* Trou 2 : double approche d'un toucher */
    await page.click('[data-a="pv-evit"][data-v="2"]');
    r.chipDouble = await page.$eval('[data-a="pv-evit"][data-v="2"]', b => b.getAttribute('aria-pressed'));
    await page.click('#pt-suiv');
    e = await lire();
    r.trous = JSON.stringify(e.partie.trous.slice(0, 2));
    verifie(e.partie.trous[0].length === 11 && e.partie.trous[0][8] === 3 && e.partie.trous[0][10] === 1 && e.partie.trous[1][9] === 2, nom + ' trous à 11 cases : ' + r.trous);
    verifie(e.partie.coups[0][0].l != null && Math.abs(e.partie.coups[0][0].l - 7) <= 1, nom + ' direction du coup enregistrée : ' + JSON.stringify(e.partie.coups[0]));
    for (let i = 2; i < 18; i++) await saisirTrou(page, [1, 0, 2, i === 5 ? 1 : 0, 5 + (i === 5 ? 1 : 0), 4, 0, 1, 0, 0, 0]);
    await page.waitForSelector('.partie.express');
    r.expressErreurs = await page.textContent('.evit-partie');
    verifie(/3 erreurs évitables/.test(r.expressErreurs.replace(/\s+/g, ' ')) && /trou 1/.test(r.expressErreurs) && /trou 2/.test(r.expressErreurs), nom + ' erreurs du bilan express : ' + r.expressErreurs);
    await page.evaluate(() => document.querySelector('.evit-partie').scrollIntoView({ block: 'center' })); await page.waitForTimeout(80);
    await vue('08-express-erreurs');
    await page.click('[data-a="pt-express-chiffres"]'); await page.waitForSelector('.partie.bilan');
    r.bilanErreurs = await page.textContent('.partie.bilan .evit-partie');
    await page.click('[data-a="pt-bilan-fermer"]');

    /* ---- 4. Bilan : notes sur 100, priorité, objectif d'index, erreurs évitables ---- */
    e = await lire();
    const pars = e.parties[0].trous.map(t => t[5]), jours = n => new Date(Date.now() - n * 864e5).toISOString();
    e.parties = [3, 5, 7].map((g, i) => ({ d: jours(20 - i * 5), trous: partiePave(g, pars), pc: e.parcours[0].id, o: 0 })).concat(e.parties);
    e.maj += 1; await ecrire(e); await recharger();
    e = await lire();
    await allerVue(page, 'bilan');
    await allerVue(page, 'bilan', 'notes'); /* UX06 */
    if (!(await page.$eval('#notes', x => x.classList.contains('ouvert')))) await page.click('[data-a="pli"][data-v="notes"]');
    const no = A.notesSecteurs(e.parties), pr = A.prioriteSemaine(e.parties, 15);
    r.jauges = await page.$$eval('#notes .jn', l => l.map(x => x.getAttribute('aria-label')));
    r.notesCalc = no.secteurs.map(s => s.id + '=' + s.note).join(' ');
    verifie(r.jauges.length === 4 && no.secteurs.every((s, i) => s.note == null || r.jauges[i].includes(s.note + ' sur 100')), nom + ' jauges = notes calculées : ' + r.notesCalc + ' / ' + r.jauges.join(' | '));
    r.priorite = await page.textContent('#notes .prio-semaine .une-titre');
    verifie(pr.priorite && r.priorite === pr.priorite.nom, nom + ' priorité de la semaine : ' + r.priorite + ' (calculée ' + (pr.priorite && pr.priorite.nom) + ')');
    await page.evaluate(() => document.getElementById('notes').scrollIntoView()); await page.waitForTimeout(80);
    await vue('09-notes');
    await allerVue(page, 'bilan', 'sg'); /* UX06 */
    if (!(await page.$eval('#sg', x => x.classList.contains('ouvert')))) await page.click('[data-a="pli"][data-v="sg"]');
    r.deuxSecteurs = await page.$$eval('#sg .deux-secteurs li', l => l.map(x => x.textContent.replace(/\s+/g, ' ').trim()));
    verifie(r.deuxSecteurs.length === Math.min(2, pr.deux.length), nom + ' deux secteurs face à l\'objectif : ' + r.deuxSecteurs.join(' | '));
    r.reperesPlus = await page.$$eval('#sg .titre-bloc + .defile tbody tr', l => l.map(x => x.textContent.replace(/\s+/g, ' ').trim())).catch(() => []);
    await page.evaluate(() => document.querySelector('#sg .deux-secteurs').scrollIntoView()); await page.waitForTimeout(80);
    await vue('10-objectif');
    await allerVue(page, 'bilan', 'evitables'); /* UX06 */
    if (await page.locator('#evitables').count()) {
      if (!(await page.$eval('#evitables', x => x.classList.contains('ouvert')))) await page.click('[data-a="pli"][data-v="evitables"]');
      r.evitables = await page.$eval('#evitables .evit-total', x => x.textContent);
      const ee = A.erreursEvitables(e.parties, 90);
      verifie(r.evitables.includes(String(ee.erreurs).replace('.', ',')), nom + ' erreurs évitables par partie : ' + r.evitables + ' / ' + ee.erreurs);
      await page.evaluate(() => document.getElementById('evitables').scrollIntoView()); await page.waitForTimeout(80);
      await vue('11-evitables');
    } else verifie(false, nom + ' encart des erreurs évitables absent');
    /* Accueil : la carte « Ton jeu sur 100 » */
    await allerVue(page, 'accueil');
    /* L'accueil « Mon jeu » (refonte du 19 novembre) n'affiche plus forcément les jauges. */
    r.accueilNotes = await page.locator('.notes-accueil .jn').count();
    if (r.accueilNotes) {
      verifie(r.accueilNotes === 4, nom + ' jauges sur l\'accueil');
      await page.evaluate(() => document.querySelector('.notes-accueil').scrollIntoView({ block: 'center' })); await page.waitForTimeout(80);
    }
    await vue('12-accueil-notes');
    /* Profil : objectif d'index */
    await allerVue(page, 'profil');
    await page.click('[data-a="index-vise"][data-v="10"]');
    e = await lire();
    verifie(e.profil.indexVise === 10, nom + ' objectif d\'index enregistré');
    await page.evaluate(() => document.querySelector('.index-vise').scrollIntoView({ block: 'center' })); await page.waitForTimeout(80);
    await vue('13-profil-objectif');
    await allerVue(page, 'bilan');
    await allerVue(page, 'bilan', 'sg'); /* UX06 */
    if (!(await page.$eval('#sg', x => x.classList.contains('ouvert')))) await page.click('[data-a="pli"][data-v="sg"]');
    r.cibleBilan = await page.textContent('#sg .cible .main');
    verifie(r.cibleBilan === '10', nom + ' bilan face à l\'index 10 : ' + r.cibleBilan);
    r.largeur = await page.evaluate(() => document.documentElement.scrollWidth);
    verifie(r.largeur <= w, nom + ' pas de débordement : ' + r.largeur);
    await ctx.close();
  }
  console.log(JSON.stringify({ res, ko, errs }, null, 1));
  await browser.close();
})().catch(e => { console.error('ECHEC', String(e.stack || e.message).split('\n').filter(l => !/retrying|waiting|scrolling|stable/.test(l)).slice(0, 12).join('\n')); process.exit(1); });
