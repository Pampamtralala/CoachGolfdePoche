/* Coach de golf de poche — enseignements personnalisés (roadmap UX, UX05). Moteur déterministe, sans IA.
   Il ne calcule rien de nouveau : il lit les réponses de « Comprendre mon jeu », les erreurs récurrentes et le
   tableau des statistiques, et n'en retient que ce qui franchit leurs seuils. Chaque enseignement porte un titre,
   un constat chiffré, sa période, son effectif, une fiabilité expliquée, un lien vers le détail et, si possible,
   une action. Sous le minimum d'observations, rien n'est conclu : au mieux, on dit quoi saisir. */

var CATEGORIES_ENS = [
  { id: "record", lib: "Record personnel", poids: 5 },
  { id: "vigilance", lib: "Point de vigilance", poids: 4 },
  { id: "erreur", lib: "Erreur récurrente", poids: 4 },
  { id: "opportunite", lib: "Opportunité de progression", poids: 3 },
  { id: "progression", lib: "Progression", poids: 3 },
  { id: "fort", lib: "Point fort", poids: 2 },
  { id: "donnees", lib: "Données à enrichir", poids: 1 }
];
/* Effectif minimum de chaque enseignement (au-delà du double : fiabilité « solide »). */
var MIN_ENS = { partiesEvolution: 4, partiesRecord: 5, ecartTrou: 1, perteSecteur: 0.5 };
/* Domaine d'exercices associé (passerelle vers le coaching, d'après les données observées). */
var DOMAINE_ENS = { troisPutts: "putt_long", putts: "putt_court", mej: "drive", penalites: "strategie", cotes: "drive", direction: "fers", gir: "fers", approche: "approche", trous: "strategie" };

function catEns(id) { return CATEGORIES_ENS.filter(function (c) { return c.id === id; })[0]; }
function nbEns(s) { var m = String(s == null ? "" : s).replace("−", "-").replace(",", ".").match(/-?\d+(\.\d+)?/); return m ? parseFloat(m[0]) : null; }
function effLib(n, mot, pl) { return n + " " + (n > 1 ? (pl || mot + "s") : mot); }
/* Fiabilité : « solide » à partir du double du minimum, « indicatif » au-dessus du minimum ; une estimation reste indicative. */
function fiabiliteEns(n, min, unite, pl, estimation) {
  var solide = !estimation && n >= 2 * min;
  return { niveau: solide ? "solide" : "indicatif",
    texte: estimation ? "Indicatif : estimation sur " + effLib(n, unite, pl) + ", pas une mesure." :
      solide ? "Solide : " + effLib(n, unite, pl) + ", au moins le double du minimum (" + min + ")." :
      "Indicatif : " + effLib(n, unite, pl) + ", minimum " + min + " ; à confirmer avec plus de données." };
}
function ens(cat, o) { var c = catEns(cat); return Object.assign({ cat: cat, catLib: c.lib, poids: c.poids, provenance: "observé", action: null }, o); }
function domaineAction(dom, lib) { return dom ? { a: "exos-domaine", v: dom, lib: lib || "Exercices liés", source: "données" } : null; }

/* ctx : celui de repondre() + nomDomaine(id) facultatif. Parties : celles qui entrent dans les calculs. */
function enseignements(parties, ctx) {
  ctx = ctx || {};
  var l = (parties || []).filter(function (p) { return p && Array.isArray(p.trous) && p.trous.length; })
    .slice().sort(function (a, b) { return (a.d || "") < (b.d || "") ? -1 : (a.d || "") > (b.d || "") ? 1 : 0; });
  var res = [], nomDom = ctx.nomDomaine || function (d) { return d; };
  if (!l.length) return { liste: [], parties: 0 };
  var R = {};
  QUESTIONS_ANALYSTE.forEach(function (q) { R[q.id] = repondre(q.id, l, ctx); });
  function lien(id) { return { a: "ens-detail", v: id, lib: "Voir le détail" }; }

  /* 1. Évolutions (deux moitiés de la période) : progression ou point de vigilance. */
  var EVOL = {
    score: { mieux: "Ton score s'améliore", moins: "Ton score se dégrade", min: 6 },
    troisPutts: { mieux: "Moins de trois-putts", moins: "Plus de trois-putts" },
    putts: { mieux: "Ton putting progresse", moins: "Ton putting recule" },
    mej: { mieux: "Plus de balles en jeu", moins: "Moins de balles en jeu" },
    penalites: { mieux: "Moins de pénalités", moins: "Plus de pénalités" }
  };
  Object.keys(EVOL).forEach(function (id) {
    var r = R[id], E = EVOL[id];
    if (!r || r.statut !== "ok" || (r.sens !== "mieux" && r.sens !== "moins")) return;
    var n = r.effectifs.parties, min = E.min || MIN_ENS.partiesEvolution;
    res.push(ens(r.sens === "mieux" ? "progression" : "vigilance", { id: id + "-" + r.sens, titre: E[r.sens], constat: r.phrase,
      periode: r.periode, effectifs: r.effectifs, fiabilite: fiabiliteEns(n, min, "partie"), lien: lien(id),
      action: r.sens === "moins" && DOMAINE_ENS[id] ? domaineAction(DOMAINE_ENS[id], "Exercices : " + nomDom(DOMAINE_ENS[id]).toLowerCase()) : null }));
  });

  /* 2. Erreurs récurrentes : côté dominant des ratés, puis l'erreur la plus fréquente. */
  var ER = erreursRecurrentes(l), periode = { du: (l[0].d || "").slice(0, 10), au: (l[l.length - 1].d || "").slice(0, 10) };
  ER.erreurs.forEach(function (e) {
    if (!e.coteDominant) return;
    var nb = e.cotes[e.coteDominant === "droite" ? "droite" : "gauche"], autre = e.cotes[e.coteDominant === "droite" ? "gauche" : "droite"];
    res.push(ens("erreur", { id: "cote-" + e.id, titre: (e.id === "mej" ? "Tes départs ratés partent plutôt à " : "Tes coups hors de l'axe partent plutôt à ") + e.coteDominant,
      constat: nb + " " + (e.id === "mej" ? "mises en jeu ratées" : "coups") + " à " + e.coteDominant + " contre " + autre + " de l'autre côté, sur " + e.base + " " + e.baseLib + ".",
      periode: periode, effectifs: { parties: ER.parties, trous: ER.trous }, fiabilite: fiabiliteEns(e.cotes.gauche + e.cotes.droite, 8, "raté latéral", "ratés latéraux"),
      lien: e.id === "mej" ? lien("cotes") : { a: "ens-aller", v: "bilan", s: "st-erreurs", lib: "Voir les erreurs" }, action: domaineAction(DOMAINE_ENS[e.id === "mej" ? "cotes" : "direction"], "Exercices : " + nomDom(DOMAINE_ENS[e.id === "mej" ? "cotes" : "direction"]).toLowerCase()) }));
  });
  var top = ER.top.length ? ER.erreurs.filter(function (e) { return e.id === ER.top[0]; })[0] : null;
  if (top) res.push(ens("erreur", { id: "top-" + top.id, titre: top.lib + " : ton erreur la plus fréquente",
    constat: top.n + " sur " + top.base + " " + top.baseLib + " (" + top.part + " %), soit " + String(top.par18).replace(".", ",") + " par 18 trous" + (top.deduit ? ", déduit du score et des putts" : "") + ".",
    periode: periode, effectifs: { parties: ER.parties, trous: ER.trous }, provenance: top.deduit ? "déduit" : "observé",
    fiabilite: fiabiliteEns(top.base, top.seuil, top.unite), lien: { a: "ens-aller", v: "bilan", s: "st-erreurs", lib: "Voir les erreurs" },
    action: domaineAction(DOMAINE_ENS[top.id], DOMAINE_ENS[top.id] ? "Exercices : " + nomDom(DOMAINE_ENS[top.id]).toLowerCase() : null) }));

  /* 3. Points forts : club nettement plus régulier, parcours où tu joues nettement mieux. */
  var rc = R.club;
  if (rc && rc.statut === "ok" && /^Le /.test(rc.phrase)) {
    var c0 = rc.chiffres[0];
    res.push(ens("fort", { id: "club", titre: "Ton club le plus régulier : " + c0.lib.toLowerCase(), constat: rc.phrase, periode: rc.periode, effectifs: rc.effectifs,
      fiabilite: fiabiliteEns(nbEns(c0.base), MIN_ANALYSTE.coupsClub, "coup"), lien: lien("club") }));
  }
  var rp = R.parcours;
  if (rp && rp.statut === "ok" && /^À /.test(rp.phrase)) {
    var p0 = rp.chiffres[0];
    res.push(ens("fort", { id: "parcours", titre: "Tu joues mieux à " + p0.lib, constat: rp.phrase, periode: rp.periode, effectifs: rp.effectifs,
      fiabilite: fiabiliteEns(nbEns(p0.base), MIN_ANALYSTE.partiesParcours, "partie complète", "parties complètes"), lien: lien("parcours") }));
  }

  /* 4. Opportunités : trou qui coûte le plus (au moins un coup au-dessus du par en moyenne), secteur estimé le plus coûteux. */
  var rt = R.trous;
  if (rt && rt.statut === "ok" && rt.chiffres.length && nbEns(rt.chiffres[0].val) >= MIN_ENS.ecartTrou) {
    var t0 = rt.chiffres[0];
    res.push(ens("opportunite", { id: "trou", titre: t0.lib.split(" · ")[0] + " : celui qui te coûte le plus", constat: rt.phrase, periode: rt.periode, effectifs: rt.effectifs,
      fiabilite: fiabiliteEns(nbEns(t0.base), MIN_ANALYSTE.passages, "passage"), lien: lien("trous"), action: domaineAction(DOMAINE_ENS.trous, "Exercices : stratégie") }));
  }
  var rs = R.secteur;
  if (rs && rs.statut === "ok") {
    var pire = rs.chiffres.map(function (c) { return { lib: c.lib, v: c.val === "non mesuré" ? null : nbEns(c.val) }; }).filter(function (c) { return c.v != null; })
      .sort(function (a, b) { return a.v - b.v; })[0];
    var sect = pire ? SG_SECTEURS.filter(function (s) { return pire.lib.indexOf(s.nom) === 0; })[0] : null;
    if (pire && pire.v <= -MIN_ENS.perteSecteur) res.push(ens("opportunite", { id: "secteur", titre: pire.lib + " : là où tu perds le plus (estimation)", constat: rs.phrase,
      periode: rs.periode, effectifs: rs.effectifs, provenance: "estimé", fiabilite: fiabiliteEns(rs.effectifs.trous, 9, "trou", null, true), lien: lien("secteur"),
      action: sect ? domaineAction(sect.d, "Exercices : " + nomDom(sect.d).toLowerCase()) : null }));
  }

  /* 5. Record : la partie la plus récente est la meilleure (écart au par ramené à 18 trous) sur au moins 5 parties complètes. */
  var S = tableauStats(l).parPartie;
  if (S.length >= MIN_ENS.partiesRecord) {
    var der = S[S.length - 1], avant = S.slice(0, -1);
    if (avant.every(function (x) { return der.ecart18 < x.ecart18; }) && der.d === (l[l.length - 1].d || "").slice(0, 10)) {
      res.push(ens("record", { id: "record-" + der.d, titre: "Record : ta meilleure partie", constat: "Ta dernière partie, le " + der.d.split("-").reverse().join("/") + ", est ta meilleure : " +
        fr1(der.ecart18, true) + " ramené à 18 trous, contre " + fr1(Math.min.apply(null, avant.map(function (x) { return x.ecart18; })), true) + " au mieux avant.",
        periode: { du: S[0].d, au: der.d }, effectifs: { parties: S.length, trous: S.reduce(function (t, x) { return t + x.trous; }, 0) }, provenance: "déclaré",
        fiabilite: { niveau: "solide", texte: "Solide : score saisi trou par trou, comparé à tes " + effLib(avant.length, "partie complète", "parties complètes") + " précédentes." }, lien: lien("score") }));
    }
  }

  /* 6. Données à enrichir : ce qui bloque une réponse utile (deux au plus). */
  var enrichir = [];
  if (R.score.statut === "insuffisant") enrichir.push({ id: "score", titre: "Encore quelques parties complètes pour voir ta tendance", action: { a: "partie-rapide", lib: "Nouvelle partie" } });
  if (R.mej.statut === "insuffisant" && l.length >= 3) enrichir.push({ id: "mej", titre: "Renseigne tes mises en jeu", action: null });
  if (R.distance.statut === "insuffisant") enrichir.push({ id: "distance", titre: "Mesure les distances de tes clubs", action: { a: "serie-ouvrir", lib: "Mesurer une série" } });
  if (R.trous.statut === "insuffisant" && /aucun parcours/.test(R.trous.phrase)) enrichir.push({ id: "trous", titre: "Rattache tes parties à un parcours", action: null });
  enrichir.slice(0, 2).forEach(function (x) {
    var r = R[x.id];
    res.push(ens("donnees", { id: "donnees-" + x.id, titre: x.titre, constat: [r.phrase, r.manque].filter(Boolean).join(" ").replace(/\s+/g, " ").trim(), periode: r.periode, effectifs: r.effectifs,
      fiabilite: { niveau: "insuffisant", texte: "Insuffisant : en dessous du minimum, rien n'est conclu." }, lien: lien(x.id), action: x.action }));
  });
  return { liste: res, parties: l.length };
}

/* Choix pour l'accueil : les plus importants d'abord, une seule fois chaque catégorie, puis rotation entre
   enseignements de même poids selon la graine (par exemple le jour), pour ne pas toujours montrer les mêmes. */
function choisirEnseignements(liste, n, graine) {
  var g = Math.abs(Math.floor(graine || 0)), groupes = {};
  liste.forEach(function (e) { (groupes[e.poids] = groupes[e.poids] || []).push(e); });
  var ordre = [];
  Object.keys(groupes).map(Number).sort(function (a, b) { return b - a; }).forEach(function (p) {
    var G = groupes[p], k = G.length ? g % G.length : 0;
    ordre = ordre.concat(G.slice(k), G.slice(0, k));
  });
  var pris = [], cats = {};
  ordre.forEach(function (e) { if (pris.length < n && !cats[e.cat]) { pris.push(e); cats[e.cat] = 1; } });
  ordre.forEach(function (e) { if (pris.length < n && pris.indexOf(e) < 0) pris.push(e); });
  return pris;
}

if (typeof module !== "undefined") {
  var EA = require("./engine-analyste.js"), ESt = require("./engine-stats.js"), EE = require("./engine-erreurs.js");
  var repondre = EA.repondre, QUESTIONS_ANALYSTE = EA.QUESTIONS_ANALYSTE, MIN_ANALYSTE = EA.MIN_ANALYSTE, tableauStats = ESt.tableauStats,
    erreursRecurrentes = EE.erreursRecurrentes, SG_SECTEURS = require("./data-plus.js").SG_SECTEURS;
  var fr1 = function (v, signeOui) { if (v == null) return "–"; var a = Math.abs(Math.round(v * 10) / 10).toFixed(1).replace(".", ","); return signeOui ? (v > 0.05 ? "+" : v < -0.05 ? "−" : "") + a : (v < 0 ? "−" : "") + a; };
  module.exports = { enseignements, choisirEnseignements, CATEGORIES_ENS, MIN_ENS, fiabiliteEns };
}
