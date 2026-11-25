/* P12 : Comprendre mon jeu — carnet vide, réponses traçables (chiffres, période, effectif), données insuffisantes,
   recherche par mots-clés, périodes, accès depuis l'accueil et les statistiques. */
const { chromium } = require('playwright');
const fs = require('fs');
const CLE = 'coachgolf.v1';
const PARS = [4, 4, 3, 5, 4, 4, 3, 5, 4];
const norm = s => s.replace(/[\s  ]+/g, ' ').trim();
(async () => {
  const D = 'shots27'; fs.mkdirSync(D, { recursive: true });
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const res = {}, errs = [], ko = [];
  const verifie = (c, m) => { if (!c) ko.push(m); };
  const maintenant = Date.now();
  const T = p => [1, 1, 2, 0, p, p, 0, 0, 0, 0, 0];
  const partie = (i, joursAvant, o) => {
    o = o || {};
    return { id: 'p_essai' + (8000 + i), d: new Date(maintenant - joursAvant * 86400000).toISOString(), o: 0, pc: 'p1', renseigne: PARS.map(() => 7),
      trous: PARS.map((p, k) => { const t = T(p); if (k === 6) t[4] += 2; if (k === 0 && o.plus) t[4] += o.plus; if (k === 2 && o.p3) { t[2] = 3; t[4] += 1; } if (k === 1) { t[0] = 0; t[1] = 0; t[6] = 3; t[4] += 1; } return t; }) };
  };
  for (const [w, h, sombre] of [[390, 844, false], [360, 760, true]]) {
    const nom = w + (sombre ? 's' : ''), r = res[nom] = {};
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, colorScheme: sombre ? 'dark' : 'light', hasTouch: true, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    page.on('pageerror', e => errs.push(nom + ' ' + e.message));
    await page.goto('file://' + __dirname + '/dist/index.html');
    /* Premier lancement « carnet », carnet vide */
    await page.click('[data-a="ac-sans-index"]'); await page.click('.carnet-form button[type="submit"]');
    await page.waitForSelector('.tete');
    r.raccourcis = await page.$$eval('.comprendre [data-a="an-ouvrir"]', l => l.map(x => x.textContent.trim()));
    verifie(r.raccourcis.length === 5 && /Est-ce que je score mieux/.test(r.raccourcis[0]), nom + ' raccourcis sur l\'accueil : ' + r.raccourcis.join(' | '));
    await page.click('.comprendre [data-a="an-ouvrir"][data-v="score"]');
    await page.waitForSelector('#feuille.analyste #an-rep-score');
    r.vide = norm(await page.textContent('#an-rep-score'));
    verifie(/aucune partie/.test(r.vide) && /Pour commencer Enregistre une partie/.test(r.vide), nom + ' carnet vide : ' + r.vide);
    verifie(await page.locator('#feuille .an-q').count() === 12, nom + ' douze questions');
    await page.click('#feuille [data-a="fermer-feuille"]#f-fermer');
    /* Douze parties : 6 anciennes à +3 et trois-putts, 6 récentes propres */
    const e = await page.evaluate(k => JSON.parse(localStorage.getItem(k)), CLE);
    e.parcours = [{ id: 'p1', nom: 'La Jonchère', pars: PARS }];
    e.parties = Array.from({ length: 12 }, (_, i) => partie(i, 300 - i * 20, i < 6 ? { plus: 3, p3: true } : {}));
    e.maj = Date.now();
    await page.evaluate(([k, v]) => localStorage.setItem(k, JSON.stringify(v)), [CLE, e]);
    await page.reload(); await page.waitForSelector('.tete');
    /* Depuis les statistiques */
    await page.click('#barre [data-a="onglet"][data-v="bilan"]');
    await page.click('[data-a="an-ouvrir"]');
    await page.waitForSelector('#feuille.analyste');
    await page.click('#feuille [data-a="an-question"][data-v="score"]');
    r.score = norm(await page.textContent('#an-rep-score .an-phrase'));
    r.scoreSource = norm(await page.textContent('#an-rep-score .an-source'));
    r.scoreChiffres = await page.$$eval('#an-rep-score .an-chiffres tr', l => l.map(x => [...x.children].map(c => [...c.childNodes].map(n => n.textContent).join(' ')).join(' | ').replace(/[\s  ]+/g, ' ')));
    verifie(/^Oui, plutôt : \+6,0 sur tes 6 dernières parties, contre \+14,0 sur les 6 d.avant/.test(r.score), nom + ' réponse score : ' + r.score);
    verifie(/^Du .* au .* · 12 parties, 108 trous\.$/.test(r.scoreSource) && r.scoreChiffres.length === 2, nom + ' période et effectif cités : ' + r.scoreSource);
    await page.click('#an-rep-score .an-methode summary');
    verifie(/Différence nette à partir de 1,5 coup/.test(await page.textContent('#an-rep-score .an-methode')), nom + ' méthode consultable');
    await page.locator('#feuille').screenshot({ path: `${D}/${nom}-01-score.png` });
    /* Trois-putts, côtés, trous */
    await page.click('#feuille [data-a="an-question"][data-v="troisPutts"]');
    r.tp = norm(await page.textContent('#an-rep-troisPutts .an-phrase'));
    verifie(/^Oui, ils diminuent : 0 % sur tes 6 dernières parties, contre 11 % sur les 6 d.avant/.test(r.tp) && !(await page.locator('#an-rep-score').count()), nom + ' trois-putts (une réponse ouverte à la fois) : ' + r.tp);
    await page.click('#feuille [data-a="an-question"][data-v="cotes"]');
    r.cotes = norm(await page.textContent('#an-rep-cotes .an-phrase'));
    verifie(/^Oui, plutôt à droite : 12 mises en jeu ratées à droite contre 0 à gauche/.test(r.cotes), nom + ' côtés : ' + r.cotes);
    await page.click('#feuille [data-a="an-question"][data-v="trous"]');
    r.trous = norm(await page.textContent('#an-rep-trous .an-phrase'));
    verifie(/^À La Jonchère : trou 7 \(\+2,0 en moyenne sur 12 passages\)/.test(r.trous), nom + ' trous difficiles : ' + r.trous);
    /* Données insuffisantes : ce qu'il faut saisir */
    await page.click('#feuille [data-a="an-question"][data-v="club"]');
    r.club = norm(await page.textContent('#an-rep-club'));
    verifie(/Pour répondre Il faut au moins 2 clubs avec 10 coups notés avec une direction/.test(r.club) && /saisie Expert/.test(r.club), nom + ' club : ce qu\'il faut saisir : ' + r.club);
    /* Période : trois mois → moins de parties, comparaison refusée proprement */
    await page.click('#feuille [data-a="an-periode"][data-v="trimestre"]');
    await page.click('#feuille [data-a="an-question"][data-v="score"]');
    r.trimestre = norm(await page.textContent('#an-rep-score'));
    verifie(/Pas encore assez de parties complètes/.test(r.trimestre) && /tu en as [0-5] sur cette période/.test(r.trimestre), nom + ' trois mois : ' + r.trimestre);
    await page.click('#feuille [data-a="an-periode"][data-v="toutes"]');
    /* Recherche par mots-clés */
    await page.fill('#an-recherche', 'trois putts');
    r.recherche = await page.$$eval('#feuille .an-q', l => l.map(x => x.textContent));
    verifie(r.recherche.length === 2 && /trois-putts/.test(r.recherche[0]), nom + ' recherche « trois putts » : ' + r.recherche.join(' | '));
    verifie(await page.evaluate(() => document.activeElement && document.activeElement.id) === 'an-recherche', nom + ' le champ garde le focus pendant la recherche');
    await page.fill('#an-recherche', 'xyzzy');
    r.rien = norm(await page.textContent('#an-liste'));
    verifie(/Aucune question ne correspond/.test(r.rien), nom + ' recherche sans résultat : ' + r.rien);
    await page.fill('#an-recherche', 'driver');
    r.driver = await page.$$eval('#feuille .an-q', l => l.map(x => x.textContent));
    verifie(/distance au driver/.test(r.driver[0]), nom + ' recherche « driver » : ' + r.driver.join(' | '));
    r.largeur = await page.evaluate(() => document.documentElement.scrollWidth);
    verifie(r.largeur === w, nom + ' pas de débordement : ' + r.largeur);
    await ctx.close();
  }
  console.log(JSON.stringify({ res, ko, errs }, null, 1));
  await browser.close();
})().catch(e => { console.error('ECHEC', String(e.stack || e.message).split('\n').filter(l => !/retrying|waiting|scrolling|stable/.test(l)).slice(0, 10).join('\n')); process.exit(1); });
