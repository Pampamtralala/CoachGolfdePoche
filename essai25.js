/* P10 : estimation des coups perdus — libellés explicites, méthode consultable, limites, départ inconnu non inventé,
   écart au jeu habituel. */
const { chromium } = require('playwright');
const fs = require('fs');
const CLE = 'coachgolf.v1';
const PARS = [4, 4, 3, 5, 4, 4, 3, 5, 4];
const norm = s => s.replace(/[\s  ]+/g, ' ').trim();
(async () => {
  const D = 'shots25'; fs.mkdirSync(D, { recursive: true });
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const res = {}, errs = [], ko = [];
  const verifie = (c, m) => { if (!c) ko.push(m); };
  const T = (p, o) => Object.assign([1, 1, 2, 0, p, p, 0, 0, 0, 0, 0], o || {});
  const partie = (i, o) => {
    o = o || {};
    return { id: 'p_essai' + (6000 + i), d: new Date(Date.UTC(2026, 2, 1) + i * 5 * 86400000).toISOString(), o: 0,
      renseigne: PARS.map(() => o.express ? 0 : 7),
      trous: PARS.map((p, k) => { const t = T(p); if (p >= 4 && (k === 0 || k === 4)) { t[0] = 0; t[1] = 0; t[4] = p + 1; } if (o.putts3 && k === 2) { t[2] = 3; t[4] = p + 1; } return t; }) };
  };
  for (const [w, h, sombre] of [[390, 844, false], [360, 760, true]]) {
    const nom = w + (sombre ? 's' : ''), r = res[nom] = {};
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, colorScheme: sombre ? 'dark' : 'light', hasTouch: true, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    page.on('pageerror', e => errs.push(nom + ' ' + e.message));
    await page.goto('file://' + __dirname + '/dist/index.html');
    await page.click('[data-a="commencer"]'); await page.fill('#q-prenom', 'Benjamin'); await page.fill('#q-index', '14'); await page.click('[data-a="q-suite"]');
    await page.click('[data-k="objectif"][data-v="score"]'); await page.click('[data-a="q-suite"]');
    for (const l of ['practice', 'putting', 'parcours']) await page.click(`[data-a="lieu"][data-v="${l}"]`);
    for (let i = 0; i < 8 && await page.locator('[data-a="q-suite"]').count(); i++) await page.click('[data-a="q-suite"]');
    await page.waitForSelector('.tete');
    const charger = async parties => {
      const e = await page.evaluate(k => JSON.parse(localStorage.getItem(k)), CLE);
      e.parties = parties; e.maj = Date.now();
      await page.evaluate(([k, v]) => localStorage.setItem(k, JSON.stringify(v)), [CLE, e]);
      await page.reload(); await page.waitForSelector('.tete');
      await page.click('#barre [data-a="onglet"][data-v="bilan"]');
      const b = page.locator('[data-a="pli"][data-v="sg"]');
      if (await b.count() && (await b.getAttribute('aria-expanded')) !== 'true') await b.click();
      await page.waitForSelector('#sg .methode-estimation');
    };
    /* Saisie express uniquement : départ non estimé, dit clairement */
    await charger(Array.from({ length: 4 }, (_, i) => partie(i, { express: true })));
    r.titre = norm((await page.$$eval('#sg h3.titre-bloc', l => l.map(x => x.textContent))).filter(x => /coups gagnés/.test(x))[0] || '');
    r.avert = norm(await page.textContent('#sg .estimation-avertissement'));
    verifie(/^Estimation des coups gagnés ou perdus par secteur$/.test(r.titre) && /pas du Strokes Gained/.test(r.avert), nom + ' libellés explicites : ' + r.titre + ' / ' + r.avert);
    r.graphe = await page.$eval('#sg canvas', x => x.getAttribute('aria-label')).catch(() => '');
    verifie(/Mise en jeu non mesuré/.test(r.graphe) && /Attaques de green \(départ compris\)/.test(r.graphe), nom + ' départ inconnu non inventé : ' + r.graphe);
    await page.click('#sg .methode-estimation summary');
    r.methode = norm(await page.textContent('#sg .methode-estimation'));
    verifie(/Fiabilité : indicative \(36 trous/.test(r.methode) && /Aucune distance/.test(r.methode) && /repères internes/.test(r.methode) && /Mises en jeu trop peu renseignées \(0 départs connus sur 28 par 4 et 5\)/.test(r.methode), nom + ' méthode et limites : ' + r.methode.slice(0, 500));
    r.habituel0 = norm(await page.textContent('#sg'));
    verifie(/Il faut au moins 27 trous récents et 72 trous de référence \(encore 54 trous de référence\)/.test(r.habituel0), nom + ' écart habituel refusé faute de données');
    /* Saisie standard sur 13 parties, les 5 dernières avec trois-putts */
    await charger(Array.from({ length: 8 }, (_, i) => partie(i)).concat(Array.from({ length: 5 }, (_, i) => partie(8 + i, { putts3: true }))));
    r.graphe2 = await page.$eval('#sg canvas', x => x.getAttribute('aria-label')).catch(() => '');
    verifie(/Mise en jeu [−+-]?\d/.test(r.graphe2) && !/départ compris/.test(r.graphe2), nom + ' départ estimé quand renseigné : ' + r.graphe2);
    r.habituel = await page.$$eval('#sg table.habituel tr', l => l.map(x => [...x.children].map(c => c.textContent).join(' | ').replace(/[\s  ]+/g, ' ')));
    verifie(r.habituel.length === 6 && r.habituel.some(x => /^Putting \| −?-?\d,\d \| moins bien$/.test(x)) && r.habituel.some(x => /^Mise en jeu \| = \| comme d.habitude$/.test(x)), nom + ' écart au jeu habituel : ' + r.habituel.join(' / '));
    r.texteHab = norm(await page.textContent('#sg'));
    verifie(/Tes 5 dernières parties \(45 trous/.test(r.texteHab) && /aux 8 parties d.avant \(72 trous\)/.test(r.texteHab) && /constat, pas une cause/.test(r.texteHab), nom + ' période et effectifs cités');
    await page.locator('#sg').screenshot({ path: `${D}/${nom}-sg.png` });
    r.largeur = await page.evaluate(() => document.documentElement.scrollWidth);
    verifie(r.largeur === w, nom + ' pas de débordement : ' + r.largeur);
    await ctx.close();
  }
  console.log(JSON.stringify({ res, ko, errs }, null, 1));
  await browser.close();
})().catch(e => { console.error('ECHEC', String(e.stack || e.message).split('\n').filter(l => !/retrying|waiting|scrolling|stable/.test(l)).slice(0, 10).join('\n')); process.exit(1); });
