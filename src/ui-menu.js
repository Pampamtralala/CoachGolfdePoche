  /* ============================================================
     NAVIGATION : cinq rubriques dans une barre (en bas sur téléphone, à gauche sur grand écran),
     et une recherche qui mène à chaque fonction de l'appli.
     ============================================================ */
  /* UX03 : cinq entrées orientées données. Jouer, au centre, est l'action principale ;
     le coaching (programme, exercices, défis) est rangé dans Analyses ; le profil est dans l'en-tête. */
  var RUBRIQUES = [
    { id: "accueil", nom: "Mon jeu", ico: "accueil", pages: ["accueil"] },
    { id: "bilan", nom: "Analyses", ico: "stats", pages: ["bilan", "practice", "exercices"] },
    { id: "parcours", nom: "Jouer", ico: "drapeau", pages: ["parcours"], principal: true },
    { id: "sac", nom: "Mon sac", ico: "sac", pages: ["sac"] },
    { id: "journal", nom: "Journal", ico: "carnet", pages: ["journal"] }
  ];
  /* Page sans entrée (le profil, ouvert depuis l'en-tête) : aucune entrée n'est marquée. */
  function rubriqueDe(page) { var r = RUBRIQUES.filter(function (x) { return x.pages.indexOf(page) >= 0; })[0]; return r ? r.id : null; }
  /* Sous-navigation commune aux pages d'Analyses : statistiques, questions, coaching. */
  function sousNavAnalysesHTML(actif) {
    var l = [{ v: "bilan", lib: "Statistiques" }, { a: "ens-ouvrir", lib: "Enseignements" }, { a: "an-ouvrir", lib: "Comprendre mon jeu" }, { v: "practice", lib: "Programme" }, { v: "exercices", lib: "Exercices et défis" }];
    return '<nav class="filtres sous-nav" aria-label="Analyses">' + l.map(function (x) {
      var on = x.v === actif;
      return '<button class="puce neutre" type="button" data-a="' + (x.a || "onglet") + '"' + (x.v ? ' data-v="' + x.v + '"' : '') + (on ? ' aria-pressed="true" aria-current="page"' : '') + '>' + t(x.lib) + '</button>';
    }).join("") + '</nav>';
  }
  /* rendre() appelle toujours rendreMenu : c'est désormais la barre de navigation. */
  function rendreMenu(visible) {
    var b = document.getElementById("barre");
    if (!b) return;
    document.body.classList.toggle("avec-barre", !!visible);
    if (!visible) { b.hidden = true; b.innerHTML = ""; return; }
    b.hidden = false;
    var r = rubriqueDe(ui.onglet);
    b.innerHTML = '<span class="barre-marque" aria-hidden="true">Coach de poche</span><ul>' + RUBRIQUES.map(function (x) {
      return '<li><button class="barre-item' + (x.principal ? ' principal' : '') + '" type="button" data-a="onglet" data-v="' + x.id + '"' + (r === x.id ? ' aria-current="page"' : '') + '>' +
        icone(x.ico) + '<span>' + t(x.nom) + '</span></button></li>';
    }).join("") + '</ul>';
  }

  /* ---------- Toutes les fonctions, avec une recherche ---------- */
  function fonctions() {
    var pt = etat.partie;
    return [
      { g: "Mon jeu", l: [
        { p: "accueil", t: "Mon jeu : tendances et dernière partie", k: "accueil tableau de bord resume chiffres cles" }] },
      { g: "Analyses", l: [
        { p: "bilan", t: "Tableau de bord des statistiques", k: "stats chiffres cles tendances index" },
        { a: "ens-ouvrir", t: "Enseignements : ce que disent mes données", k: "enseignements insights constats points forts vigilance erreurs records progression" },
        { a: "an-ouvrir", t: "Comprendre mon jeu : poser une question", k: "question comprendre analyse pourquoi mieux trois putts driver gauche droite club regulier trou difficile parcours forme" },
        { a: "md-ouvrir", t: "Mes données : vérifier, corriger, sauvegarder", k: "donnees qualite provenance exclure corriger sauvegarde export restaurer" },
        { p: "bilan", s: "notes", t: "Ton jeu sur 100", k: "notes jauges priorite semaine" },
        { p: "bilan", s: "sg", t: "Objectif d’index et estimation des coups gagnés", k: "strokes gained coups gagnés perdus estimation cible" },
        { p: "bilan", s: "evitables", t: "Erreurs évitables", k: "penalites double approche trois putts" },
        { p: "bilan", s: "releves", t: "Relevés détaillés", k: "constats premier putt" },
        { p: "bilan", s: "defauts", t: "Tes défauts", k: "slice hook diagnostic" },
        { p: "bilan", s: "carte", t: "Ta carte de jeu", k: "domaines palier" }] },
      { g: "Coaching", l: [
        { p: "practice", t: "Programme et séance du jour", k: "progresser plan cycle semaine entrainement calendrier" },
        { p: "exercices", t: "Bibliothèque d’exercices", k: "progresser exercices drills" },
        { p: "exercices", s: "defis", t: "Défis", k: "challenge chrono putting record" },
        { p: "practice", s: "badges", t: "Badges de progression", k: "recompenses succes" },
        { a: "fin-cycle", t: "Faire le bilan du cycle", k: "fin cycle nouveau plan" }] },
      { g: "Jouer", l: [
        { a: "partie-rapide", t: pt ? "Reprendre la partie au trou " + numeroTrou(pt, pt.i) : "Lancer une partie", k: "nouvelle partie carte score express detaillee" },
        etat.parcours.length ? { p: "parcours", s: "c-parcours", t: "Mes parcours", k: "golf trous meilleurs pires dangers" } : null,
        { a: "carte-nouveau", t: "Carte GPS : ajouter mon golf", k: "gps green distance entree milieu fond openstreetmap carte parcours" },
        { a: "cond-ouvrir", t: "Conditions du jour", k: "vent temperature meteo" }] },
      { g: "Mon sac", l: [
        { p: "sac", t: "Sac et distances", k: "clubs fourchette dispersion ecarts trous" },
        { a: "sac-modifier", t: "Composer mon sac", k: "configuration clubs wedges loft" },
        { p: "sac", s: "c-wedges", t: "Matrice de wedges", k: "amplitudes petit jeu" },
        { p: "sac", s: "c-historique", t: "Séries de practice archivées", k: "series balles practice archive" }] },
      { g: "Journal", l: [
        { p: "journal", t: "Mes parties", k: "historique cartes scores image partage" },
        { a: "j-ouvrir", t: "Bilans, notes et rapports", k: "journal bilan mois trimestre saison rapport export import csv notes forme meteo" }] },
      { g: "Profil", l: [
        { p: "profil", t: "Profil et objectif d’index", k: "moi index prenom lieux" },
        { p: "profil", s: "donnees", t: "Sauvegarde et données", k: "moi export import code synchronisation" },
        { a: "modifier", t: "Modifier mes réponses", k: "moi questionnaire profil" }] }
    ].map(function (g) { g.l = g.l.filter(Boolean); return g; });
  }
  function sansAccent(s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }
  function rechercheHTML() {
    return '<div class="feuille recherche" role="dialog" aria-modal="true" aria-labelledby="f-titre" id="feuille">' +
      '<header class="feuille-tete"><div><p class="surtitre">Coach de poche</p><h2 id="f-titre">Toutes les fonctions</h2></div><button class="fermer" type="button" data-a="fermer-feuille" id="f-fermer">Fermer</button></header>' +
      '<label class="recherche-champ"><span class="vh">Rechercher une fonction</span>' + icone("loupe") +
      '<input id="recherche-q" type="search" data-i="recherche" autocomplete="off" placeholder="Série, défi, wedges, carte…"></label>' +
      '<div id="recherche-l">' + fonctions().map(function (g) {
        return '<section class="recherche-groupe"><h3>' + t(g.g) + '</h3><ul>' + g.l.map(function (x) {
          return '<li data-k="' + at(sansAccent(g.g + " " + x.t + " " + (x.k || ""))) + '"><button type="button" class="recherche-item" data-a="fonction"' +
            (x.a ? ' data-v="' + x.a + '"' : ' data-p="' + x.p + '"' + (x.s ? ' data-s="' + x.s + '"' : '')) + '><span>' + t(x.t) + '</span>' + icone("chevron") + '</button></li>';
        }).join("") + '</ul></section>';
      }).join("") + '<p class="vide-recherche" hidden>Aucune fonction ne correspond. Essaie un autre mot.</p></div></div>';
  }
  ACTIONS.recherche = function () { ui.feuille = { recherche: true }; ui.feuilleVue = false; ui.retourFocus = document.activeElement; rendreFeuille(); var q = document.getElementById("recherche-q"); if (q) q.focus({ preventScroll: true }); };
  ACTIONS.menu = ACTIONS.recherche;
  SAISIES.recherche = function (el) {
    var q = sansAccent(el.value).trim().split(/\s+/).filter(Boolean), n = 0;
    document.querySelectorAll("#recherche-l li[data-k]").forEach(function (li) {
      var ok = q.every(function (m) { return li.getAttribute("data-k").indexOf(m) >= 0; }); li.hidden = !ok; if (ok) n++;
    });
    document.querySelectorAll("#recherche-l .recherche-groupe").forEach(function (g) { g.hidden = !g.querySelector("li:not([hidden])"); });
    var v = document.querySelector("#recherche-l .vide-recherche"); if (v) v.hidden = n > 0;
  };
  ACTIONS.fonction = function (el) {
    var act = el.getAttribute("data-v"), page = el.getAttribute("data-p"), sec = el.getAttribute("data-s");
    ui.feuille = null; ui.feuilleVue = false; rendreFeuille();
    if (act) { if (ACTIONS[act]) ACTIONS[act](el); return; }
    allerA(page, sec);
  };
  /* Va à une page, et à une de ses sections (ouverte si elle se replie). */
  function allerA(page, sec) {
    if (sec) ui.plis[sec] = true;
    /* UX06 : une section d'Analyses vit dans une rubrique ; on ouvre la bonne. */
    if (page === "bilan" && sec && rubriqueDeSection(sec) && ui.rubrique !== rubriqueDeSection(sec)) { ui.rubrique = rubriqueDeSection(sec); if (ui.onglet === "bilan") rendre(); }
    allerOnglet(page, !sec);
    if (sec) allerSection(sec);
    var cible = sec && document.getElementById(sec);
    var f = cible ? cible.querySelector("h2 button, h2, button") : app.querySelector("h1");
    if (f) { if (!f.hasAttribute("tabindex") && f.tagName !== "BUTTON") f.setAttribute("tabindex", "-1"); f.focus({ preventScroll: true }); }
  }
  ACTIONS["aller-a"] = function (el) { allerA(el.getAttribute("data-v"), el.getAttribute("data-s")); };
  /* Anciennes commandes du menu, gardées pour les liens existants. */
  ACTIONS["menu-aller"] = ACTIONS["aller-a"];
  ACTIONS["menu-action"] = function (el) { var f = ACTIONS[el.getAttribute("data-v")]; if (f) f(el); };
  function ouvrirMenu() { ACTIONS.recherche(); }
  function fermerMenu() { ui.menu = false; }
