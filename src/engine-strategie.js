/* ============================================================
   STRATÉGIE ET CHOIX DE CLUB : fonctions pures, sans accès à l'écran.
   Étalonnage (fourchette jouable, dispersion latérale, ellipse), « se joue comme »,
   club conseillé et visée qui éloigne la dispersion des dangers.
   ============================================================ */

if (typeof module !== "undefined") {
  Object.assign(globalThis, require("./data-strategie.js"));
}

function nombreS(v) { return typeof v === "number" && isFinite(v); }
function trieS(l) { return (l || []).filter(nombreS).slice().sort(function (a, b) { return a - b; }); }
function centileS(tri, q) {
  if (!tri.length) return null;
  var pos = (tri.length - 1) * q, i = Math.floor(pos), f = pos - i;
  return tri[i] + (i + 1 < tri.length ? (tri[i + 1] - tri[i]) * f : 0);
}
function interpS(xs, ys, x) {
  var i = Math.max(xs[0], Math.min(xs[xs.length - 1], x)), k = 0;
  while (k < xs.length - 2 && i > xs[k + 1]) k++;
  return ys[k] + (i - xs[k]) / (xs[k + 1] - xs[k]) * (ys[k + 1] - ys[k]);
}

/* ---------- Étalonnage ---------- */
/* Coups pleins d'un club : ceux sous 60 % de la distance habituelle (médiane) sont des coups ratés
   (gratte, top, coup de recentrage) et sortent du calcul. */
function filtrerPleins(mesures) {
  var tri = trieS(mesures);
  if (!tri.length) return { gardes: [], ecartes: [], med: null };
  var med = centileS(tri, 0.5), seuil = med * FILTRE_RATE;
  return { gardes: tri.filter(function (x) { return x >= seuil; }), ecartes: tri.filter(function (x) { return x < seuil; }), med: med };
}
/* Fourchette jouable : du 25e au 75e centile des coups pleins gardés, dès cinq coups ;
   avant, du plus court au plus long, et la fourchette est provisoire. */
function fourchette(mesures) {
  var f = filtrerPleins(mesures), g = f.gardes, n = g.length;
  if (!n) return null;
  var med = Math.round(centileS(g, 0.5)), fiable = n >= FOURCHETTE_MIN;
  return {
    n: n, med: med, ecartes: f.ecartes.length, provisoire: !fiable,
    bas: Math.round(fiable ? centileS(g, 0.25) : g[0]), haut: Math.round(fiable ? centileS(g, 0.75) : g[n - 1]),
    p10: fiable ? Math.round(centileS(g, 0.1)) : null, p90: fiable ? Math.round(centileS(g, 0.9)) : null
  };
}
/* Dispersion latérale : tendance (moyenne des écarts, − à gauche, + à droite) et demi-largeur qui contient 80 % des balles. */
function lateral(ecarts) {
  var tri = trieS(ecarts), n = tri.length;
  if (n < FOURCHETTE_MIN) return n ? { n: n, provisoire: true } : null;
  var moy = tri.reduce(function (s, x) { return s + x; }, 0) / n;
  return { n: n, biais: Math.round(moy), demi: Math.max(1, Math.round((centileS(tri, 0.9) - centileS(tri, 0.1)) / 2)), provisoire: false };
}
/* Ellipse de dispersion d'un club, vue de dessus : centre (tendance latérale, distance habituelle) et demi-axes à 80 %.
   Sans assez de coups notés, largeur ou profondeur sont estimées d'après l'index du joueur. */
function ellipseClub(mesures, ecarts, index) {
  var f = fourchette(mesures); if (!f) return null;
  var lat = lateral(ecarts), i = nombreS(index) ? index : 18;
  var estL = !lat || lat.provisoire, estP = f.provisoire;
  var rx = estL ? f.med * interpS(DISP_INDEX, DISP_LARGEUR, i) : lat.demi;
  var ry = estP ? f.med * interpS(DISP_INDEX, DISP_PROFONDEUR, i) : (f.p90 - f.p10) / 2;
  return { d: f.med, cx: estL ? 0 : lat.biais, rx: Math.max(2, Math.round(rx)), ry: Math.max(2, Math.round(ry)),
    estimeeL: estL, estimeeP: estP, n: f.n, nl: lat ? lat.n : 0, f: f };
}
/* Coups notés d'un club, du practice et du parcours : distances des coups pleins et écarts latéraux. */
function coupsClub(points) {
  var d = [], l = [];
  (points || []).forEach(function (p) { if (p && nombreS(p.d)) { d.push(p.d); if (nombreS(p.l)) l.push(p.l); } });
  return { d: d, l: l };
}

/* ---------- « Se joue comme » ---------- */
/* c = { vent: "face" | "dos" | "gauche" | "droite" | null, force: 0 à 3, pente: mètres (+ montée), temp: "froid" | "normal" | "chaud" }.
   Rend la distance ressentie, le détail des corrections et la dérive latérale due au vent (+ vers la droite). */
function seJoueComme(brut, c) {
  c = c || {};
  if (!nombreS(brut) || brut <= 0) return null;
  var det = [], derive = 0, f = Math.max(0, Math.min(3, c.force | 0));
  var v = VENT_DIRS.filter(function (x) { return x.id === c.vent; })[0];
  if (v && f) {
    var pc = v.pc[f];
    if (pc) det.push({ id: "vent", lib: "Vent " + v.nom.toLowerCase() + ", " + VENT_FORCES[f].toLowerCase(), m: Math.round(brut * pc / 100) });
    if (v.derive) derive = Math.round(brut * v.derive[f] / 100) * (v.id === "gauche" ? 1 : -1);
  }
  var pente = nombreS(c.pente) ? Math.max(-PENTE_MAX, Math.min(PENTE_MAX, Math.round(c.pente))) : 0;
  if (pente) det.push({ id: "pente", lib: pente > 0 ? "Montée de " + pente + " m" : "Descente de " + (-pente) + " m", m: Math.round(pente * PENTE_PAR_METRE) });
  var tp = TEMPERATURES.filter(function (x) { return x.id === c.temp; })[0];
  if (tp && tp.pc) det.push({ id: "temp", lib: tp.nom + " : la balle vole " + (tp.pc > 0 ? "moins" : "plus") + " loin", m: Math.round(brut * tp.pc / 100) });
  var d = brut + det.reduce(function (s, x) { return s + x.m; }, 0);
  return { brut: brut, d: Math.max(1, Math.round(d)), detail: det, derive: derive };
}

/* ---------- Club conseillé ----------
   clubs = [{ id, f: fourchette }] dans l'ordre du sac. Le club dont la fourchette contient la distance ;
   s'il y en a deux, celui dont la distance habituelle est la plus proche ; sinon, la distance habituelle la plus proche.
   À égalité, le plus long : les joueurs amateurs manquent bien plus souvent court que long. */
function clubPour(d, clubs) {
  if (!nombreS(d)) return null;
  var l = (clubs || []).filter(function (c) { return c && c.f; });
  if (!l.length) return null;
  var dans = l.filter(function (c) { return d >= c.f.bas && d <= c.f.haut; });
  var choix = (dans.length ? dans : l).slice().sort(function (a, b) { return Math.abs(a.f.med - d) - Math.abs(b.f.med - d) || b.f.med - a.f.med; })[0];
  return { id: choix.id, dans: dans.length > 0, ecart: d - choix.f.med };
}

/* ---------- Visée anti-pénalité ---------- */
/* Fonction de répartition de la loi normale (approximation d'Abramowitz et Stegun, erreur < 1e-7). */
function phi(z) {
  var t = 1 / (1 + 0.3275911 * Math.abs(z) / Math.SQRT2);
  var y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-z * z / 2);
  return z >= 0 ? (1 + y) / 2 : (1 - y) / 2;
}
/* Repère : x latéral (+ à droite), y profondeur (+ long), le drapeau à l'origine.
   o = { ell: { rx, ry, cx }, derive, green: "p" | "m" | "g", drapeau: { p: "avant"|"milieu"|"fond", c: "gauche"|"centre"|"droite" },
         dangers: { g, d, c, l } (identifiants de DANGERS ou null) }.
   Les balles se répartissent selon une loi normale autour du point visé décalé de la tendance et de la dérive.
   On cherche le point visé qui donne le moins de coups attendus : sur le green, selon la distance au drapeau ;
   à côté, un petit jeu ; dans un danger, ce qu'il coûte en plus. */
function geometrieGreen(o) {
  var G = GREENS[o.green] || GREENS.m, dp = o.drapeau || {};
  var gx = -(DRAPEAU_POS[dp.c] || 0) * G.w / 2, gy = -(DRAPEAU_POS[dp.p] || 0) * G.h / 2;
  return { w: G.w, h: G.h, gx: gx, gy: gy, L: gx - G.w / 2, R: gx + G.w / 2, B: gy - G.h / 2, F: gy + G.h / 2 };
}
function evaluerVisee(o, ax, ay, geo) {
  var e = o.ell, sx = Math.max(1, e.rx) / Z80, sy = Math.max(1, e.ry) / Z80;
  var mx = ax + (e.cx || 0) + (o.derive || 0), my = ay;
  var inx = phi((geo.R - mx) / sx) - phi((geo.L - mx) / sx), iny = phi((geo.F - my) / sy) - phi((geo.B - my) / sy);
  var pg = inx * iny;
  var cotes = { g: phi((geo.L - mx) / sx), d: 1 - phi((geo.R - mx) / sx), c: phi((geo.B - my) / sy), l: 1 - phi((geo.F - my) / sy) };
  var dangers = o.dangers || {}, pd = 0, cout = 0, parCote = {};
  COTES_GREEN.forEach(function (k) {
    var dz = DANGERS.filter(function (x) { return x.id === dangers[k.id]; })[0];
    if (!dz) return;
    parCote[k.id] = cotes[k.id]; pd += cotes[k.id]; cout += cotes[k.id] * dz.cout;
  });
  /* Les coins comptent deux fois : la part en danger ne peut pas dépasser ce qui manque le green. */
  if (pd > 1 - pg && pd > 0) { var k = (1 - pg) / pd; cout *= k; pd = 1 - pg; Object.keys(parCote).forEach(function (c) { parCote[c] *= k; }); }
  var dist = Math.sqrt(mx * mx + my * my + sx * sx + sy * sy);
  var attendu = pg * (ATTENDU_GREEN.base + ATTENDU_GREEN.parMetre * dist) + (1 - pg) * ATTENDU_RATE + cout;
  return { ax: ax, ay: ay, mx: mx, my: my, pg: pg, pd: pd, sur: 1 - pd, parCote: parCote, attendu: attendu };
}
function viser(o) {
  if (!o || !o.ell) return null;
  var geo = geometrieGreen(o), best = null;
  for (var ax = -VISEE_LARGEUR; ax <= VISEE_LARGEUR; ax++) {
    for (var ay = -VISEE_PROFONDEUR; ay <= VISEE_PROFONDEUR; ay++) {
      var r = evaluerVisee(o, ax, ay, geo);
      /* À coups attendus égaux (au centième), le point le plus proche du drapeau. */
      if (!best || r.attendu < best.attendu - 1e-4 || (Math.abs(r.attendu - best.attendu) <= 1e-4 && Math.abs(ax) + Math.abs(ay) < Math.abs(best.ax) + Math.abs(best.ay))) best = r;
    }
  }
  var drapeau = evaluerVisee(o, 0, 0, geo);
  return { visee: best, drapeau: drapeau, geo: geo, gain: Math.round((drapeau.attendu - best.attendu) * 100) / 100 };
}
/* Phrase de conseil : « Vise 8 m à gauche du drapeau ». */
function libVisee(ax, ay) {
  var lat = Math.abs(ax) >= 1, prof = Math.abs(ay) >= 2;
  var p = prof ? Math.abs(ay) + " m " + (ay < 0 ? "plus court" : "plus long") : "";
  if (lat) return "Vise " + Math.abs(ax) + " m à " + (ax < 0 ? "gauche" : "droite") + " du drapeau" + (prof ? ", " + p : "");
  return prof ? "Vise " + p + " que le drapeau" : "Vise le drapeau";
}

if (typeof module !== "undefined") {
  module.exports = { filtrerPleins, fourchette, lateral, ellipseClub, coupsClub, seJoueComme, clubPour, phi, geometrieGreen, evaluerVisee, viser, libVisee, centileS, interpS };
}
