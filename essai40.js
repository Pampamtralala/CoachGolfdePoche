/* V4-08 : saisir une ancienne partie — date passée choisie, jamais dans le futur ; Jouer = collecte seulement. */
const { chromium } = require('playwright');
const CLE = 'coachgolf.v1';
const ko = [], errs = [], res = {};
const verifie = (c, m) => { if (!c) ko.push(m); };
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  for (const w of [390, 360]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 800 }, reducedMotion: 'reduce' }), page = await ctx.newPage(), nom = String(w);
    page.on('pageerror', e => errs.push(nom + ' ' + e.message));
    await page.goto('file://' + process.cwd() + '/dist/index.html');
    await page.click('[data-a="ac-sans-index"]'); await page.click('.carnet-form button[type="submit"]'); await page.waitForSelector('.tete');
    await page.click('#barre [data-v="parcours"]');
    res[nom] = { liens: await page.$$eval('.jouer-liens b', l => l.map(x => x.textContent)) };
    verifie(res[nom].liens.join(' | ') === 'Saisir une ancienne partie | Mes parcours et GPS | Conditions de jeu', nom + ' accès de Jouer : ' + res[nom].liens.join(' | '));
    verifie(await page.locator('#vue .cta-partie').count() === 1 && await page.locator('#vue .modes [data-a="mode-saisie"]').count() === 3, nom + ' action principale et trois niveaux de saisie');
    await page.click('[data-a="dp-ancienne"]');
    verifie(await page.evaluate(() => document.activeElement && document.activeElement.id) === 'dp-date', nom + ' ancienne partie : la date d\'abord');
    verifie(/Ancienne partie/.test(await page.textContent('#c-partie h2')) && /Tu as joué/.test(await page.textContent('#c-partie')), nom + ' libellés au passé');
    await page.fill('#dp-nom', 'Golf du Passé');
    /* Futur refusé */
    await page.$eval('#dp-date', i => { i.removeAttribute('max'); i.value = '2099-01-01'; i.dispatchEvent(new Event('change', { bubbles: true })); });
    await page.click('[data-a="pt-nouvelle"]');
    verifie(/futur/.test(await page.textContent('#dp-err')) && !(await page.evaluate(k => JSON.parse(localStorage.getItem(k)).partie, CLE)), nom + ' date future refusée');
    await page.$eval('#dp-date', i => { i.value = '2026-10-04'; i.dispatchEvent(new Event('change', { bubbles: true })); });
    await page.click('[data-a="pt-nouvelle"]'); await page.waitForSelector('#calque-partie .pave');
    const e = await page.evaluate(k => JSON.parse(localStorage.getItem(k)), CLE);
    res[nom].date = e.partie && e.partie.d;
    verifie(/^2026-10-04/.test(res[nom].date), nom + ' partie datée du 4 octobre : ' + res[nom].date);
    await ctx.close();
  }
  console.log(JSON.stringify({ res, ko, errs }, null, 1));
  await b.close();
  process.exitCode = ko.length || errs.length ? 1 : 0;
})().catch(e => { console.error('ECHEC', e.message); process.exit(1); });
