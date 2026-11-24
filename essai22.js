/* P08 : putting — saisie du second putt difficile (Expert), section Putting (effectifs, GIR, longueur, évolution, parcours). */
const { chromium } = require('playwright');
const fs = require('fs');
const { modeDetail, lirePave } = require('./nav-essai');
const CLE = 'coachgolf.v1';
const PARS = [4, 4, 3, 5, 4, 4, 3, 5, 4];
const norm = s => s.replace(/[\s  ]+/g, ' ').trim();
(async () => {
  const D = 'shots22'; fs.mkdirSync(D, { recursive: true });
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const res = {}, errs = [], ko = [];
  const verifie = (c, m) => { if (!c) ko.push(m); };
  for (const [w, h, sombre] of [[390, 844, false], [360, 760, true]]) {
    const nom = w + (sombre ? 's' : ''), r = res[nom] = {};
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, colorScheme: sombre ? 'dark' : 'light', hasTouch: true, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    page.on('pageerror', e => errs.push(nom + ' ' + e.message));
    const P = '#calque-partie ';
    const lire = () => page.evaluate(k => JSON.parse(localStorage.getItem(k)), CLE);
    await page.goto('file://' + __dirname + '/dist/index.html');
    await page.click('[data-a="commencer"]'); await page.fill('#q-prenom', 'Benjamin'); await page.fill('#q-index', '14'); await page.click('[data-a="q-suite"]');
    await page.click('[data-k="objectif"][data-v="score"]'); await page.click('[data-a="q-suite"]');
    for (const l of ['practice', 'putting', 'parcours']) await page.click(`[data-a="lieu"][data-v="${l}"]`);
    for (let i = 0; i < 8 && await page.locator('[data-a="q-suite"]').count(); i++) await page.click('[data-a="q-suite"]');
    await page.waitForSelector('.tete');
    /* Saisie : en Expert, après 2 putts, « second putt difficile » ; disparaît sous 2 putts */
    await page.click('#barre [data-a="onglet"][data-v="parcours"]');
    await page.click('.cta-partie'); await page.fill('#dp-nom', 'Golf de Test'); await page.click('[data-a="pt-nouvelle"]'); await page.waitForSelector(P + '.pave');
    await modeDetail(page);
    for (let n = 0; n < 4; n++) { const v = (await lirePave(page)).putts; if (v === 2) break; await page.click(`${P}[data-a="pv-putts"][data-d="${v < 2 ? 1 : -1}"]`); }
    if (!(await page.locator(P + '.pv-plus[open]').count())) await page.click(P + '.pv-plus summary');
    r.choix = await page.locator(P + '[data-a="pt-set"][data-k="11"]').count();
    verifie(r.choix === 1, nom + ' choix « second putt difficile » à 2 putts : ' + r.choix);
    await page.click(P + '[data-a="pt-set"][data-k="8"][data-v="5"]');
    await page.click(P + '[data-a="pt-set"][data-k="11"][data-v="1"]');
    r.trou = (await lire()).partie.trous[0];
    verifie(r.trou.length === 12 && r.trou[11] === 1 && r.trou[8] === 5, nom + ' trou à 12 cases, signalé : ' + JSON.stringify(r.trou));
    await page.reload(); await page.waitForSelector(P + '.pave');
    r.apresRecharge = (await lire()).partie.trous[0];
    verifie(r.apresRecharge[11] === 1, nom + ' signalement gardé après rechargement : ' + JSON.stringify(r.apresRecharge));
    await page.click(`${P}[data-a="pv-putts"][data-d="-1"]`);
    r.unPutt = (await lire()).partie.trous[0];
    verifie(r.unPutt[2] === 1 && r.unPutt[11] === 0 && !(await page.locator(P + '[data-a="pt-set"][data-k="11"]').count()), nom + ' un putt : signalement retiré : ' + JSON.stringify(r.unPutt));
    await page.screenshot({ path: `${D}/${nom}-01-pave.png` });
    /* Section Putting sur un carnet préparé */
    const e = await lire();
    e.partie = null;
    e.parcours = [{ id: 'p1', nom: 'La Jonchère', pars: PARS }, { id: 'p2', nom: 'Bonnat', pars: PARS }];
    e.parties = Array.from({ length: 8 }, (_, i) => ({
      id: 'p_essai' + (4000 + i), d: new Date(Date.UTC(2026, 3, 1) + i * 8 * 86400000).toISOString(), o: 0, pc: i % 2 ? 'p2' : 'p1', renseigne: PARS.map(() => 7),
      trous: PARS.map((p, k) => {
        const putts = k === 8 ? 1 : (i < 4 && k <= 1) ? 3 : 2, gir = k === 2 || k === 8 ? 1 : 0;
        const t = [1, gir, putts, 0, p - 2 + (gir ? 0 : 1) + putts, p, 0, p >= 4 ? 1 : 0, k === 0 ? 5 : k === 8 ? 1 : k === 4 ? 3 : 0, 0, 0];
        if (k === 0 && i < 4) t.push(1);
        return t;
      })
    }));
    e.maj = Date.now();
    await page.evaluate(([k, v]) => localStorage.setItem(k, JSON.stringify(v)), [CLE, e]);
    await page.reload(); await page.waitForSelector('.tete');
    await page.click('#barre [data-a="onglet"][data-v="bilan"]');
    await page.click('[data-a="st-derniers"][data-v="0"]');
    r.echantillon = norm(await page.textContent('#st-putting .putt-echantillon'));
    verifie(r.echantillon === 'Sur 72 trous joués (8 parties), 144 putts.', nom + ' échantillon : ' + r.echantillon);
    r.kpis = await page.$$eval('#st-putting .kpi', l => l.map(x => [...x.children].map(c => c.textContent).join(' ').replace(/[\s\u00a0\u202f]+/g, ' ').trim()));
    verifie(/^Putts par trou 2,0 soit 36,0 sur 18 trous 72 trous$/.test(r.kpis[0]) && /^Trois putts et \+ 11 %/.test(r.kpis[3]) && /^Un putt 11 %/.test(r.kpis[1]), nom + ' chiffres : ' + r.kpis.join(' / '));
    r.evolution = norm(await page.textContent('#st-putting .putt-ligne'));
    verifie(/premières parties : 2,1 putts par trou et 22 % de trois-putts \(36 trous\) ; sur les 4 dernières : 1,9 et 0 % \(36 trous\) : moins de putts\./.test(r.evolution), nom + ' évolution : ' + r.evolution);
    r.gir = await page.$$eval('#st-putting table.putt-gir tbody tr', l => l.map(x => [...x.children].map(c => c.textContent).join(' | ').replace(/[\s  ]+/g, ' ')));
    verifie(r.gir.length === 2 && /^En régulationdéduit du score \| 1,5/.test(r.gir[0].replace(/ \| /, ' | ').replace(/En régulation ?déduit/, 'En régulationdéduit')), nom + ' selon le green : ' + r.gir.join(' / '));
    r.longueur = await page.$$eval('#st-putting table.putt-longueur tbody tr', l => l.map(x => [...x.children].map(c => c.textContent).join(' | ').replace(/[\s  ]+/g, ' ')));
    verifie(r.longueur.length === 3 && /^Long.* \| 2,5 ?8 trous \| 0 % \| 50 %$/.test(r.longueur[2]), nom + ' premier putt long : ' + r.longueur.join(' / '));
    r.difficile = norm((await page.$$eval('#st-putting .putt-ligne', l => l.map(x => x.textContent))).filter(x => /Second putt/.test(x))[0] || '');
    verifie(/signalé 4 fois, dont 4 après un premier putt long\./.test(r.difficile), nom + ' second putt difficile : ' + r.difficile);
    r.parcours = await page.$$eval('#st-putting table.putt-parcours tbody tr', l => l.length);
    verifie(r.parcours === 2, nom + ' par parcours : ' + r.parcours);
    await page.locator('#st-putting').screenshot({ path: `${D}/${nom}-02-putting.png` });
    r.largeur = await page.evaluate(() => document.documentElement.scrollWidth);
    verifie(r.largeur === w, nom + ' pas de débordement : ' + r.largeur);
    /* Filtre : 9 trous seulement → mêmes parties ; 5 dernières → 45 trous */
    await page.click('[data-a="st-derniers"][data-v="5"]');
    r.cinq = norm(await page.textContent('#st-putting .putt-echantillon'));
    verifie(/^Sur 45 trous joués \(5 parties\)/.test(r.cinq), nom + ' suit les filtres : ' + r.cinq);
    await ctx.close();
  }
  console.log(JSON.stringify({ res, ko, errs }, null, 1));
  await browser.close();
})().catch(e => { console.error('ECHEC', String(e.stack || e.message).split('\n').filter(l => !/retrying|waiting|scrolling|stable/.test(l)).slice(0, 10).join('\n')); process.exit(1); });
