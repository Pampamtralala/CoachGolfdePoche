/* Coach de golf de poche — journal de progression, notes, rapports et import (roadmap DATA, P11). Fonctions pures.
   Une note de partie (forme, météo…) n'est jamais traitée comme une cause : on montre seulement des associations,
   avec leurs effectifs. Un import ajoute des parties, il n'écrase jamais rien en silence. */

/* ---------- Notes de partie ---------- */
var NOTES_ECHELLES = {
  driving: { lib: "Driving", v: [null, "difficile", "moyen", "bon"] },
  putting: { lib: "Putting", v: [null, "difficile", "moyen", "bon"] },
  forme: { lib: "Forme", v: [null, "fatigué", "normal", "en forme"] },
  ressenti: { lib: "Ressenti", v: [null, "mauvaise journée", "journée moyenne", "bonne journée"] }
};
var NOTES_METEO = [{ id: "beau", lib: "beau temps" }, { id: "vent", lib: "vent" }, { id: "pluie", lib: "pluie" }, { id: "froid", lib: "froid" }, { id: "chaud", lib: "chaleur" }];
var MIN_ASSOCIATION_NOTE = 3;

/* Note assainie, ou null si vide. */
function noteValide(n) {
  if (!n || typeof n !== "object") return null;
  var r = {}, ok = false;
  Object.keys(NOTES_ECHELLES).forEach(function (k) { if (n[k] === 1 || n[k] === 2 || n[k] === 3) { r[k] = n[k]; ok = true; } });
  if (NOTES_METEO.some(function (m) { return m.id === n.meteo; })) { r.meteo = n.meteo; ok = true; }
  if (typeof n.texte === "string" && n.texte.trim()) { r.texte = n.texte.trim().slice(0, 140); ok = true; }
  return ok ? r : null;
}

/* ---------- Périodes ---------- */
function jourJ(d) { return typeof d === "string" ? d.slice(0, 10) : null; }
function decalerJour(jour, n) { return new Date(Date.parse(jour + "T00:00:00Z") + n * 86400000).toISOString().slice(0, 10); }
/* id : "mois" (30 jours), "trimestre" (90 jours), "saison" (depuis le 1er janvier), "libre" (debut et fin). */
function bornesPeriode(id, aujourdHui, debut, fin) {
  var j = jourJ(aujourdHui);
  if (id === "mois") return { id: id, lib: "Un mois", debut: decalerJour(j, -29), fin: j };
  if (id === "trimestre") return { id: id, lib: "Trois mois", debut: decalerJour(j, -89), fin: j };
  if (id === "saison") return { id: id, lib: "Saison " + j.slice(0, 4), debut: j.slice(0, 4) + "-01-01", fin: j };
  if (id === "libre" && /^\d{4}-\d{2}-\d{2}$/.test(debut || "") && /^\d{4}-\d{2}-\d{2}$/.test(fin || "") && debut <= fin) return { id: id, lib: "Période libre", debut: debut, fin: fin };
  return null;
}
function partiesPeriode(parties, B) {
  return (parties || []).filter(function (p) { var d = jourJ(p.d); return B && d && d >= B.debut && d <= B.fin; })
    .sort(function (a, b) { return jourJ(a.d) < jourJ(b.d) ? -1 : 1; });
}

/* ---------- Associations entre notes et score ---------- */
/* Pour chaque échelle : les parties notées « bas » (1) et « haut » (3), écart au par moyen sur 18 trous.
   Rien n'est affiché si un des deux groupes a moins de MIN_ASSOCIATION_NOTE parties complètes. */
function associationsNotes(parties) {
  var out = [], complets = [];
  (parties || []).forEach(function (p) {
    var st = statsTrous(p.trous); if (!(st.T && st.N === st.T) || !p.note) return;
    complets.push({ n: p.note, e: (st.S - st.PAR) * 18 / st.T });
  });
  function moy(l) { return Math.round(10 * l.reduce(function (a, x) { return a + x.e; }, 0) / l.length) / 10; }
  Object.keys(NOTES_ECHELLES).forEach(function (k) {
    var bas = complets.filter(function (x) { return x.n[k] === 1; }), haut = complets.filter(function (x) { return x.n[k] === 3; });
    var ok = bas.length >= MIN_ASSOCIATION_NOTE && haut.length >= MIN_ASSOCIATION_NOTE;
    out.push({ id: k, lib: NOTES_ECHELLES[k].lib, ok: ok, bas: { lib: NOTES_ECHELLES[k].v[1], n: bas.length, ecart18: bas.length ? moy(bas) : null },
      haut: { lib: NOTES_ECHELLES[k].v[3], n: haut.length, ecart18: haut.length ? moy(haut) : null } });
  });
  NOTES_METEO.forEach(function (m) {
    var avec = complets.filter(function (x) { return x.n.meteo === m.id; }), sans = complets.filter(function (x) { return x.n.meteo && x.n.meteo !== m.id; });
    out.push({ id: "meteo-" + m.id, lib: "Météo : " + m.lib, ok: avec.length >= MIN_ASSOCIATION_NOTE && sans.length >= MIN_ASSOCIATION_NOTE,
      bas: { lib: m.lib, n: avec.length, ecart18: avec.length ? moy(avec) : null }, haut: { lib: "autre météo notée", n: sans.length, ecart18: sans.length ? moy(sans) : null } });
  });
  return out;
}

/* ---------- Rapport ---------- */
/* Tout ce qu'il faut pour un rapport daté et reproductible : mêmes parties et même période = même empreinte. */
function rapportPeriode(parties, B, genereLe) {
  var l = partiesPeriode(parties, B), T = tableauStats(l), P = analysePutting(l), R = erreursRecurrentes(l);
  var empreinte = hashTexte(JSON.stringify([B.debut, B.fin, l.map(function (p) { return [p.id || "", jourJ(p.d), p.trous.map(function (t) { return t.slice(0, 6).join(","); }).join(";")]; })]));
  return {
    genereLe: genereLe, periode: B, empreinte: empreinte, parties: l.length, stats: T,
    putting: { trous: P.total.trous, parTrou: P.total.parTrou, partUn: P.total.partUn, partTrois: P.total.partTrois },
    erreurs: R.top.map(function (id) { return R.erreurs.filter(function (e) { return e.id === id; })[0]; }),
    notes: { notees: l.filter(function (p) { return !!p.note; }).length, associations: associationsNotes(l).filter(function (a) { return a.ok; }) },
    journal: l.map(function (p) { var s = scorePartie(p); return { id: p.id || null, d: jourJ(p.d), pc: p.pc || null, trous: p.trous.length, complet: s.complet, score: s.coups, ecart: s.ecart, note: p.note || null }; })
  };
}

/* ---------- Import ---------- */
/* CSV : une ligne par trou, séparateur ; ou , ; en-tête obligatoire :
   date ; parcours ; trou ; par ; score ; putts ; penalites ; mise_en_jeu (o / n / vide = non renseignée). */
var CSV_COLONNES = ["date", "parcours", "trou", "par", "score", "putts", "penalites", "mise_en_jeu"];
function lireCSV(texte) {
  var lignes = String(texte || "").replace(/^﻿/, "").split(/\r?\n/).filter(function (x) { return x.trim(); }), erreurs = [];
  if (!lignes.length) return { parties: [], erreurs: [{ ligne: 0, msg: "Fichier vide." }] };
  var sep = lignes[0].indexOf(";") >= 0 ? ";" : ",";
  var tete = lignes[0].split(sep).map(function (x) { return x.trim().toLowerCase().replace(/[éè]/g, "e").replace(/\s+/g, "_"); });
  var idx = {}; CSV_COLONNES.forEach(function (c) { idx[c] = tete.indexOf(c); });
  var manque = ["date", "trou", "par", "score", "putts"].filter(function (c) { return idx[c] < 0; });
  if (manque.length) return { parties: [], erreurs: [{ ligne: 1, msg: "Colonnes manquantes : " + manque.join(", ") + "." }] };
  var groupes = {}, ordre = [];
  lignes.slice(1).forEach(function (l, i) {
    var c = l.split(sep).map(function (x) { return x.trim(); }), n = i + 2;
    function ent(k, min, max) { var v = idx[k] >= 0 ? c[idx[k]] : ""; if (v === "" && k === "penalites") return 0; var x = /^\d+$/.test(v) ? parseInt(v, 10) : NaN; return x >= min && x <= max ? x : NaN; }
    var d = idx.date >= 0 ? c[idx.date] : "", m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d) || /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(d);
    var jour = m ? (m[1].length === 4 ? m[1] + "-" + m[2] + "-" + m[3] : m[3] + "-" + m[2] + "-" + m[1]) : null;
    var trou = ent("trou", 1, 18), par = ent("par", 3, 5), score = ent("score", 1, 15), putts = ent("putts", 0, 6), pen = ent("penalites", 0, 5);
    if (!jour || isNaN(Date.parse(jour)) || isNaN(trou) || isNaN(par) || isNaN(score) || isNaN(putts) || isNaN(pen) || putts + pen > score) { erreurs.push({ ligne: n, msg: "Ligne ignorée : valeur manquante ou incohérente." }); return; }
    var mej = idx.mise_en_jeu >= 0 ? (c[idx.mise_en_jeu] || "").toLowerCase() : "";
    var cle = jour + "|" + (idx.parcours >= 0 ? c[idx.parcours] : "");
    if (!groupes[cle]) { groupes[cle] = { jour: jour, parcours: idx.parcours >= 0 ? c[idx.parcours] : "", trous: {} }; ordre.push(cle); }
    if (groupes[cle].trous[trou]) { erreurs.push({ ligne: n, msg: "Trou " + trou + " en double pour cette partie : ignoré." }); return; }
    groupes[cle].trous[trou] = { par: par, score: score, putts: putts, pen: pen, mej: /^(o|oui|1|y|yes)$/.test(mej) ? 1 : /^(n|non|0|no)$/.test(mej) ? 0 : null };
  });
  var parties = [];
  ordre.forEach(function (cle) {
    var g = groupes[cle], nums = Object.keys(g.trous).map(Number).sort(function (a, b) { return a - b; });
    if (nums.length !== 9 && nums.length !== 18) { erreurs.push({ ligne: 0, msg: "Partie du " + g.jour + (g.parcours ? " (" + g.parcours + ")" : "") + " : " + nums.length + " trou" + (nums.length > 1 ? "s" : "") + ", il en faut 9 ou 18 : ignorée." }); return; }
    var o = nums[0] === 10 && nums.length === 9 ? 9 : 0;
    var trous = [], renseigne = [];
    nums.forEach(function (n) {
      var t = g.trous[n], gir = t.score - t.putts - t.pen <= t.par - 2 ? 1 : 0;
      trous.push([t.par === 3 ? 1 : (t.mej === 0 ? 0 : 1), gir, t.putts, t.pen, t.score, t.par, 0, 0, 0, 0, 0]);
      renseigne.push(t.par >= 4 && t.mej != null ? 1 : 0);
    });
    parties.push({ d: g.jour + "T12:00:00.000Z", trous: trous, renseigne: renseigne, o: o, parcoursNom: g.parcours || null, source: "import" });
  });
  return { parties: parties, erreurs: erreurs };
}
/* JSON : un export de l'appli ({ parties: [...] }) ou une liste de parties. */
function lireJSONParties(o) {
  var l = Array.isArray(o) ? o : o && Array.isArray(o.parties) ? o.parties : null;
  if (!l) return { parties: [], erreurs: [{ ligne: 0, msg: "Aucune liste de parties dans ce fichier." }] };
  return { parties: l.filter(function (p) { return p && Array.isArray(p.trous); }), erreurs: l.length && !l.some(function (p) { return p && Array.isArray(p.trous); }) ? [{ ligne: 0, msg: "Parties illisibles." }] : [] };
}
/* Signature d'une partie : jour et scores trou par trou. Deux parties de même signature sont des doublons. */
function signaturePartie(p) { return jourJ(p.d) + "|" + p.trous.map(function (t) { return (t[5] || "") + ":" + (t[4] || ""); }).join(","); }
function fusionImport(existantes, nouvelles) {
  var ids = {}, sig = {}, ajout = [], doublons = [];
  (existantes || []).forEach(function (p) { if (p.id) ids[p.id] = true; sig[signaturePartie(p)] = true; });
  (nouvelles || []).forEach(function (p) {
    var s = signaturePartie(p);
    if ((p.id && ids[p.id]) || sig[s]) { doublons.push(p); return; }
    sig[s] = true; if (p.id) ids[p.id] = true; ajout.push(p);
  });
  return { ajout: ajout, doublons: doublons };
}

if (typeof module !== "undefined") {
  var EPj = require("./engine-plus.js"), ESj = require("./engine-stats.js"), EUj = require("./engine-putting.js"), EEj = require("./engine-erreurs.js"), EDj = require("./engine-donnees.js");
  var statsTrous = EPj.statsTrous, scorePartie = EPj.scorePartie, tableauStats = ESj.tableauStats, analysePutting = EUj.analysePutting, erreursRecurrentes = EEj.erreursRecurrentes, hashTexte = EDj.hashTexte;
  module.exports = { noteValide, bornesPeriode, partiesPeriode, associationsNotes, rapportPeriode, lireCSV, lireJSONParties, signaturePartie, fusionImport, NOTES_ECHELLES, NOTES_METEO, CSV_COLONNES, MIN_ASSOCIATION_NOTE };
}
