  /* ============================================================
     MES ERREURS RÉCURRENTES (roadmap DATA, P09)
     Sur les parties choisies par les filtres du tableau de bord. Constat chiffré, puis piste à vérifier.
     Classement par fréquence pour 18 trous, jamais en coups perdus ; un club ou un parcours associé n'est pas une cause.
     ============================================================ */
  var PISTES_ERREURS = {
    mej: function (e) { return e.coteDominant ? "Tes départs ratés partent surtout " + (e.coteDominant === "droite" ? "à droite" : "à gauche") + " : l'alignement ou l'orientation de la face à l'impact sont des pistes fréquentes, à vérifier au practice." : "Les ratés partent des deux côtés : un club plus court mais plus régulier au départ des trous serrés est une piste à essayer."; },
    direction: function (e) { return e.coteDominant ? "Tes coups manquent surtout " + (e.coteDominant === "droite" ? "à droite" : "à gauche") + " : regarde dans le profil des clubs lequel le fait le plus, puis vérifie l'alignement au practice." : "Les écarts vont des deux côtés : la régularité du contact est une piste plus probable qu'un défaut d'alignement."; },
    penalites: function () { return "Regarde sur quels trous et avec quel club elles arrivent : viser plus large ou jouer plus court au départ de ces trous est une piste."; },
    gir: function () { return "Un green manqué peut venir du départ, de la distance ou de la direction de l'approche : le profil des clubs et la fiche des parcours aident à trancher."; },
    approche: function () { return "Deux coups ou plus pour rejoindre le green après l'avoir manqué : le petit jeu autour du green est la piste la plus directe."; },
    troisPutts: function () { return "Les trois-putts viennent souvent d'un premier putt long : note la longueur du premier putt (saisie Standard ou Expert, sous les putts) pour le vérifier."; }
  };
  var AIDES_ERREURS = {
    mej: "note la mise en jeu au départ des par 4 et 5 (saisie Standard ou Expert)",
    direction: "touche le côté de l'ellipse quand tu notes un coup (saisie Expert)",
    approche: "joue et note des trous où le green est manqué"
  };
  function nomCleErreur(cle) { var c = cleClubErreur(cle); return c.famille ? c.nom : nomClub(c.id); }
  function nomParcoursErreur(id) { var pc = parcoursDe(id); return pc ? pc.nom : "un parcours supprimé"; }
  function frequenceErreur(e) { return e.n + " fois sur " + e.base + " " + e.baseLib + " (" + e.part + " %)"; }
  function evolutionErreurLib(e) {
    var v = e.evolution; if (!v) return "";
    return "Sur tes " + v.parties + " premières parties : " + v.avant.part + " % (" + v.avant.base + " " + e.baseLib + ") ; sur les " + v.parties + " dernières : " + v.apres.part + " % (" + v.apres.base + ")" +
      (v.sens === "hausse" ? " : plus fréquent." : v.sens === "baisse" ? " : moins fréquent." : " : à peu près stable.");
  }
  function carteErreurHTML(e, rang) {
    var h = '<li class="carte-erreur"><h3>' + rang + ". " + t(e.lib) + (e.deduit ? ' <small class="deduit">' + t("déduit du score") + '</small>' : '') + '</h3>';
    var cotes = e.cotes && (e.cotes.gauche || e.cotes.droite) ? " " + e.cotes.droite + " à droite, " + e.cotes.gauche + " à gauche" + (e.cotes.courtes ? ", " + e.cotes.courtes + " court" + (e.cotes.courtes > 1 ? "s" : "") : "") + "." : "";
    h += '<p class="constat"><b>Constat</b> ' + t(frequenceErreur(e) + ", soit " + nb1(e.par18) + " pour 18 trous." + cotes) + '</p>';
    var assoc = [];
    if (e.clubs.length) assoc.push(e.clubs.slice(0, 2).map(function (c) { return (cleClubErreur(c.cle).famille ? "départs " + ({ Driver: "au driver", Bois: "au bois", Hybride: "à l'hybride", Fer: "au fer" })[nomCleErreur(c.cle)] : "avec le " + nomCleErreur(c.cle).toLowerCase()) + " : " + c.n + " sur " + c.base + " (" + c.part + " %)"; }).join(" ; "));
    if (e.parcours.length > 1) assoc.push(e.parcours.slice(0, 2).map(function (c) { return "à " + nomParcoursErreur(c.cle) + " : " + c.n + " sur " + c.base + " (" + c.part + " %)"; }).join(" ; "));
    if (assoc.length) h += '<p class="constat"><b>Où et avec quoi</b> ' + t(assoc.map(function (x) { return x.charAt(0).toUpperCase() + x.slice(1) + "."; }).join(" ")) + '</p>';
    if (e.evolution) h += '<p class="constat"><b>Évolution</b> ' + t(evolutionErreurLib(e)) + '</p>';
    h += '<p class="hypothese"><b>Piste à vérifier</b> ' + t(PISTES_ERREURS[e.id](e) + " C'est une hypothèse, pas un constat.") + '</p>';
    return h + '</li>';
  }
  function erreursStatsHTML() {
    var F = filtresStats(), l = selectionStats(F), R = erreursRecurrentes(l);
    var h = '<section class="bloc" id="st-erreurs"><h2>Mes erreurs récurrentes</h2><p class="aide">' + t("Sur les parties choisies plus haut. Classées par fréquence pour 18 trous, jamais converties en coups perdus. Un club ou un parcours associé n'est pas une cause.") + '</p>';
    if (!R.trous) return h + etatVideHTML("stats", "Pas encore d'erreurs à analyser", "Enregistre des parties pour voir revenir tes erreurs les plus fréquentes.") + '</section>';
    var parId = {}; R.erreurs.forEach(function (e) { parId[e.id] = e; });
    if (R.top.length) {
      h += '<h3 class="titre-bloc">' + t(R.top.length > 1 ? "Tes " + R.top.length + " erreurs les plus fréquentes" : "Ton erreur la plus fréquente") + '</h3><ol class="erreurs-top">' +
        R.top.map(function (id, i) { return carteErreurHTML(parId[id], i + 1); }).join("") + '</ol>';
    } else {
      h += '<div class="carte-tb insuffisant"><p class="surtitre">' + t("Données insuffisantes") + '</p><p>' + t("Aucune erreur n'est encore assez documentée pour être mise en avant (" + pluriel(R.trous, "trou") + " sur ces parties).") + '</p></div>';
    }
    var manque = R.erreurs.filter(function (e) { return !e.documentee; });
    if (manque.length) h += '<p class="titre-liste">' + t(R.top.length ? "Pas encore jugées :" : "Ce qu'il faut encore noter :") + '</p><ul class="erreurs-manque">' + manque.map(function (e) {
      return '<li><b>' + t(e.lib) + '</b> ' + t(e.manque ? "encore " + e.manque + " " + e.baseLib + "." + (AIDES_ERREURS[e.id] ? " " + AIDES_ERREURS[e.id].charAt(0).toUpperCase() + AIDES_ERREURS[e.id].slice(1) + "." : "") : "moins de " + MIN_OCCURRENCES + " fois sur ces parties : rien à signaler.") + '</li>';
    }).join("") + '</ul>';
    h += '<details class="toutes-erreurs"><summary>' + t("Toutes les erreurs suivies") + '</summary><div class="defile"><table class="carte-score erreurs"><thead><tr><th scope="col">Erreur</th><th scope="col" class="num">Fréquence</th><th scope="col" class="num">Pour 18 trous</th><th scope="col" class="num">Évolution</th></tr></thead><tbody>' +
      R.erreurs.map(function (e) {
        return '<tr><th scope="row">' + t(e.lib) + '<small>' + t(e.deduit ? "déduit du score" : e.documentee ? "documenté" : "peu de données") + '</small></th>' +
          '<td class="num">' + (e.base ? e.part + " %" : "–") + '<small>' + t(e.n + " / " + e.base) + '</small></td>' +
          '<td class="num">' + (e.base ? nb1(e.par18) : "–") + '</td>' +
          '<td class="num">' + (e.evolution ? t(e.evolution.avant.part + " → " + e.evolution.apres.part + " %") + '<small>' + t(e.evolution.sens === "hausse" ? "plus fréquent" : e.evolution.sens === "baisse" ? "moins fréquent" : "stable") + '</small>' : "–") + '</td></tr>';
      }).join("") + '</tbody></table></div><p class="aide">' + t("Fréquence : occurrences sur les occasions (départs, coups ou trous). Évolution : première moitié des parties contre la seconde, s'il y a assez d'occasions dans chacune ; un écart de moins de " + ECART_EVOLUTION + " points est dit stable.") + '</p></details>';
    return h + '</section>';
  }
