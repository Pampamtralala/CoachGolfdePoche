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

    /* V4-S03 : graphique d'étagement (une ligne cliquable par club), puis points de vigilance */
    r.ordre = await page.$$eval('#vue h2', l => l.map(x => x.textContent.trim()).slice(0, 3));
    verifie(r.ordre[0] === 'Étalonnage' && r.ordre[1] === 'Points de vigilance', nom + ' étalonnage d\'abord, vigilance ensuite : ' + r.ordre.join(' | '));
    r.lignes = await page.$$eval('#c-synthese .etagement li', l => l.map(li => li.className + ' ; ' + li.querySelector('.eta-nom').textContent.replace(/\s+/g, ' ').trim() + ' ; ' + li.querySelector('.eta-val').textContent.trim() + ' ; ' + li.querySelectorAll('.eta-point').length + ' ; ' + li.querySelector('button').getAttribute('aria-label').replace(/\u00a0/g, ' ')));
    verifie(r.lignes.length === 5, nom + ' cinq clubs, putter hors étagement : ' + r.lignes.length);
    verifie(/^eta-herit ; Driver ; 225\sm hérité ; 1 ; Driver : 225\sm hérité, 0\scoup joué\./.test(r.lignes[0]), nom + ' driver (hérité, marqueur distinct) : ' + r.lignes[0]);
    verifie(/eta-ref/.test(r.lignes[3]) && /réf\. 139 m/.test(r.lignes[3]), nom + ' fer 8 : référence, marqueur distinct : ' + r.lignes[3]);
    verifie(/^eta-vide ; Bois 5 ; — ; 0 ; Bois 5 : distance inconnue/.test(r.lignes[1]), nom + ' bois 5 : inconnu « — », sans point ni estimation : ' + r.lignes[1]);
    verifie(/Seulement 1 m avec le fer 8/.test(r.lignes[2]) && /Seulement 1 m avec le fer 7/.test(r.lignes[3]) && /alerte/.test(r.lignes[2]), nom + ' écart anormal fer 7 / fer 8 : ' + r.lignes[2] + ' / ' + r.lignes[3]);
    r.vigilance = await page.$$eval('#c-distances .liste-exos li', l => l.map(x => x.textContent.replace(/\s+/g, ' ').trim()));
    verifie(r.vigilance.length === 2 && /Fer 7 \/ Fer 8/.test(r.vigilance[0]) && /Putter/.test(r.vigilance[1]), nom + ' points de vigilance : ' + r.vigilance.join(' | '));
    await page.click('#c-synthese [data-a="sac-fiche-club"][data-id="f7"]'); await page.waitForSelector('#club-page');
    verifie(/Fer 7/.test(norm(await page.textContent('#club-page h1'))) && await page.locator('#feuille').count() === 0, nom + ' une ligne du graphique ouvre la page du club');
    await page.click('#club-page [data-a="club-retour"]'); await page.waitForSelector('#c-synthese');
    /* V4-S02 : l'état du sac est dans les chiffres d'en-tête de l'onglet Distances */
    r.chiffres = await page.$$eval('.sac-chiffres .kpi', l => l.map(x => x.querySelector('.kpi-t').textContent + ' ' + x.querySelector('.kpi-v').textContent));
    verifie(r.chiffres.join(' | ') === 'Clubs 6/14 | Documentés 0 | À vérifier 2', nom + ' chiffres du sac : ' + r.chiffres.join(' | '));
    r.onglets = await page.$$eval('.sac-onglets button', l => l.map(b => b.textContent + (b.getAttribute('aria-pressed') === 'true' ? '*' : '')).join(' | '));
    verifie(r.onglets === 'Distances* | Performance | Wedges', nom + ' trois onglets, Distances par défaut : ' + r.onglets);
    r.resume = norm(await page.$eval('#c-synthese .aide-pli > div', x => x.textContent));
    verifie(/jamais estimées/.test(r.resume) && /à partir de 3 coups/.test(r.resume) && /n'entre dans les moyennes/.test(r.resume.replace(/’/g, "'")), nom + ' résumé : ' + r.resume);
    verifie(await page.locator('#sac-scene, .c3d, .s3d').count() === 0, nom + ' sac 3D retiré (V4-02)');
    verifie(await page.evaluate(() => document.documentElement.scrollWidth) <= w, nom + ' Mon sac sans débordement');
    await page.screenshot({ path: `${D}/${nom}-sac.png` });

    /* V4-S04 : page du fer 7 — consultation ; réglages derrière l'icône ; navigation entre clubs */
    await page.click('#c-synthese [data-a="sac-fiche-club"][data-id="f7"]'); await page.waitForSelector('#club-page');
    r.fiche = norm(await page.textContent('#club-page .club-distance')) + ' / ' + norm(await page.textContent('#club-page .page-sous'));
    verifie(/^–/.test(r.fiche) && /140 m hérité/.test(r.fiche) && /Aucun coup enregistré/.test(r.fiche), nom + ' page fer 7 : distance inconnue, héritée en petit : ' + r.fiche);
    await page.click('#club-page details:has(summary:text("Données et mesures")) summary');
    r.prov = norm(await page.innerText('#club-page .club-prov'));
    verifie(/Distance de référence aucune/.test(r.prov) && /Mesures héritées 3 mesures \(140 m\), hors moyennes/.test(r.prov) && /Estimations jamais comptées/.test(r.prov), nom + ' provenance au détail : ' + r.prov);
    verifie(await page.locator('#club-page .fiche-series, #club-page [data-a="serie-ouvrir"], #club-page .sac-ellipse').count() === 0, nom + ' ni série, ni dispersion sans écart latéral noté');
    r.voisins = await page.$$eval('.club-voisins button', l => l.map(b => b.textContent.trim()).join(' | '));
    verifie(r.voisins === '‹ Bois 5 | Fer 8 ›', nom + ' navigation entre clubs : ' + r.voisins);
    await page.screenshot({ path: `${D}/${nom}-fiche.png`, fullPage: true });
    await page.click('.club-voisins button:has-text("Fer 8")');
    verifie(/Fer 8/.test(norm(await page.textContent('#club-page h1'))), nom + ' club suivant');
    await page.click('#club-page [data-a="club-reglages"]'); await page.waitForSelector('#feuille.sac-fiche');
    verifie(/Réglages/.test(norm(await page.textContent('#feuille header'))) && await page.locator('#feuille #sac-val').count() === 1 && await page.locator('#feuille .fiche-club-synthese').count() === 0, nom + ' icône : réglages du club (référence), sans les chiffres');
    await page.keyboard.press('Escape'); await page.waitForSelector('#feuille', { state: 'detached' });
    await page.click('#club-page [data-a="club-retour"]'); await page.waitForSelector('#c-synthese');
    r.archive = norm(await page.textContent('#c-historique summary'));
    verifie(/Séries de practice archivées \(2\)/.test(r.archive), nom + ' séries archivées consultables : ' + r.archive);
    /* V4-S02 : lien profond vers la matrice → onglet Wedges ; icône de configuration → composition */
    await page.click('#barre [data-v="accueil"]');
    await page.evaluate(() => { const b = document.createElement('button'); b.setAttribute('data-a', 'aller-a'); b.setAttribute('data-v', 'sac'); b.setAttribute('data-s', 'c-wedges'); b.hidden = true; document.getElementById('app').appendChild(b); b.click(); });
    verifie(await page.locator('.sac-onglets [aria-pressed="true"][data-v="wedges"]').count() === 1 && await page.locator('#c-wedges').count() === 1, nom + ' #c-wedges ouvre l\'onglet Wedges');
    await page.click('[data-a="sac-onglet"][data-v="performance"]');
    verifie(await page.locator('#vue #st-clubs').count() === 1, nom + ' onglet Performance : profil des clubs');
    await page.click('.sac-tete .icone-btn'); await page.waitForSelector('#feuille');
    verifie(/Configuration du sac/.test(norm(await page.textContent('#feuille h2'))), nom + ' icône : configuration du sac');
    await page.keyboard.press('Escape');
    await ctx.close();
  }
  await browser.close();
  console.log(JSON.stringify({ res, ko, errs }, null, 1));
  process.exit(ko.length || errs.length ? 1 : 0);
})().catch(e => { console.log('ECHEC', e.message); process.exit(1); });
