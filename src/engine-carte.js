/* ============================================================
   CARTE GPS : fonctions pures, sans accès à l'écran ni au réseau.
   Lecture des données OpenStreetMap (réponse Overpass ou GeoJSON), rattachement des greens aux trous,
   projection en mètres, distances à l'entrée, au milieu et au fond du green, green relevé à la main.
   ============================================================ */

var CARTE_R = 6371008.8;        /* rayon moyen de la Terre, en mètres */
var CARTE_MAX_TROUS = 27;
var CARTE_GREEN_MAX = 60;       /* un green rattaché à un trou est à moins de 60 m du bout de son tracé */
var CARTE_SEUILS = { b: 50, e: 60, f: 35, d: 30 };  /* bunkers, eau, fairways, départs : distance maximale à l'axe du trou */
var CARTE_AUTOUR = 90;          /* sans tracé : ce qui est à moins de 90 m du centre du green */
var CARTE_ESTIME = [14, 11];     /* green estimé autour du drapeau : 28 m de profondeur, 22 m de large */
var CARTE_FRANCE = [41.2, -5.6, 51.3, 9.8];
var CARTE_MOTS_VIDES = ["golf", "club", "country", "de", "du", "des", "la", "le", "les", "l", "d", "et", "international", "parcours"];
var CARTE_ACCENTS = { a: "a|à|â|ä", e: "e|é|è|ê|ë", i: "i|î|ï", o: "o|ô|ö", u: "u|ù|û|ü", c: "c|ç", y: "y|ÿ" };

function carteNb(v) { return typeof v === "number" && isFinite(v); }

/* ---------- Projection : degrés ↔ mètres autour d'une origine [lat, lon] ---------- */
function projeter(o, lat, lon) {
  var k = Math.PI / 180;
  return [CARTE_R * (lon - o[1]) * k * Math.cos(o[0] * k), CARTE_R * (lat - o[0]) * k];
}
function deprojeter(o, x, y) {
  var k = Math.PI / 180;
  return [o[0] + y / (CARTE_R * k), o[1] + x / (CARTE_R * k * Math.cos(o[0] * k))];
}

/* ---------- Géométrie plane, en mètres ---------- */
function dist2(a, b) { var dx = a[0] - b[0], dy = a[1] - b[1]; return Math.sqrt(dx * dx + dy * dy); }
function centrePoly(p) {
  var A = 0, cx = 0, cy = 0, n = p.length;
  for (var i = 0; i < n; i++) {
    var a = p[i], b = p[(i + 1) % n], k = a[0] * b[1] - b[0] * a[1];
    A += k; cx += (a[0] + b[0]) * k; cy += (a[1] + b[1]) * k;
  }
  if (Math.abs(A) < 1e-6) {
    var sx = 0, sy = 0; p.forEach(function (q) { sx += q[0]; sy += q[1]; });
    return n ? [sx / n, sy / n] : [0, 0];
  }
  return [cx / (3 * A), cy / (3 * A)];
}
function airePoly(p) {
  var A = 0;
  for (var i = 0; i < p.length; i++) { var a = p[i], b = p[(i + 1) % p.length]; A += a[0] * b[1] - b[0] * a[1]; }
  return Math.abs(A) / 2;
}
function pointDansPoly(q, p) {
  var dedans = false;
  for (var i = 0, j = p.length - 1; i < p.length; j = i++) {
    var a = p[i], b = p[j];
    if ((a[1] > q[1]) !== (b[1] > q[1]) && q[0] < (b[0] - a[0]) * (q[1] - a[1]) / (b[1] - a[1]) + a[0]) dedans = !dedans;
  }
  return dedans;
}
function distSegment(q, a, b) {
  var dx = b[0] - a[0], dy = b[1] - a[1], l2 = dx * dx + dy * dy;
  var t = l2 ? Math.max(0, Math.min(1, ((q[0] - a[0]) * dx + (q[1] - a[1]) * dy) / l2)) : 0;
  return dist2(q, [a[0] + t * dx, a[1] + t * dy]);
}
/* Distance d'un point à une ligne brisée (ou au bord d'un polygone si ferme). */
function distLigne(q, pts, ferme) {
  if (!pts.length) return Infinity;
  if (pts.length === 1) return dist2(q, pts[0]);
  var d = Infinity, n = ferme ? pts.length : pts.length - 1;
  for (var i = 0; i < n; i++) d = Math.min(d, distSegment(q, pts[i], pts[(i + 1) % pts.length]));
  return d;
}
function longueurLigne(pts) { var l = 0; for (var i = 1; i < pts.length; i++) l += dist2(pts[i - 1], pts[i]); return l; }
/* Simplification de Douglas-Peucker : retire les points à moins de tol mètres de la ligne. */
function simplifier(pts, tol) {
  if (pts.length <= 3) return pts.slice();
  var garde = [], n = pts.length;
  for (var i = 0; i < n; i++) garde.push(false);
  garde[0] = garde[n - 1] = true;
  var pile = [[0, n - 1]];
  while (pile.length) {
    var s = pile.pop(), mx = 0, im = -1;
    for (var k = s[0] + 1; k < s[1]; k++) { var d = distSegment(pts[k], pts[s[0]], pts[s[1]]); if (d > mx) { mx = d; im = k; } }
    if (im > 0 && mx > tol) { garde[im] = true; pile.push([s[0], im], [im, s[1]]); }
  }
  return pts.filter(function (q, i) { return garde[i]; });
}
/* Stockage compact : liste plate d'entiers en décimètres. */
function aPlat(pts) { var r = []; pts.forEach(function (q) { r.push(Math.round(q[0] * 10), Math.round(q[1] * 10)); }); return r; }
function dePlat(l) { var r = []; for (var i = 0; i + 1 < (l || []).length; i += 2) r.push([l[i] / 10, l[i + 1] / 10]); return r; }

/* ---------- Lecture des données OpenStreetMap ---------- */
function estFerme(p) { return p.length >= 4 && Math.abs(p[0][0] - p[p.length - 1][0]) < 1e-9 && Math.abs(p[0][1] - p[p.length - 1][1]) < 1e-9; }
/* Assemble des tronçons en anneaux fermés (contours extérieurs d'un multipolygone). */
function anneaux(troncons) {
  var out = [], reste = [];
  troncons.forEach(function (p) { if (estFerme(p)) out.push(p); else if (p.length > 1) reste.push(p.slice()); });
  var meme = function (a, b) { return Math.abs(a[0] - b[0]) < 1e-9 && Math.abs(a[1] - b[1]) < 1e-9; };
  while (reste.length) {
    var cur = reste.shift(), avance = true;
    while (avance && !estFerme(cur)) {
      avance = false;
      for (var i = 0; i < reste.length; i++) {
        var q = reste[i], fin = cur[cur.length - 1];
        if (meme(fin, q[0])) { cur = cur.concat(q.slice(1)); reste.splice(i, 1); avance = true; break; }
        if (meme(fin, q[q.length - 1])) { cur = cur.concat(q.slice(0, -1).reverse()); reste.splice(i, 1); avance = true; break; }
      }
    }
    if (estFerme(cur)) out.push(cur);
  }
  return out;
}
/* Rend des objets { tags, pts: [[lat, lon]…], ferme } depuis une réponse Overpass (JSON) ou un GeoJSON. */
function lireOSM(data) {
  var out = [];
  if (!data || typeof data !== "object") return out;
  if (Array.isArray(data.elements)) {
    var noeuds = {}, voies = {};
    data.elements.forEach(function (e) { if (e && e.type === "node" && carteNb(e.lat) && carteNb(e.lon)) noeuds[e.id] = [e.lat, e.lon]; });
    var geom = function (e) {
      if (Array.isArray(e.geometry)) return e.geometry.filter(function (g) { return g && carteNb(g.lat) && carteNb(g.lon); }).map(function (g) { return [g.lat, g.lon]; });
      if (Array.isArray(e.nodes)) return e.nodes.map(function (id) { return noeuds[id]; }).filter(Boolean);
      return [];
    };
    data.elements.forEach(function (e) { if (e && e.type === "way") voies[e.id] = geom(e); });
    data.elements.forEach(function (e) {
      if (!e || !e.tags || typeof e.tags !== "object") return;
      if (e.type === "node") { if (noeuds[e.id]) out.push({ tags: e.tags, pts: [noeuds[e.id]], ferme: false }); }
      else if (e.type === "way") { var p = voies[e.id] || []; if (p.length) out.push({ tags: e.tags, pts: p, ferme: estFerme(p) }); }
      else if (e.type === "relation" && Array.isArray(e.members)) {
        var ext = e.members.filter(function (m) { return m && m.type === "way" && m.role !== "inner"; })
          .map(function (m) { return Array.isArray(m.geometry) ? geom(m) : (voies[m.ref] || []); });
        anneaux(ext).forEach(function (p) { out.push({ tags: e.tags, pts: p, ferme: true }); });
      }
    });
    return out;
  }
  if (data.type === "FeatureCollection" && Array.isArray(data.features)) {
    var ll = function (c) { return (Array.isArray(c) ? c : []).filter(function (q) { return Array.isArray(q) && carteNb(q[0]) && carteNb(q[1]); }).map(function (q) { return [q[1], q[0]]; }); };
    data.features.forEach(function (f) {
      var g = f && f.geometry, pr = f && f.properties && typeof f.properties === "object" ? f.properties : null;
      var tags = pr && pr.tags && typeof pr.tags === "object" ? pr.tags : pr;
      if (!g || !tags) return;
      if (g.type === "Point") { var p0 = ll([g.coordinates]); if (p0.length) out.push({ tags: tags, pts: p0, ferme: false }); }
      else if (g.type === "LineString") { var p1 = ll(g.coordinates); if (p1.length) out.push({ tags: tags, pts: p1, ferme: estFerme(p1) }); }
      else if (g.type === "Polygon") { var p2 = ll((g.coordinates || [])[0]); if (p2.length) out.push({ tags: tags, pts: p2, ferme: true }); }
      else if (g.type === "MultiPolygon") (g.coordinates || []).forEach(function (poly) { var p3 = ll((poly || [])[0]); if (p3.length) out.push({ tags: tags, pts: p3, ferme: true }); });
    });
  }
  return out;
}
function genreOSM(tags) {
  var g = tags.golf;
  if (tags.sport === "miniature_golf" || tags.leisure === "miniature_golf") return null;
  if (g === "green") return "green";
  if (g === "hole") return "trou";
  if (g === "pin") return "pin";
  if (g === "tee") return "d";
  if (g === "bunker") return "b";
  if (g === "fairway") return "f";
  if (g === "water_hazard" || g === "lateral_water_hazard" || tags.natural === "water") return "e";
  if (tags.leisure === "golf_course") return "golf";
  return null;
}

/* ---------- Construction de la carte d'un parcours ----------
   Rend { carte, bilan } ou null s'il n'y a aucun green dans les données.
   carte = { src, nom, maj, o: [lat, lon], trous: [null | { g, l, par, b, e, f, d }], libres: [green…] }
   où chaque forme est une liste plate d'entiers (décimètres autour de l'origine). */
function construireCarte(data, src, maj) {
  var objets = lireOSM(data).map(function (x) { return { genre: genreOSM(x.tags), tags: x.tags, ll: x.pts, ferme: x.ferme }; }).filter(function (x) { return x.genre; });
  var greensLL = objets.filter(function (x) { return x.genre === "green" && x.ferme && x.ll.length >= 4; });
  var pinsLL = objets.filter(function (x) { return x.genre === "pin" && x.ll.length === 1; });
  var lignesLL = objets.filter(function (x) { return x.genre === "trou" && !x.ferme && x.ll.length >= 2; });
  /* Sans green dessiné, les drapeaux et les tracés des trous suffisent : le green est alors estimé. */
  if (!greensLL.length && !pinsLL.length && !lignesLL.length) return null;
  /* Origine : milieu des greens (ou des drapeaux et des tracés). */
  var la = 0, lo = 0, n = 0;
  (greensLL.length ? greensLL : pinsLL.concat(lignesLL)).forEach(function (g) { g.ll.forEach(function (q) { la += q[0]; lo += q[1]; n++; }); });
  var o = [Math.round(la / n * 1e6) / 1e6, Math.round(lo / n * 1e6) / 1e6];
  objets.forEach(function (x) {
    x.pts = x.ll.map(function (q) { return projeter(o, q[0], q[1]); });
    if (x.ferme) x.pts = x.pts.slice(0, -1);
  });
  var greens = greensLL.map(function (x) { return { pts: x.pts, c: centrePoly(x.pts), pris: false }; });
  /* Un drapeau posé sur un green dessiné n'apporte rien de plus. */
  var pins = pinsLL.map(function (x) { return { q: x.pts[0], pris: false }; }).filter(function (p) {
    return !greens.some(function (g) { return pointDansPoly(p.q, g.pts) || distLigne(p.q, g.pts, true) < 5; });
  });
  var presPin = function (q) { var b = null; pins.forEach(function (p) { if (p.pris) return; var d = dist2(q, p.q); if (!b || d < b.d) b = { p: p, d: d }; }); return b; };
  var nom = "";
  objets.forEach(function (x) { if (x.genre === "golf" && !nom && typeof x.tags.name === "string") nom = x.tags.name.slice(0, 60); });
  /* Tracés des trous : du départ vers le green, numérotés par ref. */
  var trous = [], doublons = 0;
  objets.filter(function (x) { return x.genre === "trou" && !x.ferme && x.pts.length >= 2; }).forEach(function (x) {
    var num = parseInt(x.tags.ref, 10);
    if (!(num >= 1 && num <= CARTE_MAX_TROUS) || String(x.tags.ref).trim() !== String(num)) return;
    if (trous[num - 1]) { doublons++; return; }
    var pts = x.pts, pres = function (q) { var b = null; greens.forEach(function (g) { var d = pointDansPoly(q, g.pts) ? 0 : distLigne(q, g.pts, true); if (!b || d < b.d) b = { g: g, d: d }; }); return b; };
    var fin = pres(pts[pts.length - 1]), deb = pres(pts[0]);
    /* Tracé dessiné à l'envers : le green est du côté du premier point. */
    if (deb && fin && deb.d < fin.d && deb.d <= CARTE_GREEN_MAX && fin.d > CARTE_GREEN_MAX) { pts = pts.slice().reverse(); fin = deb; }
    var par = parseInt(x.tags.par, 10);
    var hc = parseInt(x.tags.handicap || x.tags.hcp, 10);
    var t = { l: pts, par: par >= 3 && par <= 6 ? par : 0, hcp: hc >= 1 && hc <= 18 ? hc : 0, g: null };
    if (fin && fin.d <= CARTE_GREEN_MAX && !fin.g.pris) { fin.g.pris = true; t.g = fin.g; }
    trous[num - 1] = t;
  });
  /* Trous sans green dessiné : green estimé autour du drapeau, ou au bout du tracé. */
  trous.forEach(function (t) {
    if (!t || t.g) return;
    var pts = t.l, fin = presPin(pts[pts.length - 1]), deb = presPin(pts[0]);
    if (deb && (!fin || deb.d < fin.d) && deb.d <= CARTE_GREEN_MAX && (!fin || fin.d > CARTE_GREEN_MAX)) { pts = t.l = pts.slice().reverse(); fin = deb; }
    var c = pts[pts.length - 1];
    if (fin && fin.d <= CARTE_GREEN_MAX) { fin.p.pris = true; c = fin.p.q; }
    var av = null;
    for (var k = pts.length - 1; k >= 0 && !av; k--) if (dist2(pts[k], c) > 3) av = pts[k];
    var g = greenEstime(c, av ? Math.atan2(c[1] - av[1], c[0] - av[0]) : Math.PI / 2);
    t.g = { pts: g, c: c, pris: true }; t.est = true;
  });
  var formes = { b: [], e: [], f: [], d: [] };
  objets.forEach(function (x) { if (formes[x.genre] && x.ferme && x.pts.length >= 3) formes[x.genre].push({ pts: x.pts, c: centrePoly(x.pts) }); });
  var tol = { b: 0.4, e: 1, f: 1, d: 0.4 };
  var autour = function (t) {
    var c = t.g ? t.g.c : null, axe = t.l ? (c ? t.l.concat([c]) : t.l) : null, r = { b: [], e: [], f: [], d: [] };
    Object.keys(formes).forEach(function (k) {
      formes[k].forEach(function (f) {
        var pres;
        if (axe) {
          var d = Infinity;
          f.pts.forEach(function (q) { d = Math.min(d, distLigne(q, axe, false)); });
          pres = d <= CARTE_SEUILS[k] || axe.some(function (q) { return pointDansPoly(q, f.pts); });
        } else pres = c && f.pts.some(function (q) { return dist2(q, c) <= CARTE_AUTOUR; });
        if (pres) r[k].push(aPlat(simplifier(f.pts.concat([f.pts[0]]), tol[k]).slice(0, -1)));
      });
    });
    return r;
  };
  var encoder = function (t) {
    if (!t || !t.g) return null;
    var f = autour(t);
    var r = { g: aPlat(t.est ? t.g.pts : simplifier(t.g.pts.concat([t.g.pts[0]]), 0.3).slice(0, -1)), l: t.l ? aPlat(t.l) : null, par: t.par || 0, b: f.b, e: f.e, f: f.f, d: f.d };
    if (t.est) r.est = 1;
    return r;
  };
  /* Un green sans numéro garde ce qui l'entoure : il servira tel quel une fois numéroté à la main. */
  var encoderLibre = function (g) { var x = encoder({ g: g, l: null, par: 0, est: g.est }); var r = { g: x.g, b: x.b, e: x.e, f: x.f, d: x.d }; if (x.est) r.est = 1; return r; };
  var carte = { src: src || "osm", nom: nom, maj: maj || null, o: o, trous: [], libres: [] };
  for (var i = 0; i < trous.length; i++) carte.trous.push(encoder(trous[i]));
  var restes = greens.filter(function (g) { return !g.pris; });
  pins.forEach(function (p) { if (!p.pris) restes.push({ pts: greenEstime(p.q, Math.PI / 2), c: p.q, est: true }); });
  restes.slice(0, 30).forEach(function (g) { carte.libres.push(encoderLibre(g)); });
  var estimes = carte.trous.filter(function (t) { return t && t.est; }).length;
  var bilan = { nom: nom, greens: greens.length, estimes: estimes, drapeaux: pinsLL.length, numerotes: carte.trous.filter(Boolean).length, libres: carte.libres.length, traces: trous.filter(Boolean).length,
    bunkers: formes.b.length, eaux: formes.e.length, fairways: formes.f.length, doublons: doublons, pars: trous.map(function (t) { return t ? t.par : 0; }), hcp: trous.map(function (t) { return t ? t.hcp : 0; }) };
  return { carte: carte, bilan: bilan };
}
/* Donne un numéro à un green sans numéro (ou retire son numéro à un trou : num = 0). */
function numeroterGreen(carte, iLibre, num) {
  var x = carte.libres[iLibre];
  if (!x || !(num >= 1 && num <= CARTE_MAX_TROUS)) return false;
  while (carte.trous.length < num) carte.trous.push(null);
  var ancien = carte.trous[num - 1];
  carte.libres.splice(iLibre, 1);
  if (ancien && ancien.g && !ancien.rel) { var lb = { g: ancien.g, b: ancien.b, e: ancien.e, f: ancien.f, d: ancien.d }; if (ancien.est) lb.est = 1; carte.libres.push(lb); }
  /* Le tracé du trou, s'il existe, reste : seul le green change. */
  carte.trous[num - 1] = { g: x.g, l: ancien ? ancien.l : null, par: ancien ? ancien.par : 0, b: x.b || [], e: x.e || [], f: x.f || [], d: x.d || [] };
  if (x.est) carte.trous[num - 1].est = 1;
  if (ancien && ancien.ad) carte.trous[num - 1].ad = ancien.ad;
  return true;
}
/* Green relevé sur place : deux positions, l'entrée et le fond. Le green est dessiné comme un ovale entre les deux. */
function greenReleve(entree, fond) {
  var d = dist2(entree, fond), a = Math.max(4, d / 2), b = a * 0.85, c = [(entree[0] + fond[0]) / 2, (entree[1] + fond[1]) / 2];
  var ang = d > 0.5 ? Math.atan2(fond[1] - entree[1], fond[0] - entree[0]) : Math.PI / 2, pts = [];
  for (var i = 0; i < 20; i++) {
    var t = 2 * Math.PI * i / 20, x = a * Math.cos(t), y = b * Math.sin(t);
    pts.push([c[0] + x * Math.cos(ang) - y * Math.sin(ang), c[1] + x * Math.sin(ang) + y * Math.cos(ang)]);
  }
  return pts;
}
/* Green estimé : un ovale centré sur le drapeau, allongé dans l'axe du jeu (ang). */
function greenEstime(c, ang) {
  var a = CARTE_ESTIME[0], b = CARTE_ESTIME[1], pts = [];
  for (var i = 0; i < 16; i++) {
    var t = 2 * Math.PI * i / 16, x = a * Math.cos(t), y = b * Math.sin(t);
    pts.push([c[0] + x * Math.cos(ang) - y * Math.sin(ang), c[1] + x * Math.sin(ang) + y * Math.cos(ang)]);
  }
  return pts;
}
function carteVide(lat, lon, maj) { return { src: "releve", nom: "", maj: maj || null, o: [Math.round(lat * 1e6) / 1e6, Math.round(lon * 1e6) / 1e6], trous: [], libres: [] }; }
function poserReleve(carte, num, entree, fond) {
  if (!(num >= 1 && num <= CARTE_MAX_TROUS)) return false;
  while (carte.trous.length < num) carte.trous.push(null);
  var t = carte.trous[num - 1] || { g: null, l: null, par: 0, b: [], e: [], f: [], d: [] };
  t.g = aPlat(greenReleve(entree, fond)); t.rel = aPlat([entree, fond]); delete t.est; delete t.app;
  carte.trous[num - 1] = t;
  return true;
}

/* ---------- Apprentissage au fil des parties ----------
   Fin de trou : le joueur est au drapeau du jour. Les drapeaux changent de place sur le green d'une partie à l'autre :
   leur nuage dessine le green. Premier coup du trou : le joueur est au départ.
   Points gardés en décimètres avec le numéro du jour : [x, y, jour, x, y, jour…]. */
var CARTE_APPRIS = { jours: 5, joursDepart: 3, max: 60, rayon: 30 };
function joursDistincts(l) { var v = {}, n = 0; for (var i = 2; i < (l || []).length; i += 3) if (!v[l[i]]) { v[l[i]] = true; n++; } return n; }
function pointsAppris(l) { var r = []; for (var i = 0; i + 2 < (l || []).length; i += 3) r.push([l[i] / 10, l[i + 1] / 10]); return r; }
function mediane(v) { var s = v.slice().sort(function (a, b) { return a - b; }), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; }
function ajouterPoint(l, q, jour, max) {
  var r = (l || []).concat([Math.round(q[0] * 10), Math.round(q[1] * 10), jour]);
  return r.length > max * 3 ? r.slice(r.length - max * 3) : r;
}
/* Ellipse du nuage de points : centre médian, axes principaux, demi-axes = 2 écarts-types + 4 m (bornés). */
function ellipseNuage(pts) {
  var c = [mediane(pts.map(function (q) { return q[0]; })), mediane(pts.map(function (q) { return q[1]; }))];
  var l = pts.filter(function (q) { return dist2(q, c) <= CARTE_APPRIS.rayon; });
  if (l.length < 3) return null;
  var sxx = 0, syy = 0, sxy = 0;
  l.forEach(function (q) { var dx = q[0] - c[0], dy = q[1] - c[1]; sxx += dx * dx; syy += dy * dy; sxy += dx * dy; });
  sxx /= l.length; syy /= l.length; sxy /= l.length;
  var tr = sxx + syy, det = sxx * syy - sxy * sxy, dl = Math.sqrt(Math.max(0, tr * tr / 4 - det));
  var l1 = tr / 2 + dl, l2 = Math.max(0, tr / 2 - dl), ang = Math.atan2(l1 - sxx, sxy || 1e-9);
  if (Math.abs(sxy) < 1e-9) ang = sxx >= syy ? 0 : Math.PI / 2;
  var a = Math.max(9, Math.min(22, 2 * Math.sqrt(l1) + 4)), b = Math.max(8, Math.min(20, 2 * Math.sqrt(l2) + 4)), out = [];
  for (var i = 0; i < 16; i++) {
    var t = 2 * Math.PI * i / 16, x = a * Math.cos(t), y = b * Math.sin(t);
    out.push([c[0] + x * Math.cos(ang) - y * Math.sin(ang), c[1] + x * Math.sin(ang) + y * Math.cos(ang)]);
  }
  return { c: c, pts: out, n: l.length };
}
/* Point pris en fin de trou (q en mètres). Rend "appris" quand le green estimé vient d'être remplacé, "note" s'il est
   gardé, null s'il est écarté (trop loin du green, green relevé ou dessiné sur OpenStreetMap). */
function noterFinTrou(carte, h, q, jour) {
  var t = trouCarte(carte, h);
  if (!t || t.rel || !(t.est || t.app) || dist2(q, centrePoly(dePlat(t.g))) > CARTE_APPRIS.rayon) return null;
  t.ap = ajouterPoint(t.ap, q, jour, CARTE_APPRIS.max);
  var nj = joursDistincts(t.ap);
  if (nj < CARTE_APPRIS.jours) return "note";
  var e = ellipseNuage(pointsAppris(t.ap));
  if (!e) return "note";
  var neuf = !t.app;
  t.g = aPlat(e.pts); t.app = nj; delete t.est;
  return neuf ? "appris" : "note";
}
/* Position au premier coup du trou : après 3 parties, le départ appris remplace le début du tracé. */
function noterDepart(carte, h, q, jour) {
  var t = trouCarte(carte, h); if (!t) return null;
  var c = centrePoly(dePlat(t.g)), l = t.l ? dePlat(t.l) : null, dc = dist2(q, c);
  if (dc < 60 || dc > 650 || (l && dist2(q, l[0]) > 120)) return null;
  t.ad = ajouterPoint(t.ad, q, jour, 30);
  if (joursDistincts(t.ad) < CARTE_APPRIS.joursDepart) return "note";
  var p = pointsAppris(t.ad), dep = [mediane(p.map(function (x) { return x[0]; })), mediane(p.map(function (x) { return x[1]; }))];
  if (l) { l[0] = dep; t.l = aPlat(l); } else t.l = aPlat([dep, c]);
  return "depart";
}

/* ---------- Distances ----------
   Depuis la position pos (mètres), dans l'axe qui mène au milieu du green :
   l'entrée est le premier bord croisé, le fond le dernier. */
function distancesGreen(pos, poly) {
  if (!pos || !poly || poly.length < 3) return null;
  var c = centrePoly(poly), dx = c[0] - pos[0], dy = c[1] - pos[1], dm = Math.sqrt(dx * dx + dy * dy);
  var dedans = pointDansPoly(pos, poly);
  if (dm < 0.5) return { entree: 0, milieu: 0, fond: 0, sur: true };
  var ux = dx / dm, uy = dy / dm, ts = [];
  for (var i = 0; i < poly.length; i++) {
    var a = poly[i], b = poly[(i + 1) % poly.length], ex = b[0] - a[0], ey = b[1] - a[1], den = ux * ey - uy * ex;
    if (Math.abs(den) < 1e-12) continue;
    var wx = a[0] - pos[0], wy = a[1] - pos[1], t = (wx * ey - wy * ex) / den, s = (wx * uy - wy * ux) / den;
    if (s >= -1e-9 && s <= 1 + 1e-9 && t > -1e-6) ts.push(t);
  }
  if (!ts.length) return { entree: Math.round(dm), milieu: Math.round(dm), fond: Math.round(dm), sur: dedans };
  var mn = dedans ? 0 : Math.min.apply(null, ts), mx = Math.max.apply(null, ts);
  return { entree: Math.round(mn), milieu: Math.round(Math.max(mn, Math.min(mx, dm))), fond: Math.round(mx), sur: dedans };
}
function trouCarte(carte, i) { var t = carte && carte.trous ? carte.trous[i] : null; return t && t.g && t.g.length >= 6 ? t : null; }
function distancesTrou(carte, i, pos) { var t = trouCarte(carte, i); return t && pos ? distancesGreen(pos, dePlat(t.g)) : null; }
function longueurTrouCarte(carte, i) {
  var t = trouCarte(carte, i); if (!t || !t.l) return null;
  var l = dePlat(t.l);
  return Math.round(longueurLigne(l.slice(0, -1).concat([centrePoly(dePlat(t.g))])));
}

/* ---------- Vue d'un trou : repère tourné, le jeu vers le haut ----------
   Rend { cx, cy, cos, sin } ; versVue donne [X vers la droite, Y vers l'avant] en mètres. */
function repereTrou(t, pos) {
  var g = dePlat(t.g), c = centrePoly(g), l = t.l ? dePlat(t.l) : null;
  var dep = l && l.length ? l[0] : (pos && dist2(pos, c) > 15 ? pos : [c[0], c[1] - 100]);
  var ang = Math.atan2(c[1] - dep[1], c[0] - dep[0]), rot = Math.PI / 2 - ang;
  return { cx: c[0], cy: c[1], cos: Math.cos(rot), sin: Math.sin(rot) };
}
function versVue(r, q) { var x = q[0] - r.cx, y = q[1] - r.cy; return [x * r.cos - y * r.sin, x * r.sin + y * r.cos]; }
function depuisVue(r, q) { return [q[0] * r.cos + q[1] * r.sin + r.cx, -q[0] * r.sin + q[1] * r.cos + r.cy]; }

/* ---------- Recherche d'un golf sur OpenStreetMap (requêtes Overpass) ---------- */
function motsNom(nom) {
  return String(nom || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim().split(" ")
    .filter(function (m) { return m && CARTE_MOTS_VIDES.indexOf(m) < 0; });
}
/* Motif insensible aux accents : chaque voyelle accepte ses variantes accentuées. */
function motifNom(nom) {
  var mots = motsNom(nom);
  if (!mots.length || mots.join("").length < 3) return null;
  return mots.map(function (m) { return m.split("").map(function (ch) { return CARTE_ACCENTS[ch] ? "(" + CARTE_ACCENTS[ch] + ")" : ch; }).join(""); }).join(".*");
}
function requeteNom(nom) {
  var m = motifNom(nom);
  return m ? '[out:json][timeout:25];nwr["leisure"="golf_course"]["name"~"' + m + '",i](' + CARTE_FRANCE.join(",") + ');out tags bb 20;' : null;
}
function requeteAutour(lat, lon) {
  return '[out:json][timeout:25];nwr["leisure"="golf_course"](around:8000,' + lat.toFixed(5) + ',' + lon.toFixed(5) + ');out tags bb 20;';
}
function requeteGolf(b) {
  var m = 0.0012, bb = [(b[0] - m).toFixed(5), (b[1] - m).toFixed(5), (b[2] + m).toFixed(5), (b[3] + m).toFixed(5)].join(",");
  return '[out:json][timeout:60];(nwr["golf"](' + bb + ');way["natural"="water"](' + bb + ');relation["natural"="water"](' + bb + '););out body geom;';
}
/* Golfs d'une réponse de recherche : nom et bornes [sud, ouest, nord, est]. */
/* Recherche par nom ou autour d'un point : Nominatim, le moteur de recherche d'OpenStreetMap. */
var CARTE_NOMINATIM = "https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=10&accept-language=fr";
function urlRechercheGolf(nom, sansGolf) {
  if (!motifNom(nom)) return null;
  var q = String(nom).trim().slice(0, 60);
  if (!sansGolf && !/golf/i.test(q)) q = "golf " + q;
  return CARTE_NOMINATIM + "&q=" + encodeURIComponent(q);
}
function urlGolfsAutour(lat, lon) {
  var b = [(lon - 0.12).toFixed(4), (lat + 0.08).toFixed(4), (lon + 0.12).toFixed(4), (lat - 0.08).toFixed(4)];
  return CARTE_NOMINATIM + "&bounded=1&viewbox=" + b.join(",") + "&q=golf";
}
function lireNominatim(liste, pres) {
  var out = [], vus = {};
  (Array.isArray(liste) ? liste : []).forEach(function (e) {
    if (!e || (e.category || e["class"]) !== "leisure" || e.type !== "golf_course" || !Array.isArray(e.boundingbox)) return;
    var bb = e.boundingbox.map(Number), b = [bb[0], bb[2], bb[1], bb[3]];
    if (!b.every(carteNb) || b[2] < b[0] || b[3] < b[1] || b[2] - b[0] > 0.2 || b[3] - b[1] > 0.3) return;
    var nom = typeof e.name === "string" && e.name.trim() ? e.name.trim().slice(0, 60) : typeof e.display_name === "string" ? e.display_name.split(",")[0].trim().slice(0, 60) : "";
    nom = nom || "Golf sans nom";
    var cle = nom + "|" + b[0].toFixed(2) + "|" + b[1].toFixed(2);
    if (vus[cle]) return; vus[cle] = true;
    var ad = e.address && typeof e.address === "object" ? e.address : {};
    var ville = ad.village || ad.town || ad.city || ad.municipality || ad.hamlet || "", dep = ad.county || ad.state || "";
    var lieu = [ville, dep && dep !== ville ? dep : ""].filter(Boolean).join(", ").slice(0, 60);
    out.push({ nom: nom, bornes: b, c: [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2], lieu: lieu });
  });
  if (pres) {
    var o = [pres[0], pres[1]];
    out.sort(function (x, y) { return dist2(projeter(o, x.c[0], x.c[1]), [0, 0]) - dist2(projeter(o, y.c[0], y.c[1]), [0, 0]); });
  }
  return out;
}
/* Données du golf : l'API d'OpenStreetMap, tout ce qui est dans le rectangle du golf (avec une marge). */
function urlCarteOSM(b) {
  var m = 0.0012;
  return "https://api.openstreetmap.org/api/0.6/map.json?bbox=" + [b[1] - m, b[0] - m, b[3] + m, b[2] + m].map(function (v) { return v.toFixed(6); }).join(",");
}
function lireGolfs(data) {
  var out = [], vus = {};
  ((data && data.elements) || []).forEach(function (e) {
    if (!e || !e.tags || e.tags.leisure !== "golf_course") return;
    var b = e.bounds && carteNb(e.bounds.minlat) ? [e.bounds.minlat, e.bounds.minlon, e.bounds.maxlat, e.bounds.maxlon]
      : carteNb(e.lat) && carteNb(e.lon) ? [e.lat - 0.008, e.lon - 0.012, e.lat + 0.008, e.lon + 0.012] : null;
    if (!b || b[2] - b[0] > 0.2 || b[3] - b[1] > 0.3) return;
    var nom = typeof e.tags.name === "string" && e.tags.name.trim() ? e.tags.name.trim().slice(0, 60) : "Golf sans nom";
    var cle = nom + "|" + b[0].toFixed(2) + "|" + b[1].toFixed(2);
    if (vus[cle]) return; vus[cle] = true;
    out.push({ nom: nom, bornes: b, c: [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2], lieu: e.tags["addr:city"] || e.tags["addr:postcode"] || "" });
  });
  return out;
}

/* ---------- Photos aériennes de l'IGN (orthophotos, Licence ouverte) ----------
   Tuiles de 256 px en projection Web Mercator. Sur la taille d'un trou, chaque tuile se pose
   comme un rectangle dans le repère local en mètres. */
var CARTE_IGN = "https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=ORTHOIMAGERY.ORTHOPHOTOS&STYLE=normal&FORMAT=image/jpeg&TILEMATRIXSET=PM";
function tuileXY(lat, lon, z) {
  var n = Math.pow(2, z), r = lat * Math.PI / 180;
  return [(lon + 180) / 360 * n, (1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2 * n];
}
function tuileLL(x, y, z) {
  var n = Math.pow(2, z), m = Math.PI - 2 * Math.PI * y / n;
  return [180 / Math.PI * Math.atan(0.5 * (Math.exp(m) - Math.exp(-m))), x / n * 360 - 180];
}
function urlTuile(z, x, y) { return CARTE_IGN + "&TILEMATRIX=" + z + "&TILEROW=" + y + "&TILECOL=" + x; }
function photoPossible(o) { return !!o && o[0] >= CARTE_FRANCE[0] && o[0] <= CARTE_FRANCE[2] && o[1] >= CARTE_FRANCE[1] && o[1] <= CARTE_FRANCE[3]; }
/* Niveau de zoom : assez fin pour pxParM pixels d'écran par mètre (écran à haute densité compris). */
function zoomPhoto(o, pxParM) {
  var z = Math.ceil(Math.log(156543.03 * Math.cos(o[0] * Math.PI / 180) * pxParM * 2) / Math.LN2);
  return Math.max(14, Math.min(19, z));
}
/* Tuiles qui couvrent les points (mètres, repère de la carte d'origine o) : [{ z, x, y, url, x0, y0, x1, y1 }].
   Au-delà de max tuiles, le zoom baisse d'un cran. */
function tuilesPour(o, pts, z, max) {
  max = max || 40;
  for (; z >= 12; z--) {
    var xs = [], ys = [];
    pts.forEach(function (q) { var ll = deprojeter(o, q[0], q[1]), t = tuileXY(ll[0], ll[1], z); xs.push(t[0]); ys.push(t[1]); });
    var ax = Math.floor(Math.min.apply(null, xs)), bx = Math.floor(Math.max.apply(null, xs)), ay = Math.floor(Math.min.apply(null, ys)), by = Math.floor(Math.max.apply(null, ys));
    if ((bx - ax + 1) * (by - ay + 1) > max) continue;
    var out = [];
    for (var x = ax; x <= bx; x++) for (var y = ay; y <= by; y++) {
      var no = tuileLL(x, y, z), se = tuileLL(x + 1, y + 1, z), a = projeter(o, no[0], no[1]), b = projeter(o, se[0], se[1]);
      out.push({ z: z, x: x, y: y, url: urlTuile(z, x, y), x0: a[0], y1: a[1], x1: b[0], y0: b[1] });
    }
    return out;
  }
  return [];
}
/* Tuiles d'un parcours entier, pour jouer sans réseau : chaque trou au zoom 18, la vue d'ensemble au zoom 16. */
function tuilesParcours(carte) {
  var vus = {}, out = [], ajouter = function (l) { l.forEach(function (t) { if (!vus[t.url]) { vus[t.url] = true; out.push(t.url); } }); }, tous = [];
  (carte.trous || []).concat(carte.libres || []).forEach(function (t) {
    if (!t || !t.g) return;
    var pts = dePlat(t.g).concat(t.l ? dePlat(t.l) : []), c = centrePoly(dePlat(t.g)), x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    if (!t.l) pts.push([c[0] - 160, c[1] - 160], [c[0] + 160, c[1] + 160]);
    pts.forEach(function (q) { x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); });
    var cadre = [[x0 - 40, y0 - 40], [x1 + 40, y1 + 40]];
    tous = tous.concat(cadre);
    ajouter(tuilesPour(carte.o, cadre, 18, 60));
  });
  if (tous.length) ajouter(tuilesPour(carte.o, tous, 16, 60));
  return out.slice(0, 1500);
}

/* ---------- Contrôle d'une carte lue dans le stockage ---------- */
function assainirForme(l, min) {
  if (!Array.isArray(l) || l.length < (min || 6) || l.length > 4000 || l.length % 2) return null;
  for (var i = 0; i < l.length; i++) if (!carteNb(l[i]) || Math.abs(l[i]) > 200000) return null;
  return l.map(Math.round);
}
function assainirPoints(l, max) {
  if (!Array.isArray(l) || !l.length || l.length % 3 || l.length > max * 3) return null;
  for (var i = 0; i < l.length; i++) if (!carteNb(l[i]) || Math.abs(l[i]) > 200000) return null;
  return l.map(Math.round);
}
function assainirCarte(c) {
  if (!c || typeof c !== "object" || !Array.isArray(c.o) || !carteNb(c.o[0]) || !carteNb(c.o[1]) || Math.abs(c.o[0]) > 90 || Math.abs(c.o[1]) > 180) return null;
  var formes = function (l) { return (Array.isArray(l) ? l : []).map(function (f) { return assainirForme(f); }).filter(Boolean).slice(0, 40); };
  var r = { src: ["osm", "fichier", "releve"].indexOf(c.src) >= 0 ? c.src : "osm", nom: typeof c.nom === "string" ? c.nom.slice(0, 60) : "",
    maj: typeof c.maj === "string" ? c.maj.slice(0, 30) : null, o: [c.o[0], c.o[1]], trous: [], libres: [] };
  (Array.isArray(c.libres) ? c.libres : []).slice(0, 30).forEach(function (x) {
    var g = x && typeof x === "object" ? assainirForme(x.g) : null;
    if (g) { var lb = { g: g, b: formes(x.b), e: formes(x.e), f: formes(x.f), d: formes(x.d) }; if (x.est) lb.est = 1; r.libres.push(lb); }
  });
  (Array.isArray(c.trous) ? c.trous : []).slice(0, CARTE_MAX_TROUS).forEach(function (t) {
    var g = t && typeof t === "object" ? assainirForme(t.g) : null;
    if (!g) { r.trous.push(null); return; }
    var x = { g: g, l: assainirForme(t.l, 4), par: t.par >= 3 && t.par <= 6 ? t.par : 0, b: formes(t.b), e: formes(t.e), f: formes(t.f), d: formes(t.d) };
    var rel = assainirForme(t.rel, 4); if (rel && rel.length === 4) x.rel = rel; else if (t.est) x.est = 1;
    var ap = assainirPoints(t.ap, CARTE_APPRIS.max), ad = assainirPoints(t.ad, 30);
    if (ap) x.ap = ap; if (ad) x.ad = ad;
    if (!x.rel && !x.est && t.app >= 1 && t.app <= 999) x.app = Math.round(t.app);
    r.trous.push(x);
  });
  return r;
}

if (typeof module !== "undefined") {
  module.exports = { projeter, deprojeter, dist2, centrePoly, airePoly, pointDansPoly, distSegment, distLigne, longueurLigne, simplifier, aPlat, dePlat, anneaux, lireOSM, genreOSM,
    construireCarte, numeroterGreen, greenReleve, carteVide, poserReleve, distancesGreen, trouCarte, distancesTrou, longueurTrouCarte, repereTrou, versVue, depuisVue,
    motsNom, motifNom, requeteNom, requeteAutour, requeteGolf, lireGolfs, assainirForme, assainirCarte, CARTE_MAX_TROUS,
    greenEstime, urlRechercheGolf, urlGolfsAutour, lireNominatim, urlCarteOSM, tuileXY, tuileLL, urlTuile, photoPossible, zoomPhoto, tuilesPour, tuilesParcours, noterFinTrou, noterDepart, ellipseNuage, joursDistincts, CARTE_APPRIS };
}
