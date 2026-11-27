/* Coach de golf de poche — journal chronologique (roadmap UX, UX10). Construit à la demande à partir des données
   existantes (parties, séries de practice si on les fournit — l'appli ne le fait plus depuis V4-03 —, historique d'index, cycles de coaching, défis) : rien n'est copié dans
   la sauvegarde. Chaque événement garde de quoi ouvrir son détail. Faits marquants : record de score (partie la
   mieux jouée, au moins 3 parties complètes avant) et meilleur index déclaré. */

var TYPES_CHRONO = [
  { id: "tous", lib: "Tout" }, { id: "partie", lib: "Parties" },
  { id: "index", lib: "Index" }, { id: "entrainement", lib: "Entraînement" }, { id: "note", lib: "Notes" }
];
var MIN_RECORD_CHRONO = 3;
function jourChrono(d) { return typeof d === "string" && /^\d{4}-\d{2}-\d{2}/.test(d) ? d.slice(0, 10) : typeof d === "number" && isFinite(d) ? new Date(d).toISOString().slice(0, 10) : null; }
function ecartPartieChrono(p) {
  var S = 0, PAR = 0, n = 0;
  (p.trous || []).forEach(function (t) { if (Array.isArray(t) && t[4] > 0 && t[5] > 0) { S += t[4]; PAR += t[5]; n++; } });
  return n && n === (p.trous || []).length ? { ecart: S - PAR, score: S, trous: n, ecart18: Math.round((S - PAR) * 18 / n * 10) / 10 } : null;
}
/* src : { parties, series, indexHist, cycles, defis: [{ id, t, hist }], nomParcours(id), nomClub(id) } */
function chronologie(src) {
  src = src || {};
  var ev = [], nomPc = src.nomParcours || function (x) { return x || ""; }, nomCl = src.nomClub || function (x) { return x; };
  /* Parties, avec record de score (écart au par ramené à 18 trous) */
  var parties = (src.parties || []).map(function (p, i) { return { p: p, i: i, j: jourChrono(p && p.d) }; }).filter(function (x) { return x.p && x.j && Array.isArray(x.p.trous) && x.p.trous.length; })
    .sort(function (a, b) { return a.j < b.j ? -1 : a.j > b.j ? 1 : a.i - b.i; });
  var meilleur = null, completes = 0;
  parties.forEach(function (x) {
    var p = x.p, E = ecartPartieChrono(p), note = p.note && (p.note.texte || p.note.forme || p.note.driving || p.note.putting || p.note.ressenti);
    var record = !!(E && completes >= MIN_RECORD_CHRONO && meilleur != null && E.ecart18 < meilleur);
    if (E) { completes++; if (meilleur == null || E.ecart18 < meilleur) meilleur = E.ecart18; }
    ev.push({ type: "partie", d: x.j, titre: (p.pc ? nomPc(p.pc) : "Partie") + " · " + p.trous.length + " trous",
      detail: E ? E.score + " coups (" + (E.ecart > 0 ? "+" : E.ecart < 0 ? "−" : "") + Math.abs(E.ecart) + ")" : "score incomplet",
      note: note ? (p.note.texte || "") : null, aNote: !!note, pc: p.pc || null, ref: { partie: x.i }, marquant: record ? "Record : ta meilleure partie" : null });
  });
  /* Séries de practice */
  (src.series || []).forEach(function (s) {
    var j = jourChrono(s && s.d); if (!j || !s.v || !s.v.length) return;
    var v = s.v.slice().sort(function (a, b) { return a - b; }), moy = Math.round(v.reduce(function (t, x) { return t + x; }, 0) / v.length);
    ev.push({ type: "practice", d: j, titre: "Série · " + nomCl(s.c), detail: s.v.length + " balle" + (s.v.length > 1 ? "s" : "") + ", " + moy + " m en moyenne", ref: { club: s.c }, marquant: null });
  });
  /* Index déclaré : chaque mise à jour, et le meilleur atteint */
  var mini = null;
  (src.indexHist || []).slice().sort(function (a, b) { return String(a.d) < String(b.d) ? -1 : 1; }).forEach(function (x, k) {
    var j = jourChrono(x && x.d); if (!j || typeof x.v !== "number") return;
    var mieux = k > 0 && mini != null && x.v < mini;
    ev.push({ type: "index", d: j, titre: "Index : " + String(x.v).replace(".", ","), detail: k === 0 ? "premier index noté" : "mise à jour de ton index déclaré", ref: {}, marquant: mieux ? "Ton meilleur index" : null });
    if (mini == null || x.v < mini) mini = x.v;
  });
  /* Cycles de coaching et défis */
  (src.cycles || []).forEach(function (c) {
    var j = jourChrono(c && c.fin); if (!j) return;
    ev.push({ type: "entrainement", d: j, titre: "Cycle " + c.cycle + " terminé", detail: c.faites + " séance" + (c.faites > 1 ? "s" : "") + " sur " + c.total, ref: { cycle: true }, marquant: null });
  });
  (src.defis || []).forEach(function (df) {
    (df.hist || []).forEach(function (x) {
      var j = jourChrono(x && x.d); if (!j) return;
      ev.push({ type: "entrainement", d: j, titre: "Défi · " + df.t, detail: x.v != null ? "résultat : " + x.v : "défi joué", ref: { defi: df.id }, marquant: null });
    });
  });
  return ev.sort(function (a, b) { return a.d > b.d ? -1 : a.d < b.d ? 1 : 0; });
}
/* filtre : { type, debut, fin, parcours } — parcours ne concerne que les parties. */
function filtrerChronologie(ev, f) {
  f = f || {};
  return (ev || []).filter(function (e) {
    if (f.type && f.type !== "tous") { if (f.type === "note" ? !e.aNote : e.type !== f.type) return false; }
    if (f.debut && e.d < f.debut) return false;
    if (f.fin && e.d > f.fin) return false;
    if (f.parcours && (e.type !== "partie" || e.pc !== f.parcours)) return false;
    return true;
  });
}

if (typeof module !== "undefined") {
  module.exports = { chronologie, filtrerChronologie, TYPES_CHRONO, MIN_RECORD_CHRONO };
}
