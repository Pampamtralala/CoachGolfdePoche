  /* ============================================================
     ANALYSES EN RUBRIQUES (roadmap UX, UX06)
     La longue page de statistiques devient douze rubriques, choisies par des pastilles. Chaque rubrique suit le
     même ordre : résumé, enseignements liés, chiffres et graphiques (blocs existants, calculs inchangés), détail,
     actions. Le filtre commun (UX07) reste en tête et vaut pour toutes.
     ============================================================ */
  var RUBRIQUES_AN = [
    { id: "perf", nom: "Résultats et progression", court: "Résultats" },
    { id: "mej", nom: "Mises en jeu", court: "Départs" },
    { id: "attaque", nom: "Attaque de green", court: "Attaque" },
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
  /* V4-07 : cinq familles. Les rubriques restent les unités de contenu (liens profonds inchangés) ; une famille à
     plusieurs rubriques montre une seconde rangée de pastilles. Clubs → Sac (S05) ; qualité des données → profil (09) :
     en attendant, ces deux rubriques restent joignables par leurs liens, hors familles. */
  var FAMILLES_AN = [
    { id: "resultats", nom: "Résultats et progression", court: "Résultats", rub: ["perf"] },
    { id: "secteurs", nom: "Secteurs de jeu", court: "Secteurs", rub: ["mej", "attaque", "petit", "putting"] },
    { id: "erreurs", nom: "Erreurs et coups perdus", court: "Erreurs", rub: ["erreurs", "sg"] },
    { id: "parcours", nom: "Parcours et trous", court: "Parcours", rub: ["parcours", "trous"] },
    { id: "comprendre", nom: "Comprendre mon jeu", court: "Comprendre", rub: ["comprendre"] }
  ];
  function familleDe(rb) { return FAMILLES_AN.filter(function (f) { return f.rub.indexOf(rb) >= 0; })[0] || null; }
  function pucesHTML(action, l, actif, label, cls) {
    return '<nav class="' + cls + '" aria-label="' + at(label) + '">' + l.map(function (r) {
      var on = r.id === actif;
      return '<button class="puce neutre" type="button" data-a="' + action + '" data-v="' + r.id + '"' + (on ? ' aria-pressed="true" aria-current="true"' : ' aria-pressed="false"') + '>' + t(r.court) + '</button>';
    }).join("") + '</nav>';
  }
  function rubriquesNavHTML(actif) {
    var F = familleDe(actif);
    var h = pucesHTML("famille", FAMILLES_AN, F ? F.id : null, "Familles d'analyse", "familles");
    if (F && F.rub.length > 1) h += pucesHTML("rubrique", RUBRIQUES_AN.filter(function (r) { return F.rub.indexOf(r.id) >= 0; }), actif, F.nom, "rubriques");
    else if (!F) h += pucesHTML("rubrique", RUBRIQUES_AN.filter(function (r) { return r.id === actif; }), actif, "Rubrique", "rubriques");
    return h;
  }
  ACTIONS.famille = function (el) {
    var F = FAMILLES_AN.filter(function (f) { return f.id === el.getAttribute("data-v"); })[0]; if (!F) return;
    var mem = (ui.rubFamille || (ui.rubFamille = {}))[F.id];
    ui.rubrique = mem && F.rub.indexOf(mem) >= 0 ? mem : F.rub[0]; rendre();
    var b = app.querySelector('.familles [data-v="' + F.id + '"]'); if (b) b.focus({ preventScroll: true });
  };
  /* Enseignements (UX05) qui concernent la rubrique, calculés sur toutes les parties comme sur Mon jeu. */
  var ENS_RUBRIQUE = { perf: /^(score-|record-)/, mej: /^(mej-|cote-mej|top-mej)/, attaque: /^top-gir/, petit: /^top-approche/, putting: /^(troisPutts-|putts-|top-troisPutts)/,
    erreurs: /^(cote-|top-|penalites-)/, sg: /^secteur/, parcours: /^parcours/, trous: /^trou/, clubs: /^(club|cote-direction)/, qualite: /^donnees-/ };
  /* V4-07 : dans une rubrique, les enseignements liés sont listés en une ligne chacun (constat court) ; le détail
     complet est dans la famille « Comprendre mon jeu » et dans la fiche. */
  function ligneEnsHTML(e) {
    var cible = e.lien ? 'data-a="' + e.lien.a + '"' + (e.lien.v ? ' data-v="' + at(e.lien.v) + '"' : '') + (e.lien.s ? ' data-s="' + at(e.lien.s) + '"' : '') : 'data-a="ens-ouvrir"';
    return '<li class="cat-' + e.cat + '"><button class="ligne" type="button" ' + cible + '><span class="quoi"><small>' + t(e.catLib) + ' · ' + t(PROVENANCE_ENS[e.provenance] || e.provenance) + '</small><b>' + t(e.titre) + '</b></span><span class="chev" aria-hidden="true">›</span></button></li>';
  }
  function ensRubriqueHTML(rb) {
    var re = ENS_RUBRIQUE[rb]; if (!re || !etat.parties.length) return '';
    var l = calculEns().liste.filter(function (e) { return re.test(e.id); });
    return l.length ? '<div class="rb-ens"><h3 class="titre-bloc">' + t("Ce que disent tes données") + '</h3><ul class="liste-exos rb-ens-liste">' + l.map(ligneEnsHTML).join("") + '</ul></div>' : '';
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
      if (rb === "perf") return tete + sansPartie + '<div class="colonnes"><div class="col">' + B.palier + B.prios + B.carte + B.pal + '</div><div class="col">' + B.notes + B.rep + '</div></div>' + liensResultatsHTML();
      if (rb === "erreurs") return tete + sansPartie + B.evit + B.def;
      if (rb === "sg") return tete + sansPartie + B.sg;
      if (rb === "putting") return tete + sansPartie + B.rel;
      return tete + sansPartie;
    }
    if (rb === "perf") return tete + '</section>' + '<section class="bloc" id="st-tableau">' + tableauStatsHTML("contenu") + '</section>' +
      '<div class="colonnes"><div class="col">' + B.palier + B.prios + B.carte + B.pal + '</div><div class="col">' + B.notes + B.rep + '</div></div>' + liensResultatsHTML();
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
    /* V4-07 : Comprendre mon jeu = enseignements (toutes les parties) + questions (filtre commun), fusionnés. */
    var Re = etat.parties.length ? calculEns() : { liste: [] };
    var ens = Re.liste.length ? '<h3 class="titre-bloc">' + t("Ce que disent tes données") + '</h3><ul class="liste-exos rb-ens-liste">' + Re.liste.slice(0, 5).map(ligneEnsHTML).join("") + '</ul>' +
        '<div class="ligne-btn"><button class="btn" type="button" data-a="ens-ouvrir">' + t("Tous les enseignements (" + Re.liste.length + ")") + '</button></div>'
      : '<p class="aide">' + t(etat.parties.length ? "Rien de net pour l'instant : les enseignements apparaissent quand un écart dépasse les seuils prévus." : "Les enseignements apparaîtront après tes premières parties.") + '</p>';
    return tete + ens + '<h3 class="titre-bloc">' + t("Pose une question") + '</h3><ul class="liste-exos">' +
      QUESTIONS_ANALYSTE.map(function (q) { return '<li><button class="ligne" type="button" data-a="an-ouvrir" data-v="' + q.id + '"><span class="quoi"><b>' + t(q.q) + '</b></span><span class="chev" aria-hidden="true">›</span></button></li>'; }).join("") +
      '</ul>' + aideHTML('<p>' + t("Enseignements : tirés de toutes tes parties par des règles fixes, sans IA ; une association n'est pas une cause. Questions : réponses chiffrées avec leur période et leur effectif, sur la période du filtre commun.") + '</p>', "D'où viennent ces réponses ?") + '</section>';
  }
  /* Liens de fin de « Résultats » : rapports, statistiques par club (bientôt dans Sac, S05), qualité des données. */
  function liensResultatsHTML() {
    return '<section class="bloc rb-liens"><ul class="liste-exos">' +
      [["j-ouvrir", "", "", "Bilans, journal et rapports"], ["rubrique", "clubs", "", "Statistiques par club"], ["rubrique", "qualite", "", "Qualité de mes données"]].map(function (x) {
        return '<li><button class="ligne" type="button" data-a="' + x[0] + '"' + (x[1] ? ' data-v="' + x[1] + '"' : '') + '><span class="quoi"><b>' + t(x[3]) + '</b></span><span class="chev" aria-hidden="true">›</span></button></li>';
      }).join("") + '</ul></section>';
  }
  ACTIONS.rubrique = function (el) { ui.rubrique = el.getAttribute("data-v"); var Fr = familleDe(ui.rubrique); if (Fr) (ui.rubFamille || (ui.rubFamille = {}))[Fr.id] = ui.rubrique; rendre(); var b = app.querySelector('.rubriques [data-v="' + ui.rubrique + '"]'); if (b) { b.focus({ preventScroll: true }); if (b.scrollIntoView) b.scrollIntoView({ block: "nearest", inline: "center" }); } };
