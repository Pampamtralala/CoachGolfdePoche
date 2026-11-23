/* Carte GPS : recherche du golf (réseau simulé), téléchargement, distances entrée / milieu / fond avec un GPS simulé,
   carte du trou, point mesuré, position posée à la main sans GPS, import de fichier, numérotation, relevé sur place. */
const { chromium } = require('playwright');
const fs = require('fs');
const { allerVue, menuAction } = require('./nav-essai');
const C = require('./src/engine-carte.js');
const D = require('./carte-essai.js');
const F = '/home/claude/polices/node_modules/@fontsource/';
const face = (fam, file, w) => `@font-face{font-family:"${fam}";font-weight:${w};src:url(data:font/woff2;base64,${fs.readFileSync(F + file).toString('base64')}) format("woff2");}`;
const POLICES = [face('Barlow Condensed', 'barlow-condensed/files/barlow-condensed-latin-600-normal.woff2', 600), face('Barlow Condensed', 'barlow-condensed/files/barlow-condensed-latin-700-normal.woff2', 700),
  face('Atkinson Hyperlegible', 'atkinson-hyperlegible/files/atkinson-hyperlegible-latin-400-normal.woff2', 400), face('Atkinson Hyperlegible', 'atkinson-hyperlegible/files/atkinson-hyperlegible-latin-700-normal.woff2', 700),
  face('Manrope', 'manrope/files/manrope-latin-700-normal.woff2', 700), face('Manrope', 'manrope/files/manrope-latin-800-normal.woff2', 800)].join('\n');
const CLE = 'coachgolf.v1', GEO = 'coachgolf.geo.v1';
const T = D.trous();
const geo = (x, y, pr) => Object.assign(D.position(x, y), { accuracy: pr || 5 });
const net = s => String(s == null ? '' : s).replace(/[\u00a0\u202f]/g, ' ');
/* Toucher la carte à (dx, dy) mètres du milieu du green, dans le repère de la vue (dy vers le haut de l'écran). */
async function toucherCarte(page, dx, dy) {
  const v = await page.evaluate(() => {
    const s = document.querySelector('.carte-plan svg'), r = s.getBoundingClientRect(), vb = s.viewBox.baseVal, c = document.querySelector('.cp-milieu');
    return { x: r.left, y: r.top, w: r.width, h: r.height, W: vb.width, H: vb.height, cx: +c.getAttribute('cx'), cy: +c.getAttribute('cy'), k: +s.getAttribute('data-k') };
  });
  const s = Math.min(v.w / v.W, v.h / v.H);
  await page.mouse.click(v.x + (v.w - v.W * s) / 2 + (v.cx + dx * v.k) * s, v.y + (v.h - v.H * s) / 2 + (v.cy - dy * v.k) * s);
}

(async () => {
  const Dos = 'shots13'; fs.mkdirSync(Dos, { recursive: true });
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const res = {}, errs = [], ko = [];
  const verifie = (c, m) => { if (!c) ko.push(m); };
  const prepare = async (ctx, nom, reseau) => {
    const page = await ctx.newPage();
    page.on('pageerror', e => errs.push(nom + ' PAGEERROR ' + e.message));
    page.on('console', m => { if (m.type() === 'error' && !/fonts\.g|ERR_|Failed to load resource/.test(m.text())) errs.push(nom + ' CONSOLE ' + m.text()); });
    const requetes = [];
    const json = (route, d) => route.fulfill({ contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(d) });
    const golfSeul = { elements: [{ type: 'way', id: 1, tags: { leisure: 'golf_course', name: 'Golf de la Jonchère' }, geometry: [{ lat: 46.19, lon: 2.24 }, { lat: 46.2, lon: 2.24 }, { lat: 46.2, lon: 2.25 }, { lat: 46.19, lon: 2.24 }] }] };
    /* Recherche : Nominatim. */
    await page.route('https://nominatim.openstreetmap.org/**', async route => {
      requetes.push({ url: route.request().url() });
      const r = reseau.mode;
      if (r === 'panne') return route.abort();
      return json(route, r === 'vide' ? [] : D.nominatimTest());
    });
    /* Téléchargement : l'API d'OpenStreetMap. */
    await page.route('https://api.openstreetmap.org/**', async route => {
      requetes.push({ url: route.request().url() });
      const r = reseau.mode;
      if (r === 'panne' || r === 'osmpanne') return route.abort();
      return json(route, r === 'sansgreen' ? golfSeul : r === 'drapeaux' ? D.golfDrapeaux() : D.golfTest());
    });
    /* Secours : Overpass. */
    await page.route('**/api/interpreter', async route => {
      const corps = decodeURIComponent((route.request().postData() || '').replace(/^data=/, ''));
      requetes.push({ url: route.request().url(), corps, type: route.request().headers()['content-type'] });
      const r = reseau.mode;
      if (r === 'panne') return route.abort();
      if (/out tags bb/.test(corps)) return json(route, r === 'vide' ? { elements: [] } : D.rechercheTest());
      return json(route, r === 'sansgreen' ? golfSeul : D.golfTest());
    });
    await page.goto('file://' + __dirname + '/dist/index.html'); await page.addStyleTag({ content: POLICES }); await page.evaluate(() => document.fonts.ready);
    return { page, requetes };
  };
  const profil = async page => {
    await page.click('[data-a="commencer"]'); await page.fill('#q-prenom', 'Benjamin'); await page.fill('#q-index', '14'); await page.click('[data-a="q-suite"]');
    await page.click('[data-k="objectif"][data-v="score"]'); await page.click('[data-a="q-suite"]');
    for (const l of ['practice', 'putting', 'parcours']) await page.click(`[data-a="lieu"][data-v="${l}"]`);
    for (let i = 0; i < 8 && await page.locator('[data-a="q-suite"]').count(); i++) await page.click('[data-a="q-suite"]');
    await page.waitForSelector('.tete');
  };
  const emf = page => page.$$eval('#calque-partie .pv-emf [data-emf]', l => l.map(x => x.textContent).join(' '));
  const attendreMilieu = (page, v) => page.waitForFunction(v => { const b = document.querySelector('#calque-partie .pv-emf [data-emf="m"]'); return b && Math.abs(parseInt(b.textContent, 10) - v) <= 2; }, v, { timeout: 8000 });

  /* ========== 1. Avec GPS : recherche, téléchargement, distances en direct ========== */
  for (const [w, sombre] of [[390, false], [360, true]]) {
    const nom = w + (sombre ? 's' : ''), r = res[nom] = {}, reseau = { mode: 'ok' };
    const ctx = await browser.newContext({ viewport: { width: w, height: 844 }, deviceScaleFactor: 2, colorScheme: sombre ? 'dark' : 'light', hasTouch: true, reducedMotion: 'reduce',
      permissions: ['geolocation'], geolocation: geo(T[0].dep[0], T[0].dep[1]) });
    const { page, requetes } = await prepare(ctx, nom, reseau);
    const vue = n => page.screenshot({ path: `${Dos}/${nom}-${n}.png` });
    const lire = k => page.evaluate(k => JSON.parse(localStorage.getItem(k)), k);
    await profil(page);
    await allerVue(page, 'parcours');
    r.appel = await page.textContent('#c-carte');
    await page.click('#c-carte [data-a="carte-feuille"]'); await page.waitForSelector('#feuille #carte-q');
    /* Nom trop court, aucun résultat, panne */
    await page.fill('#carte-q', 'ab'); await page.click('.carte-form button[type="submit"]');
    r.court = await page.textContent('#feuille .erreur');
    reseau.mode = 'vide'; await page.fill('#carte-q', 'Golf de la Jonchère'); await page.click('.carte-form button[type="submit"]'); await page.waitForSelector('#feuille .erreur');
    r.vide = await page.textContent('#feuille .erreur');
    r.essaisVide = requetes.slice(-2).map(x => decodeURIComponent(x.url.split('&q=')[1] || '')).join(' puis ');
    verifie(r.essaisVide === 'Golf de la Jonchère puis Golf de la Jonchère' || r.essaisVide === 'Golf de la Jonchère', nom + ' recherche vide : ' + r.essaisVide);
    reseau.mode = 'panne'; await page.click('.carte-form button[type="submit"]'); await page.waitForFunction(() => /pas répondu/.test((document.querySelector('#feuille .erreur') || {}).textContent || ''));
    r.panne = await page.textContent('#feuille .erreur');
    r.essaisPanne = requetes.slice(-3).map(x => x.url.replace(/^https:\/\//, '').split('/')[0]).join(' puis ');
    verifie(/trois lettres/.test(r.court) && /Aucun golf/.test(r.vide) && /pas répondu/.test(r.panne), nom + ' messages d\'erreur : ' + [r.court, r.vide, r.panne].join(' | '));
    verifie(r.essaisPanne === 'nominatim.openstreetmap.org puis overpass-api.de puis overpass.private.coffee', nom + ' serveurs de secours essayés en cas de panne : ' + r.essaisPanne);
    /* Recherche qui aboutit */
    reseau.mode = 'ok'; await page.click('.carte-form button[type="submit"]'); await page.waitForSelector('[data-a="carte-choisir"]');
    const rq = requetes[requetes.length - 1];
    r.requete = rq.url;
    verifie(/^https:\/\/nominatim\.openstreetmap\.org\/search\?format=jsonv2/.test(rq.url) && /&q=Golf%20de%20la%20Jonch%C3%A8re$/.test(rq.url), nom + ' requête envoyée : ' + rq.url);
    r.resultats = await page.$$eval('[data-a="carte-choisir"]', l => l.map(x => x.textContent.replace(/\s+/g, ' ').trim()));
    await vue('01-recherche');
    /* À 360 px, l'API d'OpenStreetMap est en panne : Overpass prend le relais. */
    if (sombre) reseau.mode = 'osmpanne';
    await page.click('[data-a="carte-choisir"][data-v="0"]'); await page.waitForSelector('#feuille .carte-ok');
    r.telechargement = requetes.slice(sombre ? -2 : -1).map(x => x.url.replace(/^https:\/\//, '').split('?')[0]).join(' puis ');
    verifie(sombre ? r.telechargement === 'api.openstreetmap.org/api/0.6/map.json puis overpass-api.de/api/interpreter' && /nwr\["golf"\]/.test(requetes[requetes.length - 1].corps)
      : r.telechargement === 'api.openstreetmap.org/api/0.6/map.json' && /bbox=2\.2/.test(requetes[requetes.length - 1].url), nom + ' téléchargement du parcours : ' + r.telechargement);
    reseau.mode = 'ok';
    r.resume = net(await page.textContent('#feuille .carte-resume'));
    r.titre = await page.textContent('#f-titre');
    r.apercu = await page.$$eval('#feuille .cp.apercu text', l => l.map(x => x.textContent).join(' '));
    verifie(/OpenStreetMap : 18 greens sur 18, le \d+ \S+\.$/.test(r.resume) && r.titre === 'Golf de la Jonchère', nom + ' carte installée : ' + r.titre + ' · ' + r.resume);
    let e = await lire(CLE), g = await lire(GEO);
    r.parcours = JSON.stringify(e.parcours.map(p => [p.id, p.nom, p.pars.join('')]));
    verifie(e.parcours.length === 1 && e.parcours[0].pars.join('') === D.PARS.join('') && g.pcs[e.parcours[0].id].trous.length === 18, nom + ' parcours créé avec ses pars : ' + r.parcours);
    verifie(JSON.stringify(e).indexOf('"trous":[{"g"') < 0 && JSON.stringify(e).length < 20000, nom + ' la carte reste hors de l\'état de l\'appli');
    r.tailleCarte = JSON.stringify(g).length;
    await page.evaluate(() => document.querySelector('#feuille .cp.apercu').scrollIntoView({ block: 'center' })); await page.waitForTimeout(80);
    await vue('02-carte-parcours');
    await page.click('#f-fermer'); await page.waitForSelector('#feuille', { state: 'detached' });
    r.appelApres = await page.textContent('#c-carte p');
    /* Partie : distances en direct */
    await page.click('.cta-partie'); await page.waitForSelector('#dp-pc');
    r.departPc = await page.$eval('#dp-pc', s => s.options[s.selectedIndex].textContent);
    await page.click('[data-a="pt-nouvelle"]'); await page.waitForSelector('#calque-partie .pave'); await (require('./nav-essai').modeDetail)(page);
    await attendreMilieu(page, 150);
    r.depart1 = await emf(page);
    r.etat1 = net(await page.textContent('#emf-etat'));
    verifie(r.depart1 === '136 150 164' && /GPS ± 5 m/.test(r.etat1), nom + ' départ du 1 : ' + r.depart1 + ' · ' + r.etat1);
    r.sjc = (await page.textContent('#calque-partie .pv-sjc')).replace(/\s+/g, ' ');
    verifie(/150 m/.test(r.sjc), nom + ' « se joue comme » part du milieu du green : ' + r.sjc);
    r.par1 = await page.textContent('#calque-partie .pv-info b');
    verifie(r.par1 === '3', nom + ' par du trou lu sur la carte : ' + r.par1);
    await vue('03-pave-distances');
    /* On avance de 50 m : les chiffres changent sur place */
    await page.evaluate(() => { window.__pave = document.querySelector('#calque-partie .pv-emf'); });
    await ctx.setGeolocation(geo(T[0].dep[0], T[0].dep[1] + 50, 4));
    await attendreMilieu(page, 100);
    r.apres50 = await emf(page);
    r.memeBouton = await page.evaluate(() => window.__pave === document.querySelector('#calque-partie .pv-emf'));
    verifie(r.apres50 === '86 100 114' && r.memeBouton, nom + ' après 50 m : ' + r.apres50 + ' · bouton conservé ' + r.memeBouton);
    /* Carte du trou */
    await page.click('#calque-partie .pv-emf'); await page.waitForSelector('.pv-panneau.carte svg.cp');
    r.grand = await page.$$eval('.emf-grand [data-emf]', l => l.map(x => x.textContent).join(' '));
    r.formes = await page.evaluate(() => ['cp-green', 'cp-bunker', 'cp-depart', 'cp-ligne', 'cp-moi', 'cp-halo', 'cp-axe', 'cp-bord'].map(c => c + '=' + document.querySelectorAll('.carte-plan .' + c).length).join(' '));
    verifie(r.grand === '86 100 114' && /cp-green=1 cp-bunker=1 cp-depart=1 cp-ligne=1 cp-moi=1 cp-halo=1 cp-axe=1 cp-bord=2/.test(r.formes), nom + ' carte du trou : ' + r.grand + ' · ' + r.formes);
    /* Le joueur est sous le green (le jeu vers le haut) */
    r.sens = await page.evaluate(() => { const m = document.querySelector('.cp-moi'), c = document.querySelector('.cp-milieu'); return [+m.getAttribute('cy') > +c.getAttribute('cy'), Math.abs(+m.getAttribute('cx') - +c.getAttribute('cx')) < 3]; });
    verifie(r.sens[0] && r.sens[1], nom + ' le jeu va vers le haut, dans l\'axe : ' + r.sens);
    /* Toucher un point : le bunker, à gauche et avant le green */
    await toucherCarte(page, -18, -16);
    r.mesure = net(await page.textContent('#carte-info'));
    verifie(/à 8[5-7] m de toi, puis 2[3-5] m/.test(r.mesure), nom + ' point mesuré sur le bunker : ' + r.mesure);
    await page.waitForTimeout(100); await vue('04-carte-trou');
    await page.click('[data-a="carte-zoom"][data-v="green"]');
    r.zoom = await page.$eval('[data-a="carte-zoom"][data-v="green"]', b => b.getAttribute('aria-pressed'));
    await vue('05-carte-green');
    await page.keyboard.press('Escape');
    r.fermeEchap = await page.locator('.pv-panneau.carte').count();
    verifie(r.fermeEchap === 0, nom + ' Échap ferme la carte');
    /* Sur le green */
    await ctx.setGeolocation(geo(T[0].green[0], T[0].green[1] - 5, 3));
    await page.waitForFunction(() => /sur le green/.test((document.getElementById('emf-etat') || {}).textContent || ''));
    r.surGreen = (await emf(page)) + ' · ' + await page.textContent('#emf-etat');
    /* Trou 2 : par 4 joué vers le sud */
    await page.click('#pt-suiv');
    await ctx.setGeolocation(geo(T[1].dep[0], T[1].dep[1], 6));
    await page.waitForFunction(() => { const b = document.querySelector('#calque-partie .pv-emf [data-emf="m"]'); return b && parseInt(b.textContent, 10) > 320; });
    r.trou2 = await emf(page);
    const d2 = C.distancesGreen(T[1].dep, C.dePlat(C.aPlat((() => { const p = []; for (let i = 0; i < 16; i++) { const t = 2 * Math.PI * i / 16; p.push([T[1].green[0] + 11 * Math.cos(t), T[1].green[1] + 14 * Math.sin(t)]); } return p; })())));
    verifie(Math.abs(parseInt(r.trou2.split(' ')[1], 10) - d2.milieu) <= 1, nom + ' trou 2 depuis son départ : ' + r.trou2 + ' (attendu milieu ' + d2.milieu + ')');
    await page.click('#calque-partie .pv-emf'); await page.waitForSelector('.pv-panneau.carte svg.cp');
    r.formes2 = await page.evaluate(() => ['cp-fairway', 'cp-bunker'].map(c => c + '=' + document.querySelectorAll('.carte-plan .' + c).length).join(' '));
    await page.waitForTimeout(100); await vue('06-carte-par4');
    await page.click('#carte-fermer');
    /* Loin du parcours : le GPS est ignoré */
    await ctx.setGeolocation({ latitude: 45.95, longitude: 2.17, accuracy: 10 });
    await page.waitForFunction(() => /loin/.test((document.getElementById('emf-etat') || {}).textContent || ''));
    r.loin = (await emf(page)) + ' · ' + await page.textContent('#emf-etat');
    verifie(/^– – –/.test(r.loin), nom + ' loin du trou : ' + r.loin);
    /* Fiche du parcours : la carte y figure, puis suppression */
    await page.click('#calque-partie [data-a="pt-fermer"]');
    await allerVue(page, 'parcours', 'c-parcours');
    await page.click('[data-a="pc-ouvrir"]'); await page.waitForSelector('#feuille [data-a="carte-feuille"]');
    r.ficheParcours = await page.$eval('#feuille [data-a="carte-feuille"]', b => b.previousElementSibling.textContent);
    await page.click('#feuille [data-a="carte-feuille"]'); await page.waitForSelector('#feuille [data-a="carte-suppr"]');
    await page.click('#feuille [data-a="carte-suppr"]'); await page.click('[data-a="carte-ok-suppr"]');
    g = await lire(GEO);
    verifie(Object.keys(g.pcs).length === 0, nom + ' carte supprimée');
    r.apresSuppr = await page.textContent('#feuille p');
    await ctx.close();
  }

  /* ========== 2. Sans GPS : import de fichier, numérotation, position posée du doigt ========== */
  {
    const nom = 'sansgps', r = res[nom] = {}, reseau = { mode: 'ok' };
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, reducedMotion: 'reduce' });
    await ctx.addInitScript(() => { try { Object.defineProperty(navigator, 'geolocation', { configurable: true, value: undefined }); } catch (e) { /* rien */ } });
    const { page } = await prepare(ctx, nom, reseau);
    const vue = n => page.screenshot({ path: `${Dos}/${nom}-${n}.png` });
    const lire = k => page.evaluate(k => JSON.parse(localStorage.getItem(k)), k);
    await profil(page);
    await menuAction(page, 'carte-nouveau'); await page.waitForSelector('#feuille #carte-q');
    r.boutonAutour = await page.locator('[data-a="carte-autour"]').count();
    verifie(r.boutonAutour === 0, nom + ' pas de recherche « autour de moi » sans GPS');
    /* Fichier illisible, puis export sans tracés de trous */
    await page.click('#feuille details.comment summary');
    await page.setInputFiles('[data-c="carte-fichier"]', { name: 'notes.json', mimeType: 'application/json', buffer: Buffer.from('pas du json') });
    await page.waitForSelector('#feuille .erreur'); r.fichierKo = await page.textContent('#feuille .erreur');
    await page.setInputFiles('[data-c="carte-fichier"]', { name: 'golf-des-essais.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(D.golfTest({ sansTraces: true }))) });
    await page.waitForSelector('#feuille .cp.apercu');
    r.resume = net(await page.textContent('#feuille .carte-resume'));
    verifie(/Fichier importé : 0 green sur 18, le /.test(r.resume), nom + ' import sans tracés : ' + r.resume);
    r.titre = await page.textContent('#f-titre');
    /* Numéroter le premier green libre : trou 1 */
    await page.click('#feuille .cp-libre[data-v="0"]', { force: true }); await page.waitForSelector('.carte-numeros');
    await vue('01-numeroter');
    await page.click('.carte-numeros [data-v="1"]');
    r.resumeApres = net(await page.textContent('#feuille .carte-resume'));
    verifie(/1 green sur 18/.test(r.resumeApres), nom + ' green numéroté : ' + r.resumeApres);
    await page.click('#f-fermer'); await page.waitForSelector('#feuille', { state: 'detached' });
    await allerVue(page, 'parcours');
    await page.click('.cta-partie'); await page.click('[data-a="pt-nouvelle"]'); await page.waitForSelector('#calque-partie .pave'); await (require('./nav-essai').modeDetail)(page);
    r.sansPosition = (await emf(page)) + ' · ' + await page.textContent('#emf-etat');
    verifie(/^– – – · Touche pour te placer/.test(r.sansPosition), nom + ' sans position : ' + r.sansPosition);
    await page.click('#calque-partie .pv-emf'); await page.waitForSelector('.pv-panneau.carte svg.cp');
    r.infoAvant = await page.textContent('#carte-info');
    /* Je me place 60 m au sud du milieu du green (sans tracé, la carte montre 160 m autour du green, nord en haut) */
    await toucherCarte(page, 0, -60);
    r.place = net((await page.$$eval('.emf-grand [data-emf]', l => l.map(x => x.textContent).join(' '))) + ' · ' + await page.textContent('.carte-etat'));
    const m = parseInt(r.place.split(' ')[1], 10);
    verifie(Math.abs(m - 60) <= 1 && /posée à la main/.test(r.place), nom + ' position posée à 60 m : ' + r.place);
    r.cercles = await page.locator('.carte-plan .cp-cercle').count();
    await page.click('[data-a="carte-mode"][data-v="mesure"]');
    await toucherCarte(page, 0, -30);
    r.mesure = net(await page.textContent('#carte-info'));
    verifie(/à (29|30|31) m de toi, puis (29|30|31) m/.test(r.mesure), nom + ' mesure à mi-chemin : ' + r.mesure);
    r.releveAbsent = await page.locator('.carte-releve').count();
    verifie(r.releveAbsent === 0, nom + ' pas de relevé sans GPS');
    await page.waitForTimeout(100); await vue('02-position-main');
    await page.click('#carte-fermer');
    r.paveApres = (await emf(page)) + ' · ' + await page.textContent('#emf-etat');
    /* Trou 2 : pas de green numéroté */
    await page.click('#pt-suiv');
    r.trou2 = await page.textContent('#emf-etat');
    verifie(/Green absent/.test(r.trou2), nom + ' trou sans green : ' + r.trou2);
    /* Supprimer le parcours retire sa carte */
    await page.click('#calque-partie [data-a="pt-fermer"]');
    await allerVue(page, 'parcours', 'c-parcours'); await page.click('[data-a="pc-ouvrir"]'); await page.click('#feuille [data-a="pc-suppr"]'); await page.click('[data-a="pc-ok-suppr"]');
    const g = await lire(GEO);
    verifie(Object.keys(g.pcs).length === 0, nom + ' la carte part avec le parcours');
    await ctx.close();
  }

  /* ========== 3. Golf sans green sur OpenStreetMap : relevé sur place ========== */
  {
    const nom = 'releve', r = res[nom] = {}, reseau = { mode: 'sansgreen' };
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, reducedMotion: 'reduce', permissions: ['geolocation'], geolocation: geo(0, 0) });
    const { page } = await prepare(ctx, nom, reseau);
    const vue = n => page.screenshot({ path: `${Dos}/${nom}-${n}.png` });
    const lire = k => page.evaluate(k => JSON.parse(localStorage.getItem(k)), k);
    await profil(page);
    await allerVue(page, 'parcours'); await page.click('.cta-partie'); await page.fill('#dp-nom', 'Golf sans carte'); await page.click('[data-a="pt-nouvelle"]'); await page.waitForSelector('#calque-partie .pave'); await (require('./nav-essai').modeDetail)(page);
    r.ligneSansCarte = (await page.textContent('#calque-partie .pv-emf')).replace(/\s+/g, ' ');
    await page.click('#calque-partie .pv-emf.vide'); await page.waitForSelector('#feuille #carte-q');
    r.prerempli = await page.inputValue('#carte-q');
    await page.click('[data-a="carte-autour"]'); await ctx.setGeolocation(geo(1, 0));
    await page.waitForSelector('[data-a="carte-choisir"]', { timeout: 20000 }).catch(async () => { console.error('DEBUG', (await page.textContent('#feuille')).slice(0, 600), JSON.stringify(errs)); throw new Error('recherche autour'); });
    await page.click('[data-a="carte-choisir"][data-v="0"]'); await page.waitForFunction(() => /ni ses greens ni ses trous/.test((document.querySelector('#feuille .erreur') || {}).textContent || ''));
    r.sansGreen = await page.textContent('#feuille .erreur');
    await page.click('[data-a="carte-vide"]'); await ctx.setGeolocation(geo(0, 0));
    await page.waitForFunction(() => !document.querySelector('[data-a="carte-vide"]'));
    r.resume = net(await page.textContent('#feuille .carte-resume'));
    await page.click('#f-fermer'); await page.waitForSelector('#feuille', { state: 'detached' });
    r.ligne = await page.textContent('#emf-etat');
    verifie(/Green à relever/.test(r.ligne), nom + ' pavé : ' + r.ligne);
    await page.click('#calque-partie .pv-emf'); await page.waitForSelector('.carte-releve');
    /* GPS imprécis refusé, puis entrée et fond */
    await ctx.setGeolocation(geo(0, 120, 40)); await page.waitForTimeout(1200);
    await page.click('[data-a="carte-releve"][data-v="e"]'); await page.waitForSelector('.carte-releve .erreur');
    r.imprecis = await page.textContent('.carte-releve .erreur');
    await ctx.setGeolocation(geo(0, 120, 4)); await page.waitForTimeout(1200);
    await page.click('[data-a="carte-releve"][data-v="e"]'); await page.waitForSelector('[data-a="carte-releve"][data-v="e"][aria-pressed="true"]');
    await vue('01-releve');
    await ctx.setGeolocation(geo(0, 150, 4)); await page.waitForTimeout(1200);
    await page.click('[data-a="carte-releve"][data-v="f"]'); await page.waitForSelector('.pv-panneau.carte svg.cp');
    r.message = await page.textContent('#message');
    const g = await lire(GEO), e = await lire(CLE);
    r.carte = JSON.stringify({ src: g.pcs[e.parcours[0].id].src, rel: g.pcs[e.parcours[0].id].trous[0].rel.length });
    verifie(/Green du trou 1 enregistré/.test(r.message) && g.pcs[e.parcours[0].id].src === 'releve', nom + ' relevé enregistré : ' + r.message + ' ' + r.carte);
    await ctx.setGeolocation(geo(0, 0, 4));
    await page.waitForFunction(() => { const b = document.querySelector('.emf-grand [data-emf="m"]'); return b && Math.abs(parseInt(b.textContent, 10) - 135) <= 1; });
    r.distances = await page.$$eval('.emf-grand [data-emf]', l => l.map(x => x.textContent).join(' '));
    verifie(r.distances === '120 135 150', nom + ' distances sur le green relevé : ' + r.distances);
    await page.waitForTimeout(100); await vue('02-green-releve');
    /* Après rechargement, la carte est toujours là */
    await page.reload(); await page.addStyleTag({ content: POLICES });
    if (!(await page.locator('#calque-partie .pave').count())) await page.click('.bandeau-partie');
    await page.waitForSelector('#calque-partie .pave');
    await ctx.setGeolocation(geo(0, 0, 4));
    await attendreMilieu(page, 135);
    r.apresRechargement = await emf(page);
    r.largeur = await page.evaluate(() => document.documentElement.scrollWidth);
    await ctx.close();
  }
  /* ========== 4. Golf dessiné avec drapeaux et tracés, sans green (comme La Jonchère) ========== */
  {
    const nom = 'drapeaux', r = res[nom] = {}, reseau = { mode: 'drapeaux' };
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, reducedMotion: 'reduce', permissions: ['geolocation'], geolocation: geo(T[0].dep[0], T[0].dep[1]) });
    const { page } = await prepare(ctx, nom, reseau);
    const vue = n => page.screenshot({ path: `${Dos}/${nom}-${n}.png` });
    await profil(page);
    await allerVue(page, 'parcours');
    await page.click('#c-carte [data-a="carte-feuille"]'); await page.waitForSelector('#feuille #carte-q');
    await page.fill('#carte-q', 'Jonchère'); await page.click('.carte-form button[type="submit"]'); await page.waitForSelector('[data-a="carte-choisir"]');
    r.resultats = await page.$$eval('[data-a="carte-choisir"]', l => l.map(x => x.textContent.replace(/\s+/g, ' ').trim()));
    verifie(/Golf de la Jonchère\s*Gouzon, Creuse/.test(r.resultats[0]), nom + ' résultats : ' + r.resultats.join(' | '));
    await page.click('[data-a="carte-choisir"][data-v="0"]'); await page.waitForSelector('#feuille .carte-ok');
    r.resume = net(await page.textContent('#feuille .carte-resume'));
    r.pointilles = await page.locator('#feuille .cp.apercu .cp-green.est').count();
    verifie(/18 greens sur 18/.test(r.resume) && /Tous estimés d.après les drapeaux/.test(r.resume) && r.pointilles === 19, nom + ' carte estimée : ' + r.resume + ' · ' + r.pointilles + ' greens en pointillé');
    await page.evaluate(() => document.querySelector('#feuille .cp.apercu').scrollIntoView({ block: 'center' })); await page.waitForTimeout(80);
    await vue('01-carte-parcours');
    await page.click('#f-fermer'); await page.waitForSelector('#feuille', { state: 'detached' });
    await page.click('.cta-partie'); await page.waitForSelector('[data-a="pt-nouvelle"]');
    await page.click('[data-a="pt-nouvelle"]'); await page.waitForSelector('#calque-partie .pave'); await (require('./nav-essai').modeDetail)(page);
    await attendreMilieu(page, 150);
    r.pave = await emf(page); r.etat = await page.textContent('#emf-etat');
    verifie(r.pave === '136 150 164' && /Green estimé · GPS/.test(r.etat), nom + ' pavé : ' + r.pave + ' · ' + r.etat);
    await page.click('#calque-partie .pv-emf'); await page.waitForSelector('.pv-panneau.carte svg.cp');
    r.releve = await page.locator('.carte-releve h4').textContent().catch(() => '');
    verifie(/Green estimé\s*: le relever/.test(r.releve), nom + ' relevé proposé : ' + r.releve);
    await page.waitForTimeout(100); await vue('02-trou');
    await ctx.close();
  }
  console.log(JSON.stringify({ res, ko, errs }, null, 1));
  await browser.close();
})().catch(e => { console.error('ECHEC', String(e.stack || e.message).split('\n').filter(l => !/retrying|waiting|scrolling|stable/.test(l)).slice(0, 14).join('\n')); process.exit(1); });
