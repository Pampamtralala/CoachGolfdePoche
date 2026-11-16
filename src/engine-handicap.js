/* Coach de golf de poche — repères, coups reçus et Stableford.
   Fonctions pures. Formule française du handicap de jeu (World Handicap System) :
   index × slope / 113 + (SSS − par), avec le SSS, le slope et le par des 18 trous. */

function nbH(v) { return typeof v === "number" && isFinite(v); }
function sommeH(l) { var s = 0; for (var i = 0; i < l.length; i++) s += l[i]; return s; }

/* Repère joué : celui de la partie, sinon le premier du parcours, sinon l'ancien SSS / slope du parcours. */
function repereDe(partie, pc) {
  if (!pc) return null;
  var l = Array.isArray(pc.reps) ? pc.reps : [];
  var r = partie && nbH(partie.rep) && l[partie.rep] ? l[partie.rep] : l[0];
  if (r) return r;
  return pc.sss || pc.slope ? { n: "", sss: pc.sss || null, slope: pc.slope || null } : null;
}
/* Par des 18 trous : un parcours de 9 trous compte deux fois. Null si un par manque. */
function par18De(pc) {
  if (!pc || !pc.pars || !pc.pars.length || !pc.pars.every(function (v) { return v > 0; })) return null;
  return sommeH(pc.pars) * (pc.pars.length === 9 ? 2 : 1);
}
/* Handicap de jeu pour nJoues trous (la moitié pour 9 trous). exact : SSS, slope et pars connus. */
function handicapJeu(index, rep, pc, nJoues) {
  if (!nbH(index)) return null;
  var slope = rep && rep.slope ? rep.slope : 113, par18 = par18De(pc);
  var h = index * slope / 113 + (rep && rep.sss && par18 ? rep.sss - par18 : 0);
  if (nJoues <= 9) h /= 2;
  return { v: Math.round(h), exact: !!(rep && rep.sss && rep.slope && par18) };
}
/* Coups reçus trou par trou. hcps : handicap des trous joués, dans l'ordre de jeu (0 si inconnu).
   Les coups vont d'abord aux trous de plus petit handicap ; un handicap négatif rend des coups sur les plus grands. */
function repartirCoups(H, hcps) {
  var n = hcps.length, out = [];
  if (!n || !nbH(H)) return out;
  var ordre = hcps.map(function (v, i) { return { i: i, v: v > 0 ? v : 100 + i }; }).sort(function (a, b) { return a.v - b.v || a.i - b.i; });
  var q = Math.floor(H / n), r = H - q * n;
  ordre.forEach(function (o, rang) { out[o.i] = q + (rang < r ? 1 : 0); });
  return out;
}
function pointsStableford(score, par, recus) { return Math.max(0, 2 + par + recus - score); }
/* Handicap du trou physique h : 0 si inconnu. */
function hcpTrou(pc, h) { return pc && Array.isArray(pc.hcp) && pc.hcp[h] >= 1 && pc.hcp[h] <= 18 ? pc.hcp[h] : 0; }
/* Coups reçus d'une partie (en cours : trous peut contenir des trous vides ; finie : les trous joués). */
function coupsRecusPartie(partie, pc, index) {
  if (!partie) return null;
  var n = partie.n || partie.trous.length, o = partie.o || 0, L = pc ? pc.pars.length : 18, hc = [];
  for (var k = 0; k < n; k++) hc.push(hcpTrou(pc, (o + k) % L));
  var hj = handicapJeu(index, repereDe(partie, pc), pc, n);
  if (!hj) return null;
  var r = repartirCoups(hj.v, hc), pts = 0, net = 0, notes = 0;
  partie.trous.forEach(function (t, k) {
    if (!t || !t[4] || !t[5]) return;
    pts += pointsStableford(t[4], t[5], r[k] || 0); net += t[4] - (r[k] || 0); notes++;
  });
  return { H: hj.v, exact: hj.exact, hcpConnus: hc.every(function (v) { return v > 0; }), recus: r, points: pts, net: net, notes: notes };
}

/* ---------- Lecture d'une carte de score collée ----------
   Lignes de repères (« Jaune 69,4 121 75,5 133 », « jaune | 70 | 69.4 | 126 | 75.2 | 134 | 2628 m ») :
   chaque paire SSS (50 à 85) puis slope (55 à 155) donne un repère, Messieurs puis Dames.
   Lignes de trous : « Par 4 3 5… », « Hcp 12 2 18… » (ou Handicap, Coups reçus, CR, SI), sur une ou deux lignes. */
function paire(a, b) { return a != null && b != null && a >= 50 && a <= 85 && b === Math.round(b) && b >= 55 && b <= 155; }
var CS_COULEURS = ["blanc", "jaune", "bleu", "rouge", "noir", "vert", "orange", "violet", "or", "gris", "marron", "rose", "argent", "champion", "pro"];
function lireCarteScore(texte, nTrous) {
  var n = nTrous === 9 ? 9 : 18, reps = [], pars = [], hcp = [];
  String(texte || "").slice(0, 6000).split(/\r?\n/).forEach(function (ligne) {
    var l = ligne.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/(\d),(\d)(?!\d)/g, "$1.$2");
    var mots = l.replace(/[|;\t:]/g, " ").trim().split(/\s+/).filter(Boolean);
    if (!mots.length) return;
    var etiquette = mots[0], nums = [];
    mots.forEach(function (m) { if (/^\d+(\.\d+)?$/.test(m)) nums.push(parseFloat(m)); else if (/^[-–—]$/.test(m)) nums.push(null); });
    var entiers = nums.filter(function (v) { return v != null && v === Math.round(v); });
    if (/^(par|pars)$/.test(etiquette)) {
      entiers.forEach(function (v) { if (v >= 3 && v <= 6 && pars.length < n) pars.push(v); });
      return;
    }
    if (/^(hcp|hdcp|handicap|handicaps|cr|si|index|coups?|rec(u|us)?)$/.test(etiquette) || /^coups? recus?/.test(mots.slice(0, 2).join(" "))) {
      entiers.forEach(function (v) { if (v >= 1 && v <= 18 && hcp.length < n && hcp.indexOf(v) < 0) hcp.push(v); });
      return;
    }
    var coul = null;
    mots.slice(0, 3).forEach(function (m) { if (!coul && CS_COULEURS.indexOf(m) >= 0) coul = m; });
    if (!coul) return;
    var paires = [];
    for (var i = 0; i + 1 < nums.length; i++) {
      var a = nums[i], b = nums[i + 1];
      if (a == null && b == null) { paires.push(null); i++; continue; }
      /* « 72 72 130 » : le premier nombre est le par si le suivant forme lui-même une paire. */
      if (paire(a, b) && !paire(b, nums[i + 2])) { paires.push([Math.round(a * 10) / 10, b]); i++; }
    }
    var nom = coul.charAt(0).toUpperCase() + coul.slice(1), vraies = paires.filter(Boolean);
    paires.forEach(function (p, k) {
      if (!p || reps.length >= 8) return;
      reps.push({ n: vraies.length > 1 || k > 0 ? nom + (k === 0 ? " · Messieurs" : " · Dames") : nom, sss: p[0], slope: p[1] });
    });
  });
  return { reps: reps, pars: pars.length === n ? pars : null, hcp: hcp.length === n ? hcp : null };
}
/* Handicap des trous saisi à la main : n nombres distincts de 1 à 18. Null si la liste ne convient pas. */
function lireHcp(texte, n) {
  var l = String(texte || "").split(/[^\d]+/).filter(Boolean).map(Number);
  if (l.length !== n || l.some(function (v) { return !(v >= 1 && v <= 18); })) return null;
  for (var i = 0; i < l.length; i++) if (l.indexOf(l[i]) !== i) return null;
  return l;
}

if (typeof module !== "undefined") {
  module.exports = { repereDe, par18De, handicapJeu, repartirCoups, pointsStableford, hcpTrou, coupsRecusPartie, lireCarteScore, lireHcp };
}
