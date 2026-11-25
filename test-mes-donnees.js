/* P04 — mes données : exclusions réversibles, inventaire, distances suspectes. */
const D = require('./src/engine-donnees.js');
let ko = 0, n = 0;
function ok(c, m) { n++; if (!c) { ko++; console.log('ÉCHEC :', m); } }
const PARS = [4, 4, 3, 5, 4, 4, 3, 5, 4];
const T = p => [1, 1, 2, 0, p, p, 0, p >= 4 ? 1 : 0, 0, 0, 0];
const coup = (c, d, o) => Object.assign({ c, d, a: 'plein', source: 'manuel', distanceType: 'carry' }, o || {});
const partie = (id, coups, o) => Object.assign({ id, d: '2026-05-01T10:00:00Z', pc: 'p1', trous: PARS.map(T), coups }, o || {});

/* Exclusions */
const pA = partie('p_a', PARS.map((p, k) => k === 0 ? [coup('dr', 210, { l: 4 }), coup('f7', 145, { x: 1, l: -20 })] : []));
const pB = partie('p_b', [], { exclue: 1 });
const pC = partie('p_c', []);
const calc = D.partiesPourCalculs([pA, pB, pC]);
ok(calc.length === 2 && calc.every(p => !p.exclue), 'partie exclue retirée des calculs');
ok(calc[1] === pC, 'partie sans coup exclu : même objet (pas de copie inutile)');
const c2 = calc[0].coups[0][1];
ok(calc[0] !== pA && c2.d === null && c2.l === undefined && c2.c === 'f7' && c2.x === 1 && calc[0].coups[0].length === 2, 'coup exclu : gardé dans l\'enchaînement, sans distance ni direction');
ok(pA.coups[0][1].d === 145 && pA.coups[0][1].l === -20, 'les données d\'origine ne sont pas modifiées (exclusion réversible)');
delete pA.coups[0][1].x;
ok(D.partiesPourCalculs([pA])[0].coups[0][1].d === 145, 'réintégration : le coup compte de nouveau');

/* Inventaire */
const pI = partie('p_i', PARS.map((p, k) => k === 0 ? [coup('dr', 230, { source: 'gps', distanceType: 'total', g: [46, 2, 46.001, 2.001], l: 3 }), coup('f7', 140, { l: -2 }), coup('pw', 90, { dm: 1 }), coup('f9', null), coup('f5', 160, { x: 1 })] : []),
  { renseigne: PARS.map((_, k) => k === 1 ? 0 : 7) });
pI.trous[2][8] = 2; pI.trous[4][4] = 0;
const inv = D.inventaireDonnees([pI, pB], { series: [{}, {}] }, 3);
ok(inv.parties === 2 && inv.exclues === 1, 'inventaire : 2 parties dont 1 exclue');
ok(inv.trous === 8 && inv.trousSansScore === 1, 'trous joués 8, sans score 1');
ok(inv.mejPossibles === 6 && inv.mej === 5, 'mises en jeu : 5 renseignées sur 6 par 4 et 5 joués : ' + JSON.stringify([inv.mej, inv.mejPossibles]));
ok(inv.premiersPutts === 1, 'premier putt noté une fois');
ok(inv.coups === 5 && inv.coupsExclus === 1 && inv.directions === 2, 'coups : 5 dont 1 exclu, 2 directions');
ok(inv.distances.gps === 1 && inv.distances.declaree === 1 && inv.distances.estimee === 1 && inv.distances.inconnue === 1, 'distances par provenance : ' + JSON.stringify(inv.distances));
ok(inv.seances === 2 && inv.cartes === 3, 'séances et cartes GPS');
const vide = D.inventaireDonnees([], null, 0);
ok(vide.parties === 0 && vide.coups === 0 && vide.seances === 0, 'carnet vide : tout à zéro');

/* Distances suspectes : 6 mesures du fer 7 autour de 145 m, une à 230 m, une estimée à 300 (ignorée) */
const ds = [140, 145, 150, 145, 142, 230].map(d => coup('f7', d));
ds.push(coup('f7', 300, { dm: 1 }));
const pS = partie('p_s', [ds]);
let S = D.distancesSuspectes([pS]);
ok(S.length === 1 && S[0].d === 230 && S[0].mediane === 145 && S[0].n === 6 && S[0].k === 0 && S[0].ci === 5, 'distance suspecte : 230 m pour une médiane de 145 m : ' + JSON.stringify(S));
pS.coups[0][5].ok = 1;
ok(D.distancesSuspectes([pS]).length === 0, 'confirmée (ok) : plus signalée');
delete pS.coups[0][5].ok; pS.coups[0][5].x = 1;
ok(D.distancesSuspectes([pS]).length === 0, 'exclue : plus signalée, et retirée de la médiane');
ok(D.distancesSuspectes([partie('p_t', [[140, 230, 145].map(d => coup('f7', d))])]).length === 0, 'moins de 5 mesures : rien de signalé');

console.log(n + ' vérifications · ' + ko + ' échec' + (ko > 1 ? 's' : ''));
process.exit(ko ? 1 : 0);
