/* P06 — profil des clubs : direction, arrivées, mises en jeu, distance indicative, tendance, départs par famille, comparaison. */
const K = require('./src/engine-clubs.js');
let ko = 0, n = 0;
function ok(c, m) { n++; if (!c) { ko++; console.log('ÉCHEC :', m); } }
/* trou : [jouable, gir, putts, pén, score, par, côté, club départ, putt1, evit, bunker] */
const trou = (par, score, putts, opt) => Object.assign([1, 0, putts, 0, score, par, 0, 0, 0, 0, 0], opt || {});
const coup = (c, o) => Object.assign({ c, a: 'plein' }, o || {});

/* Partie 1 (ancienne, sans « renseigne ») : 3 trous */
const p1 = { id: 'p_a', d: '2026-09-01T10:00:00.000Z', trous: [
  trou(4, 5, 2, { 7: 1 }),                                  /* driver, jouable */
  trou(4, 6, 2, { 0: 0, 6: 1, 3: 1, 7: 1 }),                /* driver, ratée à gauche, pénalité */
  trou(3, 3, 2)
], coups: [
  [coup('dr', { p: 'dep', l: -2, d: 210, source: 'gps', distanceType: 'total' }), coup('f7', { p: 'fw', l: 8, d: 140, source: 'manuel' })],
  [coup('dr', { p: 'dep', l: -25 }), coup('f7', { p: 'ro', t: 'rec' }), coup('f9', { p: 'fw', l: 0 })],
  [coup('f7', { p: 'dep', l: 3, d: 150, source: 'manuel' })]
] };
/* Partie 2 (standard, renseignée) */
const p2 = { id: 'p_b', d: '2026-10-01T10:00:00.000Z', renseigne: [3, 1, 0], trous: [
  trou(5, 6, 2, { 7: 1 }),
  trou(4, 5, 2, { 0: 0, 6: 3 }),
  trou(4, 5, 2)
], coups: [
  [coup('dr', { p: 'dep', l: 12 }), coup('b5', { p: 'ro' }), coup('f9', { p: 'bk', dm: 1, d: 120 })],
  [coup('dr', { p: 'dep', l: 30 })],
  [coup('dr', { p: 'dep' })]
] };
const parties = [p1, p2];

/* Arrivées */
ok(K.arriveeCoup(p1.coups[0], 0, p1.trous[0]) === 'jeu', 'arrivée : coup suivant sur le fairway');
ok(K.arriveeCoup(p1.coups[1], 0, p1.trous[1]) === 'rough', 'arrivée : rough');
ok(K.arriveeCoup(p1.coups[2], 0, p1.trous[2]) === 'green', 'arrivée : dernier coup, compte du trou cohérent → green');
ok(K.arriveeCoup(p2.coups[1], 0, p2.trous[1]) === null, 'arrivée : dernier coup sans compte cohérent → inconnue');

const dr = K.profilClub(parties, 'dr');
ok(dr.n === 5 && dr.parties === 2 && dr.premier === '2026-09-01' && dr.dernier === '2026-10-01', 'driver : 5 coups, 2 parties : ' + JSON.stringify([dr.n, dr.parties, dr.premier, dr.dernier]));
ok(dr.direction.n === 4 && dr.direction.gauche === 1 && dr.direction.centre === 1 && dr.direction.droite === 2, 'driver : direction 1 / 1 / 2 : ' + JSON.stringify(dr.direction));
ok(dr.arrivees.n === 3 && dr.arrivees.jeu === 1 && dr.arrivees.rough === 2 && dr.arrivees.inconnues === 2, 'driver : arrivées : ' + JSON.stringify(dr.arrivees));
/* Départs : p1 trous 1-2 (anciens, connus), p2 trou 1 (renseigné, jouable), p2 trou 2 (renseigné, ratée à droite), p2 trou 3 (non renseigné) */
ok(dr.departs.departs === 5 && dr.departs.n === 4 && dr.departs.jouables === 2 && dr.departs.gauche === 1 && dr.departs.droite === 1 && dr.departs.inconnues === 1 && dr.departs.avecPenalite === 1,
  'driver : mises en jeu (non renseignée exclue) : ' + JSON.stringify(dr.departs));
ok(dr.departs.part === 50, 'driver : 50 % jouables');
ok(dr.distance.valeur === null && dr.distance.n === 1, 'driver : une seule mesure → pas de distance');

const f7 = K.profilClub(parties, 'f7');
ok(f7.distance.n === 2 && f7.distance.valeur === null, 'fer 7 : le recentrage ne compte pas, 2 mesures → pas de distance : ' + JSON.stringify(f7.distance));
const f9 = K.profilClub(parties, 'f9');
ok(f9.distance.n === 0, 'fer 9 : une estimation (dm) n\'entre jamais dans la distance');

/* Distance indicative : arrondie à 5 m, GPS compté à part */
const dist = K.distanceIndicative([142, 151, 148, 139].map((d, i) => ({ coup: { c: 'f7', d, source: i ? 'manuel' : 'gps' } })));
ok(dist.valeur === 145 && dist.min === 140 && dist.max === 150 && dist.gps === 1 && dist.n === 4, 'distance indicative arrondie à 5 m : ' + JSON.stringify(dist));

/* Tendance : 12 coups, d'abord à droite, puis dans l'axe */
const tend = { id: 'p_t', d: '2026-11-01T10:00:00.000Z', trous: Array(12).fill(0).map(() => trou(4, 5, 2)),
  coups: Array(12).fill(0).map((_, i) => [coup('b3', { p: 'fw', l: i < 6 ? 20 : 1 }), coup('pw', { p: i < 6 ? 'ro' : 'fw' })]) };
const b3 = K.profilClub([tend], 'b3');
ok(b3.tendance && b3.tendance.axe.avant === 0 && b3.tendance.axe.apres === 100 && b3.tendance.enJeu.d === 100, 'tendance : plus droit et plus en jeu : ' + JSON.stringify(b3.tendance));
ok(K.profilClub(parties, 'dr').tendance === null, 'tendance : null sous 10 coups');

/* Clubs notés, dans l'ordre du sac */
const cl = K.clubsNotes(parties, ['dr', 'b5', 'f7', 'f9']);
ok(cl.map(x => x.club).join() === 'dr,b5,f7,f9' && cl[0].n === 5, 'clubs notés dans l\'ordre du sac : ' + JSON.stringify(cl));

/* Départs par famille (saisie standard) : club de départ non renseigné exclu */
const fam = K.departsParFamille(parties);
ok(fam.length === 1 && fam[0].famille === 'dr' && fam[0].departs === 3 && fam[0].n === 3 && fam[0].jouables === 2 && fam[0].gauche === 1,
  'départs par famille : ' + JSON.stringify(fam));

/* Comparaison de deux clubs */
const c = K.comparerClubs(dr, f7), ligne = id => c.filter(x => x.id === id)[0];
ok(ligne('coups').a.v === 5 && ligne('coups').b.v === 3 && ligne('axe').comparable, 'comparaison : effectifs et lignes comparables');
ok(ligne('distance').comparable === false && ligne('mej').b.v === null && ligne('mej').b.n === 0, 'comparaison : sans mesure ni départ, lignes non comparables : ' + JSON.stringify(ligne('mej')));

/* Aucun coup */
const vide = K.profilClub([], 'dr');
ok(vide.n === 0 && vide.direction.n === 0 && vide.distance.valeur === null && vide.tendance === null && vide.departs.part === null, 'aucun coup : profil vide sans erreur');

console.log(n + ' vérifications · ' + ko + ' échec' + (ko > 1 ? 's' : ''));
process.exit(ko ? 1 : 0);
