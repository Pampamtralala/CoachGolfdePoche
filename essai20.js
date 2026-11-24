/* P07 : fiche de parcours — passages par tracé, évolution, retour 9 trous, comparaison des passages sur un trou. */
const { chromium } = require('playwright');
const fs = require('fs');
const { allerVue } = require('./nav-essai');
const CLE = 'coachgolf.v1';
const PARS = [4, 5, 3, 4, 4, 3, 5, 4, 4, 4, 4, 3, 5, 4, 4, 4, 3, 5];
(async () => {
  const D = 'shots20'; fs.mkdirSync(D, { recursive: true });
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const res = {}, errs = [], ko = [];
  const verifie = (c, m) => { if (!c) ko.push(m); };
  for (const [w, h, sombre] of [[390, 844, false], [360, 760, true]]) {
    const nom = w + (sombre ? 's' : ''), r = res[nom] = {};
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, colorScheme: sombre ? 'dark' : 'light', hasTouch: true, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    page.on('pageerror', e => errs.push(nom + ' ' + e.message));
    const vue = n => page.locator('#feuille').screenshot({ path: `${D}/${nom}-${n}.png` });
    await page.goto('file://' + __dirname + '/dist/index.html');
    await page.click('[data-a="commencer"]'); await page.fill('#q-prenom', 'Benjamin'); await page.fill('#q-index', '14'); await page.click('[data-a="q-suite"]');
    await page.click('[data-k="objectif"][data-v="score"]'); await page.click('[data-a="q-suite"]');
    for (const l of ['practice', 'putting', 'parcours']) await page.click(`[data-a="lieu"][data-v="${l}"]`);
    for (let i = 0; i < 8 && await page.locator('[data-a="q-suite"]').count(); i++) await page.click('[data-a="q-suite"]');
    await page.waitForSelector('.tete');
    const e = await page.evaluate(k => JSON.parse(localStorage.getItem(k)), CLE);
    e.parcours = [{ id: 'p1', nom: 'La Jonchère', pars: PARS }];
    /* trou : [jouable, gir, putts, pén, score, par, côté, club départ, putt1, evit, bunker] */
    const trou = (par, ecart, o) => Object.assign([1, 0, 2, 0, par + ecart, par, 0, par >= 4 ? 1 : 0, 0, 0, 0], o || {});
    const partie = (id, d, ecarts, o, extra) => Object.assign({ id, d: d + 'T10:00:00.000Z', pc: 'p1', o: o || 0, renseigne: ecarts.map(() => 3),
      trous: ecarts.map((x, k) => trou(PARS[(o || 0) + k], x)) }, extra || {});
    const p18 = (id, d, base, t7) => partie(id, d, PARS.map((p, k) => k === 6 ? t7 : base));
    e.parties = [
      p18('p_essai1', '2026-04-04', 2, 3),
      p18('p_essai2', '2026-05-02', 1, 2),
      p18('p_essai3', '2026-06-06', 1, 1),
      p18('p_essai4', '2026-07-04', 1, 2),
      partie('p_essai5', '2026-06-20', Array(9).fill(1), 0),
      partie('p_essai6', '2026-07-11', Array(9).fill(0), 9)
    ];
    /* Trou 7 (par 5) de la 2e partie : départ raté à droite, pénalité, coups notés dont une estimation */
    const t = e.parties[1].trous[6]; t[0] = 0; t[6] = 3; t[3] = 1;
    e.parties[1].coups = PARS.map(() => []);
    e.parties[1].coups[6] = [{ c: 'dr', a: 'plein', p: 'dep', d: 215, source: 'gps', distanceType: 'total', id: 'c_a' }, { c: 'b5', a: 'plein', p: 'ro', id: 'c_b' }, { c: 'pw', a: 'plein', p: 'fw', d: 95, dm: 1, id: 'c_c' }];
    /* Partie express sans mise en jeu renseignée sur le trou 7 */
    e.parties[3].renseigne[6] = 0;
    e.maj = Date.now();
    await page.evaluate(([k, v]) => localStorage.setItem(k, JSON.stringify(v)), [CLE, e]);
    await page.reload(); await page.waitForSelector('.tete');
    await allerVue(page, 'parcours', 'c-parcours');
    await page.click('[data-a="pc-ouvrir"][data-id="p1"]');
    await page.locator('#feuille table.traces').waitFor();
    r.passages = (await page.textContent('#feuille .pc-passages')).replace(/\s+/g, ' ').trim();
    verifie(/6 parties sur ce parcours, du 4 avr\. au 11 juil\./.test(r.passages), nom + ' passages : ' + r.passages);
    r.traces = await page.$$eval('#feuille .traces tbody tr', l => l.map(x => [...x.children].map(c => [...c.childNodes].map(n => n.textContent).join(' ')).join(' ').replace(/[\s\u00a0\u202f]+/g, ' ').trim()));
    verifie(r.traces.length === 3 && /^18 trous 4/.test(r.traces[0]) && r.traces.some(x => /^Aller \(1 à 9\) 1/.test(x)) && r.traces.some(x => /^Retour \(10 à 18\) 1 36 par 36 par · 11 juil\./.test(x)), nom + ' tracés séparés : ' + r.traces.join(' / '));
    verifie(/^18 trous 4 95 \+23,3 90 \+18 · 6 juin$/.test(r.traces[0]), nom + ' 18 trous : moyenne, meilleur le 6 juin, dernier : ' + r.traces[0]);
    r.graphe = await page.$eval('#feuille .graphe-scores figcaption', x => x.textContent);
    verifie(/18 trous \(4\)/.test(r.graphe) && !/ramené/.test(r.graphe), nom + ' évolution des 18 trous, écart brut : ' + r.graphe);
    r.tendance = await page.$eval('#feuille .pc-tendance', x => x.textContent.replace(/[\s\u00a0\u202f]+/g, ' ')).catch(() => '');
    verifie(/Tendance \(18 trous\) : \+28,0 sur tes 2 premières parties, \+18,5 sur les 2 dernières/.test(r.tendance), nom + ' tendance : ' + r.tendance);
    await vue('01-fiche');
    /* Trou 7 : quatre passages des 18 trous + l'aller ; comparaison des passages */
    await page.click('#feuille [data-a="pc-trou"][data-v="6"]');
    await page.waitForSelector('#pc-trou-detail');
    r.titre = (await page.textContent('#pc-trou-detail h4')).trim();
    verifie(/Trou 7 · par 5 · 5 passages/.test(r.titre), nom + ' titre du trou : ' + r.titre);
    r.resume = (await page.textContent('#pc-trou-detail .pc-trou-resume')).replace(/\s+/g, ' ');
    verifie(/meilleur \+1/.test(r.resume) && /pire \+3/.test(r.resume) && /pénalité sur 1 passage/.test(r.resume) && /départ jouable 3 fois sur 4 \(1 à droite\)/.test(r.resume), nom + ' résumé du trou : ' + r.resume);
    r.lignes = await page.$$eval('#pc-trou-detail tbody tr:not(.coups-passage)', l => l.map(x => [...x.children].map(c => [...c.childNodes].map(n => n.textContent).join(' ')).join(' ').replace(/[\s\u00a0\u202f]+/g, ' ').trim()));
    verifie(r.lignes.length === 5 && /^4 juil\./.test(r.lignes[0]) && /non noté/.test(r.lignes[0]) && /^4 avr\./.test(r.lignes[4]), nom + ' passages du plus récent au plus ancien : ' + r.lignes.join(' / '));
    const l2 = r.lignes.find(x => /^2 mai/.test(x)) || '';
    r.coups = await page.$$eval('#pc-trou-detail tr.coups-passage', l => l.map(x => x.textContent.replace(/[\s\u00a0\u202f]+/g, ' ').trim()));
    verifie(/^2 mai 7 \+2 raté à droite 2 1$/.test(l2) && r.coups.length === 1 && /Coups ?: Driver 215 m GPS → Bois 5 → Pitching wedge$/.test(r.coups[0]), nom + ' passage du 2 mai et ses coups, estimation masquée : ' + l2 + ' · ' + r.coups);
    await vue('02-trou7');
    /* Trou 12 : seul le retour et les 18 trous y passent (le retour est bien rapproché) */
    await page.click('#feuille [data-a="pc-trou"][data-v="11"]');
    r.t12 = (await page.textContent('#pc-trou-detail h4')).trim();
    verifie(/Trou 12 · par 3 · 5 passages/.test(r.t12), nom + ' trou 12 avec le retour : ' + r.t12);
    r.t12dep = await page.$$eval('#pc-trou-detail tbody tr td:nth-child(3)', l => l.map(x => x.textContent.trim()));
    verifie(r.t12dep.every(x => x === '–'), nom + ' par 3 : pas de mise en jeu : ' + r.t12dep.join(','));
    /* Toucher le trou choisi le referme */
    await page.click('#feuille [data-a="pc-trou"][data-v="11"]');
    verifie(!(await page.locator('#pc-trou-detail').count()), nom + ' second toucher : détail refermé');
    /* Tableau : passages et départs renseignés */
    await page.click('#feuille details:has(.carte-score.trous) summary');
    r.ligne7 = await page.$eval('#feuille .carte-score.trous tbody tr:nth-child(7)', x => [...x.children].map(c => c.textContent).join(' ').replace(/[\s\u00a0\u202f]+/g, ' ').trim());
    verifie(/^7 5 \+1,8 5 3\/4/.test(r.ligne7), nom + ' tableau trou 7 (5 passages, départs 3/4 renseignés) : ' + r.ligne7);
    r.largeur = await page.evaluate(() => Math.max(document.documentElement.scrollWidth, document.getElementById('feuille').scrollWidth));
    verifie(r.largeur <= w, nom + ' pas de débordement : ' + r.largeur);
    await ctx.close();
  }
  console.log(JSON.stringify({ res, ko, errs }, null, 1));
  await browser.close();
})().catch(e => { console.error('ECHEC', String(e.stack || e.message).split('\n').filter(l => !/retrying|waiting|scrolling|stable/.test(l)).slice(0, 10).join('\n')); process.exit(1); });
