  /* ============================================================
     PUTTING (roadmap DATA, P08)
     Sur les parties choisies par les filtres du tableau de bord. Base : les trous joués.
     La longueur du premier putt (court / moyen / long) n'est lue que là où elle a été notée.
     ============================================================ */
  function pctP(v) { return v == null ? "–" : v + " %"; }
  function lignePuttHTML(lib, sous, a) {
    return '<tr><th scope="row">' + t(lib) + (sous ? '<small>' + t(sous) + '</small>' : '') + '</th>' +
      (a.trous ? '<td class="num">' + nb1(a.parTrou) + '<small>' + t(pluriel(a.trous, "trou")) + '</small></td><td class="num">' + pctP(a.partUn) + '</td><td class="num">' + pctP(a.partTrois) + '</td>'
        : '<td class="num" colspan="3">' + t("aucun trou") + '</td>') + '</tr>';
  }
  function tablePuttHTML(classe, lignes) {
    return '<div class="defile"><table class="carte-score ' + classe + '"><thead><tr><th scope="col"></th><th scope="col" class="num">Putts / trou</th><th scope="col" class="num">Un putt</th><th scope="col" class="num">Trois et +</th></tr></thead><tbody>' + lignes + '</tbody></table></div>';
  }
  function puttingStatsHTML() {
    var F = filtresStats(), l = selectionStats(F), R = analysePutting(l), A = R.total;
    var h = '<section class="bloc" id="st-putting"><h2>Putting</h2>';
    if (!A.trous) return h + etatVideHTML("stats", "Pas encore de putts à analyser", "Enregistre des parties : le nombre de putts de chaque trou suffit.") + '</section>';
    h += '<p class="aide putt-echantillon">' + t("Sur " + pluriel(A.trous, "trou") + " joué" + (A.trous > 1 ? "s" : "") + " (" + pluriel(R.parties, "partie") + "), " + A.putts + " putts.") + '</p>';
    h += '<div class="kpi-grille putt-kpis">' +
      [["Putts par trou", nb1(A.parTrou), "soit " + nb1(A.par18) + " sur 18 trous", pluriel(A.trous, "trou")], ["Un putt", pctP(A.partUn), "des trous joués", pluriel(A.un, "trou")],
       ["Deux putts", pctP(A.partDeux), "des trous joués", pluriel(A.deux, "trou")], ["Trois putts et +", pctP(A.partTrois), "des trous joués", pluriel(A.troisPlus, "trou")]]
        .map(function (k) { return '<article class="kpi"><p class="kpi-t">' + t(k[0]) + '</p><p class="kpi-v"><span class="main">' + t(k[1]) + '</span></p><p class="kpi-u">' + t(k[2]) + '</p><p class="kpi-n">' + t(k[3]) + '</p></article>'; }).join("") + '</div>';
    h += barreRepartitionHTML("Putts par trou", [{ lib: "Un ou aucun", v: A.un + A.zero, c: "c" }, { lib: "Deux", v: A.deux, c: "k" }, { lib: "Trois et plus", v: A.troisPlus, c: "d" }],
      pluriel(A.trous, "trou"), A.zero ? A.zero + " trou" + (A.zero > 1 ? "s" : "") + " sans putt (balle rentrée de hors du green), compté" + (A.zero > 1 ? "s" : "") + " avec « un ou aucun »." : "");
    /* Évolution */
    if (R.evolution) {
      var E = R.evolution;
      h += '<p class="putt-ligne"><b>Évolution</b> ' + t("Sur tes " + E.parties + " premières parties : " + nb1(E.avant.parTrou) + " putts par trou et " + E.avant.partTrois + " % de trois-putts (" + E.avant.trous + " trous) ; sur les " + E.parties + " dernières : " + nb1(E.apres.parTrou) + " et " + E.apres.partTrois + " % (" + E.apres.trous + " trous)" +
        (Math.abs(E.dParTrou) < 0.05 ? " : stable." : E.dParTrou < 0 ? " : moins de putts." : " : plus de putts.")) + '</p>';
    } else if (R.parties > 1) h += '<p class="putt-ligne"><b>Évolution</b> ' + t("à partir de 4 parties et 18 trous dans chaque moitié.") + '</p>';
    /* Selon le green en régulation */
    h += '<h3 class="titre-bloc">Selon le green</h3>' + tablePuttHTML("putt-gir",
      lignePuttHTML("En régulation", "déduit du score", R.gir.avec) + lignePuttHTML("Manqué", "approche avant de putter", R.gir.sans)) +
      '<p class="aide">' + t("Après un green pris en régulation, le premier putt est souvent plus long : plus de putts y est normal.") + '</p>';
    /* Longueur du premier putt */
    h += '<h3 class="titre-bloc">Longueur du premier putt</h3>';
    var P = R.premierPutt;
    if (P.notes) {
      h += tablePuttHTML("putt-longueur", P.categories.map(function (c) { return lignePuttHTML(c.lib, c.aide, c); }).join("")) +
        '<p class="aide">' + t("Notée sur " + pluriel(P.notes, "trou") + (P.sansLongueur ? " ; " + pluriel(P.sansLongueur, "trou") + " sans longueur notée, non compté" + (P.sansLongueur > 1 ? "s" : "") + " ici" : "") + ". Pas de taux de réussite à une distance précise : seulement trois catégories.") + '</p>';
    } else {
      h += '<p class="aide">' + t("Pas encore noté. En saisie Standard ou Expert, « Premier putt » apparaît sous le nombre de putts : une catégorie suffit, sans mesure GPS.") + '</p>';
    }
    h += '<p class="putt-ligne"><b>Second putt difficile</b> ' + t(R.difficiles.n ? "signalé " + R.difficiles.n + " fois" + (R.difficiles.apresLong ? ", dont " + R.difficiles.apresLong + " après un premier putt long" : "") + "." : "jamais signalé. En saisie Standard ou Expert, sous le nombre de putts, signale quand le premier putt a laissé un second putt difficile.") + '</p>';
    /* Par parcours */
    var pcs = R.parcours.filter(function (x) { return x.trous >= 9; });
    if (pcs.length > 1) h += '<h3 class="titre-bloc">Par parcours</h3>' + tablePuttHTML("putt-parcours", pcs.map(function (x) { var pc = parcoursDe(x.pc); return lignePuttHTML(pc ? pc.nom : "Parcours supprimé", "", x); }).join(""));
    return h + '</section>';
  }
