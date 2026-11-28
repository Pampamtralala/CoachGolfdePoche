  /* ============================================================
     MON SAC, CÔTÉ DONNÉES (roadmap UX, UX08)
     Synthèse des clubs en tableau (distance typique observée, fourchette, nombre de mesures par provenance,
     écarts anormaux, clubs peu documentés), onglet Distances de Sac (V4-S02) ; fiche de club
     ouverte par un chiffre-clé de synthèse. Aucune distance estimée n'entre dans ces chiffres.
     ============================================================ */
  var MIN_MESURES_SAC = 3;
  /* V4 S01 : un club, trois sources séparées. Observées : coups réels du parcours. Référence : distance saisie.
     Héritées : anciennes saisies et séries mêlées (hors moyennes). */
  function mesuresClubParSource(id) {
    var obs = mesuresObservees()[id] || [], her = etat.carnet.clubs[id] || [], ref = referencesClubs()[id];
    return { observees: obs, heritees: her, reference: ref != null ? ref : null, n: obs.length };
  }
  /* Note courte d'un écart anormal, pour le tableau (la phrase complète est dans la fiche du club). */
  function noteEcartSac(x, id) {
    var autre = x.a.id === id ? x.b : x.a, nomA = nomCourt(CLUB[autre.id] || { nom: autre.nom || "" }).toLowerCase();
    return x.type === "trou" ? "Trou de " + x.ecart + " m avec le " + nomA : x.type === "doublon" ? "Seulement " + x.ecart + " m avec le " + nomA : "Ordre à vérifier avec le " + nomA;
  }
  /* V4-S03 : graphique d'étagement. Une ligne par club (putter hors étagement), cliquable vers sa fiche :
     ● distance typique et ━ fourchette des coups joués (fourchette seulement à partir de 3 coups) ;
     ○ un ou deux coups seulement ; ◇ distance de référence ; ◌ valeur héritée ; « — » si rien n'est connu. */
  function ligneEtagement(id, an) {
    var c = CLUB[id], M = mesuresClubParSource(id), st = statsClub(M.observees), fo = M.n >= MIN_OBS_DISTANCE ? fourchette(M.observees) : null, sh = statsClub(M.heritees), al = alertesDe(an, id);
    var k = st && fo ? "obs" : st ? "peu" : M.reference != null ? "ref" : sh ? "herit" : "vide";
    var v = k === "obs" || k === "peu" ? st.moy : k === "ref" ? M.reference : k === "herit" ? sh.moy : null;
    var lib = v == null ? "—" : k === "ref" ? "réf. " + v + " m" : k === "herit" ? v + " m hérité" : v + " m";
    /* Note seulement quand elle apprend quelque chose : écart anormal, ou un ou deux coups seulement. */
    var note = al.length ? noteEcartSac(al[0], id) : k === "peu" ? "Peu de coups (" + M.n + "/" + MIN_OBS_DISTANCE + ")" : "";
    var dit = nomCourt(c) + " : " + (v == null ? "distance inconnue" : lib) + (fo && fo.bas !== fo.haut ? ", habituellement " + fo.bas + " à " + fo.haut + " m" : "") + ", " + pluriel(M.n, "coup") + " joué" + (M.n > 1 ? "s" : "") + (note ? ". " + note : "") + ". Ouvrir la fiche";
    return { id: id, k: k, v: v, fo: fo, lib: lib, note: note, alerte: !!al.length, dit: dit, n: M.n };
  }
  function nomEtagement(c) { return c.fam === "w" ? courtSac(c) : nomCourt(c); }
  function syntheseSacHTML() {
    var ids = sacActuel().filter(function (id) { return id !== "putter"; }), an = analyseSac();
    if (!ids.length) return '';
    var L = ids.map(function (id) { return ligneEtagement(id, an); });
    var haut = Math.max.apply(null, [150].concat(L.map(function (x) { return x.fo ? x.fo.haut : x.v || 0; }))), max = Math.ceil(haut / 50) * 50;
    function X(m) { return (100 * m / max).toFixed(1) + "%"; }
    var graduations = []; for (var g = 0; g <= max; g += 50) graduations.push(g);
    var rangs = L.map(function (x) {
      var piste = (x.fo && x.fo.bas !== x.fo.haut ? '<span class="eta-plage" style="left:' + X(x.fo.bas) + ';width:' + (100 * (x.fo.haut - x.fo.bas) / max).toFixed(1) + '%"></span>' : '') +
        (x.v != null ? '<span class="eta-point k-' + x.k + '" style="left:' + X(x.v) + '"></span>' : '');
      return '<li class="eta-' + x.k + (x.alerte ? ' alerte' : '') + '"><button class="eta-ligne" type="button" data-a="sac-fiche-club" data-id="' + x.id + '" aria-label="' + at(x.dit) + '">' +
        '<span class="eta-nom">' + t(nomEtagement(CLUB[x.id])) + (x.note ? '<small>' + t(x.note) + '</small>' : '') + '</span>' +
        '<span class="eta-piste" aria-hidden="true">' + piste + '</span><span class="eta-val">' + t(x.lib) + '</span></button></li>';
    }).join("");
    return '<section class="bloc" id="c-synthese">' + sectionTeteHTML("Étalonnage", { aide: '<p>' + t("Distances des coups joués sur le parcours, jamais estimées : le point est la distance typique, la barre la fourchette habituelle (à partir de " + MIN_OBS_DISTANCE + " coups). Un point creux signale un ou deux coups seulement ; un losange, ta distance de référence ; un cercle pointillé, une ancienne mesure héritée — ni l'une ni l'autre n'entre dans les moyennes. Le putter est hors étagement.") + '</p>', aideTitre: "Lire ce graphique" }) +
      '<ol class="etagement">' + rangs + '</ol>' +
      '<div class="eta-ligne eta-axe" aria-hidden="true"><span></span><span class="eta-axe-piste">' + graduations.map(function (g) { return '<span style="left:' + X(g) + '">' + g + '</span>'; }).join("") + '</span><span>m</span></div>' +
      '<p class="eta-legende" aria-hidden="true"><span class="eta-point k-obs"></span>' + t("Distance typique") + '<span class="eta-plage-leg"></span>' + t("Fourchette") + '<span class="eta-point k-ref"></span>' + t("Référence") + '</p></section>';
  }
  /* Points de vigilance : seulement les écarts anormaux (trou, redondance, ordre), chacun vers la fiche du club ;
     le putter (hors étagement) ; tous les écarts restent consultables, repliés. */
  function vigilanceSacHTML() {
    var an = analyseSac(), L = an.alertes.map(function (x) {
      var lib = x.type === "trou" ? "Écart de " + x.ecart + " m" : x.type === "doublon" ? "Seulement " + x.ecart + " m d'écart" : "Ordre de distance inversé";
      return '<li><button class="ligne" type="button" data-a="sac-fiche-club" data-id="' + x.b.id + '"><span class="quoi"><b>' + t(nomCourt(x.a) + " / " + nomCourt(x.b)) + '</b><small>' + t(lib) + '</small></span><span class="chev" aria-hidden="true">›</span></button></li>';
    });
    L.push('<li><button class="ligne" type="button" data-a="sac-fiche-club" data-id="putter"><span class="quoi"><b>Putter</b><small>' + t("Voir sa fiche") + '</small></span><span class="chev" aria-hidden="true">›</span></button></li>');
    return '<section class="bloc" id="c-distances"><h2>' + t("Points de vigilance") + '</h2>' +
      (an.alertes.length ? '' : '<p class="aide">' + t(an.paires.length ? "Aucun écart anormal entre tes clubs connus." : "Il faut au moins deux clubs voisins connus pour vérifier leurs écarts.") + '</p>') +
      '<ul class="liste-exos">' + L.join("") + '</ul>' + sacHTML() + '</section>';
  }

  /* En tête de la fiche d'un club : ce que disent ses données, par provenance. */
  function ficheClubSyntheseHTML(id) {
    var M = mesuresClubParSource(id), st = statsClub(M.observees), fo = M.n >= MIN_OBS_DISTANCE ? fourchette(M.observees) : null, sh = statsClub(M.heritees);
    var P = profilClub(partiesAnalyse(), id), D = P.distance, dir = P.direction, cases = [];
    cases.push({ t: "Distance observée", v: st ? st.moy + " m" : "–", x: st ? pluriel(M.n, "coup") + " sur le parcours" + (D && D.gps ? ", dont " + D.gps + " au GPS" : "") + (fo && fo.bas !== fo.haut ? ", habituellement " + fo.bas + " à " + fo.haut + " m" : "") : "Aucun coup mesuré sur le parcours.", prov: st ? "Observé" : "Inconnu" });
    cases.push({ t: "Référence", v: M.reference != null ? M.reference + " m" : "–", x: M.reference != null ? "saisie par toi, pour choisir ton club" : "facultative, à saisir plus bas", prov: "Référence" });
    if (sh) cases.push({ t: "Mesures héritées", v: sh.moy + " m", x: pluriel(M.heritees.length, "mesure") + " ancienne" + (M.heritees.length > 1 ? "s" : "") + ", hors moyennes", prov: "Héritée" });
    if (dir && dir.n) cases.push({ t: "Direction", v: dir.partCentre + " % dans l'axe", x: dir.partGauche + " % à gauche · " + dir.partDroite + " % à droite, sur " + pluriel(dir.n, "coup"), prov: "Observé" });
    var h = '<div class="fiche-club-synthese">' + kpisHTML(cases.map(function (c) { return { t: c.t, v: c.v, ctx: c.x, prov: c.prov }; }));
    return h + '</div>';
  }
  /* ============================================================
     V4-S04 : FICHE INDIVIDUELLE D'UN CLUB — une page de Sac (plus une fiche par-dessus l'écran).
     Consultation seulement : distance observée, direction en trois catégories, arrivées connues, utilisation,
     tendance, historique, provenance au détail. Réglages (référence, loft, mesures héritées) derrière l'icône.
     Toutes les parties ; navigation entre clubs du sac.
     ============================================================ */
  function clubsNavigables() { return sacActuel().concat(["putter"]); }
  function ouvrirClubPage(id) {
    ui.sacClub = id; ui.sacSel = id; ui.club = id; if (ui.feuille) { ui.feuille = null; ui.pile = []; rendreFeuille(); }
    if (ui.onglet !== "sac") { allerOnglet("sac", true); ui.sacClub = id; }
    rendre(); window.scrollTo(0, 0); var h = document.querySelector("#club-page h1"); if (h) { h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); }
  }
  ACTIONS["sac-fiche-club"] = function (el) { var id = el.getAttribute("data-id"); if (!CLUB[id] && id !== "putter") return; ouvrirClubPage(id); };
  ACTIONS["club-retour"] = function () {
    var id = ui.sacClub; ui.sacClub = null; rendre();
    var b = document.querySelector('#vue [data-a="sac-fiche-club"][data-id="' + id + '"]'); if (b) { b.scrollIntoView({ block: "center" }); b.focus({ preventScroll: true }); }
  };
  ACTIONS["club-reglages"] = function (el) { ouvrirSac({ sac: ui.sacClub }, el); };
  ACTIONS["club-comparer"] = function () {
    var F = filtresStats(); F.club = ui.sacClub; F.club2 = ""; F.derniers = 0; F.format = ""; F.parcours = ""; F.debut = ""; F.fin = "";
    ui.sacClub = null; ui.sacOnglet = "performance"; rendre();
    var s = document.getElementById("st-club2"); if (s) { s.scrollIntoView({ block: "center" }); s.focus({ preventScroll: true }); }
  };
  function ligneClubPage(lib, html, cls) { return '<li' + (cls ? ' class="' + cls + '"' : '') + '><span>' + t(lib) + '</span><span>' + html + '</span></li>'; }
  function ficheClubPageHTML(id) {
    var ids = clubsNavigables(), i = ids.indexOf(id), av = i > 0 ? ids[i - 1] : null, ap = i >= 0 && i < ids.length - 1 ? ids[i + 1] : null;
    var nom = id === "putter" ? "Putter" : nomLoft(CLUB[id]);
    function nomNav(x) { return x === "putter" ? "Putter" : nomEtagement(CLUB[x]); }
    var h = '<div id="club-page"><section class="bloc premier club-page"><div class="titre-ligne club-nav">' +
      '<button class="lien retour" type="button" data-a="club-retour">' + icone("retour") + ' Sac</button>' +
      (id !== "putter" ? '<button class="icone-btn" type="button" data-a="club-reglages" aria-label="' + at("Réglages de " + nom + " : référence, loft, mesures héritées") + '">' + icone("reglages") + '</button>' : '') + '</div>';
    if (id === "putter") {
      var A = tableauStats(partiesAnalyse());
      h += '<h1>Putter</h1><p class="page-sous">' + t("Hors étagement des distances : le putter se suit avec tes statistiques de putting.") + '</p></section>' +
        '<section class="bloc">' + kpisHTML([
          { t: "Putts", v: nbStat(A.putts18), u: "par 18 trous", n: A.parties ? pluriel(A.parties, "partie") : "" },
          { t: "Trois-putts", v: nbStat(A.troisPutts18), u: "par 18 trous" }]) +
        '<div class="ligne-btn"><button class="btn" type="button" data-a="aller-a" data-v="bilan" data-s="st-putting">Voir mon putting</button></div>' +
        '<p class="aide">' + t("Les putts ne sont pas reliés à un modèle de putter : aucune statistique n'est attribuée au club lui-même.") + '</p></section>';
      return h + navClubsHTML(av, ap, nomNav) + '</div>';
    }
    var P = profilClub(partiesAnalyse(), id), M = mesuresClubParSource(id), st = statsClub(M.observees), fo = M.n >= MIN_OBS_DISTANCE ? fourchette(M.observees) : null, sh = statsClub(M.heritees);
    var D = P.direction, Ar = P.arrivees, T = P.tendance, Dist = P.distance;
    h += '<h1>' + t(nom) + '</h1><p class="page-sous">' + t(P.n ? pluriel(P.n, "coup") + " enregistré" + (P.n > 1 ? "s" : "") + " · " + pluriel(P.parties, "partie") : "Aucun coup enregistré avec ce club") + '</p>';
    /* Distance : observée en grand ; sinon la référence ou l'héritée, marquées, en petit. */
    h += '<div class="club-distance"><p class="mj-val main">' + t(st ? st.moy + " m" : "–") + '</p><p class="aide">' + t(st
        ? (fo && fo.bas !== fo.haut ? fo.bas + "–" + fo.haut + " m · " : "") + pluriel(M.n, "mesure") + " sur le parcours" + (Dist.gps ? ", dont " + Dist.gps + " au GPS" : "") + (M.n < MIN_OBS_DISTANCE ? " · peu de coups" : "")
        : "Aucune distance mesurée sur le parcours" + (M.reference != null ? " · référence " + M.reference + " m" : sh ? " · " + sh.moy + " m hérité" : "")) + '</p></div></section>';
    /* Direction en trois catégories : jamais de dispersion métrique dessinée ici. */
    h += '<section class="bloc club-direction">' + sectionTeteHTML("Direction des coups", { aide: '<p>' + t("Gauche ou droite : à plus de " + SEUIL_LATERAL + " m de la ligne de visée, d'après le côté noté pour chaque coup. Trois catégories seulement, pas une mesure de dispersion.") + '</p>' }) +
      (D.n ? '<div class="club-dir3">' + [["Gauche", D.partGauche], ["Axe", D.partCentre], ["Droite", D.partDroite]].map(function (x) {
        return '<div class="' + (x[0] === "Axe" ? "axe" : "") + '"><span class="main">' + x[1] + ' %</span><span>' + x[0] + '</span></div>'; }).join("") + '</div>' +
        '<p class="aide">' + t(pluriel(D.n, "direction") + " renseignée" + (D.n > 1 ? "s" : "") + (P.n > D.n ? " · " + (P.n - D.n) + " sans direction" : "")) + '</p>'
      : '<p class="aide">' + t("Aucune direction notée : touche le côté de l'ellipse quand tu notes un coup.") + '</p>') + '</section>';
    h += '<section class="bloc">' + kpisHTML([
      { t: "Arrivées en jeu", v: Ar.partEnJeu == null ? "–" : Ar.partEnJeu + " %", u: Ar.n ? pluriel(Ar.n, "arrivée") + " connue" + (Ar.n > 1 ? "s" : "") : "aucune arrivée connue" },
      { t: "Utilisation", v: P.parties ? String(Math.round(10 * P.n / P.parties) / 10).replace(".", ",") : "–", u: "coups par partie où il sert" },
      P.departs.departs ? { t: "Départs jouables", v: P.departs.part == null ? "–" : P.departs.part + " %", u: pluriel(P.departs.n, "départ") + " renseigné" + (P.departs.n > 1 ? "s" : "") } : null
    ]) + (T ? '<p class="aide club-tendance">' + t("Évolution, des " + T.n + " coups les plus anciens aux " + T.n + " plus récents : " + [T.axe ? "dans l'axe " + T.axe.avant + " % → " + T.axe.apres + " %" : "", T.enJeu ? "en jeu " + T.enJeu.avant + " % → " + T.enJeu.apres + " %" : ""].filter(Boolean).join(" ; ") + ".") + '</p>'
      : '<p class="aide club-tendance">' + t("Évolution : à partir de " + MIN_TENDANCE + " coups notés avec ce club.") + '</p>') + '</section>';
    /* Historique, comparaison, provenance : au détail. */
    var coups = coupsDuClub(partiesAnalyse(), id).slice(-30).reverse();
    var hist = coups.length ? '<ul class="club-hist">' + coups.map(function (x) {
        var c = x.coup, d = estNombre(c.d) ? (c.dm ? "≈ " : "") + c.d + " m" + (c.dm ? " (estimée)" : c.gps ? " (GPS)" : "") : "distance non notée";
        var dir = x.lateral == null ? "" : x.lateral < -SEUIL_LATERAL ? " · à gauche" : x.lateral > SEUIL_LATERAL ? " · à droite" : " · dans l'axe";
        return '<li><span>' + t((x.jour ? dateCourte(x.jour) : "") + " · trou " + (x.trou + 1)) + '</span><span>' + t(d + dir) + '</span></li>';
      }).join("") + '</ul>' + (P.n > 30 ? '<p class="aide">' + t("Les 30 coups les plus récents sur " + P.n + ".") + '</p>' : '') : '<p class="aide">' + t("Aucun coup noté avec ce club.") + '</p>';
    /* Dispersion en mètres, repliée : l'ellipse seulement quand des écarts latéraux ont vraiment été notés et que les
       distances sont observées (≥ 3 coups) — jamais une largeur estimée d'après l'index ; à défaut, le nuage des
       distances observées (≥ 3). */
    var E = ellipseDe(id), disp = (E && !E.estimation && !E.estimeeL && M.n >= MIN_OBS_DISTANCE ? ellipseClubHTML(id) : "") || dispersionClubHTML(M.observees);
    h += '<section class="bloc club-details"><ul class="liste-exos">' +
      (disp ? '<li><details class="pli-ligne club-dispersion"><summary>' + t("Dispersion") + '</summary><div class="pli-corps">' + disp + '</div></details></li>' : '') +
      '<li><details class="pli-ligne"><summary>' + t("Historique des coups") + '</summary>' + hist + '</details></li>' +
      '<li><button class="ligne" type="button" data-a="club-comparer"><span class="quoi"><b>' + t("Comparer un club") + '</b></span><span class="chev" aria-hidden="true">›</span></button></li>' +
      '<li><details class="pli-ligne"><summary>' + t("Données et mesures") + '</summary><ul class="club-prov">' +
        ligneClubPage("Distances observées", t(M.n ? pluriel(M.n, "coup") + " joué" + (M.n > 1 ? "s" : "") + (Dist.gps ? ", dont " + Dist.gps + " au GPS (roule comprise)" : "") : "aucune")) +
        ligneClubPage("Distance de référence", t(M.reference != null ? M.reference + " m, saisie par toi, hors moyennes" : "aucune")) +
        ligneClubPage("Mesures héritées", t(M.heritees.length ? pluriel(M.heritees.length, "mesure") + " (" + sh.moy + " m), hors moyennes" : "aucune")) +
        ligneClubPage("Estimations", t("jamais comptées")) + '</ul></details></li></ul></section>';
    return h + navClubsHTML(av, ap, nomNav) + '</div>';
  }
  function navClubsHTML(av, ap, nomNav) {
    return '<nav class="bloc club-voisins" aria-label="Autres clubs">' +
      (av ? '<button class="btn" type="button" data-a="sac-fiche-club" data-id="' + av + '">‹ ' + t(nomNav(av)) + '</button>' : '<span></span>') +
      (ap ? '<button class="btn" type="button" data-a="sac-fiche-club" data-id="' + ap + '">' + t(nomNav(ap)) + ' ›</button>' : '<span></span>') + '</nav>';
  }
