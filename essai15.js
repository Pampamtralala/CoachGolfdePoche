/* Carte de score (repères, collage, coups reçus, Stableford), photo aérienne sous la carte GPS, dessin du green sur la photo,
   apprentissage en fin de trou, position fraîche. Réseau simulé (Nominatim, OSM, tuiles IGN). */
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
  await page.evaluate(() => document.querySelector('.carte-plan svg').scrollIntoView({ block: 'center' })); await page.waitForTimeout(80);
  const v = await page.evaluate(() => {
    const s = document.querySelector('.carte-plan svg'), r = s.getBoundingClientRect(), vb = s.viewBox.baseVal, c = document.querySelector('.cp-milieu');
    return { x: r.left, y: r.top, w: r.width, h: r.height, W: vb.width, H: vb.height, cx: +c.getAttribute('cx'), cy: +c.getAttribute('cy'), k: +s.getAttribute('data-k') };
  });
  const s = Math.min(v.w / v.W, v.h / v.H);
  await page.mouse.click(v.x + (v.w - v.W * s) / 2 + (v.cx + dx * v.k) * s, v.y + (v.h - v.H * s) / 2 + (v.cy - dy * v.k) * s);
}

(async () => {
  const Dos = 'shots15'; fs.mkdirSync(Dos, { recursive: true });
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

  const PARS = D.PARS.join(' '), HCP = [12, 2, 18, 16, 6, 14, 10, 8, 4, 9, 11, 1, 17, 5, 15, 3, 13, 7];
  const COLLE = `Repères | Par | SSS H | Slope H | SSS F | Slope F\njaune | 72 | 69,4 | 126 | 75,2 | 134\nBlanc 70,6 121 - -\nPar ${D.PARS.slice(0, 9).join(' ')} 36\nPar ${D.PARS.slice(9).join(' ')} 36\nHcp ${HCP.join(' ')}`;
  {
    const nom = 'carte', r = res[nom] = {}, reseau = { mode: 'drapeaux' };
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, reducedMotion: 'reduce', permissions: ['geolocation'], geolocation: geo(T[0].dep[0], T[0].dep[1]) });
    const { page } = await prepare(ctx, nom, reseau);
    const tuiles = [];
    await page.route('https://data.geopf.fr/**', route => { tuiles.push(route.request().url()); return route.fulfill({ contentType: 'image/jpeg', headers: { 'access-control-allow-origin': '*' }, body: fs.readFileSync(__dirname + '/tuile-essai.jpg') }); });
    const vue = n => page.screenshot({ path: `${Dos}/${nom}-${n}.png` });
    const lire = k => page.evaluate(k => JSON.parse(localStorage.getItem(k)), k);
    await profil(page);
    /* 1. Carte du golf, vue d'ensemble sur photo */
    await allerVue(page, 'parcours');
    await page.click('#c-carte [data-a="carte-feuille"]'); await page.waitForSelector('#feuille #carte-q');
    await page.fill('#carte-q', 'Jonchère'); await page.click('.carte-form button[type="submit"]'); await page.waitForSelector('[data-a="carte-choisir"]');
    await page.click('[data-a="carte-choisir"][data-v="0"]'); await page.waitForSelector('#feuille .carte-ok');
    r.apercuPhotos = await page.locator('#feuille .cp.apercu.photo image').count();
    r.credit = net(await page.textContent('#feuille .carte-credit'));
    verifie(r.apercuPhotos > 0 && /© IGN/.test(r.credit), nom + ' vue d\'ensemble sur photo : ' + r.apercuPhotos + ' tuiles · ' + r.credit);
    r.boutonPhotos = net(await page.textContent('#feuille .carte-photos'));
    await page.evaluate(() => document.querySelector('#feuille .cp.apercu').scrollIntoView({ block: 'center' })); await page.waitForTimeout(300);
    await vue('01-apercu-photo');
    /* 2. Fiche du parcours : coller la carte de score */
    await page.click('#f-fermer'); await page.waitForSelector('#feuille', { state: 'detached' });
    await allerVue(page, 'parcours', 'c-parcours');
    await page.click('[data-a="pc-ouvrir"]'); await page.waitForSelector('#feuille [data-f="pc-coller"]', { state: 'attached' });
    r.avant = net(await page.$eval('#feuille .liste-reps, #feuille [data-f="pc-carte"]', e => e.closest('details') ? e.closest('details').previousElementSibling.textContent : e.textContent));
    await page.click('#feuille details:has([data-f="pc-coller"]) summary');
    await page.fill('#pc-texte', COLLE); await page.click('[data-f="pc-coller"] button[type="submit"]'); await page.waitForSelector('[data-a="pc-coller-ok"]');
    r.lu = net(await page.textContent('#feuille .pc-lu'));
    verifie(/3 repères/.test(r.lu) && /Jaune · Messieurs \(69,4 \/ 126\)/.test(r.lu) && /Handicap des trous : 12 2 18/.test(r.lu), nom + ' carte lue : ' + r.lu);
    await vue('02-collage');
    await page.click('[data-a="pc-coller-ok"]'); await page.waitForSelector('#feuille .liste-reps');
    r.reps = net(await page.textContent('#feuille .liste-reps'));
    r.aide = net(await page.$eval('#feuille .liste-reps', e => e.nextElementSibling.textContent));
    r.hcpLigne = await page.$$eval('#feuille .carte-score.pars tr', l => l.map(x => x.textContent.replace(/\s+/g, ' ').trim()).filter(x => /^Hcp/.test(x)).join(' | '));
    verifie(/Avec ton index de 14, tu reçois 13 coups sur 18 trous\./.test(r.aide) && /^Hcp12218166141084 \| Hcp9111175153137$/.test(r.hcpLigne), nom + ' coups reçus : ' + r.aide + ' · ' + r.hcpLigne);
    let e = await lire(CLE);
    verifie(e.parcours[0].reps.length === 3 && e.parcours[0].sss === 69.4 && e.parcours[0].hcp.join() === HCP.join() && e.parcours[0].pars.join(' ') === PARS, nom + ' parcours enregistré : ' + JSON.stringify(e.parcours[0].reps));
    await page.evaluate(() => document.querySelector('#feuille .liste-reps').scrollIntoView({ block: 'center' })); await page.waitForTimeout(80);
    await vue('03-carte-score');
    /* Saisie à la main : handicap des trous invalide refusé */
    await page.click('#feuille details:has([data-f="pc-carte"]) summary');
    await page.fill('#pc-hcp', '1 2 3'); await page.click('[data-f="pc-carte"] button[type="submit"]');
    r.hcpFaux = net(await page.textContent('#pc-carte-err'));
    verifie(/18 nombres différents/.test(r.hcpFaux), nom + ' handicap invalide : ' + r.hcpFaux);
    await page.click('#f-fermer'); await page.waitForSelector('#feuille', { state: 'detached' });
    /* 3. Partie : choix du repère, coups reçus sur le pavé */
    await page.click('.cta-partie'); await page.waitForSelector('#dp-rep');
    r.repChoix = await page.$$eval('#dp-rep option', l => l.map(o => o.textContent).join(' | '));
    await page.selectOption('#dp-rep', '0');
    await page.click('[data-a="pt-nouvelle"]'); await page.waitForSelector('#calque-partie .pave');
    r.recus1 = net(await page.textContent('.pv-recus'));
    verifie(/^1 coup reçu · 2 points$/.test(r.recus1), nom + ' trou 1 (hcp 12) : ' + r.recus1);
    await vue('04-pave');
    /* 4. Carte du trou sur photo, green redessiné sur la photo */
    await page.click('#calque-partie .pv-emf'); await page.waitForSelector('.pv-panneau.carte svg.cp');
    r.photoTrou = await page.locator('.pv-panneau.carte svg.cp.photo image').count();
    r.creditTrou = net(await page.textContent('.pv-panneau.carte .carte-credit'));
    verifie(r.photoTrou > 0 && /© IGN/.test(r.creditTrou), nom + ' carte du trou sur photo : ' + r.photoTrou + ' tuiles');
    /* Les tuiles couvrent bien la vue : un point au centre du cadre tombe sur une image */
    r.couverture = await page.evaluate(() => { const s = document.querySelector('.pv-panneau.carte svg.cp'), b = s.getBoundingClientRect(); return [[.1, .1], [.5, .5], [.9, .9]].map(([u, v]) => { const el = document.elementFromPoint(b.left + b.width * u, b.top + b.height * v); return el ? el.tagName : '-'; }).join(','); });
    await page.waitForTimeout(300); await vue('05-trou-photo');
    await page.click('[data-a="carte-dessin"]');
    r.infoDessin = net(await page.textContent('#carte-info'));
    await toucherCarte(page, 0, -16); await page.waitForTimeout(100);
    await toucherCarte(page, 0, 14);
    await page.waitForFunction(() => /dessiné/.test((document.getElementById('message') || {}).textContent || ''));
    let g = await lire(GEO); e = await lire(CLE);
    const t1 = g.pcs[e.parcours[0].id].trous[0];
    r.dessin = JSON.stringify({ rel: !!t1.rel, est: !!t1.est });
    r.distApres = await page.$$eval('.emf-grand [data-emf]', l => l.map(x => x.textContent).join(' '));
    verifie(t1.rel && !t1.est && /Touche l.entrée du green/.test(r.infoDessin), nom + ' green dessiné : ' + r.dessin + ' · ' + r.infoDessin + ' · ' + r.distApres);
    await page.click('#carte-fermer');
    /* 5. Fin du trou 2 au drapeau : le point est gardé pour apprendre le green */
    await page.click('#pt-suiv');
    await ctx.setGeolocation(geo(T[1].green[0] + 3, T[1].green[1] - 2, 5)); await page.waitForTimeout(1500);
    await page.click('#pt-suiv');
    g = await lire(GEO);
    const t2 = g.pcs[e.parcours[0].id].trous[1];
    r.appris = JSON.stringify({ ap: t2.ap ? t2.ap.length : 0 });
    verifie(t2.ap && t2.ap.length === 3, nom + ' point de fin de trou gardé : ' + r.appris);
    /* GPS imprécis : rien n'est gardé */
    await ctx.setGeolocation(geo(T[2].green[0], T[2].green[1], 40)); await page.waitForTimeout(1500);
    await page.click('#pt-suiv');
    g = await lire(GEO);
    verifie(!g.pcs[e.parcours[0].id].trous[2].ap, nom + ' GPS imprécis : rien de gardé');
    /* 6. Fin de partie : Stableford */
    for (let i = 0; i < 20 && await page.locator('#calque-partie .pave').count(); i++) await page.click('#pt-suiv');
    await page.waitForSelector('[data-a="pt-express-chiffres"]');
    await page.click('[data-a="pt-express-chiffres"]'); await page.waitForSelector('.partie.bilan');
    r.bilan = net(await page.$$eval('.partie.bilan dl.cinq > div', l => l.map(x => x.textContent.replace(/\s+/g, ' ').trim()).filter(x => /Stableford/.test(x)).join('')));
    verifie(/Stableford\s*\d+ pts\s*net \d+, 13 coups reçus$/.test(r.bilan), nom + ' bilan : ' + r.bilan);
    await vue('06-bilan');
    await page.click('[data-a="pt-bilan-carte"]'); await page.waitForSelector('#feuille .carte-score.trous');
    r.colonnes = await page.$$eval('#feuille .carte-score.trous thead th', l => l.map(x => x.textContent).join(' '));
    r.total = net(await page.$$eval('#feuille .carte-score.trous tr.total', l => l.map(x => x.textContent.replace(/\s+/g, ' ').trim()).join(' | ')));
    verifie(/Pts$/.test(r.colonnes), nom + ' carte de la partie avec les points : ' + r.colonnes + ' · ' + r.total);
    r.largeur = await page.evaluate(() => document.documentElement.scrollWidth);
    verifie(r.largeur === 390, nom + ' pas de débordement : ' + r.largeur);
    r.nbTuiles = tuiles.length;
    await ctx.close();
  }
  console.log(JSON.stringify({ res, ko, errs }, null, 1));
  await browser.close();
})().catch(e => { console.error('ECHEC', String(e.stack || e.message).split('\n').filter(l => !/retrying|waiting|scrolling|stable/.test(l)).slice(0, 14).join('\n')); process.exit(1); });
