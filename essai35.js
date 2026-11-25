/* UX10 : journal chronologique — vide, puis parties + séries + index ; ordre, mois, faits marquants, filtres (type,
   période, parcours), note visible, chaque événement ouvre son détail, rien d'ajouté à la sauvegarde, 360 et 390 px. */
const { chromium } = require('playwright');
const fs = require('fs');
const CLE = 'coachgolf.v1';
const PARS = [4, 4, 3, 5, 4, 4, 3, 5, 4];
const norm = s => s.replace(/[\s  ]+/g, ' ').trim();
(async () => {
  const D = 'shots35'; fs.mkdirSync(D, { recursive: true });
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const res = {}, errs = [], ko = [];
  const verifie = (c, m) => { if (!c) ko.push(m); };
  const iso = j => new Date(Date.now() - j * 864e5).toISOString();
  const partie = (j, plus, o) => Object.assign({ id: 'p_ch' + (3000 + j), d: iso(j), o: 0, pc: 'p1', renseigne: PARS.map(() => 7), trous: PARS.map((p, k) => [1, 1, 2, 0, p + (k === 0 ? plus : 0), p, 0, 0, 0, 0, 0]) }, o || {});
  for (const [w, h, sombre] of [[390, 844, false], [360, 760, true]]) {
    const nom = w + (sombre ? 's' : ''), r = res[nom] = {};
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, colorScheme: sombre ? 'dark' : 'light', hasTouch: true, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    page.on('pageerror', e => errs.push(nom + ' ' + e.message));
    await page.goto('file://' + __dirname + '/dist/index.html');
    await page.click('[data-a="ac-sans-index"]'); await page.click('.carnet-form button[type="submit"]');
    await page.waitForSelector('.tete');
    await page.click('#barre [data-v="journal"]');
    r.vide = norm(await page.textContent('#c-chronologie'));
    verifie(/Rien pour l.instant/.test(r.vide), nom + ' journal vide : ' + r.vide);

    const e = await page.evaluate(k => JSON.parse(localStorage.getItem(k)), CLE);
    e.parcours = [{ id: 'p1', nom: 'Golf des Essais', pars: PARS }, { id: 'p2', nom: 'Golf du Lac', pars: PARS }];
    e.parties = [partie(200, 6), partie(150, 5), partie(120, 4, { pc: 'p2', note: { texte: 'Beaucoup de vent', forme: 1 } }), partie(60, 1), partie(10, 3)];
    e.carnet = e.carnet || {}; e.carnet.series = [{ d: iso(20), c: 'f7', v: [140, 142, 138] }];
    e.indexHist = [{ d: iso(210), v: 20.4 }, { d: iso(90), v: 19.1 }];
    e.maj = Date.now();
    await page.evaluate(([k, v]) => localStorage.setItem(k, JSON.stringify(v)), [CLE, e]);
    const avant = await page.evaluate(k => localStorage.getItem(k).length, CLE);
    await page.reload(); await page.waitForSelector('.tete');
    await page.click('#barre [data-v="journal"]');
    r.ordre = await page.$$eval('#vue h2', l => l.map(x => x.textContent.trim()));
    verifie(r.ordre[0] === 'Chronologie' && r.ordre.includes('Toutes mes parties'), nom + ' chronologie puis tableau : ' + r.ordre.join(' | '));
    r.ev = await page.$$eval('#c-chronologie .chrono-ev', l => l.map(x => x.querySelector('b').textContent.trim()));
    verifie(r.ev.length === 8 && /Golf des Essais/.test(r.ev[0]) && /Série · Fer 7/.test(r.ev[1]), nom + ' huit événements, du plus récent : ' + r.ev.join(' | '));
    verifie(await page.locator('#c-chronologie .chrono-mois').count() >= 4, nom + ' regroupés par mois');
    r.marquants = norm(await page.textContent('#c-chronologie .chrono-marquants'));
    verifie(/Record : ta meilleure partie/.test(r.marquants) && /Ton meilleur index/.test(r.marquants), nom + ' faits marquants : ' + r.marquants);
    /* Filtres */
    await page.click('[data-a="chrono-type"][data-v="practice"]');
    verifie(await page.locator('#c-chronologie .chrono-ev').count() === 1, nom + ' filtre practice');
    await page.click('[data-a="chrono-type"][data-v="note"]');
    r.note = norm(await page.textContent('#c-chronologie .chrono-ev'));
    verifie(/Golf du Lac/.test(r.note) && /« Beaucoup de vent »/.test(r.note), nom + ' filtre notes, note visible : ' + r.note);
    await page.click('[data-a="chrono-type"][data-v="tous"]'); await page.click('[data-a="chrono-periode"][data-v="30"]');
    verifie(await page.locator('#c-chronologie .chrono-ev').count() === 2, nom + ' filtre 30 jours : ' + await page.locator('#c-chronologie .chrono-ev').count());
    await page.click('[data-a="chrono-periode"][data-v="tout"]'); await page.selectOption('#chrono-parcours', 'p2');
    verifie(await page.locator('#c-chronologie .chrono-ev').count() === 1, nom + ' filtre parcours');
    await page.selectOption('#chrono-parcours', '');
    verifie(await page.evaluate(() => document.documentElement.scrollWidth) <= w, nom + ' sans débordement');
    await page.screenshot({ path: `${D}/${nom}-journal.png` });
    /* Détail : partie → carte de score ; série → fiche du club */
    await page.click('#c-chronologie .chrono-ev.type-partie .ligne'); await page.waitForSelector('#feuille .carte-score');
    await page.keyboard.press('Escape'); await page.waitForSelector('#feuille', { state: 'detached' });
    await page.click('#c-chronologie .chrono-ev.type-practice .ligne'); await page.waitForSelector('#feuille.sac-fiche');
    verifie(/Fer 7/.test(norm(await page.textContent('#feuille h2'))), nom + ' série → fiche du fer 7');
    await page.keyboard.press('Escape');
    /* Rien d'ajouté à la sauvegarde par la chronologie */
    const apres = await page.evaluate(k => JSON.parse(localStorage.getItem(k)), CLE);
    verifie(!('chronologie' in apres) && !('chrono' in apres) && !JSON.stringify(apres).includes('"marquant"'), nom + ' aucune donnée dupliquée dans la sauvegarde');
    await ctx.close();
  }
  await browser.close();
  console.log(JSON.stringify({ res, ko, errs }, null, 1));
  process.exit(ko.length || errs.length ? 1 : 0);
})().catch(e => { console.log('ECHEC', e.message); process.exit(1); });
