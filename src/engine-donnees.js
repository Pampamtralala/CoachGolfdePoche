/* Coach de golf de poche — identifiants stables des données (roadmap DATA, P01).
   Chaque partie, coup et série de practice reçoit un identifiant qui ne change plus :
   - créé à la saisie (aléatoire, horodaté) ;
   - pour les anciennes données, calculé à partir du contenu et de la position (déterministe : le même
     résultat à chaque chargement, même si l'écriture précédente a échoué), puis enregistré.
   Un identifiant déjà présent et valide n'est jamais modifié. Rien n'est supprimé. */

var ID_FORME = /^[pcs]_[0-9a-z]{4,24}$/;
function idValide(v, prefixe) { return typeof v === "string" && ID_FORME.test(v) && v.charAt(0) === prefixe; }
function nouvelId(prefixe) { return prefixe + "_" + Date.now().toString(36) + Math.floor(Math.random() * 2176782336).toString(36); }
/* FNV-1a 32 bits, deux passes, en base 36 : court et stable. */
function hashTexte(s) {
  var h1 = 0x811c9dc5, h2 = 0x01000193 ^ s.length;
  for (var i = 0; i < s.length; i++) {
    var c = s.charCodeAt(i);
    h1 ^= c; h1 = Math.imul(h1, 16777619) >>> 0;
    h2 ^= c + i; h2 = Math.imul(h2, 2246822519) >>> 0;
  }
  return h1.toString(36) + h2.toString(36);
}
function idDerive(prefixe, texte, vus) {
  var base = prefixe + "_" + hashTexte(texte).slice(0, 14), id = base, k = 1;
  while (vus[id]) id = base + (k++).toString(36);
  vus[id] = true;
  return id;
}

/* Attribue les identifiants manquants ou en double. e : { parties, partie, carnet: { series } }.
   Rend le nombre d'identifiants créés (0 au second passage : l'opération est idempotente). */
function attribuerIds(e) {
  var crees = 0, vusP = {}, vusS = {};
  var coupsDe = function (p, cle) {
    var vusC = {};
    (p.coups || []).forEach(function (l, t) {
      (l || []).forEach(function (c, i) {
        if (!c || typeof c !== "object") return;
        if (idValide(c.id, "c") && !vusC[c.id]) { vusC[c.id] = true; return; }
        c.id = idDerive("c", cle + "|" + t + "|" + i + "|" + c.c + "|" + (c.d == null ? "" : c.d) + "|" + (c.l == null ? "" : c.l), vusC);
        crees++;
      });
    });
  };
  var partie = function (p, i, enCours) {
    if (!p || typeof p !== "object") return;
    /* Une partie terminée rouverte pour être complétée garde l'identifiant de l'originale, qu'elle remplacera. */
    if (enCours && p.edition && idValide(p.id, "p")) { /* rien */ }
    else if (idValide(p.id, "p") && !vusP[p.id]) vusP[p.id] = true;
    else {
      p.id = idDerive("p", (enCours ? "encours|" : "partie|" + i + "|") + (p.d || "") + "|" + (p.pc || "") + "|" + (p.o || 0) + "|" + JSON.stringify(p.trous || []), vusP);
      crees++;
    }
    coupsDe(p, p.id);
  };
  (e.parties || []).forEach(function (p, i) { partie(p, i, false); });
  if (e.partie) partie(e.partie, -1, true);
  ((e.carnet || {}).series || []).forEach(function (s, i) {
    if (!s || typeof s !== "object") return;
    if (idValide(s.id, "s") && !vusS[s.id]) { vusS[s.id] = true; return; }
    s.id = idDerive("s", i + "|" + (s.d || "") + "|" + s.c + "|" + (s.v || []).join(","), vusS);
    crees++;
  });
  return crees;
}

/* ---------- Croiser les observations par club, trou, parcours ou période ----------
   obs : observationsGolf(...). axe : "club" | "trou" | "parcours" | "periode" (mois) | "type" (coup / practice).
   f (facultatif) : { club, parcours, trou, debut, fin (dates ISO ou AAAA-MM-JJ), type, seuil (m, défaut 5) }.
   Pour chaque groupe : effectif, distances déclarées (seules à servir de moyenne), distances GPS à part
   (approximatives, roulé compris), directions gauche / centre / droite parmi les coups où elle est connue.
   Rien n'est extrapolé : un groupe sans donnée garde des effectifs à 0 et des valeurs null. */
var AXES_CROISEMENT = ["club", "trou", "parcours", "periode", "type"];
function jourIso(v) { return typeof v === "string" ? v.slice(0, 10) : typeof v === "number" && isFinite(v) ? new Date(v).toISOString().slice(0, 10) : null; }
function medianeL(l) { if (!l.length) return null; var s = l.slice().sort(function (a, b) { return a - b; }), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; }
function resumeDistances(l) {
  if (!l.length) return { n: 0, moyenne: null, mediane: null, min: null, max: null };
  var t = 0; l.forEach(function (v) { t += v; });
  return { n: l.length, moyenne: Math.round(t / l.length), mediane: Math.round(medianeL(l)), min: Math.min.apply(null, l), max: Math.max.apply(null, l) };
}
function cleCroisement(o, axe) {
  if (axe === "club") return o.club || null;
  if (axe === "parcours") return o.type === "practice" ? "practice" : o.parcours || "sans-parcours";
  if (axe === "trou") return o.type === "coup" ? (o.parcours || "sans-parcours") + "#" + (o.trouParcours || o.trou) : null;
  if (axe === "periode") { var j = jourIso(o.jour || o.date); return j ? j.slice(0, 7) : "sans-date"; }
  if (axe === "type") return o.type;
  return null;
}
function croiserObservations(obs, axe, f) {
  if (AXES_CROISEMENT.indexOf(axe) < 0) throw new Error("axe inconnu : " + axe);
  f = f || {};
  var seuil = f.seuil > 0 ? f.seuil : 5, debut = jourIso(f.debut), fin = jourIso(f.fin), groupes = {}, ordre = [];
  (obs || []).forEach(function (o) {
    if (!o) return;
    if (f.club && o.club !== f.club) return;
    if (f.parcours && o.parcours !== f.parcours) return;
    if (f.trou && (o.trouParcours || o.trou) !== f.trou) return;
    if (f.type && o.type !== f.type) return;
    var j = jourIso(o.jour || o.date);
    if ((debut || fin) && !j) return;
    if (debut && j < debut) return;
    if (fin && j > fin) return;
    var k = cleCroisement(o, axe); if (k == null) return;
    var g = groupes[k];
    if (!g) { g = groupes[k] = { cle: k, n: 0, dDeclarees: [], dGps: [], dir: [], distancesInconnues: 0, premier: j, dernier: j }; ordre.push(k); }
    g.n++;
    if (j && (!g.premier || j < g.premier)) g.premier = j;
    if (j && (!g.dernier || j > g.dernier)) g.dernier = j;
    var st = o.distanceStatut || (o.distance != null ? "declaree" : "inconnue");
    if (o.distance != null && st === "declaree") g.dDeclarees.push(o.distance);
    else if (o.distance != null && st === "gps") g.dGps.push(o.distance);
    else g.distancesInconnues++;
    var d = o.direction != null ? o.direction : o.deviation != null ? o.deviation : null;
    if (typeof d === "number" && isFinite(d)) g.dir.push(d);
  });
  return ordre.map(function (k) {
    var g = groupes[k], ga = 0, dr = 0, ce = 0, t = 0;
    g.dir.forEach(function (d) { if (d < -seuil) ga++; else if (d > seuil) dr++; else ce++; t += d; });
    var nd = g.dir.length;
    return {
      cle: k, n: g.n, premier: g.premier || null, dernier: g.dernier || null,
      distances: resumeDistances(g.dDeclarees),
      distancesGps: resumeDistances(g.dGps),
      distancesInconnues: g.distancesInconnues,
      direction: { n: nd, gauche: ga, centre: ce, droite: dr,
        partGauche: nd ? Math.round(100 * ga / nd) : null, partDroite: nd ? Math.round(100 * dr / nd) : null,
        moyenne: nd ? Math.round(t / nd * 10) / 10 : null }
    };
  }).sort(function (a, b) { return b.n - a.n || (a.cle < b.cle ? -1 : 1); });
}

/* ============================================================
   MES DONNÉES (roadmap DATA, P04) : inventaire, exclusions réversibles, distances à vérifier.
   Une partie exclue (exclue: 1) ne compte dans aucun calcul ; un coup exclu (x: 1) garde sa place
   dans l'enchaînement des coups mais perd sa distance et sa direction pour les calculs. Rien n'est supprimé.
   ============================================================ */
function partiesPourCalculs(parties) {
  return (parties || []).filter(function (p) { return p && !p.exclue; }).map(function (p) {
    if (!Array.isArray(p.coups) || !p.coups.some(function (l) { return Array.isArray(l) && l.some(function (c) { return c && c.x; }); })) return p;
    var q = {}; Object.keys(p).forEach(function (k) { q[k] = p[k]; });
    q.coups = p.coups.map(function (l) {
      return Array.isArray(l) ? l.map(function (c) {
        if (!c || !c.x) return c;
        var r = {}; Object.keys(c).forEach(function (k) { if (k !== "d" && k !== "l" && k !== "g") r[k] = c[k]; });
        r.d = null; r.source = "inconnu"; r.distanceType = "inconnu";
        return r;
      }) : l;
    });
    return q;
  });
}

/* Inventaire : provenance et effectif de chaque type de donnée. cartes : nombre de cartes GPS locales. */
function inventaireDonnees(parties, carnet, cartes) {
  var r = { parties: 0, exclues: 0, trous: 0, trousSansScore: 0, mej: 0, mejPossibles: 0, premiersPutts: 0,
    coups: 0, coupsExclus: 0, directions: 0, distances: { gps: 0, declaree: 0, estimee: 0, inconnue: 0 },
    seances: carnet && Array.isArray(carnet.series) ? carnet.series.length : 0, cartes: cartes || 0 };
  (parties || []).forEach(function (p) {
    if (!p || !Array.isArray(p.trous)) return;
    r.parties++;
    if (p.exclue) { r.exclues++; return; }
    p.trous.forEach(function (t, k) {
      if (!trouNote(t)) { r.trousSansScore++; return; }
      r.trous++;
      if (t[5] >= 4) { r.mejPossibles++; if (!Array.isArray(p.renseigne) || (p.renseigne[k] & 1)) r.mej++; }
      if (t[2] >= 1 && t[8] >= 1) r.premiersPutts++;
    });
    (Array.isArray(p.coups) ? p.coups : []).forEach(function (l) {
      (Array.isArray(l) ? l : []).forEach(function (c) {
        if (!c) return;
        r.coups++;
        if (c.x) { r.coupsExclus++; return; }
        if (typeof c.l === "number") r.directions++;
        r.distances[statutDistance(c)]++;
      });
    });
  });
  return r;
}

/* Distances inhabituelles : pleins coups mesurés (GPS ou déclarés), loin de la médiane du club.
   Il faut au moins MIN_SUSPECT mesures du club ; une distance confirmée (ok: 1) ou exclue n'est plus signalée. */
var MIN_SUSPECT = 5, SUSPECT_BAS = 0.6, SUSPECT_HAUT = 1.4;
function distancesSuspectes(parties) {
  var mesures = {}, liste = [];
  (parties || []).forEach(function (p, pi) {
    if (!p || p.exclue || !Array.isArray(p.coups)) return;
    p.coups.forEach(function (l, k) {
      (Array.isArray(l) ? l : []).forEach(function (c, ci) {
        if (!c || c.x || typeof c.d !== "number" || !coupPlein(c) || (c.a && c.a !== "plein")) return;
        var st = statutDistance(c); if (st !== "gps" && st !== "declaree") return;
        (mesures[c.c] = mesures[c.c] || []).push(c.d);
        if (!c.ok) liste.push({ partie: pi, partieId: p.id || null, jour: typeof p.d === "string" ? p.d.slice(0, 10) : null, k: k, ci: ci, club: c.c, d: c.d, gps: st === "gps" });
      });
    });
  });
  var med = {};
  Object.keys(mesures).forEach(function (id) {
    var v = mesures[id].slice().sort(function (a, b) { return a - b; }), n = v.length;
    if (n >= MIN_SUSPECT) med[id] = { m: n % 2 ? v[(n - 1) / 2] : (v[n / 2 - 1] + v[n / 2]) / 2, n: n };
  });
  return liste.filter(function (x) { var M = med[x.club]; return M && (x.d < SUSPECT_BAS * M.m || x.d > SUSPECT_HAUT * M.m); })
    .map(function (x) { x.mediane = Math.round(med[x.club].m); x.n = med[x.club].n; return x; });
}

if (typeof module !== "undefined") {
  var EPd = require("./engine-plus.js");
  var statutDistance = EPd.statutDistance, trouNote = EPd.trouNote, coupPlein = EPd.coupPlein;
  module.exports = { idValide, nouvelId, hashTexte, attribuerIds, croiserObservations, AXES_CROISEMENT, partiesPourCalculs, inventaireDonnees, distancesSuspectes, MIN_SUSPECT };
}
