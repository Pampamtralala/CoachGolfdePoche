  /* ============================================================
     ENSEIGNEMENTS PERSONNALISÉS (roadmap UX, UX05)
     Calculés par le moteur déterministe à partir des autres moteurs ; tous dans la fiche (Performance),
     le premier point de vigilance sert de « priorité actuelle » sur l'accueil (V4-06). Chaque carte : constat chiffré, période, effectif, fiabilité, lien, action éventuelle.
     ============================================================ */
  var cacheEns = {};
  function ctxEns() { var c = ctxAnalyste(); c.nomDomaine = function (d) { var x = DOMAINES.filter(function (y) { return y.id === d; })[0]; return x ? x.nom : d; }; return c; }
  function calculEns() {
    var l = partiesAnalyse(), cible = indexVise();
    if (cacheEns.l !== l || cacheEns.cible !== cible || cacheEns.pc !== etat.parcours) cacheEns = { l: l, cible: cible, pc: etat.parcours, v: enseignements(l, ctxEns()) };
    return cacheEns.v;
  }
  /* Graine de rotation : change chaque jour et à chaque nouvelle partie. */
  function graineEns() { return Math.floor(Date.now() / 864e5) + etat.parties.length; }
  var PROVENANCE_ENS = { "observé": "Observé", "estimé": "Estimé", "déduit": "Déduit", "déclaré": "Déclaré" };
  function carteEnsHTML(e) {
    var E = e.effectifs || {}, eff = [E.parties ? pluriel(E.parties, "partie") : "", E.trous ? E.trous + " trous" : "", E.coups ? E.coups + " coups" : ""].filter(Boolean).join(" · ");
    var per = e.periode && e.periode.du ? periodeLib(e.periode.du, e.periode.au).replace(/^du/, "Du") : "";
    var lien = e.lien ? '<button class="lien" type="button" data-a="' + e.lien.a + '"' + (e.lien.v ? ' data-v="' + at(e.lien.v) + '"' : '') + (e.lien.s ? ' data-s="' + at(e.lien.s) + '"' : '') + '>' + t(e.lien.lib) + '</button>' : '';
    var act = e.action ? '<button class="btn" type="button" data-a="' + e.action.a + '"' + (e.action.v ? ' data-v="' + at(e.action.v) + '"' : '') + '>' + t(e.action.lib) + '</button>' +
      (e.action.source === "données" ? '<small class="ens-source">' + t("Proposé d'après tes données, pas d'après le questionnaire.") + '</small>' : '') : '';
    return '<article class="carte-ens cat-' + e.cat + '" data-ens="' + at(e.id) + '"><p class="surtitre">' + t(e.catLib) + ' · <span class="ens-prov">' + t(PROVENANCE_ENS[e.provenance] || e.provenance) + '</span></p>' +
      '<h3>' + t(e.titre) + '</h3><p>' + t(e.constat) + '</p>' +
      '<p class="ens-meta">' + t([per, eff].filter(Boolean).join(" · ")) + '</p><p class="ens-fiab ' + e.fiabilite.niveau + '">' + t(e.fiabilite.texte) + '</p>' +
      (lien || act ? '<div class="ligne-btn">' + act + lien + '</div>' : '') + '</article>';
  }
  function ensHTML() {
    var R = calculEns();
    var corps = R.liste.length ? CATEGORIES_ENS.map(function (c) {
      var l = R.liste.filter(function (e) { return e.cat === c.id; });
      return l.length ? '<h3 class="ens-groupe">' + t(c.lib) + '</h3>' + l.map(carteEnsHTML).join("") : '';
    }).join("") : '<p class="aide">' + t(R.parties ? "Rien de net pour l'instant : aucun écart ne dépasse les seuils sur tes " + pluriel(R.parties, "partie") + "." : "Enregistre une première partie : les enseignements se construisent à partir de ton carnet.") + '</p>';
    return '<button class="voile" type="button" data-a="fermer-feuille" aria-label="Fermer" tabindex="-1"></button>' +
      '<section class="feuille enseignements" role="dialog" aria-modal="true" aria-labelledby="f-titre" id="feuille">' +
      '<header><p class="surtitre">' + t("Toutes tes parties prises en compte") + '</p><h2 id="f-titre">Enseignements</h2><button class="fermer" type="button" data-a="fermer-feuille" id="f-fermer">Fermer</button></header>' +
      '<p class="aide">' + t("Tirés de ton carnet par des règles fixes, sans IA : un enseignement n'apparaît que si l'écart dépasse un seuil, sur un nombre minimum d'observations. Une association n'est pas une cause.") + '</p>' + corps + '</section>';
  }
  ACTIONS["ens-ouvrir"] = function (el) { ui.retourFocus = el; ui.feuille = { enseignements: true }; rendreFeuille(); var b = document.getElementById("f-fermer"); if (b) b.focus(); };
  /* Détail : la question correspondante de « Comprendre mon jeu », sur toutes les parties (comme l'enseignement). */
  ACTIONS["ens-detail"] = function (el) {
    etatAnalyste(); ui.analyste.q = el.getAttribute("data-v"); ui.analyste.recherche = "";
    /* L'enseignement porte sur toutes les parties : le détail aussi (filtre commun remis à « Toutes », formats et parcours compris). */
    var F = appliquerPeriode("0"); F.format = ""; F.parcours = "";
    ui.retourFocus = ui.retourFocus || el; ui.feuille = { analyste: true }; rendreFeuille();
    var r = document.getElementById("an-rep-" + ui.analyste.q); if (r && r.scrollIntoView) r.scrollIntoView({ block: "start" });
    var b = document.getElementById("f-fermer"); if (b) b.focus({ preventScroll: true });
  };
  function fermerFeuilleEns() { if (ui.feuille) { ui.feuille = null; ui.pile = []; ui.retourFocus = null; rendreFeuille(); } }
  ACTIONS["ens-aller"] = function (el) { fermerFeuilleEns(); allerA(el.getAttribute("data-v"), el.getAttribute("data-s")); };
  /* Passerelle vers le coaching : la bibliothèque filtrée sur le domaine concerné. */
  ACTIONS["exos-domaine"] = function (el) { fermerFeuilleEns(); ui.filtre.d = el.getAttribute("data-v"); ui.filtreDonnees = ui.filtre.d; allerOnglet("exercices", true); };
