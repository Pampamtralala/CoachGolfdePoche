/* P01 — statuts de distance : GPS, déclarée, estimée, inconnue. Une estimation n'est jamais une mesure. */
const E = require('./src/engine-plus.js');
let ko = 0, n = 0;
function ok(c, m) { n++; if (!c) { ko++; console.log('ÉCHEC :', m); } }

const decl = { c: 'f7', d: 150, a: 'plein', source: 'manuel', distanceType: 'carry' };
const gps = { c: 'f7', d: 162, a: 'plein', source: 'gps', distanceType: 'total', g: [46, 2, 46.001, 2] };
const vide = { c: 'f7', d: null, a: 'plein', source: 'inconnu', distanceType: 'inconnu' };
const ancienne = { c: 'f7', d: 148, a: 'plein' };                                   /* avant le 19/11 : pas de provenance */
const ancienneGps = { c: 'f7', d: 155, a: 'plein', g: [46, 2, 46.001, 2] };
const estimee23 = { c: 'f7', d: 151, a: 'plein', dm: 1 };                          /* enregistrée le 23/11 avec la moyenne */
const demi = { c: 'sw', d: null, a: 'demi' };
const recentrage = { c: 'f7', d: null, a: 'plein', t: 'rec' };

ok(E.statutDistance(decl) === 'declaree' && E.statutDistance(gps) === 'gps' && E.statutDistance(vide) === 'inconnue', 'statuts de base');
ok(E.statutDistance(ancienne) === 'declaree' && E.statutDistance(ancienneGps) === 'gps' && E.statutDistance(estimee23) === 'estimee' && E.statutDistance(null) === 'inconnue', 'anciennes données');

const moy = { f7: 150.4, sw: 80 };
ok(JSON.stringify(E.distanceCoup(vide, moy)) === '{"v":150,"statut":"estimee"}', 'sans distance : moyenne en estimation');
ok(E.distanceCoup(vide, {}).statut === 'inconnue' && E.distanceCoup(vide, null).v === null, 'sans moyenne fiable : inconnue');
ok(E.distanceCoup(demi, moy).statut === 'inconnue' && E.distanceCoup(recentrage, moy).statut === 'inconnue', 'pas d\'estimation pour un demi-swing ni un recentrage');
ok(E.distanceCoup(decl, moy).v === 150 && E.distanceCoup(gps, moy).statut === 'gps', 'une vraie distance reste la sienne');

/* Les moyennes du sac ne prennent que les distances déclarées en plein coup */
const parties = [{ d: '2026-11-20', o: 0, coups: [[decl, gps, vide, ancienne, estimee23, recentrage]] }];
const m = E.mesuresParcours(parties);
ok(m.clubs.f7.join() === '150,148', 'sac : déclarées seulement (GPS total, estimations, vides exclus) : ' + JSON.stringify(m.clubs));

/* Observations : statut explicite, estimations jamais présentées comme observées */
const obs = E.observationsGolf(parties, { series: [{ d: '2026-11-21', c: 'pw', v: [100, 104], l: [-3, null] }] });
const st = obs.map(o => o.distanceStatut).join();
ok(st === 'declaree,gps,inconnue,declaree,inconnue,inconnue,declaree,declaree', 'statuts des observations : ' + st);
ok(obs[4].distance === null && obs[2].distance === null, 'estimation et vide : distance null');
ok(obs[0].direction === null && E.observationsGolf([{ coups: [[{ c: 'dr', l: -12 }]] }])[0].direction === -12, 'direction gauche / droite dans les observations');
const q = E.qualiteObservations(obs);
ok(q.statuts.declaree === 4 && q.statuts.gps === 1 && q.statuts.inconnue === 3 && q.direction === 1, 'qualité : effectifs par statut ' + JSON.stringify(q.statuts));

console.log(n + ' vérifications · ' + ko + ' échec' + (ko > 1 ? 's' : ''));
process.exit(ko ? 1 : 0);
