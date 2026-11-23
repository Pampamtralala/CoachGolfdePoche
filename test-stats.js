/* P05 — tableau de bord : sélection, effectifs, base 18 trous, mises en jeu renseignées, comparaison de périodes. */
const S = require('./src/engine-stats.js');
let ko = 0, n = 0;
function ok(c, m) { n++; if (!c) { ko++; console.log('ÉCHEC :', m); } }
/* trou : [jouable, gir, putts, pén, score, par, côté, club, putt1, evit, bunker] */
const T = (par, score, putts, pen, j, cote) => [j == null ? 1 : j, score - putts <= par - 2 ? 1 : 0, putts, pen || 0, score, par, j === 0 ? (cote || 0) : 0, 0, 0, 0, 0];
const PARS = [4, 4, 3, 5, 4, 4, 3, 5, 4, 4, 4, 3, 5, 4, 4, 3, 5, 4];
const partie18 = (d, pc, sc, rens) => ({ id: 'p_' + d.replace(/-/g, ''), d, pc, o: 0, trous: PARS.map((p, k) => T(p, p + sc[k % sc.length], 2, 0, k === 0 ? 0 : 1, 1)), renseigne: rens });
const partie9 = (d, pc) => ({ id: 'p_9' + d.replace(/-/g, ''), d, pc, o: 0, trous: PARS.slice(0, 9).map(p => T(p, p + 1, 2)) });
const parties = [
  partie18('2026-09-01', 'jon', [1, 2, 0]),                              /* ancienne : sans « renseigne » */
  partie18('2026-10-01', 'jon', [1, 1, 1], Array(18).fill(0)),           /* express : mises en jeu inconnues */
  partie9('2026-10-15', 'neuf'),
  partie18('2026-11-01', 'jon', [0, 1, 0], Array(18).fill(1)),           /* standard : renseignées */
  partie18('2026-11-20', 'autre', [2, 1, 1], Array(18).fill(1))
];
/* Sélection */
ok(S.selectionParties(parties, { parcours: 'jon' }).length === 3 && S.selectionParties(parties, { format: '9' }).length === 1, 'filtre parcours et format');
ok(S.selectionParties(parties, { debut: '2026-10-01', fin: '2026-11-01' }).length === 3 && S.selectionParties(parties, { derniers: 2 }).map(p => p.d).join() === '2026-11-01,2026-11-20', 'filtre dates et 2 dernières');
ok(S.selectionParties(parties, { derniers: 2, avant: 2 }).map(p => p.d).join() === '2026-10-01,2026-10-15', 'période de comparaison : les 2 précédentes');
ok(S.selectionParties(parties, { parcours: 'jon', format: '18', derniers: 5 }).length === 3, 'filtres cumulables');
/* Statistiques */
const t = S.tableauStats(S.selectionParties(parties, {}));
ok(t.parties === 5 && t.trous === 81 && t.trousScore === 81, 'effectifs : ' + t.parties + ' parties, ' + t.trous + ' trous');
ok(t.scoreBrut9 === 45 && t.parties9 === 1 && t.parties18 === 4, 'scores bruts séparés par format');
const ecartTotal = parties.reduce((a, p) => a + p.trous.reduce((b, x) => b + x[4] - x[5], 0), 0);
ok(t.ecart18 === Math.round(ecartTotal * 18 / 81 * 10) / 10, 'écart au par ramené à 18 trous : ' + t.ecart18);
ok(t.putts18 === 36 && t.puttsParTrou === 2 && t.troisPutts === 0 && t.girDeduit === true, 'putts, trois-putts, GIR marqué déduit');
/* Mises en jeu : l'ancienne compte, l'express non, les renseignées oui */
const parsLongs = PARS.filter(p => p >= 4).length;
ok(t.mej.n === 3 * parsLongs + 7 && t.mej.inconnues === parsLongs && t.mej.ratees === 3 && t.mej.gauche === 3, 'mises en jeu : ' + JSON.stringify(t.mej));
ok(t.parPartie.length === 5 && t.parPartie[2].trous === 9 && t.parPartie[2].ecart18 === 18, 'score par partie, 9 trous ramené à 18 : ' + JSON.stringify(t.parPartie[2]));
/* Vide */
const v = S.tableauStats([]);
ok(v.parties === 0 && v.ecart18 === null && v.putts18 === null && v.mej.part === null && v.parPartie.length === 0, 'aucune partie : valeurs null');
/* Comparaison */
const a = S.tableauStats(S.selectionParties(parties, { derniers: 2 })), b = S.tableauStats(S.selectionParties(parties, { derniers: 2, avant: 2 }));
const c = S.comparerStats(a, b);
ok(c.ecart18 && typeof c.ecart18.d === 'number' && [1, 0, -1].includes(c.ecart18.mieux) && c.putts18.mieux === 0, 'comparaison : ' + JSON.stringify(c.ecart18));
ok(S.comparerStats(a, v).ecart18 === null && S.comparerStats(a, v).mej === null, 'comparaison avec une période vide : null');
/* Période libre : la période précédente a la même durée et finit la veille du début */
const pp = S.periodePrecedente('2026-11-01', '2026-11-30');
ok(pp && pp.debut === '2026-10-02' && pp.fin === '2026-10-31' && pp.jours === 30, 'période précédente de 30 jours : ' + JSON.stringify(pp));
ok(S.periodePrecedente('2026-03-01', '2026-03-01').debut === '2026-02-28', 'période d\'un jour : la veille');
ok(S.periodePrecedente('2026-11-30', '2026-11-01') === null && S.periodePrecedente('', '2026-11-01') === null, 'période incomplète ou inversée : null');
const nov = S.selectionParties(parties, { debut: '2026-11-01', fin: '2026-11-30' }), oct = S.selectionParties(parties, { debut: pp.debut, fin: pp.fin });
ok(nov.length === 2 && oct.length === 1, 'novembre contre 2–31 octobre : ' + nov.length + ' / ' + oct.length);
console.log(n + ' vérifications · ' + ko + ' échec' + (ko > 1 ? 's' : ''));
process.exit(ko ? 1 : 0);
