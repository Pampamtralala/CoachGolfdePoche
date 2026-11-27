/* UX04 : tableau de bord « Mon jeu » — cinq blocs dans l'ordre, index déclaré et estimé distingués, indicateurs
   cliquables avec évolution et périmètre, dernière partie avec faits marquants, actions rapides ; carnet vide sans
   chiffre fictif ; les anciens « repères » restent accessibles dans Analyses ; pas de débordement. */
const { chromium } = require('playwright');
const fs = require('fs');
const CLE = 'coachgolf.v1';
const PARS = [4, 4, 3, 5, 4, 4, 3, 5, 4];
const norm = s => s.replace(/[\s  ]+/g, ' ').trim();
(async () => {
  const D = 'shots31'; fs.mkdirSync(D, { recursive: true });
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const res = {}, errs = [], ko = [];
  const verifie = (c, m) => { if (!c) ko.push(m); };
  const T = p => [1, 1, 2, 0, p, p, 0, 0, 0, 0, 0];
  const partie = (i, mauvais) => ({ id: 'p_mj' + (5000 + i), d: new Date(Date.now() - (130 - i * 10) * 864e5).toISOString(), o: 0, pc: 'p1', renseigne: PARS.map(() => 7),
    trous: PARS.map((p, k) => { const t = T(p); if (k === 6) t[4] += 2; if (k === 3 && !mauvais) t[4] -= 1; if (mauvais && k === 0) t[4] += 3; if (mauvais && k === 2) { t[2] = 3; t[4] += 1; } if (mauvais && k === 8) { t[3] = 1; t[4] += 1; } return t; }) });
  for (const [w, h, sombre] of [[390, 844, false], [360, 760, true]]) {
    const nom = w + (sombre ? 's' : ''), r = res[nom] = {};
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, colorScheme: sombre ? 'dark' : 'light', hasTouch: true, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    page.on('pageerror', e => errs.push(nom + ' ' + e.message));
    await page.goto('file://' + __dirname + '/dist/index.html');
    await page.click('[data-a="ac-sans-index"]'); await page.click('.carnet-form button[type="submit"]');
    await page.waitForSelector('.tete');
    const titres = () => page.$$eval('#vue h2', l => l.map(x => x.textContent.trim()));
    const largeur = () => page.evaluate(() => document.documentElement.scrollWidth);

    /* Carnet vide, sans index : rien d'inventé */
    r.vide = await titres();
    verifie(JSON.stringify(r.vide) === JSON.stringify(['Premiers pas', 'Performance générale', 'Indicateurs clés', 'Actions rapides', 'Comprendre mon jeu']), nom + ' vide : blocs ' + r.vide.join(' | '));
    r.videIndex = norm(await page.innerText('#mj-perf'));
    verifie(/Index déclaré – Non renseigné/i.test(r.videIndex) && /Index estimé – Inconnu/i.test(r.videIndex) && /Objectif – À définir/i.test(r.videIndex), nom + ' vide : index : ' + r.videIndex);
    verifie(await page.locator('#mj-kpi .kpi-lien').count() === 0 && await page.locator('#mj-kpi .etat-vide').count() === 1, nom + ' vide : pas d\'indicateur fictif');
    verifie(await page.locator('#c-enseignements, .carte-tb.derniere').count() === 0, nom + ' vide : ni enseignement ni dernière partie');
    await page.screenshot({ path: `${D}/${nom}-vide.png`, fullPage: true });

    /* Carnet rempli : index 18 déclaré avec historique, 12 parties (6 moins bonnes puis 6 meilleures) */
    const e = await page.evaluate(k => JSON.parse(localStorage.getItem(k)), CLE);
    e.profil.sansIndex = false; e.profil.index = 18; e.profil.indexVise = 15;
    e.indexHist = [{ d: '2026-03-01T09:00:00.000Z', v: 20.4 }, { d: '2026-06-01T09:00:00.000Z', v: 19.1 }, { d: '2026-09-01T09:00:00.000Z', v: 18 }];
    e.parcours = [{ id: 'p1', nom: 'Golf des Essais', pars: PARS }]; e.parties = Array.from({ length: 12 }, (_, i) => partie(i, i < 6)); e.maj = Date.now();
    await page.evaluate(([k, v]) => localStorage.setItem(k, JSON.stringify(v)), [CLE, e]);
    await page.reload(); await page.waitForSelector('.tete');
    r.blocs = await titres();
    verifie(JSON.stringify(r.blocs.slice(0, 5)) === JSON.stringify(['Performance générale', 'Indicateurs clés', 'Ce que disent tes données', 'Dernière partie', 'Actions rapides']), nom + ' blocs dans l\'ordre : ' + r.blocs.join(' | '));
    r.perf = norm(await page.innerText('#mj-perf'));
    verifie(/Index déclaré 18 ▼ 2,4 depuis le 1(er)? mars/i.test(r.perf), nom + ' index déclaré et évolution : ' + r.perf.slice(0, 90));
    verifie(/Index estimé \d+,\d 12 parties, barème WHS\. Pas ton index officiel/i.test(r.perf), nom + ' index estimé distinct : ' + r.perf);
    verifie(/Objectif 15 Encore 3 à gagner/i.test(r.perf) && await page.locator('#mj-perf .courbe-index').count() === 1, nom + ' objectif et courbe');
    /* Indicateurs */
    r.kpi = await page.$$eval('#mj-kpi .kpi-lien', l => l.map(b => b.querySelector('.kpi-t').textContent + ' = ' + b.querySelector('.kpi-v').textContent + ' | ' + b.querySelector('.kpi-n').textContent));
    verifie(r.kpi.length === 6 && r.kpi.every(x => /\d/.test(x.split(' = ')[1])), nom + ' six indicateurs : ' + r.kpi.join(' / '));
    verifie(/Score.*=.*▼/.test(r.kpi[0]) && /Greens en régulation Déduit/.test(r.kpi[2]), nom + ' évolution du score et GIR « déduit » : ' + r.kpi[0] + ' / ' + r.kpi[2]);
    r.perimetre = norm(await page.textContent('#mj-kpi .mj-perimetre'));
    verifie(/^Sur 10 parties \(90 trous\)/.test(r.perimetre) && /par rapport aux 2 parties précédentes/.test(r.perimetre), nom + ' périmètre et comparaison : ' + r.perimetre);
    /* Dernière partie : parcours et faits marquants */
    r.derniere = norm(await page.textContent('.carte-tb.derniere'));
    verifie(/Golf des Essais/.test(r.derniere) && /Meilleur trou : le 4 \(−1\) · plus coûteux : le 7 \(\+2\)/.test(r.derniere) && /que ta moyenne|dans ta moyenne/.test(r.derniere), nom + ' dernière partie : ' + r.derniere);
    /* Actions rapides */
    r.actions = await page.$$eval('#vue .acces-rapides button', l => l.map(b => b.textContent.trim()).join(' | '));
    verifie(/^Nouvelle partie \| Explorer mes statistiques \| Mes parties$/.test(r.actions), nom + ' actions : ' + r.actions);
    verifie(await largeur() <= w, nom + ' Mon jeu sans débordement (' + await largeur() + ')');
    await page.screenshot({ path: `${D}/${nom}-rempli.png`, fullPage: true });
    /* Clic sur un indicateur : l'analyse correspondante */
    await page.click('#mj-kpi .kpi-lien:has-text("Putts")'); await page.waitForTimeout(120);
    r.apresClic = await page.$eval('#barre [aria-current="page"]', b => b.textContent.trim());
    verifie(r.apresClic === 'Performance' && await page.locator('#vue #st-putting').count() === 1, nom + ' clic Putts → Analyses › putting (' + r.apresClic + ')');
    /* Les anciens repères (petit jeu, coups gagnés estimés, conseils) restent dans Analyses */
    await page.click('[data-a="rubrique"][data-v="perf"]'); /* UX06 : les repères sont dans Performance générale */
    verifie(await page.locator('#vue #reperes').count() === 1, nom + ' pli « Repères face à ton objectif » dans Analyses');
    await page.goBack(); await page.waitForTimeout(100);
    verifie(await page.locator('#vue #mj-perf').count() === 1, nom + ' retour vers Mon jeu');
    /* Partie en cours : reprise en tête */
    await page.click('#vue [data-a="partie-rapide"]'); await page.click('[data-a="pt-nouvelle"]');
    await page.waitForSelector('#calque-partie .pave'); await page.click('#calque-partie [data-a="pt-fermer"]');
    await page.click('#barre [data-v="accueil"]');
    r.reprise = norm(await page.textContent('.mon-jeu .btn.principal').catch(() => ''));
    verifie(/Reprendre ma partie au trou 1/.test(r.reprise), nom + ' partie en cours : ' + r.reprise);
    await ctx.close();
  }
  await browser.close();
  console.log(JSON.stringify({ res, ko, errs }, null, 1));
  process.exit(ko.length || errs.length ? 1 : 0);
})().catch(e => { console.log('ECHEC', e.message); process.exit(1); });
