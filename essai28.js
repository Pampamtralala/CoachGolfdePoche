/* UX03 : navigation à cinq entrées (Mon jeu, Analyses, Jouer, Mon sac, Journal).
   Vérifie : ordre et action principale, anciens noms de pages et alias, profil dans l'en-tête, sous-navigation
   d'Analyses (coaching), Journal des parties, chaque entrée de la recherche aboutit, touche retour,
   aucun débordement horizontal sur téléphone. */
const { chromium } = require('playwright');
const fs = require('fs');
const CLE = 'coachgolf.v1';
const PARS = [4, 4, 3, 5, 4, 4, 3, 5, 4];
const norm = s => s.replace(/[\s  ]+/g, ' ').trim();
(async () => {
  const D = 'shots28'; fs.mkdirSync(D, { recursive: true });
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const res = {}, errs = [], ko = [];
  const verifie = (c, m) => { if (!c) ko.push(m); };
  const partie = (i, joursAvant) => ({ id: 'p_nav' + (9000 + i), d: new Date(Date.now() - joursAvant * 864e5).toISOString(), o: 0, pc: 'p1', renseigne: PARS.map(() => 7),
    trous: PARS.map(p => [1, 1, 2, 0, p + (i % 3), p, 0, 0, 0, 0, 0]) });
  for (const [w, h, sombre] of [[390, 844, false], [360, 760, true], [412, 915, false], [1280, 800, false]]) {
    const nom = w + (sombre ? 's' : ''), r = res[nom] = {};
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, colorScheme: sombre ? 'dark' : 'light', hasTouch: w < 900, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    page.on('pageerror', e => errs.push(nom + ' ' + e.message));
    await page.goto('file://' + __dirname + '/dist/index.html');
    await page.click('[data-a="ac-sans-index"]'); await page.click('.carnet-form button[type="submit"]');
    await page.waitForSelector('.tete');
    const largeur = () => page.evaluate(() => document.documentElement.scrollWidth);
    const courant = () => page.$$eval('#barre [aria-current="page"]', l => l.map(b => b.textContent.trim()).join('|'));

    /* Journal vide : état utile, pas de tableau fictif */
    await page.click('#barre [data-a="onglet"][data-v="journal"]');
    r.journalVide = norm(await page.textContent('#vue'));
    verifie(/Aucune partie pour l.instant/.test(r.journalVide) && !(await page.locator('.carte-score.parties').count()), nom + ' journal vide : ' + r.journalVide.slice(0, 80));

    /* Six parties */
    const e = await page.evaluate(k => JSON.parse(localStorage.getItem(k)), CLE);
    e.parcours = [{ id: 'p1', nom: 'Golf des Essais', pars: PARS }];
    e.parties = Array.from({ length: 10 }, (_, i) => partie(i, 100 - i * 9));
    e.maj = Date.now();
    await page.evaluate(([k, v]) => localStorage.setItem(k, JSON.stringify(v)), [CLE, e]);
    await page.reload(); await page.waitForSelector('.tete');

    /* Barre : ordre, Jouer au centre en action principale */
    r.barre = await page.$$eval('#barre .barre-item', l => l.map(b => b.textContent.trim() + (b.classList.contains('principal') ? '*' : '')).join(' | '));
    verifie(r.barre === 'Accueil | Performance | Jouer* | Sac | Activité', nom + ' barre : ' + r.barre);
    verifie(await courant() === 'Accueil', nom + ' ouverture sur Accueil');

    /* Chaque entrée */
    const attendu = { accueil: ['Accueil', 'h1'], bilan: ['Performance', '.familles'], parcours: ['Jouer', '#c-partie'], sac: ['Sac', '#c-wedges'], journal: ['Activité', '.carte-score.parties'] };
    for (const [v, [lib, sel]] of Object.entries(attendu)) {
      await page.click(`#barre [data-a="onglet"][data-v="${v}"]`);
      const c = await courant(), ok = await page.locator('#vue ' + sel).count();
      verifie(c === lib && ok > 0, nom + ' entrée ' + v + ' → ' + c + ' (' + sel + ' : ' + ok + ')');
      verifie(await largeur() <= w, nom + ' ' + v + ' sans débordement (' + await largeur() + ')');
      if (w <= 412) await page.screenshot({ path: `${D}/${nom}-${v}.png` });
    }

    /* Journal : toutes les parties, carte de score */
    await page.click('#barre [data-a="onglet"][data-v="journal"]');
    r.lignes = await page.locator('.carte-score.parties tbody tr').count();
    verifie(r.lignes === 10, nom + ' journal : ' + r.lignes + ' parties sur 10');
    await page.click('.carte-score.parties [data-a="pt-carte"]');
    verifie(await page.locator('#feuille').count() === 1, nom + ' journal : la carte de score s\'ouvre');
    await page.keyboard.press('Escape');
    verifie(await page.locator('#vue [data-a="j-ouvrir"]').count() >= 1 && await page.locator('#vue [data-a="md-ouvrir"]').count() === 1, nom + ' journal : bilans, import et Mes données accessibles');
    /* Jouer renvoie vers le journal */
    await page.click('#barre [data-a="onglet"][data-v="parcours"]');
    verifie(await page.locator('#vue .journal-lien [data-v="journal"]').count() === 1, nom + ' Jouer : lien vers mes parties');

    /* Performance : cinq familles (V4-07) ; le coaching est dans le profil */
    await page.click('#barre [data-a="onglet"][data-v="bilan"]');
    r.sousNav = await page.$$eval('#vue .familles button', l => l.map(b => b.textContent.trim()).join(' | '));
    verifie(r.sousNav === 'Résultats | Secteurs | Erreurs | Parcours | Comprendre' && await courant() === 'Performance', nom + ' Performance : ' + r.sousNav);
    for (const [v, lib] of [['practice', 'Programme'], ['exercices', 'Exercices et défis']]) {
      await page.click('.tete .ident'); await page.click(`#profil-coaching [data-v="${v}"]`);
      const act = await page.$eval('#vue .sous-nav [aria-current="page"]', b => b.textContent.trim()).catch(() => '');
      verifie(act === lib && await courant() === '' && await page.locator('.tete .ident[aria-current="page"]').count() === 1, nom + ' Profil › Coaching › ' + v + ' : ' + act + ' / barre « ' + await courant() + ' »');
    }
    await page.click('#barre [data-a="onglet"][data-v="bilan"]');
    await page.click('#vue [data-a="famille"][data-v="comprendre"]'); await page.click('#vue [data-a="an-ouvrir"][data-v="score"]');
    verifie(await page.locator('#feuille.analyste').count() === 1, nom + ' Analyses › Comprendre mon jeu');
    await page.keyboard.press('Escape');

    /* Profil : depuis l'en-tête, aucune entrée marquée */
    await page.click('.tete .ident');
    verifie(await page.locator('#vue #donnees').count() === 1 && await courant() === '', nom + ' profil depuis l\'en-tête, barre neutre : ' + await courant());

    /* Anciens noms et alias : chacun mène à une page et marque la bonne entrée */
    const liens = { accueil: 'Accueil', jour: 'Accueil', monjeu: 'Accueil', bilan: 'Performance', statistiques: 'Performance', analyses: 'Performance', performance: 'Performance',
      practice: '', plan: '', entrainement: '', progresser: '', exercices: '', parcours: 'Jouer', carnet: 'Jouer', jouer: 'Jouer', sac: 'Sac', distances: 'Sac',
      parties: 'Activité', journal: 'Activité', activite: 'Activité', profil: '' };
    r.liens = {};
    for (const [hsh, lib] of Object.entries(liens)) {
      await page.evaluate(x => { location.hash = 'accueil'; }, hsh); await page.waitForTimeout(30);
      await page.evaluate(x => { location.hash = x; }, hsh); await page.waitForTimeout(60);
      const c = await courant(); r.liens[hsh] = c;
      verifie(c === lib && (hsh === 'accueil' || hsh === 'jour' || hsh === 'monjeu' || await page.evaluate(() => location.hash !== '#accueil')), nom + ' #' + hsh + ' → ' + c + ' (attendu ' + lib + ')');
    }

    /* V4-05 : adresses publiques et routes retirées redirigées avec un message */
    await page.click('#barre [data-a="onglet"][data-v="bilan"]'); r.hashPerf = await page.evaluate(() => location.hash);
    await page.click('#barre [data-a="onglet"][data-v="journal"]'); r.hashAct = await page.evaluate(() => location.hash);
    verifie(r.hashPerf === '#performance' && r.hashAct === '#activite', nom + ' adresses publiques : ' + r.hashPerf + ' ' + r.hashAct);
    for (const [hsh, sel, mot] of [['series', '#c-historique, #c-synthese', 'séries'], ['sac3d', '#c-synthese', '3D']]) {
      await page.evaluate(() => { location.hash = 'accueil'; }); await page.waitForTimeout(30);
      await page.evaluate(x => { location.hash = x; }, hsh); await page.waitForTimeout(80);
      const msg = norm(await page.textContent('#message').catch(() => ''));
      verifie(await courant() === 'Sac' && new RegExp(mot).test(msg), nom + ' route retirée #' + hsh + ' → ' + await courant() + ' · « ' + msg + ' »');
    }

    /* Touche retour : revient à la page précédente */
    await page.click('#barre [data-a="onglet"][data-v="sac"]');
    await page.click('#barre [data-a="onglet"][data-v="journal"]');
    await page.goBack(); await page.waitForTimeout(80);
    r.retour = await courant();
    verifie(r.retour === 'Sac', nom + ' retour : ' + r.retour);

    /* Recherche : chaque fonction aboutit sans erreur (aucune fonction orpheline) */
    await page.click('.tete [data-a="recherche"]');
    const nb = await page.locator('#recherche-l [data-a="fonction"]').count();
    r.groupes = await page.$$eval('#recherche-l .recherche-groupe h3', l => l.map(x => x.textContent.trim()).join(' | '));
    verifie(r.groupes === 'Accueil | Performance | Profil · Coaching | Jouer | Sac | Activité | Profil', nom + ' groupes de la recherche : ' + r.groupes);
    await page.keyboard.press('Escape');
    let echecs = [];
    for (let i = 0; i < nb; i++) {
      await page.click('.tete [data-a="recherche"]');
      const b = page.locator('#recherche-l [data-a="fonction"]').nth(i);
      const lib = norm(await b.textContent()), av = errs.length;
      await b.click(); await page.waitForTimeout(60);
      const ouvert = await page.evaluate(() => !!(document.getElementById('feuille') || document.querySelector('.dialogue') || document.querySelector('#calque-partie .partie') || document.querySelector('#vue h1') || document.querySelector('#app h1, #app h2')));
      if (errs.length > av || !ouvert) echecs.push(lib);
      for (let k = 0; k < 3; k++) { if (await page.locator('#feuille, .dialogue, #calque-partie .partie').count()) await page.keyboard.press('Escape'); }
      const pt = page.locator('#calque-partie [data-a="pt-fermer"]'); if (await pt.count()) await pt.click().catch(() => {});
      const ab = page.locator('#vue [data-a="pt-abandonner"]');
      if (await ab.count()) { await ab.click(); await page.click('.dialogue [data-a="pt-ok-abandon"]').catch(() => {}); }
      const dp = page.locator('#vue [data-a="dp-annuler"]'); if (await dp.count()) await dp.click().catch(() => {});
    }
    r.recherche = nb + ' fonctions, ' + echecs.length + ' en échec';
    verifie(nb >= 25 && !echecs.length, nom + ' recherche : ' + r.recherche + (echecs.length ? ' : ' + echecs.join(' | ') : ''));
    await ctx.close();
  }
  await browser.close();
  console.log(JSON.stringify({ res, ko, errs }, null, 1));
  process.exit(ko.length || errs.length ? 1 : 0);
})().catch(e => { console.log('ECHEC', e.message); process.exit(1); });
