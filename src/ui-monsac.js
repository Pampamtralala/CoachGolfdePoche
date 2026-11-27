  /* ============================================================
     MON SAC, CÔTÉ DONNÉES (roadmap UX, UX08)
     Synthèse des clubs en tableau (distance typique observée, fourchette, nombre de mesures par provenance,
     écarts anormaux, clubs peu documentés) avant le sac en 3D, gardé comme vue alternative ; fiche de club
     ouverte par un chiffre-clé de synthèse. Aucune distance estimée n'entre dans ces chiffres.
     ============================================================ */
  var MIN_MESURES_SAC = 3;
  /* V4 S01 : un club, trois sources séparées. Observées : coups réels du parcours. Référence : distance saisie.
     Héritées : anciennes saisies et séries mêlées (hors moyennes). */
  function mesuresClubParSource(id) {
    var obs = mesuresObservees()[id] || [], her = etat.carnet.clubs[id] || [], ref = referencesClubs()[id];
    var series = (etat.carnet.series || []).filter(function (s) { return s.c === id; });
    return { observees: obs, heritees: her, reference: ref != null ? ref : null, n: obs.length, series: series };
  }
  /* Note courte d'un écart anormal, pour le tableau (la phrase complète est dans la fiche du club). */
  function noteEcartSac(x, id) {
    var autre = x.a.id === id ? x.b : x.a, nomA = nomCourt(CLUB[autre.id] || { nom: autre.nom || "" }).toLowerCase();
    return x.type === "trou" ? "Trou de " + x.ecart + " m avec le " + nomA : x.type === "doublon" ? "Seulement " + x.ecart + " m avec le " + nomA : "Ordre à vérifier avec le " + nomA;
  }
  function syntheseSacHTML() {
    var ids = sacActuel(), an = analyseSac();
    if (!ids.length) return '';
    var peu = 0, alertes = 0;
    var lignes = ids.map(function (id) {
      var c = CLUB[id], M = mesuresClubParSource(id), st = statsClub(M.observees), fo = M.n >= MIN_OBS_DISTANCE ? fourchette(M.observees) : null, al = alertesDe(an, id), sh = statsClub(M.heritees);
      if (M.n < MIN_OBS_DISTANCE) peu++; if (al.length) alertes++;
      var etatLib = al.length ? noteEcartSac(al[0], id) : M.n < MIN_OBS_DISTANCE ? (M.n ? "Peu de coups (" + M.n + "/" + MIN_OBS_DISTANCE + ")" : "Aucun coup mesuré") : "";
      var dist = st ? t(st.moy + " m") : M.reference != null ? '<span class="marque ref">' + t("réf. " + M.reference + " m") + '</span>' : sh ? '<span class="marque herit">' + t(sh.moy + " m hérité") + '</span>' : '<span class="marque inconnu">–</span>';
      return '<tr class="' + (al.length ? "alerte" : M.n < MIN_OBS_DISTANCE ? "peu" : "") + '"><th scope="row"><button class="lien" type="button" data-a="sac-fiche-club" data-id="' + id + '">' + t(nomCourt(c)) + '</button>' + (etatLib ? '<small class="sac-etat">' + t(etatLib) + '</small>' : '') + '</th>' +
        '<td class="num">' + dist + '</td>' +
        '<td class="num">' + (fo ? t(fo.bas === fo.haut ? fo.bas + " m" : fo.bas + "–" + fo.haut + " m") : "–") + '</td>' +
        '<td class="num">' + M.n + '</td></tr>';
    }).join("");
    return '<section class="bloc" id="c-synthese"><h2>Mes clubs</h2><p class="aide">' +
      t("Distances des coups joués sur le parcours, jamais estimées. Une référence saisie ou une mesure héritée s'affiche à part et n'entre pas dans les moyennes. " + (alertes ? pluriel(alertes, "club") + " avec un écart anormal. " : "") + (peu ? pluriel(peu, "club") + " avec moins de " + MIN_OBS_DISTANCE + " coups mesurés." : "")) + '</p>' +
      '<div class="defile"><table class="carte-score sac-synthese"><thead><tr><th scope="col">Club</th><th scope="col" class="num">Distance</th><th scope="col" class="num">Plage</th><th scope="col" class="num">Coups</th></tr></thead><tbody>' +
      lignes + '</tbody></table></div><div class="ligne-btn"><button class="btn" type="button" data-a="serie-ouvrir">Mesurer une série</button><button class="btn" type="button" data-a="sac-composer" data-id="sac">Composer mon sac</button></div></section>';
  }
  /* En tête de la fiche d'un club : ce que disent ses données, et la série en un toucher. */
  function ficheClubSyntheseHTML(id) {
    var M = mesuresClubParSource(id), st = statsClub(M.observees), fo = M.n >= MIN_OBS_DISTANCE ? fourchette(M.observees) : null, sh = statsClub(M.heritees);
    var P = profilClub(partiesAnalyse(), id), D = P.distance, dir = P.direction, cases = [];
    cases.push({ t: "Distance observée", v: st ? st.moy + " m" : "–", x: st ? pluriel(M.n, "coup") + " sur le parcours" + (D && D.gps ? ", dont " + D.gps + " au GPS" : "") + (fo && fo.bas !== fo.haut ? ", habituellement " + fo.bas + " à " + fo.haut + " m" : "") : "Aucun coup mesuré sur le parcours.", prov: st ? "Observé" : "Inconnu" });
    cases.push({ t: "Référence", v: M.reference != null ? M.reference + " m" : "–", x: M.reference != null ? "saisie par toi, pour choisir ton club" : "facultative, à saisir plus bas", prov: "Référence" });
    if (sh) cases.push({ t: "Mesures héritées", v: sh.moy + " m", x: pluriel(M.heritees.length, "mesure") + " ancienne" + (M.heritees.length > 1 ? "s" : "") + ", hors moyennes", prov: "Héritée" });
    if (dir && dir.n) cases.push({ t: "Direction", v: dir.partCentre + " % dans l'axe", x: dir.partGauche + " % à gauche · " + dir.partDroite + " % à droite, sur " + pluriel(dir.n, "coup"), prov: "Observé" });
    var h = '<div class="fiche-club-synthese"><div class="kpi-grille">' + cases.map(function (c) {
      return '<article class="kpi"><p class="kpi-t">' + t(c.t) + ' <span class="ens-prov">' + t(c.prov) + '</span></p><p class="kpi-v"><span class="main">' + t(c.v) + '</span></p><p class="kpi-x">' + t(c.x) + '</p></article>';
    }).join("") + '</div>';
    if (M.series.length) h += '<p class="titre-liste">' + t("Évolution de tes séries") + '</p><ul class="historique fiche-series">' + M.series.slice(-5).reverse().map(function (s) {
      var f = fourchette(s.v), m = statsClub(s.v);
      return '<li><span class="hist-date">' + t(dateCourte(s.d)) + '</span><span><b>' + t(m ? m.moy + " m" : "–") + '</b><small>' + t(pluriel(s.v.length, "balle") + (f && f.bas !== f.haut ? ", " + f.bas + "–" + f.haut + " m" : "")) + '</small></span></li>';
    }).join("") + '</ul>';
    var ens = etat.parties.length ? calculEns().liste.filter(function (e) { return e.id === "club" && e.titre.toLowerCase().indexOf(nomCourt(CLUB[id]).toLowerCase()) >= 0; }) : [];
    if (ens.length) h += ens.map(carteEnsHTML).join("");
    return h + '<p class="sac-serie"><button class="btn principal large" type="button" data-a="serie-ouvrir" data-id="' + id + '">Faire une série de balles avec ce club</button></p></div>';
  }
  ACTIONS["sac-fiche-club"] = function (el) { var id = el.getAttribute("data-id"); if (!CLUB[id]) return; ui.sacSel = id; ui.club = id; ouvrirSac({ sac: id }, el); };
