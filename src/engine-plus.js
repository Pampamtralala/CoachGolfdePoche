/* ============================================================
   MOTEUR DES OUTILS : carnet de distances, parties, coups gagnés, défis.
   Fonctions pures, sans accès à l'écran.
   ============================================================ */

if (typeof module !== "undefined") {
  Object.assign(globalThis, require("./data-plus.js"), require("./data-strategie.js"));
}

const DEFI = {}; DEFIS.forEach(function (d) { DEFI[d.id] = d; });
const CLUB = {}; CLUBS.forEach(function (c) { CLUB[c.id] = c; });

/* Wedges : chacun a un loft. Les quatre wedges de base ont un loft par défaut que le joueur peut préciser ;
   il peut aussi ajouter des wedges désignés par leur loft (« Wedge 54° », identifiant w54).
   definirWedges met à jour la liste des clubs : les wedges y sont rangés du plus fermé au plus ouvert. */
const WEDGES_BASE = { pw: 46, gw: 50, sw: 56, lw: 60 };
const LOFT_MIN = 40, LOFT_MAX = 66;
function loftValide(v) { return estNombre(v) && Math.round(v) >= LOFT_MIN && Math.round(v) <= LOFT_MAX; }
function definirWedges(perso, lofts) {
  lofts = lofts || {};
  var vus = {};
  perso = (perso || []).filter(function (v) { if (!loftValide(v) || vus[Math.round(v)]) return false; vus[Math.round(v)] = true; return true; }).map(Math.round);
  for (var i = CLUBS.length - 1; i >= 0; i--) if (CLUBS[i].perso) { delete CLUB[CLUBS[i].id]; CLUBS.splice(i, 1); }
  CLUBS.forEach(function (c) {
    if (c.fam !== "w") return;
    if (c.petitBase === undefined) c.petitBase = c.petit || "";
    var l = loftValide(lofts[c.id]) ? Math.round(lofts[c.id]) : null;
    c.loft = l || WEDGES_BASE[c.id]; c.loftPrecise = !!l; c.petit = l ? l + "°" : c.petitBase;
  });
  perso.forEach(function (l) {
    var c = { id: "w" + l, nom: "Wedge " + l + "°", court: l + "°", fam: "w", petit: l + "°", loft: l, loftPrecise: true, perso: true };
    CLUBS.push(c); CLUB[c.id] = c;
  });
  var autres = CLUBS.filter(function (c) { return c.fam !== "w"; }), w = CLUBS.filter(function (c) { return c.fam === "w"; });
  w.sort(function (a, b) { return a.loft - b.loft || (a.perso ? 1 : 0) - (b.perso ? 1 : 0); });
  CLUBS.length = 0; autres.concat(w).forEach(function (c) { CLUBS.push(c); });
  WEDGES.length = 0; w.forEach(function (c) { WEDGES.push(c.id); });
  return w.map(function (c) { return c.id; });
}
/* Le wedge qui occupe déjà ce loft, sauf celui qu'on modifie : un wedge ajouté,
   ou un wedge de base du sac dont le loft a été précisé (un loft par défaut n'est qu'une estimation). */
function wedgeAuLoft(l, sauf, sac) {
  sac = sac || [];
  return CLUBS.filter(function (c) {
    return c.fam === "w" && c.id !== sauf && c.loft === l && (c.perso || (c.loftPrecise && sac.indexOf(c.id) >= 0));
  })[0] || null;
}
definirWedges([], {});

function estNombre(v) { return typeof v === "number" && isFinite(v); }
function arrondi1(v) { return Math.round(v * 10) / 10; }
function arrondi2(v) { return Math.round(v * 100) / 100; }
function somme(l) { return l.reduce(function (a, v) { return a + v; }, 0); }

/* ---------- Carnet de distances ---------- */

/* Moyenne d'un club. À partir de cinq mesures, la plus longue et la plus courte
   sont écartées, comme le demande l'exercice du carnet de distances. */
function statsClub(mesures) {
  var l = (mesures || []).filter(estNombre);
  if (!l.length) return null;
  var tri = l.slice().sort(function (a, b) { return a - b; }), n = tri.length;
  var coeur = n >= 5 ? tri.slice(1, n - 1) : tri;
  return { n: n, moy: Math.round(somme(coeur) / coeur.length), min: tri[0], max: tri[n - 1], elague: n >= 5 };
}

/* Étagement du sac. Deux clubs voisins doivent être séparés de 8 à 15 m :
   en dessous ils font doublon, au-dessus il manque une distance. Entre deux bois
   (driver et bois de parcours), l'écart toléré monte à 25 m. */
var SAC_ECART = { min: 8, max: 15, maxBois: 25 };
function estBois(c) { return /^(dr|b\d)$/.test(c.id); }

/* Échelle des clubs mesurés et écarts entre deux clubs voisins.
   sac (facultatif) : identifiants des clubs du sac. Les voisins sont alors ceux du sac,
   et un club du sac sans mesure coupe la chaîne au lieu de créer un faux trou.
   Sans sac, les voisins sont les clubs mesurés qui se suivent. */
function analyseCarnet(clubs, sac) {
  clubs = clubs || {};
  var ordre = sac ? CLUBS.filter(function (c) { return sac.indexOf(c.id) >= 0; }) : CLUBS;
  var chaine = [], lignes = [];
  ordre.forEach(function (c) {
    var s = statsClub(clubs[c.id]);
    if (s) lignes.push({ club: c, s: s });
    if (s || sac) chaine.push({ club: c, s: s });
  });
  var paires = [], alertes = [], ecarts = [];
  for (var i = 0; i < chaine.length - 1; i++) {
    var A = chaine[i], B = chaine[i + 1];
    if (!A.s || !B.s) continue;
    var e = A.s.moy - B.s.moy, max = estBois(A.club) && estBois(B.club) ? SAC_ECART.maxBois : SAC_ECART.max;
    var statut = e < 0 ? "inverse" : e < SAC_ECART.min ? "doublon" : e > max ? "trou" : "ok";
    paires.push({ a: A.club, b: B.club, ecart: e, statut: statut, max: max });
    if (e > 0) ecarts.push(e);
    if (statut !== "ok") alertes.push({ type: statut, a: A.club, b: B.club, ecart: Math.abs(e) });
  }
  return {
    lignes: lignes, paires: paires, alertes: alertes,
    ok: paires.filter(function (p) { return p.statut === "ok"; }).length,
    ecartMoyen: ecarts.length ? Math.round(somme(ecarts) / ecarts.length) : null,
    min: lignes.length ? Math.min.apply(null, lignes.map(function (x) { return x.s.min; })) : null,
    max: lignes.length ? Math.max.apply(null, lignes.map(function (x) { return x.s.max; })) : null
  };
}

/* Distances de wedge connues (amplitudes et plein swing) et trous dans la fenêtre à couvrir. */
function analyseWedges(wedges, clubs) {
  wedges = wedges || {}; clubs = clubs || {};
  var pts = [], n = 0;
  WEDGES.forEach(function (w) {
    var r = wedges[w] || {};
    AMPLITUDES.forEach(function (am) {
      if (estNombre(r[am.id])) { pts.push({ w: w, a: am.id, v: r[am.id] }); n++; }
    });
    var s = statsClub(clubs[w]);
    if (s) pts.push({ w: w, a: "plein", v: s.moy });
  });
  pts.sort(function (a, b) { return a.v - b.v; });
  var lo = WEDGE_FENETRE[0], hi = WEDGE_FENETRE[1], trous = [];
  if (n) {
    var premier = pts[0], dernier = pts[pts.length - 1];
    if (premier.v - lo > WEDGE_TROU) trous.push({ de: null, a: premier, lo: lo, hi: Math.min(premier.v, hi), ecart: Math.min(premier.v, hi) - lo });
    for (var i = 0; i < pts.length - 1; i++) {
      var p = pts[i], q = pts[i + 1];
      if (q.v - p.v > WEDGE_TROU && q.v > lo && p.v < hi) {
        trous.push({ de: p, a: q, lo: p.v, hi: q.v, ecart: q.v - p.v });
      }
    }
    if (hi - dernier.v > WEDGE_TROU) trous.push({ de: dernier, a: null, lo: Math.max(dernier.v, lo), hi: hi, ecart: hi - Math.max(dernier.v, lo) });
  }
  return { pts: pts, n: n, trous: trous };
}

/* ---------- Parties ----------
   Un trou : [mise en jeu jouable 0/1, green en régulation 0/1, putts 0 à 5, pénalités 0 à 3,
   score (0 = non noté), par (0 = inconnu), côté du raté au départ, club de départ,
   longueur du premier putt]. Les cinq dernières valeurs manquent dans les parties
   saisies avant la carte de score. */
function trouNote(t) { return !!t && t[4] > 0 && t[5] > 0; }
/* Score que donnent les quatre réponses quand le green manqué est rejoint au coup suivant. */
function scoreSuggere(par, g, p, x) { return Math.max(1, par - 2 + (g ? 0 : 1) + p + x); }
function scoreMini(p, x) { return 1 + p + x; }

function statsTrous(trous) {
  var s = { T: 0, J: 0, G: 0, P: 0, P3: 0, X: 0, U: 0, M: 0, PG: 0, PM: 0,
    N: 0, S: 0, PAR: 0, C: 0, MN: 0, SV: 0, E: 0, K: 0, Gb: 0, PGb: 0, Mb: 0, PMb: 0 };
  for (var b = 1; b <= 4; b++) { s["g" + b] = 0; s["m" + b] = 0; }
  for (b = 1; b <= 5; b++) { s["gb" + b] = 0; s["mb" + b] = 0; }
  (trous || []).forEach(function (t) {
    if (!t) return;
    s.T++; s.J += t[0]; s.G += t[1]; s.P += t[2]; if (t[2] >= 3) s.P3++; s.X += t[3];
    if (t[1]) s.PG += t[2];
    else { s.M++; s.PM += t[2]; if (!t[0]) s.U++; }
    /* Premier putt noté : nombre de trous et de putts par longueur. Les trous notés avec le pavé (11 cases)
       ont une échelle en cinq rangs (PUTT1B), les plus anciens une échelle en quatre (PUTT1). */
    var nv = t.length >= 11;
    if (t[2] > 0 && t[8] >= 1 && t[8] <= (nv ? 5 : 4)) {
      if (t[1]) { s.Gb++; s.PGb += t[2]; s[(nv ? "gb" : "g") + t[8]]++; }
      else { s.Mb++; s.PMb += t[2]; s[(nv ? "mb" : "m") + t[8]]++; }
    }
    /* Score noté : coups, par, trous à triple bogey ou pire, pars sauvés,
       coups joués en plus de ce que disent les quatre réponses. */
    if (trouNote(t)) {
      s.N++; s.S += t[4]; s.PAR += t[5];
      if (t[4] - t[5] >= 3) s.C++;
      if (!t[1]) { s.MN++; if (t[4] <= t[5]) s.SV++; }
      var plus = t[4] - (t[5] - 2 + (t[1] ? 0 : 1) + t[2] + t[3]);
      s.E += plus; if (plus) s.K++;
    }
  });
  return s;
}
function ajouterStats(s, x) { Object.keys(x).forEach(function (k) { s[k] += x[k]; }); }

/* Cumul des parties les plus récentes, sans dépasser maxTrous (la dernière compte toujours). */
function cumulParties(parties, maxTrous) {
  var s = statsTrous([]), n = 0, date = null;
  for (var i = (parties || []).length - 1; i >= 0; i--) {
    var p = parties[i];
    if (n && s.T + p.trous.length > maxTrous) break;
    ajouterStats(s, statsTrous(p.trous));
    n++; if (!date) date = p.d;
  }
  s.n = n; s.date = date;
  return s;
}

/* Indicateurs du profil tirés des dernières parties (54 trous au plus), ramenés à leur base. */
function indicateursParties(parties) {
  var c = cumulParties(parties, 54);
  if (!c.T) return null;
  var k = 18 / c.T;
  var vals = {
    drive_jeu: Math.round(10 * c.J / c.T),
    fers_gir: Math.round(c.G * k),
    putt_3: Math.round(c.P3 * k),
    strat_penal: Math.min(20, Math.round(c.X * k))
  };
  if (c.N >= 9) vals.strat_cata = Math.round(c.C * 18 / c.N);
  return { date: c.date, T: c.T, n: c.n, vals: vals };
}

/* Score d'une partie : coups, par et écart sur les trous notés. */
function scorePartie(partie) {
  var s = statsTrous(partie.trous);
  return { T: s.T, N: s.N, complet: s.T > 0 && s.N === s.T, coups: s.S, par: s.PAR, ecart: s.S - s.PAR };
}

/* ---------- Coups gagnés ---------- */
function interpoler(xs, ys, x) {
  var i = Math.max(xs[0], Math.min(xs[xs.length - 1], x)), k = 0;
  while (k < xs.length - 2 && i > xs[k + 1]) k++;
  return ys[k] + (i - xs[k]) / (xs[k + 1] - xs[k]) * (ys[k + 1] - ys[k]);
}
function repereSG(index) {
  var r = {};
  Object.keys(SG_REPERES).forEach(function (c) { r[c] = interpoler(SG_INDEX, SG_REPERES[c], index); });
  /* Rattrapage : ce qui reste du score une fois comptés les greens manqués, les putts et les pénalités. */
  r.e = r.s - ((18 - r.gir) * (r.pm - 1) + r.gir * (r.pg - 2) + r.x);
  return r;
}
/* Putts attendus d'un joueur selon la longueur de son premier putt (rang 1 à 4). */
function puttsAttendus(index, rang) { return interpoler(SG_PUTT1.index, SG_PUTT1.e[rang], index); }
function puttsAttendusB(index, rang) { return interpoler(SG_PUTT1B.index, SG_PUTT1B.e[rang], index); }

/* Joueur cible par défaut : le premier index repère au moins trois points sous celui du joueur. */
function cibleAuto(index) {
  var c = 0;
  SG_CIBLES.forEach(function (x) { if (x <= index - 3) c = x; });
  return c;
}

/* Estimation des coups gagnés ou perdus par secteur face au joueur cible, sur 18 trous.
   Modèle : un green manqué coûte un coup pour rejoindre le green ; les putts sont comparés
   à ceux de la cible, séparément sur les greens touchés et sur les greens manqués.
   Sans score par trou, une mise en jeu ratée qui fait manquer le green coûte en plus
   SG_RECENTRAGE. Avec un score par trou, ce forfait est remplacé par le rattrapage mesuré
   (coups joués en plus pour rejoindre le green), et la somme des secteurs est alors
   exactement l'écart entre le score du joueur et celui de la cible.
   Quand la longueur du premier putt est notée, la distance laissée est portée au crédit
   du coup qui précède (attaque ou petit jeu) et le putting est jugé à distance égale. */
function coupsGagnes(parties, cible) {
  var c = cumulParties(parties, 90);
  if (c.T < 9) return null;
  var R = repereSG(cible), k = 18 / c.T;
  var mT = 18 - R.gir, v = 1 + R.pm - R.pg;
  var u = c.U * k, m = c.M * k, x = c.X * k;
  var pm = c.M ? c.PM / c.M : null, pg = c.G ? c.PG / c.G : null;
  var note = c.N >= 9, e = note ? c.E * 18 / c.N : null;
  var eg = 0, em = 0;
  for (var b = 1; b <= 4; b++) { var att = puttsAttendus(cible, b); eg += c["g" + b] * att; em += c["m" + b] * att; }
  for (b = 1; b <= 5; b++) { var atb = puttsAttendusB(cible, b); eg += c["gb" + b] * atb; em += c["mb" + b] * atb; }
  var brut = {
    depart: -(u - R.u) * (v + (note ? 0 : SG_RECENTRAGE)),
    attaque: -((m - u) - (mT - R.u)) * v + (c.Gb * R.pg - eg) * k,
    petit: c.M ? ((c.Mb * R.pm - em) + ((c.M - c.Mb) * R.pm - (c.PM - c.PMb))) * k : null,
    putting: (c.G || c.Mb) ? ((eg + em - c.PGb - c.PMb) + ((c.G - c.Gb) * R.pg - (c.PG - c.PGb))) * k : null,
    penal: -(x - R.x),
    rattrapage: note ? -(e - R.e) : null
  };
  var total = 0;
  var secteurs = SG_SECTEURS.map(function (s) {
    var val = brut[s.id] == null ? null : arrondi1(brut[s.id]);
    if (val === 0) val = 0;
    if (val != null) total += val;
    return { id: s.id, nom: s.nom, d: s.d, sg: val };
  });
  return {
    T: c.T, n: c.n, N: c.N, cible: cible, secteurs: secteurs, total: arrondi1(total),
    detail: c.Gb + c.Mb, corriges: c.K,
    joueur: { u: arrondi1(u), m: arrondi1(m), pg: pg == null ? null : arrondi2(pg), pm: pm == null ? null : arrondi2(pm), x: arrondi1(x),
      e: note ? arrondi1(e) : null, s: note ? arrondi1((c.S - c.PAR) * 18 / c.N) : null },
    ref: { u: arrondi1(R.u), m: arrondi1(mT), pg: arrondi2(R.pg), pm: arrondi2(R.pm), x: arrondi1(R.x), e: arrondi1(R.e), s: arrondi1(R.s) }
  };
}

/* ---------- Objectifs par statistique ---------- */
/* Valeurs d'un cumul de trous pour chaque statistique suivie, ramenées à 18 trous. */
function valeursStats(s) {
  if (!s.T) return null;
  var k = 18 / s.T, kn = s.N >= 9 ? 18 / s.N : null;
  return {
    score: kn ? (s.S - s.PAR) * kn : null,
    jeu: s.J * k, gir: s.G * k, putts: s.P * k, p3: s.P3 * k, pen: s.X * k,
    cata: kn ? s.C * kn : null,
    sv: s.MN >= 5 ? 100 * s.SV / s.MN : null
  };
}
/* Ce que réalise en moyenne un joueur de l'index donné. */
function objectifs(index) {
  var R = repereSG(index);
  return { score: R.s, jeu: 18 - R.u, gir: R.gir, putts: R.gir * R.pg + (18 - R.gir) * R.pm, p3: R.p3, pen: R.x, cata: R.cata, sv: R.sv };
}
function cumulListe(l) { var s = statsTrous([]); l.forEach(function (p) { ajouterStats(s, statsTrous(p.trous)); }); return s; }
/* Moyennes sur les n dernières parties, valeurs partie par partie, et tendance :
   la moitié récente de la fenêtre comparée à la moitié ancienne, à partir de 4 parties. */
function statsFenetre(parties, n) {
  var l = (parties || []).slice(-n);
  if (!l.length) return null;
  var vals = valeursStats(cumulListe(l));
  var serie = l.map(function (p) { return valeursStats(statsTrous(p.trous)); });
  var tendance = {};
  if (l.length >= 4) {
    var mi = Math.floor(l.length / 2), av = valeursStats(cumulListe(l.slice(0, mi))), ap = valeursStats(cumulListe(l.slice(mi)));
    OBJ_STATS.forEach(function (st) {
      if (av[st.id] == null || ap[st.id] == null) return;
      var d = (ap[st.id] - av[st.id]) * (st.sens === "bas" ? -1 : 1);
      tendance[st.id] = d >= st.seuil ? "mieux" : d <= -st.seuil ? "moins" : "stable";
    });
  }
  return { n: l.length, vals: vals, serie: serie, tendance: tendance };
}
/* Position d'une valeur face à l'objectif : "dessus" (mieux), "dessous" ou "repere". */
function etatObjectif(st, val, obj) {
  if (val == null) return null;
  var d = (val - obj) * (st.sens === "bas" ? -1 : 1);
  return d >= st.seuil ? "dessus" : d <= -st.seuil ? "dessous" : "repere";
}

/* ---------- Index estimé ----------
   Méthode du World Handicap System, simplifiée : score de chaque trou plafonné au double
   bogey net (coups rendus répartis également sur les trous), différentiel calculé avec le
   SSS et le slope du parcours s'ils sont connus (sinon le par et 113), partie de moins de
   18 trous complétée par le score attendu sur les trous non joués. */
function differentiel(partie, pc, index) {
  var st = statsTrous(partie.trous);
  if (st.T < 9 || st.N !== st.T) return null;
  var slope = pc && pc.slope ? pc.slope : 113;
  var parT = st.PAR, cr = parT;
  if (pc && pc.sss) {
    var par18 = somme(pc.pars) * (pc.pars.length === 9 ? 2 : 1);
    if (pc.pars.every(function (v) { return v > 0; }) && par18 > 0) cr = pc.sss * parT / par18;
  }
  var rendus = Math.max(0, Math.ceil((index * slope / 113 + (cr - parT) * 18 / st.T) / 18));
  var ajuste = 0;
  partie.trous.forEach(function (t) { ajuste += Math.min(t[4], t[5] + 2 + rendus); });
  var d = (113 / slope) * (ajuste - cr) + (18 - st.T) / 9 * (0.52 * index + 1.2);
  return { v: arrondi1(d), ajuste: ajuste, T: st.T };
}
/* parcours : fonction qui rend le parcours d'une partie, ou null. */
function indexEstime(parties, parcours, index) {
  var diffs = [];
  for (var i = (parties || []).length - 1; i >= 0 && diffs.length < 20; i--) {
    var d = differentiel(parties[i], parcours ? parcours(parties[i]) : null, index);
    if (d) diffs.push(d.v);
  }
  var n = diffs.length, regle = WHS_BAREME[n];
  if (!regle) return { n: n, v: null };
  var bas = diffs.slice().sort(function (a, b) { return a - b; }).slice(0, regle[0]);
  var v = somme(bas) / bas.length + regle[1];
  return { n: n, k: regle[0], v: Math.max(0, Math.min(54, arrondi1(v))) };
}

/* ---------- Parcours : score trou par trou et trous noirs ---------- */
function analyseParcours(parties, pc) {
  var L = pc.pars.length, trous = [], n = 0, i;
  for (i = 0; i < L; i++) trous.push({ h: i, par: pc.pars[i], n: 0, N: 0, S: 0, J: 0, G: 0, P: 0, X: 0, E: 0, cotes: [0, 0, 0, 0], clubs: [null, [0, 0], [0, 0], [0, 0], [0, 0]] });
  (parties || []).forEach(function (p) {
    if (p.pc !== pc.id) return;
    n++;
    p.trous.forEach(function (t, k) {
      var x = trous[((p.o || 0) + k) % L];
      x.n++; x.J += t[0]; x.G += t[1]; x.P += t[2]; x.X += t[3];
      if (!t[0] && t[6]) x.cotes[t[6]]++;
      if (t[7]) { x.clubs[t[7]][0]++; x.clubs[t[7]][1] += t[0]; }
      if (trouNote(t)) { x.N++; x.S += t[4] - t[5]; x.E += t[4] - (t[5] - 2 + (t[1] ? 0 : 1) + t[2] + t[3]); }
    });
  });
  var N = 0, S = 0;
  trous.forEach(function (x) {
    N += x.N; S += x.S;
    x.moy = x.N ? x.S / x.N : null;
    x.jeu = x.n ? x.J / x.n : null; x.gir = x.n ? x.G / x.n : null;
    x.putts = x.n ? x.P / x.n : null; x.pen = x.n ? x.X / x.n : null;
    x.extra = x.N ? x.E / x.N : null;
  });
  var moyTrou = N ? S / N : null;
  var noirs = trous.filter(function (x) { return x.N >= NOIR_PASSAGES && x.moy - moyTrou >= NOIR_SURCOUT; })
    .sort(function (a, b) { return b.moy - a.moy || a.h - b.h; }).slice(0, 3);
  noirs.forEach(function (x) { x.surcout = x.moy - moyTrou; x.causes = causesTrou(x); });
  return { n: n, N: N, trous: trous, moyTrou: moyTrou, noirs: noirs,
    surcout: somme(noirs.map(function (x) { return x.surcout; })),
    assez: trous.some(function (x) { return x.N >= NOIR_PASSAGES; }) };
}
/* Ce qui coûte le plus sur un trou, en coups par passage : deux causes au plus. */
function causesTrou(x) {
  var c = [];
  if (x.pen >= 0.5) c.push({ id: "penal", cout: x.pen });
  if (x.par !== 3 && x.jeu <= 0.5) c.push({ id: "depart", cout: (1 - x.jeu) * 0.8 });
  if (x.par === 3 && x.gir <= 0.34) c.push({ id: "par3", cout: (1 - x.gir) * 0.6 });
  if (x.putts >= 2.5) c.push({ id: "putts", cout: x.putts - 2 });
  if (x.extra >= 0.75) c.push({ id: x.par === 3 ? "autour" : "long", cout: x.extra });
  c.sort(function (a, b) { return b.cout - a.cout; });
  return c.length ? c.slice(0, 2) : [{ id: "general", cout: 0 }];
}
/* Côté où partent le plus souvent les ratés, s'il domine : rang de COTES, ou 0. */
function coteDominant(cotes, mini) {
  var n = cotes[1] + cotes[2] + cotes[3], r = 0;
  if (n < mini) return 0;
  [1, 2, 3].forEach(function (k) { if (cotes[k] / n >= 0.6) r = k; });
  return r;
}

/* ---------- Relevés de la saisie détaillée, sur les parties récentes (maxTrous au plus) ---------- */
function releveDetail(parties, maxTrous) {
  var r = { T: 0, cotes: [0, 0, 0, 0], clubs: [null, [0, 0], [0, 0], [0, 0], [0, 0]],
    p1: [null, [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]], app: [0, 0, 0, 0, 0], nApp: 0 }, n = 0;
  for (var i = (parties || []).length - 1; i >= 0; i--) {
    var p = parties[i];
    if (n && r.T + p.trous.length > maxTrous) break;
    n++;
    p.trous.forEach(function (t) {
      r.T++;
      if (!t[0] && t[6]) r.cotes[t[6]]++;
      if (t[7]) { r.clubs[t[7]][0]++; r.clubs[t[7]][1] += t[0]; }
      /* Échelle du pavé ramenée aux quatre rangs des relevés : < 1 m, 1 à 2 m, 2 à 10 m, plus de 10 m. */
      var rg = t.length >= 11 ? [0, 1, 2, 3, 3, 4][t[8]] || 0 : t[8];
      if (t[2] > 0 && rg) {
        var b = r.p1[rg];
        b[0]++; if (t[2] === 1) b[1]++; if (t[2] >= 3) b[2]++;
        if (!t[1]) { r.app[rg]++; r.nApp++; }
      }
    });
  }
  r.nCotes = r.cotes[1] + r.cotes[2] + r.cotes[3];
  r.nP1 = r.p1[1][0] + r.p1[2][0] + r.p1[3][0] + r.p1[4][0];
  return r;
}

/* ---------- Défis ---------- */
function defiNeuf() {
  return { niv: 0, essais: 0, coups: 0, ok: 0, record: 0, parNiv: [null, null, null], eN: 0, hist: [], cours: null, temps: null };
}
/* Niveau en jeu, de 1 à 3 : le premier non validé, ou le dernier une fois le défi bouclé. */
function niveauVise(defi, D) { return Math.min(D.niv + 1, defi.niveaux.length); }
function cibleDefi(defi, D) { return defi.niveaux[niveauVise(defi, D) - 1].cible; }

function finEssai(defi, D, v, cible, reussi, date, duree) {
  D.essais++; D.eN++;
  D.hist.push(duree != null ? { d: date, v: v, s: duree } : { d: date, v: v });
  /* Défi chronométré : meilleur temps d'un essai réussi. */
  if (reussi && duree != null && (D.temps == null || duree < D.temps)) D.temps = duree;
  if (D.hist.length > 30) D.hist = D.hist.slice(-30);
  /* Une série valide le niveau en jeu. Un comptage valide tous les niveaux dont l'objectif est atteint. */
  var niveau = null, nb = 0;
  while (reussi && D.niv < defi.niveaux.length && (nb === 0 || (defi.mode === "compte" && v >= defi.niveaux[D.niv].cible))) {
    D.parNiv[D.niv] = D.eN; D.niv++; nb++;
  }
  if (nb) { D.eN = 0; niveau = D.niv; }
  return { type: reussi ? "reussi" : "rate", v: v, cible: cible, niveau: niveau, nb: nb };
}

/* Enregistre un coup réussi ou raté. Renvoie l'événement de fin d'essai, ou null.
   maintenant (en millisecondes, facultatif) chronomètre l'essai, du premier coup au dernier. */
function defiCoup(defi, D, ok, date, maintenant) {
  var cible = cibleDefi(defi, D), evt = null, c, chrono = defi.chrono && estNombre(maintenant);
  D.coups++; if (ok) D.ok++;
  if (defi.mode === "serie") {
    c = D.cours || (D.cours = { s: 0, m: 0, e: 0 });
    if (chrono && !estNombre(c.t0)) c.t0 = maintenant;
    if (ok) c.s++;
    if (c.s > D.record) D.record = c.s;
    if (!ok || c.s >= cible) {
      var dS = chrono && estNombre(c.t0) ? Math.max(1, Math.round((maintenant - c.t0) / 1000)) : null;
      evt = finEssai(defi, D, c.s, cible, ok, date, dS);
      if (dS != null) evt.s = dS;
      c.m = Math.max(c.m, c.s); c.e++; c.s = 0; delete c.t0;
    }
  } else {
    c = D.cours || (D.cours = { l: [] });
    if (chrono && !estNombre(c.t0)) c.t0 = maintenant;
    c.l.push(ok ? 1 : 0);
    if (c.l.length >= defi.n) {
      var v = somme(c.l), dC = chrono && estNombre(c.t0) ? Math.max(1, Math.round((maintenant - c.t0) / 1000)) : null;
      if (v > D.record) D.record = v;
      evt = finEssai(defi, D, v, cible, v >= cible, date, dC);
      evt.l = c.l.slice();
      if (dC != null) evt.s = dC;
      D.cours = null;
    }
  }
  return evt;
}

/* Clôt une séance de séries. Renvoie la meilleure série de la séance, ou null s'il n'y en a pas. */
function defiFinSeance(defi, D) {
  var c = D.cours;
  D.cours = null;
  if (!c || defi.mode !== "serie") return null;
  var m = Math.max(c.m || 0, c.s || 0);
  return (c.e || c.s) ? m : null;
}

/* ---------- Coups notés sur le parcours ----------
   Une partie peut porter ses coups : coups[k] est la liste du trou k, chaque coup
   { c: club, d: distance en mètres ou null, a: "plein" ou amplitude de wedge, g: [lat, lon, lat, lon] ou null }.
   Les coups pleins mesurés alimentent les distances du sac ; un wedge joué à une amplitude alimente la matrice. */
const COUPS_MAX = 15;
const AMPLITUDES_COUP = ["plein", "a1", "a2", "a3"];
function mesuresParcours(parties) {
  var clubs = {}, wedges = {};
  (parties || []).forEach(function (p) {
    if (!p || !Array.isArray(p.coups)) return;
    p.coups.forEach(function (l) {
      (l || []).forEach(function (c) {
        if (!c || !estNombre(c.d) || !CLUB[c.c]) return;
        if (!c.a || c.a === "plein") (clubs[c.c] = clubs[c.c] || []).push(c.d);
        else if (CLUB[c.c].fam === "w") { var w = wedges[c.c] = wedges[c.c] || {}; (w[c.a] = w[c.a] || []).push(c.d); }
      });
    });
  });
  Object.keys(clubs).forEach(function (k) { clubs[k] = clubs[k].slice(-COUPS_MAX); });
  Object.keys(wedges).forEach(function (k) { Object.keys(wedges[k]).forEach(function (am) { wedges[k][am] = wedges[k][am].slice(-COUPS_MAX); }); });
  return { clubs: clubs, wedges: wedges };
}
/* Mesures du practice et du parcours réunies, club par club. */
function fusionMesures(practice, parcours) {
  var out = {};
  Object.keys(practice || {}).forEach(function (k) { out[k] = practice[k].slice(); });
  Object.keys(parcours || {}).forEach(function (k) { out[k] = (out[k] || []).concat(parcours[k]); });
  return out;
}
/* Matrice de wedges : une case remplie à la main l'emporte ; sinon, la moyenne des coups du parcours. */
function fusionWedges(manuel, parcours) {
  var out = {};
  Object.keys(manuel || {}).forEach(function (k) { out[k] = {}; Object.keys(manuel[k]).forEach(function (am) { out[k][am] = manuel[k][am]; }); });
  Object.keys(parcours || {}).forEach(function (k) {
    var o = out[k] = out[k] || {};
    Object.keys(parcours[k]).forEach(function (am) { if (!estNombre(o[am])) o[am] = Math.round(somme(parcours[k][am]) / parcours[k][am].length); });
  });
  return out;
}
/* Distance entre deux positions GPS, en mètres (formule de haversine). */
function distanceGPS(a, b) {
  var R = 6371000, rad = Math.PI / 180, dLat = (b[0] - a[0]) * rad, dLon = (b[1] - a[1]) * rad;
  var h = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(a[0] * rad) * Math.cos(b[0] * rad) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return Math.round(2 * R * Math.asin(Math.min(1, Math.sqrt(h))));
}

/* ---------- Dispersion d'une série de balles ----------
   Écart-type, et distance « fiable à 90 % » : celle que neuf balles sur dix dépassent (10e centile). */
function quantile(tri, q) {
  var pos = (tri.length - 1) * q, i = Math.floor(pos), f = pos - i;
  return tri[i] + (i + 1 < tri.length ? (tri[i + 1] - tri[i]) * f : 0);
}
function dispersion(mesures) {
  var l = (mesures || []).filter(estNombre);
  if (l.length < 3) return null;
  var n = l.length, moy = somme(l) / n;
  var v = somme(l.map(function (x) { return (x - moy) * (x - moy); })) / (n - 1), tri = l.slice().sort(function (a, b) { return a - b; });
  return { n: n, moy: Math.round(moy), sigma: Math.round(Math.sqrt(v)), p10: Math.round(quantile(tri, 0.1)), p90: Math.round(quantile(tri, 0.9)), min: tri[0], max: tri[n - 1] };
}

/* ---------- Bilan express d'une partie ----------
   Trois points clés : ce qui a le mieux marché, puis les deux secteurs qui ont coûté le plus,
   chacun avec un fait de la partie et le domaine d'exercices qui y répond. */
function pointsCles(pt, cible) {
  var s = statsTrous(pt.trous);
  if (s.T < 9) return [];
  var r = coupsGagnes([pt], cible);
  function fait(id) {
    if (id === "depart") return "Mises en jeu jouables : " + s.J + " sur " + s.T + ".";
    if (id === "attaque") return "Greens en régulation : " + s.G + " sur " + s.T + ".";
    if (id === "petit") return s.MN ? "Pars sauvés après un green manqué : " + s.SV + " sur " + s.MN + "." : "Greens manqués : " + s.M + " sur " + s.T + ".";
    if (id === "putting") return s.P + " putts" + (s.P3 ? ", dont " + s.P3 + " trou" + (s.P3 > 1 ? "s" : "") + " à 3 putts ou plus" : ", sans 3 putts") + ".";
    if (id === "penal") return s.X ? s.X + " coup" + (s.X > 1 ? "s" : "") + " de pénalité." : "Aucune pénalité.";
    return s.C ? s.C + " trou" + (s.C > 1 ? "s" : "") + " à triple bogey ou pire." : "Aucun trou à triple bogey ou pire.";
  }
  function domaine(id) {
    if (id === "putting") return s.P3 >= 2 ? "putt_long" : "putt_court";
    if (id === "petit") return "approche";
    if (id === "attaque") return "fers";
    if (id === "depart") return "drive";
    return "strategie";
  }
  var sect = r ? r.secteurs.filter(function (x) { return x.sg != null; }) : [];
  var tri = sect.slice().sort(function (a, b) { return b.sg - a.sg; }), out = [];
  var fort = tri[0];
  if (fort) out.push({ type: "fort", id: fort.id, nom: fort.nom, sg: fort.sg, fait: fait(fort.id), d: domaine(fort.id) });
  tri.slice().reverse().filter(function (x) { return !fort || x.id !== fort.id; }).slice(0, 2).forEach(function (x) {
    out.push({ type: "travail", id: x.id, nom: x.nom, sg: x.sg, fait: fait(x.id), d: domaine(x.id) });
  });
  return out;
}

/* ---------- Meilleurs et pires trous d'un parcours ----------
   À partir de deux passages, en coups au-dessus du par en moyenne ; trois de chaque côté au plus, sans recouvrement. */
function topFlopTrous(an, mini) {
  var l = an.trous.filter(function (x) { return x.N >= (mini || 2) && x.moy != null; });
  var tri = l.slice().sort(function (a, b) { return a.moy - b.moy || a.h - b.h; });
  var nTop = Math.min(3, Math.floor(tri.length / 2)), nFlop = Math.min(3, tri.length - nTop);
  return { top: tri.slice(0, nTop), flop: tri.slice(tri.length - nFlop).reverse(), n: tri.length };
}

/* Score d'un partenaire noté en mode marqueur : coups et écart au par sur les trous où il a un score. */
function scoreJoueur(scores, pars) {
  var c = 0, par = 0, n = 0;
  (scores || []).forEach(function (v, k) { if (estNombre(v) && v > 0 && pars[k] > 0) { c += v; par += pars[k]; n++; } });
  return { coups: c, ecart: c - par, n: n };
}

if (typeof module !== "undefined") {
  module.exports = { COUPS_MAX, AMPLITUDES_COUP, mesuresParcours, fusionMesures, fusionWedges, distanceGPS, quantile, dispersion, pointsCles, topFlopTrous, scoreJoueur, DEFI, CLUB, CLUBS, WEDGES, WEDGES_BASE, LOFT_MIN, LOFT_MAX, definirWedges, wedgeAuLoft, estNombre, statsClub, SAC_ECART, analyseCarnet, analyseWedges, trouNote, scoreSuggere, scoreMini, statsTrous, cumulParties, indicateursParties, scorePartie, repereSG, puttsAttendus, cibleAuto, coupsGagnes, valeursStats, objectifs, statsFenetre, etatObjectif, differentiel, indexEstime, analyseParcours, causesTrou, coteDominant, releveDetail, defiNeuf, niveauVise, cibleDefi, defiCoup, defiFinSeance };
}
