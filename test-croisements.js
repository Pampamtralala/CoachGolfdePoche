/* P01 (3/3) — croiser les observations par club, trou, parcours et période. */
const I = require('./src/engine-donnees.js');
const E = require('./src/engine-plus.js');
let ko = 0, n = 0;
function ok(c, m) { n++; if (!c) { ko++; console.log('ÉCHEC :', m); } }

const parcours = [{ id: 'jon', pars: Array(18).fill(4) }, { id: 'neuf', pars: Array(9).fill(4) }];
const coup = (c, d, l, src) => ({ c, d, a: 'plein', l, source: src || (d != null ? 'manuel' : 'inconnu'), distanceType: src === 'gps' ? 'total' : d != null ? 'carry' : 'inconnu' });
const parties = [
  { id: 'p_aaaa1', d: '2026-10-05', pc: 'jon', o: 0, coups: [[coup('dr', 220, -12), coup('f7', 150, 2)], [coup('dr', 210, 9)], [coup('dr', null, -3)]] },
  { id: 'p_aaaa2', d: '2026-11-12', pc: 'jon', o: 9, coups: [[coup('dr', 230, -20), coup('f7', 160, null, 'gps')]] },   /* retour : trou 10 */
  { id: 'p_aaaa3', d: '2026-11-20', pc: 'neuf', o: 0, coups: Array.from({ length: 18 }, (_, t) => t === 9 ? [coup('f7', 148, 6)] : t === 0 ? [coup('dr', 200, 0)] : []) },   /* 2 × 9 trous */
  { id: 'p_aaaa4', d: '2026-11-21', pc: 'jon', o: 0, coups: [[Object.assign(coup('f7', 151, 1), { dm: 1 })]] }   /* estimation du 23/11 */
];
const carnet = { series: [{ id: 's_aaaa1', d: '2026-11-01', c: 'f7', v: [148, 152], l: [-6, null] }] };
const obs = E.observationsGolf(parties, carnet, parcours);

ok(obs.filter(o => o.type === 'coup').every(o => 'parcours' in o && 'jour' in o && 'trouParcours' in o), 'observations : parcours, jour, trou du parcours');
ok(obs.find(o => o.partieId === 'p_aaaa3' && o.club === 'f7').trouParcours === 1 && obs.find(o => o.partieId === 'p_aaaa2' && o.club === 'dr').trouParcours === 10, '9 trous joué deux fois : trou 10 → trou 1 ; retour d\'un 18 trous : trou 10');

/* Par club */
const club = I.croiserObservations(obs, 'club');
const dr = club.find(g => g.cle === 'dr'), f7 = club.find(g => g.cle === 'f7');
ok(dr.n === 5 && dr.distances.n === 4 && dr.distances.moyenne === 215 && dr.distancesInconnues === 1, 'driver : 5 coups, 4 distances déclarées, moyenne 215 : ' + JSON.stringify(dr.distances));
ok(dr.direction.n === 5 && dr.direction.gauche === 2 && dr.direction.droite === 1 && dr.direction.centre === 2 && dr.direction.partGauche === 40, 'driver : 2 à gauche, 1 à droite, 2 au centre (seuil 5 m) : ' + JSON.stringify(dr.direction));
ok(f7.n === 6 && f7.distances.n === 4 && f7.distances.moyenne === 150 && f7.distancesGps.n === 1 && f7.distancesGps.moyenne === 160 && f7.distancesInconnues === 1, 'fer 7 : GPS à part, estimation jamais comptée : ' + JSON.stringify([f7.distances, f7.distancesGps, f7.distancesInconnues]));
ok(f7.direction.n === 4, 'directions inconnues non comptées');

/* Par trou : rapproché entre parties du même parcours, séparé entre parcours */
const trou = I.croiserObservations(obs, 'trou');
ok(trou.find(g => g.cle === 'jon#1').n === 3 && trou.find(g => g.cle === 'neuf#1').n === 2 && trou.find(g => g.cle === 'jon#10').n === 2 && !trou.some(g => g.cle.startsWith('practice')), 'par trou : ' + trou.map(g => g.cle + '=' + g.n).join(' '));

/* Par parcours et par période */
const pc = I.croiserObservations(obs, 'parcours');
ok(pc.find(g => g.cle === 'jon').n === 7 && pc.find(g => g.cle === 'neuf').n === 2 && pc.find(g => g.cle === 'practice').n === 2, 'par parcours : ' + pc.map(g => g.cle + '=' + g.n).join(' '));
const per = I.croiserObservations(obs, 'periode');
ok(per.find(g => g.cle === '2026-10').n === 4 && per.find(g => g.cle === '2026-11').n === 7, 'par mois : ' + per.map(g => g.cle + '=' + g.n).join(' '));

/* Filtres cumulables */
const f = I.croiserObservations(obs, 'club', { parcours: 'jon', debut: '2026-11-01' });
ok(f.length === 2 && f.find(g => g.cle === 'dr').n === 1 && f.find(g => g.cle === 'f7').premier === '2026-11-12', 'filtres parcours + période : ' + f.map(g => g.cle + '=' + g.n).join(' '));
ok(I.croiserObservations(obs, 'club', { club: 'f7', type: 'practice' })[0].n === 2 && I.croiserObservations(obs, 'trou', { trou: 1, parcours: 'neuf' })[0].n === 2, 'filtres club / type / trou');
ok(I.croiserObservations(obs, 'club', { seuil: 10 }).find(g => g.cle === 'dr').direction.gauche === 2 && I.croiserObservations(obs, 'club', { seuil: 10 }).find(g => g.cle === 'dr').direction.centre === 3, 'seuil gauche / droite réglable');

/* Carnet vide, axe inconnu */
ok(I.croiserObservations([], 'club').length === 0 && I.croiserObservations(null, 'trou').length === 0, 'carnet vide : aucun groupe');
let erreur = false; try { I.croiserObservations(obs, 'météo'); } catch (e) { erreur = true; }
ok(erreur, 'axe inconnu refusé');
/* Groupe sans aucune donnée exploitable : valeurs null, pas de chiffre inventé */
const vide = I.croiserObservations([{ type: 'coup', club: 'sw', distance: null, distanceStatut: 'inconnue', direction: null, jour: '2026-11-01' }], 'club')[0];
ok(vide.n === 1 && vide.distances.moyenne === null && vide.direction.partGauche === null && vide.distancesInconnues === 1, 'données insuffisantes : null');
console.log(n + ' vérifications · ' + ko + ' échec' + (ko > 1 ? 's' : ''));
process.exit(ko ? 1 : 0);
