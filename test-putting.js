/* P08 — putting : cohérence avec le nombre de trous, valeurs absentes, catégories de longueur, GIR, évolution. */
const K = require('./src/engine-putting.js');
let ko = 0, n = 0;
function ok(c, m) { n++; if (!c) { ko++; console.log('ÉCHEC :', m); } }
const PARS = [4, 4, 3, 5, 4, 4, 3, 5, 4];
/* trou : [jouable, gir, putts, pén, score, par, côté, club départ, putt1, evit, bunker(, second difficile)] */
const T = (par, putts, o) => { const t = [1, 0, putts, 0, par + putts - 1, par, 0, 0, 0, 0, 0]; Object.assign(t, o || {}); return t; };

/* Catégories : échelle à cinq rangs et ancienne échelle à quatre rangs */
ok(K.categoriePutt([1, 1, 2, 0, 4, 4, 0, 0, 2, 0, 0]) === 'court' && K.categoriePutt([1, 1, 2, 0, 4, 4, 0, 0, 3, 0, 0]) === 'moyen' && K.categoriePutt([1, 1, 2, 0, 4, 4, 0, 0, 4, 0, 0]) === 'long', 'cinq rangs : 1–2 m court, 2–5 m moyen, 5–10 m long');
ok(K.categoriePutt([1, 1, 2, 0, 4, 4, 0, 0, 3]) === 'moyen' && K.categoriePutt([1, 1, 2, 0, 4, 4, 0, 0, 4]) === 'long', 'quatre rangs (anciennes parties) : 3–8 m moyen, > 8 m long');
ok(K.categoriePutt([1, 1, 2, 0, 4, 4, 0, 0, 0, 0, 0]) === null && K.categoriePutt([1, 1, 0, 0, 3, 4, 0, 0, 3, 0, 0]) === null, 'longueur non notée ou aucun putt : pas de catégorie');

/* Carnet vide */
const vide = K.analysePutting([]);
ok(vide.total.trous === 0 && vide.total.parTrou === null && vide.evolution === null && vide.premierPutt.notes === 0, 'carnet vide : rien d\'inventé');

/* 4 parties de 9 trous ; la 4e a un trou sans score (non compté) */
const parties = [0, 1, 2, 3].map(i => ({
  id: 'p' + i, d: '2026-0' + (i + 1) + '-01T10:00:00Z', pc: i % 2 ? 'p2' : 'p1',
  trous: PARS.map((p, k) => {
    /* premières parties : 3 putts sur les trous 1 et 2 ; ensuite 2 putts. Un putt sur le trou 3 (GIR). Chip-in au trou 9. */
    const putts = k === 8 ? 0 : k === 2 ? 1 : (i < 2 && k <= 1) ? 3 : 2;
    const t = T(p, putts, { 1: k === 2 || k === 4 ? 1 : 0, 8: k === 0 ? 4 : k === 2 ? 1 : k === 4 ? 3 : 0 });
    if (i === 0 && k === 0) t.push(1);                           /* second putt difficile après un long premier putt */
    return t;
  })
}));
parties[3].trous[5][4] = 0;
const R = K.analysePutting(parties);
ok(R.total.trous === 35, '35 trous joués (un trou sans score exclu) : ' + R.total.trous);
ok(R.total.zero + R.total.un + R.total.deux + R.total.troisPlus === R.total.trous, 'zéro + un + deux + trois putts = nombre de trous');
ok(R.total.troisPlus === 4 && R.total.un === 4 && R.total.zero === 4 && R.total.deux === 23, 'répartition : ' + JSON.stringify([R.total.zero, R.total.un, R.total.deux, R.total.troisPlus]));
ok(R.total.putts === 4 * 3 + 4 * 1 + 23 * 2 && R.total.parTrou === 1.77, 'putts par trou : ' + R.total.parTrou);
ok(R.gir.avec.trous === 8 && R.gir.sans.trous === 27 && R.gir.avec.un === 4, 'GIR : 8 trous en régulation dont 4 un-putt ; 27 sans');
const cat = id => R.premierPutt.categories.find(c => c.id === id);
ok(cat('court').trous === 4 && cat('moyen').trous === 4 && cat('long').trous === 4 && cat('long').troisPlus === 2, 'catégories : 4 courts, 4 moyens, 4 longs dont 2 trois-putts');
ok(R.premierPutt.notes === 12 && R.premierPutt.sansLongueur === 35 - 12 - 4, 'premier putt noté 12 fois, non noté sur ' + R.premierPutt.sansLongueur + ' trous avec putt (les chip-in ne comptent pas)');
ok(R.difficiles.n === 1 && R.difficiles.apresLong === 1, 'second putt difficile : signalé une fois, après un premier putt long');
ok(R.evolution === null, 'seconde moitié à 17 trous joués : pas d\'évolution');
const complet = JSON.parse(JSON.stringify(parties)); complet[3].trous[5][4] = 5;
const R2 = K.analysePutting(complet);
ok(R2.evolution && R2.evolution.parties === 2 && R2.evolution.avant.troisPlus === 4 && R2.evolution.apres.troisPlus === 0 && R2.evolution.dTrois < 0, 'évolution : les trois-putts disparaissent');
ok(R.parcours.length === 2 && R.parcours[0].trous + R.parcours[1].trous === 35, 'par parcours : la somme fait le total');
ok(R.serie.length === 4 && R.serie[3].trous === 8, 'série par partie, trous joués comptés');
/* Évolution non calculée si une moitié a moins de 18 trous */
ok(K.analysePutting(parties.slice(0, 3)).evolution === null || K.analysePutting(parties.slice(0, 3)).evolution.avant.trous >= 18, 'pas d\'évolution sur trop peu de trous');
ok(K.analysePutting(parties.slice(0, 2)).evolution === null, 'pas d\'évolution sous quatre parties');

console.log(n + ' vérifications · ' + ko + ' échec' + (ko > 1 ? 's' : ''));
process.exit(ko ? 1 : 0);
