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
  ACTIONS["sac-fiche-club"] = function (el) { var id = el.getAttribute("data-id"); if (!CLUB[id] && id !== "putter") return; ui.sacSel = id; ui.club = id; ouvrirSac({ sac: id }, el); };
