/* Coach de golf de poche — analyse du putting (roadmap DATA, P08). Fonctions pures.
   Base : les trous joués avec un score (le nombre de putts y est toujours noté, 0 compris).
   La longueur du premier putt est facultative : elle n'est lue que là où elle a été notée, regroupée en
   court / moyen / long. Aucun taux de réussite à une distance précise n'est calculé. */

/* Rang noté → catégorie. Échelle à cinq rangs (trous à 11 cases) : < 1 m, 1–2 m, 2–5 m, 5–10 m, > 10 m.
   Ancienne échelle à quatre rangs : < 1 m, 1–3 m, 3–8 m, > 8 m. */
var CATEGORIES_PUTT = [
  { id: "court", lib: "Court", aide: "moins de 2 m (anciennes parties : moins de 3 m)" },
  { id: "moyen", lib: "Moyen", aide: "de 2 à 5 m (anciennes parties : de 3 à 8 m)" },
  { id: "long", lib: "Long", aide: "plus de 5 m (anciennes parties : plus de 8 m)" }
];
var RANG_CINQ = [null, "court", "court", "moyen", "long", "long"], RANG_QUATRE = [null, "court", "court", "moyen", "long"];

function categoriePutt(t) {
  if (!Array.isArray(t) || !(t[2] >= 1) || !(t[8] >= 1)) return null;
  return (t.length >= 11 ? RANG_CINQ : RANG_QUATRE)[t[8]] || null;
}
function puttJoue(t) { return Array.isArray(t) && t[4] > 0 && t[5] > 0 && typeof t[2] === "number"; }
function partP(a, b) { return b ? Math.round(100 * a / b) : null; }
function moy2(a, b) { return b ? Math.round(100 * a / b) / 100 : null; }

/* Agrégat d'une liste de trous joués. */
function agregatPutts(trous) {
  var r = { trous: trous.length, putts: 0, zero: 0, un: 0, deux: 0, troisPlus: 0, difficiles: 0 };
  trous.forEach(function (t) {
    r.putts += t[2];
    if (t[2] === 0) r.zero++; else if (t[2] === 1) r.un++; else if (t[2] === 2) r.deux++; else r.troisPlus++;
    if (t[11] === 1 && t[2] >= 2) r.difficiles++;
  });
  r.parTrou = moy2(r.putts, r.trous);
  r.par18 = r.trous ? Math.round(10 * 18 * r.putts / r.trous) / 10 : null;
  r.partUn = partP(r.un, r.trous); r.partDeux = partP(r.deux, r.trous); r.partTrois = partP(r.troisPlus, r.trous); r.partZero = partP(r.zero, r.trous);
  return r;
}

function triPutt(l) { return l.slice().sort(function (a, b) { return (a.d || "") < (b.d || "") ? -1 : (a.d || "") > (b.d || "") ? 1 : 0; }); }

/* parties : déjà filtrées (tableau de bord). */
function analysePutting(parties) {
  var l = triPutt((parties || []).filter(function (p) { return p && Array.isArray(p.trous); }));
  var tous = [], parPartie = [], parPc = {}, gir = [], horsGir = [], cats = { court: [], moyen: [], long: [] }, sansLongueur = 0;
  l.forEach(function (p) {
    var tp = p.trous.filter(puttJoue);
    parPartie.push(tp);
    tp.forEach(function (t) {
      tous.push(t);
      (t[1] ? gir : horsGir).push(t);
      if (p.pc) (parPc[p.pc] = parPc[p.pc] || []).push(t);
      if (t[2] >= 1) { var c = categoriePutt(t); if (c) cats[c].push(t); else sansLongueur++; }
    });
  });
  var r = { parties: l.length, total: agregatPutts(tous) };
  r.gir = { avec: agregatPutts(gir), sans: agregatPutts(horsGir) };
  r.premierPutt = { categories: CATEGORIES_PUTT.map(function (c) { var a = agregatPutts(cats[c.id]); a.id = c.id; a.lib = c.lib; a.aide = c.aide; return a; }), sansLongueur: sansLongueur };
  r.premierPutt.notes = cats.court.length + cats.moyen.length + cats.long.length;
  r.difficiles = { n: r.total.difficiles, apresLong: agregatPutts(cats.long).difficiles };
  r.parcours = Object.keys(parPc).map(function (k) { var a = agregatPutts(parPc[k]); a.pc = k; return a; }).sort(function (a, b) { return b.trous - a.trous; });
  /* Évolution : première moitié des parties contre la seconde, chacune avec au moins 18 trous. */
  var m = Math.floor(l.length / 2);
  r.evolution = null;
  if (m >= 2) {
    var A = agregatPutts([].concat.apply([], parPartie.slice(0, m))), B = agregatPutts([].concat.apply([], parPartie.slice(l.length - m)));
    if (A.trous >= 18 && B.trous >= 18) r.evolution = { parties: m, avant: A, apres: B, dParTrou: Math.round(100 * (B.parTrou - A.parTrou)) / 100, dTrois: B.partTrois - A.partTrois };
  }
  /* Série par partie (putts ramenés à 18 trous), pour un graphique. */
  r.serie = l.map(function (p, i) { var a = agregatPutts(parPartie[i]); return { id: p.id || null, d: typeof p.d === "string" ? p.d.slice(0, 10) : null, trous: a.trous, par18: a.par18 }; })
    .filter(function (x) { return x.trous; });
  return r;
}

if (typeof module !== "undefined") {
  module.exports = { analysePutting, agregatPutts, categoriePutt, CATEGORIES_PUTT };
}
