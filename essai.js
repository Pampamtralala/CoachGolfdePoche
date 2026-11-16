const { chromium } = require('playwright');
const sharp = require('sharp');
const fs = require('fs');
const F = '/home/claude/polices/node_modules/@fontsource/';
const face = (fam, file, w) => `@font-face{font-family:"${fam}";font-weight:${w};font-style:normal;src:url(data:font/woff2;base64,${fs.readFileSync(F + file).toString('base64')}) format("woff2");}`;
const POLICES = [
  face('Barlow Condensed', 'barlow-condensed/files/barlow-condensed-latin-600-normal.woff2', 600),
  face('Barlow Condensed', 'barlow-condensed/files/barlow-condensed-latin-700-normal.woff2', 700),
  face('Atkinson Hyperlegible', 'atkinson-hyperlegible/files/atkinson-hyperlegible-latin-400-normal.woff2', 400),
  face('Atkinson Hyperlegible', 'atkinson-hyperlegible/files/atkinson-hyperlegible-latin-700-normal.woff2', 700),
  face('Caveat', 'caveat/files/caveat-latin-700-normal.woff2', 700)
].join('\n');

const { allerVue, menuAction } = require('./nav-essai');
/* Valeurs d'un graphique lues dans sa description (canvas aria-label). */
const valeursGraphe = (page, sel) => page.$eval(sel, c => c.getAttribute('aria-label').replace(/\.$/, '').split(' : ').slice(1).join(' : ').split(' ; ').map(x => x.replace(/^.*? (?=[+−]?\d+,\d|non mesuré)/, '')).join(' '));

(async () => {
  const sombre = !!process.env.SOMBRE, sansPolices = !!process.env.SANS_POLICES;
  const dossier = process.env.DOSSIER || 'shots';
  fs.mkdirSync(dossier, { recursive: true });
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, colorScheme: sombre ? 'dark' : 'light' });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.g|ERR_|Failed to load resource/.test(m.text())) errs.push('CONSOLE ' + m.text()); });
  const polices = async () => {
    if (sansPolices) return;
    await page.addStyleTag({ content: POLICES });
    await page.evaluate(() => Promise.all(['600 20px "Barlow Condensed"', '700 20px "Barlow Condensed"', '400 17px "Atkinson Hyperlegible"', '700 17px "Atkinson Hyperlegible"', '700 30px "Caveat"'].map(f => document.fonts.load(f))));
    await page.addStyleTag({ content: 'body.capture #onglets{display:none}' });
  };
  await page.goto('file://' + __dirname + '/dist/index.html');
  await polices();
  const vue = n => page.screenshot({ path: `${dossier}/${n}.png` });
  const long = async (n, max) => {
    await page.evaluate(() => document.body.classList.add('capture'));
    const buf = await page.screenshot({ fullPage: true });
    await page.evaluate(() => document.body.classList.remove('capture'));
    const meta = await sharp(buf).metadata(), H = 1760;
    const nb = Math.min(max || 9, Math.ceil(meta.height / H));
    for (let i = 0; i < nb; i++) {
      const h = Math.min(H, meta.height - i * H);
      await sharp(buf).extract({ left: 0, top: i * H, width: meta.width, height: h }).toFile(`${dossier}/${n}-${i + 1}.png`);
    }
    return { n, largeur: meta.width / 2, hauteur: meta.height / 2 };
  };
  const tailles = [];
  const suite = () => page.click('[data-a="q-suite"]');
  const regle = (id, v) => page.$eval('#ind-' + id, (el, v) => { el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); }, v);
  const largeurs = {};
  const mesure = async n => { largeurs[n] = await page.evaluate(() => document.documentElement.scrollWidth); };

  tailles.push(await long('01-accueil')); await mesure('accueil');
  await page.click('[data-a="commencer"]');
  await suite();
  const e1 = await page.textContent('#q-erreur');
  await page.fill('#q-prenom', 'Benjamin');
  await page.fill('#q-index', '28,4');
  await vue('02-toi'); await mesure('toi');
  await suite();
  await page.click('[data-k="objectif"][data-v="score"]');
  await page.click('[data-a="envie"][data-v="putt_court"]');
  await vue('02b-objectif');
  await suite();
  for (const l of ['practice', 'putting', 'zone', 'parcours', 'maison']) await page.click(`[data-a="lieu"][data-v="${l}"]`);
  tailles.push(await long('02c-entrainement'));
  await suite();
  await regle('drive_jeu', 3); await regle('fers_contact', 6); await regle('wedge_green', 4); await regle('app_proche', 3);
  await page.click('.mesure[data-ind="bunker_sortie"] [data-a="ind-nsp"]');
  await regle('putt_court', 7);
  await page.click('.mesure[data-ind="putt_court"] [data-a="ind-pas"][data-d="-1"]');
  await vue('03-coups'); await mesure('coups');
  await suite();
  await regle('fers_gir', 2); await regle('putt_3', 7); await regle('strat_penal', 5); await regle('strat_cata', 6);
  await suite();
  await page.click('[data-a="defaut"][data-v="slice"]');
  await page.click('[data-a="defaut"][data-v="putt_dosage_s"]');
  await vue('04-defauts'); await mesure('defauts');
  await suite();
  await page.click('[data-a="rep"][data-s="slice"][data-q="depart"][data-v="0"]');
  await page.click('[data-a="rep"][data-s="slice"][data-q="clubs"][data-v="0"]');
  await page.click('[data-a="rep"][data-s="putt_dosage_s"][data-q="sens"][data-v="1"]');
  await vue('05-precisions');
  await suite();
  await page.waitForTimeout(1500);
  tailles.push(await long('06-bilan')); await mesure('bilan');
  await allerVue(page, 'plan');
  await vue('07-plan-haut');
  tailles.push(await long('07-plan')); await mesure('plan');
  await page.click('[data-a="exo"][data-id="dr_fairway"]');
  await page.fill('#sc-val', '4'); await page.click('.score .btn');
  await page.fill('#sc-val', '6'); await page.click('.score .btn');
  await page.fill('#sc-val', '7'); await page.click('.score .btn');
  await page.waitForTimeout(400);
  await vue('08-feuille');
  await page.$eval('#feuille', el => { el.scrollTop = el.scrollHeight; });
  await vue('08-feuille-bas');
  await page.keyboard.press('Escape');
  await page.click('[data-a="fait"]');
  await allerVue(page, 'exercices');
  await vue('10-exercices'); await mesure('exercices');
  await allerVue(page, 'profil');
  tailles.push(await long('11-profil')); await mesure('profil');

  // ---- Vérifications fonctionnelles sans capture ----
  const lire = () => page.evaluate(() => JSON.parse(localStorage.getItem('coachgolf.v1')));
  const res = {};
  res.driveApresTest = (await lire()).profil.indicateurs.drive_jeu;
  // Sauvegarde : export, effacement, restauration depuis l'accueil
  await page.click('[data-a="exporter"]');
  const code = await page.inputValue('#d-code');
  await page.click('.dialogue [data-a="fermer-dialogue"]');
  await page.click('[data-a="effacer"]'); await page.click('[data-a="ok-effacer"]');
  res.apresEffacement = await page.locator('.accueil').count();
  await page.click('[data-a="importer"]'); await page.fill('#d-code', 'abc'); await page.click('[data-a="ok-importer"]');
  res.erreurImport = await page.textContent('#d-err');
  await page.fill('#d-code', code); await page.click('[data-a="ok-importer"]');
  res.apresRestauration = await page.textContent('.tete .ident');
  res.scoresRestaures = (await lire()).scores.dr_fairway.map(x => x.v);
  // Bilan de cycle : index passe à 23 (palier 3), gaucher
  await allerVue(page, 'profil');
  await page.click('[data-a="fin-cycle"]'); await page.click('[data-a="ok-cycle"]');
  await page.fill('#q-index', '23');
  await page.click('[data-k="lateralite"][data-v="G"]');
  for (let i = 0; i < 6; i++) await suite();
  const reste = await page.locator('[data-a="q-suite"]').count();
  if (reste) await suite();
  await page.waitForTimeout(300);
  const e2 = await lire();
  res.cycle = e2.cycle; res.historique = e2.historique.length; res.palierPlan = e2.plan.palier; res.premiereSeance = e2.plan.semaines[0].seances[0].id;
  res.sliceGaucher = await page.locator('.defaut header p').first().textContent();
  // Modification : sans index, maison seule, pas de parcours
  await allerVue(page, 'profil');
  await page.click('[data-a="modifier"]'); await page.click('[data-a="ok-modifier"]');
  await page.click('[data-a="sans-index"]');
  await suite(); await suite();
  for (const l of ['practice', 'putting', 'zone', 'parcours']) await page.click(`[data-a="lieu"][data-v="${l}"]`);
  await suite(); await suite();
  res.pasDeParcours = await page.getAttribute('[data-a="pas-parcours"]', 'aria-pressed');
  await suite();
  for (let i = 0; i < 3 && await page.locator('[data-a="q-suite"]').count(); i++) await suite();
  await page.waitForTimeout(300);
  const e3 = await lire();
  res.palierMaison = e3.plan.palier; res.lieuxSeanceMaison = [...new Set(e3.plan.semaines.flatMap(s => s.seances.flatMap(se => se.lieux)))];
  res.missionMaison = e3.plan.semaines[0].mission; res.cycleApresModif = e3.cycle;
  res.symptomesApres = Object.keys(e3.profil.symptomes);
  await allerVue(page, 'plan');
  await vue('12-plan-maison');
  await page.reload(); await polices();
  res.apresRechargement = await page.textContent('.tete .ident');
  console.log(JSON.stringify({ e1, tailles, largeurs, res, errs }, null, 1));
  await browser.close();
})().catch(e => { console.error('ECHEC', e.message); process.exit(1); });
