/* UX06 : Analyses en douze rubriques — pastilles dans l'ordre, chaque rubrique s'ouvre (titre, filtre commun sauf
   Comprendre), carnet vide sans chiffre fictif, navigation en profondeur depuis Mon jeu et la recherche,
   rubrique conservée quand on revient, enseignements liés, aucun débordement sur téléphone. */
const { chromium } = require('playwright');
const fs = require('fs');
const CLE = 'coachgolf.v1';
const PARS = [4, 4, 3, 5, 4, 4, 3, 5, 4];
const norm = s => s.replace(/[\s  ]+/g, ' ').trim();
const NOMS = ['Performance générale', 'Mises en jeu', 'Attaque de green', 'Petit jeu', 'Putting', 'Erreurs récurrentes', 'Coups perdus estimés', 'Analyse des parcours', 'Analyse des trous', 'Comparaison des clubs', 'Qualité des données', 'Comprendre mon jeu'];
const IDS = ['perf', 'mej', 'attaque', 'petit', 'putting', 'erreurs', 'sg', 'parcours', 'trous', 'clubs', 'qualite', 'comprendre'];
(async () => {
  const D = 'shots32'; fs.mkdirSync(D, { recursive: true });
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const res = {}, errs = [], ko = [];
  const verifie = (c, m) => { if (!c) ko.push(m); };
  const T = p => [1, 1, 2, 0, p, p, 0, 0, 0, 0, 0];
  const partie = (i, mauvais) => ({ id: 'p_rb' + (4000 + i), d: new Date(Date.now() - (130 - i * 10) * 864e5).toISOString(), o: 0, pc: 'p1', renseigne: PARS.map(() => 7),
    trous: PARS.map((p, k) => { const t = T(p); if (k === 6) t[4] += 2; if (k === 1) { t[0] = 0; t[1] = 0; t[6] = 3; t[4] += 1; } if (mauvais && k === 2) { t[2] = 3; t[4] += 1; } return t; }) });
  for (const [w, h, sombre] of [[390, 844, false], [360, 760, true]]) {
    const nom = w + (sombre ? 's' : ''), r = res[nom] = {};
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, colorScheme: sombre ? 'dark' : 'light', hasTouch: true, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    page.on('pageerror', e => errs.push(nom + ' ' + e.message));
    await page.goto('file://' + __dirname + '/dist/index.html');
    await page.click('[data-a="ac-sans-index"]'); await page.click('.carnet-form button[type="submit"]');
    await page.waitForSelector('.tete');
    const largeur = () => page.evaluate(() => document.documentElement.scrollWidth);
    const rub = async id => { await page.click(`#vue .rubriques [data-v="${id}"]`); await page.waitForTimeout(40); };

    /* Carnet vide : chaque rubrique s'ouvre, sans chiffre inventé */
    await page.click('#barre [data-v="bilan"]');
    r.pastilles = await page.$$eval('#vue .rubriques button', l => l.map(b => b.getAttribute('data-v')));
    verifie(JSON.stringify(r.pastilles) === JSON.stringify(IDS), nom + ' douze rubriques dans l\'ordre : ' + r.pastilles.join(','));
    verifie(await page.locator('#vue .rubriques [aria-pressed="true"][data-v="perf"]').count() === 1, nom + ' Performance générale par défaut');
    for (const [k, id] of IDS.entries()) {
      await rub(id);
      const titre = norm(await page.textContent('#vue .rb-tete h2'));
      verifie(titre === NOMS[k], nom + ' vide : rubrique ' + id + ' → ' + titre);
      if (!['comprendre', 'qualite', 'parcours'].includes(id)) verifie(/Pas encore de partie/.test(norm(await page.textContent('#vue .rb-tete'))) && !(await page.locator('#vue .kpi-grille').count()), nom + ' vide : ' + id + ' sans chiffre fictif');
    }

    /* Carnet rempli */
    const e = await page.evaluate(k => JSON.parse(localStorage.getItem(k)), CLE);
    e.parcours = [{ id: 'p1', nom: 'Golf des Essais', pars: PARS }]; e.parties = Array.from({ length: 12 }, (_, i) => partie(i, i >= 6)); e.maj = Date.now();
    await page.evaluate(([k, v]) => localStorage.setItem(k, JSON.stringify(v)), [CLE, e]);
    await page.reload(); await page.waitForSelector('.tete');
    await page.click('#barre [data-v="bilan"]');
    r.rempli = {};
    for (const [k, id] of IDS.entries()) {
      await rub(id);
      const titre = norm(await page.textContent('#vue .rb-tete h2')), filtre = await page.locator('#vue .filtres-stats').count();
      r.rempli[id] = titre + (filtre ? ' + filtre' : '');
      verifie(titre === NOMS[k] && (id === 'comprendre' ? filtre === 0 : filtre === 1), nom + ' rubrique ' + id + ' : ' + r.rempli[id]);
      verifie(await largeur() <= w, nom + ' ' + id + ' sans débordement (' + await largeur() + ')');
      if (['perf', 'mej', 'putting', 'erreurs'].includes(id)) await page.screenshot({ path: `${D}/${nom}-${id}.png` });
    }
    /* Contenus attendus */
    await rub('perf'); verifie(await page.locator('#vue #st-tableau .kpi').count() === 6 && await page.locator('#vue #reperes').count() === 1, nom + ' Performance : chiffres et repères');
    await rub('mej'); verifie(await page.locator('#vue .repartition').count() >= 1 && await page.locator('#vue #rb-rep-mej, #vue #rb-rep-cotes').count() === 2, nom + ' Mises en jeu : répartition et deux réponses');
    verifie(await page.locator('#vue [data-a="exos-domaine"][data-v="drive"]').count() >= 1, nom + ' Mises en jeu : exercices liés');
    await rub('putting'); verifie(await page.locator('#vue #st-putting').count() === 1 && await page.locator('#vue .rb-ens .carte-ens').count() >= 1, nom + ' Putting : analyse et enseignement lié (trois-putts en hausse)');
    await rub('erreurs'); verifie(await page.locator('#vue #st-erreurs').count() === 1 && await page.locator('#vue #defauts').count() === 1, nom + ' Erreurs : erreurs et défauts');
    await rub('comprendre'); verifie(await page.locator('#vue .rb-tete [data-a="an-ouvrir"]').count() === 12, nom + ' Comprendre : douze questions');
    await page.click('#vue .rb-tete [data-a="an-ouvrir"][data-v="score"]'); await page.waitForSelector('#feuille.analyste');
    verifie(await page.locator('#feuille [aria-expanded="true"][data-v="score"]').count() === 1, nom + ' Comprendre : la question s\'ouvre');
    await page.keyboard.press('Escape');

    /* Rubrique conservée quand on revient dans Analyses */
    await rub('clubs'); await page.click('#barre [data-v="sac"]'); await page.click('#barre [data-v="bilan"]');
    verifie(await page.locator('#vue .rubriques [aria-pressed="true"][data-v="clubs"]').count() === 1, nom + ' rubrique conservée');
    /* Navigation en profondeur depuis Mon jeu : Mises en jeu */
    await page.click('#barre [data-v="accueil"]');
    await page.click('#mj-kpi .kpi-lien:has-text("Départs jouables")'); await page.waitForTimeout(80);
    verifie(await page.locator('#vue .rubriques [aria-pressed="true"][data-v="mej"]').count() === 1, nom + ' Mon jeu › Mises en jeu ouvre la rubrique');
    /* Depuis la recherche : Erreurs évitables */
    await page.click('.tete [data-a="recherche"]'); await page.fill('#recherche-q', 'évitables');
    await page.click('#recherche-l li:not([hidden]) [data-a="fonction"][data-s="evitables"]'); await page.waitForTimeout(80);
    verifie(await page.locator('#vue .rubriques [aria-pressed="true"][data-v="erreurs"]').count() === 1, nom + ' recherche › Erreurs évitables ouvre la rubrique Erreurs');
    await ctx.close();
  }
  await browser.close();
  console.log(JSON.stringify({ res, ko, errs }, null, 1));
  process.exit(ko.length || errs.length ? 1 : 0);
})().catch(e => { console.log('ECHEC', e.message); process.exit(1); });
