/* V4-S08 : putter (putting sans attribution au club) et configuration du sac (14 clubs, lofts, références,
   historique gardé après retrait, coups qui suivent un changement de loft). */
const { chromium } = require('playwright');
const CLE = 'coachgolf.v1', PARS = [4, 4, 3, 5, 4, 4, 3, 5, 4], PUTTS = [2, 1, 3, 2, 2, 1, 2, 3, 2];
const ko = [], errs = [], res = {};
const verifie = (c, m) => { if (!c) ko.push(m); };
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  for (const w of [390, 360]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 800 }, reducedMotion: 'reduce' }), page = await ctx.newPage(), nom = String(w), r = res[nom] = {};
    page.on('pageerror', e => errs.push(nom + ' ' + e.message));
    const lire = () => page.evaluate(k => JSON.parse(localStorage.getItem(k)), CLE);
    await page.goto('file://' + process.cwd() + '/dist/index.html');
    await page.click('[data-a="ac-sans-index"]'); await page.click('.carnet-form button[type="submit"]'); await page.waitForSelector('.tete');
    const coups = k => k === 0 ? [{ c: 'w62', a: 'plein', d: 70 }] : k === 1 ? [{ c: 'w64', d: 60 }] : k === 2 ? [{ c: 'f7', d: 140 }] : [];
    const partie = i => ({ id: 'p_s8' + (100 + i), d: new Date(Date.UTC(2026, 5, 1) + i * 7 * 864e5).toISOString(), o: 0, pc: 'p1',
      trous: PARS.map((p, k) => [1, 1, PUTTS[k], 0, p + PUTTS[k] - 2, p, 0, 0, 0, 0, 0]), coups: PARS.map((p, k) => coups(k)) });
    let e = await lire();
    e.parcours = [{ id: 'p1', nom: 'La Jonchère', pars: PARS }]; e.parties = [0, 1, 2, 3].map(partie);
    e.carnet.wedgesPerso = [62, 64]; e.carnet.sac = ['dr', 'f7', 'pw', 'sw', 'w62', 'w64']; e.carnet.references = { f6: 150 }; e.maj = Date.now();
    await page.evaluate(([k, v]) => localStorage.setItem(k, JSON.stringify(v)), [CLE, e]);
    await page.reload(); await page.waitForSelector('.tete');
    await page.click('#barre [data-v="sac"]');
    /* Putter */
    await page.click('#c-distances [data-a="sac-fiche-club"][data-id="putter"]');
    r.putter = (await page.textContent('#club-page')).replace(/\s+/g, ' ');
    r.kpis = await page.$$eval('#club-page .putt-kpis .kpi, #club-page .putt-kpis > *', l => l.map(x => x.textContent.replace(/\s+/g, ' ').trim()));
    verifie(/Putts\s*\d+,\d|Putts\s*\d+ par 18 trous/.test(r.putter) && /Un putt/.test(r.putter) && /Trois putts et \+/.test(r.putter) && /36 trous/.test(r.putter), nom + ' putter : putting de la période : ' + r.putter.slice(0, 300));
    verifie(/ton putting, pas ton putter/.test(r.putter) && !/ton putter (fait|rate|gagne)/i.test(r.putter), nom + ' putter : aucune attribution au club');
    verifie(await page.locator('#club-page [data-a="aller-a"][data-s="st-putting"]').count() === 1 && await page.locator('#club-page [data-a="club-reglages"]').count() === 0, nom + ' putter : lien vers le putting, pas de réglages');
    /* Configuration */
    await page.click('[data-a="club-retour"]');
    await page.click('[data-a="sac-composer"]');
    r.compte = (await page.textContent('#feuille .sac-compte')).replace(/\s+/g, ' ').trim();
    verifie(/^Clubs sélectionnés ?7\/14$/.test(r.compte), nom + ' compteur : ' + r.compte);
    r.f6 = (await page.textContent('#feuille [data-a="sac-basculer"][data-id="f6"]')).replace(/\s+/g, ' ');
    r.f7 = (await page.textContent('#feuille [data-a="sac-basculer"][data-id="f7"]')).replace(/\s+/g, ' ');
    verifie(/réf\. 150 m/.test(r.f6) && !/\d+ m/.test(r.f7), nom + ' référence marquée, pas de moyenne sans provenance : ' + r.f6 + ' / ' + r.f7);
    /* Retirer le wedge 62° (coups joués, aucune mesure de carnet) : il reste connu, ses coups aussi */
    await page.click('#feuille [data-a="sac-basculer"][data-id="w62"]');
    e = await lire();
    verifie(e.carnet.wedgesPerso.includes(62) && !e.carnet.sac.includes('w62') && e.parties[0].coups[0][0].c === 'w62', nom + ' wedge 62° retiré, historique gardé : ' + JSON.stringify(e.carnet.wedgesPerso));
    /* Limite de 14 clubs */
    for (const id of ['b3', 'b5', 'h4', 'f5', 'f6', 'f8', 'f9', 'gw']) await page.click(`#feuille [data-a="sac-basculer"][data-id="${id}"]`);
    r.plein = (await page.textContent('#feuille .sac-compte')).replace(/\s+/g, ' ').trim();
    r.desactives = await page.$$eval('#feuille [data-a="sac-basculer"][aria-pressed="false"]', l => l.every(x => x.disabled));
    verifie(/^Clubs sélectionnés ?14\/14$/.test(r.plein) && r.desactives && /limite de la règle/.test(await page.textContent('#feuille')), nom + ' sac plein à 14, autres clubs désactivés : ' + r.plein);
    await page.click('#feuille [data-a="sac-basculer"][data-id="gw"]');
    /* Le putter depuis la configuration */
    await page.click('#feuille [data-a="sac-putter-page"]');
    verifie(await page.locator('#feuille').count() === 0 && /Putter/.test(await page.textContent('#club-page h1')), nom + ' configuration → page du putter');
    await page.click('[data-a="club-retour"]');
    /* Clubs retirés : pli dans Distances */
    r.retires = await page.$$eval('#c-retires li', l => l.map(x => x.textContent.replace(/\s+/g, ' ').trim()));
    verifie(r.retires.some(x => /Wedge 62° ?4 coups joués/.test(x)) && !r.retires.some(x => /Fer 6/.test(x)), nom + ' clubs retirés listés avec leur historique : ' + r.retires.join(' / '));
    await page.click('#c-retires summary'); await page.click('#c-retires [data-a="sac-fiche-club"][data-id="w62"]');
    r.page62 = (await page.textContent('#club-page')).replace(/\s+/g, ' ');
    verifie(/Hors du sac · historique gardé/.test(r.page62) && /4 coups enregistrés/.test(r.page62), nom + ' page du club retiré : ' + r.page62.slice(0, 160));
    await page.click('[data-a="club-retour"]');
    /* Changer le loft du wedge 64° en 63° : ses coups le suivent */
    await page.click('#c-synthese [data-a="sac-fiche-club"][data-id="w64"]').catch(async () => { await page.click('[data-a="sac-fiche-club"][data-id="w64"]'); });
    await page.click('[data-a="club-reglages"]');
    await page.fill('#sac-loft-club', '63'); await page.click('#feuille form[data-f="sac-loft-club"] button[type="submit"]');
    e = await lire();
    verifie(e.carnet.sac.includes('w63') && e.parties.every(p => p.coups[1][0].c === 'w63'), nom + ' loft changé, coups rattachés au wedge 63° : ' + JSON.stringify(e.parties.map(p => p.coups[1][0].c)));
    r.largeur = await page.evaluate(() => document.documentElement.scrollWidth);
    verifie(r.largeur === w, nom + ' pas de débordement : ' + r.largeur);
    await ctx.close();
  }
  await b.close();
  console.log(JSON.stringify({ res, ko, errs }, null, 1));
  process.exit(ko.length || errs.length ? 1 : 0);
})().catch(e => { console.log('ECHEC ' + e.message); process.exit(2); });
