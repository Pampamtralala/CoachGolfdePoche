/* Coach de golf de poche — erreurs récurrentes (roadmap DATA, P09). Fonctions pures.
   Constat chiffré d'abord : fréquence, effectif, clubs et parcours associés, évolution.
   Une erreur n'est mise en avant que si elle est documentée (assez d'occasions et d'occurrences).
   Les erreurs sont classées par fréquence pour 18 trous, jamais converties en coups perdus,
   et une association (un club, un parcours) n'est jamais présentée comme une cause. */

var ERREURS = [
  { id: "mej", lib: "Mise en jeu ratée", base: "départs renseignés", unite: "départ", seuil: 20 },
  { id: "direction", lib: "Coups hors de l'axe", base: "coups avec direction", unite: "coup", seuil: 20 },
  { id: "penalites", lib: "Pénalités", base: "trous", unite: "trou", seuil: 36 },
  { id: "gir", lib: "Green manqué en régulation", base: "trous", unite: "trou", seuil: 36, deduit: true },
  { id: "approche", lib: "Double approche", base: "greens manqués", unite: "green manqué", seuil: 20, deduit: true },
  { id: "troisPutts", lib: "Trois-putts", base: "trous", unite: "trou", seuil: 36 }
];
var MIN_OCCURRENCES = 5;        /* en dessous, une erreur n'est pas « documentée » */
var MIN_ASSOCIATION = 5;        /* occasions minimum pour citer un club ou un parcours */
var ECART_EVOLUTION = 10;       /* points d'écart entre les deux moitiés pour parler de hausse ou de baisse */
var LATERAL_ERREUR = 5;         /* mètres : au-delà, le coup est hors de l'axe (comme le profil des clubs) */
var FAMILLES_ERREUR = ["", "Driver", "Bois", "Hybride", "Fer"];

function partErr(a, b) { return b ? Math.round(100 * a / b) : null; }
function bitErr(r, k, bit) { return !Array.isArray(r) || !!(r[k] & bit); }
function jourErr(d) { return typeof d === "string" ? d.slice(0, 10) : ""; }

/* Occasions et occurrences de chaque erreur, partie par partie. Chaque événement garde son club et son parcours. */
function evenementsErreurs(p) {
  var ev = [], T = Array.isArray(p.trous) ? p.trous : [];
  function push(id, err, club, extra) { ev.push(Object.assign({ id: id, err: err ? 1 : 0, club: club || null, pc: p.pc || null, jour: jourErr(p.d) }, extra || {})); }
  T.forEach(function (t, k) {
    if (!trouNote(t)) return;
    var par = t[5], putts = t[2], pen = t[3] || 0, coups = Array.isArray(p.coups) && Array.isArray(p.coups[k]) ? p.coups[k] : [];
    var dep = coups[0] && typeof coups[0].c === "string" && (!coups[0].p || coups[0].p === "dep") ? coups[0].c : null;
    var famille = t[7] && bitErr(p.renseigne, k, 2) ? "f" + t[7] : null;
    /* Mise en jeu : par 4 et 5, renseignée seulement. Le club est celui du coup de départ noté, sinon sa famille. */
    if (par >= 4 && bitErr(p.renseigne, k, 1)) push("mej", !t[0], dep || famille, { cote: t[0] ? 0 : (t[6] || 0) });
    push("penalites", pen > 0, dep || famille);
    push("gir", !t[1]);
    /* Double approche (déduite) : green manqué, et deux coups ou plus en plus que la régulation pour l'atteindre. */
    if (!t[1]) push("approche", t[4] - putts - pen - (par - 2) >= 2);
    push("troisPutts", putts >= 3);
    coups.forEach(function (c) {
      if (!c || typeof c.l !== "number" || !isFinite(c.l) || typeof c.c !== "string") return;
      var hors = Math.abs(c.l) > LATERAL_ERREUR;
      push("direction", hors, c.c, { cote: hors ? (c.l < 0 ? 1 : 3) : 0 });
    });
  });
  return ev;
}

function compter(l) { var n = 0; l.forEach(function (e) { n += e.err; }); return { n: n, base: l.length, part: partErr(n, l.length) }; }
function associations(l, cle) {
  var g = {};
  l.forEach(function (e) { var k = e[cle]; if (!k) return; (g[k] = g[k] || []).push(e); });
  return Object.keys(g).map(function (k) { var c = compter(g[k]); c.cle = k; return c; })
    .filter(function (c) { return c.base >= MIN_ASSOCIATION; })
    .sort(function (a, b) { return b.part - a.part || b.base - a.base; });
}

/* parties : déjà filtrées (tableau de bord). Retourne chaque erreur suivie et les trois priorités documentées. */
function erreursRecurrentes(parties) {
  var l = (parties || []).filter(function (p) { return p && Array.isArray(p.trous); }).slice()
    .sort(function (a, b) { return jourErr(a.d) < jourErr(b.d) ? -1 : jourErr(a.d) > jourErr(b.d) ? 1 : 0; });
  var parPartie = l.map(evenementsErreurs), tous = [].concat.apply([], parPartie);
  var trous = tous.filter(function (e) { return e.id === "gir"; }).length;
  var m = Math.floor(l.length / 2);
  var erreurs = ERREURS.map(function (E) {
    var ev = tous.filter(function (e) { return e.id === E.id; }), c = compter(ev);
    var r = { id: E.id, lib: E.lib, baseLib: E.base, unite: E.unite, seuil: E.seuil, deduit: !!E.deduit, n: c.n, base: c.base, part: c.part };
    r.par18 = trous ? Math.round(10 * 18 * c.n / trous) / 10 : null;
    r.documentee = c.base >= E.seuil && c.n >= MIN_OCCURRENCES;
    r.manque = r.documentee ? 0 : Math.max(0, E.seuil - c.base);
    if (E.id === "mej" || E.id === "direction") {
      var g = 0, d = 0, co = 0;
      ev.forEach(function (e) { if (!e.err) return; if (e.cote === 1) g++; else if (e.cote === 3) d++; else if (e.cote === 2) co++; });
      r.cotes = { gauche: g, droite: d, courtes: co };
      /* Un côté dominant seulement s'il pèse au moins deux fois l'autre, sur au moins 8 ratés latéraux. */
      r.coteDominant = g + d >= 8 && (d >= 2 * g || g >= 2 * d) && g !== d ? (d > g ? "droite" : "gauche") : null;
    }
    r.clubs = E.id === "gir" || E.id === "approche" || E.id === "troisPutts" ? [] : associations(ev, "club");
    r.parcours = associations(ev, "pc");
    /* Évolution : première moitié des parties contre la seconde, chaque moitié avec assez d'occasions. */
    if (m >= 2) {
      var avant = compter([].concat.apply([], parPartie.slice(0, m)).filter(function (e) { return e.id === E.id; }));
      var apres = compter([].concat.apply([], parPartie.slice(l.length - m)).filter(function (e) { return e.id === E.id; }));
      if (avant.base >= E.seuil / 2 && apres.base >= E.seuil / 2) {
        var dd = apres.part - avant.part;
        r.evolution = { parties: m, avant: avant, apres: apres, d: dd, sens: dd >= ECART_EVOLUTION ? "hausse" : dd <= -ECART_EVOLUTION ? "baisse" : "stable" };
      } else r.evolution = null;
    } else r.evolution = null;
    return r;
  });
  var top = erreurs.filter(function (e) { return e.documentee; }).sort(function (a, b) { return b.par18 - a.par18; }).slice(0, 3).map(function (e) { return e.id; });
  return { parties: l.length, trous: trous, erreurs: erreurs, top: top };
}

/* Libellé d'un club associé : identifiant de club, ou famille de départ (f1 à f4) en saisie Standard. */
function cleClubErreur(cle) { return /^f[1-4]$/.test(cle) ? { famille: true, nom: FAMILLES_ERREUR[+cle.slice(1)] } : { famille: false, id: cle }; }

if (typeof module !== "undefined") {
  var EPe = require("./engine-plus.js");
  var trouNote = EPe.trouNote;
  module.exports = { erreursRecurrentes, evenementsErreurs, cleClubErreur, ERREURS, MIN_OCCURRENCES, MIN_ASSOCIATION, ECART_EVOLUTION };
}
