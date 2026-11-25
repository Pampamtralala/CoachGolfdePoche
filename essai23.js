/* P04 : Mes données — inventaire, distances à vérifier, exclusions réversibles, sauvegarde complète (fichier et texte),
   écriture impossible signalée, historique volumineux. */
const { chromium } = require('playwright');
const fs = require('fs');
const CLE = 'coachgolf.v1';
const PARS = [4, 4, 3, 5, 4, 4, 3, 5, 4];
const norm = s => s.replace(/[\s  ]+/g, ' ').trim();
(async () => {
  const D = 'shots23'; fs.mkdirSync(D, { recursive: true });
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const res = {}, errs = [], ko = [];
  const verifie = (c, m) => { if (!c) ko.push(m); };
  const T = p => [1, 1, 2, 0, p, p, 0, p >= 4 ? 1 : 0, 0, 0, 0];
  const fabrique = (n, avecSuspect) => Array.from({ length: n }, (_, i) => ({
    id: 'p_essai' + (5000 + i), d: new Date(Date.UTC(2026, 0, 3) + i * 3 * 86400000).toISOString(), o: 0, pc: 'p1', renseigne: PARS.map(() => 7),
    trous: PARS.map(T),
    coups: PARS.map((p, k) => k === 0 ? [{ c: 'dr', a: 'plein', p: 'dep', d: 215, source: 'manuel', distanceType: 'carry', l: 3, id: 'c_d' + i },
      { c: 'f7', a: 'plein', p: 'fw', d: avecSuspect && i === 2 ? 235 : 140 + (i % 3) * 5, source: 'manuel', distanceType: 'carry', id: 'c_f' + i }] : [])
  }));
  const ouvrirApp = async (page, nom) => {
    await page.goto('file://' + __dirname + '/dist/index.html');
    await page.click('[data-a="commencer"]'); await page.fill('#q-prenom', 'Benjamin'); await page.fill('#q-index', '14'); await page.click('[data-a="q-suite"]');
    await page.click('[data-k="objectif"][data-v="score"]'); await page.click('[data-a="q-suite"]');
    for (const l of ['practice', 'putting', 'parcours']) await page.click(`[data-a="lieu"][data-v="${l}"]`);
    for (let i = 0; i < 8 && await page.locator('[data-a="q-suite"]').count(); i++) await page.click('[data-a="q-suite"]');
    await page.waitForSelector('.tete');
  };
  const charger = async (page, parties) => {
    const e = await page.evaluate(k => JSON.parse(localStorage.getItem(k)), CLE);
    e.parcours = [{ id: 'p1', nom: 'La Jonchère', pars: PARS }]; e.parties = parties; e.maj = Date.now();
    await page.evaluate(([k, v]) => { localStorage.setItem(k, JSON.stringify(v)); localStorage.setItem('coachgolf.geo.v1', JSON.stringify({ v: 1, pcs: { p1: { src: 'releve', nom: 'Carte de test', o: [46, 2], trous: [], libres: [] } } })); }, [CLE, e]);
    await page.reload(); await page.waitForSelector('.tete');
  };
  const lire = page => page.evaluate(k => JSON.parse(localStorage.getItem(k)), CLE);
  const ouvrirMesDonnees = async page => {
    await page.click('button.ident[data-v="profil"]');
    await page.click('#donnees [data-a="md-ouvrir"]');
    await page.waitForSelector('#feuille.mes-donnees');
  };
  const echantillon = async page => {
    await page.click('#barre [data-a="onglet"][data-v="bilan"]');
    await page.click('[data-a="st-derniers"][data-v="0"]');
    return norm(await page.textContent('.stats-echantillon'));
  };

  for (const [w, h, sombre] of [[390, 844, false], [360, 760, true]]) {
    const nom = w + (sombre ? 's' : ''), r = res[nom] = {};
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, colorScheme: sombre ? 'dark' : 'light', hasTouch: true, reducedMotion: 'reduce', acceptDownloads: true });
    const page = await ctx.newPage();
    page.on('pageerror', e => errs.push(nom + ' ' + e.message));
    await ouvrirApp(page);
    await charger(page, fabrique(6, true));
    /* Inventaire */
    await ouvrirMesDonnees(page);
    r.inventaire = await page.$$eval('#feuille .inventaire tr', l => l.map(x => [...x.children].map(c => [...c.childNodes].map(n => n.textContent).join(' ')).join(' | ').replace(/[\s  ]+/g, ' ').trim()));
    const ligne = re => r.inventaire.find(x => re.test(x)) || '';
    verifie(/^Parties \| 6$/.test(ligne(/^Parties/)) && /^Trous joués avec un score \| 54$/.test(ligne(/^Trous joués/)) && /^Mises en jeu renseignées sur les par 4 et 5 joués \| 42 \/ 42$/.test(ligne(/^Mises en jeu/)), nom + ' inventaire parties / trous / mises en jeu : ' + r.inventaire.slice(0, 3).join(' / '));
    verifie(/^Coups notés \| 12$/.test(ligne(/^Coups notés/)) && /^Directions connues .* \| 6$/.test(ligne(/^Directions/)) && /^Distances déclarées tapées par toi \| 12$/.test(ligne(/^Distances déclarées/)) && /^Cartes GPS de parcours .* \| 1$/.test(ligne(/^Cartes GPS/)), nom + ' inventaire coups / provenance / cartes : ' + r.inventaire.join(' / '));
    /* Distance suspecte : exclure, réintégrer, confirmer */
    r.suspect = norm(await page.textContent('#feuille .md-liste li'));
    verifie(/^Fer 7 · 235 m · 9 janv\. ?Ta médiane : 145 m sur 6 mesures\./.test(r.suspect), nom + ' distance à vérifier : ' + r.suspect);
    await page.locator('#feuille').screenshot({ path: `${D}/${nom}-01-mes-donnees.png` });
    await page.click('#feuille [data-a="md-coup-exclure"]');
    r.exclu = (await lire(page)).parties[2].coups[0][1];
    verifie(r.exclu.x === 1 && r.exclu.d === 235, nom + ' coup exclu sans perte de la distance : ' + JSON.stringify(r.exclu));
    verifie(/Coups exclus des calculs/.test(await page.textContent('#feuille')) && !(await page.locator('#feuille [data-a="md-coup-exclure"]').count()), nom + ' coup exclu listé, plus à vérifier');
    await page.click('#feuille [data-a="md-coup-reintegrer"]');
    await page.click('#feuille [data-a="md-coup-ok"]');
    r.ok = (await lire(page)).parties[2].coups[0][1];
    verifie(!r.ok.x && r.ok.ok === 1 && /Aucune distance inhabituelle/.test(await page.textContent('#feuille')), nom + ' réintégré puis confirmé : ' + JSON.stringify(r.ok));
    /* Exclure une partie : elle sort des statistiques et y revient */
    await page.click('#feuille [data-a="md-partie"][data-v="5"]');
    verifie((await lire(page)).parties[5].exclue === 1, nom + ' partie marquée exclue');
    await page.click('#feuille [data-a="fermer-feuille"]#f-fermer');
    r.statsExclue = await echantillon(page);
    verifie(/^Sur 5 parties/.test(r.statsExclue), nom + ' statistiques sans la partie exclue : ' + r.statsExclue);
    await page.click('#barre [data-a="onglet"][data-v="parcours"]');
    r.carnet = norm(await page.textContent('.carte-score.parties tbody tr:first-child th'));
    verifie(/exclue des calculs/.test(r.carnet), nom + ' carnet : partie signalée exclue : ' + r.carnet);
    await ouvrirMesDonnees(page);
    await page.click('#feuille [data-a="md-partie"][data-v="5"]');
    await page.click('#feuille [data-a="fermer-feuille"]#f-fermer');
    r.statsReint = await echantillon(page);
    verifie(/^Sur 6 parties/.test(r.statsReint), nom + ' réintégrée : ' + r.statsReint);
    /* Sauvegarde complète : fichier et texte avec cartes, puis restauration sur un appareil vierge */
    await ouvrirMesDonnees(page);
    await page.click('#feuille [data-a="md-partie"][data-v="1"]');   /* une exclusion doit survivre à la restauration */
    const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#feuille [data-a="exporter-fichier"]')]);
    const fichier = fs.readFileSync(await dl.path(), 'utf8'), exp = JSON.parse(fichier);
    verifie(exp.parties.length === 6 && exp.parties[1].exclue === 1 && exp.parties[2].coups[0][1].ok === 1 && exp.cartesGeo && exp.cartesGeo.p1, nom + ' fichier complet (exclusion, confirmation, carte)');
    await page.click('#feuille [data-a="exporter"]');
    const code = await page.inputValue('#d-code');
    const decode = JSON.parse(Buffer.from(code, 'base64').toString('utf8'));
    verifie(decode.cartesGeo && decode.cartesGeo.p1 && decode.parties.length === 6, nom + ' texte de sauvegarde complet, cartes comprises');
    await page.click('#calque-dialogue .dialogue [data-a="fermer-dialogue"]');
    const ctx2 = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: true, reducedMotion: 'reduce' });
    const p2 = await ctx2.newPage(); p2.on('pageerror', e => errs.push(nom + ' (restauration) ' + e.message));
    await ouvrirApp(p2);
    await ouvrirMesDonnees(p2);
    await p2.locator('#md-importer').setInputFiles({ name: 'sauvegarde.json', mimeType: 'application/json', buffer: Buffer.from(fichier) });
    await p2.click('#calque-dialogue [data-a="ok-importer-fichier"]');
    await p2.waitForTimeout(300);
    const rest = await lire(p2), geo = await p2.evaluate(() => JSON.parse(localStorage.getItem('coachgolf.geo.v1') || 'null'));
    r.messageRestau = norm(await p2.textContent('#message'));
    verifie(rest.parties.length === 6 && rest.parties[1].exclue === 1 && rest.parties[2].coups[0][1].ok === 1 && JSON.stringify(rest.parties.map(p => p.id)) === JSON.stringify(exp.parties.map(p => p.id)), nom + ' restauration fidèle (ids, exclusion, confirmation)');
    verifie(geo && geo.pcs && geo.pcs.p1 && /Données et cartes GPS du fichier restaurées/.test(r.messageRestau), nom + ' carte restaurée, message juste : ' + r.messageRestau);
    /* Restauration par texte */
    await p2.evaluate(() => localStorage.removeItem('coachgolf.geo.v1'));
    await p2.click('#feuille [data-a="fermer-feuille"]#f-fermer').catch(() => {});
    await p2.click('#donnees [data-a="importer"]');
    await p2.fill('#d-code', code);
    await p2.click('#calque-dialogue [data-a="ok-importer"]');
    await p2.waitForTimeout(300);
    const geo2 = await p2.evaluate(() => JSON.parse(localStorage.getItem('coachgolf.geo.v1') || 'null'));
    r.messageTexte = norm(await p2.textContent('#message'));
    verifie(geo2 && geo2.pcs && geo2.pcs.p1 && /Sauvegarde et cartes GPS restaurées/.test(r.messageTexte), nom + ' texte : cartes restaurées : ' + r.messageTexte);
    /* Écriture impossible : bannière persistante, aucun message de réussite */
    await p2.evaluate(() => {
      Storage.prototype.setItem = function () { throw new Error('QuotaExceededError'); };
      IDBObjectStore.prototype.put = function () { throw new Error('écriture refusée'); };
    });
    await ouvrirMesDonnees(p2);
    await p2.click('#feuille [data-a="md-partie"][data-v="0"]');
    await p2.waitForTimeout(400);
    r.banniere = await p2.$eval('#alerte-stockage', x => x.textContent.replace(/\s+/g, ' ')).catch(() => '');
    r.messagePanne = norm(await p2.textContent('#message'));
    verifie(/ne sont pas enregistrées sur cet appareil/.test(r.banniere), nom + ' bannière de stockage défaillant : ' + r.banniere);
    verifie(/pas enregistrée sur cet appareil/.test(r.messagePanne) && !/^Partie exclue/.test(r.messagePanne), nom + ' pas de faux message de réussite : ' + r.messagePanne);
    r.statutTete = norm(await p2.textContent('#statut-tete'));
    verifie(/Non enregistré/.test(r.statutTete), nom + ' pastille d\'en-tête : ' + r.statutTete);
    await p2.screenshot({ path: `${D}/${nom}-02-panne.png` });
    await ctx2.close();
    r.largeur = await page.evaluate(() => document.documentElement.scrollWidth);
    verifie(r.largeur === w, nom + ' pas de débordement : ' + r.largeur);
    await ctx.close();
  }
  /* Historique volumineux : 400 parties de 18 trous avec coups */
  {
    const r = res.volume = {};
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, reducedMotion: 'reduce' });
    const page = await ctx.newPage(); page.on('pageerror', e => errs.push('volume ' + e.message));
    await ouvrirApp(page);
    const P18 = PARS.concat(PARS);
    const gros = Array.from({ length: 400 }, (_, i) => ({ id: 'p_vol' + (10000 + i), d: new Date(Date.UTC(2023, 0, 1) + i * 2 * 86400000).toISOString(), o: 0, pc: 'p1', renseigne: P18.map(() => 7),
      trous: P18.map((p, k) => [k % 3 ? 1 : 0, k % 4 ? 0 : 1, 2 + (k % 5 === 0 ? 1 : 0), k === 7 ? 1 : 0, p + 1 + (k % 5 === 0 ? 1 : 0), p, k % 3 ? 0 : 3, p >= 4 ? 1 : 0, (k % 5) + 1, 0, 0]),
      coups: P18.map((p, k) => [{ c: p >= 4 ? 'dr' : 'f7', a: 'plein', p: 'dep', d: p >= 4 ? 200 + (i + k) % 30 : 140 + (i + k) % 15, l: (k % 7) * 4 - 12, source: 'manuel', distanceType: 'carry', id: 'c_v' + i + '_' + k }]) }));
    const t0 = Date.now();
    await charger(page, gros);
    r.chargement = Date.now() - t0;
    const t1 = Date.now();
    r.echantillon = await echantillon(page);
    await page.waitForSelector('#st-putting'); await page.waitForSelector('#st-erreurs');
    r.statistiques = Date.now() - t1;
    const t2 = Date.now();
    await ouvrirMesDonnees(page);
    r.mesDonnees = Date.now() - t2;
    r.taille = await page.evaluate(() => localStorage.getItem('coachgolf.v1').length);
    verifie(/^Sur 400 parties \(7200 trous\), du 1 janv\. 2023 au \d+ mars 2025\./.test(r.echantillon), 'volume : 400 parties analysées : ' + r.echantillon);
    verifie(r.statistiques < 6000 && r.mesDonnees < 4000, 'volume : écrans rapides (statistiques ' + r.statistiques + ' ms, mes données ' + r.mesDonnees + ' ms)');
    verifie((await lire(page)).parties.length === 400, 'volume : rien de tronqué à la sauvegarde');
    await ctx.close();
  }
  console.log(JSON.stringify({ res, ko, errs }, null, 1));
  await browser.close();
})().catch(e => { console.error('ECHEC', String(e.stack || e.message).split('\n').filter(l => !/retrying|waiting|scrolling|stable/.test(l)).slice(0, 10).join('\n')); process.exit(1); });
