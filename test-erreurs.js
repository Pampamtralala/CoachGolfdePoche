/* P09 — erreurs récurrentes : fréquences, effectifs, seuils, associations, évolution, priorités. */
const R = require('./src/engine-erreurs.js');
let ko = 0, n = 0;
function ok(c, m) { n++; if (!c) { ko++; console.log('ÉCHEC :', m); } }
const PARS = [4, 4, 3, 5, 4, 4, 3, 5, 4];
/* trou : [jouable, gir, putts, pén, score, par, côté, club départ, putt1, evit, bunker] */
const T = (par, o) => { const t = [1, 1, 2, 0, par, par, 0, par >= 4 ? 1 : 0, 0, 0, 0]; Object.assign(t, o || {}); return t; };

/* Carnet vide ou trop court : rien de documenté */
const vide = R.erreursRecurrentes([]);
ok(vide.parties === 0 && vide.top.length === 0 && vide.erreurs.every(e => !e.documentee && e.manque === e.seuil), 'carnet vide : aucune erreur documentée, il manque tout le seuil');
const une = R.erreursRecurrentes([{ id: 'a', d: '2026-01-01T00:00:00Z', pc: 'p1', trous: PARS.map(p => T(p, { 0: 0, 6: 3, 1: 0, 4: p + 1 })) }]);
ok(une.top.length === 0 && une.erreurs.find(e => e.id === 'mej').n === 7 && une.erreurs.find(e => e.id === 'mej').manque === 13, 'une partie : 7 ratés sur 7 départs mais pas documenté (13 départs manquent)');

/* 8 parties de 9 trous (72 trous) sur deux parcours.
   - mises en jeu : 2 ratées à droite par partie (trous 1 et 2), driver ; renseignées sauf le trou 9 des 4 premières
   - trois-putts : 2 par partie au début, 0 ensuite
   - pénalité : trou 2 (après le raté), 1 par partie
   - greens : manqués sur les trous 1, 2, 4 ; double approche sur le trou 4 */
const parties = Array.from({ length: 8 }, (_, i) => {
  const trous = PARS.map((p, k) => {
    const t = T(p);
    if (k === 0 || k === 1) { t[0] = 0; t[6] = 3; t[1] = 0; t[4] = p + 1; }
    if (k === 1) { t[3] = 1; t[4] = p + 2; }
    if (k === 3) { t[1] = 0; t[4] = p + 2; }                    /* 2 coups de plus pour atteindre le green */
    if (i < 4 && (k === 5 || k === 7)) { t[2] = 3; t[4] += 1; }
    return t;
  });
  const renseigne = PARS.map((_, k) => (i < 4 && k === 8) ? 0 : 3);
  const coups = PARS.map((p, k) => p >= 4 ? [{ c: 'dr', p: 'dep', l: k <= 1 ? 25 : 0 }] : [{ c: 'f7', p: 'dep', l: k === 2 ? -15 : 2 }]);
  return { id: 'p' + i, d: `2026-0${1 + (i >> 1)}-1${i % 2}T10:00:00Z`, pc: i % 2 ? 'p2' : 'p1', trous, renseigne, coups };
});
const E = R.erreursRecurrentes(parties), e = id => E.erreurs.find(x => x.id === id);
ok(E.parties === 8 && E.trous === 72, '8 parties, 72 trous : ' + E.trous);
ok(e('mej').base === 52 && e('mej').n === 16 && e('mej').part === 31, 'mises en jeu : 16 ratées sur 52 renseignées (non renseignées exclues) : ' + JSON.stringify([e('mej').n, e('mej').base]));
ok(e('mej').cotes.droite === 16 && e('mej').coteDominant === 'droite', 'côté dominant : droite');
ok(e('mej').clubs[0].cle === 'dr' && e('mej').clubs[0].base === 52, 'club associé : driver (coup de départ noté)');
ok(e('mej').par18 === 4, 'mises en jeu ratées : 4 pour 18 trous');
ok(e('direction').base === 72 && e('direction').n === 24 && e('direction').cotes.droite === 16 && e('direction').cotes.gauche === 8 && e('direction').coteDominant === 'droite', 'direction : 24 coups hors axe sur 72, 16 à droite, 8 à gauche');
const f7 = e('direction').clubs.find(c => c.cle === 'f7'), dr = e('direction').clubs.find(c => c.cle === 'dr');
ok(f7 && f7.n === 8 && f7.base === 16 && dr.n === 16 && dr.base === 56, 'direction par club : fer 7 8/16, driver 16/56');
ok(e('penalites').n === 8 && e('penalites').base === 72 && e('penalites').documentee, 'pénalités : 8 trous sur 72, documenté');
ok(e('gir').n === 24 && e('gir').deduit, 'greens manqués : 24 sur 72, déduits');
ok(e('approche').base === 24 && e('approche').n === 8, 'double approche : 8 sur 24 greens manqués (trou 4)');
ok(e('troisPutts').n === 8 && e('troisPutts').evolution && e('troisPutts').evolution.sens === 'baisse' && e('troisPutts').evolution.avant.part === 22 && e('troisPutts').evolution.apres.part === 0, 'trois-putts : en baisse, 22 % puis 0 % : ' + JSON.stringify(e('troisPutts').evolution));
ok(e('mej').evolution && e('mej').evolution.sens === 'stable', 'mises en jeu : stables');
ok(e('mej').parcours.length === 2 && e('mej').parcours.every(p => p.n === 8), 'parcours associés : deux parcours, 8 ratés chacun');
/* Priorités : les trois plus fréquentes pour 18 trous parmi les documentées */
ok(E.top.length === 3 && E.top[0] === 'direction' && E.top.includes('gir'), 'priorités : trois au plus, classées par fréquence pour 18 trous : ' + E.top.join(','));
ok(E.erreurs.every(x => !x.documentee || (x.base >= x.seuil && x.n >= R.MIN_OCCURRENCES)), 'documentée = seuil d\'occasions et 5 occurrences au moins');
/* Évolution non calculée sur trop peu de parties */
ok(R.erreursRecurrentes(parties.slice(0, 3)).erreurs.every(x => x.evolution === null), 'pas d\'évolution sous quatre parties');
/* Club de départ en saisie Standard : famille */
const std = R.erreursRecurrentes([{ id: 's', d: '2026-01-01T00:00:00Z', pc: 'p1', renseigne: PARS.map(() => 3), trous: PARS.map(p => T(p, { 0: 0, 6: 1, 7: p >= 4 ? 2 : 0 })) }]);
ok(std.erreurs.find(x => x.id === 'mej').clubs[0].cle === 'f2' && R.cleClubErreur('f2').nom === 'Bois' && R.cleClubErreur('dr').id === 'dr', 'saisie Standard : la famille « Bois » est associée');

console.log(n + ' vérifications · ' + ko + ' échec' + (ko > 1 ? 's' : ''));
process.exit(ko ? 1 : 0);
