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
  function analysteHTML() {
    var A = etatAnalyste();
    return '<button class="voile" type="button" data-a="fermer-feuille" aria-label="Fermer" tabindex="-1"></button>' +
      '<section class="feuille analyste" role="dialog" aria-modal="true" aria-labelledby="f-titre" id="feuille">' +
      '<header><p class="surtitre">Tes questions, tes chiffres</p><h2 id="f-titre">Comprendre mon jeu</h2><button class="fermer" type="button" data-a="fermer-feuille" id="f-fermer">Fermer</button></header>' +
      '<p class="aide">' + t("Les réponses sont calculées à partir de ton carnet seulement : chaque chiffre est cité avec sa période et le nombre de parties, de trous ou de coups étudiés. Pas d'IA : rien n'est inventé.") + '</p>' +
      pastillesPeriodeHTML("an-periode") + '<p class="aide an-perimetre">' + t(perimetreTexte(partiesAnalyste()) + " Même période que les autres analyses.") + '</p>' +
      '<div class="champ"><label for="an-recherche">Cherche une question</label><input id="an-recherche" type="search" autocomplete="off" placeholder="putts, driver, trou, forme…" value="' + at(A.recherche) + '" data-i="an-recherche"></div>' +
      '<div id="an-liste" aria-live="polite">' + listeAnalysteHTML() + '</div></section>';
  }
  function rendreAnalyste(focusSel) {
    var f = document.getElementById("feuille"), y = f ? f.scrollTop : 0;
    rendreFeuille(); f = document.getElementById("feuille"); if (f) f.scrollTop = y;
    var b = focusSel && document.querySelector("#feuille " + focusSel); if (b) b.focus({ preventScroll: true });
  }
  ACTIONS["an-ouvrir"] = function (el) {
    ui.retourFocus = el; etatAnalyste(); var v = el.getAttribute("data-v"); if (v) ui.analyste.q = v;
    ui.feuille = { analyste: true }; rendreFeuille(); var b = document.getElementById("f-fermer"); if (b) b.focus();
  };
  ACTIONS["an-periode"] = function (el) { var v = el.getAttribute("data-v"); appliquerPeriode(v); rendre(); rendreAnalyste('[data-a="an-periode"][data-v="' + v + '"]'); };
  ACTIONS["an-question"] = function (el) {
    var A = etatAnalyste(), id = el.getAttribute("data-v"); A.q = A.q === id ? null : id;
    rendreAnalyste('[data-a="an-question"][data-v="' + id + '"]');
  };
  SAISIES["an-recherche"] = function (el) {
    etatAnalyste().recherche = el.value;
    var l = document.getElementById("an-liste"); if (l) l.innerHTML = listeAnalysteHTML();
  };
