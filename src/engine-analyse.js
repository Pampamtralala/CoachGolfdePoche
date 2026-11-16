/* ============================================================
   ANALYSE DE PERFORMANCE : fonctions pures, sans accès à l'écran.
   Comparaison à l'objectif d'index, notes sur 100 par secteur, priorité de la semaine,
   erreurs évitables (pénalités, doubles approches, trois putts à moins de 5 m).
   ============================================================ */

if (typeof module !== "undefined") {
  Object.assign(globalThis, require("./data-plus.js"), require("./data-strategie.js"), require("./engine-plus.js"), require("./engine-strategie.js"));
}

/* Un trou noté avec le pavé (11 cases) : nouvelle échelle du premier putt, erreurs et bunker. */
function trouComplet(t) { return !!t && t.length >= 11; }
/* Premier putt à moins de 2 m, à moins de 5 m : oui, non, ou inconnu (null) selon l'échelle du trou. */
function premierPuttMoins(t, m) {
  if (!t || !(t[2] > 0) || !(t[8] >= 1)) return null;
  if (trouComplet(t)) return m === 2 ? t[8] <= 2 : t[8] <= 3;
  /* Ancienne échelle : < 1 m, 1 à 3 m, 3 à 8 m, plus de 8 m. */
  if (m === 2) return t[8] === 1 ? true : t[8] >= 3 ? false : null;
  return t[8] <= 2 ? true : t[8] === 4 ? false : null;
}

/* ---------- Erreurs évitables ---------- */
function erreursTrou(t) {
  if (!t) return { pen: 0, double: 0, putt3: 0 };
  var c = trouComplet(t), court = premierPuttMoins(t, 5);
  return {
    pen: t[3] || 0,
    double: c && (t[9] & EVIT_DOUBLE) ? 1 : 0,
    putt3: t[2] >= 3 && (court === true || (c && (t[9] & EVIT_PUTT3))) ? 1 : 0
  };
}
function erreursPartie(pt) {
  var r = { pen: 0, double: 0, putt3: 0, total: 0, trous: [], complet: 0, T: 0 }, o = pt.o || 0;
  (pt.trous || []).forEach(function (t, k) {
    if (!t) return;
    r.T++; if (trouComplet(t)) r.complet++;
    var e = erreursTrou(t), n = e.pen + e.double + e.putt3;
    r.pen += e.pen; r.double += e.double; r.putt3 += e.putt3;
    if (n) r.trous.push({ h: k + o, pen: e.pen, double: e.double, putt3: e.putt3 });
  });
  r.total = r.pen + r.double + r.putt3;
  return r;
}
/* Moyennes par partie de 18 trous, sur les parties récentes (maxTrous au plus). Les doubles approches
   ne se comptent que sur les trous notés avec le pavé, où elles pouvaient être marquées. */
function erreursEvitables(parties, maxTrous) {
  var s = { pen: 0, double: 0, putt3: 0, T: 0, Tc: 0, n: 0 };
  for (var i = (parties || []).length - 1; i >= 0; i--) {
    var p = parties[i];
    if (s.n && s.T + p.trous.length > (maxTrous || 90)) break;
    var e = erreursPartie(p);
    s.pen += e.pen; s.double += e.double; s.putt3 += e.putt3; s.T += e.T; s.Tc += e.complet; s.n++;
  }
  if (!s.T) return null;
  var k = 18 / s.T, r1 = function (v) { return Math.round(v * 10) / 10; };
  var r = { T: s.T, Tc: s.Tc, n: s.n, pen: r1(s.pen * k), putt3: r1(s.putt3 * k), double: s.Tc >= 9 ? r1(s.double * 18 / s.Tc) : null };
  /* Nombre d'erreurs par partie : un coup de pénalité compte pour une erreur, comme une double approche ou un trois-putts court. */
  r.erreurs = r1(r.pen + r.putt3 + (r.double || 0));
  r.coups = r.erreurs;
  return r;
}

/* ---------- Mesures par secteur ---------- */
function moyenneA(l) { return l.length ? l.reduce(function (s, x) { return s + x; }, 0) / l.length : null; }
function recentes(parties, maxTrous) {
  var l = [], T = 0;
  for (var i = (parties || []).length - 1; i >= 0; i--) {
    var p = parties[i];
    if (l.length && T + p.trous.length > maxTrous) break;
    l.unshift(p); T += p.trous.length;
  }
  return l;
}
/* Valeurs du joueur pour chaque mesure, avec le nombre d'occasions. */
function mesuresJoueur(parties, maxTrous) {
  var l = recentes(parties, maxTrous || 90), m = {};
  var T = 0, longs = 0, jou = 0, X = 0, G = 0, P = 0, P3 = 0, PG = 0, MN = 0, SV = 0, Tc = 0, dbl = 0;
  var prox = [], sable = [0, 0], r2 = [0, 0], r5 = [0, 0];
  l.forEach(function (pt) {
    pt.trous.forEach(function (t) {
      if (!t) return;
      T++; X += t[3]; G += t[1]; P += t[2]; if (t[2] >= 3) P3++;
      if (t[1]) PG += t[2];
      if (!(t[5] === 3)) { longs++; jou += t[0]; }
      if (trouNote(t) && !t[1]) { MN++; if (t[4] <= t[5]) SV++; }
      if (trouComplet(t)) {
        Tc++; if (t[9] & EVIT_DOUBLE) dbl++;
        if (t[1] && t[2] > 0 && t[8] >= 1) prox.push(PUTT1B_METRES[t[8]]);
        if (t[10]) { sable[1]++; if (t[10] === 1 && t[2] <= 1) sable[0]++; }
      }
      var c2 = premierPuttMoins(t, 2), c5 = premierPuttMoins(t, 5);
      if (c2 === true) { r2[1]++; if (t[2] === 1) r2[0]++; }
      if (c5 === true) { r5[1]++; if (t[2] === 1) r5[0]++; }
    });
  });
  if (!T) return null;
  var k = 18 / T;
  m.T = T; m.n = l.length; m.Tc = Tc;
  m.jouable = longs >= 9 ? { v: 100 * jou / longs, n: longs } : null;
  m.pen = { v: X * k, n: T };
  m.gir = { v: G * k, n: T };
  m.prox = prox.length >= 5 ? { v: moyenneA(prox), n: prox.length } : null;
  m.sv = MN >= 5 ? { v: 100 * SV / MN, n: MN } : null;
  m.double = Tc >= 18 ? { v: dbl * 18 / Tc, n: Tc } : null;
  m.sable = sable[1] >= 3 ? { v: 100 * sable[0] / sable[1], n: sable[1] } : null;
  m.r2 = r2[1] >= 5 ? { v: 100 * r2[0] / r2[1], n: r2[1] } : null;
  m.r5 = r5[1] >= 8 ? { v: 100 * r5[0] / r5[1], n: r5[1] } : null;
  m.p3 = { v: P3 * k, n: T };
  m.pg = G >= 5 ? { v: PG / G, n: G } : null;
  m.putts = { v: P * k, n: T };
  return m;
}
/* Repères d'une mesure : série sur l'échelle des index (SG_INDEX). */
function serieRepere(id) {
  if (REPERES_PLUS[id]) return REPERES_PLUS[id];
  if (id === "pen") return SG_REPERES.x;
  if (id === "putts") return SG_INDEX.map(function (x, i) { var g = SG_REPERES.gir[i]; return g * SG_REPERES.pg[i] + (18 - g) * SG_REPERES.pm[i]; });
  return SG_REPERES[id] || null;
}
function repereA(id, index) { var s = serieRepere(id); return s ? interpS(SG_INDEX, s, index) : null; }
/* Index auquel correspond une valeur : la série des repères lue à l'envers, bornée de 0 à 54. */
function indexEquivalent(v, serie) {
  var xs = SG_INDEX, n = serie.length, monte = serie[n - 1] > serie[0];
  /* monte : la valeur grandit avec l'index (moins bien quand elle monte). */
  if (monte ? v <= serie[0] : v >= serie[0]) return 0;
  if (monte ? v >= serie[n - 1] : v <= serie[n - 1]) return xs[n - 1];
  for (var k = 0; k < n - 1; k++) {
    var a = serie[k], b = serie[k + 1];
    if ((v - a) * (v - b) <= 0 && a !== b) return xs[k] + (v - a) / (b - a) * (xs[k + 1] - xs[k]);
  }
  return xs[n - 1];
}
var MESURES_SECTEUR = {
  depart:  [["jouable", 2], ["pen", 1]],
  attaque: [["gir", 2], ["prox", 1]],
  petit:   [["sv", 2], ["double", 1], ["sable", 1]],
  putting: [["r2", 1], ["r5", 1], ["p3", 1], ["pg", 1]]
};
var LIB_MESURE = {
  jouable: ["Départs jouables", "%"], pen: ["Coups de pénalité", "par partie"], gir: ["Greens en régulation", "sur 18"],
  prox: ["Premier putt après un green touché", "m"], sv: ["Pars sauvés après un green manqué", "%"], double: ["Doubles approches", "par partie"],
  sable: ["Sorties de bunker qui sauvent le par", "%"], r2: ["Putts rentrés à moins de 2 m", "%"], r5: ["Putts rentrés à moins de 5 m", "%"],
  p3: ["Trous à 3 putts ou plus", "sur 18"], pg: ["Putts par green touché", "par green"], putts: ["Putts", "par partie"]
};
/* Notes sur 100 : chaque mesure est traduite en index équivalent, le secteur en fait la moyenne pondérée,
   et 100 correspond au niveau scratch, 0 à un index 54. */
function notesSecteurs(parties) {
  var m = mesuresJoueur(parties, 90);
  if (!m || m.T < NOTES_MIN_TROUS) return null;
  var secteurs = NOTES_SECTEURS.map(function (s) {
    var tot = 0, poids = 0, det = [];
    MESURES_SECTEUR[s.id].forEach(function (x) {
      var me = m[x[0]], serie = serieRepere(x[0]);
      if (!me || !serie) return;
      var ie = indexEquivalent(me.v, serie);
      tot += ie * x[1]; poids += x[1];
      det.push({ id: x[0], lib: LIB_MESURE[x[0]][0], unite: LIB_MESURE[x[0]][1], v: me.v, n: me.n, index: Math.round(ie) });
    });
    if (!poids) return { id: s.id, nom: s.nom, d: s.d, note: null, index: null, mesures: det };
    var idx = tot / poids;
    return { id: s.id, nom: s.nom, d: s.d, note: Math.round(100 * (54 - idx) / 54), index: Math.round(idx), mesures: det };
  });
  return { T: m.T, n: m.n, secteurs: secteurs };
}

/* ---------- Comparaison à l'objectif d'index ---------- */
var COMPARAISON = [
  { id: "jouable", sens: "haut", dec: 0 }, { id: "gir", sens: "haut", dec: 1 }, { id: "prox", sens: "bas", dec: 1 },
  { id: "sv", sens: "haut", dec: 0 }, { id: "sable", sens: "haut", dec: 0 }, { id: "double", sens: "bas", dec: 1 },
  { id: "r2", sens: "haut", dec: 0 }, { id: "r5", sens: "haut", dec: 0 }, { id: "putts", sens: "bas", dec: 1 }, { id: "pen", sens: "bas", dec: 1 }
];
function comparaisonObjectif(parties, objectif) {
  var m = mesuresJoueur(parties, 90);
  return COMPARAISON.map(function (c) {
    var me = m ? m[c.id] : null, ref = repereA(c.id, objectif);
    var mieux = me ? (c.sens === "haut" ? me.v >= ref : me.v <= ref) : null;
    return { id: c.id, lib: LIB_MESURE[c.id][0], unite: LIB_MESURE[c.id][1], moi: me ? me.v : null, n: me ? me.n : 0, cible: ref, mieux: mieux, dec: c.dec };
  });
}
/* Les secteurs où le joueur perd le plus de coups face à son objectif, et la priorité de la semaine.
   Sans coups gagnés mesurables, la note la plus basse fait la priorité. */
function prioriteSemaine(parties, objectif) {
  var r = coupsGagnes(parties, objectif), notes = notesSecteurs(parties);
  var noteDe = function (id) { var s = notes ? notes.secteurs.filter(function (x) { return x.id === id; })[0] : null; return s ? s.note : null; };
  var l = r ? r.secteurs.filter(function (s) { return s.sg != null && s.sg < 0; }).sort(function (a, b) { return a.sg - b.sg; }) : [];
  var deux = l.slice(0, 2).map(function (s) { return { id: s.id, nom: s.nom, d: s.d, sg: s.sg, note: noteDe(s.id) }; });
  var prio = deux[0] || null;
  if (!prio && notes) {
    var bas = notes.secteurs.filter(function (s) { return s.note != null; }).sort(function (a, b) { return a.note - b.note; })[0];
    if (bas) prio = { id: bas.id, nom: bas.nom, d: bas.d, sg: null, note: bas.note };
  }
  return { cg: r, notes: notes, deux: deux, priorite: prio };
}

if (typeof module !== "undefined") {
  module.exports = { trouComplet, premierPuttMoins, erreursTrou, erreursPartie, erreursEvitables, mesuresJoueur, serieRepere, repereA, indexEquivalent, notesSecteurs, comparaisonObjectif, prioriteSemaine, MESURES_SECTEUR, LIB_MESURE };
}
