  /* ============================================================
     COMPOSANTS COMMUNS (roadmap V4, chantier 04)
     Une seule hiérarchie sur tous les écrans :
       1 · page (titre court)  2 · section  3 · donnée principale  4 · contexte  5 · aide à la demande (repliée).
     Les écrans assemblent ces briques ; ils ne réécrivent plus leur propre carte de KPI ni leur propre aide.
     ============================================================ */

  /* 1 · En-tête de page : surtitre facultatif, titre court, une ligne de sous-titre au plus, contenu libre ensuite
     (sous-navigation, filtres). */
  function pageTeteHTML(o) {
    return '<section class="bloc premier page-tete">' + (o.avant || '') + (o.surtitre ? '<p class="surtitre">' + t(o.surtitre) + '</p>' : '') +
      '<h1>' + t(o.titre) + '</h1>' + (o.sous ? '<p class="page-sous">' + t(o.sous) + '</p>' : '') + (o.apres || '') + '</section>';
  }

  /* 2 · En-tête de section : titre, lien « Détail › » facultatif (o.lien = { a, v, s, id, lib }), aide repliée facultative. */
  function attrsLien(l) {
    return 'data-a="' + l.a + '"' + (l.v != null ? ' data-v="' + at(String(l.v)) + '"' : '') + (l.s ? ' data-s="' + at(l.s) + '"' : '') + (l.id ? ' data-id="' + at(l.id) + '"' : '');
  }
  function sectionTeteHTML(titre, o) {
    o = o || {};
    return '<div class="section-tete"><h2>' + t(titre) + '</h2>' +
      (o.lien ? '<button class="lien detail" type="button" ' + attrsLien(o.lien) + '>' + t(o.lien.lib || "Détail") + ' <span aria-hidden="true">›</span></button>' : '') + '</div>' +
      (o.aide ? aideHTML(o.aide, o.aideTitre) : '');
  }

  /* 3 + 4 · Carte KPI. x = {
       t : titre court ; v : valeur (« – » si inconnue, jamais zéro inventé) ; u : unité ;
       tend : évolution (HTML de tendanceStat) ; ctx : une ligne de contexte ; n : effectif (« 86 départs ») ;
       prov : provenance (Observé, Déclaré, Déduit, Référence…) ; r : constat ou conseil court ;
       aide : explication, repliée derrière « ⓘ » (cartes non cliquables seulement) ;
       lien : { a, v, s, id } — la carte entière devient un bouton vers le détail ; label : texte lu à la place }.
     Un bouton ne peut pas contenir de pli : l'aide d'une carte cliquable va dans son détail. */
  function kpiHTML(x) {
    var corps = '<span class="kpi-t">' + t(x.t) + (x.prov ? ' <span class="ens-prov">' + t(x.prov) + '</span>' : '') + '</span>' +
      '<span class="kpi-v"><span class="main">' + t(x.v == null || x.v === "" ? "–" : String(x.v)) + '</span>' + (x.tend || '') + '</span>' +
      (x.u ? '<span class="kpi-u">' + t(x.u) + '</span>' : '') +
      (x.ctx ? '<span class="kpi-c">' + t(x.ctx) + '</span>' : '') +
      (x.r ? '<span class="kpi-r">' + t(x.r) + '</span>' : '') +
      (x.n ? '<span class="kpi-n">' + t(x.n) + '</span>' : '');
    if (x.lien) return '<button class="kpi kpi-lien" type="button" ' + attrsLien(x.lien) + ' aria-label="' + at(x.label || (x.t + " : " + (x.v == null ? "inconnu" : x.v) + (x.u ? " " + x.u : "") + ". Voir le détail")) + '">' + corps + icone("chevron") + '</button>';
    return '<article class="kpi">' + corps + (x.aide ? aideHTML('<p>' + t(x.aide) + '</p>', x.aideTitre || "Comment lire", "kpi-aide") : '') + '</article>';
  }
  /* Grille de 4 à 6 cartes (classe en plus facultative). */
  function kpisHTML(cartes, cls) {
    return '<div class="kpi-grille' + (cls ? " " + cls : "") + '">' + cartes.filter(Boolean).map(kpiHTML).join("") + '</div>';
  }

  /* 5 · Aide à la demande : repliée, signalée par « ⓘ ». html est déjà échappé par l'appelant. */
  function aideHTML(html, titre, cls) {
    return '<details class="aide-pli' + (cls ? " " + cls : "") + '"><summary><span class="ico-info" aria-hidden="true">i</span>' + t(titre || "Comment est-ce calculé ?") + '</summary><div>' + html + '</div></details>';
  }
  /* Ancien nom, gardé pour les écrans existants. */
  function comment(html, titre) { return aideHTML(html, titre || "Comment ça marche"); }

  /* État vide : ce qui manque, à quoi ça servira, une seule action. */
  function etatVideHTML(ico, titre, texte, action, bouton) {
    return '<div class="etat-vide">' + icone(ico) + '<p class="tb-titre">' + t(titre) + '</p><p>' + t(texte) + '</p>' +
      (action ? '<button class="btn principal" type="button" data-a="' + action + '">' + t(bouton) + '</button>' : '') + '</div>';
  }
