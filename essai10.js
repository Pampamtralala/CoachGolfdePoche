/* Nouveautés : série au practice et dispersion, partie à une main (coups, GPS, partenaires, bandeau, écran allumé, vibration),
   bilan express, carte en image, meilleurs et pires trous, défi chronométré. */
const { chromium } = require('playwright');
const fs = require('fs');
const { allerVue, menuAction, lirePave, saisirTrou } = require('./nav-essai');
const E = require('./src/engine-plus.js');
const F = '/home/claude/polices/node_modules/@fontsource/';
const face = (fam, file, w) => `@font-face{font-family:"${fam}";font-weight:${w};src:url(data:font/woff2;base64,${fs.readFileSync(F + file).toString('base64')}) format("woff2");}`;
const POLICES = [face('Barlow Condensed', 'barlow-condensed/files/barlow-condensed-latin-600-normal.woff2', 600), face('Barlow Condensed', 'barlow-condensed/files/barlow-condensed-latin-700-normal.woff2', 700),
  face('Atkinson Hyperlegible', 'atkinson-hyperlegible/files/atkinson-hyperlegible-latin-400-normal.woff2', 400), face('Atkinson Hyperlegible', 'atkinson-hyperlegible/files/atkinson-hyperlegible-latin-700-normal.woff2', 700), face('Manrope', 'manrope/files/manrope-latin-700-normal.woff2', 700), face('Manrope', 'manrope/files/manrope-latin-800-normal.woff2', 800)].join('\n');
const CLE = 'coachgolf.v1';
/* Faux capteurs : on compte les vibrations et les demandes d'écran allumé. */
const CAPTEURS = () => {
  window.__vib = [];
  try { Object.defineProperty(navigator, 'vibrate', { configurable: true, value: x => { window.__vib.push(x); return true; } }); } catch (e) { /* rien */ }
  window.__eveil = { pris: 0, rendu: 0 };
  try {
    Object.defineProperty(navigator, 'wakeLock', { configurable: true, value: { request: () => { window.__eveil.pris++; return Promise.resolve({ release() { window.__eveil.rendu++; return Promise.resolve(); }, addEventListener() {} }); } } });
  } catch (e) { /* rien */ }
};
/* Parties anciennes sur un parcours : le 6 toujours raté, le 3 souvent bien joué. */
function partieType(graine, pars) {
  let g = graine; const alea = () => (g = (g * 16807) % 2147483647) / 2147483647;
  return pars.map((par, i) => {
    let p = alea() < 0.2 ? 3 : 2, x = 0, extra = alea() < 0.45 ? 1 : 0;
    if (i === 5) { x = 1; extra = 1 + (alea() < 0.5 ? 1 : 0); }
    if (i === 2) { extra = 0; p = alea() < 0.5 ? 1 : 2; }
    const s = par - 1 + p + x + extra - (i === 2 ? 1 : 0);
    return [x ? 0 : 1, s - p <= par - 2 ? 1 : 0, p, x, s, par, x ? 3 : 0, 0, p ? 2 : 0];
  });
}

(async () => {
  const D = 'shots10'; fs.mkdirSync(D, { recursive: true });
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const res = {}, errs = [], ko = [];
  const verifie = (c, m) => { if (!c) ko.push(m); };
  for (const [w, sombre] of [[390, false], [360, true]]) {
    const nom = w + (sombre ? 's' : ''), r = res[nom] = {};
    const ctx = await browser.newContext({ viewport: { width: w, height: 844 }, deviceScaleFactor: 2, colorScheme: sombre ? 'dark' : 'light', hasTouch: true, acceptDownloads: true, reducedMotion: 'reduce',
      permissions: ['geolocation'], geolocation: { latitude: 48.8566, longitude: 2.3522, accuracy: 5 } });
    await ctx.addInitScript(CAPTEURS);
    const page = await ctx.newPage();
    page.on('pageerror', e => errs.push(nom + ' PAGEERROR ' + e.message));
    page.on('console', m => { if (m.type() === 'error' && !/fonts\.g|ERR_|Failed to load resource/.test(m.text())) errs.push(nom + ' CONSOLE ' + m.text()); });
    const vue = n => page.screenshot({ path: `${D}/${nom}-${n}.png` });
    const lire = () => page.evaluate(k => JSON.parse(localStorage.getItem(k)), CLE);
    const ecrire = e => page.evaluate(([k, e]) => localStorage.setItem(k, JSON.stringify(e)), [CLE, e]);
    const recharger = async () => { await page.reload(); await page.addStyleTag({ content: POLICES }); await page.evaluate(() => document.fonts.ready); };
    await page.goto('file://' + __dirname + '/dist/index.html'); await page.addStyleTag({ content: POLICES }); await page.evaluate(() => document.fonts.ready);
    await page.click('[data-a="commencer"]'); await page.fill('#q-prenom', 'Benjamin'); await page.fill('#q-index', '18'); await page.click('[data-a="q-suite"]');
    await page.click('[data-k="objectif"][data-v="score"]'); await page.click('[data-a="q-suite"]');
    for (const l of ['practice', 'putting', 'parcours']) await page.click(`[data-a="lieu"][data-v="${l}"]`);
    for (let i = 0; i < 8 && await page.locator('[data-a="q-suite"]').count(); i++) await page.click('[data-a="q-suite"]');
    await page.waitForSelector('.tete');

    /* ---- 1. Série de balles au practice ---- */
    await menuAction(page, 'serie-ouvrir'); await page.waitForSelector('#feuille .serie-saisie');
    await page.click('#feuille [data-a="serie-club"][data-id="f7"]');
    const balle = async v => { await page.fill('#serie-val', String(v)); await page.press('#serie-val', 'Enter'); };
    await balle(145);
    r.focusApresBalle = await page.evaluate(() => document.activeElement && document.activeElement.id);
    await page.click('#feuille [data-a="serie-rapide"][data-v="0"]'); await page.click('#feuille [data-a="serie-rapide"][data-v="5"]'); await page.click('#feuille [data-a="serie-rapide"][data-v="-5"]');
    for (const v of [150, 138, 147, 142, 152, 118]) await balle(v);
    await balle('abc'); r.erreurBalle = await page.textContent('#serie-err');
    r.serieEtat = await page.$eval('#serie-etat', x => x.textContent.replace(/\s+/g, ' ').trim());
    r.nuage = await page.$$eval('#feuille .nuage .n-balle', l => l.length);
    verifie(r.nuage === 10, nom + ' nuage de 10 balles : ' + r.nuage);
    await page.click('#feuille [data-a="serie-suppr"][data-v="9"]');
    r.apresRetrait = await page.$$eval('#feuille .nuage .n-balle', l => l.length);
    await page.waitForTimeout(150); await vue('01-serie');
    await page.evaluate(() => { const f = document.getElementById('feuille'); f.scrollTop = f.scrollHeight; }); await vue('01b-serie-bas');
    await page.click('#feuille [data-a="serie-fin"]');
    let e = await lire();
    r.series = JSON.stringify(e.carnet.series.map(s => [s.c, s.v.length]));
    verifie(e.carnet.series.length === 1 && e.carnet.series[0].c === 'f7' && e.carnet.series[0].v.length === 9, nom + ' série enregistrée : ' + r.series);
    verifie((e.carnet.clubs.f7 || []).length === 9, nom + ' mesures du fer 7 : ' + JSON.stringify(e.carnet.clubs.f7));
    r.annonce = await page.$eval('.message, [role="status"]', x => x.textContent).catch(() => '');
    /* Fiche du fer 7 : dispersion et distance fiable */
    await allerVue(page, 'sac');
    const toucher = async id => { const b = page.locator(`#sac-scene [data-id="${id}"]`); const bb = await b.boundingBox(); await b.click({ position: { x: bb.width * 0.68, y: bb.height * 0.3 } }); };
    await toucher('f7'); await page.waitForTimeout(250);
    r.infoF7 = await page.$eval('.sac-info', x => x.textContent.replace(/\s+/g, ' ').trim()).catch(() => 'pas de bulle');
    verifie(/90/.test(r.infoF7), nom + ' distance fiable à 90 % dans la bulle : ' + r.infoF7);
    await vue('02-sac-f7');
    await toucher('f7'); await page.waitForSelector('#feuille .sac-ellipse');
    const dsp = E.dispersion(e.carnet.clubs.f7);
    r.dispersion = await page.$eval('#feuille .disp-chiffres', x => x.textContent.replace(/\s+/g, ' ').trim());
    r.dispersionCalc = JSON.stringify(dsp);
    verifie(r.dispersion.includes(String(dsp.p10)), nom + ' fiable à 90 % affiché = calculé (' + dsp.p10 + ')');
    await page.waitForTimeout(450); await page.evaluate(() => document.querySelector('#feuille .sac-ellipse').scrollIntoView({ block: 'center' })); await page.waitForTimeout(150);
    await vue('03-fiche-dispersion');
    await page.click('#f-fermer'); await page.waitForSelector('#feuille', { state: 'detached' });

    /* ---- 2. Départ avec deux partenaires ---- */
    await menuAction(page, 'partie-rapide');
    await page.fill('#dp-nom', 'Golf de Test');
    for (const n of ['Léa', 'Marc']) { await page.fill('#dp-joueur', n); await page.click('[data-a="dp-joueur-ajout"]'); }
    r.partenaires = await page.$$eval('.dp-joueurs .puce', l => l.map(x => x.textContent.replace('×', '').trim()).join(', '));
    await page.evaluate(() => document.querySelector('.dp-joueurs').scrollIntoView({ block: 'center' })); await vue('04-depart-partenaires');
    await page.click('[data-a="pt-nouvelle"]'); await page.waitForSelector('#calque-partie .pave');
    await page.waitForTimeout(100);
    r.eveilPris = await page.evaluate(() => window.__eveil.pris);
    verifie(r.eveilPris >= 1, nom + ' écran allumé demandé au départ');
    await vue('05-pave');
    /* Un coup au fer 7 : la distance proposée est la moyenne du club */
    await page.click('#calque-partie [data-a="pv-coup"][data-v="-1"]'); await page.waitForSelector('.pv-panneau');
    await page.click('.pv-panneau [data-a="pv-club"][data-id="f7"]');
    r.distanceProposee = await page.inputValue('#pv-dist');
    const moyF7 = Math.round(e.carnet.clubs.f7.reduce((a, b) => a + b, 0) / e.carnet.clubs.f7.length);
    verifie(r.distanceProposee === String(moyF7), nom + ' distance proposée = moyenne du fer 7 : ' + r.distanceProposee + ' / ' + moyF7);
    await page.click('.pv-panneau [data-a="pv-dist"][data-d="5"]'); await page.click('.pv-panneau [data-a="pv-dist"][data-d="1"]');
    r.apresReglage = await page.inputValue('#pv-dist');
    /* GPS : départ ici, arrivée 150 m plus au nord */
    r.gpsBoutons = await page.locator('.pv-gps button').count();
    await page.click('.pv-panneau [data-a="pv-gps"][data-v="a"]'); await page.waitForSelector('.pv-gps button[data-v="b"]:not([disabled])');
    await ctx.setGeolocation({ latitude: 48.8566 + 150 / 111195, longitude: 2.3522, accuracy: 5 });
    await page.click('.pv-panneau [data-a="pv-gps"][data-v="b"]'); await page.waitForFunction(() => /Distance mesurée/.test((document.getElementById('pv-gps-etat') || {}).textContent || ''));
    r.gps = (await page.inputValue('#pv-dist')) + ' m · ' + await page.textContent('#pv-gps-etat');
    verifie(Math.abs(parseInt(await page.inputValue('#pv-dist'), 10) - 150) <= 1, nom + ' distance GPS ≈ 150 m : ' + r.gps);
    await vue('06-coup-gps');
    await page.click('#pv-coup-ok');
    r.messageCoup = await page.$eval('#message, .message', x => x.textContent).catch(() => '');
    /* Un coup de wedge à mi-swing, distance tapée */
    await page.click('#calque-partie [data-a="pv-coup"][data-v="-1"]');
    await page.click('.pv-panneau [data-a="pv-club"][data-id="sw"]');
    await page.click('.pv-panneau [data-a="pv-amplitude"][data-v="a2"]');
    await page.fill('#pv-dist', '42'); await page.dispatchEvent('#pv-dist', 'input');
    await vue('07-coup-wedge');
    await page.click('#pv-coup-ok');
    r.coupsNotes = await page.$$eval('#calque-partie .pv-coups-liste button', l => l.map(x => x.textContent).join(' | '));
    verifie(r.coupsNotes.split(' | ').length === 2, nom + ' deux coups notés : ' + r.coupsNotes);
    /* Partenaires : par pour Léa, bogey pour Marc */
    await page.click('#calque-partie [data-a="pv-joueur"][data-j="0"][data-d="0"]');
    await page.click('#calque-partie [data-a="pv-joueur"][data-j="1"][data-d="1"]');
    r.partenairesTrou1 = await page.$$eval('#calque-partie .pv-j-val', l => l.map(x => x.textContent).join(' '));
    await page.evaluate(() => { document.getElementById('calque-partie').scrollTop = 1e4; }); await page.waitForTimeout(80);
    await vue('08-pave-bas');
    await page.evaluate(() => { document.getElementById('calque-partie').scrollTop = 0; });
    await page.click('#pt-suiv');
    r.vibrations = await page.evaluate(() => JSON.stringify(window.__vib));
    verifie(r.vibrations !== '[]', nom + ' vibration à la validation');
    /* Le sac a déjà le coup du parcours */
    await page.click('#calque-partie [data-a="pt-fermer"]');
    r.bandeau = await page.textContent('.bandeau-partie');
    verifie(/Trou 2 · par 4/.test(r.bandeau), nom + ' bandeau : ' + r.bandeau);
    await allerVue(page, 'sac');
    r.bandeauSac = await page.locator('.bandeau-partie').count();
    await toucher('f7'); await page.waitForTimeout(200); if (!(await page.locator('#feuille').count())) await toucher('f7'); await page.waitForSelector('#feuille .sac-ellipse');
    r.ficheParcours = await page.$eval('#feuille .sac-parcours', x => x.textContent).catch(() => 'aucune ligne');
    verifie(/150/.test(r.ficheParcours), nom + ' coup du parcours dans la fiche : ' + r.ficheParcours);
    e = await lire();
    r.coupsEnregistres = JSON.stringify(e.partie.coups[0]);
    await page.click('#f-fermer'); await page.waitForSelector('#feuille', { state: 'detached' });
    await page.evaluate(() => window.scrollTo(0, 0));
    await vue('09-bandeau-sac');
    await page.click('.bandeau-partie'); await page.waitForSelector('#calque-partie .pave');
    r.repriseBandeau = await page.textContent('#pt-titre');

    /* ---- 3. La partie jusqu'au 18, avec les partenaires ---- */
    const PARS = [4, 4, 3, 4, 5, 4, 3, 4, 5, 4, 4, 3, 4, 5, 4, 3, 4, 5];
    const jeu = partieType(77, PARS);
    for (let i = 1; i < 18; i++) {
      if (i % 3 === 0) { await page.click('#calque-partie [data-a="pv-joueur"][data-j="0"][data-d="1"]'); await page.click('#calque-partie [data-a="pv-joueur"][data-j="1"][data-d="0"]'); }
      await saisirTrou(page, jeu[i]);
    }
    await page.waitForSelector('.partie.express');
    r.express = await page.$$eval('.xp-points li', l => l.map(x => x.className + ' : ' + x.querySelector('b').textContent + ' → ' + Array.from(x.querySelectorAll('.puce')).map(p => p.textContent).join(' / ')));
    verifie(r.express.length === 3, nom + ' trois points clés : ' + r.express.length);
    r.expressJoueurs = await page.textContent('.xp-joueurs').catch(() => '');
    r.vibrationsFin = await page.evaluate(() => JSON.stringify(window.__vib.slice(-1)));
    r.eveilRendu = await page.evaluate(() => window.__eveil.rendu);
    verifie(r.eveilRendu >= 1, nom + ' écran rendu à la fin de la partie');
    await vue('10-express');
    await page.evaluate(() => { document.getElementById('calque-partie').scrollTop = 1e4; }); await page.waitForTimeout(80); await vue('10b-express-bas');
    /* Carte en image */
    r.boutonImage = await page.locator('[data-a="pt-image"]').count();
    if (r.boutonImage) {
      const [dl] = await Promise.all([page.waitForEvent('download'), page.click('[data-a="pt-image"]')]);
      r.fichierImage = dl.suggestedFilename();
      await dl.saveAs(`${D}/${nom}-carte.png`);
      verifie(/^carte-de-score-\d{4}-\d{2}-\d{2}\.png$/.test(r.fichierImage), nom + ' nom du fichier : ' + r.fichierImage);
    } else verifie(false, nom + ' bouton image absent');
    /* Liens vers les exercices */
    r.lienExo = await page.$eval('.xp-points [data-a]', b => b.getAttribute('data-a') + ' ' + (b.getAttribute('data-id') || b.getAttribute('data-v') || '')).catch(() => 'aucun lien');
    await page.click('[data-a="pt-express-chiffres"]'); await page.waitForSelector('.partie.bilan');
    await page.click('#calque-partie [data-a="pt-bilan-carte"]'); await page.waitForSelector('#feuille .carte-score.marqueur');
    r.carteMarqueur = await page.$$eval('#feuille .carte-score.marqueur tbody tr', l => l.map(x => Array.from(x.cells).slice(0, 4).map(c => c.textContent).join(' ') + ' … ' + x.cells[x.cells.length - 1].textContent));
    r.listeCoups = await page.$$eval('#feuille .liste-coups li', l => l.map(x => x.textContent));
    await page.evaluate(() => document.querySelector('#feuille .carte-score.marqueur').scrollIntoView({ block: 'center' })); await page.waitForTimeout(80);
    await vue('11-carte-marqueur');
    await page.keyboard.press('Escape');
    e = await lire();
    const pt = e.parties[e.parties.length - 1];
    r.partieJoueurs = JSON.stringify(pt.joueurs.map(j => [j.nom, j.s.filter(x => x != null).length, E.scoreJoueur(j.s, pt.trous.map(x => x[5])).ecart]));
    verifie(pt.joueurs.length === 2 && pt.joueurs[0].s[0] === 4 && pt.joueurs[1].s[0] === 5, nom + ' scores des partenaires : ' + r.partieJoueurs);
    verifie(pt.coups && pt.coups[0] && pt.coups[0].length === 2 && pt.coups[0][0].c === 'f7' && pt.coups[0][0].g && pt.coups[0][1].a === 'a2', nom + ' coups enregistrés avec la partie');

    /* ---- 4. Meilleurs et pires trous ---- */
    const pc = e.parcours[0];
    pc.pars = PARS.slice();
    const jours = n => new Date(Date.now() - n * 864e5).toISOString();
    e.parties = [11, 12, 13, 14].map((g, i) => ({ d: jours(30 - i * 6), trous: partieType(g, PARS), pc: pc.id, o: 0 })).concat(e.parties.map(p => Object.assign(p, { trous: p.trous.map((x, k) => (x[5] = PARS[k], x)) })));
    e.maj += 1; await ecrire(e); await recharger();
    await allerVue(page, 'parcours', 'c-parcours');
    r.listeParcours = await page.$eval('#c-parcours .ligne', x => x.textContent.replace(/\s+/g, ' ').trim());
    await page.click('[data-a="pc-ouvrir"]'); await page.waitForSelector('#feuille .top-flop');
    const an = E.analyseParcours(e.parties, e.parcours[0]), tf = E.topFlopTrous(an, 2);
    r.flop = await page.$$eval('#feuille .top-flop .flop .tf-trou', l => l.map(x => x.textContent).join(' '));
    r.top = await page.$$eval('#feuille .top-flop .top .tf-trou', l => l.map(x => x.textContent).join(' '));
    verifie(r.flop === tf.flop.map(x => x.h + 1).join(' ') && r.top === tf.top.map(x => x.h + 1).join(' '), nom + ' top/flop affichés = calculés : ' + r.flop + ' / ' + r.top);
    verifie(r.flop.split(' ')[0] === '6', nom + ' le 6 est le pire trou');
    await page.evaluate(() => document.querySelector('#feuille .top-flop').scrollIntoView({ block: 'center' })); await page.waitForTimeout(80);
    await vue('12-top-flop');
    await page.click('#f-fermer'); await page.waitForSelector('#feuille', { state: 'detached' });

    /* ---- 5. Défi chronométré : 20 putts de 1 m ---- */
    await allerVue(page, 'exercices', 'defis');
    await page.click('[data-a="defi"][data-id="vingt"]'); await page.waitForSelector('#feuille .chrono');
    r.chronoAvant = await page.$eval('#feuille .chrono', x => x.textContent);
    await page.click('#feuille [data-a="defi-coup"][data-v="1"]');
    r.chronoActif = await page.locator('#feuille .chrono.actif[data-t0]').count();
    await page.waitForTimeout(2200);
    r.chronoDefile = await page.$eval('#feuille .chrono .main', x => x.textContent);
    verifie(r.chronoDefile !== '0:00', nom + ' le chronomètre défile : ' + r.chronoDefile);
    await vue('13-defi-chrono');
    for (let i = 1; i < 20; i++) await page.click(`#feuille [data-a="defi-coup"][data-v="${i % 7 === 3 ? 0 : 1}"]`);
    r.evt = await page.textContent('#feuille .evt');
    verifie(/Temps\s*:\s*[2-9]\s*s\./.test(r.evt), nom + ' temps de l\'essai : ' + r.evt);
    r.meilleurTemps = await page.$$eval('#feuille .stats > div', l => l.map(x => x.textContent).join(' | '));
    e = await lire();
    r.defiEtat = JSON.stringify({ temps: e.defis.vingt.temps, hist: e.defis.vingt.hist });
    verifie(e.defis.vingt.temps >= 2 && e.defis.vingt.hist[0].s >= 2, nom + ' meilleur temps enregistré : ' + r.defiEtat);
    await vue('14-defi-fini');
    await ctx.close();
  }
  console.log(JSON.stringify({ res, ko, errs }, null, 1));
  await browser.close();
})().catch(e => { console.error('ECHEC', String(e.stack || e.message).split('\n').filter(l => !/retrying|waiting|scrolling|stable/.test(l)).slice(0, 12).join('\n')); process.exit(1); });
