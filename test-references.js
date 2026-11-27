/* Roadmap V4, S01 — références ≠ observations : la distance de décision suit l'ordre observée (≥ 3) → référence →
   héritée → observée (peu), une estimation n'entre jamais, les entrées ne sont pas modifiées. */
const P = require('./src/engine-plus.js');
let ko = 0, n = 0;
function ok(c, m) { n++; if (!c) { ko++; console.log('ÉCHEC :', m); } }
const obs = { f7: [138, 140, 142], f8: [128], dr: [] }, ref = { f8: 130, pw: 100 }, her = { f8: [125, 126], b3: [180, 185], dr: [210, 215] };
const avant = JSON.stringify([obs, ref, her]);
const D = P.distancesDecision(obs, ref, her);
ok(JSON.stringify(D.clubs.f7) === '[138,140,142]' && D.provenance.f7.source === 'observée', 'f7 : trois coups observés l\'emportent');
ok(JSON.stringify(D.clubs.f8) === '[130]' && D.provenance.f8.source === 'référence' && D.provenance.f8.observees === 1, 'f8 : un seul coup observé → la référence saisie');
ok(JSON.stringify(D.clubs.b3) === '[180,185]' && D.provenance.b3.source === 'héritée', 'b3 : rien d\'autre → les mesures héritées');
ok(JSON.stringify(D.clubs.dr) === '[210,215]' && D.provenance.dr.source === 'héritée', 'dr : liste observée vide → héritées');
ok(JSON.stringify(D.clubs.pw) === '[100]' && D.provenance.pw.source === 'référence', 'pw : seulement une référence');
const D2 = P.distancesDecision({ f9: [118] }, {}, {});
ok(D2.provenance.f9.source === 'observée' && D2.provenance.f9.peu === true, 'f9 : un coup observé et rien d\'autre → observé, signalé « peu »');
ok(JSON.stringify([obs, ref, her]) === avant, 'les entrées ne sont pas modifiées');
ok(Object.keys(P.distancesDecision({}, {}, {}).clubs).length === 0, 'rien → rien, pas de zéro');
ok(Object.keys(P.distancesDecision({ x: ['a', null] }, { y: 'b' }, {}).clubs).length === 0, 'valeurs non numériques ignorées');
ok(P.MIN_OBS_DISTANCE === 3, 'seuil documenté : 3 coups observés');
console.log(n + ' vérifications · ' + ko + ' échec' + (ko > 1 ? 's' : ''));
process.exit(ko ? 1 : 0);
