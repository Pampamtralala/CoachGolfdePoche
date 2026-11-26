  /* ============================================================
     COACHING REPOSITIONNÉ (roadmap UX, UX13)
     Passerelles constat → analyse → exercices, et origine de chaque recommandation dite en clair : « d'après tes
     données » (observé, moteur des enseignements) ou « d'après ton questionnaire » (déclaré, programme).
     Bibliothèque et programme restent libres d'accès, sans recommandation automatique.
     ============================================================ */
  function recoDonneesHTML() {
    if (!etat.parties.length) return '<section class="bloc reco-donnees" id="reco-donnees"><h2>' + t("D'après tes données") + '</h2><p class="aide">' + t("Après quelques parties, les exercices liés à ce que montrent tes données apparaîtront ici. La bibliothèque reste ouverte en attendant.") + '</p></section>';
    var l = calculEns().liste.filter(function (e) { return e.action && e.action.a === "exos-domaine"; }).slice(0, 3);
    var h = '<section class="bloc reco-donnees" id="reco-donnees"><h2>' + t("D'après tes données") + '</h2><p class="aide">' + t("Recommandations observées : chacune part d'un constat chiffré de ton carnet. Elles ne remplacent pas ton programme.") + '</p>';
    if (!l.length) return h + '<p class="aide">' + t("Rien de net à travailler pour l'instant d'après tes parties. Choisis librement dans la bibliothèque.") + '</p></section>';
    return h + '<ul class="liste-exos">' + l.map(function (e) {
      return '<li><button class="ligne" type="button" data-a="exos-domaine" data-v="' + at(e.action.v) + '"><span class="quoi"><b>' + t(e.action.lib) + '</b><small>' + t(e.titre + " · " + e.catLib.toLowerCase()) + '</small></span><span class="chev" aria-hidden="true">›</span></button></li>';
    }).join("") + '</ul></section>';
  }
  /* Bandeau de la bibliothèque quand le filtre vient d'un constat. */
  function filtreDonneesHTML() {
    var f = ui.filtre;
    if (!ui.filtreDonnees || !f || f.d === "tous" || f.d !== ui.filtreDonnees) return '';
    var d = DOMAINES.filter(function (x) { return x.id === f.d; })[0];
    return '<p class="carte-tb filtre-donnees"><span class="ens-prov">' + t("D'après tes données") + '</span> ' + t("Exercices de " + (d ? d.nom.toLowerCase() : f.d) + ", proposés à partir d'un constat de ton carnet.") +
      ' <button class="lien" type="button" data-a="filtre" data-v="tous">' + t("Voir toute la bibliothèque") + '</button></p>';
  }
