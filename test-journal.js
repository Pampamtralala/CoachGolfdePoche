/* P11 — journal : notes, périodes, associations (jamais des causes), rapport reproductible, import CSV / JSON sans écrasement. */
const J = require('./src/engine-journal.js');
let ko = 0, n = 0;
function ok(c, m) { n++; if (!c) { ko++; console.log('ÉCHEC :', m); } }
const PARS = [4, 4, 3, 5, 4, 4, 3, 5, 4];
const T = (p, e) => [1, 1, 2, 0, p + (e || 0), p, 0, 0, 0, 0, 0];
const partie = (id, jour, ecart, note) => ({ id, d: jour + 'T10:00:00.000Z', trous: PARS.map((p, k) => T(p, k === 0 ? ecart : 0)), note });

/* Notes */
ok(J.noteValide({ forme: 1, meteo: 'vent', texte: '  dos raide  ', putting: 7 }).forme === 1 && J.noteValide({ forme: 1, meteo: 'vent', texte: '  dos raide  ' }).texte === 'dos raide', 'note assainie (valeurs hors échelle ignorées, texte nettoyé)');
ok(J.noteValide({ putting: 9, meteo: 'neige' }) === null && J.noteValide(null) === null, 'note vide : null');

/* Périodes */
const B = J.bornesPeriode('mois', '2026-11-25T08:00:00Z');
ok(B.debut === '2026-10-27' && B.fin === '2026-11-25', 'un mois : 30 jours inclus');
ok(J.bornesPeriode('trimestre', '2026-11-25').debut === '2026-08-28' && J.bornesPeriode('saison', '2026-11-25').debut === '2026-01-01', 'trois mois et saison');
ok(J.bornesPeriode('libre', '2026-11-25', '2026-05-01', '2026-04-01') === null && J.bornesPeriode('libre', '2026-11-25', '2026-04-01', '2026-05-01').debut === '2026-04-01', 'période libre : bornes contrôlées');

/* Associations : 3 parties fatigué (+6), 3 en forme (+2), 2 sous pluie seulement */
const notes = [
  partie('p1', '2026-10-01', 6, { forme: 1, meteo: 'pluie' }), partie('p2', '2026-10-05', 6, { forme: 1, meteo: 'pluie' }), partie('p3', '2026-10-09', 6, { forme: 1, meteo: 'beau' }),
  partie('p4', '2026-10-12', 2, { forme: 3, meteo: 'beau' }), partie('p5', '2026-10-15', 2, { forme: 3, meteo: 'beau' }), partie('p6', '2026-10-19', 2, { forme: 3, meteo: 'beau' }),
  partie('p7', '2026-10-22', 4, null)
];
const A = J.associationsNotes(notes), forme = A.find(a => a.id === 'forme'), pluie = A.find(a => a.id === 'meteo-pluie');
ok(forme.ok && forme.bas.n === 3 && forme.bas.ecart18 === 12 && forme.haut.n === 3 && forme.haut.ecart18 === 4, 'forme : fatigué +12 (3 parties) contre en forme +4 (3 parties), ramené à 18 trous : ' + JSON.stringify(forme));
ok(!pluie.ok && pluie.bas.n === 2, 'pluie : 2 parties seulement, pas d\'association affichée');
ok(!A.find(a => a.id === 'putting').ok, 'putting jamais noté : rien');

/* Rapport reproductible */
const R1 = J.rapportPeriode(notes, J.bornesPeriode('libre', '', '2026-10-01', '2026-10-31'), '2026-11-25T08:00:00Z');
const R2 = J.rapportPeriode(notes.slice().reverse(), J.bornesPeriode('libre', '', '2026-10-01', '2026-10-31'), '2026-11-26T09:00:00Z');
ok(R1.parties === 7 && R1.stats.trous === 63 && R1.notes.notees === 6 && R1.notes.associations.length === 1, 'rapport : 7 parties, 63 trous, 6 notées, une association');
ok(R1.empreinte === R2.empreinte && R1.genereLe !== R2.genereLe, 'mêmes données et même période : même empreinte, quel que soit l\'ordre ou la date de génération');
const R3 = J.rapportPeriode(notes.slice(0, 6), J.bornesPeriode('libre', '', '2026-10-01', '2026-10-31'), '2026-11-25');
ok(R3.empreinte !== R1.empreinte, 'données différentes : empreinte différente');
ok(R1.journal[0].d === '2026-10-01' && R1.journal[6].d === '2026-10-22' && R1.journal[0].ecart === 6, 'journal chronologique');
ok(J.rapportPeriode([], J.bornesPeriode('mois', '2026-11-25'), 'x').parties === 0, 'rapport vide sans erreur');

/* Import CSV */
const csv = ['date;parcours;trou;par;score;putts;penalites;mise_en_jeu']
  .concat(PARS.map((p, k) => '2026-09-14;La Jonchère;' + (k + 1) + ';' + p + ';' + (p + 1) + ';2;0;' + (p === 3 ? '' : k === 0 ? 'n' : 'o')))
  .concat(PARS.map((p, k) => '15/09/2026;Bonnat;' + (k + 10) + ';' + p + ';' + p + ';2;;'))
  .concat(['2026-09-20;X;1;4;5;2;0;o', 'pas une date;X;1;4;4;2;0;o']).join('\n');
const C = J.lireCSV(csv);
ok(C.parties.length === 2, 'CSV : deux parties de 9 trous : ' + C.parties.length);
const c1 = C.parties[0], c2 = C.parties[1];
ok(c1.trous[0][0] === 0 && c1.renseigne[0] === 1 && c1.trous[1][0] === 1 && c1.renseigne[2] === 0 && c1.parcoursNom === 'La Jonchère', 'CSV : mise en jeu ratée / jouable / par 3 non renseigné');
ok(c1.trous[0][1] === 0 && c2.trous[0][1] === 1, 'CSV : green en régulation déduit (score − putts ≤ par − 2)');
ok(c2.o === 9 && c2.d.slice(0, 10) === '2026-09-15' && c2.renseigne.every(b => b === 0), 'CSV : retour (trous 10 à 18), date jj/mm/aaaa, mise en jeu vide = non renseignée');
ok(C.erreurs.length === 2 && C.erreurs.some(e => /incohérente/.test(e.msg)) && C.erreurs.some(e => /1 trou, il en faut 9 ou 18/.test(e.msg)), 'CSV : lignes incohérentes et partie incomplète signalées : ' + JSON.stringify(C.erreurs));
ok(J.lireCSV('date;trou\n2026-01-01;1').erreurs[0].msg === 'Colonnes manquantes : par, score, putts.', 'CSV : colonnes manquantes nommées');

/* Anti-doublons : rien n'est écrasé */
const F = J.fusionImport(notes, [notes[0], Object.assign({}, notes[1], { id: 'autre' }), C.parties[0], C.parties[0]]);
ok(F.ajout.length === 1 && F.ajout[0] === C.parties[0] && F.doublons.length === 3, 'doublons écartés : même identifiant, même jour et mêmes scores, ou en double dans le fichier');
const JS = J.lireJSONParties({ parties: [notes[0], { x: 1 }] });
ok(JS.parties.length === 1 && J.lireJSONParties({ autre: 1 }).erreurs.length === 1, 'JSON : export de l\'appli lu, format inconnu signalé');

console.log(n + ' vérifications · ' + ko + ' échec' + (ko > 1 ? 's' : ''));
process.exit(ko ? 1 : 0);
