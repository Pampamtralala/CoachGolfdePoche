/* P10 — estimation des coups perdus : mises en jeu inconnues jamais comptées réussies, écart au jeu habituel, limites. */
const E = require('./src/engine-plus.js');
const X = require('./src/engine-estimation.js');
let ko = 0, n = 0;
function ok(c, m) { n++; if (!c) { ko++; console.log('ÉCHEC :', m); } }
const PARS = [4, 4, 3, 5, 4, 4, 3, 5, 4];
/* trou : [jouable, gir, putts, pén, score, par, côté, club départ, putt1, evit, bunker] */
const T = (par, o) => { const t = [1, 1, 2, 0, par, par, 0, 0, 0, 0, 0]; Object.assign(t, o || {}); return t; };
/* Une partie de 9 trous : nRates départs ratés (green manqué) sur les par 4/5, nPutts3 trois-putts, nPen pénalités */
function partie(i, o) {
  o = o || {};
  const trous = PARS.map((p, k) => {
    const t = T(p);
    if (p >= 4 && k < (o.rates || 0) * 2 && k % 2 === 0) { t[0] = 0; t[1] = 0; t[2] = 2; t[4] = p + 1; }
    if (k === 2 && o.putts3) { t[2] = 3; t[4] = p + 1; }
    if (k === 8 && o.pen) { t[3] = 1; t[4] += 1; }
    return t;
  });
  const r = { id: 'p' + i, d: new Date(Date.UTC(2026, 0, 1) + i * 86400000 * 7).toISOString(), trous };
  if (o.express) r.renseigne = PARS.map(() => 0);
  return r;
}

/* 1. Mises en jeu ratées : le secteur départ est négatif face à une cible exigeante */
const avecRates = Array.from({ length: 4 }, (_, i) => partie(i, { rates: 3 }));
const sansRates = Array.from({ length: 4 }, (_, i) => partie(i, {}));
const gR = E.coupsGagnes(avecRates, 10), gS = E.coupsGagnes(sansRates, 10);
const dep = g => g.secteurs.find(s => s.id === 'depart').sg;
ok(gR.departConnu && dep(gR) < dep(gS), 'plus de départs ratés : secteur départ plus bas (' + dep(gR) + ' < ' + dep(gS) + ')');
ok(Math.abs(gR.total - gR.secteurs.reduce((a, s) => a + (s.sg || 0), 0)) < 0.15, 'total = somme des secteurs (arrondis)');

/* 2. Saisie express : les mêmes ratés non renseignés ne rendent jamais le départ meilleur */
const express = Array.from({ length: 4 }, (_, i) => partie(i, { rates: 3, express: true }));
const gE = E.coupsGagnes(express, 10);
ok(!gE.departConnu && dep(gE) === null, 'mises en jeu inconnues : départ non estimé (au lieu d\'être compté réussi)');
ok(gE.secteurs.find(s => s.id === 'attaque').nom === 'Attaques de green (départ compris)', 'départ compris dans les attaques, libellé explicite');
ok(gE.mej.inconnus === 28 && gE.mej.connus === 0 && gE.mej.departs === 28, 'couverture : 28 départs inconnus, aucun connu : ' + JSON.stringify(gE.mej));
/* Partiellement renseigné : estimé sur les trous connus seulement */
const mixte = avecRates.slice(0, 2).concat(express.slice(2));
const gM = E.coupsGagnes(mixte, 10);
ok(gM.departConnu && gM.joueur.u === gR.joueur.u, 'partiellement renseigné : même taux de départs ratés sur les trous connus (' + gM.joueur.u + ' = ' + gR.joueur.u + ')');

/* 3. Anciennes parties sans tableau « renseigne » : comportement inchangé */
ok(E.coupsGagnes(avecRates, 10).mej.inconnus === 0, 'anciennes parties : mises en jeu comptées comme renseignées');

/* 4. Limites et fiabilité */
const L = X.limitesEstimation(gE);
ok(L.fiabilite === 'indicative' && L.limites.some(x => x.id === 'mej') && L.limites.some(x => x.id === 'putt1'), 'limites : mises en jeu et premier putt signalés, fiabilité « indicative » à 36 trous');
ok(X.limitesEstimation(E.coupsGagnes([partie(0, {}), partie(1, {})], 10)).fiabilite === 'tendance', 'fiabilité « tendance » sous 36 trous');
ok(X.limitesEstimation(E.coupsGagnes(Array.from({ length: 10 }, (_, i) => partie(i, {})), 10)).fiabilite === 'établie', 'fiabilité « établie » à 72 trous et plus');

/* 5. Écart au jeu habituel : 10 parties normales puis 3 avec trois-putts et pénalités */
const hist = Array.from({ length: 10 }, (_, i) => partie(i, { rates: 1 })).concat(Array.from({ length: 3 }, (_, i) => partie(10 + i, { rates: 1, putts3: true, pen: true })));
const H = X.ecartsHabituels(hist), sec = id => H.secteurs.find(s => s.id === id).ecart;
ok(H.ok && H.recent.parties === 5 && H.base.parties === 8, 'écart habituel : 5 dernières parties contre les 8 d\'avant : ' + JSON.stringify([H.recent && H.recent.parties, H.base && H.base.parties]));
ok(sec('putting') < 0 && sec('penal') < 0, 'putting et pénalités en recul : ' + sec('putting') + ' / ' + sec('penal'));
ok(sec('depart') === 0 && sec('attaque') === 0, 'départs et greens comme d\'habitude : 0');
ok(H.scoreEcart < 0, 'score moins bon que d\'habitude : ' + H.scoreEcart);
/* Jeu identique : aucun écart */
const pareil = X.ecartsHabituels(Array.from({ length: 13 }, (_, i) => partie(i, { rates: 1 })));
ok(pareil.ok && pareil.secteurs.every(s => s.ecart === 0 || s.ecart === null) && pareil.total === 0, 'jeu identique : tous les écarts à 0');
/* Données insuffisantes */
const peu = X.ecartsHabituels(Array.from({ length: 4 }, (_, i) => partie(i, {})));
ok(!peu.ok && peu.raison === 'trous' && peu.manqueBase === 72 - 18, 'trop peu de parties : refus motivé, il manque ' + peu.manqueBase + ' trous de référence');
ok(!X.ecartsHabituels([]).ok && X.ecartsHabituels([]).raison === 'parties', 'carnet vide : refus motivé');

console.log(n + ' vérifications · ' + ko + ' échec' + (ko > 1 ? 's' : ''));
process.exit(ko ? 1 : 0);
