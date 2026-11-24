/* Coach de golf de poche — tableau de bord statistique (roadmap DATA, P05). Fonctions pures.
   Chaque chiffre vient avec son effectif ; les comparaisons 9 / 18 trous sont ramenées à 18 trous et le disent ;
   une valeur déduite (green en régulation) est marquée comme telle ; sans donnée, la valeur est null. */

function jourStat(v) { return typeof v === "string" ? v.slice(0, 10) : typeof v === "number" && isFinite(v) ? new Date(v).toISOString().slice(0, 10) : null; }
function formatPartie(p) { return p && p.trous && p.trous.length <= 9 ? "9" : "18"; }

/* Sélection des parties : f = { parcours, debut, fin, format ("9" | "18"), derniers (nombre), avant (nombre de parties
   à sauter depuis la fin, pour la période de comparaison) }. L'ordre chronologique est gardé. */
function selectionParties(parties, f) {
  f = f || {};
  var debut = jourStat(f.debut), fin = jourStat(f.fin);
  var l = (parties || []).filter(function (p) {
    if (!p || !Array.isArray(p.trous) || !p.trous.length) return false;
    if (f.parcours && p.pc !== f.parcours) return false;
    if (f.format && formatPartie(p) !== f.format) return false;
    var j = jourStat(p.d);
    if ((debut || fin) && !j) return false;
    if (debut && j < debut) return false;
    if (fin && j > fin) return false;
    return true;
  });
  if (f.avant) l = l.slice(0, Math.max(0, l.length - f.avant));
  if (f.derniers) l = l.slice(-f.derniers);
  return l;
}

/* Période de comparaison : même nombre de jours, juste avant le début. debut et fin au format AAAA-MM-JJ, inclus. */
function periodePrecedente(debut, fin) {
  debut = jourStat(debut); fin = jourStat(fin);
  if (!debut || !fin || fin < debut) return null;
  var J = 86400000, d = Date.parse(debut + "T00:00:00Z"), f = Date.parse(fin + "T00:00:00Z");
  if (!isFinite(d) || !isFinite(f)) return null;
  var n = Math.round((f - d) / J) + 1;
  return { debut: new Date(d - n * J).toISOString().slice(0, 10), fin: new Date(d - J).toISOString().slice(0, 10), jours: n };
}

function arrondiStat(v) { return v == null || !isFinite(v) ? null : Math.round(v * 10) / 10; }
function part(a, b) { return b ? Math.round(100 * a / b) : null; }

/* Statistiques d'un ensemble de parties. */
function tableauStats(parties) {
  var l = parties || [], s = { T: 0, N: 0, S: 0, PAR: 0, P: 0, P3: 0, P1: 0, X: 0, G: 0 };
  var mej = { n: 0, jouables: 0, gauche: 0, droite: 0, courtes: 0, ratees: 0, inconnues: 0 };
  var parPartie = [], neuf = [], dixHuit = [];
  l.forEach(function (p) {
    var st = statsTrous(p.trous), m = misesEnJeu(p.trous, p.renseigne);
    s.T += st.T; s.N += st.N; s.S += st.S; s.PAR += st.PAR; s.P += st.P; s.P3 += st.P3; s.X += st.X; s.G += st.G;
    p.trous.forEach(function (t) { if (t && t[2] === 1) s.P1++; });
    Object.keys(mej).forEach(function (k) { mej[k] += m[k]; });
    var complet = st.N === st.T && st.T > 0;
    if (complet) {
      var e = st.S - st.PAR;
      parPartie.push({ d: jourStat(p.d), id: p.id || null, trous: st.T, score: st.S, ecart: e, ecart18: arrondiStat(e * 18 / st.T) });
      (st.T <= 9 ? neuf : dixHuit).push(st.S);
    }
  });
  var moy = function (v) { if (!v.length) return null; var t = 0; v.forEach(function (x) { t += x; }); return arrondiStat(t / v.length); };
  var k = s.T ? 18 / s.T : 0;
  return {
    parties: l.length, trous: s.T, trousScore: s.N, premiere: l.length ? jourStat(l[0].d) : null, derniere: l.length ? jourStat(l[l.length - 1].d) : null,
    /* Score : écart au par ramené à 18 trous (base explicite), et scores bruts séparés par format. */
    ecart18: s.N ? arrondiStat((s.S - s.PAR) * 18 / s.N) : null,
    scoreBrut18: moy(dixHuit), parties18: dixHuit.length, scoreBrut9: moy(neuf), parties9: neuf.length,
    puttsParTrou: s.T ? Math.round(100 * s.P / s.T) / 100 : null, putts18: s.T ? arrondiStat(s.P * k) : null,
    troisPutts: s.P3, troisPutts18: s.T ? arrondiStat(s.P3 * k) : null, partTroisPutts: part(s.P3, s.T),
    unPutt: s.P1, partUnPutt: part(s.P1, s.T),
    penalites: s.X, penalites18: s.T ? arrondiStat(s.X * k) : null,
    gir: s.G, gir18: s.T ? arrondiStat(s.G * k) : null, partGir: part(s.G, s.T), girDeduit: true,
    mej: { n: mej.n, jouables: mej.jouables, part: part(mej.jouables, mej.n), inconnues: mej.inconnues,
      gauche: mej.gauche, droite: mej.droite, courtes: mej.courtes, ratees: mej.ratees },
    parPartie: parPartie
  };
}

/* Comparaison de deux périodes : écarts sur les valeurs ramenées à une même base ; null si l'une manque. */
var STATS_COMPAREES = [
  { k: "ecart18", mieux: "bas" }, { k: "putts18", mieux: "bas" }, { k: "troisPutts18", mieux: "bas" },
  { k: "penalites18", mieux: "bas" }, { k: "gir18", mieux: "haut" }];
function comparerStats(a, b) {
  var r = {};
  STATS_COMPAREES.forEach(function (x) {
    var va = a[x.k], vb = b[x.k];
    r[x.k] = va == null || vb == null ? null : { d: arrondiStat(va - vb), mieux: Math.abs(va - vb) < 0.15 ? 0 : (x.mieux === "bas" ? va < vb : va > vb) ? 1 : -1 };
  });
  var pa = a.mej.part, pb = b.mej.part;
  r.mej = pa == null || pb == null ? null : { d: pa - pb, mieux: Math.abs(pa - pb) < 1 ? 0 : pa > pb ? 1 : -1 };
  return r;
}

if (typeof module !== "undefined") {
  var EPs = require("./engine-plus.js");
  var statsTrous = EPs.statsTrous, misesEnJeu = EPs.misesEnJeu;
  module.exports = { selectionParties, periodePrecedente, tableauStats, comparerStats, formatPartie, STATS_COMPAREES };
}
