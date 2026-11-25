/* Saisie des coups : clubs du sac, position de la balle, type de coup. Carte GPS : cône de dispersion depuis la balle,
   dangers devant, balle posée à la main malgré le GPS. Réseau simulé. */
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
  const Dos = 'shots16'; fs.mkdirSync(Dos, { recursive: true });
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


  {
    const nom = 'coups', r = res[nom] = {}, reseau = { mode: 'ok' };
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, reducedMotion: 'reduce', permissions: ['geolocation'], geolocation: geo(T[3].dep[0], T[3].dep[1]) });
    const { page } = await prepare(ctx, nom, reseau);
    const vue = n => page.screenshot({ path: `${Dos}/${nom}-${n}.png` });
    const lire = k => page.evaluate(k => JSON.parse(localStorage.getItem(k)), k);
    await profil(page);
    /* Sac mesuré au practice : driver, fer 7, PW, SW (sac non composé) */
    let e = await lire(CLE);
    e.carnet.clubs = { dr: [220, 215, 225, 218, 222, 219], f5: [168, 172, 170, 165, 175], f7: [148, 152, 150, 147, 153, 151], pw: [105, 110, 108, 106, 104], sw: [80, 78, 82, 79, 81] };
    e.carnet.sac = null;
    await page.evaluate(([k, v]) => localStorage.setItem(k, JSON.stringify(v)), [CLE, e]);
    await page.reload(); await page.waitForSelector('.tete');
    await allerVue(page, 'parcours');
    await page.click('#c-carte [data-a="carte-feuille"]'); await page.waitForSelector('#feuille #carte-q');
    await page.fill('#carte-q', 'Jonchère'); await page.click('.carte-form button[type="submit"]'); await page.waitForSelector('[data-a="carte-choisir"]');
    await page.click('[data-a="carte-choisir"][data-v="0"]'); await page.waitForSelector('#feuille .carte-ok');
    await page.click('#f-fermer'); await page.waitForSelector('#feuille', { state: 'detached' });
    await page.click('.cta-partie'); await page.waitForSelector('[data-a="pt-nouvelle"]');
    await page.click('[data-a="pt-nouvelle"]'); await page.waitForSelector('#calque-partie .pave');
    for (let i = 0; i < 3; i++) await page.click('#pt-suiv');
    if (!(await page.locator('[data-a="pv-coup"][data-v="-1"]').count())) await page.click('#calque-partie [data-a="mode-saisie"][data-v="detail"]');   /* express par défaut */
    /* 1. Panneau d'un coup */
    await page.click('[data-a="pv-coup"][data-v="-1"]'); await page.waitForSelector('.pv-panneau [data-a="pv-lie"]', { state: 'attached' }); await page.click('.pv-panneau .pv-plus-coup:not([open]) > summary').catch(() => {}); 
    r.clubs = await page.$$eval('.pv-panneau > .pv-clubs [data-a="pv-club"]', l => l.map(b => b.getAttribute('data-id')).join(','));
    r.autres = await page.locator('.pv-autres summary').textContent();
    r.lieDefaut = await page.$$eval('[data-a="pv-lie"][aria-pressed="true"]', l => l.map(b => b.textContent).join(','));
    verifie(r.clubs === 'dr,f5,f7,pw,sw' && /Autres clubs/.test(r.autres) && r.lieDefaut === 'Départ', nom + ' clubs du sac mesuré : ' + r.clubs + ' · ' + r.autres + ' · ' + r.lieDefaut);
    await page.click('[data-a="pv-club"][data-id="dr"]');
    await vue('01-coup');
    await page.click('#pv-coup-ok'); await page.waitForSelector('.pv-panneau', { state: 'detached' });
    let p = (await lire(CLE)).partie;
    r.coup1 = JSON.stringify(p.coups[3][0]);
    r.clubDepart = p.trous[3] ? p.trous[3][7] : (await page.evaluate(() => 0));
    verifie(p.coups[3][0].p === 'dep' && !p.coups[3][0].t, nom + ' coup 1 : ' + r.coup1);
    /* 2. Recentrage depuis les arbres, avec un club hors du sac */
    await page.click('[data-a="pv-coup"][data-v="-1"]'); await page.waitForSelector('.pv-panneau [data-a="pv-lie"]', { state: 'attached' }); await page.click('.pv-panneau .pv-plus-coup:not([open]) > summary').catch(() => {}); 
    r.lie2 = await page.$$eval('[data-a="pv-lie"][aria-pressed="true"]', l => l.length);
    await page.click('[data-a="pv-lie"][data-v="ar"]'); await page.click('[data-a="pv-type"][data-v="rec"]');
    r.horsSac = net(await page.textContent('.pv-panneau .pv-plus-coup .aide'));
    await page.click('.pv-autres summary'); await page.click('.pv-autres [data-a="pv-club"][data-id="f4"]');
    await page.fill('#pv-dist', '60');
    await vue('02-recentrage');
    await page.click('#pv-coup-ok'); await page.waitForSelector('.pv-panneau', { state: 'detached' });
    r.msg2 = net(await page.textContent('#message'));
    p = (await lire(CLE)).partie;
    r.coup2 = JSON.stringify(p.coups[3][1]);
    r.liste = await page.$$eval('.pv-coups-liste button', l => l.map(b => b.textContent).join(' | '));
    verifie(r.lie2 === 0 && p.coups[3][1].p === 'ar' && p.coups[3][1].t === 'rec' && /ne compte pas/.test(r.horsSac) && /ne compte pas/.test(r.msg2) && /recentrage · arbres · Fer 4/.test(r.liste), nom + ' recentrage : ' + r.coup2 + ' · ' + r.msg2 + ' · ' + r.liste);
    /* 3. Carte : cône depuis la balle (le GPS simulé n'envoie un point que quand il bouge) */
    await ctx.setGeolocation(geo(T[3].dep[0] + 0.5, T[3].dep[1], 4)); await page.waitForTimeout(1200);
    await page.click('#calque-partie .pv-emf'); await page.waitForSelector('.pv-panneau.carte svg.cp');
    r.cone = await page.locator('.pv-panneau.carte .cp-cone').count();
    r.club = net(await page.textContent('.cone-club'));
    r.coneTexte = net(await page.textContent('.carte-cone .aide'));
    r.dangers = await page.$$eval('.cone-dangers li', l => l.map(x => x.textContent).join(' | '));
    verifie(r.cone === 1 && /choisi pour \d+ m/.test(r.club) && /La balle tombe le plus souvent entre \d+ et \d+ m/.test(r.coneTexte), nom + ' cône : ' + r.club + ' · ' + r.coneTexte);
    await page.waitForTimeout(150); await vue('03-cone');
    const avant = r.club;
    await page.click('[data-a="carte-club"][data-v="court"]');
    r.clubLong = net(await page.textContent('.cone-club'));
    verifie(r.clubLong !== avant && /choisi par toi/.test(r.clubLong), nom + ' club plus court : ' + r.clubLong);
    await page.click('[data-a="carte-club"][data-v="auto"]');
    /* Point touché : le cône vise ce point */
    await toucherCarte(page, -20, -60); await page.waitForTimeout(100);
    r.vers = net(await page.textContent('.carte-cone .aide'));
    verifie(/ton point/.test(r.vers), nom + ' cône vers le point touché : ' + r.vers);
    /* 4. Balle posée à la main malgré le GPS */
    const emfAvant = await page.$$eval('.emf-grand [data-emf]', l => l.map(x => x.textContent).join(' '));
    await page.click('[data-a="carte-mode"][data-v="position"]');
    await toucherCarte(page, 0, -80); await page.waitForTimeout(100);
    r.emfBalle = await page.$$eval('.emf-grand [data-emf]', l => l.map(x => x.textContent).join(' '));
    r.retour = await page.locator('[data-a="carte-gps"]').count();
    verifie(r.emfBalle !== emfAvant && /^\d+ 80 \d+$/.test(r.emfBalle) && r.retour === 1, nom + ' balle posée : ' + emfAvant + ' → ' + r.emfBalle);
    await vue('04-balle');
    await page.click('[data-a="carte-gps"]');
    r.emfRetour = await page.$$eval('.emf-grand [data-emf]', l => l.map(x => x.textContent).join(' '));
    verifie(r.emfRetour === emfAvant, nom + ' retour au GPS : ' + r.emfRetour);
    r.largeur = await page.evaluate(() => document.documentElement.scrollWidth);
    verifie(r.largeur === 390, nom + ' pas de débordement');
    await ctx.close();
  }
  console.log(JSON.stringify({ res, ko, errs }, null, 1));
  await browser.close();
})().catch(e => { console.error('ECHEC', String(e.stack || e.message).split('\n').filter(l => !/retrying|waiting|scrolling|stable/.test(l)).slice(0, 14).join('\n')); process.exit(1); });
