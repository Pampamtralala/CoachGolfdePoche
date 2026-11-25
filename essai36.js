/* UX11 : après la partie — bilan express et bilan en chiffres : comparaison avec les habitudes (10 parties
   précédentes, ramenée à 18 trous) et synthèse, ce qui a changé dans les statistiques, meilleur et plus coûteux trou,
   accès direct aux rubriques d'Analyses ; carte de score toujours accessible ; sans historique, on le dit. */
const { chromium } = require('playwright');
const fs = require('fs');
const CLE = 'coachgolf.v1';
const PARS = [4, 4, 3, 5, 4, 4, 3, 5, 4];
const norm = s => s.replace(/[\s  ]+/g, ' ').trim();
(async () => {
  const D = 'shots36'; fs.mkdirSync(D, { recursive: true });
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const res = {}, errs = [], ko = [];
  const verifie = (c, m) => { if (!c) ko.push(m); };
  const T = (p, plus, putts) => [1, 1, putts || 2, 0, p + plus + ((putts || 2) - 2), p, 0, 0, 0, 0, 0];
  const ancienne = i => ({ id: 'p_ap' + (2000 + i), d: new Date(Date.now() - (60 - i * 5) * 864e5).toISOString(), o: 0, pc: 'p1', renseigne: PARS.map(() => 7), trous: PARS.map((p, k) => T(p, k < 3 ? 1 : 0, k === 4 ? 3 : 2)) });
  for (const [w, h, sombre, nb] of [[390, 844, false, 6], [360, 760, true, 1]]) {
    const nom = w + (sombre ? 's' : ''), r = res[nom] = {};
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, colorScheme: sombre ? 'dark' : 'light', hasTouch: true, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    page.on('pageerror', e => errs.push(nom + ' ' + e.message));
    await page.goto('file://' + __dirname + '/dist/index.html');
    await page.click('[data-a="ac-sans-index"]'); await page.click('.carnet-form button[type="submit"]');
    await page.waitForSelector('.tete');
    const e = await page.evaluate(k => JSON.parse(localStorage.getItem(k)), CLE);
    e.parcours = [{ id: 'p1', nom: 'Golf des Essais', pars: PARS }];
    e.parties = Array.from({ length: nb }, (_, i) => ancienne(i));
    /* Partie en cours, au dernier trou : meilleure que d'habitude (birdie au 4, pas de trois-putts) */
    e.partie = { d: new Date().toISOString(), n: 9, i: 8, pc: 'p1', o: 0, renseigne: PARS.map(() => 7), trous: PARS.map((p, k) => k === 3 ? [1, 1, 1, 0, 4, 5, 0, 0, 0, 0, 0] : k === 6 ? [1, 0, 2, 0, 5, 3, 0, 0, 0, 0, 0] : [1, 1, 2, 0, p, p, 0, 0, 0, 0, 0]) };
    e.maj = Date.now();
    await page.evaluate(([k, v]) => localStorage.setItem(k, JSON.stringify(v)), [CLE, e]);
    await page.reload(); await page.waitForSelector('.tete');
    if (!(await page.locator('#calque-partie .pave').count())) await page.click('[data-a="pt-reprendre"]');
    await page.waitForSelector('#calque-partie .pave'); await page.click('#pt-suiv');
    await page.waitForSelector('#calque-partie .partie.express, #calque-partie .partie.bilan');
    if (nb >= 3) {
      r.express = norm(await page.textContent('#calque-partie .apres-habitudes'));
      verifie(/Par rapport à tes habitudes/.test(r.express) && /Partie meilleure que d.habitude de 6,0 coups, surtout grâce au putting \(ramené à 18 trous\)/.test(r.express), nom + ' bilan express : ' + r.express);
      await page.click('[data-a="pt-express-chiffres"]'); await page.waitForSelector('#calque-partie .partie.bilan');
      r.chiffres = norm(await page.textContent('#calque-partie .partie.bilan'));
      verifie(/Score ?\+2 contre \+8 habituellement/.test(r.chiffres) && /Putts ?34 contre 38 habituellement/.test(r.chiffres), nom + ' comparaison chiffrée : ' + r.chiffres.slice(0, 400));
      verifie(/Tes 10 dernières parties : score moyen \+8 → \+7,1, putts 38 → 37,4 par 18 trous/.test(r.chiffres), nom + ' ce qui a changé : ' + (r.chiffres.match(/Tes 10 dernières[^.]*\./) || [''])[0]);
      verifie(/Meilleur trou : le 4 \(par 5, −1\) · plus coûteux : le 7 \(par 3, \+2\)/.test(r.chiffres), nom + ' trous marquants');
      verifie(await page.locator('#calque-partie [data-a="pt-bilan-carte"]').count() === 1, nom + ' carte de score toujours accessible');
      await page.screenshot({ path: `${D}/${nom}-bilan.png`, fullPage: true });
      verifie(await page.evaluate(() => document.documentElement.scrollWidth) <= w, nom + ' sans débordement');
      await page.click('#calque-partie [data-a="pt-voir-rubrique"][data-s="st-putting"]'); await page.waitForTimeout(150);
      verifie(await page.locator('#calque-partie .partie').count() === 0 && await page.locator('#vue .rubriques [aria-pressed="true"][data-v="putting"]').count() === 1, nom + ' accès direct à la rubrique Putting');
    } else {
      r.peu = norm(await page.textContent('#calque-partie'));
      verifie(/La comparaison avec tes habitudes apparaîtra à partir de 3 parties précédentes/.test(r.peu) && !(await page.locator('#calque-partie .apres-habitudes').count()), nom + ' sans historique, on le dit');
    }
    await ctx.close();
  }
  await browser.close();
  console.log(JSON.stringify({ res, ko, errs }, null, 1));
  process.exit(ko.length || errs.length ? 1 : 0);
})().catch(e => { console.log('ECHEC', e.message); process.exit(1); });
