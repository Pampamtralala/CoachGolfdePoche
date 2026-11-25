  /* ============================================================
     STRATÉGIE ET CHOIX DE CLUB : fourchette jouable, ellipse de dispersion (avec un point à poser du doigt),
     calculateur « se joue comme » et visée anti-pénalité, dans le pavé de la partie.
     ============================================================ */

  /* ---------- Données d'un club ---------- */
  /* Coups notés avec une direction : balles des séries et coups pleins du parcours. */
  function pointsClub(id) {
    var l = [];
    (etat.carnet.series || []).forEach(function (s) {
      if (s.c !== id || !s.l) return;
      s.v.forEach(function (d, i) { if (s.l[i] != null) l.push({ d: d, l: s.l[i], src: "serie", date: s.d }); });
    });
    var pts = etat.partie ? partiesAnalyse().concat([etat.partie]) : partiesAnalyse();
    pts.forEach(function (pt) {
      (pt.coups || []).forEach(function (cs, k) {
        (cs || []).forEach(function (c) {
          if (c && c.c === id && (!c.a || c.a === "plein") && coupPlein(c) && c.d != null && c.l != null) l.push({ d: c.d, l: c.l, src: "parcours", date: pt.d, trou: numeroTrou(pt, k) });
        });
      });
    });
    return l.slice(-60);
  }
  function lateralTout(id) { return pointsClub(id).map(function (p) { return p.l; }); }
  function fourchetteDe(id) { return fourchette(mesuresTout()[id] || []); }
  /* Ellipse du club ; sans aucune mesure, une ellipse estimée autour de la distance déduite des clubs voisins. */
  function ellipseDe(id) {
    if (!CLUB[id]) return null;
    var idx = etat.profil.index, e = ellipseClub(mesuresTout()[id] || [], lateralTout(id), idx);
    if (!e) { var est = sacEstimation(id); if (est) { e = ellipseClub([est], [], idx); if (e) e.estimation = true; } }
    return e;
  }
  function clubsFourchettes() { return sacActuel().map(function (id) { return { id: id, f: fourchetteDe(id) }; }); }
  function libFourchette(f) { return !f ? "?" : f.bas === f.haut ? f.bas + " m" : f.bas + "–" + f.haut + " m"; }
  function libLat(l) { return l == null ? "Direction non notée" : l === 0 ? "Dans l’axe" : Math.abs(l) + " m à " + (l < 0 ? "gauche" : "droite"); }

  /* ---------- Ellipse de dispersion, vue de dessus ----------
     L'axe vertical est la ligne de visée, l'horizontale la distance habituelle du club. */
  var ELL = { W: 320, H: 236, cx: 160, cy: 108, dx: 138, dy: 88 };
  function echelleEll(ell, pts) {
    var rx = 20, ry = 15;
    if (ell) { rx = Math.max(rx, Math.abs(ell.cx) + ell.rx * 1.35); ry = Math.max(ry, ell.ry * 1.6); }
    (pts || []).forEach(function (p) { rx = Math.max(rx, Math.abs(p.x) + 3); ry = Math.max(ry, Math.abs(p.y) + 3); });
    return { rx: Math.min(60, Math.ceil(rx / 5) * 5), ry: Math.min(60, Math.ceil(ry / 5) * 5) };
  }
  function ellipseSVG(o) {
    var sc = o.sc, kx = ELL.dx / sc.rx, ky = ELL.dy / sc.ry, e = o.ell;
    var X = function (m) { return (ELL.cx + Math.max(-sc.rx, Math.min(sc.rx, m)) * kx).toFixed(1); };
    var Y = function (m) { return (ELL.cy - Math.max(-sc.ry, Math.min(sc.ry, m)) * ky).toFixed(1); };
    var pas = sc.rx > 30 ? 20 : 10, pasY = sc.ry > 25 ? 10 : 5, h = '<svg class="ell" viewBox="0 0 ' + ELL.W + ' ' + ELL.H + '" ' + (o.aria ? 'role="img" aria-label="' + at(o.aria) + '"' : 'aria-hidden="true" focusable="false"') + '>' +
      '<rect class="ell-fond" x="' + (ELL.cx - ELL.dx - 8) + '" y="' + (ELL.cy - ELL.dy - 10) + '" width="' + (2 * ELL.dx + 16) + '" height="' + (2 * ELL.dy + 20) + '" rx="14"/>';
    for (var x = pas; x < sc.rx; x += pas) h += '<line class="ell-grille" x1="' + X(x) + '" x2="' + X(x) + '" y1="' + (ELL.cy - ELL.dy - 4) + '" y2="' + (ELL.cy + ELL.dy + 4) + '"/><line class="ell-grille" x1="' + X(-x) + '" x2="' + X(-x) + '" y1="' + (ELL.cy - ELL.dy - 4) + '" y2="' + (ELL.cy + ELL.dy + 4) + '"/>';
    for (var y = pasY; y < sc.ry; y += pasY) h += '<line class="ell-grille" x1="' + (ELL.cx - ELL.dx) + '" x2="' + (ELL.cx + ELL.dx) + '" y1="' + Y(y) + '" y2="' + Y(y) + '"/><line class="ell-grille" x1="' + (ELL.cx - ELL.dx) + '" x2="' + (ELL.cx + ELL.dx) + '" y1="' + Y(-y) + '" y2="' + Y(-y) + '"/>';
    h += '<line class="ell-axe" x1="' + ELL.cx + '" x2="' + ELL.cx + '" y1="' + (ELL.cy - ELL.dy - 6) + '" y2="' + (ELL.cy + ELL.dy + 6) + '"/>' +
      '<line class="ell-axe" x1="' + (ELL.cx - ELL.dx) + '" x2="' + (ELL.cx + ELL.dx) + '" y1="' + ELL.cy + '" y2="' + ELL.cy + '"/>';
    if (e) {
      h += '<ellipse class="ell-zone' + (e.estimeeL || e.estimeeP ? " estimee" : "") + '" cx="' + X(e.cx) + '" cy="' + ELL.cy + '" rx="' + (e.rx * kx).toFixed(1) + '" ry="' + (e.ry * ky).toFixed(1) + '"/>' +
        '<path class="ell-centre" d="M' + (X(e.cx) - 5) + ' ' + ELL.cy + 'h10M' + X(e.cx) + ' ' + (ELL.cy - 5) + 'v10"/>';
    }
    (o.pts || []).forEach(function (p, i) {
      var sel = o.sel === i;
      h += '<g class="ell-pt' + (p.src === "parcours" ? " parcours" : "") + (sel ? " sel" : "") + '"' + (o.actionPt ? ' data-a="' + o.actionPt + '" data-v="' + i + '"' : '') + '>' +
        (o.actionPt ? '<circle class="ell-cible-pt" cx="' + X(p.x) + '" cy="' + Y(p.y) + '" r="13"/>' : '') +
        (p.src === "parcours" ? '<rect class="ell-balle" x="' + (X(p.x) - (sel ? 7 : 5)) + '" y="' + (Y(p.y) - (sel ? 7 : 5)) + '" width="' + (sel ? 14 : 10) + '" height="' + (sel ? 14 : 10) + '" rx="2"/>'
          : '<circle class="ell-balle" cx="' + X(p.x) + '" cy="' + Y(p.y) + '" r="' + (sel ? 7.5 : 5.5) + '"/>') + '</g>';
    });
    if (o.nouveau) {
      var nx = X(o.nouveau.x), ny = Y(o.nouveau.y);
      h += '<g class="ell-nouveau"><line x1="' + nx + '" x2="' + nx + '" y1="' + (ELL.cy - ELL.dy) + '" y2="' + (ELL.cy + ELL.dy) + '"/><line x1="' + (ELL.cx - ELL.dx) + '" x2="' + (ELL.cx + ELL.dx) + '" y1="' + ny + '" y2="' + ny + '"/>' +
        '<circle cx="' + nx + '" cy="' + ny + '" r="9"/></g>';
    }
    h += '<text class="ell-lib" x="' + (ELL.cx - ELL.dx) + '" y="' + (ELL.H - 6) + '">← gauche</text><text class="ell-lib" x="' + (ELL.cx + ELL.dx) + '" y="' + (ELL.H - 6) + '" text-anchor="end">droite →</text>' +
      '<text class="ell-lib" x="' + ELL.cx + '" y="' + (ELL.H - 6) + '" text-anchor="middle">' + (pas + " m entre deux lignes") + '</text>' +
      '<text class="ell-lib" x="' + (ELL.cx + ELL.dx - 4) + '" y="' + (ELL.cy - 5) + '" text-anchor="end">' + (o.ref ? o.ref + " m" : "") + '</text>' +
      '<text class="ell-lib" x="' + (ELL.cx + 5) + '" y="' + (ELL.cy - ELL.dy + 6) + '">long</text><text class="ell-lib" x="' + (ELL.cx + 5) + '" y="' + (ELL.cy + ELL.dy - 1) + '">court</text>';
    return h + '</svg>';
  }

  /* ---------- Poser un point sur l'ellipse : où la balle s'est arrêtée ----------
     Coup en partie : le point ne donne que la direction (gauche ou droite), la distance se tape à part.
     Série au practice : le point donne aussi la distance si elle n'a pas été tapée. */
  function poseurHTML(o) {
    var e = o.ell, pts = (o.pts || []).map(function (p) { return { x: p.l, y: e ? p.d - e.d : 0, src: p.src }; });
    var sc = echelleEll(e, pts), nv = o.l != null ? { x: o.l, y: o.dd || 0 } : null;
    return '<div class="ell-poseur"><p class="ell-titre">' + t(o.titre || "Où la balle s'est-elle arrêtée ?") + '</p>' +
      '<button class="ell-cible" type="button" data-a="ell-poser" data-ctx="' + o.ctx + '" data-rx="' + sc.rx + '" data-ry="' + sc.ry + '" data-ref="' + (e ? e.d : "") + '" aria-label="' +
      at((o.ctx === "coup" ? "Touche l'ellipse à gauche ou à droite de la ligne de visée, là où la balle est partie. " : "Touche l'endroit où la balle s'est arrêtée : à gauche ou à droite de la ligne de visée, plus court ou plus long que d'habitude. ") + libLat(o.l) + ".") + '">' +
      ellipseSVG({ ell: e, pts: pts, sc: sc, nouveau: nv, ref: e ? e.d : null }) + '</button>' +
      '<div class="ell-reglage"><button class="pv-pm petit" type="button" data-a="ell-l" data-ctx="' + o.ctx + '" data-d="-1" aria-label="Un mètre plus à gauche">◀</button>' +
      '<p aria-live="polite"><b>' + t(libLat(o.l)) + '</b>' + (o.l != null ? '<button class="lien" type="button" data-a="ell-l" data-ctx="' + o.ctx + '" data-d="x">Effacer</button>' : '<small>' + t("facultatif : un toucher sur l'ellipse") + '</small>') + '</p>' +
      '<button class="pv-pm petit" type="button" data-a="ell-l" data-ctx="' + o.ctx + '" data-d="1" aria-label="Un mètre plus à droite">▶</button></div></div>';
  }
  ACTIONS["ell-poser"] = function (el, ev) {
    if (!ev || ev.detail === 0) { var b = el.parentNode.querySelector('[data-a="ell-l"]'); if (b) b.focus(); return; }
    var r = el.getBoundingClientRect(), svg = el.querySelector("svg"), rs = svg ? svg.getBoundingClientRect() : r;
    var px = (ev.clientX - rs.left) / rs.width * ELL.W, py = (ev.clientY - rs.top) / rs.height * ELL.H;
    var rx = parseFloat(el.getAttribute("data-rx")), ry = parseFloat(el.getAttribute("data-ry"));
    var l = Math.max(-60, Math.min(60, Math.round((px - ELL.cx) / ELL.dx * rx))), dd = Math.round((ELL.cy - py) / ELL.dy * ry);
    poserPoint(el.getAttribute("data-ctx"), l, Math.max(-ry, Math.min(ry, dd)), parseInt(el.getAttribute("data-ref"), 10));
  };
  ACTIONS["ell-l"] = function (el) {
    var ctx = el.getAttribute("data-ctx"), d = el.getAttribute("data-d"), cur = ctx === "coup" ? (ui.pvCoup || {}).l : (ui.serie || {}).lp;
    if (d === "x") poserPoint(ctx, null, null, null);
    else poserPoint(ctx, Math.max(-60, Math.min(60, (cur == null ? 0 : cur) + parseInt(d, 10))), undefined, null);
    var b = document.querySelector('[data-a="ell-l"][data-ctx="' + ctx + '"][data-d="' + (d === "x" ? "1" : d) + '"]'); if (b) b.focus({ preventScroll: true });
  };
  /* dd undefined : seule la direction change (réglage au bouton). */
  function poserPoint(ctx, l, dd, ref) {
    if (ctx === "coup") {
      var C = ui.pvCoup; if (!C) return;
      /* Seule la direction compte : la hauteur du toucher ne change pas la distance. */
      C.l = l;
      rendrePartie();
    } else if (ctx === "serie") {
      var S = ui.serie; if (!S) return;
      S.lp = l;
      var inp = document.getElementById("serie-val");
      if (l == null) S.ddp = null;
      else if (dd !== undefined) {
        S.ddp = dd;
        if (inp && ref > 0 && (inp.value.trim() === "" || S.dTap)) { inp.value = Math.max(5, Math.min(400, ref + dd)); S.dTap = true; }
      }
      majPoseurSerie();
    }
  }

  /* ---------- Fiche d'un club : fourchette jouable et ellipse, points touchables ---------- */
  function ellipseClubHTML(id) {
    var e = ellipseDe(id); if (!e || e.estimation) return "";
    var f = e.f, pts = pointsClub(id), sel = ui.ellSel && ui.ellSel.id === id ? ui.ellSel.i : null;
    var vus = pts.map(function (p) { return { x: p.l, y: p.d - e.d, src: p.src }; }), sc = echelleEll(e, vus);
    var p = sel != null ? pts[sel] : null;
    var h = '<div class="sac-ellipse"><h3>Fourchette jouable</h3>' +
      '<p class="ell-fourchette"><span class="main">' + libFourchette(f).replace(" m", "") + '</span> m</p>' +
      '<p class="aide">' + t(f.provisoire ? "Provisoire : il faut " + FOURCHETTE_MIN + " coups pleins pour une fourchette fiable (" + pluriel(f.n, "coup") + " pour l'instant)."
        : "La moitié de tes coups pleins tombe dans cette fourchette, sur " + pluriel(f.n, "coup") + (f.ecartes ? " (" + pluriel(f.ecartes, "coup raté") + " écarté" + (f.ecartes > 1 ? "s" : "") + " : moins de 60 % de ta distance habituelle)" : "") + ".") + '</p>' +
      '<h3>Ellipse de dispersion</h3>' +
      ellipseSVG({ ell: e, pts: vus, sc: sc, sel: sel, ref: e.d, actionPt: "ell-point",
        aria: "Ellipse de dispersion : 80 % des balles à moins de " + e.rx + " m de l'axe" + (e.cx ? ", avec une tendance de " + libLat(e.cx) : "") + ", et à plus ou moins " + e.ry + " m de " + e.d + " m. " + pluriel(vus.length, "coup") + " noté" + (vus.length > 1 ? "s" : "") + " avec sa direction." }) +
      '<p class="ell-legende" id="ell-legende" aria-live="polite">' + t(p ? (p.src === "serie" ? "Balle de série du " : "Coup du trou " + p.trou + ", partie du ") + dateCourte(p.date) + " : " + p.d + " m, " + libLat(p.l).toLowerCase() + "."
        : vus.length ? "80 % de tes balles tombent dans l'ellipse. Touche un point pour voir le coup." : "80 % de tes balles tombent dans l'ellipse.") + '</p>' +
      (vus.some(function (q) { return q.src === "parcours"; }) && vus.some(function (q) { return q.src !== "parcours"; }) ? '<p class="ell-cle"><span class="rond"></span>practice<span class="carre"></span>parcours</p>' : '') +
      '<dl class="disp-chiffres"><div><dt>Latéral</dt><dd><span class="main">±' + e.rx + '</span> m</dd></div>' +
      '<div><dt>Tendance</dt><dd>' + (e.estimeeL ? "–" : e.cx ? '<span class="main">' + Math.abs(e.cx) + '</span> m ' + (e.cx < 0 ? "à gauche" : "à droite") : "dans l’axe") + '</dd></div>' +
      '<div><dt>Fiable à 90 %</dt><dd>' + (f.p10 ? '<span class="main">' + f.p10 + '</span> m' : "–") + '</dd></div></dl>' +
      (e.estimeeL ? '<p class="aide">' + t("Largeur estimée d'après ton index. Note la direction de tes balles en série ou sur le parcours (un toucher sur l'ellipse) : dès " + FOURCHETTE_MIN + " coups, elle se mesure.") + '</p>' : '');
    return h + '</div>';
  }
  ACTIONS["ell-point"] = function (el) {
    var f = ui.feuille, id = f && f.sac; if (!id) return;
    var i = parseInt(el.getAttribute("data-v"), 10);
    ui.ellSel = ui.ellSel && ui.ellSel.id === id && ui.ellSel.i === i ? null : { id: id, i: i };
    var bloc = document.querySelector("#feuille .sac-ellipse");
    if (bloc) { var tmp = document.createElement("div"); tmp.innerHTML = ellipseClubHTML(id); bloc.parentNode.replaceChild(tmp.firstChild, bloc); }
  };

  /* ---------- « Se joue comme » ---------- */
  /* Conditions de la partie : celles du jour par défaut (vent noté, température). */
  function condPartie() {
    var p = etat.partie; if (!p) return {};
    if (!p.cond) {
      var c = conditionsDuJour();
      p.cond = { vent: null, force: c ? [0, 0, 2, 3][c.vent] || 0 : 0, temp: c ? [null, "froid", "normal", "chaud"][c.temp] : null };
    }
    return p.cond;
  }
  /* Distance au drapeau : celle notée sur ce trou, sinon le milieu du green d'après la carte GPS, sinon la longueur du trou moins les coups notés. */
  function distanceDrapeau() {
    var p = etat.partie; if (!p) return null;
    if (ui.sjc && ui.sjc.h === p.i && ui.sjc.brut) return ui.sjc.brut;
    var dc = distancesCourantes(); if (dc && !dc.sur && dc.milieu >= 3) return dc.milieu;
    var lg = longueurTrou(p, p.i); if (!lg) return null;
    var fait = coupsDuTrou(p, p.i).reduce(function (s, c) { return s + (c.d || 0); }, 0);
    return lg - fait >= 5 ? lg - fait : null;
  }
  function etatSjc() {
    var p = etat.partie; if (!ui.sjc || ui.sjc.h !== p.i) ui.sjc = { h: p.i, brut: null, pente: 0 };
    return ui.sjc;
  }
  function calculSjc() {
    var brut = distanceDrapeau(); if (!brut) return null;
    var c = condPartie(), s = etatSjc(), r = seJoueComme(brut, { vent: c.vent, force: c.force, temp: c.temp, pente: s.pente });
    var club = clubPour(r.d, clubsFourchettes());
    return { brut: brut, r: r, club: club };
  }
  function sjcLigneHTML() {
    var k = calculSjc();
    if (!k) return '<button class="pv-sjc vide" type="button" data-a="sjc-ouvrir"><span>Distance au drapeau</span><b>à noter</b>' + icone("chevron") + '</button>';
    var ch = k.r.d !== k.brut;
    return '<button class="pv-sjc" type="button" data-a="sjc-ouvrir" aria-label="' + at("Drapeau à " + k.brut + " mètres" + (ch ? ", se joue comme " + k.r.d + " mètres" : "") + (k.club ? ". Club conseillé : " + nomClub(k.club.id) : "") + ". Toucher pour ajuster") + '">' +
      '<span class="sjc-brut">' + k.brut + ' m</span>' + (ch ? '<span class="sjc-fleche" aria-hidden="true">→</span><span class="sjc-res">se joue comme <b class="main">' + k.r.d + '</b> m</span>' : '<span class="sjc-res">au drapeau</span>') +
      (k.club ? '<span class="sjc-club">' + t(nomClub(k.club.id)) + '</span>' : '') + '</button>';
  }
  function choixLigne(action, l, cur, attr) {
    return '<div class="sjc-choix" role="group">' + l.map(function (x) {
      return '<button type="button" data-a="' + action + '" data-v="' + x.v + '" aria-pressed="' + (cur === x.v) + '"' + (attr || "") + '>' + t(x.t) + '</button>';
    }).join("") + '</div>';
  }
  function sjcPanneauHTML() {
    var k = calculSjc(), c = condPartie(), s = etatSjc(), brut = distanceDrapeau();
    var h = '<div class="pv-voile" data-a="sjc-fermer" aria-hidden="true"></div><div class="pv-panneau sjc" role="dialog" aria-modal="true" aria-labelledby="sjc-titre">' +
      '<h3 id="sjc-titre">Se joue comme</h3>' +
      '<div class="sjc-dist"><span>Drapeau</span><div class="pv-dist-reglage">' +
      [-10, -1].map(function (d) { return '<button class="pv-pm petit" type="button" data-a="sjc-brut" data-d="' + d + '" aria-label="' + at(Math.abs(d) + " mètre" + (d < -1 ? "s" : "") + " de moins") + '">' + d + '</button>'; }).join("") +
      '<output class="sjc-val" aria-live="polite">' + (brut ? brut + " m" : "?") + '</output>' +
      [1, 10].map(function (d) { return '<button class="pv-pm petit" type="button" data-a="sjc-brut" data-d="' + d + '" aria-label="' + at(d + " mètre" + (d > 1 ? "s" : "") + " de plus") + '">+' + d + '</button>'; }).join("") + '</div></div>';
    if (s.brut && distancesCourantes()) h += '<button class="lien" type="button" data-a="sjc-carte">Reprendre la distance de la carte GPS</button>';
    h += '<p class="sjc-lib">Vent</p>' + choixLigne("sjc-vent", [{ v: "", t: "Sans" }].concat(VENT_DIRS.map(function (x) { return { v: x.id, t: x.nom }; })), c.vent || "");
    if (c.vent) h += choixLigne("sjc-force", [1, 2, 3].map(function (f) { return { v: String(f), t: VENT_FORCES[f] }; }), String(c.force || 0));
    h += '<p class="sjc-lib">Dénivelé</p><div class="pv-dist-reglage sjc-pente">' +
      [-5, -1].map(function (d) { return '<button class="pv-pm petit" type="button" data-a="sjc-pente" data-d="' + d + '" aria-label="' + at(Math.abs(d) + " mètre" + (d < -1 ? "s" : "") + " plus bas") + '">' + d + '</button>'; }).join("") +
      '<output class="sjc-val" aria-live="polite">' + (s.pente ? (s.pente > 0 ? "Montée " + s.pente : "Descente " + (-s.pente)) + " m" : "À plat") + '</output>' +
      [1, 5].map(function (d) { return '<button class="pv-pm petit" type="button" data-a="sjc-pente" data-d="' + d + '" aria-label="' + at(d + " mètre" + (d > 1 ? "s" : "") + " plus haut") + '">+' + d + '</button>'; }).join("") + '</div>' +
      '<p class="sjc-lib">Température</p>' + choixLigne("sjc-temp", TEMPERATURES.map(function (x) { return { v: x.id, t: x.nom }; }), c.temp || "normal");
    if (k) {
      h += '<div class="sjc-resultat" aria-live="polite"><p><span>Se joue comme</span><b class="main">' + k.r.d + '</b><span>m</span></p>' +
        (k.r.detail.length ? '<ul>' + k.r.detail.map(function (x) { return '<li>' + t(x.lib) + ' : ' + (x.m > 0 ? "+" : x.m < 0 ? "−" : "") + Math.abs(x.m) + ' m</li>'; }).join("") + '</ul>' : '') +
        (k.r.derive ? '<p class="aide">' + t("Le vent déporte la balle d'environ " + Math.abs(k.r.derive) + " m vers la " + (k.r.derive > 0 ? "droite" : "gauche") + " : l'outil de visée en tient compte.") + '</p>' : '') + '</div>' +
        sjcClubsHTML(k);
    } else h += '<p class="aide">' + t("Note la distance au drapeau avec les boutons, ou la longueur du trou en haut du pavé.") + '</p>';
    h += '<div class="pv-panneau-pied"><button class="btn" type="button" data-a="sjc-fermer">Fermer</button>' +
      (k ? '<button class="btn principal" type="button" data-a="strat-ouvrir">Quel club, quelle cible ?</button>' : '') + '</div></div>';
    return h;
  }
  /* Le sac, club conseillé surligné, avec la fourchette de chaque club. */
  function sjcClubsHTML(k) {
    var l = clubsFourchettes().filter(function (c) { return c.f; });
    if (!l.length) return '<p class="aide">' + t("Note des distances dans ton sac pour que l'appli conseille un club.") + '</p>';
    var club = k.club ? CLUB[k.club.id] : null;
    return '<p class="sjc-conseil">' + (club ? t((k.club.dans ? "Ton club : " : "Le plus proche : ") + nomClub(club.id) + " · " + libFourchette(fourchetteDe(club.id))) : "") + '</p>' +
      '<div class="sjc-sac" aria-hidden="true">' + Sac3D.scene(clubsScene(analyseCarnet(mesuresTout(), sacActuel()), true), { pre: "s3j", mini: true, sel: k.club ? k.club.id : null }) + '</div>' +
      '<ol class="sjc-clubs">' + l.map(function (c) {
        var on = k.club && k.club.id === c.id;
        return '<li' + (on ? ' class="conseil"' : '') + '><b>' + t(courtSac(CLUB[c.id]).replace(/^(\d)$/, "Fer $1")) + '</b><span>' + t(libFourchette(c.f)) + '</span></li>';
      }).join("") + '</ol>';
  }
  function rePanneau(sel) { sauver(); rendrePartie(); if (sel) focusPartie(sel); }
  ACTIONS["sjc-ouvrir"] = function () { if (!etat.partie) return; ui.pvCoup = null; ui.pvPanneau = "sjc"; rendrePartie(); focusPartie('[data-a="sjc-brut"][data-d="1"]'); };
  ACTIONS["sjc-fermer"] = function () { ui.pvPanneau = null; rendrePartie(); focusPartie('[data-a="sjc-ouvrir"]'); };
  ACTIONS["sjc-brut"] = function (el) {
    var s = etatSjc(), b = distanceDrapeau() || 150;
    s.brut = Math.max(5, Math.min(400, b + parseInt(el.getAttribute("data-d"), 10)));
    rePanneau('[data-a="sjc-brut"][data-d="' + el.getAttribute("data-d") + '"]');
  };
  ACTIONS["sjc-vent"] = function (el) {
    var c = condPartie(), v = el.getAttribute("data-v");
    c.vent = VENT_DIRS.some(function (x) { return x.id === v; }) ? v : null;
    if (c.vent && !c.force) c.force = 2;
    rePanneau('[data-a="sjc-vent"][data-v="' + v + '"]');
  };
  ACTIONS["sjc-force"] = function (el) { var c = condPartie(); c.force = Math.max(1, Math.min(3, parseInt(el.getAttribute("data-v"), 10) || 1)); rePanneau('[data-a="sjc-force"][data-v="' + c.force + '"]'); };
  ACTIONS["sjc-pente"] = function (el) {
    var s = etatSjc(); s.pente = Math.max(-PENTE_MAX, Math.min(PENTE_MAX, (s.pente || 0) + parseInt(el.getAttribute("data-d"), 10)));
    rePanneau('[data-a="sjc-pente"][data-d="' + el.getAttribute("data-d") + '"]');
  };
  ACTIONS["sjc-temp"] = function (el) {
    var c = condPartie(), v = el.getAttribute("data-v"); c.temp = TEMPERATURES.some(function (x) { return x.id === v; }) ? v : null;
    rePanneau('[data-a="sjc-temp"][data-v="' + v + '"]');
  };

  /* ---------- Quel club, quelle cible ? ----------
     Dangers autour du green (retenus pour ce trou du parcours), taille du green, drapeau posé du doigt ;
     l'ellipse du club conseillé se place là où il faut viser. */
  function dangersTrou() {
    var p = etat.partie, pc = parcoursDe(p.pc), h = trouPhysique(p, p.i);
    if (pc) { if (!pc.dangers) pc.dangers = pc.pars.map(function () { return null; }); if (!pc.greens) pc.greens = pc.pars.map(function () { return "m"; }); }
    if (!ui.strat || ui.strat.h !== p.i) ui.strat = { h: p.i, drapeau: { p: "milieu", c: "centre" }, dangers: pc ? (pc.dangers[h] || {}) : {}, green: pc ? pc.greens[h] || "m" : "m" };
    return ui.strat;
  }
  function memoriserDangers() {
    var p = etat.partie, pc = parcoursDe(p.pc), S = ui.strat; if (!pc || !S) return;
    var h = trouPhysique(p, p.i), d = {}, n = 0;
    COTES_GREEN.forEach(function (k) { if (S.dangers[k.id]) { d[k.id] = S.dangers[k.id]; n++; } });
    pc.dangers[h] = n ? d : null; pc.greens[h] = S.green;
  }
  function calculStrat() {
    var k = calculSjc(); if (!k || !k.club) return null;
    var S = dangersTrou(), ell = ellipseDe(k.club.id); if (!ell) return null;
    var v = viser({ ell: ell, derive: k.r.derive, green: S.green, drapeau: S.drapeau, dangers: S.dangers });
    var dvis = k.r.d + v.visee.ay, club = clubPour(dvis, clubsFourchettes());
    var ell2 = club && club.id !== k.club.id ? ellipseDe(club.id) : null;
    if (ell2) { v = viser({ ell: ell2, derive: k.r.derive, green: S.green, drapeau: S.drapeau, dangers: S.dangers }); ell = ell2; }
    return { k: k, S: S, v: v, ell: ell, club: club || k.club };
  }
  /* Vue de dessus du green : dangers, drapeau, point visé et ellipse. 1 m = k px. */
  function greenSVG(x) {
    var g = x.v.geo, W = 300, vi0 = x.v.visee;
    /* L'échelle cadre le green, ses dangers, le point visé et l'ellipse. */
    var xr = Math.max(-g.L, g.R, Math.abs(vi0.mx) + x.ell.rx, Math.abs(vi0.ax)) + 10, yr = Math.max(-g.B, g.F, Math.abs(vi0.my) + x.ell.ry, Math.abs(vi0.ay)) + 10;
    var k = Math.min(7, 136 / xr, 104 / yr), H = Math.round(Math.max(170, Math.min(250, 2 * yr * k + 40))), cx = 150, cy = Math.round(H / 2 - 6);
    var X = function (m) { return (cx + m * k).toFixed(1); }, Y = function (m) { return (cy - m * k).toFixed(1); };
    var h = '<svg class="strat-svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + at(libStrat(x)) + '">' +
      '<rect class="strat-fond" x="0" y="0" width="' + W + '" height="' + H + '" rx="16"/>';
    var bande = Math.min(30, 8 * k);
    COTES_GREEN.forEach(function (c) {
      var dz = x.S.dangers[c.id]; if (!dz) return;
      var r = c.id === "g" ? [X(g.L) - bande, Y(g.F) - 4, bande, (g.F - g.B) * k + 8] : c.id === "d" ? [+X(g.R), Y(g.F) - 4, bande, (g.F - g.B) * k + 8]
        : c.id === "l" ? [X(g.L) - 4, Y(g.F) - bande, (g.R - g.L) * k + 8, bande] : [X(g.L) - 4, +Y(g.B), (g.R - g.L) * k + 8, bande];
      h += '<rect class="strat-danger ' + dz + '" x="' + (+r[0]).toFixed(1) + '" y="' + (+r[1]).toFixed(1) + '" width="' + (+r[2]).toFixed(1) + '" height="' + (+r[3]).toFixed(1) + '" rx="6"/>';
    });
    h += '<rect class="strat-green" x="' + X(g.L) + '" y="' + Y(g.F) + '" width="' + (g.w * k).toFixed(1) + '" height="' + (g.h * k).toFixed(1) + '" rx="' + (6 * k).toFixed(1) + '"/>';
    /* Zones touchables pour poser le drapeau : trois rangs sur trois. */
    ["fond", "milieu", "avant"].forEach(function (pp, i) {
      ["gauche", "centre", "droite"].forEach(function (cc, j) {
        h += '<rect class="strat-zone" data-a="strat-drapeau" data-p="' + pp + '" data-c="' + cc + '" x="' + (+X(g.L) + j * g.w * k / 3).toFixed(1) + '" y="' + (+Y(g.F) + i * g.h * k / 3).toFixed(1) + '" width="' + (g.w * k / 3).toFixed(1) + '" height="' + (g.h * k / 3).toFixed(1) + '"/>';
      });
    });
    var vi = x.v.visee, sx = x.ell.rx, sy = x.ell.ry;
    h += '<ellipse class="strat-ell" cx="' + X(vi.mx) + '" cy="' + Y(vi.my) + '" rx="' + (sx * k).toFixed(1) + '" ry="' + (sy * k).toFixed(1) + '"/>' +
      '<g class="strat-drapeau"><line x1="' + X(0) + '" x2="' + X(0) + '" y1="' + Y(0) + '" y2="' + (+Y(0) - 22) + '"/><path d="M' + X(0) + ' ' + (+Y(0) - 22) + 'l12 4.5l-12 4.5z"/><circle cx="' + X(0) + '" cy="' + Y(0) + '" r="2.6"/></g>' +
      '<g class="strat-visee"><circle cx="' + X(vi.ax) + '" cy="' + Y(vi.ay) + '" r="7"/><path d="M' + (+X(vi.ax) - 12) + ' ' + Y(vi.ay) + 'h24M' + X(vi.ax) + ' ' + (+Y(vi.ay) - 12) + 'v24"/></g>' +
      '<text class="ell-lib" x="10" y="' + (H - 10) + '">' + t("Tu joues vers le haut") + '</text><text class="ell-lib" x="' + (W - 10) + '" y="' + (H - 10) + '" text-anchor="end">' + t("Green " + GREENS[x.S.green].nom.toLowerCase() + " · " + g.h + " × " + g.w + " m") + '</text>';
    return h + '</svg>';
  }
  function libStrat(x) {
    var vi = x.v.visee, pc = function (v) { return Math.round(v * 100); };
    return libVisee(vi.ax, vi.ay) + " : " + pc(vi.sur) + " % de ta dispersion reste en sécurité, " + pc(vi.pg) + " % sur le green.";
  }
  function stratPanneauHTML() {
    var x = calculStrat();
    var h = '<div class="pv-voile" data-a="sjc-fermer" aria-hidden="true"></div><div class="pv-panneau strat" role="dialog" aria-modal="true" aria-labelledby="strat-titre">' +
      '<h3 id="strat-titre">Quel club, quelle cible ?</h3>';
    if (!x) return h + '<p class="aide">' + t("Il faut une distance au drapeau et des distances dans ton sac.") + '</p><div class="pv-panneau-pied"><button class="btn" type="button" data-a="sjc-ouvrir">Retour</button></div></div>';
    var vi = x.v.visee, dr = x.v.drapeau, pc = function (v) { return Math.round(v * 100); }, club = CLUB[x.club.id];
    h += '<p class="strat-conseil" aria-live="polite"><b>' + t(libVisee(vi.ax, vi.ay)) + '</b>' + t(pc(vi.sur) + " % de ta dispersion reste en sécurité, dont " + pc(vi.pg) + " % sur le green.") + '</p>' +
      '<p class="strat-club">' + t("Avec " + (club ? leClub(club) : "ton club") + " · " + libFourchette(fourchetteDe(x.club.id)) + (x.k.r.d !== x.k.brut ? " · se joue comme " + x.k.r.d + " m" : "")) + '</p>' +
      (pc(dr.sur) < pc(vi.sur) ? '<p class="aide">' + t("En visant le drapeau : " + pc(dr.sur) + " % en sécurité seulement.") + '</p>' : '');
    var bouton = function (c) {
      var dz = DANGERS.filter(function (d) { return d.id === x.S.dangers[c.id]; })[0];
      return '<button class="strat-cote ' + c.id + (dz ? " " + dz.id : "") + '" type="button" data-a="strat-danger" data-k="' + c.id + '" aria-label="' + at("Danger " + c.nom + " : " + (dz ? dz.nom : "aucun") + ". Toucher pour changer") + '">' +
        '<small>' + t(majuscule(c.nom)) + '</small><b>' + t(dz ? dz.court : "—") + '</b></button>';
    };
    h += '<div class="strat-plan">' + bouton(COTES_GREEN[3]) + '<div class="strat-milieu">' + bouton(COTES_GREEN[0]) + greenSVG(x) + bouton(COTES_GREEN[1]) + '</div>' + bouton(COTES_GREEN[2]) + '</div>' +
      '<p class="aide">' + t("Touche le green pour placer le drapeau, et les côtés pour noter les dangers : rien, bunker, eau, hors-limites.") + '</p>' +
      '<p class="sjc-lib">Taille du green</p>' + choixLigne("strat-green", Object.keys(GREENS).map(function (g) { return { v: g, t: GREENS[g].nom }; }), x.S.green) +
      '<div class="pv-panneau-pied"><button class="btn" type="button" data-a="sjc-ouvrir">Retour</button><button class="btn principal" type="button" data-a="strat-noter" data-id="' + x.club.id + '">' + t("Noter le coup") + '</button></div></div>';
    return h;
  }
  ACTIONS["strat-ouvrir"] = function () { if (!etat.partie) return; dangersTrou(); ui.pvPanneau = "strat"; rendrePartie(); focusPartie('.strat-cote.g'); };
  ACTIONS["strat-danger"] = function (el) {
    var S = dangersTrou(), k = el.getAttribute("data-k"), ids = [null].concat(DANGERS.map(function (d) { return d.id; }));
    if (!COTES_GREEN.some(function (c) { return c.id === k; })) return;
    var i = ids.indexOf(S.dangers[k] || null); S.dangers = Object.assign({}, S.dangers); S.dangers[k] = ids[(i + 1) % ids.length];
    if (!S.dangers[k]) delete S.dangers[k];
    memoriserDangers(); rePanneau('[data-a="strat-danger"][data-k="' + k + '"]');
  };
  ACTIONS["strat-drapeau"] = function (el) {
    var S = dangersTrou(); S.drapeau = { p: el.getAttribute("data-p"), c: el.getAttribute("data-c") };
    rendrePartie();
  };
  ACTIONS["strat-green"] = function (el) { var S = dangersTrou(), g = el.getAttribute("data-v"); if (!GREENS[g]) return; S.green = g; memoriserDangers(); rePanneau('[data-a="strat-green"][data-v="' + g + '"]'); };
  ACTIONS["strat-noter"] = function (el) {
    var id = el.getAttribute("data-id"); ui.pvPanneau = null;
    ACTIONS["pv-coup"]({ getAttribute: function () { return "-1"; } });
    if (ui.pvCoup && CLUB[id]) { ui.pvCoup.c = id; ui.pvCoup.d = null; rendrePartie(); focusPartie('[data-a="pv-club"][data-id="' + id + '"]'); }
  };
