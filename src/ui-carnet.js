  /* ============================================================
     OUTILS : contrôle des données, carnet de distances, coups gagnés
     ============================================================ */
  function objet(v) { return v && typeof v === "object" && !Array.isArray(v) ? v : {}; }
  /* Un trou : quatre réponses, puis score, par et réponses détaillées (voir le moteur).
     Les parties d'avant la carte de score n'ont que les quatre premières valeurs ; celles notées avec le pavé
     en ont onze : le premier putt y suit l'échelle en cinq rangs, puis viennent les erreurs évitables et le bunker. */
  function assainirTrou(tr) {
    if (!Array.isArray(tr) || (tr.length !== 4 && tr.length !== 9 && tr.length !== 11)) return null;
    var j = entier(tr[0], 0, 1, null), g = entier(tr[1], 0, 1, null), p = entier(tr[2], 0, 5, null), x = entier(tr[3], 0, 3, null);
    if (j == null || g == null || p == null || x == null) return null;
    var par = entier(tr[5], 3, 5, 0), sc = par ? entier(tr[4], 1, 15, 0) : 0, onze = tr.length === 11;
    if (sc) sc = Math.max(sc, scoreMini(p, x));
    var v = [j, g, p, x, sc, par, j ? 0 : entier(tr[6], 0, 3, 0), par === 3 ? 0 : entier(tr[7], 0, 4, 0), p ? entier(tr[8], 0, onze ? 5 : 4, 0) : 0];
    if (onze) v.push(entier(tr[9], 0, 7, 0) & (EVIT_DOUBLE | EVIT_PUTT3), entier(tr[10], 0, 2, 0));
    return v;
  }
  /* Un trou noté avant le pavé, repris dans le pavé : onze cases ; seul un premier putt de moins d'un mètre garde son rang. */
  function trouOnze(v) {
    if (!v || v.length >= 11) return v;
    var r = v.slice(0, 9); while (r.length < 9) r.push(0);
    if (r[8] !== 1) r[8] = 0;
    return r.concat([0, 0]);
  }
  function texteCourt(v, max) { return (typeof v === "string" ? v : "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max); }
  function assainirParcours(l) {
    var vus = {};
    return liste(l).map(function (pc) {
      if (!pc || typeof pc !== "object" || !jeton(pc.id) || !/^p\d{1,6}$/.test(pc.id) || vus[pc.id]) return null;
      var pars = liste(pc.pars);
      if (pars.length !== 9 && pars.length !== 18) return null;
      vus[pc.id] = true;
      var lg = liste(pc.longueurs), dz = liste(pc.dangers), gr = liste(pc.greens);
      return { id: pc.id, nom: texteCourt(pc.nom, 40) || "Parcours", pars: pars.map(function (v) { return entier(v, 3, 5, 0); }),
        longueurs: pars.map(function (v, i) { return entier(lg[i], 40, 700, 0); }),
        dangers: pars.map(function (v, i) { return assainirDangers(dz[i]); }),
        greens: pars.map(function (v, i) { return a(GREENS, gr[i]) ? gr[i] : "m"; }),
        sss: null, slope: null, reps: assainirReps(pc), hcp: assainirHcp(pc.hcp, pars.length) };
    }).filter(Boolean).map(function (pc) {
      /* SSS et slope du parcours : ceux du premier repère (anciens calculs). */
      if (pc.reps.length) { pc.sss = pc.reps[0].sss; pc.slope = pc.reps[0].slope; }
      return pc;
    }).slice(0, 20);
  }
  /* Repères : nom, SSS et slope (valeurs 18 trous). Un ancien parcours garde son SSS et son slope comme premier repère. */
  function assainirReps(pc) {
    var l = liste(pc.reps).map(function (r) {
      if (!r || typeof r !== "object") return null;
      var sss = nombre(r.sss) && r.sss >= 50 && r.sss <= 85 ? Math.round(r.sss * 10) / 10 : null, slope = entier(r.slope, 55, 155, null);
      return sss || slope ? { n: texteCourt(r.n, 30), sss: sss, slope: slope } : null;
    }).filter(Boolean).slice(0, 8);
    if (!l.length && ((nombre(pc.sss) && pc.sss >= 50 && pc.sss <= 85) || entier(pc.slope, 55, 155, null))) l.push({ n: "", sss: nombre(pc.sss) && pc.sss >= 50 && pc.sss <= 85 ? Math.round(pc.sss * 10) / 10 : null, slope: entier(pc.slope, 55, 155, null) });
    return l;
  }
  /* Handicap des trous : une valeur de 1 à 18 par trou, sans doublon ; 0 si inconnu. */
  function assainirHcp(l, n) {
    var r = [], vus = {};
    for (var i = 0; i < n; i++) { var v = entier(liste(l)[i], 1, 18, 0); if (v && vus[v]) v = 0; if (v) vus[v] = true; r.push(v); }
    return r.some(Boolean) ? r : null;
  }
  /* Dangers autour d'un green : à gauche, à droite, court, long ; chacun un danger connu ou rien. */
  function assainirDangers(d) {
    var o = objet(d), r = {}, n = 0;
    COTES_GREEN.forEach(function (k) { var v = o[k.id]; if (DANGERS.some(function (x) { return x.id === v; })) { r[k.id] = v; n++; } });
    return n ? r : null;
  }
  /* Coups d'un trou : club connu, distance bornée, amplitude connue, positions GPS plausibles, écart latéral (− à gauche). */
  function assainirCoups(l) {
    return liste(l).slice(0, 15).map(function (c) {
      if (!c || typeof c !== "object" || typeof c.c !== "string" || !a(CLUB, c.c)) return null;
      var g = liste(c.g), gOk = g.length === 4 && g.every(nombre) && Math.abs(g[0]) <= 90 && Math.abs(g[2]) <= 90 && Math.abs(g[1]) <= 180 && Math.abs(g[3]) <= 180;
      var am = AMPLITUDES_COUP.indexOf(c.a) >= 0 && (c.a === "plein" || CLUB[c.c].fam === "w") ? c.a : "plein";
      var r = { c: c.c, d: entier(c.d, 1, 400, null), a: am, g: gOk ? g.map(function (v) { return Math.round(v * 1e6) / 1e6; }) : null }, l = entier(c.l, -60, 60, null);
      r.source = c.source === "gps" && gOk ? "gps" : c.source === "import" ? "import" : c.source === "manuel" ? "manuel" : "inconnu";
      r.distanceType = c.distanceType === "total" ? "total" : c.distanceType === "carry" ? "carry" : "inconnu";
      r.mesureLe = nombre(c.mesureLe) && c.mesureLe > 0 ? c.mesureLe : null;
      if (l != null) r.l = l;
      if (LIES.some(function (x) { return x.id === c.p; })) r.p = c.p;
      if (c.t && TYPES_COUP.some(function (x) { return x.id === c.t; })) r.t = c.t;
      if (c.dm === 1 && r.d) r.dm = 1;
      if (idValide(c.id, "c")) r.id = c.id;
      return r;
    }).filter(Boolean);
  }
  /* Partenaires du mode marqueur : un nom, un score par trou (aligné sur les trous gardés). */
  function assainirJoueurs(l, idx) {
    return liste(l).slice(0, 3).map(function (j) {
      if (!j || typeof j !== "object") return null;
      var nom = texteCourt(j.nom, 20), s = liste(j.s);
      return nom ? { nom: nom, s: idx.map(function (i) { return entier(s[i], 1, 15, null); }) } : null;
    }).filter(Boolean);
  }
  /* Carnet, défis et parties d'une sauvegarde : mêmes règles que le reste, on ne garde
     que des nombres bornés et des identifiants connus. */
  function assainirOutils(o, e) {
    var c = objet(o.carnet), cl = objet(c.clubs), w = objet(c.wedges), lo = objet(c.lofts);
    /* Wedges : lofts précisés pour les wedges de base, wedges ajoutés désignés par leur loft. */
    Object.keys(WEDGES_BASE).forEach(function (id) { if (a(lo, id) && loftValide(lo[id])) e.carnet.lofts[id] = Math.round(lo[id]); });
    var vus = {};
    e.carnet.wedgesPerso = liste(c.wedgesPerso).filter(function (v) { if (!loftValide(v) || vus[Math.round(v)]) return false; vus[Math.round(v)] = true; return true; })
      .map(Math.round).sort(function (x, y) { return x - y; }).slice(0, 8);
    definirWedges(e.carnet.wedgesPerso, e.carnet.lofts);
    /* Séries de balles au practice : un club, une date, les distances et, balle par balle, l'écart latéral (− à gauche). */
    e.carnet.series = liste(c.series).map(function (x) {
      if (!x || typeof x !== "object" || typeof x.c !== "string" || !a(CLUB, x.c)) return null;
      var lb = liste(x.l), v = [], l = [];
      liste(x.v).forEach(function (d, i) { if (nombre(d) && d >= 5 && d <= 400 && v.length < 30) { v.push(Math.round(d)); l.push(entier(lb[i], -60, 60, null)); } });
      if (!v.length) return null;
      var r = { d: dateOk(x.d), c: x.c, v: v };
      if (idValide(x.id, "s")) r.id = x.id;
      if (l.some(function (y) { return y != null; })) r.l = l;
      return r;
    }).filter(Boolean);
    CLUBS.forEach(function (k) {
      if (!a(cl, k.id)) return;
      var l = liste(cl[k.id]).filter(function (v) { return nombre(v) && v >= 5 && v <= 400; }).map(Math.round);
      if (l.length) e.carnet.clubs[k.id] = l;
    });
    /* Composition du sac : clubs connus, sans doublon, du plus long au plus court, 13 au plus. */
    if (Array.isArray(c.sac)) {
      e.carnet.sac = CLUBS.filter(function (k) { return c.sac.indexOf(k.id) >= 0; }).map(function (k) { return k.id; }).slice(0, 13);
    }
    WEDGES.forEach(function (id) {
      if (!a(w, id)) return;
      var r = objet(w[id]), out = {};
      AMPLITUDES.forEach(function (am) {
        if (a(r, am.id) && nombre(r[am.id]) && r[am.id] >= 5 && r[am.id] <= 200) out[am.id] = Math.round(r[am.id]);
      });
      if (Object.keys(out).length) e.carnet.wedges[id] = out;
    });
    var dd = objet(o.defis);
    DEFIS.forEach(function (df) {
      if (!a(dd, df.id) || !dd[df.id] || typeof dd[df.id] !== "object") return;
      var r = dd[df.id], D = defiNeuf();
      D.niv = entier(r.niv, 0, df.niveaux.length, 0);
      D.essais = entier(r.essais, 0, 1e6, 0);
      D.coups = entier(r.coups, 0, 1e7, 0);
      D.ok = Math.min(D.coups, entier(r.ok, 0, 1e7, 0));
      D.record = entier(r.record, 0, df.mode === "compte" ? df.n : 999, 0);
      D.eN = entier(r.eN, 0, 1e6, 0);
      D.parNiv = [0, 1, 2].map(function (i) { return i < D.niv ? entier(liste(r.parNiv)[i], 1, 1e6, 1) : null; });
      D.hist = liste(r.hist).filter(function (x) { return x && nombre(x.v) && x.v >= 0 && x.v <= 999; }).slice(-30)
        .map(function (x) { var h = { d: dateOk(x.d), v: Math.round(x.v) }; if (nombre(x.s) && x.s >= 1 && x.s <= 36000) h.s = Math.round(x.s); return h; });
      D.temps = entier(r.temps, 1, 36000, null);
      var c2 = r.cours;
      if (c2 && typeof c2 === "object") {
        if (df.mode === "serie") D.cours = { s: entier(c2.s, 0, 999, 0), m: entier(c2.m, 0, 999, 0), e: entier(c2.e, 0, 1e6, 0) };
        else {
          var l2 = liste(c2.l).filter(function (v) { return v === 0 || v === 1; }).slice(0, df.n - 1);
          if (l2.length) D.cours = { l: l2 };
        }
        if (D.cours && df.chrono && nombre(c2.t0) && c2.t0 > 1.5e12 && c2.t0 <= Date.now()) D.cours.t0 = c2.t0;
      }
      e.defis[df.id] = D;
    });
    e.parcours = assainirParcours(o.parcours);
    function lien(p) { return typeof p.pc === "string" && e.parcours.some(function (x) { return x.id === p.pc; }) ? p.pc : null; }
    function decalage(p, pc, n) { return pc && p.o === 9 && n <= 9 && e.parcours.filter(function (x) { return x.id === pc; })[0].pars.length === 18 ? 9 : 0; }
    e.parties = liste(o.parties).map(function (p) {
      if (!p || typeof p !== "object") return null;
      var brut = liste(p.trous).slice(0, 18).map(assainirTrou), idx = [], pc = lien(p);
      brut.forEach(function (x, i) { if (x) idx.push(i); });
      var tr = idx.map(function (i) { return brut[i]; });
      if (tr.length < 9) return null;
      var r = { d: dateOk(p.d), trous: tr, pc: pc, o: decalage(p, pc, tr.length) }, cp = liste(p.coups);
      if (idValide(p.id, "p")) r.id = p.id;
      if (pc && entier(p.rep, 0, 7, null) != null) r.rep = p.rep;
      r.validation = idx.map(function (i) { return liste(p.validation)[i] === "confirme" ? "confirme" : "inconnu"; });
      var coups = idx.map(function (i) { return assainirCoups(cp[i]); });
      if (coups.some(function (x) { return x.length; })) r.coups = coups;
      var js = assainirJoueurs(p.joueurs, idx); if (js.length) r.joueurs = js;
      return r;
    }).filter(Boolean);
    var pc = o.partie;
    if (pc && typeof pc === "object" && (pc.n === 9 || pc.n === 18) && Array.isArray(pc.trous)) {
      var tr2 = [], pc2 = lien(pc);
      var crs = pc2 ? e.parcours.filter(function (x) { return x.id === pc2; })[0] : null, dec = decalage(pc, pc2, pc.n);
      for (var i = 0; i < pc.n; i++) {
        var tr = assainirTrou(pc.trous[i]);
        /* Un trou saisi sans par ni score (partie commencée avant la carte de score) est complété. */
        if (tr && !tr[5]) tr[5] = (crs && crs.pars[(dec + i) % crs.pars.length]) || 4;
        if (tr && !tr[4]) tr[4] = scoreSuggere(tr[5], tr[1], tr[2], tr[3]);
        tr2.push(tr);
      }
      e.partie = { d: dateOk(pc.d), n: pc.n, i: entier(pc.i, 0, pc.n - 1, 0), trous: tr2, pc: pc2, o: decalage(pc, pc2, pc.n), validation: tr2.map(function (tr, i) { return liste(pc.validation)[i] === "confirme" ? "confirme" : "suggere"; }) };
      if (pc2 && entier(pc.rep, 0, 7, null) != null) e.partie.rep = pc.rep;
      if (idValide(pc.id, "p")) e.partie.id = pc.id;
      var tous = []; for (var k = 0; k < pc.n; k++) tous.push(k);
      var cp2 = liste(pc.coups);
      e.partie.coups = tous.map(function (k) { return assainirCoups(cp2[k]); });
      e.partie.joueurs = assainirJoueurs(pc.joueurs, tous);
      var cd = objet(pc.cond);
      e.partie.cond = { vent: VENT_DIRS.some(function (x) { return x.id === cd.vent; }) ? cd.vent : null, force: entier(cd.force, 0, 3, 0),
        temp: TEMPERATURES.some(function (x) { return x.id === cd.temp; }) ? cd.temp : null };
    }
    e.detail = o.detail === true;
    e.cartePhoto = o.cartePhoto !== false;
    e.modeSaisie = o.modeSaisie === "detail" ? "detail" : "express";
    /* Historique de l'index : dates et valeurs ; sans historique, le point de départ est l'index actuel. */
    e.indexHist = liste(o.indexHist).map(function (x) { return x && nombre(x.v) && x.v >= -10 && x.v <= 54 ? { d: dateOk(x.d), v: Math.round(x.v * 10) / 10 } : null; }).filter(function (x) { return x && x.d; });
    if (!e.indexHist.length && e.profil && !e.profil.sansIndex && nombre(e.profil.index)) {
      var dm = e.profil.maj; e.indexHist = [{ d: typeof dm === "number" && isFinite(dm) ? new Date(dm).toISOString() : dateOk(dm), v: e.profil.index }];
    }
    e.ecranClair = o.ecranClair === true;
    var co = o.conditions;
    e.conditions = co && typeof co === "object" && typeof co.d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(co.d)
      ? { d: co.d, vent: entier(co.vent, 0, 3, 0), temp: entier(co.temp, 0, 3, 0) } : null;
    /* Objectif d'index : il remplace le « joueur cible » des coups gagnés des anciennes sauvegardes. */
    if (e.profil && e.profil.indexVise == null && OBJ_INDEX.indexOf(o.cibleSG) >= 0) e.profil.indexVise = o.cibleSG;
    /* Identifiants stables : ceux déjà enregistrés sont gardés, les manquants sont calculés (P01). */
    attribuerIds(e);
  }

  /* ---------- Textes ---------- */
  function nb1(v) { return Math.abs(v).toFixed(1).replace(".", ","); }
  function nb2(v) { return Math.abs(v).toFixed(2).replace(".", ","); }
  function signe(v) { return (v > 0 ? "+" : v < 0 ? "−" : "") + nb1(v); }
  function coupsLib(v, mot) { return nb1(v) + " coup" + (Math.abs(v) >= 2 ? "s" : "") + " " + mot + (Math.abs(v) >= 2 ? "s" : ""); }
  function nomSimple(c) { return c.nom.split(",")[0].toLowerCase(); }
  function leClub(c) { var n = nomSimple(c); return (/^h/.test(n) ? "l'" : "le ") + n; }
  function majuscule(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function nomAmplitude(id) {
    if (id === "plein") return "plein swing";
    var am = AMPLITUDES.filter(function (x) { return x.id === id; })[0];
    return am ? am.nom : "";
  }
  function nomPoint(p) { return CLUB[p.w].court + ", " + nomAmplitude(p.a); }

  /* ============================================================
     CARNET : parties, distances par club, matrice de wedges
     ============================================================ */
  VUES.parcours = function () {
    var pt = etat.partie;
    return '<section class="bloc premier"><p class="surtitre">Jouer</p><h1>Ta partie</h1>' +
      (pt || ui.depart ? '' : '<button class="btn principal large cta-partie" type="button" data-a="dp-ouvrir">' + icone("drapeau") + '<span>Nouvelle partie</span></button>') +
      '<p class="sjc-lib">Mode de saisie</p>' + modesHTML() + '</section>' +
      partiesHTML() + parcoursListeHTML() + carteAppelHTML();
  };
  VUES.sac = function () {
    return '<section class="bloc premier"><p class="surtitre">Mon sac</p><h1>Sac et distances</h1><div class="raccourcis"><button class="btn" type="button" data-a="serie-ouvrir">Série de balles</button><button class="btn" type="button" data-a="aller-a" data-v="sac" data-s="c-historique">Historique des mesures</button></div></section>' +
      '<section class="bloc" id="c-distances" style="border-top:0;padding-top:0">' + sacHTML() + distancesHTML() + '</section>' +
      '<section class="bloc" id="c-wedges"><h2>Ma matrice de wedges</h2>' + wedgesHTML() + '</section>' + historiqueMesuresHTML();
  };

  /* Régularité : la dispersion des balles de chaque club, quand au moins un club a plusieurs mesures. */
  function distancesHTML() {
    var an = analyseCarnet(mesuresTout(), sacActuel()), sel = CLUB[ui.club] ? ui.club : "f7";
    if (!an.lignes.some(function (x) { return x.s.n > 1; })) return "";
    return '<div class="sac-regularite"><h3>Régularité par club</h3>' + grapheDistances(an, sel) +
      comment('<p>Distance de vol, en mètres. Le point marque ta moyenne, la barre va de ta balle la plus courte à la plus longue. La moyenne écarte la plus longue et la plus courte à partir de cinq mesures.</p>', "Lire ce graphique") + '</div>';
  }

  /* ---------- Matrice de wedges ---------- */
  function constatsWedges(an) {
    var lo = WEDGE_FENETRE[0], hi = WEDGE_FENETRE[1];
    var h = '<p class="legende"><span><svg class="cle" viewBox="0 0 14 14" aria-hidden="true"><circle class="g-point" cx="7" cy="7" r="5"/></svg> amplitude</span>' +
      '<span><svg class="cle" viewBox="0 0 14 14" aria-hidden="true"><circle class="g-point creux" cx="7" cy="7" r="5"/></svg> plein swing</span>' +
      '<span><svg class="cle large" viewBox="0 0 24 14" aria-hidden="true"><rect class="g-trou" x="1" y="3" width="22" height="8" rx="4"/></svg> trou</span></p>';
    h += '<ul class="constats">' + an.trous.map(function (tr) {
      var txt;
      if (!tr.de) txt = "Rien entre " + lo + " et " + tr.a.v + " m : ta plus petite distance est " + tr.a.v + " m (" + nomPoint(tr.a) + ").";
      else if (!tr.a) txt = "Rien entre " + tr.de.v + " et " + hi + " m : note un wedge moins ouvert, ou ta distance en plein swing.";
      else txt = "Trou de " + tr.ecart + " m entre " + tr.de.v + " m (" + nomPoint(tr.de) + ") et " + tr.a.v + " m (" + nomPoint(tr.a) + ").";
      return '<li class="alerte">' + t(txt) + '</li>';
    }).join("");
    if (an.trous.length) h += '<li>' + t("Pour combler un trou, joue le coup du dessus en descendant les mains de 2 cm sur le grip, puis note la nouvelle distance.") + '</li>';
    else if (an.n >= 6) h += '<li>' + t("Aucun trou de plus de " + WEDGE_TROU + " m entre " + lo + " et " + hi + " m : ta matrice est complète.") + '</li>';
    else h += '<li>' + t("Continue : il faut au moins six distances pour couvrir de " + lo + " à " + hi + " m.") + '</li>';
    return h + '</ul>';
  }

  function grapheWedgesHTML() {
    var an = analyseWedges(wedgesTout(), mesuresTout());
    return an.n ? grapheWedges(an) + constatsWedges(an) : "";
  }

  /* Lignes de la matrice, rangées par loft : tant que le sac n'a pas été composé, les quatre wedges de base ;
     ensuite, les wedges du sac. Un wedge qui a déjà des distances garde toujours sa ligne. */
  function wedgesMatrice() {
    var sac = etat.carnet.sac, w = etat.carnet.wedges;
    var l = WEDGES.filter(function (id) { return (sac ? sac.indexOf(id) >= 0 : !CLUB[id].perso) || w[id]; });
    return l.length ? l : ["pw", "gw", "sw", "lw"];
  }
  function wedgesHTML() {
    var w = etat.carnet.wedges;
    return '<p class="aide">Distance de vol moyenne de chaque combinaison, en mètres.</p>' +
      comment('<p>Trois amplitudes par wedge, comme dans l’exercice de l’horloge : les mains montent à 7 h 30, 9 h ou 10 h 30. Le graphique montre les distances que tu sais faire entre 30 et 80 m, et les trous de plus de 12 m entre deux d’entre elles.</p>') +
      '<div class="defile"><table class="carte-score grille"><thead><tr><th scope="col">Wedge</th>' +
      AMPLITUDES.map(function (am) { return '<th scope="col" class="num">' + t(am.nom) + '</th>'; }).join("") + '</tr></thead><tbody>' +
      wedgesMatrice().map(function (id) {
        return '<tr><th scope="row">' + t(courtSac(CLUB[id])) + ' <small>' + t(CLUB[id].perso ? "" : CLUB[id].petit) + '</small></th>' + AMPLITUDES.map(function (am) {
          var v = w[id] && w[id][am.id];
          return '<td class="num"><input type="text" inputmode="numeric" autocomplete="off" maxlength="3" id="w-' + id + '-' + am.id + '" data-c="wedge" data-w="' + id + '" data-am="' + am.id + '" aria-label="' + at(nomLoft(CLUB[id]) + ", amplitude " + am.nom + ", en mètres") + '" value="' + (v == null ? "" : v) + '"></td>';
        }).join("") + '</tr>';
      }).join("") + '</tbody></table></div>' +
      '<p class="aide">' + t("Les lignes suivent les wedges de ton sac : ajoutes-en un avec son loft depuis « Composer mon sac ».") + '</p>' +
      '<p class="erreur" id="w-err" role="alert" hidden></p>' +
      '<div id="graph-wedges">' + grapheWedgesHTML() + '</div>';
  }

  /* ============================================================
     COUPS GAGNÉS : estimation par secteur face à un joueur cible
     ============================================================ */
  /* Texte de l'infobulle de chaque secteur : le résultat, puis les chiffres qui le fondent. */
  function detailsSG(r) {
    var J = r.joueur, C = r.ref, d = {
      depart: "Mises en jeu ratées qui font manquer le green : toi " + nb1(J.u) + ", cible " + nb1(C.u) + " par partie.",
      attaque: "Greens manqués : toi " + nb1(J.m) + ", cible " + nb1(C.m) + " par partie.",
      petit: J.pm == null ? "" : "Putts par green manqué : toi " + nb2(J.pm) + ", cible " + nb2(C.pm) + ".",
      putting: J.pg == null ? "" : "Putts par green touché : toi " + nb2(J.pg) + ", cible " + nb2(C.pg) + ".",
      penal: "Coups de pénalité : toi " + nb1(J.x) + ", cible " + nb1(C.x) + " par partie.",
      rattrapage: J.e == null ? "Il se mesure avec un score à chaque trou." : "Coups joués en plus pour rejoindre le green : toi " + nb1(J.e) + ", cible " + nb1(C.e) + " par partie."
    };
    r.secteurs.forEach(function (s) {
      d[s.id] = (s.sg == null ? "Non mesuré. " : s.sg === 0 ? "À égalité avec la cible. " : coupsLib(s.sg, s.sg > 0 ? "gagné" : "perdu") + " par partie. ") + d[s.id];
    });
    return d;
  }

  /* Objectif d'index du joueur ; sans objectif choisi, un index repère trois points sous le sien. */
  function indexVise() { var p = etat.profil; return p && p.indexVise != null ? p.indexVise : cibleAuto(p ? p.index : 36); }
  function rangIndexVise() {
    var v = indexVise(), i = OBJ_INDEX.indexOf(v);
    if (i >= 0) return i;
    return OBJ_INDEX.reduce(function (b, x, k) { return Math.abs(x - v) < Math.abs(OBJ_INDEX[b] - v) ? k : b; }, 0);
  }
  function coupsGagnesHTML() {
    var p = etat.profil, cible = indexVise();
    var r = coupsGagnes(etat.parties, cible);
    var h = "";
    if (!r) {
      return { resume: "à mesurer en partie", corps: '<p>Saisis une partie d’au moins 9 trous dans le carnet. L’appli te dira ce qu’il te manque pour jouer l’index que tu vises, et où tu gagnes et perds des coups, secteur par secteur.</p>' +
        '<button class="btn" type="button" data-a="partie-rapide">Commencer une partie</button>' };
    }
    var i = rangIndexVise();
    h += '<div class="cible"><button class="pm" type="button" data-a="sg-cible" data-d="-1" aria-label="Objectif plus ambitieux"' + (i <= 0 ? " disabled" : "") + '>−</button>' +
      '<p aria-live="polite">Face à ton objectif : index <b class="main">' + cible + '</b><small>sur 18 trous</small></p>' +
      '<button class="pm" type="button" data-a="sg-cible" data-d="1" aria-label="Objectif moins ambitieux"' + (i >= OBJ_INDEX.length - 1 ? " disabled" : "") + '>+</button></div>' +
      deuxSecteursHTML(cible) + objectifsHTML(cible) + reperesPlusHTML(cible) +
      '<h3 class="titre-bloc">Coups gagnés ou perdus par secteur</h3>' + grapheSG(r, detailsSG(r));
    h += '<p class="sg-total">' + t(r.total < 0 ? "Au total : environ " + coupsLib(r.total, "perdu") + " par partie."
      : r.total > 0 ? "Au total : environ " + coupsLib(r.total, "gagné") + " par partie." : "Au total : tu es au niveau de cette cible.") + '</p>';
    var mesures = r.secteurs.filter(function (s) { return s.sg != null; });
    var pire = mesures.slice().sort(function (x, y) { return x.sg - y.sg; })[0];
    if (pire && pire.sg <= -0.5) {
      /* Putting : la longueur du premier putt dit s'il faut travailler les longs putts ou les courts. */
      var rl = releveDetail(etat.parties, 90), p3 = rl.p1[1][2] + rl.p1[2][2] + rl.p1[3][2] + rl.p1[4][2];
      if (pire.id === "putting" && p3 >= 3 && rl.p1[4][2] * 2 < p3) pire = { nom: pire.nom, sg: pire.sg, d: "putt_court" };
      h += '<p>' + t("Le secteur qui te coûte le plus : " + pire.nom.toLowerCase() + ", " + coupsLib(pire.sg, "perdu") + " par partie.") + '</p>' +
        '<button class="btn large" type="button" data-a="voir-exos" data-v="' + pire.d + '">' + t("Exercices : " + DOM[pire.d].nom.toLowerCase()) + '</button>';
    } else {
      h += '<p>' + t("Aucun secteur ne te coûte un demi-coup face à cette cible." + (i > 0 ? " Vise un joueur plus fort avec le bouton −." : "")) + '</p>';
    }
    h += '<p class="aide" style="margin-top:12px">' + t("Estimation sur " + r.T + " trous, soit " + pluriel(r.n, "partie") + "." + (r.T < 36 ? " En dessous de 36 trous, lis-la comme une tendance." : "")) + '</p>';
    if (r.joueur.e != null && r.N >= 18 && !r.corriges) {
      h += '<p class="note">Aucun de tes scores n’a été corrigé à la saisie. Si tu joues parfois plus de coups que le score calculé, ajuste-le sur le trou : sinon ton rattrapage est surestimé.</p>';
    }
    function ligne(lib, moi, ref) {
      return '<tr><td>' + t(lib) + '</td><td class="num">' + (moi == null ? '<span class="marque inconnu">–</span>' : '<span class="marque">' + moi + '</span>') + '</td><td class="num rep">' + ref + '</td></tr>';
    }
    h += '<details class="calcul"><summary>Les chiffres du calcul</summary><div class="defile"><table class="carte-score calcul"><thead><tr><th scope="col">Sur 18 trous</th><th scope="col" class="num">Toi</th><th scope="col" class="num">Cible</th></tr></thead><tbody>' +
      ligne("Score au-dessus du par", r.joueur.s == null ? null : signe(r.joueur.s), signe(r.ref.s)) +
      ligne("Mises en jeu ratées qui font manquer le green", nb1(r.joueur.u), nb1(r.ref.u)) +
      ligne("Greens manqués", nb1(r.joueur.m), nb1(r.ref.m)) +
      ligne("Putts par green touché en régulation", r.joueur.pg == null ? null : nb2(r.joueur.pg), nb2(r.ref.pg)) +
      ligne("Putts par green manqué", r.joueur.pm == null ? null : nb2(r.joueur.pm), nb2(r.ref.pm)) +
      ligne("Coups de pénalité", nb1(r.joueur.x), nb1(r.ref.x)) +
      ligne("Coups de rattrapage", r.joueur.e == null ? null : nb1(r.joueur.e), nb1(r.ref.e)) +
      '</tbody></table></div>' +
      '<p class="aide" style="margin-top:10px">Méthode : un green manqué coûte un coup pour le rejoindre, et les coups joués en plus (recentrages, coups grattés, approches en deux fois) sont comptés au rattrapage. Tes putts sont comparés à ceux de la cible : sur les greens touchés pour le putting, sur les greens manqués pour le petit jeu, où le nombre de putts dépend surtout de l’approche. Quand tu notes la longueur du premier putt, la distance laissée revient au coup d’avant et ton putting est jugé à distance égale. ' +
      (r.joueur.s != null && r.N === r.T ? "Avec un score à chaque trou, le total est exactement l’écart entre ton score moyen et celui de la cible. " : "Sans score à chaque trou, une mise en jeu ratée qui fait manquer le green est comptée un demi-coup de plus. ") +
      'Les repères de la cible sont des ordres de grandeur.</p></details>';
    return { resume: (r.total < 0 ? coupsLib(r.total, "perdu") : r.total > 0 ? coupsLib(r.total, "gagné") : "à égalité") + " face à un index " + cible, corps: h };
  }

  /* ---------- Actions du carnet et des coups gagnés ---------- */
  function allerSection(id) {
    var el = document.getElementById(id), pli = el && el.closest ? el.closest(".pli") : null;
    /* Une section repliée s'ouvre avant d'être montrée. */
    if (pli && !pli.classList.contains("ouvert")) { ui.plis[pli.id] = true; rendre(); el = document.getElementById(id); }
    if (el && el.scrollIntoView) el.scrollIntoView({ block: "start" }); else window.scrollTo(0, 0);
  }
  ACTIONS.club = function (el) { ui.club = el.getAttribute("data-v"); rendreEtFocus(el); };
  ACTIONS["sg-cible"] = function (el) {
    var i = rangIndexVise() + parseInt(el.getAttribute("data-d"), 10);
    if (i < 0 || i >= OBJ_INDEX.length) return;
    etat.profil.indexVise = OBJ_INDEX[i];
    sauver(); rendreEtFocus(el);
  };
  ACTIONS["voir-exos"] = function (el) {
    var d = el.getAttribute("data-v");
    ui.filtre.d = a(DOM, d) ? d : "tous";
    allerOnglet("exercices", true);
  };
  ACTIONS["aller-carnet"] = function (el) {
    var cible = el.getAttribute("data-v");
    ui.feuille = null; ui.feuilleRetour = null; ui.retourFocus = null; rendreFeuille();
    allerOnglet(cible === "c-distances" || cible === "c-wedges" ? "distances" : "parties", false); allerSection(cible);
  };

  var CHANGEMENTS = {
    wedge: function (el) {
      var id = el.getAttribute("data-w"), am = el.getAttribute("data-am"), err = document.getElementById("w-err");
      if (WEDGES.indexOf(id) < 0 || !AMPLITUDES.some(function (x) { return x.id === am; })) return;
      var brut = el.value.trim(), v = /^\d+$/.test(brut) ? parseInt(brut, 10) : NaN, w = etat.carnet.wedges;
      if (brut !== "" && (isNaN(v) || v < 5 || v > 200)) {
        el.setAttribute("aria-invalid", "true");
        if (err) { err.textContent = "Entre une distance en mètres, entre 5 et 200, ou laisse la case vide."; err.hidden = false; }
        return;
      }
      el.removeAttribute("aria-invalid"); if (err) err.hidden = true;
      if (brut === "") { if (w[id]) { delete w[id][am]; if (!Object.keys(w[id]).length) delete w[id]; } }
      else { (w[id] = w[id] || {})[am] = v; el.value = String(v); }
      sauver();
      /* Seul le graphique est redessiné : la saisie continue de case en case. */
      var g = document.getElementById("graph-wedges"); if (g) { g.innerHTML = grapheWedgesHTML(); monterGraphes(); }
    }
  };

