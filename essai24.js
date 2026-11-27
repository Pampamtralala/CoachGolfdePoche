/* P02 : premier lancement centré sur le carnet — sans questionnaire, index facultatif jamais inventé,
   partie possible tout de suite, programme facultatif, anciens profils intacts. */
const { chromium } = require('playwright');
const fs = require('fs');
const CLE = 'coachgolf.v1';
const norm = s => s.replace(/[\s  ]+/g, ' ').trim();
(async () => {
  const D = 'shots24'; fs.mkdirSync(D, { recursive: true });
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const res = {}, errs = [], ko = [];
  const verifie = (c, m) => { if (!c) ko.push(m); };
  const lire = page => page.evaluate(k => JSON.parse(localStorage.getItem(k)), CLE);
  for (const [w, h, sombre] of [[390, 844, false], [360, 760, true]]) {
    const nom = w + (sombre ? 's' : ''), r = res[nom] = {};
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, colorScheme: sombre ? 'dark' : 'light', hasTouch: true, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    page.on('pageerror', e => errs.push(nom + ' ' + e.message));
    await page.goto('file://' + __dirname + '/dist/index.html');
    /* Premier écran : un carnet, pas un questionnaire */
    r.titre = norm(await page.textContent('.accueil h1'));
    verifie(/carnet de golf/i.test(r.titre) && await page.locator('#ac-prenom').count() && await page.locator('#ac-index').count(), nom + ' premier écran carnet : ' + r.titre);
    await page.screenshot({ path: `${D}/${nom}-01-accueil.png`, fullPage: true });
    r.largeur = await page.evaluate(() => document.documentElement.scrollWidth);
    verifie(r.largeur === w, nom + ' premier écran sans débordement : ' + r.largeur);
    /* Index invalide : erreur, rien de créé */
    await page.fill('#ac-index', '72');
    await page.click('.carnet-form button[type="submit"]');
    r.erreur = norm(await page.textContent('#ac-erreur'));
    verifie(/de 0 à 54/.test(r.erreur) && !(await lire(page)), nom + ' index invalide refusé : ' + r.erreur);
    /* « Je ne connais pas mon index » : aucun index inventé */
    await page.fill('#ac-prenom', 'Benjamin');
    await page.click('[data-a="ac-lat"][data-v="G"]');
    await page.click('[data-a="ac-sans-index"]');
    verifie(await page.locator('#ac-index[disabled]').count() === 1, nom + ' champ index désactivé');
    await page.click('.carnet-form button[type="submit"]');
    await page.waitForSelector('.tete');
    const e = await lire(page);
    r.profil = e && e.profil;
    verifie(e && e.profil.index === null && e.profil.sansIndex === true && e.profil.questionnaire === false && e.profil.lateralite === 'G' && e.profil.prenom === 'Benjamin', nom + ' profil sans faux index : ' + JSON.stringify(e && e.profil).slice(0, 200));
    verifie(!(e.indexHist || []).length, nom + ' aucun historique d\'index inventé');
    /* Accueil : le carnet, une partie tout de suite */
    r.accueil = norm(await page.textContent('#vue, main'));
    r.ident = norm(await page.textContent('.tete .ident').catch(() => ''));
    verifie(await page.locator('[data-a="partie-rapide"]').count() && /Mon jeu · Benjamin/.test(r.accueil), nom + ' accueil carnet avec « Nouvelle partie »');
    verifie(!/index/i.test(r.ident) && !/54/.test(r.ident), nom + ' en-tête sans faux index : ' + r.ident);
    await page.screenshot({ path: `${D}/${nom}-02-carnet.png` });
    await page.click('[data-a="partie-rapide"]');
    await page.waitForSelector('#dp-nom, [data-a="pt-nouvelle"]');
    await page.fill('#dp-nom', 'Golf de Test').catch(() => {});
    await page.click('[data-a="pt-nouvelle"]');
    await page.waitForSelector('#calque-partie .pave');
    r.pave = norm(await page.textContent('#calque-partie .pv-score'));
    verifie(!/coup reçu|coups reçus|points/.test(r.pave), nom + ' pas de coups reçus ni de Stableford sans index : ' + r.pave);
    await page.click('#calque-partie [data-a="pt-fermer"]').catch(() => {});
    /* Coaching (rangé dans le profil, V4-05) : programme facultatif */
    await page.click('.tete .ident'); await page.click('#profil-coaching [data-v="practice"]');
    r.progresser = norm(await page.textContent('.programme-option').catch(() => ''));
    verifie(/Facultatif/.test(r.progresser) && await page.locator('.programme-option [data-a="modifier"]').count() === 1, nom + ' programme proposé en option : ' + r.progresser);
    /* Profil : index « non renseigné », modification sans questionnaire */
    await page.click('button.ident[data-v="profil"]');
    r.fiche = norm(await page.textContent('.fiche'));
    verifie(/Index ?non renseigné/.test(r.fiche) && !/Palier/.test(r.fiche), nom + ' profil : index non renseigné, pas de palier : ' + r.fiche);
    await page.click('[data-a="ac-profil"]');
    await page.fill('#d-index', '18,4');
    await page.click('#calque-dialogue [data-a="ac-profil-ok"]');
    const e2 = await lire(page);
    verifie(e2.profil.index === 18.4 && e2.profil.sansIndex === false && e2.indexHist.length === 1 && e2.indexHist[0].v === 18.4, nom + ' index ajouté plus tard, sans questionnaire : ' + JSON.stringify([e2.profil.index, e2.indexHist]));
    r.ident2 = norm(await page.textContent('.tete .ident'));
    verifie(/index 18,4/.test(r.ident2), nom + ' en-tête avec l\'index déclaré : ' + r.ident2);
    /* Le questionnaire reste accessible et le termine : programme personnalisé */
    await page.click('#donnees ~ * [data-a="modifier"], .fiche ~ .ligne-btn [data-a="modifier"]').catch(() => page.click('[data-a="modifier"]'));
    await page.waitForSelector('#q-prenom');
    r.questPrenom = await page.inputValue('#q-prenom');
    verifie(r.questPrenom === 'Benjamin', nom + ' questionnaire prérempli : ' + r.questPrenom);
    await page.click('[data-a="q-suite"]');
    await page.click('[data-k="objectif"][data-v="score"]'); await page.click('[data-a="q-suite"]');
    for (const l of ['practice', 'putting']) { const b = page.locator(`[data-a="lieu"][data-v="${l}"]`); if ((await b.getAttribute('aria-pressed')) !== 'true') await b.click(); }
    for (let i = 0; i < 8 && await page.locator('[data-a="q-suite"]').count(); i++) await page.click('[data-a="q-suite"]');
    await page.waitForSelector('.tete');
    const e3 = await lire(page);
    verifie(e3.profil.questionnaire === true && e3.profil.index === 18.4, nom + ' questionnaire fait, index conservé : ' + JSON.stringify([e3.profil.questionnaire, e3.profil.index]));
    await ctx.close();
  }
  /* Anciens profils : intacts, l'ancien « sans index » (54) lu comme inconnu */
  {
    const r = res.anciens = {};
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage(); page.on('pageerror', e => errs.push('anciens ' + e.message));
    await page.goto('file://' + __dirname + '/dist/index.html');
    await page.click('[data-a="commencer"]'); await page.fill('#q-prenom', 'Ancien'); await page.fill('#q-index', '18'); await page.click('[data-a="q-suite"]');
    await page.click('[data-k="objectif"][data-v="score"]'); await page.click('[data-a="q-suite"]');
    for (const l of ['practice', 'putting', 'parcours']) await page.click(`[data-a="lieu"][data-v="${l}"]`);
    for (let i = 0; i < 8 && await page.locator('[data-a="q-suite"]').count(); i++) await page.click('[data-a="q-suite"]');
    await page.waitForSelector('.tete');
    const e = await lire(page);
    verifie(e.profil.questionnaire === true && e.profil.index === 18, 'questionnaire classique : profil complet, index 18');
    /* Profil enregistré par une version précédente : pas de champ questionnaire, « sans index » à 54 */
    const ancien = JSON.parse(JSON.stringify(e)); delete ancien.profil.questionnaire; ancien.profil.sansIndex = true; ancien.profil.index = 54; ancien.maj = Date.now();
    await page.evaluate(([k, v]) => localStorage.setItem(k, JSON.stringify(v)), [CLE, ancien]);
    await page.reload(); await page.waitForSelector('.tete');
    const apres = await lire(page);
    r.ident = norm(await page.textContent('.tete .ident'));
    verifie(apres.profil.index === 54 && apres.profil.sansIndex === true && apres.profil.questionnaire === undefined, 'ancien profil sans index : enregistrement intact (aucun champ réécrit)');
    verifie(!/54/.test(r.ident), 'ancien profil sans index : « 54 » jamais affiché : ' + r.ident);
    await page.click('button.ident[data-v="profil"]');
    r.fiche = norm(await page.textContent('.fiche'));
    verifie(/Index ?non renseigné/.test(r.fiche) && /Palier/.test(r.fiche) && /Objectif/.test(r.fiche), 'ancien profil : index non renseigné, questionnaire considéré fait (programme intact) : ' + r.fiche.slice(0, 120));
    await ctx.close();
  }
  console.log(JSON.stringify({ res, ko, errs }, null, 1));
  await browser.close();
})().catch(e => { console.error('ECHEC', String(e.stack || e.message).split('\n').filter(l => !/retrying|waiting|scrolling|stable/.test(l)).slice(0, 10).join('\n')); process.exit(1); });
