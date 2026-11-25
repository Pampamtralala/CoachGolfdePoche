/* P12 — Comprendre mon jeu : chaque question a un comportement défini (vide, insuffisant, réponse),
   et chaque chiffre cité est celui des autres moteurs (traçabilité). */
const A = require('./src/engine-analyste.js');
const EP = require('./src/engine-plus.js'), ES = require('./src/engine-stats.js'), EU = require('./src/engine-putting.js'), EC = require('./src/engine-clubs.js'), EJ = require('./src/engine-journal.js');
let ko = 0, n = 0;
function ok(c, m) { n++; if (!c) { ko++; console.log('ÉCHEC :', m); } }
const PARS = [4, 4, 3, 5, 4, 4, 3, 5, 4];
const PC = [{ id: 'p1', nom: 'La Jonchère', pars: PARS }, { id: 'p2', nom: 'Bonnat', pars: PARS }];
const ctx = { parcours: PC, cible: 18, nomClub: id => ({ dr: 'Driver', f7: 'Fer 7', b5: 'Bois 5' })[id] || id, nomParcours: id => (PC.find(p => p.id === id) || {}).nom || id, ordreClubs: ['dr', 'b5', 'f7'] };
/* trou : [jouable, gir, putts, pén, score, par, côté, club départ, putt1, evit, bunker] */
const T = p => [1, 1, 2, 0, p, p, 0, 0, 0, 0, 0];
function partie(i, o) {
  o = o || {};
  const trous = PARS.map((p, k) => {
    const t = T(p);
    if (k === 6) t[4] += o.t7 == null ? 2 : o.t7;                 /* trou 7 difficile */
    if (k === 0 && o.plus) t[4] += o.plus;
    if (k === 1 && o.droite) { t[0] = 0; t[1] = 0; t[6] = 3; t[4] += 1; }
    if (k === 4 && o.gauche) { t[0] = 0; t[1] = 0; t[6] = 1; t[4] += 1; }
    if (k === 2 && o.p3) { t[2] = 3; t[4] += 1; }
    if (k === 8 && o.pen) { t[3] = 1; t[4] += 1; }
    return t;
  });
  const coups = PARS.map((p, k) => p >= 4 ? [{ c: 'dr', a: 'plein', p: 'dep', l: k === 1 ? 20 : 2, d: 210 + (i % 3) * 5, source: 'manuel', distanceType: 'carry' }, { c: 'f7', a: 'plein', p: 'fw', l: k % 2 ? -12 : 15, d: 140, source: 'manuel', distanceType: 'carry' }] : [{ c: 'b5', a: 'plein', p: 'dep', l: 0 }]);
  return Object.assign({ id: 'p' + i, d: new Date(Date.UTC(2026, 0, 1) + i * 7 * 86400000).toISOString(), pc: i % 3 === 2 ? 'p2' : 'p1', o: 0, renseigne: PARS.map(() => 7), trous, coups }, o.note ? { note: o.note } : {});
}
/* 12 parties : les 6 premières avec trois-putts, pénalités et +3, les 6 dernières propres ; ratés à droite partout */
const L = Array.from({ length: 12 }, (_, i) => partie(i, i < 6 ? { plus: 3, p3: true, pen: true, droite: true, note: { forme: 1 } } : { droite: true, note: { forme: 3 } }));

/* Carnet vide : chaque question a un comportement défini */
A.QUESTIONS_ANALYSTE.forEach(q => { const r = A.repondre(q.id, [], ctx); ok(r && r.statut === 'vide' && r.manque && r.methode, 'carnet vide : ' + q.id); });

/* Une seule partie : insuffisant, avec ce qu'il faut saisir */
['score', 'troisPutts', 'putts', 'mej', 'penalites', 'club', 'trous', 'parcours', 'forme'].forEach(id => {
  const r = A.repondre(id, [partie(0)], ctx); ok(r.statut === 'insuffisant' && /Il faut|Choisis/.test(r.manque), 'une partie, insuffisant et dit quoi saisir : ' + id + ' → ' + r.manque);
});

/* Score : chiffres = moyennes de tableauStats */
const sc = A.repondre('score', L, ctx), pp = ES.tableauStats(L).parPartie;
const moy = l => l.reduce((t, x) => t + x.ecart18, 0) / l.length;
ok(sc.statut === 'ok' && sc.sens === 'mieux', 'score : mieux');
ok(sc.chiffres[0].val === '+' + moy(pp.slice(0, 6)).toFixed(1).replace('.', ',') && sc.chiffres[1].val === '+' + moy(pp.slice(6)).toFixed(1).replace('.', ','), 'score : chiffres tracés : ' + JSON.stringify(sc.chiffres));
ok(/^Oui, plutôt : \+\d+,\d sur tes 6 dernières parties, contre \+\d+,\d sur les 6 d.avant/.test(sc.phrase) && sc.effectifs.parties === 12 && sc.periode.du === pp[0].d, 'score : phrase, période et effectif : ' + sc.phrase);
/* Pas de différence nette sous le seuil */
const stable = Array.from({ length: 8 }, (_, i) => partie(i, { plus: i % 2 }));
ok(A.repondre('score', stable, ctx).sens === 'stable' && /^Pas de différence nette/.test(A.repondre('score', stable, ctx).phrase), 'score : pas de différence nette sous 1,5 coup');

/* Trois-putts et putting : chiffres = agregatPutts */
const tp = A.repondre('troisPutts', L, ctx);
const g1 = EU.agregatPutts([].concat(...L.slice(0, 6).map(p => p.trous))), g2 = EU.agregatPutts([].concat(...L.slice(6).map(p => p.trous)));
ok(tp.sens === 'mieux' && tp.chiffres[0].val === g1.partTrois + ' %' && tp.chiffres[1].val === g2.partTrois + ' %' && /^Oui, ils diminuent/.test(tp.phrase), 'trois-putts : ' + tp.phrase);
ok(A.repondre('putts', L, ctx).sens === 'mieux', 'putting : progresse');
ok(A.repondre('penalites', L, ctx).sens === 'mieux' && /^Oui, elles baissent : 0,0 pour 18 trous/.test(A.repondre('penalites', L, ctx).phrase), 'pénalités : ' + A.repondre('penalites', L, ctx).phrase);
/* Mises en jeu : pas de différence (mêmes ratés partout), non renseignées exclues */
const mj = A.repondre('mej', L, ctx);
ok(mj.sens === 'stable' && mj.chiffres[0].base === '42 mises en jeu renseignées', 'mises en jeu : stables, effectif cité : ' + JSON.stringify(mj.chiffres));
const express = L.map(p => Object.assign({}, p, { renseigne: PARS.map(() => 0) }));
ok(A.repondre('mej', express, ctx).statut === 'insuffisant' && /saisie Standard ou Expert/.test(A.repondre('mej', express, ctx).manque), 'mises en jeu en express : insuffisant, et dit quoi faire');

/* Côtés : 12 ratés à droite, aucun à gauche */
const co = A.repondre('cotes', L, ctx);
ok(co.cote === 'droite' && /^Oui, plutôt à droite : 12 mises en jeu ratées à droite contre 0 à gauche/.test(co.phrase), 'côtés : ' + co.phrase);

/* Club le plus régulier : chiffres = profilClub */
const cl = A.repondre('club', L, ctx), pdr = EC.profilClub(L, 'dr'), pf7 = EC.profilClub(L, 'f7'), pb5 = EC.profilClub(L, 'b5');
ok(cl.statut === 'ok' && cl.chiffres[0].lib === 'Bois 5' && cl.chiffres[0].val === pb5.direction.partCentre + ' % dans l\'axe' && cl.chiffres.find(x => x.lib === 'Fer 7').val === pf7.direction.partCentre + ' % dans l\'axe', 'club : classement tracé : ' + cl.phrase);

/* Distance : chiffres = profilClub.distance, estimations exclues */
const di = A.repondre('distance', L, ctx);
ok(di.statut === 'ok' && di.chiffres.find(x => x.lib === 'Driver').val === '≈ ' + pdr.distance.valeur + ' m' && /^Au driver, environ \d+ m/.test(di.phrase), 'distance : ' + di.phrase);

/* Trous difficiles : le trou 7 en tête, chiffres = analyseParcours */
const tr = A.repondre('trous', L, ctx), an = EP.analyseParcours(L, PC[0]);
ok(/^À La Jonchère : trou 7 \(\+2,0 en moyenne sur 8 passages\)/.test(tr.phrase) && an.trous[6].N === 8, 'trous : ' + tr.phrase);

/* Parcours : deux parcours, écart cité */
const pa = A.repondre('parcours', L, ctx);
ok(pa.statut === 'ok' && pa.chiffres.length === 2 && /la difficulté des parcours n.est pas prise en compte/.test(pa.phrase), 'parcours : ' + pa.phrase);

/* Secteur : = coupsGagnes, libellé « estimation » et « pas du Strokes Gained » */
const se = A.repondre('secteur', L, ctx), cg = EP.coupsGagnes(L, 18);
ok(/^Estimation/.test(se.phrase) && /pas du Strokes Gained/.test(se.phrase) && se.chiffres.length === cg.secteurs.length, 'secteur : ' + se.phrase);

/* Forme : = associationsNotes */
const fo = A.repondre('forme', L, ctx), as = EJ.associationsNotes(L).find(x => x.id === 'forme');
ok(fo.statut === 'ok' && fo.chiffres[0].val === '+' + as.haut.ecart18.toFixed(1).replace('.', ',') && /association, pas une cause/.test(fo.phrase), 'forme : ' + fo.phrase);

/* Recherche par mots-clés */
ok(A.chercherQuestions('trois putts')[0] === 'troisPutts' && A.chercherQuestions('Mon DRIVER va où ?')[0] === 'distance' && A.chercherQuestions('je slice à droite')[0] === 'cotes' && A.chercherQuestions('xyz').length === 0 && A.chercherQuestions('').length === 12, 'recherche par mots-clés');

console.log(n + ' vérifications · ' + ko + ' échec' + (ko > 1 ? 's' : ''));
process.exit(ko ? 1 : 0);
