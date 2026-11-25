  /* ============================================================
     MON SAC, CÔTÉ DONNÉES (roadmap UX, UX08)
     Synthèse des clubs en tableau (distance typique observée, fourchette, nombre de mesures par provenance,
     écarts anormaux, clubs peu documentés) avant le sac en 3D, gardé comme vue alternative ; fiche de club
     ouverte par un chiffre-clé de synthèse. Aucune distance estimée n'entre dans ces chiffres.
     ============================================================ */
  var MIN_MESURES_SAC = 3;
  /* Mesures d'un club par provenance : practice (séries et saisies du carnet) et parcours (coups notés). */
  function mesuresClubParSource(id) {
    var prac = (etat.carnet.clubs[id] || []).length, parc = (coupsDuParcours().clubs[id] || []).length;
    var series = (etat.carnet.series || []).filter(function (s) { return s.c === id; });
    return { practice: prac, parcours: parc, total: prac + parc, series: series };
  }
  /* Note courte d'un écart anormal, pour le tableau (la phrase complète est dans la fiche du club). */
  function noteEcartSac(x, id) {
    var autre = x.a.id === id ? x.b : x.a, nomA = nomCourt(CLUB[autre.id] || { nom: autre.nom || "" }).toLowerCase();
    return x.type === "trou" ? "Trou de " + x.ecart + " m avec le " + nomA : x.type === "doublon" ? "Seulement " + x.ecart + " m avec le " + nomA : "Ordre à vérifier avec le " + nomA;
  }
  function syntheseSacHTML() {
    var ids = sacActuel(), clubs = mesuresTout(), an = analyseSac();
    if (!ids.length) return '';
    var peu = 0, alertes = 0;
    var lignes = ids.map(function (id) {
      var c = CLUB[id], st = statsClub(clubs[id]), fo = st ? fourchette(clubs[id]) : null, M = mesuresClubParSource(id), al = alertesDe(an, id);
      if (M.total < MIN_MESURES_SAC) peu++; if (al.length) alertes++;
      var etatLib = al.length ? noteEcartSac(al[0], id) : M.total < MIN_MESURES_SAC ? (M.total ? "Peu documenté (" + M.total + "/" + MIN_MESURES_SAC + ")" : "À mesurer") : "";
      return '<tr class="' + (al.length ? "alerte" : M.total < MIN_MESURES_SAC ? "peu" : "") + '"><th scope="row"><button class="lien" type="button" data-a="sac-fiche-club" data-id="' + id + '">' + t(nomCourt(c)) + '</button>' + (etatLib ? '<small class="sac-etat">' + t(etatLib) + '</small>' : '') + '</th>' +
        '<td class="num">' + (st ? t(st.moy + " m") : '<span class="marque inconnu">–</span>') + '</td>' +
        '<td class="num">' + (fo ? t(fo.bas === fo.haut ? fo.bas + " m" : fo.bas + "–" + fo.haut + " m") : "–") + '</td>' +
        '<td class="num">' + M.total + '<small>' + t((M.practice ? M.practice + " practice" : "") + (M.practice && M.parcours ? " · " : "") + (M.parcours ? M.parcours + " parcours" : "")) + '</small></td>' +
        '</tr>';
    }).join("");
    return '<section class="bloc" id="c-synthese"><h2>Mes clubs</h2><p class="aide">' +
      t("Distances observées (practice et parcours), jamais estimées. " + (alertes ? pluriel(alertes, "club") + " avec un écart anormal. " : "") + (peu ? pluriel(peu, "club") + " peu documenté" + (peu > 1 ? "s" : "") + " (moins de " + MIN_MESURES_SAC + " mesures)." : "Tous les clubs ont au moins " + MIN_MESURES_SAC + " mesures.")) + '</p>' +
      '<div class="defile"><table class="carte-score sac-synthese"><thead><tr><th scope="col">Club</th><th scope="col" class="num">Distance typique</th><th scope="col" class="num">Fourchette</th><th scope="col" class="num">Mesures</th></tr></thead><tbody>' +
      lignes + '</tbody></table></div><div class="ligne-btn"><button class="btn" type="button" data-a="serie-ouvrir">Mesurer une série</button><button class="btn" type="button" data-a="sac-composer" data-id="sac">Composer mon sac</button></div></section>';
  }
  /* En tête de la fiche d'un club : ce que disent ses données, et la série en un toucher. */
  function ficheClubSyntheseHTML(id) {
    var clubs = mesuresTout(), st = statsClub(clubs[id]), fo = st ? fourchette(clubs[id]) : null, M = mesuresClubParSource(id);
    var P = profilClub(partiesAnalyse(), id), D = P.distance, dir = P.direction, cases = [];
    cases.push({ t: "Distance typique", v: st ? st.moy + " m" : "–", x: st ? pluriel(M.total, "mesure") + (fo && fo.bas !== fo.haut ? ", habituellement " + fo.bas + " à " + fo.haut + " m" : "") : "Aucune mesure : fais une série au practice.", prov: st ? "Observé" : "Inconnu" });
    cases.push({ t: "Practice / parcours", v: M.practice + " / " + M.parcours, x: "mesures au practice / coups notés sur le parcours", prov: "Observé" });
    if (D && D.n) cases.push({ t: "Sur le parcours", v: D.valeur != null ? "≈ " + D.valeur + " m" : "–", x: D.valeur != null ? pluriel(D.n, "plein coup mesuré") + (D.gps ? ", dont " + D.gps + " au GPS (roulé compris)" : "") : "encore " + pluriel(Math.max(1, 3 - D.n), "mesure") + " sur le parcours", prov: D.gps ? "GPS" : "Observé" });
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
