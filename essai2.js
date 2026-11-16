/* Essais de la sauvegarde : espace personnel simulé (d'après la description de la
   capacité « db »), données reçues malformées, sauvegarde collée malveillante. */
const { chromium } = require('playwright');
const CHEMIN = 'data/users/u_123/etat';
const CLE = 'coachgolf.v1';

const SIMULATEUR = (init) => {
  const D = window.__db = { docs: {}, sets: [], listeners: {}, refuse: !!init.refuse };
  if (init.doc) D.docs[init.chemin] = init.doc;
  if (init.local) { try { localStorage.setItem(init.cle, init.local); } catch (e) {} }
  const copie = o => JSON.parse(JSON.stringify(o));
  const snap = (path, pending) => {
    const d = D.docs[path];
    return { id: path.split('/').pop(), exists: d !== undefined, data: () => (d === undefined ? undefined : Object.freeze(copie(d))), metadata: { fromCache: false, hasPendingWrites: !!pending } };
  };
  const diffuser = (path, pending) => (D.listeners[path] || []).forEach(f => f(snap(path, pending)));
  const db = {
    doc(path) {
      if (path.split('/').length % 2) throw new TypeError('chemin impair');
      return {
        id: path.split('/').pop(), path,
        get: async () => snap(path),
        set: async (data) => {
          D.sets.push({ path, maj: data.maj, taille: JSON.stringify(data).length });
          await new Promise(r => setTimeout(r, 20));
          if (D.refuse) throw { code: 'invalid_argument', message: 'refus' };
          D.docs[path] = copie(data);
          diffuser(path, true);
          await new Promise(r => setTimeout(r, 20));
          diffuser(path, false);
        },
        onSnapshot(next) { (D.listeners[path] = D.listeners[path] || []).push(next); setTimeout(() => next(snap(path)), 40); return () => {}; }
      };
    }
  };
  D.depuisAutreAppareil = (path, data) => { D.docs[path] = data; diffuser(path, false); };
  window.claude = { use: async n => (n === 'db' ? db : n === 'user' ? { id: async () => 'u_123' } : null) };
};

const canon = o => JSON.stringify(o, (k, v) => (v && typeof v === 'object' && !Array.isArray(v) ? Object.keys(v).sort().reduce((a, c) => (a[c] = v[c], a), {}) : v));
const sansVolatil = e => { const c = JSON.parse(JSON.stringify(e)); delete c.maj; if (c.profil) delete c.profil.indexTexte; return canon(c); };

const { allerVue, menuAction } = require('./nav-essai');
/* Valeurs d'un graphique lues dans sa description (canvas aria-label). */
const valeursGraphe = (page, sel) => page.$eval(sel, c => c.getAttribute('aria-label').replace(/\.$/, '').split(' : ').slice(1).join(' : ').split(' ; ').map(x => x.replace(/^.*? (?=[+−]?\d+,\d|non mesuré)/, '')).join(' '));

(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const res = {}, errs = [];
  const ouvrir = async (init) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
    page.on('console', m => { if (m.type() === 'error' && !/fonts\.g|ERR_|Failed to load resource/.test(m.text())) errs.push('CONSOLE ' + m.text()); });
    if (init) await page.addInitScript(SIMULATEUR, Object.assign({ chemin: CHEMIN, cle: CLE }, init));
    await page.goto('file://' + __dirname + '/dist/index.html');
    return { ctx, page };
  };
  const lire = page => page.evaluate(k => JSON.parse(localStorage.getItem(k)), CLE);
  const nbSets = page => page.evaluate(() => window.__db.sets.length);
  const statut = async page => { await allerVue(page, 'profil'); return page.textContent('#statut-donnees'); };

  /* ---- A. Questionnaire complet avec espace personnel vide ---- */
  let { ctx, page } = await ouvrir({});
  await page.click('[data-a="commencer"]');
  await page.fill('#q-prenom', 'Test'); await page.fill('#q-index', '18');
  await page.click('[data-a="q-suite"]');
  await page.click('[data-k="objectif"][data-v="score"]'); await page.click('[data-a="q-suite"]');
  for (const l of ['practice', 'putting', 'zone', 'sable', 'parcours', 'maison']) await page.click(`[data-a="lieu"][data-v="${l}"]`);
  await page.click('[data-a="q-suite"]'); await page.click('[data-a="q-suite"]'); await page.click('[data-a="q-suite"]');
  await page.click('[data-a="defaut"][data-v="slice"]');
  for (let i = 0; i < 3 && await page.locator('[data-a="q-suite"]').count(); i++) await page.click('[data-a="q-suite"]');
  await page.waitForTimeout(2200);
  res.A_ecrituresApresQuestionnaire = await nbSets(page);
  res.A_statut = (await statut(page)).slice(0, 78);
  await allerVue(page, 'plan');
  await page.click('[data-a="fait"]'); await page.click('[data-a="fait"]'); await page.click('[data-a="fait"]');
  await page.waitForTimeout(2200);
  res.A_ecrituresApresTroisClics = await nbSets(page);
  const etatA = await lire(page);
  const docA = await page.evaluate(c => window.__db.docs[c], CHEMIN);
  res.A_docIdentiqueAuLocal = docA.json === JSON.stringify(etatA) && docA.maj === etatA.maj;
  res.A_tailleDocKo = +(JSON.stringify(docA).length / 1024).toFixed(1);
  await ctx.close();

  /* ---- B. Nouvel appareil : rien en local, données dans l'espace personnel ---- */
  ({ ctx, page } = await ouvrir({ doc: docA }));
  await page.waitForSelector('.tete .ident');
  res.B_identite = await page.textContent('.tete .ident');
  res.B_message = await page.textContent('#message');
  await page.waitForTimeout(1900);
  res.B_ecritures = await nbSets(page);
  res.B_etatConserve = sansVolatil(await lire(page)) === sansVolatil(etatA);
  await allerVue(page, 'plan');
  res.B_seanceFaite = await page.locator('.seance.faite').count();
  /* Mise à jour faite depuis un autre appareil pendant que la page est ouverte */
  const etatB2 = JSON.parse(JSON.stringify(etatA)); etatB2.maj = etatA.maj + 5000; etatB2.fait['c1-s1-2'] = new Date().toISOString();
  await page.evaluate(([c, d]) => window.__db.depuisAutreAppareil(c, d), [CHEMIN, { maj: etatB2.maj, json: JSON.stringify(etatB2) }]);
  await page.waitForTimeout(300);
  res.B_messageMaj = await page.textContent('#message');
  await allerVue(page, 'plan');
  res.B_seancesFaitesApresMaj = await page.locator('.seance.faite').count();
  await page.waitForTimeout(1900);
  res.B_ecrituresApresMaj = await nbSets(page);
  /* Rechargement : l'état local relu doit être identique */
  await page.reload(); await page.waitForSelector('.tete .ident');
  await allerVue(page, 'plan');
  await page.click('[data-a="fait"][data-id="c1-m1"]'); await page.click('[data-a="fait"][data-id="c1-m1"]');
  res.B_etatApresRechargement = sansVolatil(await lire(page)) === sansVolatil(etatB2);
  await ctx.close();

  /* ---- C. Local plus récent que l'espace personnel : une écriture au démarrage ---- */
  const etatC = JSON.parse(JSON.stringify(etatA)); etatC.maj = etatA.maj + 9000; etatC.fait['c1-m1'] = new Date().toISOString();
  ({ ctx, page } = await ouvrir({ doc: docA, local: JSON.stringify(etatC) }));
  await page.waitForTimeout(1200);
  res.C_ecritures = await nbSets(page);
  res.C_majEnvoyee = (await page.evaluate(c => window.__db.docs[c].maj, CHEMIN)) === etatC.maj;
  await ctx.close();

  /* ---- D. Visiteur en lecture seule : l'écriture est refusée ---- */
  ({ ctx, page } = await ouvrir({ refuse: true, local: JSON.stringify(etatC) }));
  await page.waitForTimeout(1200);
  res.D_ecrituresTentees = await nbSets(page);
  res.D_statut = (await statut(page)).slice(0, 62);
  await allerVue(page, 'plan'); await page.click('[data-a="fait"]');
  await page.waitForTimeout(2000);
  res.D_ecrituresApresRefus = await nbSets(page);
  res.D_localToujoursEcrit = !!(await lire(page)).fait['c1-s1-1'] !== !!etatC.fait['c1-s1-1'];
  await ctx.close();

  /* ---- E. Données malformées ou malveillantes ---- */
  const X = '<img src=x onerror="window.__xss=1">';
  const mal = JSON.parse(JSON.stringify(etatA));
  mal.maj = etatA.maj + 99999;
  mal.profil.prenom = X; mal.profil.lateralite = X; mal.profil.objectif = X; mal.profil.lieux = [X, 'practice', 'constructor'];
  mal.profil.envies = [X, '__proto__']; mal.profil.seances = X; mal.profil.duree = 61;
  mal.profil.indicateurs.putt_court = { val: X, src: X, date: X }; mal.profil.indicateurs.constructor = { val: 3 };
  mal.profil.symptomes = { slice: { reponses: { depart: 99, clubs: X } }, constructor: {}, [X]: {} };
  mal.profil.symptomePrincipal = X;
  mal.scores = { dr_fairway: [{ d: X, v: X }, { d: '2026-01-01T10:00:00Z', v: 6 }, { v: 9999 }], constructor: [{ v: 1 }], [X]: [{ v: 1 }] };
  mal.fait = { [X]: X, 'c1-s1-1': X, 'c1-s9-9': 'x' };
  mal.historique = [{ cycle: X, debut: X, fin: X, faites: X, total: X, priorites: [X, 'drive'] }, X, null];
  mal.plan.semaines[0].seances[0].blocs[0].role = '"><img src=x onerror="window.__xss=1">';
  mal.plan.semaines[0].seances[0].blocs[1].ex = 'constructor';
  mal.plan.semaines[1].theme = X; mal.plan.semaines[1].mission = X;
  mal.plan.correctifs = [{ sym: X, c1: X }];
  const verifierMal = async (page, cle) => {
    await page.waitForSelector('.tete .ident');
    for (const o of ['plan', 'bilan', 'exercices', 'profil']) await allerVue(page, o);
    await allerVue(page, 'plan');
    const fiche = await page.locator('[data-a="exo"][data-id="dr_fairway"]').count();
    if (fiche) { await page.click('[data-a="exo"][data-id="dr_fairway"]'); res[cle + '_ficheHisto'] = await page.locator('.histo li').count(); await page.keyboard.press('Escape'); }
    const e = await lire(page);
    res[cle + '_xss'] = await page.evaluate(() => (window.__xss ? 'INJECTION' : 'aucune') + ' · img:' + document.querySelectorAll('img').length);
    res[cle + '_profil'] = [e.profil.prenom === X ? 'prénom gardé comme texte' : e.profil.prenom, e.profil.lateralite, e.profil.objectif, e.profil.lieux.join('+'), e.profil.envies.length, e.profil.seances, e.profil.duree, JSON.stringify(e.profil.indicateurs.putt_court.val), Object.keys(e.profil.symptomes).join('+'), JSON.stringify(e.profil.symptomes.slice.reponses), e.profil.symptomePrincipal].join(' | ');
    res[cle + '_scores'] = JSON.stringify(Object.keys(e.scores)) + ' ' + JSON.stringify((e.scores.dr_fairway || []).map(x => x.v));
    res[cle + '_fait'] = Object.keys(e.fait).join('+');
    res[cle + '_historique'] = JSON.stringify(e.historique.map(h => [h.cycle, h.faites, h.total, h.priorites]));
    res[cle + '_planRefait'] = e.plan.semaines.every(s => s.seances.every(se => se.blocs.every(b => /^(test_initial|test_final|correctif|routine|priorite|entretien)$/.test(b.role) && b.ex !== 'constructor'))) && e.plan.semaines[1].theme !== X;
    res[cle + '_prenomAffiche'] = (await page.textContent('.tete .ident')).slice(0, 24);
  };
  /* E1 : reçues de l'espace personnel */
  ({ ctx, page } = await ouvrir({ doc: { maj: mal.maj, json: JSON.stringify(mal) } }));
  await verifierMal(page, 'E1');
  await ctx.close();
  /* E2 : collées comme sauvegarde, sans espace personnel */
  ({ ctx, page } = await ouvrir(null));
  await page.click('[data-a="importer"]');
  await page.fill('#d-code', Buffer.from(JSON.stringify(mal), 'utf8').toString('base64'));
  await page.click('[data-a="ok-importer"]');
  await verifierMal(page, 'E2');
  /* E3 : sauvegardes inutilisables */
  for (const [nom, obj] of [['vide', { v: 1, profil: null }], ['mauvaiseVersion', { v: 2, profil: {} }], ['tableau', [1, 2]], ['indexTexte', { v: 1, profil: { index: '12' } }]]) {
    await allerVue(page, 'profil'); await page.click('[data-a="importer"]');
    await page.fill('#d-code', Buffer.from(JSON.stringify(obj), 'utf8').toString('base64'));
    await page.click('[data-a="ok-importer"]');
    res['E3_' + nom] = (await page.locator('#d-err:not([hidden])').count()) ? 'refusée' : 'ACCEPTÉE';
    await page.click('.dialogue [data-a="fermer-dialogue"]').catch(() => {});
  }
  /* E4 : stockage local corrompu au démarrage */
  await page.evaluate(k => localStorage.setItem(k, '{"v":1,"profil":{"index":20},"plan":"x","scores":7,"fait":[1]}'), CLE);
  await page.reload(); await page.waitForSelector('.tete .ident');
  res.E4_demarrage = await page.textContent('.tete .ident');
  await allerVue(page, 'plan');
  res.E4_seances = await page.locator('.seance').count();
  res.E4_lieux = (await lire(page)) && await page.evaluate(() => document.querySelector('.seance .surtitre').textContent);
  await page.evaluate(k => localStorage.setItem(k, 'pas du json'), CLE);
  await page.reload();
  res.E4_illisible = await page.locator('.accueil').count();
  await ctx.close();

  console.log(JSON.stringify({ res, errs }, null, 1));
  await browser.close();
})().catch(e => { console.error('ECHEC', e.stack || e.message); process.exit(1); });
