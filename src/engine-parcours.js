/* Coach de golf de poche — fiche d'un parcours et passages sur un trou (roadmap DATA, P07). Fonctions pures.
   Un trou de partie est rapproché du trou physique du parcours par le départ de la partie (o : 9 pour un
   retour) : trou physique = (o + k) modulo le nombre de trous. Un neuf trous joué deux fois repasse par
   les mêmes trous. Seuls comptent les passages réels : un trou sans score n'est pas un passage. */

var NOMS_TRACES = { complet18: "18 trous", complet9: "9 trous", aller: "Aller (1 à 9)", retour: "Retour (10 à 18)", double: "18 trous (deux tours)" };

function trouJoue(t) { return Array.isArray(t) && t[4] > 0 && t[5] > 0; }
function jourParcours(d) { return typeof d === "string" ? d.slice(0, 10) : null; }
function bitParcours(renseigne, k, bit) { return !Array.isArray(renseigne) || !!(renseigne[k] & bit); }
function triChrono(l) { return l.slice().sort(function (a, b) { return (a.d || "") < (b.d || "") ? -1 : (a.d || "") > (b.d || "") ? 1 : 0; }); }

/* Tracé d'une partie sur son parcours : 18 trous, 9 trous, aller, retour, deux tours d'un neuf trous. */
function traceDe(p, pc) {
  var L = pc.pars.length, n = p.trous.length, o = p.o || 0;
  if (L === 18 && n === 18) return "complet18";
  if (L === 18 && n === 9) return o === 9 ? "retour" : o === 0 ? "aller" : "autre";
  if (L === 9 && n === 9) return "complet9";
  if (L === 9 && n === 18) return "double";
  return "autre";
}
function nomTrace(id, n) { return NOMS_TRACES[id] || (n + " trous"); }

/* Fiche du parcours : passages, score par tracé (moyenne, meilleur, dernier), évolution chronologique. */
function ficheParcours(parties, pc) {
  var l = triChrono((parties || []).filter(function (p) { return p && p.pc === pc.id && Array.isArray(p.trous) && p.trous.length; }));
  var traces = {}, evolution = [], incompletes = 0;
  l.forEach(function (p) {
    var id = traceDe(p, pc), T = traces[id] = traces[id] || { id: id, lib: nomTrace(id, p.trous.length), trous: p.trous.length, parties: 0, scores: [], meilleur: null, dernier: null };
    T.parties++;
    if (!p.trous.every(trouJoue)) { incompletes++; return; }
    var score = 0, par = 0;
    p.trous.forEach(function (t) { score += t[4]; par += t[5]; });
    var s = { id: p.id || null, d: jourParcours(p.d), trace: id, score: score, par: par, ecart: score - par };
    T.scores.push(s); evolution.push(s);
    if (!T.meilleur || s.ecart < T.meilleur.ecart) T.meilleur = s;
    T.dernier = s;
  });
  var liste = Object.keys(traces).map(function (k) {
    var T = traces[k], n = T.scores.length;
    T.n = n;
    T.moyenne = n ? T.scores.reduce(function (a, s) { return a + s.ecart; }, 0) / n : null;
    T.moyenneScore = n ? T.scores.reduce(function (a, s) { return a + s.score; }, 0) / n : null;
    /* Tendance : moitié ancienne contre moitié récente, à partir de 4 scores complets. */
    if (n >= 4) {
      var m = Math.floor(n / 2), moy = function (x) { return x.reduce(function (a, s) { return a + s.ecart; }, 0) / x.length; };
      T.tendance = { n: m, avant: moy(T.scores.slice(0, m)), apres: moy(T.scores.slice(n - m)) };
      T.tendance.d = T.tendance.apres - T.tendance.avant;
    } else T.tendance = null;
    return T;
  }).sort(function (a, b) { return b.parties - a.parties || b.trous - a.trous; });
  return { parties: l.length, incompletes: incompletes, traces: liste, evolution: evolution, premiere: l.length ? jourParcours(l[0].d) : null, derniere: l.length ? jourParcours(l[l.length - 1].d) : null };
}

/* Passages réels sur le trou physique h (0 = trou 1), du plus ancien au plus récent. */
function passagesTrou(parties, pc, h) {
  var L = pc.pars.length, out = [], sansScore = 0;
  triChrono((parties || []).filter(function (p) { return p && p.pc === pc.id && Array.isArray(p.trous); })).forEach(function (p) {
    p.trous.forEach(function (t, k) {
      if (((p.o || 0) + k) % L !== h) return;
      if (!trouJoue(t)) { sansScore++; return; }
      var coups = Array.isArray(p.coups) && Array.isArray(p.coups[k]) ? p.coups[k] : [];
      out.push({ partieId: p.id || null, jour: jourParcours(p.d), k: k, tour: Math.floor(((p.o || 0) + k) / L) + 1,
        par: t[5], score: t[4], ecart: t[4] - t[5], putts: t[2], pen: t[3] || 0, gir: !!t[1],
        /* Mise en jeu : par 4 et 5, et seulement si elle a été renseignée. */
        mej: t[5] >= 4 && bitParcours(p.renseigne, k, 1) ? { j: t[0] ? 1 : 0, cote: t[0] ? 0 : (t[6] || 0) } : null,
        clubDepart: t[5] >= 4 && t[7] && bitParcours(p.renseigne, k, 2) ? t[7] : 0,
        /* Coups notés : club, position de départ, distance seulement si elle a été mesurée (jamais une estimation). */
        coups: coups.filter(function (c) { return c && typeof c.c === "string"; }).map(function (c) {
          var st = statutDistance(c);
          return { c: c.c, p: c.p || null, t: c.t || null, d: st === "gps" || st === "declaree" ? c.d : null, gps: st === "gps" };
        }) });
    });
  });
  return { h: h, par: pc.pars[h], passages: out, sansScore: sansScore };
}

/* Résumé d'un trou à partir de ses passages : moyenne, meilleur, erreurs. */
function bilanPassages(P) {
  var l = P.passages, n = l.length, r = { n: n, moyenne: null, meilleur: null, pire: null, putts: null, penalites: 0, avecPenalite: 0,
    troisPutts: 0, doubles: 0, mej: { n: 0, jouables: 0, gauche: 0, droite: 0, courtes: 0 }, girs: 0 };
  if (!n) return r;
  var s = 0, p = 0;
  l.forEach(function (x) {
    s += x.ecart; p += x.putts; r.penalites += x.pen; if (x.pen) r.avecPenalite++;
    if (x.putts >= 3) r.troisPutts++;
    if (x.ecart >= 2) r.doubles++;
    if (x.gir) r.girs++;
    if (r.meilleur == null || x.ecart < r.meilleur) r.meilleur = x.ecart;
    if (r.pire == null || x.ecart > r.pire) r.pire = x.ecart;
    if (x.mej) { r.mej.n++; if (x.mej.j) r.mej.jouables++; else if (x.mej.cote === 1) r.mej.gauche++; else if (x.mej.cote === 2) r.mej.courtes++; else if (x.mej.cote === 3) r.mej.droite++; }
  });
  r.moyenne = s / n; r.putts = p / n;
  r.mej.ratees = r.mej.n - r.mej.jouables;
  return r;
}

/* Parties qu'on ne peut rapprocher d'aucun parcours connu : elles ne comptent dans aucune fiche. */
function partiesSansParcours(parties, liste) {
  var ids = {};
  (liste || []).forEach(function (pc) { ids[pc.id] = true; });
  return (parties || []).filter(function (p) { return p && !(p.pc && ids[p.pc]); }).length;
}

if (typeof module !== "undefined") {
  var EPp = require("./engine-plus.js");
  var statutDistance = EPp.statutDistance;
  module.exports = { ficheParcours, passagesTrou, bilanPassages, traceDe, nomTrace, partiesSansParcours, trouJoue };
}
