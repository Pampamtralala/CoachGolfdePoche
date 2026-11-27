/* UX13 : coaching repositionné — origine de chaque recommandation (données / questionnaire), passerelle constat →
   exercices filtrés avec bandeau, bibliothèque et programme libres d'accès, rien d'imposé à un carnet sans programme. */
const { chromium } = require('playwright');
const { allerRubrique } = require('./nav-essai');
const CLE = 'coachgolf.v1';
const PARS = [4, 4, 3, 5, 4, 4, 3, 5, 4];
const norm = s => s.replace(/[\s  ]+/g, ' ').trim();
(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const res = {}, errs = [], ko = [];
  const verifie = (c, m) => { if (!c) ko.push(m); };
  const partie = i => ({ id: 'p_co' + (900 + i), d: new Date(Date.now() - (100 - i * 8) * 864e5).toISOString(), o: 0, pc: 'p1', renseigne: PARS.map(() => 7),
    trous: PARS.map((p, k) => k === 1 ? [0, 0, 2, 0, p + 1, p, 3, 0, 0, 0, 0] : [1, 1, 2, 0, p, p, 0, 0, 0, 0, 0]) });
  for (const [w, h] of [[390, 844], [360, 760]]) {
    const nom = String(w), r = res[nom] = {};
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: true, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    page.on('pageerror', e => errs.push(nom + ' ' + e.message));
    await page.goto('file://' + __dirname + '/dist/index.html');
    await page.click('[data-a="ac-sans-index"]'); await page.click('.carnet-form button[type="submit"]');
    await page.waitForSelector('.tete');
    /* Carnet sans programme ni partie : rien d'imposé, bibliothèque ouverte */
    await page.click('.tete .ident'); await page.click('#profil-coaching [data-v="practice"]');
    verifie(await page.locator('.programme-option').count() === 1 && await page.locator('.prov-programme').count() === 0, nom + ' sans questionnaire : programme proposé en option, pas présenté comme personnalisé');
    verifie(/bibliothèque reste ouverte/.test(norm(await page.textContent('#reco-donnees'))), nom + ' sans partie : pas de recommandation, bibliothèque ouverte');
    await page.click('#vue .sous-nav [data-v="exercices"]');
    verifie(await page.locator('#vue .ligne, #vue .liste-exos li').count() > 5 && await page.locator('.filtre-donnees').count() === 0, nom + ' bibliothèque accessible sans recommandation');
    /* Douze parties avec ratés à droite : recommandation observée */
    const e = await page.evaluate(k => JSON.parse(localStorage.getItem(k)), CLE);
    e.parcours = [{ id: 'p1', nom: 'Golf des Essais', pars: PARS }]; e.parties = Array.from({ length: 12 }, (_, i) => partie(i)); e.maj = Date.now();
    await page.evaluate(([k, v]) => localStorage.setItem(k, JSON.stringify(v)), [CLE, e]);
    await page.reload(); await page.waitForSelector('.tete');
    await page.click('.tete .ident'); await page.click('#profil-coaching [data-v="practice"]');
    r.reco = norm(await page.textContent('#reco-donnees'));
    verifie(/Recommandations observées/.test(r.reco) && /Exercices : mise en jeu/.test(r.reco), nom + ' recommandation d\'après les données : ' + r.reco);
    await page.click('#reco-donnees [data-a="exos-domaine"][data-v="drive"]'); await page.waitForTimeout(80);
    r.bandeau = norm(await page.textContent('.filtre-donnees').catch(() => ''));
    verifie(/D.après tes données/.test(r.bandeau) && await page.locator('#vue [data-a="filtre"][data-v="drive"][aria-pressed="true"]').count() === 1, nom + ' exercices filtrés avec bandeau : ' + r.bandeau);
    await page.click('.filtre-donnees [data-a="filtre"][data-v="tous"]');
    verifie(await page.locator('.filtre-donnees').count() === 0 && await page.locator('#vue [data-a="filtre"][data-v="tous"][aria-pressed="true"]').count() === 1, nom + ' toute la bibliothèque, bandeau retiré');
    /* Priorités du profil : origine dite */
    await page.click('#barre [data-v="bilan"]'); await allerRubrique(page, 'perf');
    verifie(/D.après ton profil/.test(norm(await page.textContent('#priorites'))), nom + ' priorités : origine déclarée');
    verifie(await page.evaluate(() => document.documentElement.scrollWidth) <= w, nom + ' sans débordement');
    await ctx.close();
  }
  await browser.close();
  console.log(JSON.stringify({ res, ko, errs }, null, 1));
  process.exit(ko.length || errs.length ? 1 : 0);
})().catch(e => { console.log('ECHEC', e.message); process.exit(1); });
