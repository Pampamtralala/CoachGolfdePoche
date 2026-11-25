/* P05 : tableau de bord statistique — filtres, effectifs, comparaison, graphique, cas vide. */
const { chromium } = require('playwright');
const fs = require('fs');
const CLE = 'coachgolf.v1';
const PARS = [4, 4, 3, 5, 4, 4, 3, 5, 4, 4, 4, 3, 5, 4, 4, 3, 5, 4];
const T = (par, sc, putts, pen, j, cote) => [j, sc - putts <= par - 2 ? 1 : 0, putts, pen, sc, par, j ? 0 : cote, 0, 0, 0, 0];
(async () => {
  const D = 'shots18'; fs.mkdirSync(D, { recursive: true });
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const res = {}, errs = [], ko = [];
  const verifie = (c, m) => { if (!c) ko.push(m); };
  for (const [w, h, sombre] of [[390, 844, false], [360, 760, true]]) {
    const nom = w + (sombre ? 's' : ''), r = res[nom] = {};
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, colorScheme: sombre ? 'dark' : 'light', hasTouch: true, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    page.on('pageerror', e => errs.push(nom + ' ' + e.message));
    const vue = n => page.screenshot({ path: `${D}/${nom}-${n}.png`, fullPage: true });
    await page.goto('file://' + __dirname + '/dist/index.html');
    await page.click('[data-a="commencer"]'); await page.fill('#q-prenom', 'Benjamin'); await page.fill('#q-index', '14'); await page.click('[data-a="q-suite"]');
    await page.click('[data-k="objectif"][data-v="score"]'); await page.click('[data-a="q-suite"]');
    for (const l of ['practice', 'putting', 'parcours']) await page.click(`[data-a="lieu"][data-v="${l}"]`);
    for (let i = 0; i < 8 && await page.locator('[data-a="q-suite"]').count(); i++) await page.click('[data-a="q-suite"]');
    await page.waitForSelector('.tete');
    /* Cas vide */
    await page.click('#barre [data-a="onglet"][data-v="bilan"]');
    r.vide = (await page.textContent('.etat-vide')).replace(/\s+/g, ' ').trim();
    /* 24 parties : 20 sur la Jonchère (dont 4 de 9 trous), 4 ailleurs ; les plus récentes meilleures */
    const e = await page.evaluate(k => JSON.parse(localStorage.getItem(k)), CLE);
    e.parcours = [{ id: 'p1', nom: 'La Jonchère', pars: PARS }, { id: 'p2', nom: 'Autre golf', pars: PARS }];
    e.parties = Array.from({ length: 24 }, (_, i) => {
      const neuf = i % 6 === 5, pc = i % 6 === 2 ? 'p2' : 'p1', sur = i < 12 ? 2 : 1;
      const pars = neuf ? PARS.slice(0, 9) : PARS;
      return { id: 'p_essai' + (1000 + i), d: new Date(Date.UTC(2026, 0, 5) + i * 7 * 86400000).toISOString(), pc, o: 0,
        trous: pars.map((p, k) => T(p, p + (k % 3 ? sur : 0), k % 7 ? 2 : 3, k === 4 ? 1 : 0, k % 4 ? 1 : 0, 1 + (k % 2) * 2)),
        renseigne: i >= 20 ? pars.map(() => 0) : pars.map(() => 1) };
    });
    e.maj = Date.now();
    await page.evaluate(([k, v]) => localStorage.setItem(k, JSON.stringify(v)), [CLE, e]);
    await page.reload(); await page.waitForSelector('.tete');
    await page.click('#barre [data-a="onglet"][data-v="bilan"]');
    r.echantillon = (await page.textContent('.stats-echantillon')).replace(/\s+/g, ' ');
    r.kpi = await page.$$eval('section.premier .kpi-grille .kpi', l => l.map(x => x.querySelector('.kpi-t').textContent + ' ' + x.querySelector('.kpi-v').textContent.replace(/\s+/g, ' ') + ' | ' + x.querySelector('.kpi-n').textContent));
    verifie(/Sur 10 parties \(\d+ trous\)/.test(r.echantillon) && /Comparé aux 10 parties précédentes/.test(r.echantillon) && /ramenés à 18 trous/.test(r.echantillon), nom + ' échantillon : ' + r.echantillon);
    verifie(r.kpi.length === 6 && r.kpi.every(x => / \| \d+ (trous|départs)/.test(x)), nom + ' effectif sous chaque chiffre : ' + r.kpi.join(' / '));
    verifie(/Score .*▼/.test(r.kpi[0]) && /Greens en régulation/.test(r.kpi[5]), nom + ' tendance du score (les dernières sont meilleures) : ' + r.kpi[0]);
    r.mej = r.kpi[4]; r.mejTexte = await page.$$eval('section.premier .kpi', l => l[4].querySelector('.kpi-x').textContent);
    verifie(/non renseignées \(saisie express\), non comptées/.test(r.mejTexte), nom + ' mises en jeu express non comptées : ' + r.mejTexte);
    r.barres = await page.locator('.graphe-scores .gs-barre').count();
    r.repartition = await page.$$eval('.repartition .rep-titre', l => l.map(x => x.textContent));
    verifie(r.barres === 10 && r.repartition.length >= 1, nom + ' graphique (10 barres) et répartition : ' + r.barres + ' · ' + r.repartition.join(' | '));
    await vue('01-tableau');
    /* Filtres cumulables : 18 trous seulement, La Jonchère, 5 parties */
    await page.click('[data-a="st-format"][data-v="18"]');
    await page.selectOption('#st-parcours', 'p1');
    await page.click('[data-a="st-derniers"][data-v="5"]');
    r.filtre = (await page.textContent('.stats-echantillon')).replace(/\s+/g, ' ');
    verifie(/Sur 5 parties \(90 trous\)/.test(r.filtre) && !/ramenés/.test(r.filtre), nom + ' filtres cumulés : ' + r.filtre);
    /* Toutes, sans comparaison */
    await page.click('[data-a="st-derniers"][data-v="0"]');
    r.toutes = (await page.textContent('.stats-echantillon')).replace(/\s+/g, ' ');
    verifie(/Sur 16 parties/.test(r.toutes) && !/Comparé/.test(r.toutes) && !(await page.locator('[data-c="st-comparer"]').count()), nom + ' toutes les parties : ' + r.toutes);
    /* Période libre sans partie : état vide */
    await page.click('.periode-libre summary');
    await page.fill('#st-debut', '2030-01-01'); await page.dispatchEvent('#st-debut', 'change');
    r.videPeriode = (await page.textContent('.etat-vide')).replace(/\s+/g, ' ').trim();
    verifie(/Aucune partie pour ces filtres/.test(r.videPeriode), nom + ' période sans partie : ' + r.videPeriode);
    /* Période libre de 8 semaines, toutes les parties : comparée aux 8 semaines d'avant */
    await page.fill('#st-debut', '2026-04-01'); await page.dispatchEvent('#st-debut', 'change');
    await page.fill('#st-fin', '2026-05-26'); await page.dispatchEvent('#st-fin', 'change');
    r.periode = (await page.textContent('.stats-echantillon')).replace(/\s+/g, ' ');
    r.periodeCase = (await page.textContent('label.case')).replace(/\s+/g, ' ').trim();
    verifie(/Comparé à la période précédente/.test(r.periode) && /56 jours précédents/.test(r.periodeCase), nom + ' deux périodes comparées : ' + r.periode + ' · ' + r.periodeCase);
    await page.click('[data-a="st-periode-effacer"]');
    r.largeur = await page.evaluate(() => document.documentElement.scrollWidth);
    verifie(r.largeur === w, nom + ' pas de débordement : ' + r.largeur);
    await ctx.close();
  }
  console.log(JSON.stringify({ res, ko, errs }, null, 1));
  await browser.close();
})().catch(e => { console.error('ECHEC', String(e.stack || e.message).split('\n').filter(l => !/retrying|waiting|scrolling|stable/.test(l)).slice(0, 10).join('\n')); process.exit(1); });
