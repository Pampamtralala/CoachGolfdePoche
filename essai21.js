/* P09 : erreurs récurrentes — données insuffisantes, trois priorités documentées, constat et piste séparés, filtres. */
const { chromium } = require('playwright');
const fs = require('fs');
const CLE = 'coachgolf.v1';
const PARS = [4, 4, 3, 5, 4, 4, 3, 5, 4];
const norm = s => s.replace(/[\s  ]+/g, ' ').trim();
(async () => {
  const D = 'shots21'; fs.mkdirSync(D, { recursive: true });
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const res = {}, errs = [], ko = [];
  const verifie = (c, m) => { if (!c) ko.push(m); };
  for (const [w, h, sombre] of [[390, 844, false], [360, 760, true]]) {
    const nom = w + (sombre ? 's' : ''), r = res[nom] = {};
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, colorScheme: sombre ? 'dark' : 'light', hasTouch: true, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    page.on('pageerror', e => errs.push(nom + ' ' + e.message));
    const vue = n => page.locator('#st-erreurs').screenshot({ path: `${D}/${nom}-${n}.png` });
    await page.goto('file://' + __dirname + '/dist/index.html');
    await page.click('[data-a="commencer"]'); await page.fill('#q-prenom', 'Benjamin'); await page.fill('#q-index', '14'); await page.click('[data-a="q-suite"]');
    await page.click('[data-k="objectif"][data-v="score"]'); await page.click('[data-a="q-suite"]');
    for (const l of ['practice', 'putting', 'parcours']) await page.click(`[data-a="lieu"][data-v="${l}"]`);
    for (let i = 0; i < 8 && await page.locator('[data-a="q-suite"]').count(); i++) await page.click('[data-a="q-suite"]');
    await page.waitForSelector('.tete');
    const e = await page.evaluate(k => JSON.parse(localStorage.getItem(k)), CLE);
    const charger = async parties => {
      e.parties = parties; e.maj = Date.now();
      await page.evaluate(([k, v]) => localStorage.setItem(k, JSON.stringify(v)), [CLE, e]);
      await page.reload(); await page.waitForSelector('.tete');
      await page.click('#barre [data-a="onglet"][data-v="bilan"]');
      await page.click('[data-a="st-derniers"][data-v="0"]');
    };
    e.parcours = [{ id: 'p1', nom: 'La Jonchère', pars: PARS }, { id: 'p2', nom: 'Bonnat', pars: PARS }];
    /* trou : [jouable, gir, putts, pén, score, par, côté, club départ, putt1, evit, bunker] */
    const T = p => [1, 1, 2, 0, p, p, 0, p >= 4 ? 1 : 0, 0, 0, 0];
    const fabrique = (n, recentsSansTroisPutts) => Array.from({ length: n }, (_, i) => {
      const trous = PARS.map((p, k) => {
        const t = T(p);
        if (k <= 1) { t[0] = 0; t[6] = 3; t[1] = 0; t[4] = p + 1; }
        if (k === 1) { t[3] = 1; t[4] = p + 2; }
        if (k === 3) { t[1] = 0; t[4] = p + 2; }
        if ((!recentsSansTroisPutts || i < n / 2) && (k === 5 || k === 7)) { t[2] = 3; t[4] += 1; }
        return t;
      });
      const coups = PARS.map((p, k) => p >= 4 ? [{ c: 'dr', a: 'plein', p: 'dep', l: k <= 1 ? 25 : 0, id: 'c_' + i + k }] : [{ c: 'f7', a: 'plein', p: 'dep', l: k === 2 ? -15 : 2, id: 'c_' + i + k }]);
      return { id: 'p_essai' + (3000 + i), d: new Date(Date.UTC(2026, 2, 1) + i * 9 * 86400000).toISOString(), o: 0, pc: i % 2 ? 'p2' : 'p1', trous, coups, renseigne: PARS.map(() => 3) };
    });
    /* Une seule partie : données insuffisantes, ce qu'il manque */
    await charger(fabrique(1, false));
    r.insuffisant = norm(await page.textContent('#st-erreurs'));
    verifie(/Données insuffisantes/.test(r.insuffisant) && /Mise en jeu ratée encore 13 départs renseignés\. Note la mise en jeu/.test(r.insuffisant) && !(await page.locator('#st-erreurs .carte-erreur').count()), nom + ' données insuffisantes : ' + r.insuffisant.slice(0, 400));
    await vue('01-insuffisant');
    /* Douze parties : trois priorités */
    await charger(fabrique(12, true));
    r.titres = await page.$$eval('#st-erreurs .carte-erreur h3', l => l.map(x => x.textContent.replace(/[\s  ]+/g, ' ').trim()));
    verifie(r.titres.length === 3 && /^1\. Coups hors de l.axe/.test(r.titres[0]), nom + ' trois priorités, classées : ' + r.titres.join(' | '));
    r.cartes = await page.$$eval('#st-erreurs .carte-erreur', l => l.map(x => x.textContent.replace(/[\s  ]+/g, ' ').trim()));
    const c1 = r.cartes[0];
    verifie(/Constat 36 fois sur 108 coups avec direction \(33 %\), soit 6,0 pour 18 trous\. 24 à droite, 12 à gauche\./.test(c1), nom + ' constat chiffré : ' + c1);
    verifie(/Où et avec quoi Avec le fer 7 : 12 sur 24 \(50 %\) ; avec le driver : 24 sur 84 \(29 %\)\. À La Jonchère/.test(c1), nom + ' clubs associés : ' + c1);
    verifie(/Piste à vérifier .*C.est une hypothèse, pas un constat\./.test(c1), nom + ' piste séparée du constat');
    const tp = r.cartes.find(x => /Trois-putts/.test(x)) || '';
    r.tableau = await page.$$eval('#st-erreurs table.erreurs tbody tr', l => l.map(x => [...x.children].map(c => c.textContent).join(' | ').replace(/[\s  ]+/g, ' ')));
    verifie(r.tableau.length === 6 && r.tableau.some(x => /^Trois-putts.*22 → 0 % \| ?moins fréquent|Trois-putts.*22 → 0 %moins fréquent/.test(x)), nom + ' tableau complet, trois-putts en baisse : ' + r.tableau.join(' / '));
    verifie(r.tableau.some(x => /^Green manqué en régulation ?déduit du score/.test(x)), nom + ' GIR marqué déduit');
    await vue('02-priorites');
    r.largeur = await page.evaluate(() => document.documentElement.scrollWidth);
    verifie(r.largeur === w, nom + ' pas de débordement : ' + r.largeur);
    /* Filtres partagés : 5 dernières parties */
    await page.click('[data-a="st-derniers"][data-v="5"]');
    r.apres = norm(await page.textContent('#st-erreurs .carte-erreur .constat'));
    verifie(/sur 45 coups avec direction/.test(r.apres), nom + ' suit les filtres (5 parties) : ' + r.apres);
    await ctx.close();
  }
  console.log(JSON.stringify({ res, ko, errs }, null, 1));
  await browser.close();
})().catch(e => { console.error('ECHEC', String(e.stack || e.message).split('\n').filter(l => !/retrying|waiting|scrolling|stable/.test(l)).slice(0, 10).join('\n')); process.exit(1); });
