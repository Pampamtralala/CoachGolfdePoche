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
    return '<section class="bloc" id="c-synthese">' + sectionTeteHTML("Mes clubs", { aide: '<p>' + t("Distances des coups joués sur le parcours, jamais estimées. Une référence saisie (« réf. ») ou une mesure héritée s'affiche à part et n'entre pas dans les moyennes. Un club est à documenter sous " + MIN_OBS_DISTANCE + " coups mesurés.") + '</p>', aideTitre: "D'où viennent ces distances ?" }) +
      /* V4-S02 : l'état (écarts, clubs à documenter) est dans les chiffres d'en-tête de l'onglet. */
      '<div class="defile"><table class="carte-score sac-synthese"><thead><tr><th scope="col">Club</th><th scope="col" class="num">Distance</th><th scope="col" class="num">Plage</th><th scope="col" class="num">Coups</th></tr></thead><tbody>' +
      lignes + '</tbody></table></div></section>';
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
  ACTIONS["sac-fiche-club"] = function (el) { var id = el.getAttribute("data-id"); if (!CLUB[id]) return; ui.sacSel = id; ui.club = id; ouvrirSac({ sac: id }, el); };
