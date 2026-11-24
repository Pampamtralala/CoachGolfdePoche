/* P07 — fiche de parcours et passages par trou : rapprochement des trous, retour 9 trous, passages réels. */
const P = require('./src/engine-parcours.js');
const E = require('./src/engine-plus.js');
let ko = 0, n = 0;
function ok(c, m) { n++; if (!c) { ko++; console.log('ÉCHEC :', m); } }
const PARS = [4, 5, 3, 4, 4, 3, 5, 4, 4, 4, 4, 3, 5, 4, 4, 4, 3, 5];
const PC = { id: 'p1', pars: PARS };
/* trou : [jouable, gir, putts, pén, score, par, côté, club départ, putt1, evit, bunker] */
const trou = (par, ecart, o) => Object.assign([1, 0, 2, 0, par + ecart, par, 0, par >= 4 ? 1 : 0, 0, 0, 0], o || {});
const partie = (id, d, ecarts, opt) => Object.assign({ id, d: d + 'T10:00:00.000Z', pc: 'p1', o: 0 }, opt || {}, {
  trous: ecarts.map((e, k) => trou(PARS[((opt && opt.o) || 0) + k], e))
});
const z18 = Array(18).fill(1);
const parties = [
  partie('p_c', '2026-06-01', z18.map((v, k) => k === 6 ? 3 : 1)),               /* +20, trou 7 en +3 */
  partie('p_a', '2026-04-01', z18.map(() => 1)),                                /* +18 */
  partie('p_r', '2026-05-01', Array(9).fill(0), { o: 9 }),                      /* retour au par */
  partie('p_l', '2026-05-15', Array(9).fill(2)),                                /* aller +18 */
  partie('p_i', '2026-07-01', z18.map(() => 1).map((v, k) => k === 3 ? 0 : v)), /* incomplète : trou 4 sans score */
  { id: 'p_x', d: '2026-07-02T10:00:00.000Z', pc: 'p2', o: 0, trous: z18.map((v, k) => trou(PARS[k], 0)) },
  { id: 'p_n', d: '2026-07-03T10:00:00.000Z', pc: null, o: 0, trous: z18.map((v, k) => trou(PARS[k], 0)) }
];
parties[4].trous[3][4] = 0;

/* Tracés */
ok(P.traceDe(parties[0], PC) === 'complet18' && P.traceDe(parties[2], PC) === 'retour' && P.traceDe(parties[3], PC) === 'aller', 'tracés : 18 trous, retour, aller');
ok(P.traceDe({ trous: Array(18), o: 0 }, { pars: PARS.slice(0, 9) }) === 'double' && P.traceDe({ trous: Array(9), o: 0 }, { pars: PARS.slice(0, 9) }) === 'complet9', 'neuf trous : simple et deux tours');

/* Fiche */
const F = P.ficheParcours(parties, PC);
ok(F.parties === 5 && F.incompletes === 1, 'cinq parties du parcours, une incomplète : ' + JSON.stringify([F.parties, F.incompletes]));
const t18 = F.traces.find(t => t.id === 'complet18');
ok(t18.parties === 3 && t18.n === 2 && t18.moyenne === 19 && t18.meilleur.ecart === 18 && t18.meilleur.d === '2026-04-01' && t18.dernier.d === '2026-06-01', '18 trous : moyenne, meilleur, dernier : ' + JSON.stringify(t18));
ok(F.traces.find(t => t.id === 'retour').moyenne === 0 && F.traces.find(t => t.id === 'aller').meilleur.ecart === 18, 'aller et retour séparés');
ok(F.evolution.map(s => s.d).join() === '2026-04-01,2026-05-01,2026-05-15,2026-06-01', 'évolution chronologique, scores complets seulement');
ok(t18.tendance === null, 'pas de tendance sous 4 scores');
const huit = P.ficheParcours([0, 1, 2, 3, 4, 5].map(i => partie('t' + i, '2026-0' + (i + 1) + '-01', z18.map(() => i < 3 ? 2 : 1))), PC);
ok(huit.traces[0].tendance && huit.traces[0].tendance.avant === 36 && huit.traces[0].tendance.apres === 18 && huit.traces[0].tendance.d === -18, 'tendance : moitié ancienne contre récente');

/* Passages sur un trou : le trou 12 (par 3) est le 3e du retour */
const t12 = P.passagesTrou(parties, PC, 11);
ok(t12.passages.length === 4 && t12.passages.some(x => x.partieId === 'p_r' && x.k === 2), 'trou 12 : le retour (3e trou joué) est bien rapproché : ' + t12.passages.map(x => x.partieId + ':' + x.k).join(' '));
ok(t12.passages.map(x => x.jour).join() === '2026-04-01,2026-05-01,2026-06-01,2026-07-01', 'passages du plus ancien au plus récent');
const t4 = P.passagesTrou(parties, PC, 3);
ok(t4.passages.length === 3 && t4.sansScore === 1, 'un trou sans score n\'est pas un passage : ' + JSON.stringify([t4.passages.length, t4.sansScore]));
const t7 = P.bilanPassages(P.passagesTrou(parties, PC, 6));
ok(t7.n === 4 && t7.pire === 3 && t7.meilleur === 1 && t7.doubles === 2, 'trou 7 : pire +3, doubles bogeys et plus : ' + JSON.stringify(t7));

/* Neuf trous joué deux fois : deux passages par partie */
const PC9 = { id: 'p9', pars: PARS.slice(0, 9) };
const deux = P.passagesTrou([{ id: 'd', d: '2026-01-01T00:00:00Z', pc: 'p9', o: 0, trous: PARS.slice(0, 9).concat(PARS.slice(0, 9)).map(p => trou(p, 0)) }], PC9, 0);
ok(deux.passages.length === 2 && deux.passages[0].tour === 1 && deux.passages[1].tour === 2, 'neuf trous en deux tours : deux passages, tours 1 et 2');

/* Mises en jeu et coups : non renseignée exclue, estimation jamais affichée comme distance */
const pm = { id: 'm', d: '2026-02-01T00:00:00Z', pc: 'p1', o: 0, renseigne: [3, 0].concat(Array(16).fill(3)), trous: PARS.map(p => trou(p, 1)),
  coups: [[{ c: 'dr', p: 'dep', d: 210, source: 'gps', distanceType: 'total' }, { c: 'f7', p: 'fw', d: 140, dm: 1 }], [{ c: 'dr', p: 'dep' }]] };
pm.trous[0][0] = 0; pm.trous[0][6] = 3;
const m1 = P.passagesTrou([pm], PC, 0).passages[0], m2 = P.passagesTrou([pm], PC, 1).passages[0];
ok(m1.mej && m1.mej.j === 0 && m1.mej.cote === 3 && m1.clubDepart === 1, 'mise en jeu renseignée : ratée à droite');
ok(m2.mej === null && m2.clubDepart === 0, 'mise en jeu et club non renseignés (express) : inconnus');
ok(m1.coups[0].d === 210 && m1.coups[0].gps && m1.coups[1].d === null, 'coups : distance GPS gardée et signalée, estimation jamais affichée');
ok(P.passagesTrou([pm], PC, 2).passages[0].mej === null, 'par 3 : pas de mise en jeu');

/* Parties sans parcours */
ok(P.partiesSansParcours(parties, [PC]) === 2, 'parties sans parcours connu : 2');

/* analyseParcours : une mise en jeu non renseignée ne compte plus comme jouable */
const an = E.analyseParcours([pm], PC);
ok(an.trous[0].M === 1 && an.trous[0].J === 0 && an.trous[1].M === 0 && an.trous[1].jeu === null, 'analyse des trous : mise en jeu non renseignée exclue');
ok(E.causesTrou({ par: 4, pen: 0, jeu: null, gir: 0.5, putts: 2, extra: 0.2 })[0].id === 'general', 'cause « départ » jamais tirée d\'une mise en jeu inconnue');

console.log(n + ' vérifications · ' + ko + ' échec' + (ko > 1 ? 's' : ''));
process.exit(ko ? 1 : 0);
