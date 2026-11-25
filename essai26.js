/* P11 : journal et rapports — périodes, notes (associations, pas des causes), rapport daté et reproductible,
   import CSV / JSON avec aperçu et anti-doublons, aucun écrasement. */
const { chromium } = require('playwright');
const fs = require('fs');
const CLE = 'coachgolf.v1';
const PARS = [4, 4, 3, 5, 4, 4, 3, 5, 4];
const norm = s => s.replace(/[\s  ]+/g, ' ').trim();
(async () => {
  const D = 'shots26'; fs.mkdirSync(D, { recursive: true });
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const res = {}, errs = [], ko = [];
  const verifie = (c, m) => { if (!c) ko.push(m); };
  const aujourdhui = new Date(), jour = n => new Date(aujourdhui.getTime() - n * 86400000).toISOString().slice(0, 10);
  const T = (p, e) => [1, 1, 2, 0, p + (e || 0), p, 0, 0, 0, 0, 0];
  const partie = (i, joursAvant, ecart, note) => Object.assign({ id: 'p_essai' + (7000 + i), d: jour(joursAvant) + 'T10:00:00.000Z', o: 0, renseigne: PARS.map(() => 7), trous: PARS.map((p, k) => T(p, k === 0 ? ecart : 0)) }, note ? { note } : {});
  for (const [w, h, sombre] of [[390, 844, false], [360, 760, true]]) {
    const nom = w + (sombre ? 's' : ''), r = res[nom] = {};
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, colorScheme: sombre ? 'dark' : 'light', hasTouch: true, reducedMotion: 'reduce', acceptDownloads: true });
    const page = await ctx.newPage();
    page.on('pageerror', e => errs.push(nom + ' ' + e.message));
    const lire = () => page.evaluate(k => JSON.parse(localStorage.getItem(k)), CLE);
    await page.goto('file://' + __dirname + '/dist/index.html');
    await page.click('[data-a="commencer"]'); await page.fill('#q-prenom', 'Benjamin'); await page.fill('#q-index', '14'); await page.click('[data-a="q-suite"]');
    await page.click('[data-k="objectif"][data-v="score"]'); await page.click('[data-a="q-suite"]');
    for (const l of ['practice', 'putting', 'parcours']) await page.click(`[data-a="lieu"][data-v="${l}"]`);
    for (let i = 0; i < 8 && await page.locator('[data-a="q-suite"]').count(); i++) await page.click('[data-a="q-suite"]');
    await page.waitForSelector('.tete');
    const e = await lire();
    e.parties = [partie(0, 200, 5), partie(1, 80, 6, { forme: 1 }), partie(2, 70, 6, { forme: 1, meteo: 'vent' }), partie(3, 60, 6, { forme: 1 }),
      partie(4, 40, 2, { forme: 3 }), partie(5, 25, 2, { forme: 3 }), partie(6, 10, 2, { forme: 3, texte: 'swing fluide' }), partie(7, 3, 4)];
    e.maj = Date.now();
    await page.evaluate(([k, v]) => localStorage.setItem(k, JSON.stringify(v)), [CLE, e]);
    await page.reload(); await page.waitForSelector('.tete');
    await page.click('#barre [data-a="onglet"][data-v="bilan"]');
    await page.click('[data-a="j-ouvrir"]');
    await page.waitForSelector('#feuille.journal');
    /* Trois mois par défaut : 7 parties (celle d'il y a 200 jours exclue) */
    r.periode = norm(await page.textContent('#feuille .journal-periode'));
    verifie(/^Trois mois : du .* 7 parties, 63 trous\.$/.test(r.periode), nom + ' trois mois : ' + r.periode);
    r.kpis = await page.$$eval('#feuille .journal-kpis .kpi', l => l.map(x => [...x.children].map(c => c.textContent).join(' ').replace(/[\s  ]+/g, ' ').trim()));
    verifie(r.kpis.length === 6 && /^Score \+\d/.test(r.kpis[0]) && /63 trous avec score/.test(r.kpis[0]), nom + ' chiffres avec effectifs : ' + r.kpis.join(' / '));
    r.assoc = norm(await page.textContent('#feuille')).match(/Forme : « fatigué » [^.]*\./);
    verifie(r.assoc && /« fatigué » \+12,0 \(3 parties\), « en forme » \+4,0 \(3 parties\)/.test(r.assoc[0]) && /associations, pas des causes/.test(await page.textContent('#feuille')), nom + ' association forme / score : ' + (r.assoc && r.assoc[0]));
    /* Un mois : 3 parties */
    await page.click('#feuille [data-a="j-periode"][data-v="mois"]');
    r.mois = norm(await page.textContent('#feuille .journal-periode'));
    verifie(/^Un mois : .* 3 parties, 27 trous\.$/.test(r.mois), nom + ' un mois : ' + r.mois);
    /* Période libre */
    await page.click('#feuille [data-a="j-periode"][data-v="libre"]');
    await page.fill('#j-debut', jour(205)); await page.dispatchEvent('#j-debut', 'change');
    await page.fill('#j-fin', jour(190)); await page.dispatchEvent('#j-fin', 'change');
    r.libre = norm(await page.textContent('#feuille .journal-periode'));
    verifie(/^Période libre : .* 1 partie, 9 trous\.$/.test(r.libre), nom + ' période libre : ' + r.libre);
    await page.click('#feuille [data-a="j-periode"][data-v="trimestre"]');
    /* Noter une partie depuis le journal */
    await page.click('#feuille .journal-liste li:first-child [data-a="j-note"]');
    await page.selectOption('#n-putting', '3'); await page.selectOption('#n-meteo', 'pluie'); await page.fill('#n-texte', 'greens rapides');
    await page.click('#calque-dialogue [data-a="j-note-ok"]');
    const apresNote = await lire();
    r.note = apresNote.parties[7].note;
    verifie(r.note && r.note.putting === 3 && r.note.meteo === 'pluie' && r.note.texte === 'greens rapides', nom + ' note enregistrée : ' + JSON.stringify(r.note));
    r.ligneNote = norm(await page.textContent('#feuille .journal-liste li:first-child'));
    verifie(/putting bon · pluie · « greens rapides »/.test(r.ligneNote), nom + ' note affichée dans le journal : ' + r.ligneNote);
    await page.locator('#feuille').screenshot({ path: `${D}/${nom}-01-journal.png` });
    /* Rapport : daté, effectifs, graphique, empreinte stable */
    const [dl1] = await Promise.all([page.waitForEvent('download'), page.click('#feuille [data-a="j-rapport"]')]);
    const rap1 = fs.readFileSync(await dl1.path(), 'utf8');
    const [dl2] = await Promise.all([page.waitForEvent('download'), page.click('#feuille [data-a="j-rapport"]')]);
    const rap2 = fs.readFileSync(await dl2.path(), 'utf8');
    const emp = s => (s.match(/Empreinte des données : ([0-9a-z]+)/) || [])[1];
    verifie(/<h1>Rapport de golf<\/h1>/.test(rap1) && /Généré le \d{4}-\d{2}-\d{2}/.test(rap1) && /<svg/.test(rap1) && /63 trous/.test(rap1) && /Associations, pas des causes/.test(rap1), nom + ' rapport complet');
    verifie(emp(rap1) && emp(rap1) === emp(rap2), nom + ' rapport reproductible : empreinte ' + emp(rap1) + ' / ' + emp(rap2));
    r.nomRapport = dl1.suggestedFilename();
    verifie(/^rapport-golf-\d{4}-\d{2}-\d{2}-au-\d{4}-\d{2}-\d{2}\.html$/.test(r.nomRapport), nom + ' nom du rapport daté : ' + r.nomRapport);
    /* Import CSV : aperçu, doublon écarté, erreurs signalées, ajout sans écrasement */
    const csv = ['date;parcours;trou;par;score;putts;penalites;mise_en_jeu']
      .concat(PARS.map((p, k) => jour(15) + ';Test;' + (k + 1) + ';' + p + ';' + (p + 1) + ';2;0;' + (p === 3 ? '' : 'o')))
      .concat(PARS.map((p, k) => jour(3) + ';;' + (k + 1) + ';' + p + ';' + (p + (k === 0 ? 4 : 0)) + ';2;0;'))   /* même partie qu'existante : doublon */
      .concat(['n importe quoi;;;;;;;']).join('\n');
    await page.locator('#j-import').setInputFiles({ name: 'parties.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) });
    await page.waitForSelector('#calque-dialogue [data-a="j-import-ok"]');
    r.apercu = norm(await page.textContent('#calque-dialogue .dialogue'));
    verifie(/parties\.csv : 1 partie à ajouter, 1 doublon écarté \(déjà dans ton carnet\)/.test(r.apercu) && /ligne 20/.test(r.apercu) && /Rien n.est remplacé/.test(r.apercu), nom + ' aperçu de l\'import : ' + r.apercu);
    await page.click('#calque-dialogue [data-a="j-import-ok"]');
    const apresImport = await lire();
    verifie(apresImport.parties.length === 9 && apresImport.parties.filter(p => p.d.slice(0, 10) === jour(15)).length === 1 && (apresImport.parties.find(p => p.id === 'p_essai7007') || {}).note && apresImport.parties.find(p => p.id === 'p_essai7007').note.texte === 'greens rapides', nom + ' partie ajoutée à sa date, rien d\'écrasé (' + apresImport.parties.length + ' parties)');
    const ordre = apresImport.parties.map(p => p.d);
    verifie(ordre.every((d, i) => !i || ordre[i - 1] <= d), nom + ' carnet toujours chronologique');
    /* Réimport du même fichier : tout en doublon */
    await page.locator('#j-import').setInputFiles({ name: 'parties.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) });
    await page.waitForSelector('#calque-dialogue .dialogue');
    r.reimport = norm(await page.textContent('#calque-dialogue .dialogue'));
    verifie(/0 partie à ajouter, 2 doublons écartés/.test(r.reimport) && !(await page.locator('#calque-dialogue [data-a="j-import-ok"]').count()), nom + ' réimport : rien à ajouter : ' + r.reimport);
    await page.click('#calque-dialogue .dialogue [data-a="fermer-dialogue"]');
    /* Import JSON (export de l'appli) : tout en doublon, notes conservées à l'export */
    const exp = await lire();
    await page.locator('#j-import').setInputFiles({ name: 'export.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(exp)) });
    await page.waitForSelector('#calque-dialogue .dialogue');
    r.json = norm(await page.textContent('#calque-dialogue .dialogue'));
    verifie(/0 partie à ajouter, 9 doublons écartés/.test(r.json), nom + ' import JSON : doublons reconnus : ' + r.json);
    await page.click('#calque-dialogue .dialogue [data-a="fermer-dialogue"]');
    r.largeur = await page.evaluate(() => document.documentElement.scrollWidth);
    verifie(r.largeur === w, nom + ' pas de débordement : ' + r.largeur);
    await ctx.close();
  }
  console.log(JSON.stringify({ res, ko, errs }, null, 1));
  await browser.close();
})().catch(e => { console.error('ECHEC', String(e.stack || e.message).split('\n').filter(l => !/retrying|waiting|scrolling|stable/.test(l)).slice(0, 10).join('\n')); process.exit(1); });
