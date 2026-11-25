/* UX10 — journal chronologique : construit depuis les sources existantes, trié, filtrable, faits marquants justes. */
const C = require('./src/engine-chronologie.js');
let ko = 0, n = 0;
function ok(c, m) { n++; if (!c) { ko++; console.log('ÉCHEC :', m); } }
const PARS = [4, 4, 3, 5, 4, 4, 3, 5, 4];
const partie = (j, plus, o) => Object.assign({ d: '2026-' + j + 'T10:00:00.000Z', pc: 'p1', trous: PARS.map((p, k) => [1, 1, 2, 0, p + (k === 0 ? plus : 0), p, 0, 0, 0, 0, 0]) }, o || {});
const src = {
  parties: [partie('03-01', 6), partie('04-01', 5), partie('05-01', 4, { pc: 'p2', note: { texte: 'Vent fort', forme: 1 } }), partie('06-01', 1), partie('07-01', 3)],
  series: [{ d: '2026-04-15T10:00:00.000Z', c: 'f7', v: [140, 142, 138] }],
  indexHist: [{ d: '2026-02-01T00:00:00.000Z', v: 20.4 }, { d: '2026-05-01T00:00:00.000Z', v: 19.1 }, { d: '2026-06-15T00:00:00.000Z', v: 19.5 }],
  cycles: [{ fin: '2026-05-20T00:00:00.000Z', cycle: 1, faites: 7, total: 8 }],
  defis: [{ id: 'onze', t: 'Les onze putts', hist: [{ d: '2026-06-20T00:00:00.000Z', v: 8 }] }],
  nomParcours: id => ({ p1: 'La Jonchère', p2: 'Bonnat' })[id], nomClub: id => ({ f7: 'Fer 7' })[id] || id
};
const sauve = JSON.stringify(src.parties);
const E = C.chronologie(src);
ok(E.length === 5 + 1 + 3 + 1 + 1, 'onze événements : ' + E.length);
ok(E.every((e, i) => i === 0 || E[i - 1].d >= e.d), 'du plus récent au plus ancien');
ok(E[0].type === 'partie' && E[0].d === '2026-07-01', 'le plus récent en tête');
ok(JSON.stringify(src.parties) === sauve, 'les sources ne sont pas modifiées');
const rec = E.filter(e => e.marquant);
ok(rec.length === 2 && rec.some(e => e.type === 'partie' && e.d === '2026-06-01' && /Record/.test(e.marquant)) && rec.some(e => e.type === 'index' && e.d === '2026-05-01'), 'faits marquants : record du 1er juin, meilleur index du 1er mai (' + rec.map(e => e.d + ' ' + e.marquant).join(' | ') + ')');
ok(!E.some(e => e.type === 'partie' && e.d === '2026-04-01' && e.marquant), 'pas de record avant 3 parties complètes');
ok(E.find(e => e.d === '2026-05-01' && e.type === 'partie').aNote && E.find(e => e.d === '2026-05-01' && e.type === 'partie').note === 'Vent fort', 'note rattachée à sa partie');
ok(E.find(e => e.type === 'practice').detail === '3 balles, 140 m en moyenne', 'série résumée');
ok(E.find(e => e.type === 'partie' && e.d === '2026-03-01').ref.partie === 0, 'référence vers la partie d\'origine');
ok(C.filtrerChronologie(E, { type: 'partie' }).length === 5, 'filtre parties');
ok(C.filtrerChronologie(E, { type: 'entrainement' }).length === 2, 'filtre entraînement (cycle + défi)');
ok(C.filtrerChronologie(E, { type: 'note' }).length === 1, 'filtre notes');
ok(C.filtrerChronologie(E, { debut: '2026-05-01', fin: '2026-05-31' }).length === 3, 'filtre période (mai : partie, index, cycle) : ' + C.filtrerChronologie(E, { debut: '2026-05-01', fin: '2026-05-31' }).map(e => e.type).join(','));
ok(C.filtrerChronologie(E, { parcours: 'p2' }).length === 1, 'filtre parcours : seulement les parties de ce parcours');
ok(C.chronologie({}).length === 0 && C.chronologie({ parties: [{ d: 'x', trous: [] }] }).length === 0, 'sources vides ou invalides : rien');
console.log(n + ' vérifications · ' + ko + ' échec' + (ko > 1 ? 's' : ''));
process.exit(ko ? 1 : 0);
