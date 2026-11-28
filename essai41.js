/* V4-S07 : matrice de wedges — ¼ ½ ¾ Plein, références distinctes des observations, inconnu « — », cellule cliquable. */
const { chromium } = require('playwright');
const CLE = 'coachgolf.v1', PARS = [4, 4, 3, 5, 4, 4, 3, 5, 4];
const ko = [], errs = [], res = {};
const verifie = (c, m) => { if (!c) ko.push(m); };
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  for (const w of [390, 360]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 800 }, reducedMotion: 'reduce' }), page = await ctx.newPage(), nom = String(w), r = res[nom] = {};
    page.on('pageerror', e => errs.push(nom + ' ' + e.message));
    await page.goto('file://' + process.cwd() + '/dist/index.html');
    await page.click('[data-a="ac-sans-index"]'); await page.click('.carnet-form button[type="submit"]'); await page.waitForSelector('.tete');
    /* Trois coups de SW à ½ (40, 42, 44 m) et trois pleins (86, 88, 90 m) ; référence SW ½ = 45, référence pleine SW = 80 */
    const coups = (i, k) => k === 0 ? [{ c: 'sw', a: 'a2', d: 40 + 2 * (i % 3) }] : k === 1 ? [{ c: 'sw', d: 86 + 2 * (i % 3) }] : [];
    const partie = i => ({ id: 'p_w' + (100 + i), d: new Date(Date.UTC(2026, 5, 1) + i * 7 * 864e5).toISOString(), o: 0, pc: 'p1',
      trous: PARS.map(p => [1, 1, 2, 0, p, p, 0, 0, 0, 0, 0]), coups: PARS.map((p, k) => coups(i, k)) });
    const e = await page.evaluate(k => JSON.parse(localStorage.getItem(k)), CLE);
    e.parcours = [{ id: 'p1', nom: 'La Jonchère', pars: PARS }]; e.parties = [0, 1, 2].map(partie);
    e.carnet.references = { sw: 80 }; e.carnet.wedges = { sw: { a2: 45 } }; e.maj = Date.now();
    await page.evaluate(([k, v]) => localStorage.setItem(k, JSON.stringify(v)), [CLE, e]);
    await page.reload(); await page.waitForSelector('.tete');
    await page.click('#barre [data-v="sac"]'); await page.click('[data-a="sac-onglet"][data-v="wedges"]');
    r.entetes = await page.$$eval('.matrice-wedges thead th', l => l.map(x => x.textContent.replace(/\s+/g, ' ').trim()));
    verifie(/^¼/.test(r.entetes[1]) && /^½/.test(r.entetes[2]) && /^¾/.test(r.entetes[3]) && r.entetes[4] === 'Plein', nom + ' colonnes ¼ ½ ¾ Plein : ' + r.entetes.join(' | '));
    const cell = async (wd, am) => page.$eval(`[data-a="w-case"][data-w="${wd}"][data-am="${am}"]`, x => ({ ref: (x.querySelector('.w-ref') || {}).textContent || '', obs: (x.querySelector('.w-obs') || {}).textContent || '', vide: !!x.querySelector('.w-vide') }));
    r.swA2 = await cell('sw', 'a2'); r.swPlein = await cell('sw', 'plein'); r.swA1 = await cell('sw', 'a1'); r.lwA3 = await cell('lw', 'a3');
    verifie(r.swA2.ref === '45' && r.swA2.obs === '423×', nom + ' SW ½ : référence 45 et observé 42 (3 coups) distincts : ' + JSON.stringify(r.swA2));
    verifie(r.swPlein.ref === '80' && r.swPlein.obs === '883×', nom + ' SW plein : référence 80, observé 88 : ' + JSON.stringify(r.swPlein));
    verifie(r.swA1.vide && !r.swA1.ref && !r.swA1.obs && r.lwA3.vide, nom + ' inconnu affiché « — », rien d\'inventé');
    /* Cellule cliquable : détail sous le tableau */
    await page.click('[data-a="w-case"][data-w="sw"][data-am="a2"]');
    r.detail = (await page.textContent('#w-detail')).replace(/\s+/g, ' ');
    verifie(await page.inputValue('#w-sw-a2') === '45' && /Ta référence \(déclarée\)/.test(r.detail) && /42 m en moyenne sur 3 coups \(de 40 à 44 m\)/.test(r.detail), nom + ' détail SW ½ : ' + r.detail);
    await page.fill('#w-sw-a2', '43'); await page.dispatchEvent('#w-sw-a2', 'change');
    r.apres = await cell('sw', 'a2');
    const st = await page.evaluate(k => JSON.parse(localStorage.getItem(k)).carnet.wedges, CLE);
    verifie(r.apres.ref === '43' && st.sw.a2 === 43 && r.apres.obs === '423×', nom + ' référence modifiée, observations intactes : ' + JSON.stringify(r.apres));
    await page.click('[data-a="w-case"][data-w="sw"][data-am="plein"]');
    r.detailPlein = (await page.textContent('#w-detail')).replace(/\s+/g, ' ');
    verifie(/80 m, la distance de référence/.test(r.detailPlein) && /88 m en moyenne sur 3 coups/.test(r.detailPlein) && await page.locator('#w-detail input').count() === 0, nom + ' détail plein : ' + r.detailPlein);
    await page.click('[data-a="w-case"][data-w="gw"][data-am="a1"]');
    r.detailVide = (await page.textContent('#w-detail')).replace(/\s+/g, ' ');
    verifie(/Aucun coup noté à cette amplitude/.test(r.detailVide) && await page.inputValue('#w-gw-a1') === '', nom + ' détail case inconnue : ' + r.detailVide);
    await page.click('[data-a="w-case-fermer"]');
    verifie(await page.locator('#w-detail').count() === 0, nom + ' détail refermé');
    r.largeur = await page.evaluate(() => document.documentElement.scrollWidth);
    verifie(r.largeur === w, nom + ' pas de débordement : ' + r.largeur);
    if (w === 390) { await page.click('[data-a="w-case"][data-w="sw"][data-am="a2"]'); await page.screenshot({ path: '/tmp/essai41-' + nom + '.png', fullPage: true }); }
    await ctx.close();
  }
  await b.close();
  console.log(JSON.stringify({ res, ko, errs }, null, 1));
  process.exit(ko.length || errs.length ? 1 : 0);
})().catch(e => { console.log('ECHEC ' + e.message); process.exit(2); });
