/* UX07 : filtre commun des analyses — même période dans Statistiques, objectifs, tendances de Mon jeu et
   Comprendre mon jeu ; « Saison » = année civile en cours ; périmètre affiché ; version texte des graphiques ;
   le filtre reste choisi d'un écran à l'autre. */
const { chromium } = require('playwright');
const fs = require('fs');
const CLE = 'coachgolf.v1';
const PARS = [4, 4, 3, 5, 4, 4, 3, 5, 4];
const norm = s => s.replace(/[\s  ]+/g, ' ').trim();
(async () => {
  const D = 'shots30'; fs.mkdirSync(D, { recursive: true });
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const res = {}, errs = [], ko = [];
  const verifie = (c, m) => { if (!c) ko.push(m); };
  const an = new Date().getFullYear();
  const partie = (i, iso) => ({ id: 'p_flt' + (6000 + i), d: iso + 'T10:00:00.000Z', o: 0, pc: 'p1', renseigne: PARS.map(() => 7), trous: PARS.map(p => [1, 1, 2, 0, p + (i % 2), p, 0, 0, 0, 0, 0]) });
  /* 6 parties l'an dernier, 7 cette année (de janvier à la semaine dernière) */
  const dates = ['-04-10', '-05-12', '-06-14', '-07-16', '-08-18', '-09-20'].map(x => (an - 1) + x)
    .concat(['-01-15', '-03-02', '-04-20', '-06-01', '-07-10', '-08-22'].map(x => an + x)).concat([new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10)]);
  for (const [w, h, sombre] of [[390, 844, false], [360, 760, true]]) {
    const nom = w + (sombre ? 's' : ''), r = res[nom] = {};
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, colorScheme: sombre ? 'dark' : 'light', hasTouch: true, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    page.on('pageerror', e => errs.push(nom + ' ' + e.message));
    await page.goto('file://' + __dirname + '/dist/index.html');
    await page.click('[data-a="ac-sans-index"]'); await page.click('.carnet-form button[type="submit"]');
    await page.waitForSelector('.tete');
    const e = await page.evaluate(k => JSON.parse(localStorage.getItem(k)), CLE);
    e.parcours = [{ id: 'p1', nom: 'Golf des Essais', pars: PARS }]; e.parties = dates.map((d, i) => partie(i, d)); e.maj = Date.now();
    await page.evaluate(([k, v]) => localStorage.setItem(k, JSON.stringify(v)), [CLE, e]);
    await page.reload(); await page.waitForSelector('.tete');
    const choisi = sel => page.$eval(sel + ' [aria-pressed="true"]', b => b.textContent.trim()).catch(() => '');

    /* Statistiques : pastilles communes, Saison = parties de l'année civile */
    await page.click('#barre [data-v="bilan"]');
    r.pastilles = await page.$$eval('#vue .filtres-stats .fenetres[aria-label="Période"] button', l => l.map(b => b.textContent.trim()).join(' | '));
    verifie(r.pastilles === '5 parties | 10 parties | 20 parties | Saison | Toutes', nom + ' pastilles : ' + r.pastilles);
    verifie(await choisi('#vue .filtres-stats .fenetres[aria-label="Période"]') === '10 parties', nom + ' 10 parties par défaut');
    await page.click('#vue .filtres-stats [data-a="st-derniers"][data-v="saison"]');
    r.saison = norm(await page.textContent('#vue .stats-echantillon'));
    verifie(/^Sur 7 parties \(63 trous\)/.test(r.saison), nom + ' saison : ' + r.saison);
    verifie(await page.locator('#vue .filtres-stats input[type="checkbox"][data-c="st-comparer"]').count() === 1, nom + ' saison comparable à la période précédente');
    verifie(await choisi('#vue .filtres-stats .fenetres[aria-label="Période"]') === 'Saison', nom + ' Saison marquée');

    /* Objectifs (pli coups gagnés) : même choix */
    const sg = page.locator('#vue #sg [data-a="st-derniers"][aria-pressed="true"]');
    if (await page.locator('#vue #sg').count()) verifie((await sg.count()) === 1 && (await sg.textContent()) === 'Saison', nom + ' objectifs : même période');

    /* Mon jeu, tendances : même choix */
    await page.click('#barre [data-v="accueil"]');
    /* V4-06 : l'accueil montre toujours les 10 dernières parties, sans filtre (le filtre commun est dans Performance). */
    r.accueil = norm(await page.textContent('#mj-kpi .section-tete'));
    verifie(await page.locator('#vue [data-a="st-derniers"]').count() === 0 && /10 parties/.test(r.accueil), nom + ' Accueil : fenêtre fixe de 10 parties (' + r.accueil + ')');

    /* Comprendre mon jeu : même choix, périmètre, et un changement ici vaut partout */
    await page.click('#barre [data-v="bilan"]'); await page.click('#vue .sous-nav [data-a="an-ouvrir"]');
    verifie(await choisi('#feuille .fenetres') === 'Saison', nom + ' Comprendre : période conservée');
    r.perimetre = norm(await page.textContent('#feuille .an-perimetre'));
    verifie(/^Sur 7 parties \(63 trous\)/.test(r.perimetre) && /Même période que les autres analyses/.test(r.perimetre), nom + ' Comprendre : périmètre : ' + r.perimetre);
    await page.click('#feuille [data-a="an-periode"][data-v="5"]');
    verifie(/^Sur 5 parties/.test(norm(await page.textContent('#feuille .an-perimetre'))), nom + ' Comprendre : 5 parties');
    await page.keyboard.press('Escape');
    verifie(await choisi('#vue .filtres-stats .fenetres[aria-label="Période"]') === '5 parties', nom + ' Statistiques suivent le choix fait dans Comprendre');
    await page.click('#vue .filtres-stats [data-a="st-derniers"][data-v="0"]');
    verifie(/^Sur 13 parties/.test(norm(await page.textContent('#vue .stats-echantillon'))), nom + ' Toutes : 13 parties');

    /* Graphiques : version texte */
    const g = await page.locator('#vue .graphe-cj').count(), gt = await page.locator('#vue .graphe-texte').count();
    verifie(gt === g, nom + ' chaque graphique a sa version texte (' + gt + '/' + g + ')');
    verifie(await page.evaluate(() => document.documentElement.scrollWidth) <= w, nom + ' sans débordement');
    await page.screenshot({ path: `${D}/${nom}-stats.png` });
    await ctx.close();
  }
  await browser.close();
  console.log(JSON.stringify({ res, ko, errs }, null, 1));
  process.exit(ko.length || errs.length ? 1 : 0);
})().catch(e => { console.log('ECHEC', e.message); process.exit(1); });
