/* Coach de golf de poche — « Comprendre mon jeu » (roadmap DATA, P12). Moteur déterministe, sans IA.
   Chaque réponse cite ses chiffres, sa période et son effectif ; elle ne parle de mieux ou de moins bien qu'au-delà
   d'un seuil fixé ; si les données manquent, elle dit précisément quoi saisir. Elle ne peut rien inventer : tout vient
   des moteurs déjà utilisés par les autres écrans. */

var SEUILS_ANALYSTE = { score: 1.5, troisPutts: 5, putts: 0.1, mej: 10, penalites: 1, axe: 10, parcours: 1.5 };
var MIN_ANALYSTE = { partiesScore: 6, trousMoitie: 18, mejMoitie: 10, cotes: 8, coupsClub: 10, passages: 3, partiesParcours: 2 };

function fr1(v, signeOui) { if (v == null) return "–"; var a = Math.abs(Math.round(v * 10) / 10).toFixed(1).replace(".", ","); return signeOui ? (v > 0.05 ? "+" : v < -0.05 ? "−" : "") + a : (v < 0 ? "−" : "") + a; }
function fr2(v) { return v == null ? "–" : (Math.round(v * 100) / 100).toFixed(2).replace(".", ","); }
function plur(n, mot, pl) { return n + " " + (n > 1 ? (pl || mot + "s") : mot); }
function jourA(d) { return typeof d === "string" ? d.slice(0, 10) : null; }
function moitiesA(l) { var m = Math.floor(l.length / 2); return { A: l.slice(0, m), B: l.slice(l.length - m), m: m }; }
function periodeA(l) { return l.length ? { du: jourA(l[0].d), au: jourA(l[l.length - 1].d) } : null; }
function trousA(l) { return l.reduce(function (n, p) { return n + p.trous.length; }, 0); }
/* Sens d'une évolution : mieux, moins bien ou pas de différence nette au-delà d'un seuil. bas = une valeur basse est meilleure. */
function sensA(avant, apres, seuil, bas) {
  var d = apres - avant;
  if (Math.abs(d) < seuil) return "stable";
  return (bas ? d < 0 : d > 0) ? "mieux" : "moins";
}
function reponse(q, o) { return Object.assign({ id: q.id, question: q.q, statut: "ok", phrase: "", chiffres: [], periode: null, effectifs: null, methode: q.methode, manque: null }, o); }
function vide(q) { return reponse(q, { statut: "vide", phrase: "Ton carnet ne contient encore aucune partie sur cette période.", manque: "Enregistre une partie (même en saisie Express) pour commencer." }); }

var QUESTIONS_ANALYSTE = [
  { id: "score", q: "Est-ce que je score mieux ?", mots: "score mieux progres progresse progression index niveau resultat", methode: "Parties complètes (un score à chaque trou), écart au par ramené à 18 trous : la première moitié des parties contre la seconde. Différence nette à partir de 1,5 coup." },
  { id: "troisPutts", q: "Mes trois-putts diminuent-ils ?", mots: "trois putts 3 putts diminuent green putting", methode: "Part des trous à trois putts ou plus, première moitié des parties contre la seconde (18 trous minimum chacune). Différence nette à partir de 5 points." },
  { id: "putts", q: "Mon putting progresse-t-il ?", mots: "putting putts putter progresse green", methode: "Putts par trou, première moitié des parties contre la seconde (18 trous minimum chacune). Différence nette à partir de 0,1 putt par trou (1,8 sur 18 trous)." },
  { id: "mej", q: "Est-ce que je mets plus de balles en jeu ?", mots: "mise en jeu depart drive fairway jouable balles en jeu", methode: "Mises en jeu jouables sur les mises en jeu renseignées (par 4 et 5), première moitié des parties contre la seconde. Les mises en jeu non renseignées ne comptent pas. Différence nette à partir de 10 points." },
  { id: "cotes", q: "Mes départs partent-ils davantage à gauche ou à droite ?", mots: "gauche droite depart cote slice hook direction rate", methode: "Mises en jeu ratées par côté (renseignées), et direction des coups de départ notés. Un côté domine s'il pèse au moins deux fois l'autre, sur au moins 8 ratés latéraux." },
  { id: "penalites", q: "Mes pénalités baissent-elles ?", mots: "penalite penalites hors limites eau drop baissent", methode: "Coups de pénalité ramenés à 18 trous, première moitié des parties contre la seconde (18 trous minimum chacune). Différence nette à partir d'un coup." },
  { id: "club", q: "Quel club est le plus régulier ?", mots: "club regulier regularite axe droit dispersion fer bois", methode: "Part des coups dans l'axe (à moins de 5 m de la ligne), pour chaque club qui a au moins 10 coups avec une direction notée." },
  { id: "distance", q: "Quelle est ma distance au driver (et aux autres clubs) ?", mots: "distance driver portee metres combien loin club", methode: "Distance indicative sur le parcours : pleins coups mesurés (GPS ou tapés), au moins 3 par club, arrondie à 5 m. Les estimations n'y entrent jamais." },
  { id: "trous", q: "Sur quels trous ai-je du mal ?", mots: "trou trous difficile mal noir parcours", methode: "Écart moyen au par de chaque trou, sur les trous passés au moins 3 fois, pour ton parcours le plus joué." },
  { id: "parcours", q: "Sur quel parcours je joue le mieux ?", mots: "parcours golf meilleur mieux terrain", methode: "Écart au par ramené à 18 trous, parties complètes, pour chaque parcours joué au moins 2 fois." },
  { id: "secteur", q: "Où est-ce que je perds le plus de coups ?", mots: "perds perdu coups secteur faiblesse strokes gained estimation", methode: "Estimation par secteur face à un joueur de ton objectif d'index (score, greens déduits, mises en jeu renseignées, putts, pénalités). Ce n'est pas du Strokes Gained." },
  { id: "forme", q: "Est-ce que je joue mieux quand je suis en forme ?", mots: "forme fatigue fatigué energie note ressenti meteo", methode: "Écart au par sur 18 trous des parties notées « en forme » contre « fatigué », au moins 3 parties complètes de chaque côté. Une association, pas une cause." }
];

function normaliserRecherche(s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9 ]/g, " "); }
/* Recherche par mots-clés (pas d'IA) : questions classées par nombre de mots trouvés. */
function chercherQuestions(texte) {
  var vides = " je j me mon ma mes ton ta tes le la les l un une des de du d et ou est ce que qui quoi quel quelle quels quelles sur au aux a ai en il elle on plus moins mieux va vont pour par avec dans sont suis fait faire mais pas ne n y "; 
  var mots = normaliserRecherche(texte).split(/\s+/).filter(function (m) { return m.length >= 2 && vides.indexOf(" " + m + " ") < 0; });
  if (!mots.length) return QUESTIONS_ANALYSTE.map(function (q) { return q.id; });
  return QUESTIONS_ANALYSTE.map(function (q, i) {
    var cible = " " + normaliserRecherche(q.q + " " + q.mots) + " ";
    var n = mots.filter(function (m) { return cible.indexOf(" " + m) >= 0; }).length;
    return { id: q.id, n: n, i: i };
  }).filter(function (x) { return x.n; }).sort(function (a, b) { return b.n - a.n || a.i - b.i; }).map(function (x) { return x.id; });
}

/* ctx : { parcours: [...], cible: index visé, nomClub: fn(id), nomParcours: fn(id), ordreClubs: [...] } */
function repondre(id, parties, ctx) {
  ctx = ctx || {};
  var q = QUESTIONS_ANALYSTE.filter(function (x) { return x.id === id; })[0]; if (!q) return null;
  var l = (parties || []).filter(function (p) { return p && Array.isArray(p.trous) && p.trous.length; })
    .slice().sort(function (a, b) { return (a.d || "") < (b.d || "") ? -1 : (a.d || "") > (b.d || "") ? 1 : 0; });
  if (!l.length) return vide(q);
  var nomClub = ctx.nomClub || function (x) { return x; }, nomPc = ctx.nomParcours || function (x) { return x; };
  var P = periodeA(l), T = trousA(l), eff = { parties: l.length, trous: T };

  /* Évolution entre les deux moitiés d'une valeur calculée sur des trous. */
  function evolution(calc, seuil, bas, minMoitie, lib, format, unite) {
    var M = moitiesA(l), a = calc(M.A), b = calc(M.B);
    if (M.m < 1 || a.base < minMoitie || b.base < minMoitie) return null;
    return { M: M, a: a, b: b, sens: sensA(a.v, b.v, seuil, bas), lib: lib, format: format, unite: unite };
  }
  function chiffresEvol(E, baseLib) {
    return [{ lib: "Tes " + plur(E.M.m, "première partie", "premières parties"), val: E.format(E.a.v) + E.unite, base: E.a.base + " " + baseLib },
      { lib: "Tes " + plur(E.M.m, "dernière partie", "dernières parties"), val: E.format(E.b.v) + E.unite, base: E.b.base + " " + baseLib }];
  }
  function phraseEvol(E, oui, non) {
    return (E.sens === "mieux" ? oui : E.sens === "moins" ? non : "Pas de différence nette") + " : " + E.format(E.b.v) + E.unite + " sur tes " + plur(E.M.m, "dernière partie", "dernières parties") + ", contre " + E.format(E.a.v) + E.unite + " sur les " + E.M.m + " d'avant.";
  }

  if (id === "score") {
    var S = tableauStats(l).parPartie;
    if (S.length < MIN_ANALYSTE.partiesScore) return reponse(q, { statut: "insuffisant", periode: P, effectifs: eff, phrase: "Pas encore assez de parties complètes pour comparer.", manque: "Il faut au moins " + MIN_ANALYSTE.partiesScore + " parties avec un score à chaque trou ; tu en as " + S.length + " sur cette période." });
    var m = Math.floor(S.length / 2), A = S.slice(0, m), B = S.slice(S.length - m), moy = function (x) { return x.reduce(function (t, y) { return t + y.ecart18; }, 0) / x.length; };
    var a = moy(A), b = moy(B), sens = sensA(a, b, SEUILS_ANALYSTE.score, true);
    return reponse(q, { periode: { du: A[0].d, au: B[B.length - 1].d }, effectifs: { parties: S.length, trous: S.reduce(function (t, x) { return t + x.trous; }, 0) },
      phrase: (sens === "mieux" ? "Oui, plutôt" : sens === "moins" ? "Non, plutôt moins bien" : "Pas de différence nette") + " : " + fr1(b, true) + " sur tes " + m + " dernières parties, contre " + fr1(a, true) + " sur les " + m + " d'avant (écart au par sur 18 trous).",
      chiffres: [{ lib: "Tes " + m + " premières parties complètes", val: fr1(a, true), base: "du " + A[0].d + " au " + A[A.length - 1].d }, { lib: "Tes " + m + " dernières", val: fr1(b, true), base: "du " + B[0].d + " au " + B[B.length - 1].d }],
      sens: sens });
  }
  if (id === "troisPutts" || id === "putts" || id === "penalites") {
    var cfg = {
      troisPutts: { f: function (x) { var g = agregatPutts([].concat.apply([], x.map(function (p) { return p.trous.filter(function (t) { return t && t[4] > 0; }); }))); return { v: g.partTrois, base: g.trous }; }, seuil: SEUILS_ANALYSTE.troisPutts, fmt: function (v) { return Math.round(v) + ""; }, unite: " %", oui: "Oui, ils diminuent", non: "Non, ils augmentent" },
      putts: { f: function (x) { var g = agregatPutts([].concat.apply([], x.map(function (p) { return p.trous.filter(function (t) { return t && t[4] > 0; }); }))); return { v: g.parTrou, base: g.trous }; }, seuil: SEUILS_ANALYSTE.putts, fmt: fr2, unite: " putt par trou", oui: "Oui, il progresse", non: "Non, il recule" },
      penalites: { f: function (x) { var st = statsTrous([].concat.apply([], x.map(function (p) { return p.trous; }))); return { v: st.T ? st.X * 18 / st.T : null, base: st.T }; }, seuil: SEUILS_ANALYSTE.penalites, fmt: function (v) { return fr1(v); }, unite: " pour 18 trous", oui: "Oui, elles baissent", non: "Non, elles augmentent" }
    }[id];
    var E = evolution(cfg.f, cfg.seuil, true, MIN_ANALYSTE.trousMoitie, q.q, cfg.fmt, cfg.unite);
    if (!E) return reponse(q, { statut: "insuffisant", periode: P, effectifs: eff, phrase: "Pas encore assez de trous pour comparer deux périodes.", manque: "Il faut au moins 4 parties et 18 trous joués dans chaque moitié ; tu as " + plur(l.length, "partie") + " (" + T + " trous) sur cette période." });
    return reponse(q, { periode: P, effectifs: eff, phrase: phraseEvol(E, cfg.oui, cfg.non), chiffres: chiffresEvol(E, "trous"), sens: E.sens });
  }
  if (id === "mej") {
    var Em = evolution(function (x) { var r = { n: 0, j: 0 }; x.forEach(function (p) { var m = misesEnJeu(p.trous, p.renseigne); r.n += m.n; r.j += m.jouables; }); return { v: r.n ? 100 * r.j / r.n : null, base: r.n }; },
      SEUILS_ANALYSTE.mej, false, MIN_ANALYSTE.mejMoitie, q.q, function (v) { return Math.round(v) + ""; }, " % de mises en jeu jouables");
    if (!Em) {
      var tot = 0; l.forEach(function (p) { tot += misesEnJeu(p.trous, p.renseigne).n; });
      return reponse(q, { statut: "insuffisant", periode: P, effectifs: eff, phrase: "Pas assez de mises en jeu renseignées pour comparer.", manque: "Il faut au moins " + MIN_ANALYSTE.mejMoitie + " mises en jeu renseignées dans chaque moitié des parties ; tu en as " + tot + " en tout. Note la mise en jeu au départ des par 4 et 5 (saisie Standard ou Expert)." });
    }
    return reponse(q, { periode: P, effectifs: eff, phrase: phraseEvol(Em, "Oui, davantage", "Non, moins qu'avant"), chiffres: chiffresEvol(Em, "mises en jeu renseignées"), sens: Em.sens });
  }
  if (id === "cotes") {
    var g = 0, d = 0, c = 0, n = 0, cg = 0, cd = 0, cn = 0;
    l.forEach(function (p) {
      var m = misesEnJeu(p.trous, p.renseigne); g += m.gauche; d += m.droite; c += m.courtes; n += m.n;
      (p.coups || []).forEach(function (cp) { var x = cp && cp[0]; if (x && typeof x.l === "number" && (!x.p || x.p === "dep")) { cn++; if (x.l < -5) cg++; else if (x.l > 5) cd++; } });
    });
    var chiffres = [{ lib: "Mises en jeu ratées à gauche", val: String(g), base: n + " renseignées" }, { lib: "Mises en jeu ratées à droite", val: String(d), base: n + " renseignées" }];
    if (cn) chiffres.push({ lib: "Coups de départ notés hors de l'axe", val: cg + " à gauche, " + cd + " à droite", base: cn + " coups avec direction" });
    var lat = g + d, latC = cg + cd;
    if (lat < MIN_ANALYSTE.cotes && latC < MIN_ANALYSTE.cotes) return reponse(q, { statut: "insuffisant", periode: P, effectifs: eff, chiffres: chiffres, phrase: "Pas encore assez de départs ratés sur le côté pour conclure.", manque: "Il faut au moins " + MIN_ANALYSTE.cotes + " mises en jeu ratées à gauche ou à droite (tu en as " + lat + ") : quand une mise en jeu est ratée, note de quel côté (saisie Standard ou Expert)." });
    var base = lat >= MIN_ANALYSTE.cotes ? { g: g, d: d, lib: "mises en jeu ratées" } : { g: cg, d: cd, lib: "coups de départ hors de l'axe" };
    var dom = base.d >= 2 * base.g && base.d > base.g ? "droite" : base.g >= 2 * base.d && base.g > base.d ? "gauche" : null;
    return reponse(q, { periode: P, effectifs: eff, chiffres: chiffres,
      phrase: dom ? "Oui, plutôt à " + dom + " : " + (dom === "droite" ? base.d : base.g) + " " + base.lib + " à " + dom + " contre " + (dom === "droite" ? base.g : base.d) + " à " + (dom === "droite" ? "gauche" : "droite") + "." : "Ni l'un ni l'autre nettement : " + base.g + " " + base.lib + " à gauche, " + base.d + " à droite.", cote: dom });
  }
  if (id === "club") {
    var notes = clubsNotes(l, ctx.ordreClubs || []).map(function (x) { var pr = profilClub(l, x.club); return { club: x.club, n: pr.direction.n, axe: pr.direction.partCentre }; })
      .filter(function (x) { return x.n >= MIN_ANALYSTE.coupsClub; }).sort(function (a, b) { return b.axe - a.axe || b.n - a.n; });
    var coupsDir = 0; l.forEach(function (p) { (p.coups || []).forEach(function (cp) { (cp || []).forEach(function (x) { if (x && typeof x.l === "number") coupsDir++; }); }); });
    if (notes.length < 2) return reponse(q, { statut: "insuffisant", periode: P, effectifs: eff, chiffres: notes.map(function (x) { return { lib: nomClub(x.club), val: x.axe + " % dans l'axe", base: x.n + " coups" }; }), phrase: "Pas encore assez de coups notés avec une direction pour comparer tes clubs.", manque: "Il faut au moins 2 clubs avec " + MIN_ANALYSTE.coupsClub + " coups notés avec une direction chacun (" + coupsDir + " coups avec direction en tout) : en saisie Expert, touche le côté de l'ellipse quand tu notes un coup." });
    var top = notes[0], sec = notes[1], net = top.axe - sec.axe >= SEUILS_ANALYSTE.axe;
    return reponse(q, { periode: P, effectifs: { parties: l.length, trous: T, coups: notes.reduce(function (t, x) { return t + x.n; }, 0) },
      phrase: (net ? "Le " + nomClub(top.club).toLowerCase() : "Pas de club nettement plus régulier ; en tête, le " + nomClub(top.club).toLowerCase()) + " : " + top.axe + " % de coups dans l'axe (sur " + top.n + "), " + (net ? "devant le " : "proche du ") + nomClub(sec.club).toLowerCase() + " (" + sec.axe + " % sur " + sec.n + ").",
      chiffres: notes.map(function (x) { return { lib: nomClub(x.club), val: x.axe + " % dans l'axe", base: x.n + " coups avec direction" }; }) });
  }
  if (id === "distance") {
    var dist = clubsNotes(l, ctx.ordreClubs || []).map(function (x) { var pr = profilClub(l, x.club); return { club: x.club, D: pr.distance }; });
    var conn = dist.filter(function (x) { return x.D.valeur != null; });
    var dr = dist.filter(function (x) { return x.club === "dr"; })[0];
    if (!conn.length) return reponse(q, { statut: "insuffisant", periode: P, effectifs: eff, phrase: "Aucun club n'a encore assez de distances mesurées.", manque: "Il faut au moins 3 pleins coups mesurés par club (tape la distance ou mesure-la au GPS en saisie Expert). " + (dr ? "Driver : " + plur(dr.D.n, "mesure") + " pour l'instant." : "") + " Les séances de practice se lisent dans Mon sac." });
    var drC = conn.filter(function (x) { return x.club === "dr"; })[0];
    return reponse(q, { periode: P, effectifs: { parties: l.length, trous: T, coups: conn.reduce(function (t, x) { return t + x.D.n; }, 0) },
      phrase: drC ? "Au driver, environ " + drC.D.valeur + " m sur le parcours (de " + drC.D.min + " à " + drC.D.max + " m, " + plur(drC.D.n, "mesure") + (drC.D.gps ? ", dont " + drC.D.gps + " au GPS, roulé compris" : "") + ")." : "Pas encore assez de mesures au driver" + (dr ? " (" + plur(dr.D.n, "mesure") + ")" : "") + " ; voici les clubs qui en ont assez.",
      chiffres: conn.map(function (x) { return { lib: nomClub(x.club), val: "≈ " + x.D.valeur + " m", base: plur(x.D.n, "mesure") + (x.D.gps ? " dont " + x.D.gps + " GPS" : "") }; }) });
  }
  if (id === "trous") {
    var parPc = {}; l.forEach(function (p) { if (p.pc) parPc[p.pc] = (parPc[p.pc] || 0) + 1; });
    var pcs = Object.keys(parPc).sort(function (a, b) { return parPc[b] - parPc[a]; });
    var pcObj = pcs.length ? (ctx.parcours || []).filter(function (x) { return x.id === pcs[0]; })[0] : null;
    if (!pcObj) return reponse(q, { statut: "insuffisant", periode: P, effectifs: eff, phrase: "Tes parties ne sont rattachées à aucun parcours.", manque: "Choisis le parcours au début de la partie (ou ajoute-le dans Mes parcours) : les trous se comparent d'une partie à l'autre." });
    var an = analyseParcours(l, pcObj), dur = an.trous.filter(function (x) { return x.N >= MIN_ANALYSTE.passages; }).map(function (x) { return { h: x.h, par: x.par, moy: x.S / x.N, N: x.N }; }).sort(function (a, b) { return b.moy - a.moy; });
    if (dur.length < 3) return reponse(q, { statut: "insuffisant", periode: P, effectifs: { parties: parPc[pcs[0]], trous: an.N }, phrase: "Pas encore assez de passages sur les mêmes trous.", manque: "Il faut des trous joués au moins " + MIN_ANALYSTE.passages + " fois avec un score à " + nomPc(pcObj.id) + " (" + plur(parPc[pcs[0]], "partie") + " pour l'instant)." });
    var t3 = dur.slice(0, 3);
    return reponse(q, { periode: P, effectifs: { parties: parPc[pcs[0]], trous: an.N },
      phrase: "À " + nomPc(pcObj.id) + " : " + t3.map(function (x) { return "trou " + (x.h + 1) + " (" + fr1(x.moy, true) + " en moyenne sur " + plur(x.N, "passage") + ")"; }).join(", ") + ".",
      chiffres: dur.slice(0, 6).map(function (x) { return { lib: "Trou " + (x.h + 1) + " · par " + x.par, val: fr1(x.moy, true), base: plur(x.N, "passage") }; }) });
  }
  if (id === "parcours") {
    var groupes = {}; l.forEach(function (p) { if (p.pc) (groupes[p.pc] = groupes[p.pc] || []).push(p); });
    var res = Object.keys(groupes).map(function (pc) { var st = tableauStats(groupes[pc]); return { pc: pc, n: st.parPartie.length, e: st.parPartie.length ? st.parPartie.reduce(function (t, x) { return t + x.ecart18; }, 0) / st.parPartie.length : null }; })
      .filter(function (x) { return x.n >= MIN_ANALYSTE.partiesParcours; }).sort(function (a, b) { return a.e - b.e; });
    if (res.length < 2) return reponse(q, { statut: "insuffisant", periode: P, effectifs: eff, chiffres: res.map(function (x) { return { lib: nomPc(x.pc), val: fr1(x.e, true), base: plur(x.n, "partie complète", "parties complètes") }; }), phrase: "Pas encore assez de parcours différents pour comparer.", manque: "Il faut au moins 2 parcours joués " + MIN_ANALYSTE.partiesParcours + " fois chacun avec un score à chaque trou, et rattachés à leur parcours." });
    var net2 = res[1].e - res[0].e >= SEUILS_ANALYSTE.parcours;
    return reponse(q, { periode: P, effectifs: eff,
      phrase: (net2 ? "À " + nomPc(res[0].pc) : "Pas d'écart net ; légèrement mieux à " + nomPc(res[0].pc)) + " : " + fr1(res[0].e, true) + " en moyenne (sur " + plur(res[0].n, "partie") + "), contre " + fr1(res[1].e, true) + " à " + nomPc(res[1].pc) + " (" + plur(res[1].n, "partie") + "). Écart au par sur 18 trous ; la difficulté des parcours n'est pas prise en compte.",
      chiffres: res.map(function (x) { return { lib: nomPc(x.pc), val: fr1(x.e, true), base: plur(x.n, "partie complète", "parties complètes") }; }) });
  }
  if (id === "secteur") {
    var r = coupsGagnes(l, ctx.cible == null ? 36 : ctx.cible);
    if (!r) return reponse(q, { statut: "insuffisant", periode: P, effectifs: eff, phrase: "Pas assez de trous pour une estimation.", manque: "Il faut au moins 9 trous joués." });
    var L = limitesEstimation(r), mes = r.secteurs.filter(function (s) { return s.sg != null; }).sort(function (a, b) { return a.sg - b.sg; }), pire = mes[0];
    return reponse(q, { periode: P, effectifs: { parties: r.n, trous: r.T },
      phrase: (pire && pire.sg <= -0.5 ? "Estimation : " + pire.nom.toLowerCase() + ", environ " + fr1(-pire.sg) + " coup" + (-pire.sg >= 2 ? "s" : "") + " perdu" + (-pire.sg >= 2 ? "s" : "") + " par partie face à un joueur d'index " + r.cible + "." : "Estimation : aucun secteur ne te coûte un demi-coup face à un joueur d'index " + r.cible + ".") + " Fiabilité " + L.fiabilite + " ; ce n'est pas du Strokes Gained.",
      chiffres: r.secteurs.map(function (s) { return { lib: s.nom, val: s.sg == null ? "non mesuré" : fr1(s.sg, true), base: "coups par partie" }; }),
      limites: L.limites.map(function (x) { return x.txt; }) });
  }
  if (id === "forme") {
    var a2 = associationsNotes(l).filter(function (x) { return x.id === "forme"; })[0], notees = l.filter(function (p) { return p.note && p.note.forme; }).length;
    if (!a2.ok) return reponse(q, { statut: "insuffisant", periode: P, effectifs: eff, phrase: "Pas encore assez de parties notées pour comparer.", manque: "Il faut au moins 3 parties complètes notées « fatigué » et 3 « en forme » (tu en as " + a2.bas.n + " et " + a2.haut.n + ") : ajoute une note après chaque partie, depuis le bilan de fin de partie ou le journal." + (notees ? "" : "") });
    var dd = a2.bas.ecart18 - a2.haut.ecart18;
    return reponse(q, { periode: P, effectifs: { parties: a2.bas.n + a2.haut.n, trous: null },
      phrase: (dd >= SEUILS_ANALYSTE.score ? "Oui, d'après tes notes" : dd <= -SEUILS_ANALYSTE.score ? "Non, plutôt l'inverse d'après tes notes" : "Pas de différence nette") + " : " + fr1(a2.haut.ecart18, true) + " les jours « en forme » (" + plur(a2.haut.n, "partie") + "), " + fr1(a2.bas.ecart18, true) + " les jours « fatigué » (" + plur(a2.bas.n, "partie") + "). C'est une association, pas une cause.",
      chiffres: [{ lib: "En forme", val: fr1(a2.haut.ecart18, true), base: plur(a2.haut.n, "partie") }, { lib: "Fatigué", val: fr1(a2.bas.ecart18, true), base: plur(a2.bas.n, "partie") }] });
  }
  return null;
}

if (typeof module !== "undefined") {
  var EP = require("./engine-plus.js"), ES = require("./engine-stats.js"), EU = require("./engine-putting.js"), EC = require("./engine-clubs.js"), EJ = require("./engine-journal.js"), EX2 = require("./engine-estimation.js");
  var tableauStats = ES.tableauStats, agregatPutts = EU.agregatPutts, statsTrous = EP.statsTrous, misesEnJeu = EP.misesEnJeu, analyseParcours = EP.analyseParcours,
    coupsGagnes = EP.coupsGagnes, clubsNotes = EC.clubsNotes, profilClub = EC.profilClub, associationsNotes = EJ.associationsNotes, limitesEstimation = EX2.limitesEstimation;
  module.exports = { repondre, chercherQuestions, QUESTIONS_ANALYSTE, SEUILS_ANALYSTE, MIN_ANALYSTE };
}
