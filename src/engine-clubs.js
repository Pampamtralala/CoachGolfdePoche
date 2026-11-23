/* Coach de golf de poche — profil statistique de chaque club (roadmap DATA, P06). Fonctions pures.
   Le profil d'un club se lit sans distance : nombre de coups, gauche / droite, où la balle arrive,
   mises en jeu au départ. La distance n'est qu'une indication, arrondie à 5 m, et seulement s'il y a
   assez de mesures (GPS ou déclarées) ; une estimation n'y entre jamais. */

var SEUIL_LATERAL = 5;          /* mètres : au-delà, le coup est à gauche ou à droite de la ligne */
var MIN_DISTANCES = 3;          /* mesures nécessaires pour montrer une distance indicative */
var MIN_TENDANCE = 10;          /* coups nécessaires pour comparer les plus anciens aux plus récents */
var FAMILLES_DEPART = [null, { id: "dr", nom: "Driver" }, { id: "bois", nom: "Bois" }, { id: "hyb", nom: "Hybride" }, { id: "fer", nom: "Fer" }];

function nombreClub(v) { return typeof v === "number" && isFinite(v); }
function partClub(a, b) { return b ? Math.round(100 * a / b) : null; }
function arrondi5(v) { return v == null ? null : Math.round(v / 5) * 5; }
function bitClub(renseigne, k, bit) { return !Array.isArray(renseigne) || !!(renseigne[k] & bit); }

/* Où la balle d'un coup est arrivée : la position du coup suivant sur le même trou.
   Le dernier coup d'un trou est « sur le green » seulement si le compte du trou le dit (coups + putts + pénalités = score). */
function arriveeCoup(coups, k, trou) {
  var suiv = coups[k + 1];
  if (suiv) {
    var p = suiv.p;
    if (p === "fw" || p === "fr") return "jeu";
    if (p === "ro") return "rough";
    if (p === "bk" || p === "ar") return "obstacle";
    return null;
  }
  if (Array.isArray(trou) && nombreClub(trou[4]) && trou[4] > 0 && trou[2] >= 1 && coups.length + trou[2] + (trou[3] || 0) === trou[4]) return "green";
  return null;
}

/* Tous les coups notés d'un club, dans l'ordre chronologique des parties, avec leur résultat. */
function coupsDuClub(parties, club) {
  var out = [];
  (parties || []).forEach(function (p, pi) {
    if (!p || !Array.isArray(p.coups)) return;
    p.coups.forEach(function (coups, k) {
      if (!Array.isArray(coups)) return;
      var trou = Array.isArray(p.trous) ? p.trous[k] : null;
      coups.forEach(function (c, ci) {
        if (!c || c.c !== club) return;
        var depart = ci === 0 && (!c.p || c.p === "dep");
        out.push({ partie: pi, partieId: p.id || null, jour: typeof p.d === "string" ? p.d.slice(0, 10) : null, trou: k, coup: c,
          lateral: nombreClub(c.l) ? c.l : null, arrivee: arriveeCoup(coups, ci, trou), depart: depart,
          parTrou: trou ? trou[5] : null,
          /* Mise en jeu du trou, seulement si ce coup est le départ d'un par 4 ou 5 et qu'elle a été renseignée. */
          miseEnJeu: depart && trou && trou[5] >= 4 && bitClub(p.renseigne, k, 1) ? { j: trou[0] ? 1 : 0, cote: trou[6] || 0 } : null,
          penaliteTrou: depart && trou ? (trou[3] || 0) : null });
      });
    });
  });
  return out;
}

function directionDe(l) {
  var r = { n: 0, gauche: 0, centre: 0, droite: 0, moyenne: null }, s = 0;
  l.forEach(function (x) {
    if (x.lateral == null) return;
    r.n++; s += x.lateral;
    if (x.lateral < -SEUIL_LATERAL) r.gauche++; else if (x.lateral > SEUIL_LATERAL) r.droite++; else r.centre++;
  });
  if (r.n) { r.moyenne = Math.round(s / r.n); r.partGauche = partClub(r.gauche, r.n); r.partCentre = partClub(r.centre, r.n); r.partDroite = partClub(r.droite, r.n); }
  return r;
}
function arriveesDe(l) {
  var r = { n: 0, jeu: 0, green: 0, rough: 0, obstacle: 0, inconnues: 0 };
  l.forEach(function (x) { if (!x.arrivee) { r.inconnues++; return; } r.n++; r[x.arrivee]++; });
  r.partEnJeu = partClub(r.jeu + r.green, r.n);
  return r;
}
function departsDe(l) {
  var d = l.filter(function (x) { return x.depart && x.parTrou >= 4; });
  var r = { n: 0, jouables: 0, gauche: 0, droite: 0, courtes: 0, inconnues: 0, departs: d.length, avecPenalite: 0 };
  d.forEach(function (x) {
    if (x.penaliteTrou) r.avecPenalite++;
    if (!x.miseEnJeu) { r.inconnues++; return; }
    r.n++;
    if (x.miseEnJeu.j) r.jouables++;
    else if (x.miseEnJeu.cote === 1) r.gauche++; else if (x.miseEnJeu.cote === 2) r.courtes++; else if (x.miseEnJeu.cote === 3) r.droite++;
  });
  r.part = partClub(r.jouables, r.n);
  return r;
}

/* Distance indicative sur le parcours : pleins coups mesurés (GPS ou déclarés), jamais les estimations.
   Arrondie à 5 m ; null s'il y a moins de MIN_DISTANCES mesures. */
function distanceIndicative(l) {
  var v = [], gps = 0;
  l.forEach(function (x) {
    var c = x.coup;
    if (!nombreClub(c.d) || c.dm || c.t || c.p === "bk" || c.p === "ar" || (c.a && c.a !== "plein")) return;
    v.push(c.d);
    if (c.source === "gps" || c.distanceType === "total") gps++;
  });
  if (v.length < MIN_DISTANCES) return { n: v.length, gps: gps, valeur: null, min: null, max: null };
  v.sort(function (a, b) { return a - b; });
  var moy = v.reduce(function (a, b) { return a + b; }, 0) / v.length;
  return { n: v.length, gps: gps, valeur: arrondi5(moy), min: arrondi5(v[0]), max: arrondi5(v[v.length - 1]) };
}

/* Tendance : la moitié la plus ancienne des coups face à la plus récente. null s'il y a trop peu de coups. */
function tendanceClub(l) {
  if (l.length < MIN_TENDANCE) return null;
  var m = Math.floor(l.length / 2), avant = l.slice(0, m), apres = l.slice(l.length - m);
  function axe(x) { var d = directionDe(x); return d.n >= 3 ? d.partCentre : null; }
  function jeu(x) { var a = arriveesDe(x); return a.n >= 3 ? a.partEnJeu : null; }
  var r = { n: m, axe: null, enJeu: null };
  var a1 = axe(avant), a2 = axe(apres), j1 = jeu(avant), j2 = jeu(apres);
  if (a1 != null && a2 != null) r.axe = { avant: a1, apres: a2, d: a2 - a1 };
  if (j1 != null && j2 != null) r.enJeu = { avant: j1, apres: j2, d: j2 - j1 };
  return r.axe || r.enJeu ? r : null;
}

function profilClub(parties, club) {
  var l = coupsDuClub(parties, club), jours = l.map(function (x) { return x.jour; }).filter(Boolean);
  var vues = {};
  l.forEach(function (x) { vues[x.partieId || "i" + x.partie] = true; });
  return { club: club, n: l.length, parties: Object.keys(vues).length, premier: jours[0] || null, dernier: jours[jours.length - 1] || null,
    direction: directionDe(l), arrivees: arriveesDe(l), departs: departsDe(l), distance: distanceIndicative(l), tendance: tendanceClub(l) };
}

/* Clubs qui ont au moins un coup noté, avec leur nombre de coups. ordre : identifiants dans l'ordre du sac. */
function clubsNotes(parties, ordre) {
  var n = {};
  (parties || []).forEach(function (p) {
    (p && Array.isArray(p.coups) ? p.coups : []).forEach(function (coups) {
      (Array.isArray(coups) ? coups : []).forEach(function (c) { if (c && typeof c.c === "string") n[c.c] = (n[c.c] || 0) + 1; });
    });
  });
  var ids = Object.keys(n), rang = function (id) { var i = (ordre || []).indexOf(id); return i < 0 ? 999 : i; };
  ids.sort(function (a, b) { return rang(a) - rang(b) || (a < b ? -1 : 1); });
  return ids.map(function (id) { return { club: id, n: n[id] }; });
}

/* Départs notés en saisie Standard : famille du club de départ (Driver, Bois, Hybride, Fer) et mise en jeu.
   Sans saisie des coups ni distance : le résultat du départ par type de club. */
function departsParFamille(parties) {
  var r = {};
  (parties || []).forEach(function (p) {
    (p && Array.isArray(p.trous) ? p.trous : []).forEach(function (v, k) {
      if (!Array.isArray(v) || !(v[5] >= 4) || !FAMILLES_DEPART[v[7]]) return;
      if (!bitClub(p.renseigne, k, 2) && Array.isArray(p.renseigne)) return;     /* club de départ non renseigné */
      var f = FAMILLES_DEPART[v[7]], o = r[f.id] = r[f.id] || { famille: f.id, nom: f.nom, departs: 0, n: 0, jouables: 0, gauche: 0, droite: 0, courtes: 0, inconnues: 0, avecPenalite: 0 };
      o.departs++;
      if (v[3]) o.avecPenalite++;
      if (!bitClub(p.renseigne, k, 1)) { o.inconnues++; return; }
      o.n++;
      if (v[0]) o.jouables++; else if (v[6] === 1) o.gauche++; else if (v[6] === 2) o.courtes++; else if (v[6] === 3) o.droite++;
    });
  });
  return FAMILLES_DEPART.filter(Boolean).map(function (f) { var o = r[f.id]; if (o) o.part = partClub(o.jouables, o.n); return o; }).filter(Boolean);
}

/* Comparaison de deux clubs : chaque ligne garde les deux valeurs et leurs effectifs ; null si l'un n'a pas de donnée. */
function comparerClubs(a, b) {
  function ligne(id, lib, f) { var x = f(a), y = f(b); return { id: id, lib: lib, a: x, b: y, comparable: x.v != null && y.v != null }; }
  return [
    ligne("coups", "Coups notés", function (p) { return { v: p.n, n: p.n }; }),
    ligne("axe", "Dans l'axe", function (p) { return { v: p.direction.n ? p.direction.partCentre : null, n: p.direction.n }; }),
    ligne("gauche", "À gauche", function (p) { return { v: p.direction.n ? p.direction.partGauche : null, n: p.direction.n }; }),
    ligne("droite", "À droite", function (p) { return { v: p.direction.n ? p.direction.partDroite : null, n: p.direction.n }; }),
    ligne("enJeu", "Arrivées en jeu", function (p) { return { v: p.arrivees.partEnJeu, n: p.arrivees.n }; }),
    ligne("mej", "Mises en jeu jouables", function (p) { return { v: p.departs.part, n: p.departs.n }; }),
    ligne("distance", "Distance indicative", function (p) { return { v: p.distance.valeur, n: p.distance.n }; })
  ];
}

if (typeof module !== "undefined") {
  module.exports = { profilClub, coupsDuClub, clubsNotes, departsParFamille, comparerClubs, arriveeCoup, distanceIndicative, SEUIL_LATERAL, MIN_DISTANCES, MIN_TENDANCE };
}
