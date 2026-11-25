  /* ============================================================
     ANALYSES EN RUBRIQUES (roadmap UX, UX06)
     La longue page de statistiques devient douze rubriques, choisies par des pastilles. Chaque rubrique suit le
     même ordre : résumé, enseignements liés, chiffres et graphiques (blocs existants, calculs inchangés), détail,
     actions. Le filtre commun (UX07) reste en tête et vaut pour toutes.
     ============================================================ */
  var RUBRIQUES_AN = [
    { id: "perf", nom: "Performance générale", court: "Performance" },
    { id: "mej", nom: "Mises en jeu", court: "Mises en jeu" },
    { id: "attaque", nom: "Attaque de green", court: "Attaque de green" },
    { id: "petit", nom: "Petit jeu", court: "Petit jeu" },
    { id: "putting", nom: "Putting", court: "Putting" },
    { id: "erreurs", nom: "Erreurs récurrentes", court: "Erreurs" },
    { id: "sg", nom: "Coups perdus estimés", court: "Coups perdus" },
    { id: "parcours", nom: "Analyse des parcours", court: "Parcours" },
    { id: "trous", nom: "Analyse des trous", court: "Trous" },
    { id: "clubs", nom: "Comparaison des clubs", court: "Clubs" },
    { id: "qualite", nom: "Qualité des données", court: "Qualité" },
    { id: "comprendre", nom: "Comprendre mon jeu", court: "Comprendre" }
  ];
  /* Sections d'avant (liens, recherche, cartes de Mon jeu) → rubrique qui les contient désormais. */
  var SECTION_RUBRIQUE = { "st-putting": "putting", releves: "putting", "st-erreurs": "erreurs", evitables: "erreurs", defauts: "erreurs",
    "st-clubs": "clubs", "qualite-donnees": "qualite", sg: "sg", notes: "perf", carte: "perf", priorites: "perf", palier: "perf", reperes: "perf",
    "rb-perf": "perf", "rb-mej": "mej", "rb-attaque": "attaque", "rb-petit": "petit", "rb-parcours": "parcours", "rb-trous": "trous", "rb-comprendre": "comprendre" };
  function rubriqueDeSection(s) { return SECTION_RUBRIQUE[s] || null; }
  function rubriqueCourante() { var r = ui.rubrique; return RUBRIQUES_AN.some(function (x) { return x.id === r; }) ? r : "perf"; }
  function rubriquesNavHTML(actif) {
    return '<nav class="rubriques" aria-label="Rubriques d\'analyse">' + RUBRIQUES_AN.map(function (r) {
      var on = r.id === actif;
      return '<button class="puce neutre" type="button" data-a="rubrique" data-v="' + r.id + '"' + (on ? ' aria-pressed="true" aria-current="true"' : ' aria-pressed="false"') + '>' + t(r.court) + '</button>';
    }).join("") + '</nav>';
  }
  /* Enseignements (UX05) qui concernent la rubrique, calculés sur toutes les parties comme sur Mon jeu. */
  var ENS_RUBRIQUE = { perf: /^(score-|record-)/, mej: /^(mej-|cote-mej|top-mej)/, attaque: /^top-gir/, petit: /^top-approche/, putting: /^(troisPutts-|putts-|top-troisPutts)/,
    erreurs: /^(cote-|top-|penalites-)/, sg: /^secteur/, parcours: /^parcours/, trous: /^trou/, clubs: /^(club|cote-direction)/, qualite: /^donnees-/ };
  function ensRubriqueHTML(rb) {
    var re = ENS_RUBRIQUE[rb]; if (!re || !etat.parties.length) return '';
    var l = calculEns().liste.filter(function (e) { return re.test(e.id); });
    return l.length ? '<div class="rb-ens"><h3 class="titre-bloc">' + t(l.length > 1 ? "Ce que disent tes données" : "Ce que disent tes données") + '</h3>' + l.map(carteEnsHTML).join("") + '</div>' : '';
  }
  /* Une réponse de Comprendre mon jeu, affichée dans la rubrique (sur le filtre commun). */
  function reponseRubriqueHTML(id) {
    var R = repondre(id, partiesFiltrees(), ctxAnalyste());
    return R ? '<div class="rb-reponse"><h3 class="titre-bloc">' + t(R.question) + '</h3>' + reponseHTML(R).replace('id="an-rep-', 'id="rb-rep-') + '</div>' : '';
  }
  function actionExosHTML(dom, lib) { return '<div class="ligne-btn rb-actions"><button class="btn" type="button" data-a="exos-domaine" data-v="' + dom + '">' + t(lib) + '</button></div>'; }
  function secteurEstimeHTML(id) {
    var l = partiesFiltrees(), r = l.length ? coupsGagnes(l, indexVise()) : null, s = r ? r.secteurs.filter(function (x) { return x.id === id; })[0] : null;
    if (!s) return '';
    return '<p class="aide rb-secteur"><span class="ens-prov">Estimé</span> ' + t(s.sg == null ? s.nom + " : non mesuré avec les données saisies." : s.nom + " : " + nbStat(s.sg, true) + " coup par partie face à un joueur d'index " + r.cible + " (estimation, pas du Strokes Gained).") + '</p>';
  }
  function ligneErreurHTML(R, id) {
    var e = R.erreurs.filter(function (x) { return x.id === id; })[0];
    if (!e) return '';
    return '<li><b>' + t(e.lib) + '</b> ' + t(e.base ? e.n + " sur " + e.base + " " + e.baseLib + " (" + e.part + " %), " + nb1(e.par18) + " par 18 trous" + (e.deduit ? ", déduit du score et des putts" : "") + (e.documentee ? "." : " ; encore peu de données.") : "aucune donnée pour l'instant.") + '</li>';
  }
  /* Résumé d'une ligne, tiré du tableau des statistiques sur le filtre commun. */
  function resumeRubrique(rb, A, l) {
    if (!A.parties) return "";
    if (rb === "perf") return A.ecart18 == null ? "Pas encore de partie complète pour le score." : "Score : " + nbStat(A.ecart18, true) + " ramené à 18 trous.";
    if (rb === "mej") return A.mej.n ? A.mej.part + " % de mises en jeu jouables sur " + A.mej.n + " renseignées." : "Aucune mise en jeu renseignée : passe en saisie Standard ou Expert.";
    if (rb === "attaque") return nbStat(A.gir18) + " greens en régulation par 18 trous (" + A.partGir + " % des trous), déduits du score et des putts.";
    if (rb === "petit") { var c = cumulParties(l, 1e9); return c.MN ? "Pars sauvés après un green manqué : " + Math.round(100 * c.SV / c.MN) + " % (" + c.MN + " greens manqués)." : "Pas encore de green manqué à analyser."; }
    if (rb === "putting") return nbStat(A.putts18) + " putts et " + nbStat(A.troisPutts18) + " trois-putts par 18 trous.";
    if (rb === "erreurs") { var R = erreursRecurrentes(l), top = R.top.length ? R.erreurs.filter(function (e) { return e.id === R.top[0]; })[0] : null; return top ? "Erreur la plus fréquente : " + top.lib.toLowerCase() + "." : "Aucune erreur encore assez documentée."; }
    if (rb === "sg") return "Estimation par secteur face à un joueur d'index " + indexVise() + ".";
    if (rb === "parcours") return pluriel(etat.parcours.length, "parcours") + " enregistré" + (etat.parcours.length > 1 ? "s" : "") + ".";
    if (rb === "trous") return "Les trous joués au moins 3 fois sur ton parcours le plus joué.";
    if (rb === "clubs") return "Régularité, direction et distance de chaque club noté.";
    if (rb === "qualite") return "Provenance de tes données : mesurées, estimées, déclarées ou inconnues.";
    return "";
  }
  /* Contenu d'une rubrique. B : les blocs déjà calculés par la page (palier, plis). */
  function rubriqueHTML(rb, B) {
    var R0 = RUBRIQUES_AN.filter(function (x) { return x.id === rb; })[0], l = partiesFiltrees(), A = tableauStats(l);
    var tete = '<section class="bloc rb-tete" id="rb-' + rb + '"><h2>' + t(R0.nom) + '</h2>' + (resumeRubrique(rb, A, l) ? '<p class="chapo rb-resume">' + t(resumeRubrique(rb, A, l)) + '</p>' : '') + ensRubriqueHTML(rb);
    var vide = !A.parties && rb !== "comprendre" && rb !== "qualite" && rb !== "parcours";
    /* Sans partie dans le filtre : les blocs tirés du profil déclaré restent (palier, carte, défauts, objectif). */
    if (vide) {
      var sansPartie = '<p class="aide">' + t(etat.parties.length ? "Aucune partie dans cette période : élargis-la (« Toutes »)." : "Pas encore de partie : les chiffres de cette rubrique apparaîtront après ta première partie.") + '</p></section>';
      if (rb === "perf") return tete + sansPartie + B.palier + '<div class="colonnes"><div class="col">' + B.prios + B.carte + B.pal + '</div><div class="col">' + B.notes + B.rep + '</div></div>';
      if (rb === "erreurs") return tete + sansPartie + B.evit + B.def;
      if (rb === "sg") return tete + sansPartie + B.sg;
      if (rb === "putting") return tete + sansPartie + B.rel;
      return tete + sansPartie;
    }
    if (rb === "perf") return tete + '</section>' + '<section class="bloc" id="st-tableau">' + tableauStatsHTML("contenu") + '</section>' + B.palier +
      '<div class="colonnes"><div class="col">' + B.prios + B.carte + B.pal + '</div><div class="col">' + B.notes + B.rep + '</div></div>' +
      '<section class="bloc"><div class="ligne-btn"><button class="btn" type="button" data-a="j-ouvrir">Bilans, journal et rapports</button></div></section>';
    if (rb === "mej") return tete + repartitionsStatsHTML(l, A) + reponseRubriqueHTML("mej") + reponseRubriqueHTML("cotes") + secteurEstimeHTML("depart") + actionExosHTML("drive", "Exercices : mise en jeu") + '</section>';
    if (rb === "attaque") { var Ra = erreursRecurrentes(l); return tete + '<ul class="constats">' + ligneErreurHTML(Ra, "gir") + ligneErreurHTML(Ra, "direction") + '</ul>' + secteurEstimeHTML("attaque") + actionExosHTML("fers", "Exercices : jeu de fers") + '</section>'; }
    if (rb === "petit") { var Rp = erreursRecurrentes(l); return tete + '<ul class="constats">' + ligneErreurHTML(Rp, "approche") + '</ul>' + secteurEstimeHTML("petit") + actionExosHTML("approche", "Exercices : approches") + '</section>'; }
    if (rb === "putting") return tete + reponseRubriqueHTML("putts") + reponseRubriqueHTML("troisPutts") + '</section>' + puttingStatsHTML() + B.rel + actionExosHTML("putt_long", "Exercices : putting long");
    if (rb === "erreurs") return tete + '</section>' + erreursStatsHTML() + B.evit + B.def;
    if (rb === "sg") return tete + reponseRubriqueHTML("secteur") + '</section>' + B.sg;
    if (rb === "parcours") return tete + (etat.parcours.length ? reponseRubriqueHTML("parcours") : '<p class="aide">' + t("Aucun parcours enregistré : choisis ou ajoute un parcours au début d'une partie.") + '</p>') + '</section>' + parcoursListeHTML();
    if (rb === "trous") return tete + reponseRubriqueHTML("trous") + (etat.parcours.length ? '<h3 class="titre-bloc">' + t("Trou par trou") + '</h3><ul class="liste-exos">' + etat.parcours.map(function (pc) {
      return '<li><button class="ligne" type="button" data-a="pc-ouvrir" data-id="' + pc.id + '"><span class="quoi"><b>' + t(pc.nom) + '</b><small>' + t("Score moyen et passages de chaque trou") + '</small></span><span class="chev" aria-hidden="true">›</span></button></li>';
    }).join("") + '</ul>' : '') + '</section>';
    if (rb === "clubs") return tete + '</section>' + clubsStatsHTML();
    if (rb === "qualite") return tete + '<div class="ligne-btn"><button class="btn" type="button" data-a="md-ouvrir">Mes données : vérifier, corriger, sauvegarder</button></div></section>' + qualiteGolfHTML();
    /* Comprendre mon jeu : les douze questions, ouvertes dans la fiche (période : filtre commun). */
    return tete + '<p class="aide">' + t("Des réponses chiffrées, avec leur période et leur effectif, calculées sur la même période que les autres rubriques.") + '</p><ul class="liste-exos">' +
      QUESTIONS_ANALYSTE.map(function (q) { return '<li><button class="ligne" type="button" data-a="an-ouvrir" data-v="' + q.id + '"><span class="quoi"><b>' + t(q.q) + '</b></span><span class="chev" aria-hidden="true">›</span></button></li>'; }).join("") +
      '</ul><div class="ligne-btn"><button class="btn" type="button" data-a="ens-ouvrir">Tous les enseignements</button></div></section>';
  }
  ACTIONS.rubrique = function (el) { ui.rubrique = el.getAttribute("data-v"); rendre(); var b = app.querySelector('.rubriques [data-v="' + ui.rubrique + '"]'); if (b) { b.focus({ preventScroll: true }); if (b.scrollIntoView) b.scrollIntoView({ block: "nearest", inline: "center" }); } };
