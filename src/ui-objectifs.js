  /* ============================================================
     OBJECTIFS PAR STATISTIQUE face au joueur cible, et relevés de la saisie détaillée
     ============================================================ */
  var FENETRES = [5, 10, 20];
  var TENDANCES = { mieux: "en progrès", moins: "en recul", stable: "stable" };
  function valStat(st, v) { return st.entier ? String(Math.round(v)) : st.id === "score" ? signe(v) : nb1(v); }

  /* Petite courbe des dernières parties, de la plus ancienne à la plus récente, avec l'objectif en pointillé. */
  function etincelle(vals, obj) {
    var pts = [];
    vals.forEach(function (v, i) { if (v != null) pts.push([i, v]); });
    if (pts.length < 2) return "";
    var W = 76, H = 30, px = 5, py = 5, n = vals.length - 1;
    var ys = pts.map(function (p) { return p[1]; }).concat([obj]), mn = Math.min.apply(null, ys), mx = Math.max.apply(null, ys);
    if (mx === mn) mx = mn + 1;
    function X(i) { return px + i * (W - 2 * px) / n; }
    function Y(v) { return H - py - (v - mn) / (mx - mn) * (H - 2 * py); }
    var fin = pts[pts.length - 1];
    return '<svg class="etincelle" viewBox="0 0 ' + W + ' ' + H + '" aria-hidden="true">' +
      '<line class="e-obj" x1="2" x2="' + (W - 2) + '" y1="' + Y(obj).toFixed(1) + '" y2="' + Y(obj).toFixed(1) + '"/>' +
      '<polyline class="e-trait" points="' + pts.map(function (p) { return X(p[0]).toFixed(1) + "," + Y(p[1]).toFixed(1); }).join(" ") + '"/>' +
      '<circle class="e-point" cx="' + X(fin[0]).toFixed(1) + '" cy="' + Y(fin[1]).toFixed(1) + '" r="3.5"/></svg>';
  }

  function objectifsHTML(cible) {
    var n = FENETRES.indexOf(ui.fenetre) >= 0 ? ui.fenetre : 5, f = statsFenetre(partiesAnalyse(), n), O = objectifs(cible), i = 0;
    var h = '<h3 class="titre-bloc">' + t("Pour jouer index " + cible) + '</h3>' +
      '<p>' + t("Un joueur d'index " + cible + " touche en moyenne " + nb1(O.gir) + " greens, prend " + nb1(O.putts) + " putts et " + nb1(O.pen) + " coup" + (O.pen >= 2 ? "s" : "") + " de pénalité par partie.") + '</p>' +
      '<div class="filtres" role="group" aria-label="Nombre de parties prises en compte">' + FENETRES.map(function (k) {
        return '<button class="puce neutre" type="button" data-a="fenetre" data-v="' + k + '" aria-pressed="' + (k === n) + '">' + k + ' parties</button>';
      }).join("") + '</div>' +
      '<div class="defile"><table class="carte-score objectifs"><thead><tr><th scope="col">Sur 18 trous</th><th scope="col" class="num">Toi</th><th scope="col" class="num">Cible</th><th scope="col" class="num">Évolution</th></tr></thead><tbody>';
    var sansScore = false;
    OBJ_STATS.forEach(function (st) {
      var v = f.vals[st.id], et = etatObjectif(st, v, O[st.id]), td = f.tendance[st.id];
      if (v == null && st.besoin === "score") sansScore = true;
      h += '<tr><td>' + t(st.nom) + ' <small>' + t(st.unite) + '</small></td>' +
        '<td class="num">' + (v == null ? '<span class="marque inconnu">–</span>' : '<span class="marque ' + (et === "repere" ? "" : et) + '" style="--i:' + (i++) + '">' + valStat(st, v) + '</span>') + '</td>' +
        '<td class="num rep">' + valStat(st, O[st.id]) + '</td>' +
        '<td class="num evol">' + etincelle(f.serie.map(function (x) { return x[st.id]; }), O[st.id]) + (td ? '<small>' + TENDANCES[td] + '</small>' : '') + '</td></tr>';
    });
    h += '</tbody></table></div><p class="legende"><span><span class="marque dessus">7</span> mieux que la cible</span><span><span class="marque dessous">3</span> moins bien</span>' +
      '<span><svg class="cle large" viewBox="0 0 24 14" aria-hidden="true"><line class="e-obj" x1="1" x2="23" y1="7" y2="7"/></svg> cible</span></p>' +
      '<p class="aide">' + t((f.n > 1 ? "Moyenne de tes " + f.n + " dernières parties" : "Ta dernière partie") + ", ramenée à 18 trous." + (sansScore ? " Les lignes vides demandent un score à chaque trou." : "")) + '</p>' +
      comment('<p>' + t("Les valeurs de la cible sont ce que réalise en moyenne un joueur de cet index : des ordres de grandeur. La petite courbe montre tes parties, de la plus ancienne à la plus récente, et le trait pointillé la cible. La tendance s'affiche à partir de 4 parties : la moitié récente est comparée à la moitié ancienne.") + '</p>');
    return h;
  }
  ACTIONS.fenetre = function (el) {
    var k = parseInt(el.getAttribute("data-v"), 10);
    if (FENETRES.indexOf(k) < 0) return;
    ui.fenetre = k; rendreEtFocus(el);
  };

  /* ---------- Relevés de la saisie détaillée ---------- */
  function relevesHTML() {
    if (!etat.parties.length) return null;
    var r = releveDetail(partiesAnalyse(), 90), p = etat.profil, pal = palierDe(indexNiveau(p)), l = [];
    var h = "";
    /* Côté des mises en jeu ratées, relié au défaut correspondant. */
    var cote = coteDominant(r.cotes, 5);
    if (cote === 2) {
      l.push({ t: "Mises en jeu ratées : " + r.cotes[2] + " sur " + r.nCotes + " sont des balles courtes, topées ou grattées. C'est le contact qui est en cause, pas la direction.",
        b: '<button class="puce" type="button" data-a="voir-exos" data-v="drive">Exercices de mise en jeu</button>' });
    } else if (cote) {
      var sym = (cote === 3) !== (p.lateralite === "G") ? "slice" : "hook", nom = SYM[sym].t.toLowerCase();
      var txt = "Mises en jeu ratées : " + r.cotes[cote] + " sur " + r.nCotes + " partent à " + (cote === 1 ? "gauche" : "droite") + ". C'est le côté du " + nom + ".", b = "";
      if (p.symptomes[sym]) txt += " Ce défaut est déjà dans ton bilan : ses causes sont détaillées plus bas.";
      else if (SYM[sym].niv[0] > pal || pal > SYM[sym].niv[1]) txt += "";
      else if (Object.keys(p.symptomes).length >= 3) txt += " Tu suis déjà trois défauts : remplace l'un d'eux dans ton profil pour travailler celui-ci.";
      else b = '<button class="puce" type="button" data-a="sym-ajouter" data-v="' + sym + '">' + t("Ajouter le " + nom + " à mes défauts") + '</button>';
      l.push({ t: txt, b: b, alerte: true });
    } else if (r.nCotes >= 5) {
      l.push({ t: "Mises en jeu ratées : aucun côté ne domine (" + r.cotes[1] + " à gauche, " + r.cotes[2] + " courtes, " + r.cotes[3] + " à droite)." });
    }
    /* Mises en jeu jouables par club de départ. */
    var cl = [1, 2, 3, 4].filter(function (k) { return r.clubs[k][0] >= 3; });
    if (cl.length) {
      var tc = "Mises en jeu jouables par club : " + cl.map(function (k) { return CLUBS_DEPART[k].toLowerCase() + " " + r.clubs[k][1] + " sur " + r.clubs[k][0]; }).join(", ") + ".", mieux = 0;
      if (r.clubs[1][0] >= 4) {
        [2, 3, 4].forEach(function (k) {
          var c = r.clubs[k];
          if (c[0] >= 4 && c[1] / c[0] - r.clubs[1][1] / r.clubs[1][0] >= 0.2 && (!mieux || c[1] / c[0] > r.clubs[mieux][1] / r.clubs[mieux][0])) mieux = k;
        });
      }
      if (mieux) tc += " Sur les trous étroits, " + (mieux === 3 ? "l'hybride" : "le " + CLUBS_DEPART[mieux].toLowerCase()) + " te garde plus souvent en jeu que le driver.";
      l.push({ t: tc, alerte: !!mieux });
    }
    /* Positions de jeu notées avec les coups : rough, bunker, arbres, recentrages. */
    var bl = bilanLies(partiesAnalyse().slice(-10));
    if (bl.notes >= 10) {
      var pc = function (k) { return Math.round(100 * (bl.lies[k] || 0) / bl.notes); }, rec = bl.types.rec || 0;
      l.push({ t: "Coups notés sur tes dernières parties : " + pc("fw") + " % du fairway, " + pc("ro") + " % du rough, " + pc("bk") + " % du bunker, " + pc("ar") + " % des arbres." +
        (rec ? " " + pluriel(rec, "recentrage") + " en " + pluriel(bl.parties, "partie") + " : " + (Math.round(rec / Math.max(1, bl.parties) * 10) / 10).toString().replace(".", ",") + " par partie, autant de coups perdus." : ""),
        alerte: rec / Math.max(1, bl.parties) >= 2 });
    }
    /* Premier putt : ce qu'il dit de l'approche, puis du putting. */
    if (r.nApp >= 5) l.push({ t: "Petit jeu : après un green manqué, ton premier putt fait moins de 3 m " + (r.app[1] + r.app[2]) + " fois sur " + r.nApp + "." });
    if (r.p1[2][0] >= 5) l.push({ t: "Putting : " + r.p1[2][1] + " premiers putts de 1 à 3 m rentrés sur " + r.p1[2][0] + "." });
    var p3 = r.p1[1][2] + r.p1[2][2] + r.p1[3][2] + r.p1[4][2], loin = r.p1[4][2];
    if (p3 >= 3) {
      l.push(loin * 2 >= p3 ? { t: loin + " de tes " + p3 + " greens à 3 putts partent de plus de 8 m : c'est le dosage des longs putts qui est en cause.", b: '<button class="puce" type="button" data-a="voir-exos" data-v="putt_long">Exercices de putting long</button>', alerte: true }
        : { t: (p3 - loin) + " de tes " + p3 + " greens à 3 putts partent de moins de 8 m : c'est le putt de retour qui est en cause.", b: '<button class="puce" type="button" data-a="voir-exos" data-v="putt_court">Exercices de putting court</button>', alerte: true });
    }
    if (!l.length) {
      return { resume: "saisie détaillée à activer", corps: '<p>Pendant une partie, active la saisie détaillée : côté des mises en jeu ratées, club de départ, longueur du premier putt. L’appli relie alors tes ratés à tes défauts et juge séparément ton petit jeu et ton putting.' +
        (r.nCotes + r.nP1 ? " Il lui faut encore quelques trous pour conclure." : "") + '</p>' };
    }
    return { resume: pluriel(l.length, "constat") + " sur " + r.T + " trous", corps: '<p class="aide">' + t("Sur tes " + r.T + " derniers trous.") + '</p><ul class="constats">' +
      l.map(function (x) { return '<li' + (x.alerte ? ' class="alerte"' : '') + '>' + t(x.t) + (x.b ? '<div class="exos-lies" style="margin-top:6px">' + x.b + '</div>' : '') + '</li>'; }).join("") + '</ul>' };
  }
  /* Ajoute au profil un défaut repéré en partie. Le plan en tient compte au cycle suivant. */
  ACTIONS["sym-ajouter"] = function (el) {
    var id = el.getAttribute("data-v"), p = etat.profil, pal = palierDe(indexNiveau(p));
    if (!a(SYM, id) || p.symptomes[id] || Object.keys(p.symptomes).length >= 3) return;
    if (SYM[id].niv[0] > pal || pal > SYM[id].niv[1]) return;
    p.symptomes[id] = { reponses: {} };
    if (!p.symptomePrincipal) p.symptomePrincipal = id;
    sauver(); rendre(); allerSection("defaut-" + id);
    message("Défaut ajouté à ton bilan. Ton plan en tiendra compte au prochain cycle.");
  };
