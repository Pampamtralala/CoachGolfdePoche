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
    /* Carnet vide : pas de bloc, pas de faux enseignement */
    verifie(await page.locator('#c-enseignements').count() === 0, nom + ' carnet vide : pas de bloc d\'enseignements');
    await page.click('#barre [data-v="bilan"]'); await page.click('#vue .sous-nav [data-a="ens-ouvrir"]');
    r.vide = norm(await page.textContent('#feuille'));
    verifie(/Enregistre une première partie/.test(r.vide) && await page.locator('#feuille .carte-ens').count() === 0, nom + ' fiche vide : ' + r.vide.slice(0, 120));
    await page.keyboard.press('Escape');
    /* Deux parties : seulement des données à enrichir */
    await charger(page, [partie(0, {}), partie(1, {})]);
    r.deux = await page.$$eval('#c-enseignements .carte-ens .surtitre', l => l.map(x => x.textContent));
    verifie(r.deux.length >= 1 && r.deux.every(x => /Données à enrichir/.test(x)), nom + ' deux parties : ' + r.deux.join(' | '));
    verifie(await page.locator('#c-enseignements .ens-fiab.insuffisant').count() === r.deux.length, nom + ' deux parties : fiabilité insuffisante affichée');
    /* Douze parties : six mauvaises puis six bonnes */
    await charger(page, Array.from({ length: 12 }, (_, i) => partie(i, { mauvais: i < 6 })));
    r.cartes = await page.$$eval('#c-enseignements .carte-ens', l => l.map(c => c.querySelector('.surtitre').textContent.split(' · ')[0] + ' : ' + c.querySelector('h3').textContent));
    const cats = r.cartes.map(x => x.split(' : ')[0]);
    verifie(r.cartes.length === 3 && new Set(cats).size === 3, nom + ' Mon jeu : trois cartes de catégories distinctes : ' + r.cartes.join(' | '));
    r.meta = await page.$$eval('#c-enseignements .ens-meta', l => l.map(x => x.textContent));
    verifie(r.meta.every(x => /\d+ parties?/.test(x) && /(Du|Le|En) /.test(x)), nom + ' cartes : période et effectif : ' + r.meta.join(' | '));
    verifie(await page.locator('#c-enseignements .ens-fiab').count() === 3, nom + ' cartes : fiabilité expliquée');
    await page.screenshot({ path: `${D}/${nom}-accueil.png`, fullPage: true });
    verifie(await page.evaluate(() => document.documentElement.scrollWidth) <= w, nom + ' Mon jeu sans débordement');
    /* Fiche complète, regroupée par catégorie */
    await page.click('#c-enseignements [data-a="ens-ouvrir"]');
    r.groupes = await page.$$eval('#feuille .ens-groupe', l => l.map(x => x.textContent));
    r.total = await page.locator('#feuille .carte-ens').count();
    verifie(r.groupes.includes('Progression') && r.groupes.includes('Erreur récurrente') && r.total > 3, nom + ' fiche : ' + r.total + ' enseignements, ' + r.groupes.join(' | '));
    await page.screenshot({ path: `${D}/${nom}-fiche.png` });
    /* Lien vers le détail : la question de Comprendre mon jeu, ouverte */
    await page.click('#feuille .carte-ens[data-ens="score-mieux"] [data-a="ens-detail"]');
    await page.waitForSelector('#feuille.analyste #an-rep-score');
    r.detail = norm(await page.textContent('#an-rep-score .an-phrase'));
    verifie(/Oui, plutôt/.test(r.detail), nom + ' détail du score : ' + r.detail);
    await page.keyboard.press('Escape');
    /* Passerelle vers les exercices : bibliothèque filtrée sur la mise en jeu */
    await page.click('#barre [data-v="bilan"]'); await page.click('#vue .sous-nav [data-a="ens-ouvrir"]');
    const pass = page.locator('#feuille .carte-ens[data-ens="cote-mej"] [data-a="exos-domaine"]');
    verifie(await pass.count() === 1, nom + ' passerelle vers les exercices présente');
    if (await pass.count()) {
      await pass.click(); await page.waitForTimeout(80);
      r.filtre = await page.$eval('#vue [data-a="filtre"][aria-pressed="true"]', b => b.textContent).catch(() => '');
      verifie(r.filtre === 'Départ' && await page.locator('#feuille').count() === 0, nom + ' exercices filtrés : ' + r.filtre);
    }
    /* Lien vers les erreurs des statistiques */
    await page.click('#barre [data-v="bilan"]'); await page.click('#vue .sous-nav [data-a="ens-ouvrir"]');
    const ver = page.locator('#feuille [data-a="ens-aller"][data-s="st-erreurs"]').first();
    if (await ver.count()) { await ver.click(); await page.waitForTimeout(80); verifie(await page.locator('#vue #st-erreurs').count() === 1 && await page.locator('#feuille').count() === 0, nom + ' lien vers les erreurs'); }
    else verifie(false, nom + ' lien vers les erreurs absent');
    /* Recherche */
    await page.click('.tete [data-a="recherche"]'); await page.fill('#recherche-q', 'enseignements');
    verifie(await page.locator('#recherche-l [data-a="fonction"][data-v="ens-ouvrir"], #recherche-l [data-a="ens-ouvrir"]').count() >= 1 || /Enseignements/.test(await page.textContent('#recherche-l')), nom + ' recherche : enseignements');
    await ctx.close();
  }
  await browser.close();
  console.log(JSON.stringify({ res, ko, errs }, null, 1));
  process.exit(ko.length || errs.length ? 1 : 0);
})().catch(e => { console.log('ECHEC', e.message); process.exit(1); });
