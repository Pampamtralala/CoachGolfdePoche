/* UX05 — enseignements personnalisés : rien sous les seuils, chaque enseignement est traçable (constat chiffré,
   période, effectif, fiabilité, lien), catégories distinctes sur l'accueil, rotation déterministe. */
const E = require('./src/engine-enseignements.js');
const A = require('./src/engine-analyste.js');
let ko = 0, n = 0;
function ok(c, m) { n++; if (!c) { ko++; console.log('ÉCHEC :', m); } }
const PARS = [4, 4, 3, 5, 4, 4, 3, 5, 4];
const PC = [{ id: 'p1', nom: 'La Jonchère', pars: PARS }];
const ctx = { parcours: PC, cible: 18, nomParcours: () => 'La Jonchère', nomDomaine: d => ({ putt_long: 'Putting long', drive: 'Mise en jeu', strategie: 'Stratégie et mental', putt_court: 'Putting court' })[d] || d };
const T = p => [1, 1, 2, 0, p, p, 0, 0, 0, 0, 0];
function partie(i, o) {
  o = o || {};
  const trous = PARS.map((p, k) => {
    const t = T(p);
    if (k === 6 && !o.sansT7) t[4] += 2;
    if (k === 0 && o.plus) t[4] += o.plus;
    if (k === 1 && o.droite) { t[0] = 0; t[1] = 0; t[6] = 3; t[4] += 1; }
    if (k === 2 && o.p3) { t[2] = 3; t[4] += 1; }
    if (k === 8 && o.pen) { t[3] = 1; t[4] += 1; }
    if (k === 3 && o.moins) t[4] -= o.moins;
    return t;
  });
  return { id: 'p' + i, d: new Date(Date.UTC(2026, 0, 1) + i * 7 * 86400000).toISOString(), pc: o.sansPc ? undefined : 'p1', o: 0, renseigne: PARS.map(() => 7), trous };
}
const ids = r => r.liste.map(e => e.id);
const cats = r => r.liste.map(e => e.cat);

/* Carnet vide */
ok(E.enseignements([], ctx).liste.length === 0, 'carnet vide : aucun enseignement');

/* Deux parties : on ne conclut rien, on dit seulement quoi saisir */
const deux = E.enseignements([partie(0), partie(1)], ctx);
ok(deux.liste.every(e => e.cat === 'donnees'), 'deux parties : seulement « données à enrichir » (' + cats(deux).join(',') + ')');
ok(deux.liste.some(e => e.id === 'donnees-score') && deux.liste.length <= 2, 'deux parties : tendance du score à compléter, deux au plus');
ok(deux.liste.every(e => e.fiabilite.niveau === 'insuffisant'), 'deux parties : fiabilité « insuffisant »');

/* Douze parties qui s'améliorent : progression, erreur récurrente, opportunité */
const mieux = Array.from({ length: 12 }, (_, i) => partie(i, i < 6 ? { plus: 3, p3: true, pen: true, droite: true } : { droite: true }));
const R = E.enseignements(mieux, ctx);
['score-mieux', 'troisPutts-mieux', 'penalites-mieux', 'cote-mej', 'top-mej', 'trou'].forEach(id => ok(ids(R).includes(id), 'progression : ' + id + ' présent (' + ids(R).join(',') + ')'));
ok(!cats(R).includes('vigilance'), 'progression : aucun point de vigilance');
/* Traçabilité : le constat d'une évolution est mot pour mot la réponse de « Comprendre mon jeu » */
const rep = A.repondre('score', mieux, ctx);
ok(R.liste.find(e => e.id === 'score-mieux').constat === rep.phrase, 'score : constat identique à la réponse de l\'analyste');
/* Champs obligatoires */
R.liste.forEach(e => {
  ok(e.titre && e.titre.length <= 70, e.id + ' : titre court (' + e.titre + ')');
  ok(/\d/.test(e.constat), e.id + ' : constat chiffré');
  ok(e.periode && e.periode.du && e.periode.au, e.id + ' : période');
  ok(e.effectifs && e.effectifs.parties > 0, e.id + ' : effectif');
  ok(['solide', 'indicatif', 'insuffisant'].includes(e.fiabilite.niveau) && /^(Solide|Indicatif|Insuffisant) :/.test(e.fiabilite.texte), e.id + ' : fiabilité expliquée');
  ok(e.lien && e.lien.a, e.id + ' : lien vers le détail');
  ok(E.CATEGORIES_ENS.some(c => c.id === e.cat), e.id + ' : catégorie connue');
});
ok(R.liste.find(e => e.id === 'cote-mej').fiabilite.niveau === 'indicatif', 'côté : 12 ratés latéraux pour un minimum de 8 → indicatif');
ok(R.liste.find(e => e.id === 'score-mieux').fiabilite.niveau === 'solide', 'score : 12 parties pour un minimum de 6 → solide');
ok(R.liste.find(e => e.id === 'cote-mej').action.v === 'drive', 'côté : action vers les exercices de mise en jeu');
ok(R.liste.find(e => e.id === 'score-mieux').action === null, 'progression : pas d\'action imposée');

/* Douze parties qui se dégradent : points de vigilance avec passerelle vers les exercices */
const moins = Array.from({ length: 12 }, (_, i) => partie(i, i >= 6 ? { plus: 3, p3: true, pen: true } : {}));
const M = E.enseignements(moins, ctx);
['score-moins', 'troisPutts-moins', 'penalites-moins'].forEach(id => ok(ids(M).includes(id), 'dégradation : ' + id + ' (' + ids(M).join(',') + ')'));
ok(M.liste.find(e => e.id === 'troisPutts-moins').action.v === 'putt_long' && /putting long/.test(M.liste.find(e => e.id === 'troisPutts-moins').action.lib), 'trois-putts en hausse : exercices de putting long');
ok(M.liste.find(e => e.id === 'troisPutts-moins').action.source === 'données', 'passerelle marquée « d\'après les données »');

/* Écart sous le seuil : rien sur le score */
const stable = Array.from({ length: 12 }, (_, i) => partie(i, i % 2 ? { plus: 1 } : {}));
ok(!ids(E.enseignements(stable, ctx)).some(x => /^score-/.test(x)), 'score stable (écart < 1,5) : aucun enseignement sur le score');

/* Record : la dernière partie est la meilleure */
const rec = Array.from({ length: 8 }, (_, i) => partie(i, i === 7 ? { moins: 2, sansT7: true } : { plus: i % 3 }));
const Rr = E.enseignements(rec, ctx), r0 = Rr.liste.find(e => e.cat === 'record');
ok(r0 && /meilleure/.test(r0.constat) && r0.provenance === 'déclaré', 'record détecté : ' + (r0 && r0.constat));
const rec2 = rec.slice(0, 7).concat([partie(7, { plus: 2 })]);
ok(!E.enseignements(rec2, ctx).liste.some(e => e.cat === 'record'), 'pas de record si la dernière partie n\'est pas la meilleure');
ok(!E.enseignements(rec.slice(4), ctx).liste.some(e => e.cat === 'record'), 'pas de record sous 5 parties complètes');

/* Parties sans parcours : on le dit */
const sansPc = Array.from({ length: 6 }, (_, i) => partie(i, { sansPc: true }));
ok(ids(E.enseignements(sansPc, ctx)).includes('donnees-trous') || ids(E.enseignements(sansPc, ctx)).length <= 2, 'sans parcours : rattacher les parties suggéré');

/* Choix pour l'accueil : trois au plus, catégories distinctes, rotation déterministe */
const c1 = E.choisirEnseignements(R.liste, 3, 0), c2 = E.choisirEnseignements(R.liste, 3, 1), c1b = E.choisirEnseignements(R.liste, 3, 0);
ok(c1.length === 3 && new Set(c1.map(e => e.cat)).size === 3, 'accueil : trois enseignements de catégories distinctes (' + c1.map(e => e.id).join(',') + ')');
ok(JSON.stringify(c1.map(e => e.id)) === JSON.stringify(c1b.map(e => e.id)), 'accueil : même graine, même choix');
ok(JSON.stringify(c1.map(e => e.id)) !== JSON.stringify(c2.map(e => e.id)), 'accueil : une autre graine fait tourner les ex aequo');
ok(c1[0].poids >= c1[1].poids && c1[1].poids >= c1[2].poids, 'accueil : les plus importants d\'abord');
ok(E.choisirEnseignements([], 3, 5).length === 0, 'accueil : liste vide sans erreur');

console.log(n + ' vérifications · ' + ko + ' échec' + (ko > 1 ? 's' : ''));
process.exit(ko ? 1 : 0);
