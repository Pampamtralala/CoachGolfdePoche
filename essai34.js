/* UX09 : saisie d'un coup sur le parcours — club, direction et distance d'abord, le reste replié avec sa valeur
   visible ; distance vide par défaut ; un coup en trois interactions (club, direction, enregistrer) ; correction ;
   pas de double comptage ; grandes zones tactiles ; pas de débordement. */
const { chromium } = require('playwright');
const fs = require('fs');
const CLE = 'coachgolf.v1';
const norm = s => s.replace(/[\s  ]+/g, ' ').trim();
(async () => {
  const D = 'shots34'; fs.mkdirSync(D, { recursive: true });
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const res = {}, errs = [], ko = [];
  const verifie = (c, m) => { if (!c) ko.push(m); };
  for (const [w, h, sombre] of [[390, 844, false], [360, 760, true]]) {
    const nom = w + (sombre ? 's' : ''), r = res[nom] = {};
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, colorScheme: sombre ? 'dark' : 'light', hasTouch: true, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    page.on('pageerror', e => errs.push(nom + ' ' + e.message));
    await page.goto('file://' + __dirname + '/dist/index.html');
    await page.click('[data-a="ac-sans-index"]'); await page.click('.carnet-form button[type="submit"]');
    await page.waitForSelector('.tete');
    const e = await page.evaluate(k => JSON.parse(localStorage.getItem(k)), CLE);
    e.carnet = e.carnet || {}; e.carnet.sac = ['dr', 'f7', 'pw']; e.carnet.clubs = { dr: [220, 225, 230], f7: [140, 142, 138] }; e.modeSaisie = 'detail'; e.parcours = [{ id: 'p1', nom: 'Golf des Essais', pars: [4, 4, 3, 5, 4, 4, 3, 5, 4] }]; e.maj = Date.now();
    await page.evaluate(([k, v]) => localStorage.setItem(k, JSON.stringify(v)), [CLE, e]);
    await page.reload(); await page.waitForSelector('.tete');
    await page.click('#vue [data-a="partie-rapide"]');
    await page.click('[data-a="pt-nouvelle"]'); await page.waitForSelector('#calque-partie .pave');
    const coups = async () => (await page.evaluate(k => JSON.parse(localStorage.getItem(k)), CLE)).partie.coups || [];

    /* Premier coup : panneau dans le nouvel ordre */
    await page.click('[data-a="pv-coup"][data-v="-1"]'); await page.waitForSelector('.pv-panneau');
    r.ordre = await page.$$eval('.pv-panneau > .pv-etiq, .pv-panneau > .pv-clubs, .pv-panneau > .pv-dist, .pv-panneau > details.pv-plus-coup, .pv-panneau .ell-cible', l => l.map(x => x.className.split(' ')[0]));
    verifie(r.ordre.indexOf('pv-clubs') < r.ordre.indexOf('pv-plus-coup') && r.ordre.indexOf('pv-dist') < r.ordre.indexOf('pv-plus-coup'), nom + ' club et distance avant les détails : ' + r.ordre.join(','));
    verifie(await page.locator('.pv-panneau details.pv-plus-coup:not([open])').count() === 1, nom + ' détails repliés pour un nouveau coup');
    r.resume = norm(await page.textContent('.pv-plus-coup > summary'));
    verifie(/Plus de détails ?Balle : départ/.test(r.resume), nom + ' valeur visible dans le titre : ' + r.resume);
    r.distance = await page.inputValue('#pv-dist');
    verifie(r.distance === '', nom + ' distance vide par défaut');
    /* Trois interactions : club, direction, enregistrer */
    await page.click('.pv-panneau [data-a="pv-club"][data-id="dr"]');
    const cible = page.locator('.pv-panneau .ell-cible'), bb = await cible.boundingBox();
    await page.mouse.click(bb.x + bb.width * 0.8, bb.y + bb.height / 2);
    verifie(await page.inputValue('#pv-dist') === '', nom + ' la direction ne remplit pas la distance');
    await page.screenshot({ path: `${D}/${nom}-coup.png` });
    await page.click('#pv-coup-ok'); await page.waitForSelector('.pv-panneau', { state: 'detached' });
    let l = await coups(), c = (l[0] || [])[0] || {};
    verifie(l.flat().length === 1 && c.c === 'dr' && c.l > 0 && (c.d == null || c.dm) && c.source !== 'gps', nom + ' coup en trois interactions, distance inconnue, direction droite : ' + JSON.stringify(c));
    /* Correction : le coup se rouvre, la distance reste vide, une modification ne crée pas de second coup */
    await page.click('[data-a="pv-coup"][data-v="0"]'); await page.waitForSelector('.pv-panneau');
    verifie(await page.inputValue('#pv-dist') === '', nom + ' correction : distance toujours vide');
    await page.click('.pv-panneau [data-a="pv-club"][data-id="f7"]'); await page.click('#pv-coup-ok'); await page.waitForSelector('.pv-panneau', { state: 'detached' });
    l = await coups();
    verifie(l.flat().length === 1 && l[0][0].c === 'f7', nom + ' correction sans double comptage : ' + l.flat().map(x => x.c).join(','));
    /* Deuxième coup sans GPS : position non inventée */
    await page.click('[data-a="pv-coup"][data-v="-1"]'); await page.waitForSelector('.pv-panneau');
    r.resume2 = norm(await page.textContent('.pv-plus-coup > summary'));
    verifie(/Balle : non notée/.test(r.resume2), nom + ' deuxième coup : position non inventée (' + r.resume2 + ')');
    await page.click('.pv-plus-coup > summary');
    verifie(await page.locator('.pv-plus-coup [data-a="pv-lie"][aria-pressed="true"]').count() === 0, nom + ' aucune position cochée par défaut');
    /* Zones tactiles */
    r.tailles = await page.$$eval('.pv-panneau [data-a="pv-club"], .pv-plus-coup > summary, #pv-coup-ok', l => l.map(b => Math.round(b.getBoundingClientRect().height)));
    verifie(r.tailles.every(x => x >= 44), nom + ' zones tactiles ≥ 44 px : ' + r.tailles.join(','));
    verifie(await page.evaluate(() => document.documentElement.scrollWidth) <= w, nom + ' sans débordement');
    await page.click('[data-a="pv-coup-annuler"]');
    await ctx.close();
  }
  await browser.close();
  console.log(JSON.stringify({ res, ko, errs }, null, 1));
  process.exit(ko.length || errs.length ? 1 : 0);
})().catch(e => { console.log('ECHEC', e.message); process.exit(1); });
