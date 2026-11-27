  /* ============================================================
     ENSEIGNEMENTS PERSONNALISÉS (roadmap UX, UX05)
     Calculés par le moteur déterministe à partir des autres moteurs ; tous dans Performance › Comprendre mon jeu,
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
  /* V4-07 (retour utilisateur) : les enseignements s'ouvrent en place (une ligne → la carte complète) ; « Voir le détail »
     ouvre la question correspondante, en place elle aussi, dans « Comprendre mon jeu ». */
  ACTIONS["ens-deplier"] = function (el) {
    var id = el.getAttribute("data-v"); ui.ensOuvert = ui.ensOuvert === id ? null : id;
    rendre(); var b = document.querySelector('#vue [data-a="ens-deplier"][data-v="' + id + '"]'); if (b) b.focus({ preventScroll: true });
  };
  ACTIONS["ens-ouvrir"] = function () { ui.ensTout = true; ouvrirComprendre("#rb-ens"); };
  ACTIONS["ens-tout"] = function () { ui.ensTout = !ui.ensTout; rendre(); var b = document.querySelector('#vue [data-a="ens-tout"]'); if (b) b.focus({ preventScroll: true }); };
  /* Détail : la question correspondante, sur toutes les parties (comme l'enseignement : filtre commun remis à « Toutes »). */
  ACTIONS["ens-detail"] = function (el) {
    etatAnalyste(); ui.analyste.q = el.getAttribute("data-v"); ui.analyste.recherche = "";
    var F = appliquerPeriode("0"); F.format = ""; F.parcours = "";
    ouvrirComprendre('[data-a="an-question"][data-v="' + ui.analyste.q + '"]');
  };
  function fermerFeuilleEns() { if (ui.feuille) { ui.feuille = null; ui.pile = []; ui.retourFocus = null; rendreFeuille(); } }
  ACTIONS["ens-aller"] = function (el) { fermerFeuilleEns(); allerA(el.getAttribute("data-v"), el.getAttribute("data-s")); };
  /* Passerelle vers le coaching : la bibliothèque filtrée sur le domaine concerné. */
  ACTIONS["exos-domaine"] = function (el) { fermerFeuilleEns(); ui.filtre.d = el.getAttribute("data-v"); ui.filtreDonnees = ui.filtre.d; allerOnglet("exercices", true); };
