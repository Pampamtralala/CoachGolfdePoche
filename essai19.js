/* P06 : profil des clubs — direction, arrivées, mises en jeu, distance indicative, comparaison, départs par famille, lien depuis le sac. */
const { chromium } = require('playwright');
const fs = require('fs');
const { allerVue } = require('./nav-essai');
const CLE = 'coachgolf.v1';
const PARS = [4, 4, 3, 5, 4, 4, 3, 5, 4];
(async () => {
  const D = 'shots19'; fs.mkdirSync(D, { recursive: true });
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const res = {}, errs = [], ko = [];
  const verifie = (c, m) => { if (!c) ko.push(m); };
  for (const [w, h, sombre] of [[390, 844, false], [360, 760, true]]) {
    const nom = w + (sombre ? 's' : ''), r = res[nom] = {};
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, colorScheme: sombre ? 'dark' : 'light', hasTouch: true, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    page.on('pageerror', e => errs.push(nom + ' ' + e.message));
    const vue = n => page.locator('#st-clubs').screenshot({ path: `${D}/${nom}-${n}.png` });
    await page.goto('file://' + __dirname + '/dist/index.html');
    await page.click('[data-a="commencer"]'); await page.fill('#q-prenom', 'Benjamin'); await page.fill('#q-index', '14'); await page.click('[data-a="q-suite"]');
    await page.click('[data-k="objectif"][data-v="score"]'); await page.click('[data-a="q-suite"]');
    for (const l of ['practice', 'putting', 'parcours']) await page.click(`[data-a="lieu"][data-v="${l}"]`);
    for (let i = 0; i < 8 && await page.locator('[data-a="q-suite"]').count(); i++) await page.click('[data-a="q-suite"]');
    await page.waitForSelector('.tete');
    /* Sans coup ni club de départ : état vide de la section */
    await page.click('#barre [data-a="onglet"][data-v="bilan"]'); await page.click('[data-a="rubrique"][data-v="clubs"]'); /* UX06 */
    const e = await page.evaluate(k => JSON.parse(localStorage.getItem(k)), CLE);
    e.parties = [{ id: 'p_vide', d: '2026-03-01T10:00:00.000Z', o: 0, trous: PARS.map(p => [1, 0, 2, 0, p + 1, p, 0, 0, 0, 0, 0]) }];
    e.maj = Date.now();
    await page.evaluate(([k, v]) => localStorage.setItem(k, JSON.stringify(v)), [CLE, e]);
    await page.reload(); await page.waitForSelector('.tete'); await page.click('#barre [data-a="onglet"][data-v="bilan"]'); await page.click('[data-a="rubrique"][data-v="clubs"]'); /* UX06 */
    r.vide = (await page.textContent('#st-clubs')).replace(/\s+/g, ' ').trim();
    verifie(/Aucun club à profiler/.test(r.vide), nom + ' section vide : ' + r.vide);
    /* 12 parties de 9 trous : driver au départ des par 4/5 (de plus en plus droit), fer 7 sur les par 3,
       club de départ « Driver » noté en standard sur les 4 dernières, sans coups */
    e.parties = Array.from({ length: 12 }, (_, i) => {
      const expert = i < 8, recent = i >= 4;
      const trous = PARS.map((p, k) => {
        const jouable = recent ? (k === 0 ? 0 : 1) : (k % 2 ? 1 : 0);
        return [jouable, 0, 2, k === 1 && !jouable ? 1 : 0, p + 1, p, jouable ? 0 : (k % 3 ? 3 : 1), p >= 4 ? 1 : 0, 0, 0, 0];
      });
      const coups = expert ? PARS.map((p, k) => p >= 4
        ? [{ c: 'dr', a: 'plein', p: 'dep', l: recent ? (k === 0 ? 18 : 2) : (k % 2 ? -3 : 22), id: 'c_d' + i + k }, { c: 'f7', a: 'plein', p: trous[k][0] ? 'fw' : 'ro', d: 140 + (k % 3) * 5, source: 'manuel', id: 'c_f' + i + k }]
        : [{ c: 'f7', a: 'plein', p: 'dep', l: k % 2 ? -12 : 1, d: 145, source: i % 2 ? 'gps' : 'manuel', distanceType: i % 2 ? 'total' : 'carry', id: 'c_t' + i + k }]) : PARS.map(() => []);
      return { id: 'p_essai' + (2000 + i), d: new Date(Date.UTC(2026, 3, 1) + i * 7 * 86400000).toISOString(), o: 0, trous, coups, renseigne: PARS.map(() => 3) };
    });
    e.maj = Date.now();
    await page.evaluate(([k, v]) => localStorage.setItem(k, JSON.stringify(v)), [CLE, e]);
    await page.reload(); await page.waitForSelector('.tete');
    await page.click('#barre [data-a="onglet"][data-v="bilan"]'); await page.click('[data-a="rubrique"][data-v="clubs"]'); /* UX06 */
    await page.click('[data-a="st-derniers"][data-v="0"]');
    await page.evaluate(() => document.getElementById('st-clubs').scrollIntoView());
    await page.click('#st-clubs [data-a="st-club"][data-v="dr"]');
    r.clubs = await page.$$eval('#st-clubs [data-a="st-club"]', l => l.map(x => x.textContent.replace(/\s+/g, ' ').trim()));
    verifie(r.clubs.length === 2 && /^Driver/.test(r.clubs[0]) && /Fer 7/.test(r.clubs[1]), nom + ' clubs notés dans l\'ordre du sac : ' + r.clubs.join(' | '));
    r.familles = (await page.textContent('.departs-familles')).replace(/\s+/g, ' ').trim();
    verifie(/Driver/.test(r.familles) && /départs renseignés/.test(r.familles), nom + ' départs par type de club : ' + r.familles);
    r.echantillon = (await page.textContent('.stats-club-echantillon')).replace(/\s+/g, ' ');
    verifie(/Driver : 56 coups notés sur 8 parties/.test(r.echantillon), nom + ' échantillon du club : ' + r.echantillon);
    r.lignes = await page.$$eval('#st-clubs .club-ligne', l => l.map(x => x.textContent.replace(/\s+/g, ' ').trim()));
    r.barres = await page.$$eval('#st-clubs .rep-titre', l => l.map(x => x.textContent.replace(/\s+/g, ' ')));
    verifie(r.barres.some(x => /Gauche ou droite sur 56 coups/.test(x)) && r.barres.some(x => /Où la balle arrive/.test(x)), nom + ' graphiques gauche/droite et arrivées : ' + r.barres.join(' | '));
    verifie(r.lignes.some(x => /Au départ des par 4 et 5 .*40 mises en jeu jouables sur 56 renseignées/.test(x)), nom + ' mises en jeu du driver : ' + r.lignes[0]);
    verifie(r.lignes.some(x => /Distance pas assez de mesures \(0 sur 3/.test(x)), nom + ' driver sans distance : profil lisible sans');
    verifie(r.lignes.some(x => /Tendance des 28 coups les plus anciens aux 28 plus récents : dans l[’']axe 57 % → 86 %/.test(x)), nom + ' tendance : ' + r.lignes.filter(x => /Tendance/.test(x)));
    await vue('01-driver');
    /* Fer 7 : distance indicative arrondie à 5 m, GPS signalé */
    await page.click('#st-clubs [data-a="st-club"][data-v="f7"]');
    r.f7 = (await page.$$eval('#st-clubs .club-ligne', l => l.map(x => x.textContent.replace(/\s+/g, ' ').trim()))).filter(x => /Distance/.test(x))[0];
    verifie(/environ 1[45][05] m sur le parcours .*Indicatif : \d+ mesures dont \d+ au GPS, roule comprise, approximatives/.test(r.f7), nom + ' distance indicative du fer 7 : ' + r.f7);
    /* Comparaison */
    await page.selectOption('#st-club2', 'dr');
    r.comparaison = await page.$$eval('.comparaison-clubs tbody tr', l => l.map(x => x.textContent.replace(/\s+/g, ' ').trim()));
    verifie(r.comparaison.length === 7 && /Coups notés/.test(r.comparaison[0]) && r.comparaison.slice(1).every(x => /n = \d+|aucun/.test(x)), nom + ' comparaison avec effectifs : ' + r.comparaison.join(' / '));
    verifie(/Distance indicative\s*≈ 1\d\d m/.test(r.comparaison[6]) && /–/.test(r.comparaison[6]), nom + ' distance : chiffre pour le fer 7, tiret pour le driver : ' + r.comparaison[6]);
    r.barresComp = await page.$$eval('#st-clubs .rep-titre', l => l.map(x => x.textContent.replace(/\s+/g, ' ')));
    verifie(r.barresComp.length === 2, nom + ' deux graphiques gauche/droite : ' + r.barresComp.join(' | '));
    await vue('02-comparaison');
    r.largeur = await page.evaluate(() => document.documentElement.scrollWidth);
    verifie(r.largeur === w, nom + ' pas de débordement : ' + r.largeur);
    /* Filtres partagés : 5 dernières parties → le fer 7 n'a plus que les coups des parties expert restantes */
    await page.click('[data-a="st-derniers"][data-v="5"]');
    r.apresFiltre = await page.$$eval('#st-clubs [data-a="st-club"]', l => l.map(x => x.textContent.replace(/\s+/g, ' ').trim()));
    verifie(r.apresFiltre.join(' | ') === 'Driver 7 | Fer 7 9', nom + ' le profil suit les filtres : ' + r.apresFiltre.join(' | '));
    /* Depuis le sac : la fiche du fer 7 ouvre son profil */
    await allerVue(page, 'sac');
    const b = page.locator('#sac-scene [data-id="f7"]'); const bb = await b.boundingBox();
    await b.click({ position: { x: bb.width * 0.68, y: bb.height * 0.3 } });
    if (!(await page.locator('#feuille').count())) await b.click({ position: { x: bb.width * 0.68, y: bb.height * 0.3 } });
    await page.waitForSelector('#feuille [data-a="st-voir-club"]');
    r.lien = (await page.textContent('#feuille [data-a="st-voir-club"]')).trim();
    await page.click('#feuille [data-a="st-voir-club"]');
    await page.waitForSelector('#st-clubs');
    r.depuisSac = await page.$eval('#st-clubs [data-a="st-club"][aria-pressed="true"]', x => x.textContent.replace(/\s+/g, ' ').trim());
    verifie(/Fer 7/.test(r.depuisSac) && !(await page.locator('#feuille').count()), nom + ' lien depuis le sac : ' + r.lien + ' → ' + r.depuisSac);
    await ctx.close();
  }
  console.log(JSON.stringify({ res, ko, errs }, null, 1));
  await browser.close();
})().catch(e => { console.error('ECHEC', String(e.stack || e.message).split('\n').filter(l => !/retrying|waiting|scrolling|stable/.test(l)).slice(0, 10).join('\n')); process.exit(1); });
