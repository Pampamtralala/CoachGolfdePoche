  /* ============================================================
     TABLEAUX DE BORD : accueil, chiffres clés des statistiques, coaching (progression, badges, historique),
     historique des mesures du sac, mode de saisie. Uniquement des données réelles du joueur.
     ============================================================ */

  /* ---------- Index : historique et courbe ---------- */
  function noterIndex(v) {
    if (!nombre(v)) return;
    var h = etat.indexHist || (etat.indexHist = []), der = h[h.length - 1], j = auj();
    if (der && der.v === v) return;
    if (der && String(der.d).slice(0, 10) === j.slice(0, 10)) der.v = v; else h.push({ d: j, v: v });
    /* On garde toutes les anciennes observations d’index. */
  }
  function courbeIndexHTML(h, l, ht) {
    var pts = (etat.indexHist || []).slice(-12);
    if (pts.length < 2) return "";
    l = l || 140; ht = ht || 40;
    var vs = pts.map(function (p) { return p.v; }), mn = Math.min.apply(null, vs), mx = Math.max.apply(null, vs), et = Math.max(1, mx - mn);
    var X = function (i) { return (4 + i * (l - 8) / (pts.length - 1)).toFixed(1); }, Y = function (v) { return (4 + (mx - v) / et * (ht - 8)).toFixed(1); };
    var d = pts.map(function (p, i) { return (i ? "L" : "M") + X(i) + " " + Y(p.v); }).join("");
    return '<svg class="courbe-index" viewBox="0 0 ' + l + ' ' + ht + '" role="img" aria-label="' + at("Index : " + pts.map(function (p) { return indexLib(p.v) + " le " + dateCourte(p.d); }).join(", ")) + '">' +
      '<path d="' + d + '"/><circle cx="' + X(pts.length - 1) + '" cy="' + Y(vs[vs.length - 1]) + '" r="4"/></svg>';
  }
  function evolutionIndex() {
    var h = etat.indexHist || [];
    if (h.length < 2) return null;
    return { depuis: h[0].d, ecart: Math.round((h[h.length - 1].v - h[0].v) * 10) / 10 };
  }

  /* ---------- Accueil : sous le paysage ---------- */
  function tableauBordHTML() {
    var p = etat.profil, obj = indexVise(), ev = evolutionIndex(), h = '';
    /* Index et objectif */
    h += '<article class="carte-tb index-carte"><div class="ic-gauche"><p class="surtitre">Ton index</p><p class="ic-val"><span class="main">' + t(p.sansIndex ? "–" : indexLib(p.index)) + '</span></p>' +
      '<p class="ic-evol">' + t(ev ? (ev.ecart < 0 ? "▼ " + indexLib(-ev.ecart) + " depuis le " + dateCourte(ev.depuis) : ev.ecart > 0 ? "▲ " + indexLib(ev.ecart) + " depuis le " + dateCourte(ev.depuis) : "Stable depuis le " + dateCourte(ev.depuis))
        : "L’évolution s’affiche dès ta prochaine mise à jour d’index.") + '</p></div>' +
      '<div class="ic-droite">' + courbeIndexHTML() + '<button class="ic-obj" type="button" data-a="aller-a" data-v="profil" data-s="objectif-index"><small>Objectif</small><b>' + t(obj === 0 ? "Scratch" : "Index " + obj) + '</b>' +
      (!p.sansIndex && p.index > obj ? '<span>' + t("encore " + indexLib(Math.round((p.index - obj) * 10) / 10)) + '</span>' : '') + '</button></div></article>';
    /* Accès rapides */
    var pt = etat.partie;
    h += '<div class="acces-rapides"><button class="btn principal" type="button" data-a="' + (pt ? "pt-reprendre" : "partie-rapide") + '">' + icone("drapeau") + '<span>' + t(pt ? "Reprendre au trou " + numeroTrou(pt, pt.i) : "Nouvelle partie") + '</span></button>' +
      '<button class="btn" type="button" data-a="onglet" data-v="practice">' + icone("entrainement") + '<span>S’entraîner</span></button></div>';
    /* À suivre : séance et priorité */
    var pr = prochaineSeance(), plan = etat.plan;
    h += '<h2 class="titre-bref">À suivre</h2><div class="grille-tb">';
    if (pr) {
      h += '<button class="carte-tb lien-tb" type="button" data-a="voir-seance" data-id="' + at(pr.se.id) + '" data-v="' + pr.w + '"><p class="surtitre">' + t(pr.retard ? "Séance à rattraper" : "Prochaine séance") + '</p>' +
        '<p class="tb-titre">' + t(pr.se.doms.map(function (d) { return DOM[d].court; }).join(" et ")) + '</p><p class="tb-meta">' + t("Semaine " + pr.w + " · " + dureeLib(pr.se.min)) + '</p>' + icone("chevron") + '</button>';
    } else h += '<button class="carte-tb lien-tb" type="button" data-a="fin-cycle"><p class="surtitre">Programme</p><p class="tb-titre">Cycle terminé</p><p class="tb-meta">Fais le bilan pour lancer le suivant</p>' + icone("chevron") + '</button>';
    var prs = prioriteSemaine(etat.parties, obj), prio = prs.priorite;
    var d0 = prio ? secteurDomaine(prs) : plan.priorites[0];
    h += '<button class="carte-tb lien-tb" type="button" data-a="' + (d0 && DOM[d0] ? 'voir-exos" data-v="' + d0 : 'onglet" data-v="bilan') + '"><p class="surtitre">Priorité technique</p>' +
      '<p class="tb-titre">' + t(prio ? prio.nom : d0 && DOM[d0] ? DOM[d0].nom : "À définir") + '</p><p class="tb-meta">' + t(prio ? (prio.sg != null ? coupsLib(prio.sg, "perdu") + " par partie face à l’index " + obj : "Ta note la plus basse") : "D’après ton profil et ton programme") + '</p>' + icone("chevron") + '</button></div>';
    /* Résumé : dernière partie et jeu sur 100 */
    var l = etat.parties, der = l.length ? l[l.length - 1] : null;
    h += '<h2 class="titre-bref">Ton jeu</h2>';
    if (der) {
      var sc = scorePartie(der), st = statsTrous(der.trous);
      h += '<button class="carte-tb lien-tb derniere" type="button" data-a="pt-carte" data-id="' + (l.length - 1) + '"><p class="surtitre">Dernière partie · ' + t(dateCourte(der.d)) + '</p>' +
        '<p class="tb-titre">' + (sc.complet ? '<span class="main">' + sc.coups + '</span> ' + t(ecartLib(sc.ecart)) : t(pluriel(st.T, "trou") + " notés")) + '</p>' +
        '<p class="tb-meta">' + t((parcoursDe(der.pc) ? parcoursDe(der.pc).nom + " · " : "") + st.G + " green" + (st.G > 1 ? "s" : "") + " en régulation · " + st.P + " putts") + '</p>' + icone("chevron") + '</button>';
    } else h += etatVideHTML("drapeau", "Aucune partie notée", "Note ta prochaine partie trou par trou : tes statistiques et tes notes sur 100 se construisent toutes seules.", "partie-rapide", "Lancer une partie");
    var no = notesHTML(true, true);
    if (!no.vide) h += '<div class="carte-tb notes-accueil"><p class="surtitre">Ton jeu sur 100</p>' + no.html + '</div>';
    return h;
  }
  function etatVideHTML(ico, titre, texte, action, bouton) {
    return '<div class="etat-vide">' + icone(ico) + '<p class="tb-titre">' + t(titre) + '</p><p>' + t(texte) + '</p>' +
      (action ? '<button class="btn principal" type="button" data-a="' + action + '">' + t(bouton) + '</button>' : '') + '</div>';
  }

  /* Qualité des données : transparence sur l'échantillon et les sources. */
  function qualiteGolfHTML() {
    var obs = observationsGolf(etat.parties, etat.carnet), q = qualiteObservations(obs);
    var confirmes = 0, suivis = 0;
    etat.parties.forEach(function (p) {
      (p.trous || []).forEach(function (tr, i) {
        if (!tr) return;
        suivis++;
        if ((p.validation || [])[i] === "confirme") confirmes++;
      });
    });
    return '<section class="bloc" id="qualite-donnees"><h2>Qualité de mon carnet</h2>' +
      '<p class="aide">' + t(q.total ? q.total + " observations · " + q.distance + " distances mesurées ou déclarées · " + q.gps + " relevés GPS." : "Les observations apparaîtront après tes premières mesures et tes premiers coups.") + '</p>' +
      '<p class="aide">' + t(suivis ? confirmes + " scores confirmés sur " + suivis + " trous historiques. Les anciens scores restent utilisables, mais leur confirmation n’est pas connue." : "Aucun trou historique pour le moment.") + '</p>' +
      '<p class="aide">Chaque coup peut conserver sa source (manuel, GPS, import), sa date, son type de distance et son niveau de confiance. Les anciennes données non documentées restent marquées comme inconnues.</p></section>';
  }

  /* ---------- Statistiques : chiffres clés ---------- */
  function chiffresClesHTML() {
    var n = ui.fenetre || 5, l = etat.parties, c = cumulParties(l, n * 18), avant = cumulParties(l.slice(0, Math.max(0, l.length - c.n)), n * 18);
    if (!c.T) return etatVideHTML("stats", "Pas encore de statistiques", "Note une partie avec le pavé : score, putts et pénalités suffisent pour démarrer.", "partie-rapide", "Lancer une partie");
    var k = 18 / c.T, ka = avant.T ? 18 / avant.T : 0, obj = indexVise(), ref = repereSG(obj);
    var tend = function (v, va, mieuxHaut) {
      if (!avant.T || va == null) return '';
      var d = v - va; if (Math.abs(d) < 0.15) return '<span class="tend stable">= stable</span>';
      var bon = mieuxHaut ? d > 0 : d < 0;
      return '<span class="tend ' + (bon ? "mieux" : "moins") + '">' + (d > 0 ? "▲ " : "▼ ") + nb1(Math.abs(d)) + '</span>';
    };
    var cartes = [];
    if (c.N) {
      var e = (c.S - c.PAR) * 18 / c.N, ea = avant.N ? (avant.S - avant.PAR) * 18 / avant.N : null;
      cartes.push({ t: "Score moyen", v: (e > 0 ? "+" : "") + nb1(e), u: "sur 18 trous", tend: tend(e, ea, false),
        x: "Écart au par ramené à 18 trous.", r: e <= ref.s ? "Au niveau de ton objectif d’index " + obj + " : continue." : "Ton objectif d’index " + obj + " joue environ " + (ref.s > 0 ? "+" : "") + nb1(ref.s) + "." });
    }
    var jo = 100 * c.J / c.T;
    cartes.push({ t: "Mises en jeu", v: Math.round(jo) + " %", u: "départs jouables", tend: tend(jo, avant.T ? 100 * avant.J / avant.T : null, true),
      x: "Balle en jeu au départ : fairway, ou rough d’où l’on peut attaquer.", r: jo < repereA("jouable", obj) ? "Vise la sécurité au départ : un bois ou un hybride si le drive part trop souvent." : "Bonne régularité au départ." });
    cartes.push({ t: "Greens en régulation", v: nb1(c.G * k), u: "sur 18", tend: tend(c.G * k, avant.T ? avant.G * ka : null, true),
      x: "Green atteint en (par − 2) coups ou moins.", r: c.G * k < ref.gir ? "Vise le centre du green : c’est la source de GIR la plus rapide." : "Au repère de ton objectif." });
    if (c.MN >= 3) {
      var sv = 100 * c.SV / c.MN;
      cartes.push({ t: "Petit jeu", v: Math.round(sv) + " %", u: "pars sauvés", tend: tend(sv, avant.MN >= 3 ? 100 * avant.SV / avant.MN : null, true),
        x: "Pars ou mieux après un green manqué.", r: sv < ref.sv ? "Travaille les approches roulées : un coup pour le green, un putt." : "Ton petit jeu sauve des coups." });
    }
    cartes.push({ t: "Putting", v: nb1(c.P * k), u: "putts par partie", tend: tend(c.P * k, avant.T ? avant.P * ka : null, false),
      x: pluriel(Math.round(c.P3 * k * 10) / 10, "trois-putts").replace(/^(\d+)\.(\d)/, "$1,$2") + " par partie.", r: c.P3 * k > ref.p3 ? "Les putts de 5 à 10 m sont ta marge : vise de les laisser à moins d’un mètre." : "Peu de trois-putts : bien." });
    var cg = coupsGagnes(l, obj);
    if (cg) cartes.push({ t: "Coups gagnés", v: (cg.total > 0 ? "+" : "") + nb1(cg.total), u: "face à l’index " + obj, tend: "",
      x: "Coups gagnés ou perdus par partie face à un joueur de ton objectif.", r: cg.total >= 0 ? "Tu joues déjà au niveau de ton objectif." : "Voir les deux secteurs qui coûtent le plus ci-dessous." });
    var h = '<div class="fenetres" role="group" aria-label="Période">' + [5, 10, 20].map(function (x) {
      return '<button class="opt" type="button" data-a="fenetre" data-v="' + x + '" aria-pressed="' + (n === x) + '">' + x + ' parties</button>';
    }).join("") + '</div>' +
      '<p class="aide">' + t("Sur " + pluriel(c.n, "partie") + " (" + c.T + " trous)" + (avant.T ? ", comparé aux " + avant.n + " précédentes." : ".")) + '</p>' +
      '<div class="kpi-grille">' + cartes.map(function (x) {
        return '<article class="kpi"><p class="kpi-t">' + t(x.t) + '</p><p class="kpi-v"><span class="main">' + t(x.v) + '</span>' + x.tend + '</p><p class="kpi-u">' + t(x.u) + '</p>' +
          '<p class="kpi-x">' + t(x.x) + '</p><p class="kpi-r">' + t(x.r) + '</p></article>';
      }).join("") + '</div>';
    var ci = courbeIndexHTML(null, 300, 70);
    if (ci) h += '<div class="carte-tb evol-index"><p class="surtitre">Évolution de ton index</p>' + ci + '</div>';
    return h;
  }

  /* ---------- Progresser : progression du cycle, défis, badges, historique ---------- */
  function progressionHTML() {
    var plan = etat.plan, faites = compteFaites(), total = plan.n * 4, part = total ? faites / total : 0, r = 34, c = 2 * Math.PI * r, w = semaineCourante();
    return '<div class="carte-tb progression"><svg viewBox="0 0 84 84" aria-hidden="true" focusable="false"><circle class="pg-fond" cx="42" cy="42" r="' + r + '"/>' +
      (faites ? '<circle class="pg-plein" cx="42" cy="42" r="' + r + '" style="stroke-dasharray:' + c.toFixed(1) + ';stroke-dashoffset:' + (c * (1 - part)).toFixed(1) + '" transform="rotate(-90 42 42)"/>' : '') +
      '<text x="42" y="48" text-anchor="middle">' + Math.round(part * 100) + '%</text></svg>' +
      '<div><p class="surtitre">' + t("Cycle " + plan.cycle + " · semaine " + w + " sur 4") + '</p><p class="tb-titre">' + t(pluriel(faites, "séance") + " faite" + (faites > 1 ? "s" : "") + " sur " + total) + '</p>' +
      '<p class="tb-meta">' + t("Priorités : " + plan.priorites.map(function (d) { return DOM[d].nom.toLowerCase(); }).join(", ")) + '</p></div></div>';
  }
  function defisResumeHTML() {
    var l = DEFIS.map(function (d) { return { d: d, D: etatDefi(d.id) }; }).filter(function (x) { return x.D.essais; })
      .sort(function (a, b) { return (b.D.hist.length ? 1 : 0) - (a.D.hist.length ? 1 : 0); }).slice(0, 3);
    var h = '<section class="bloc" id="defis-resume"><h2>Défis</h2>';
    if (!l.length) h += '<p>' + t("Des défis mesurables pour chaque domaine : putts de 1 m, tour du cadran, approches… Ton record et ton meilleur temps sont gardés.") + '</p>';
    else h += '<ul class="liste-defis">' + l.map(function (x) {
      var n = x.d.niveaux.length;
      return '<li><button class="ligne-jour" type="button" data-a="defi" data-id="' + x.d.id + '"><span class="lj-val"><span class="main">' + Math.min(x.D.niv, n) + '</span><small>sur ' + n + '</small></span>' +
        '<span class="lj-txt"><b>' + t(x.d.t) + '</b><small>' + t(pluriel(x.D.essais, "essai") + (x.D.record != null ? " · record " + x.D.record : "") + (x.D.temps ? " · " + dureeChrono(x.D.temps) : "")) + '</small></span>' + icone("chevron") + '</button></li>';
    }).join("") + '</ul>';
    return h + '<button class="btn" type="button" data-a="aller-a" data-v="exercices" data-s="defis">Tous les défis</button></section>';
  }
  /* Badges : chacun se calcule à partir des données ; un badge non obtenu montre où tu en es. */
  function badges() {
    var l = etat.parties, faites = Object.keys(etat.fait).length, cycles = etat.historique.length;
    var defis = DEFIS.map(function (d) { var D = etatDefi(d.id); return { n: d.niveaux.length, niv: D.niv }; });
    var completes = l.map(function (p) { return { st: statsTrous(p.trous), sc: scorePartie(p) }; });
    var mesures = sacActuel().filter(function (id) { var f = fourchette(mesuresTout()[id] || []); return f && !f.provisoire; }).length;
    var b = [
      { id: "partie1", t: "Première partie", d: "Une partie notée trou par trou", v: Math.min(1, l.length), n: 1 },
      { id: "parties5", t: "Habitué", d: "Cinq parties notées", v: Math.min(5, l.length), n: 5 },
      { id: "seance1", t: "Au practice", d: "Une séance du programme faite", v: Math.min(1, faites), n: 1 },
      { id: "seances10", t: "Assidu", d: "Dix séances ou missions faites", v: Math.min(10, faites + etat.historique.reduce(function (s, h) { return s + (h.faites || 0); }, 0)), n: 10 },
      { id: "cycle", t: "Cycle bouclé", d: "Un cycle de quatre semaines terminé", v: Math.min(1, cycles), n: 1 },
      { id: "defi", t: "Défi relevé", d: "Un niveau de défi validé", v: Math.min(1, defis.filter(function (x) { return x.niv >= 1; }).length), n: 1 },
      { id: "defimax", t: "Maître du défi", d: "Tous les niveaux d’un défi", v: Math.min(1, defis.filter(function (x) { return x.niv >= x.n; }).length), n: 1 },
      { id: "sac", t: "Sac étalonné", d: "Cinq clubs avec une fourchette fiable", v: Math.min(5, mesures), n: 5 },
      { id: "putts", t: "Zéro trois-putts", d: "Une partie de 9 trous ou plus sans trois-putts", v: completes.some(function (x) { return x.st.T >= 9 && !x.st.P3; }) ? 1 : 0, n: 1 },
      { id: "propre", t: "Carte propre", d: "Une partie de 9 trous ou plus sans pénalité", v: completes.some(function (x) { return x.st.T >= 9 && !x.st.X; }) ? 1 : 0, n: 1 },
      { id: "index", t: "Sous ton index", d: "Une partie de 18 trous jouée dans ton handicap", v: !etat.profil.sansIndex && completes.some(function (x) { return x.sc.complet && x.st.T >= 18 && x.sc.ecart <= Math.round(etat.profil.index); }) ? 1 : 0, n: 1 }
    ];
    return b;
  }
  function badgesHTML() {
    var b = badges(), ok = b.filter(function (x) { return x.v >= x.n; }).length;
    return '<section class="bloc" id="badges"><h2>Badges<small class="h2-compte">' + ok + ' sur ' + b.length + '</small></h2><ul class="badges">' + b.map(function (x) {
      var g = x.v >= x.n;
      return '<li class="badge' + (g ? " obtenu" : "") + '" aria-label="' + at(x.t + " : " + x.d + (g ? ". Obtenu." : ". " + x.v + " sur " + x.n + ".")) + '">' + icone("medaille") +
        '<b>' + t(x.t) + '</b><small>' + t(g ? x.d : x.n > 1 ? x.v + " / " + x.n : x.d) + '</small></li>';
    }).join("") + '</ul></section>';
  }
  function historiqueCoachingHTML() {
    var h = etat.historique, l = [];
    h.slice(-4).reverse().forEach(function (c) { l.push({ d: c.fin, t: "Cycle " + c.cycle + " terminé", m: c.faites + " séances sur " + c.total }); });
    DEFIS.forEach(function (d) { (etatDefi(d.id).hist || []).slice(-3).forEach(function (x) { l.push({ d: x.d, t: d.t, m: (x.v != null ? "Résultat : " + x.v : "") + (x.s ? " · " + dureeChrono(x.s) : "") }); }); });
    (etat.carnet.series || []).slice(-3).forEach(function (s) { l.push({ d: s.d, t: "Série · " + nomClub(s.c), m: pluriel(s.v.length, "balle") }); });
    l = l.filter(function (x) { return x.d; }).sort(function (a, b) { return String(b.d).localeCompare(String(a.d)); }).slice(0, 8);
    if (!l.length) return "";
    return '<section class="bloc" id="historique"><h2>Historique</h2><ul class="historique">' + l.map(function (x) {
      return '<li><span class="hist-date">' + t(dateCourte(x.d)) + '</span><span><b>' + t(x.t) + '</b><small>' + t(x.m) + '</small></span></li>';
    }).join("") + '</ul></section>';
  }

  /* ---------- Mon sac : historique des mesures ---------- */
  function historiqueMesuresHTML() {
    var s = (etat.carnet.series || []).slice().reverse(), pts = coupsDuParcours();
    var nParcours = Object.keys(pts).reduce(function (a, k) { return a + pts[k].length; }, 0);
    var h = '<section class="bloc" id="c-historique"><h2>Historique des mesures</h2>';
    if (!s.length && !nParcours) return h + etatVideHTML("sac", "Aucune mesure pour l’instant", "Tape une série de balles au practice, ou note tes coups sur le parcours : tes fourchettes se calculent toutes seules.", "serie-ouvrir", "Faire une série") + '</section>';
    if (nParcours) h += '<p>' + t(pluriel(nParcours, "coup plein") + " noté" + (nParcours > 1 ? "s" : "") + " sur le parcours nourri" + (nParcours > 1 ? "ssent" : "t") + " aussi tes distances.") + '</p>';
    if (s.length) h += '<ul class="historique">' + s.slice(0, 10).map(function (x) {
      var f = fourchette(x.v), dir = x.l ? x.l.filter(function (v) { return v != null; }).length : 0;
      return '<li><span class="hist-date">' + t(dateCourte(x.d)) + '</span><span><b>' + t(nomClub(x.c) + " · " + pluriel(x.v.length, "balle")) + '</b><small>' +
        t((f ? (f.bas === f.haut ? f.bas + " m" : f.bas + "–" + f.haut + " m") : "") + (dir ? " · " + dir + " avec direction" : "")) + '</small></span></li>';
    }).join("") + '</ul>';
    return h + '<button class="btn" type="button" data-a="serie-ouvrir">Nouvelle série</button></section>';
  }

  /* ---------- Jouer : mode de saisie ---------- */
  function modeSaisie() { return etat.modeSaisie === "express" ? "express" : "detail"; }
  function modesHTML() {
    var m = modeSaisie();
    return '<div class="modes" role="group" aria-label="Mode de saisie">' +
      '<button class="mode" type="button" data-a="mode-saisie" data-v="express" aria-pressed="' + (m === "express") + '"><b>Score express</b><small>Score, putts et pénalités : deux touchers par trou</small></button>' +
      '<button class="mode" type="button" data-a="mode-saisie" data-v="detail" aria-pressed="' + (m === "detail") + '"><b>Performance détaillée</b><small>En plus : coups, clubs, distances, stratégie, erreurs</small></button></div>';
  }
  ACTIONS["mode-saisie"] = function (el) {
    etat.modeSaisie = el.getAttribute("data-v") === "express" ? "express" : "detail"; sauver();
    if (ui.partie) { ui.pvCoup = null; ui.pvPanneau = null; rendrePartie(); focusPartie('[data-a="mode-saisie"][data-v="' + etat.modeSaisie + '"]'); }
    else rendreEtFocus(el);
    message(etat.modeSaisie === "express" ? "Mode score express" : "Mode performance détaillée");
  };
