/* Tests des repères, des coups reçus et du Stableford. */
const H = require('./src/engine-handicap.js');
const E = require('./src/engine-plus.js');
let ko = 0, n = 0;
function ok(c, m) { n++; if (!c) { ko++; console.log('ÉCHEC :', m); } }
const PARS = [4, 3, 5, 4, 4, 3, 4, 5, 4, 4, 3, 5, 4, 4, 3, 4, 5, 4];
const HCP = [12, 2, 18, 16, 6, 14, 10, 8, 4, 9, 11, 1, 17, 5, 15, 3, 13, 7];
const pc = { id: 'p1', pars: PARS, hcp: HCP, reps: [{ n: 'Jaune', sss: 69.4, slope: 126 }, { n: 'Blanc', sss: 70.6, slope: 121 }] };

/* Handicap de jeu : index × slope / 113 + (SSS − par) */
ok(H.handicapJeu(14, pc.reps[0], pc, 18).v === 13 && H.handicapJeu(14, pc.reps[0], pc, 18).exact, 'index 14, jaunes 69,4 / 126, par 72 : 13 coups');
ok(H.handicapJeu(28.7, { sss: 69.9, slope: 137 }, { pars: PARS }, 18).v === 33, 'exemple de la fédération : index 28,7, slope 137, SSS 69,9 → 33');
ok(H.handicapJeu(14, pc.reps[0], pc, 9).v === 7, '9 trous : la moitié');
ok(H.handicapJeu(14, null, null, 18).v === 14 && !H.handicapJeu(14, null, null, 18).exact && H.handicapJeu(null, pc.reps[0], pc, 18) === null, 'sans repère : approximatif ; sans index : rien');
ok(H.handicapJeu(14, pc.reps[0], { pars: [4, 0, 5, 4, 4, 3, 4, 5, 4, 4, 3, 5, 4, 4, 3, 4, 5, 4] }, 18).exact === false, 'un par manquant : approximatif');
/* Répartition */
const r = H.repartirCoups(13, HCP);
ok(r.reduce((a, b) => a + b, 0) === 13 && r[11] === 1 && r[2] === 0 && r[13] === 1 && r[12] === 0 && r[16] === 1, '13 coups sur les trous de handicap 1 à 13 : ' + r.join(','));
ok(H.repartirCoups(22, HCP)[11] === 2 && H.repartirCoups(22, HCP)[2] === 1 && H.repartirCoups(22, HCP).reduce((a, b) => a + b, 0) === 22, '22 coups : 2 sur les 4 plus durs');
ok(H.repartirCoups(-2, HCP)[2] === -1 && H.repartirCoups(-2, HCP)[12] === -1 && H.repartirCoups(-2, HCP)[11] === 0, 'handicap négatif : coups rendus sur les trous les plus faciles');
ok(H.repartirCoups(4, [0, 0, 0]).join() === '2,1,1' && H.repartirCoups(3, []).length === 0, 'sans handicap des trous : dans l\'ordre');
/* Stableford */
ok(H.pointsStableford(5, 4, 1) === 2 && H.pointsStableford(3, 4, 0) === 3 && H.pointsStableford(9, 4, 1) === 0 && H.pointsStableford(4, 4, 1) === 3, 'points Stableford');
/* Partie */
const trou = (par, score) => [1, 0, 2, 0, score, par, 0, 0, 0, 0, 0];
const partie = { trous: PARS.map(p => trou(p, p + 1)), pc: 'p1', o: 0, rep: 0 };
const R = H.coupsRecusPartie(partie, pc, 14);
ok(R.H === 13 && R.points === 13 * 2 + 5 * 1 && R.net === 90 - 13 && R.hcpConnus && R.notes === 18, 'partie en bogeys, 13 coups reçus : ' + R.points + ' points, net ' + R.net);
const R2 = H.coupsRecusPartie(Object.assign({}, partie, { rep: 1 }), pc, 14);
ok(R2.H === H.handicapJeu(14, pc.reps[1], pc, 18).v, 'le repère de la partie compte');
const aller = { trous: PARS.slice(9).map(p => trou(p, p)), o: 9, rep: 0 };
ok(H.coupsRecusPartie(aller, pc, 14).H === 7 && H.coupsRecusPartie(aller, pc, 14).recus[2] === 1, 'retour seul : 7 coups, sur les trous 10 à 18 (le 12 en reçoit un)');
ok(H.repereDe({ rep: 5 }, pc).n === 'Jaune' && H.repereDe({}, { pars: PARS, sss: 70, slope: 120 }).slope === 120 && H.repereDe({}, null) === null, 'repère par défaut, ancien SSS / slope');
/* Index estimé : vrais coups reçus quand le handicap des trous est connu */
const d1 = E.differentiel({ trous: PARS.map((p, k) => trou(p, k === 2 ? 12 : p + 1)) }, pc, 14);
const d2 = E.differentiel({ trous: PARS.map((p, k) => trou(p, k === 2 ? 12 : p + 1)) }, Object.assign({}, pc, { hcp: null }), 14);
ok(d1 && d2 && d1.ajuste === 91 && d2.ajuste === d1.ajuste + 1, 'double bogey net : le trou 3 (hcp 18) ne reçoit pas de coup : ' + d1.ajuste + ' / ' + d2.ajuste);
/* Collage de la carte de score */
const L = H.lireCarteScore(`Couleur | Par | Sss H | Slope H | Sss F | Slope F | Distance |
jaune | 70 | 69.4 | 126 | 75.2 | 134 | 2628 m |
Trou 1 2 3 4 5 6 7 8 9 Aller
Par 4 3 5 4 4 3 4 5 4 36
Par 4 3 5 4 4 3 4 5 4 36
Coups reçus 12 2 18 16 6 14 10 8 4
Coups reçus 9 11 1 17 5 15 3 13 7
Blanc 70,6 121 - -
Bleu 72 72 130`, 18);
ok(L.reps.map(r => r.n + ':' + r.sss + '/' + r.slope).join(' ') === 'Jaune · Messieurs:69.4/126 Jaune · Dames:75.2/134 Blanc:70.6/121 Bleu:72/130', 'repères lus : ' + L.reps.map(r => r.n + ':' + r.sss + '/' + r.slope).join(' '));
ok(L.pars && L.pars.join('') === '435443454435443454' && L.hcp && L.hcp.join() === HCP.join(), 'pars et handicap sur deux lignes, totaux ignorés');
ok(H.lireCarteScore('bonjour', 18).reps.length === 0 && H.lireCarteScore('', 9).pars === null, 'texte sans carte');
ok(H.lireHcp('5 9 1 3 7 2 8 4 6', 9).join() === '5,9,1,3,7,2,8,4,6' && H.lireHcp('1 1 2 3 4 5 6 7 8', 9) === null && H.lireHcp('1 2 3', 9) === null && H.lireHcp('0 1 2 3 4 5 6 7 8', 9) === null, 'handicap saisi à la main');
console.log(n + ' vérifications · ' + ko + ' échec' + (ko > 1 ? 's' : ''));
process.exit(ko ? 1 : 0);
