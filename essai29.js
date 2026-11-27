/* UX05 : enseignements personnalisés — carnet vide, deux parties (rien de conclu), douze parties (trois cartes de
   catégories distinctes sur Mon jeu), fiche complète, lien vers le détail, passerelle vers les exercices,
   accès depuis Analyses et la recherche, pas de débordement sur téléphone. */
const { chromium } = require('playwright');
const fs = require('fs');
const CLE = 'coachgolf.v1';
const PARS = [4, 4, 3, 5, 4, 4, 3, 5, 4];
const norm = s => s.replace(/[\s  ]+/g, ' ').trim();
(async () => {
  const D = 'shots29'; fs.mkdirSync(D, { recursive: true });
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const res = {}, errs = [], ko = [];
  const verifie = (c, m) => { if (!c) ko.push(m); };
  const T = p => [1, 1, 2, 0, p, p, 0, 0, 0, 0, 0];
  const partie = (i, o) => ({ id: 'p_ens' + (7000 + i), d: new Date(Date.now() - (120 - i * 9) * 864e5).toISOString(), o: 0, pc: 'p1', renseigne: PARS.map(() => 7),
    trous: PARS.map((p, k) => { const t = T(p); if (k === 6) t[4] += 2; if (o.mauvais && k === 0) t[4] += 3; if (o.mauvais && k === 2) { t[2] = 3; t[4] += 1; } if (k === 1) { t[0] = 0; t[1] = 0; t[6] = 3; t[4] += 1; } return t; }) });
  async function charger(page, parties) {
    const e = await page.evaluate(k => JSON.parse(localStorage.getItem(k)), CLE);
    e.parcours = [{ id: 'p1', nom: 'Golf des Essais', pars: PARS }]; e.parties = parties; e.maj = Date.now();
    await page.evaluate(([k, v]) => localStorage.setItem(k, JSON.stringify(v)), [CLE, e]);
    await page.reload(); await page.waitForSelector('.tete');
  }
  for (const [w, h, sombre] of [[390, 844, false], [360, 760, true]]) {
    const nom = w + (sombre ? 's' : ''), r = res[nom] = {};
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, colorScheme: sombre ? 'dark' : 'light', hasTouch: true, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    page.on('pageerror', e => errs.push(nom + ' ' + e.message));
    await page.goto('file://' + __dirname + '/dist/index.html');
    await page.click('[data-a="ac-sans-index"]'); await page.click('.carnet-form button[type="submit"]');
    await page.waitForSelector('.tete');
    /* Carnet vide : pas de priorité, pas de faux enseignement */
    verifie(await page.locator('#mj-priorite').count() === 0, nom + ' carnet vide : pas de priorité');
    await page.click('#barre [data-v="bilan"]'); await page.click('#vue [data-a="famille"][data-v="comprendre"]');
    r.vide = norm(await page.textContent('#vue .rb-tete'));
    verifie(/apparaîtront après tes premières parties/.test(r.vide) && await page.locator('#vue .rb-ens-liste li, #vue .carte-ens').count() === 0, nom + ' Comprendre vide : ' + r.vide.slice(0, 120));
    /* Deux parties : la priorité ne peut être que d'enrichir ses données */
    await charger(page, [partie(0, {}), partie(1, {})]);
    r.deux = norm(await page.textContent('#mj-priorite').catch(() => ''));
    verifie(/Données à enrichir/.test(r.deux), nom + ' deux parties : priorité = données à enrichir : ' + r.deux);
    /* Douze parties : six mauvaises puis six bonnes — une seule priorité (vigilance, erreur ou opportunité) */
    await charger(page, Array.from({ length: 12 }, (_, i) => partie(i, { mauvais: i < 6 })));
    r.priorite = norm(await page.textContent('#mj-priorite'));
    verifie(await page.locator('#mj-priorite .carte-tb').count() === 1 && /Point de vigilance|Erreur récurrente|Opportunité/.test(r.priorite), nom + ' Accueil : une priorité : ' + r.priorite);
    await page.screenshot({ path: `${D}/${nom}-accueil.png`, fullPage: true });
    verifie(await page.evaluate(() => document.documentElement.scrollWidth) <= w, nom + ' Accueil sans débordement');
    /* V4-07 : tout en place dans Performance › Comprendre mon jeu (plus de fiche par-dessus) */
    const comprendre = async () => {
      await page.click('#barre [data-v="bilan"]'); await page.click('#vue [data-a="famille"][data-v="comprendre"]');
      const tout = page.locator('#vue [data-a="ens-tout"][aria-expanded="false"]'); if (await tout.count()) await tout.click();
    };
    const deplier = async id => { const b = page.locator(`#vue [data-a="ens-deplier"][data-v="${id}"]`); if (await b.getAttribute('aria-expanded') !== 'true') await b.click(); };
    await comprendre();
    r.lignes = await page.$$eval('#vue .rb-ens-liste li small', l => l.map(x => x.textContent.split(' · ')[0]));
    verifie(r.lignes.length > 3 && r.lignes.includes('Progression') && r.lignes.includes('Erreur récurrente'), nom + ' Comprendre : ' + r.lignes.length + ' enseignements, ' + [...new Set(r.lignes)].join(' | '));
    const premier = await page.$eval('#vue [data-a="ens-deplier"]', b => b.getAttribute('data-v'));
    await deplier(premier);
    r.meta = await page.$$eval('#vue .carte-ens .ens-meta', l => l.map(x => x.textContent));
    verifie(r.meta.length === 1 && /\d+ parties?/.test(r.meta[0]) && /(Du|Le|En) /.test(r.meta[0]) && await page.locator('#feuille').count() === 0, nom + ' carte dépliée en place : période et effectif : ' + r.meta[0]);
    await page.screenshot({ path: `${D}/${nom}-comprendre.png` });
    /* Lien vers le détail : la question correspondante, ouverte en place */
    await deplier('score-mieux');
    await page.click('#vue .carte-ens[data-ens="score-mieux"] [data-a="ens-detail"]');
    await page.waitForSelector('#vue #an-rep-score');
    r.detail = norm(await page.textContent('#an-rep-score .an-phrase'));
    verifie(/Oui, plutôt/.test(r.detail) && await page.locator('#feuille').count() === 0, nom + ' détail du score, en place : ' + r.detail);
    /* Passerelle vers les exercices : bibliothèque filtrée sur la mise en jeu */
    await comprendre(); await deplier('cote-mej');
    const pass = page.locator('#vue .carte-ens[data-ens="cote-mej"] [data-a="exos-domaine"]');
    verifie(await pass.count() === 1, nom + ' passerelle vers les exercices présente');
    if (await pass.count()) {
      await pass.click(); await page.waitForTimeout(80);
      r.filtre = await page.$eval('#vue [data-a="filtre"][aria-pressed="true"]', b => b.textContent).catch(() => '');
      verifie(r.filtre === 'Départ', nom + ' exercices filtrés : ' + r.filtre);
    }
    /* Lien vers les erreurs des statistiques */
    await comprendre();
    let trouve = false;
    for (const id of await page.$$eval('#vue [data-a="ens-deplier"]', l => l.map(b => b.getAttribute('data-v')))) {
      await deplier(id);
      const ver = page.locator('#vue [data-a="ens-aller"][data-s="st-erreurs"]').first();
      if (await ver.count()) { await ver.click(); await page.waitForTimeout(80); trouve = true; verifie(await page.locator('#vue #st-erreurs').count() === 1, nom + ' lien vers les erreurs'); break; }
    }
    if (!trouve) verifie(false, nom + ' lien vers les erreurs absent');
    /* Recherche */
    await page.click('.tete [data-a="recherche"]'); await page.fill('#recherche-q', 'enseignements');
    verifie(await page.locator('#recherche-l [data-a="fonction"][data-v="ens-ouvrir"], #recherche-l [data-a="ens-ouvrir"]').count() >= 1 || /Enseignements/.test(await page.textContent('#recherche-l')), nom + ' recherche : enseignements');
    await ctx.close();
  }
  await browser.close();
  console.log(JSON.stringify({ res, ko, errs }, null, 1));
  process.exit(ko.length || errs.length ? 1 : 0);
})().catch(e => { console.log('ECHEC', e.message); process.exit(1); });
