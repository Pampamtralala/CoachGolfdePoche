  /* ============================================================
     COMPRENDRE MON JEU (roadmap DATA, P12)
     Questions fixes, réponses calculées par le moteur déterministe : chiffres, période, effectif, méthode ;
     si les données manquent, ce qu'il faut saisir. Aucune IA : rien n'est inventé.
     ============================================================ */
  /* UX07 : la période est celle du filtre commun des analyses (nombre de parties, saison, format, parcours…). */
  function etatAnalyste() { return ui.analyste || (ui.analyste = { q: null, recherche: "" }); }
  function partiesAnalyste() { return partiesFiltrees(); }
  function ctxAnalyste() {
    return { parcours: etat.parcours, cible: indexVise(), nomClub: nomClub, ordreClubs: ordreClubs(),
      nomParcours: function (id) { var pc = parcoursDe(id); return pc ? pc.nom : "un parcours supprimé"; } };
  }
  function reponseHTML(R) {
    var h = '<div class="an-reponse ' + R.statut + '" id="an-rep-' + R.id + '"><p class="an-phrase">' + t(R.phrase) + '</p>';
    if (R.chiffres.length) h += '<div class="defile"><table class="carte-score an-chiffres"><tbody>' + R.chiffres.map(function (c) {
      var base = String(c.base || "").replace(/du (\d{4}-\d{2}-\d{2}) au (\d{4}-\d{2}-\d{2})/, function (x, a, b) { return periodeLib(a, b); });
      return '<tr><th scope="row">' + t(c.lib) + '<small>' + t(base) + '</small></th><td class="num">' + t(c.val) + '</td></tr>';
    }).join("") + '</tbody></table></div>';
    var eff = R.effectifs ? [R.effectifs.parties != null ? pluriel(R.effectifs.parties, "partie") : "", R.effectifs.trous ? R.effectifs.trous + " trous" : "", R.effectifs.coups ? R.effectifs.coups + " coups" : ""].filter(Boolean).join(", ") : "";
    if (R.periode || eff) h += '<p class="an-source">' + t((R.periode ? periodeLib(R.periode.du, R.periode.au).replace(/^du/, "Du") : "") + (R.periode && eff ? " · " : "") + eff + ".").replace(/\.\.$/, ".") + '</p>';
    if (R.manque) h += '<p class="an-manque"><b>' + t(R.statut === "vide" ? "Pour commencer" : "Pour répondre") + '</b> ' + t(R.manque) + '</p>';
    if (R.limites && R.limites.length) h += '<ul class="constats">' + R.limites.map(function (x) { return '<li>' + t(x) + '</li>'; }).join("") + '</ul>';
    return h + '<details class="an-methode"><summary>Méthode</summary><p>' + t(R.methode) + '</p></details></div>';
  }
  function listeAnalysteHTML() {
    var A = etatAnalyste(), ids = chercherQuestions(A.recherche), l = partiesAnalyste(), ctx = ctxAnalyste();
    if (!ids.length) return '<p class="aide">' + t("Aucune question ne correspond. Essaie « score », « putts », « driver », « trou » ou « forme ».") + '</p>';
    return '<ul class="an-questions">' + ids.map(function (id) {
      var q = QUESTIONS_ANALYSTE.filter(function (x) { return x.id === id; })[0], ouvert = A.q === id;
      return '<li><button class="an-q" type="button" data-a="an-question" data-v="' + id + '" aria-expanded="' + ouvert + '"' + (ouvert ? ' aria-controls="an-rep-' + id + '"' : '') + '>' + t(q.q) + '</button>' + (ouvert ? reponseHTML(repondre(id, l, ctx)) : '') + '</li>';
    }).join("") + '</ul>';
  }
  /* V4-07 (retour utilisateur) : plus de fiche par-dessus l'écran. Les questions et leurs réponses s'ouvrent en place,
     dans la famille « Comprendre mon jeu » de Performance, sous le filtre commun. */
  function questionsComprendreHTML() {
    var A = etatAnalyste();
    return '<div class="champ"><label for="an-recherche">Cherche une question</label><input id="an-recherche" type="search" autocomplete="off" placeholder="putts, driver, trou, forme…" value="' + at(A.recherche) + '" data-i="an-recherche"></div>' +
      '<div id="an-liste" class="analyste" aria-live="polite">' + listeAnalysteHTML() + '</div>';
  }
  /* Ouvre Performance › Comprendre mon jeu (depuis n'importe où), puis amène l'élément visé à l'écran. */
  function ouvrirComprendre(sel) {
    ui.rubrique = "comprendre"; (ui.rubFamille || (ui.rubFamille = {})).comprendre = "comprendre";
    if (ui.feuille) { ui.feuille = null; ui.pile = []; ui.retourFocus = null; rendreFeuille(); }
    if (ui.onglet !== "bilan") allerOnglet("bilan", false); else rendre();
    var c = sel && document.querySelector("#vue " + sel);
    if (c) { if (c.scrollIntoView) c.scrollIntoView({ block: "start" }); var f = c.matches("button") ? c : c.querySelector("button"); if (f) f.focus({ preventScroll: true }); }
  }
  ACTIONS["an-ouvrir"] = function (el) {
    etatAnalyste(); var v = el.getAttribute("data-v"); if (v) { ui.analyste.q = v; ui.analyste.recherche = ""; }
    ouvrirComprendre(v ? '[data-a="an-question"][data-v="' + v + '"]' : '#rb-questions');
  };
  ACTIONS["an-periode"] = function (el) { appliquerPeriode(el.getAttribute("data-v")); rendre(); };
  ACTIONS["an-question"] = function (el) {
    var A = etatAnalyste(), id = el.getAttribute("data-v"); A.q = A.q === id ? null : id;
    rendre(); var b = document.querySelector('#vue [data-a="an-question"][data-v="' + id + '"]'); if (b) b.focus({ preventScroll: true });
  };
  SAISIES["an-recherche"] = function (el) {
    etatAnalyste().recherche = el.value;
    var l = document.getElementById("an-liste"); if (l) l.innerHTML = listeAnalysteHTML();
  };
