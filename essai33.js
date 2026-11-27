/* UX08 : Mon sac côté données — synthèse des clubs (distance typique observée, fourchette, mesures par provenance,
   écart anormal, club peu documenté, aucune estimation), fiche club ouverte par ses chiffres (distance, practice /
   parcours, évolution des séries, série en un toucher), sac 3D gardé en vue alternative, pas de débordement. */
const { chromium } = require('playwright');
const fs = require('fs');
const CLE = 'coachgolf.v1';
const norm = s => s.replace(/[\s  ]+/g, ' ').trim();
(async () => {
  const D = 'shots33'; fs.mkdirSync(D, { recursive: true });
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
    e.carnet = e.carnet || {};
    e.carnet.sac = ['dr', 'b5', 'f7', 'f8', 'pw'];
    e.carnet.clubs = { dr: [220, 225, 230], f7: [140, 142, 138] };
    e.carnet.references = { f8: 139 };
    e.carnet.series = [{ d: '2026-09-10T10:00:00.000Z', c: 'f7', v: [132, 136, 134] }, { d: '2026-11-10T10:00:00.000Z', c: 'f7', v: [140, 142, 138] }];
    e.maj = Date.now();
    await page.evaluate(([k, v]) => localStorage.setItem(k, JSON.stringify(v)), [CLE, e]);
    await page.reload(); await page.waitForSelector('.tete');
    await page.click('#barre [data-v="sac"]');

    /* Synthèse en tête, avant le sac 3D */
    r.ordre = await page.$$eval('#vue h2', l => l.map(x => x.textContent.trim()).slice(0, 3));
    verifie(r.ordre[0] === 'Mes clubs' && r.ordre[1] === 'Étagement', nom + ' synthèse d\'abord, étagement ensuite : ' + r.ordre.join(' | '));
    r.lignes = await page.$$eval('#c-synthese tbody tr', l => l.map(tr => Array.from(tr.cells).map(c => c.textContent.replace(/\s+/g, ' ').trim()).join(' ; ')));
    verifie(r.lignes.length === 5, nom + ' cinq clubs : ' + r.lignes.length);
    verifie(/^Driver ?Aucun coup mesuré ; 225 m hérité ; – ; 0$/.test(r.lignes[0]), nom + ' driver (hérité, hors moyennes) : ' + r.lignes[0]);
    verifie(/réf\. 139 m/.test(r.lignes[3]), nom + ' fer 8 : référence affichée à part : ' + r.lignes[3]);
    verifie(/^Bois 5 ?Aucun coup mesuré ; – ; – ; 0$/.test(r.lignes[1]), nom + ' bois 5 sans mesure, sans estimation : ' + r.lignes[1]);
    verifie(/Seulement 1 m avec le fer 8/.test(r.lignes[2]) && /Seulement 1 m avec le fer 7/.test(r.lignes[3]), nom + ' écart anormal fer 7 / fer 8 : ' + r.lignes[2] + ' / ' + r.lignes[3]);
    verifie(await page.locator('#c-synthese tr.alerte').count() >= 1, nom + ' ligne en alerte marquée');
    r.resume = norm(await page.textContent('#c-synthese .sac-resume')) + ' / ' + norm(await page.$eval('#c-synthese .aide-pli > div', x => x.textContent));
    verifie(/jamais estimées/.test(r.resume) && /à documenter/.test(r.resume) && /sous 3 coups mesurés/.test(r.resume) && /n'entre pas dans les moyennes/.test(r.resume.replace(/’/g, "'")), nom + ' résumé : ' + r.resume);
    verifie(await page.locator('#sac-scene, .c3d, .s3d').count() === 0, nom + ' sac 3D retiré (V4-02)');
    verifie(await page.evaluate(() => document.documentElement.scrollWidth) <= w, nom + ' Mon sac sans débordement');
    await page.screenshot({ path: `${D}/${nom}-sac.png` });

    /* Fiche du fer 7 depuis le tableau */
    await page.click('#c-synthese [data-a="sac-fiche-club"][data-id="f7"]');
    await page.waitForSelector('#feuille.sac-fiche');
    r.fiche = await page.$$eval('#feuille .fiche-club-synthese .kpi', l => l.map(x => x.querySelector('.kpi-t').textContent.replace(/\s+/g, ' ').trim() + ' = ' + x.querySelector('.kpi-v').textContent.replace(/\s+/g, ' ').trim()));
    verifie(r.fiche[0] === 'Distance observée Inconnu = –' && r.fiche[1] === 'Référence Référence = –' && r.fiche[2] === 'Mesures héritées Héritée = 140 m', nom + ' fiche fer 7 : ' + r.fiche.join(' | '));
    verifie(await page.locator('#feuille .fiche-series, #feuille [data-a="serie-ouvrir"]').count() === 0, nom + ' plus d\'évolution des séries ni de bouton de série (V4-03)');
    await page.screenshot({ path: `${D}/${nom}-fiche.png` });
    await page.keyboard.press('Escape'); await page.waitForSelector('#feuille', { state: 'detached' });
    r.archive = norm(await page.textContent('#c-historique summary'));
    verifie(/Séries de practice archivées \(2\)/.test(r.archive), nom + ' séries archivées consultables : ' + r.archive);
    await ctx.close();
  }
  await browser.close();
  console.log(JSON.stringify({ res, ko, errs }, null, 1));
  process.exit(ko.length || errs.length ? 1 : 0);
})().catch(e => { console.log('ECHEC', e.message); process.exit(1); });
