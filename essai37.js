/* UX12 : premier lancement et états vides — quatre bénéfices sans exemple chiffré, questionnaire facultatif,
   « Premiers pas » qui se cochent à mesure que les données arrivent puis disparaissent, états vides utiles
   (Mon jeu, Analyses, Mon sac, Journal) sans graphique fictif. */
const { chromium } = require('playwright');
const CLE = 'coachgolf.v1';
const PARS = [4, 4, 3, 5, 4, 4, 3, 5, 4];
const norm = s => s.replace(/[\s  ]+/g, ' ').trim();
(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const res = {}, errs = [], ko = [];
  const verifie = (c, m) => { if (!c) ko.push(m); };
  const partie = i => ({ id: 'p_pp' + (1000 + i), d: new Date(Date.now() - (30 - i) * 864e5).toISOString(), o: 0, pc: 'p1', trous: PARS.map(p => [1, 1, 2, 0, p, p, 0, 0, 0, 0, 0]) });
  for (const [w, h] of [[390, 844], [360, 760]]) {
    const nom = String(w), r = res[nom] = {};
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: true, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    page.on('pageerror', e => errs.push(nom + ' ' + e.message));
    await page.goto('file://' + __dirname + '/dist/index.html');
    /* Premier lancement */
    r.benefices = await page.$$eval('.carnet-apercu li b', l => l.map(x => x.textContent));
    verifie(JSON.stringify(r.benefices) === JSON.stringify(['Enregistrer tes parties', 'Connaître tes clubs', 'Comprendre tes erreurs', 'Mesurer ta progression']), nom + ' quatre bénéfices : ' + r.benefices.join(' | '));
    verifie(await page.locator('.carnet-neuf svg, .carnet-neuf canvas').count() === 0, nom + ' aucun graphique d\'exemple');
    verifie(await page.locator('[data-a="commencer"]').count() === 1 && /option/i.test(norm(await page.textContent('.carnet-neuf .chapo'))), nom + ' questionnaire proposé, pas imposé');
    await page.click('[data-a="ac-sans-index"]'); await page.click('.carnet-form button[type="submit"]');
    await page.waitForSelector('.tete');
    /* Premiers pas, rien de fait */
    r.etapes = await page.$$eval('#premiers-pas li', l => l.map(x => (x.classList.contains('fait') ? '✓ ' : '· ') + x.querySelector('b').textContent));
    verifie(r.etapes.length === 4 && r.etapes.every(x => x.startsWith('·')) && /facultatif/.test(r.etapes[3]), nom + ' premiers pas : ' + r.etapes.join(' | '));
    verifie(await page.locator('#premiers-pas [data-a="partie-rapide"]').count() >= 1 && await page.locator('#premiers-pas [data-a="serie-ouvrir"]').count() === 1, nom + ' chaque étape propose son action');
    /* États vides */
    verifie(/Note une partie/.test(norm(await page.textContent('#mj-kpi'))), nom + ' Mon jeu : état vide utile');
    await page.click('#barre [data-v="sac"]');
    verifie(/À mesurer|Aucune mesure/.test(norm(await page.textContent('#vue'))) && await page.locator('#vue [data-a="serie-ouvrir"]').count() >= 1, nom + ' Mon sac : proposer une série');
    await page.click('#barre [data-v="journal"]');
    verifie(/Rien pour l.instant/.test(norm(await page.textContent('#c-chronologie'))), nom + ' Journal : état vide');
    await page.click('#barre [data-v="bilan"]');
    verifie(/Pas encore de partie/.test(norm(await page.textContent('#vue .rb-tete'))) && await page.locator('#vue canvas').count() === 0, nom + ' Analyses : rien de fictif');
    /* Une partie et une série : deux étapes cochées */
    const e = await page.evaluate(k => JSON.parse(localStorage.getItem(k)), CLE);
    e.parcours = [{ id: 'p1', nom: 'Golf des Essais', pars: PARS }]; e.parties = [partie(1)];
    e.carnet = e.carnet || {}; e.carnet.series = [{ d: new Date().toISOString(), c: 'f7', v: [140, 142, 138] }]; e.maj = Date.now();
    await page.evaluate(([k, v]) => localStorage.setItem(k, JSON.stringify(v)), [CLE, e]);
    await page.reload(); await page.waitForSelector('.tete');
    r.etapes2 = await page.$$eval('#premiers-pas li', l => l.map(x => (x.classList.contains('fait') ? '✓ ' : '· ') + x.querySelector('b').textContent));
    verifie(r.etapes2[0].startsWith('✓') && r.etapes2[1].startsWith('✓') && /1\/3/.test(r.etapes2[2]), nom + ' progression : ' + r.etapes2.join(' | '));
    verifie(/Ta première partie est notée/.test(norm(await page.textContent('#premiers-pas'))), nom + ' ce que débloque une étape');
    /* Trois parties complètes : la carte disparaît */
    e.parties = [partie(1), partie(2), partie(3)]; e.maj = Date.now();
    await page.evaluate(([k, v]) => localStorage.setItem(k, JSON.stringify(v)), [CLE, e]);
    await page.reload(); await page.waitForSelector('.tete');
    verifie(await page.locator('#premiers-pas').count() === 0, nom + ' premiers pas effacés après trois parties complètes');
    verifie(await page.evaluate(() => document.documentElement.scrollWidth) <= w, nom + ' sans débordement');
    await ctx.close();
  }
  await browser.close();
  console.log(JSON.stringify({ res, ko, errs }, null, 1));
  process.exit(ko.length || errs.length ? 1 : 0);
})().catch(e => { console.log('ECHEC', e.message); process.exit(1); });
