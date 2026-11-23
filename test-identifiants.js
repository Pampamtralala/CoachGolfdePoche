/* P01 (2/3) — identifiants stables : migration non destructive de 120 anciennes parties. */
const I = require('./src/engine-donnees.js');
const E = require('./src/engine-plus.js');
let ko = 0, n = 0;
function ok(c, m) { n++; if (!c) { ko++; console.log('ÉCHEC :', m); } }
const copie = x => JSON.parse(JSON.stringify(x));
const sansIds = x => JSON.parse(JSON.stringify(x, (k, v) => k === 'id' ? undefined : v));

/* 120 parties anciennes, sans identifiant, dont deux strictement identiques (même jour, même score). */
const CLUBS = ['dr', 'f7', 'pw', 'sw'];
const legacy = {
  parties: Array.from({ length: 120 }, (_, i) => ({
    d: new Date(Date.UTC(2025, 0, 1) + (i % 118) * 86400000).toISOString(), pc: 'p1', o: 0,
    trous: Array.from({ length: 9 }, (_, t) => [1, t % 2, 2, 0, 4 + ((i + t) % 3), 4, 0, 0, 0, 0, 0]),
    coups: Array.from({ length: 9 }, (_, t) => (t % 3 ? [] : [{ c: CLUBS[(i + t) % 4], d: 100 + i, a: 'plein', l: (t % 5) - 2 }, { c: 'sw', d: null, a: 'plein' }]))
  })),
  partie: { d: '2026-11-23', n: 18, i: 3, trous: [], pc: 'p1', coups: [[{ c: 'dr', d: 210, a: 'plein' }]] },
  carnet: { series: [{ d: '2026-11-01', c: 'f7', v: [148, 152] }, { d: '2026-11-02', c: 'pw', v: [100] }] }
};
const e1 = copie(legacy), crees = I.attribuerIds(e1);
const ids = e1.parties.map(p => p.id);
ok(crees === 120 + 1 + 2 + 120 * 3 * 2 + 1, 'identifiants créés : ' + crees);
ok(new Set(ids).size === 120 && ids.every(x => I.idValide(x, 'p')), '120 identifiants de partie uniques et valides');
ok(JSON.stringify(sansIds(e1)) === JSON.stringify(legacy), 'aucune autre donnée modifiée');
const coupsIds = e1.parties.flatMap(p => p.coups.flat().map(c => c.id));
ok(coupsIds.every(x => I.idValide(x, 'c')) && e1.parties.every(p => new Set(p.coups.flat().map(c => c.id)).size === p.coups.flat().length), 'coups : identifiants valides, uniques dans la partie');
ok(I.idValide(e1.partie.id, 'p') && I.idValide(e1.partie.coups[0][0].id, 'c') && e1.carnet.series.every(s => I.idValide(s.id, 's')), 'partie en cours et séries');

/* Déterministe : un second chargement des mêmes anciennes données donne les mêmes identifiants. */
const e2 = copie(legacy); I.attribuerIds(e2);
ok(JSON.stringify(e2) === JSON.stringify(e1), 'même résultat à chaque chargement (écriture précédente perdue)');
/* Idempotent : rien ne change au second passage. */
const e3 = copie(e1);
ok(I.attribuerIds(e3) === 0 && JSON.stringify(e3) === JSON.stringify(e1), 'second passage : aucun identifiant créé ni modifié');
/* Les identifiants existants ne bougent pas quand une partie plus ancienne est supprimée. */
const e4 = copie(e1); e4.parties.splice(10, 1); I.attribuerIds(e4);
ok(e4.parties[10].id === e1.parties[11].id && e4.parties[119 - 1].id === e1.parties[119].id, 'suppression d\'une partie : les autres gardent leur identifiant');
/* Doublons et identifiants invalides remplacés, les autres gardés. */
const e5 = copie(e1); e5.parties[1].id = e5.parties[0].id; e5.parties[2].id = 'pas bon'; e5.parties[3].coups[0][1].id = e5.parties[3].coups[0][0].id;
const c5 = I.attribuerIds(e5);
ok(c5 === 3 && e5.parties[0].id === e1.parties[0].id && e5.parties[1].id !== e5.parties[0].id && I.idValide(e5.parties[2].id, 'p') && e5.parties[3].coups[0][0].id === e1.parties[3].coups[0][0].id && e5.parties[3].coups[0][1].id !== e5.parties[3].coups[0][0].id, 'doublons et identifiants invalides remplacés : ' + c5);
/* Les deux parties identiques (indices 0 et 118 ont la même date ; score différent ou non) restent distinctes. */
const jumelles = copie(legacy); jumelles.parties[118] = copie(jumelles.parties[0]); I.attribuerIds(jumelles);
ok(jumelles.parties[0].id !== jumelles.parties[118].id, 'deux parties identiques : deux identifiants');
/* Partie terminée rouverte pour être complétée : même identifiant que l'originale, gardé */
const e6 = copie(e1); e6.partie = { id: e6.parties[5].id, edition: true, d: '2026-11-23', trous: [], coups: [] };
ok(I.attribuerIds(e6) === 0 && e6.partie.id === e6.parties[5].id, 'partie en cours d\'édition : identifiant de l\'originale gardé');
const e7 = copie(e1); e7.partie = { id: e7.parties[5].id, d: '2026-11-23', trous: [], coups: [] };
ok(I.attribuerIds(e7) === 1 && e7.partie.id !== e7.parties[5].id, 'sans édition, un doublon est remplacé');
/* Nouvel identifiant à la saisie */
const a = I.nouvelId('p'), b = I.nouvelId('c');
ok(I.idValide(a, 'p') && I.idValide(b, 'c') && !I.idValide(a, 'c') && !I.idValide('p_x', 'p'), 'identifiant de saisie');
/* Observations : identifiants stables, insensibles à la position */
const obs = E.observationsGolf(e1.parties, e1.carnet);
ok(obs[0].id === e1.parties[0].id + '/t0/' + e1.parties[0].coups[0][0].id && obs[0].partieId === e1.parties[0].id && obs.filter(o => o.type === 'practice')[0].id === e1.carnet.series[0].id + '/b0', 'observations : ' + obs[0].id);
const obs4 = E.observationsGolf(e4.parties, e4.carnet);
ok(obs4.find(o => o.id === obs.find(x => x.partieId === e1.parties[50].id).id), 'observation retrouvée après suppression d\'une autre partie');
console.log(n + ' vérifications · ' + ko + ' échec' + (ko > 1 ? 's' : ''));
process.exit(ko ? 1 : 0);
