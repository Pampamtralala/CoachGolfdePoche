/* Tests des calculs de la carte GPS. */
const C = require('./src/engine-carte.js');
const D = require('./carte-essai.js');
let ko = 0, n = 0;
function ok(c, m) { n++; if (!c) { ko++; console.log('ÉCHEC :', m); } }
function proche(a, b, tol, m) { ok(Math.abs(a - b) <= tol, m + ' (obtenu ' + a + ', attendu ' + b + ')'); }

/* --- Projection et géométrie --- */
{
  const p = C.projeter(D.O, D.O[0] + 150 / 111195, D.O[1]);
  proche(p[1], 150, 0.2, '150 m vers le nord'); proche(p[0], 0, 0.01, 'pas de décalage est-ouest');
  const ll = C.deprojeter(D.O, 120, -340), q = C.projeter(D.O, ll[0], ll[1]);
  proche(q[0], 120, 0.001, 'aller-retour x'); proche(q[1], -340, 0.001, 'aller-retour y');
  const carre = [[0, 0], [10, 0], [10, 10], [0, 10]];
  ok(C.centrePoly(carre).join() === '5,5' && C.airePoly(carre) === 100, 'centre et aire d\'un carré');
  ok(C.pointDansPoly([5, 5], carre) && !C.pointDansPoly([15, 5], carre), 'point dans un polygone');
  proche(C.distLigne([5, -3], carre, true), 3, 1e-9, 'distance au bord');
  proche(C.distSegment([5, 5], [0, 0], [10, 0]), 5, 1e-9, 'distance à un segment');
  ok(C.simplifier([[0, 0], [5, 0.1], [10, 0], [10, 10]], 0.4).length === 3, 'simplification : point presque aligné retiré');
  ok(JSON.stringify(C.dePlat(C.aPlat([[1.23, -4.56], [7, 8]]))) === '[[1.2,-4.6],[7,8]]', 'stockage au décimètre');
  ok(C.anneaux([[[0, 0], [1, 0], [1, 1]], [[0, 0], [0, 1], [1, 1]]]).length === 1, 'deux tronçons assemblés en un anneau');
}

/* --- Lecture OpenStreetMap et construction de la carte --- */
const brut = D.golfTest(), r = C.construireCarte(brut, 'osm', '2026-11-16T08:00:00.000Z'), carte = r.carte;
/* Les points du golf d'essai, ramenés dans le repère de la carte (son origine est le milieu des greens). */
const P = q => { const ll = C.deprojeter(D.O, q[0], q[1]); return C.projeter(carte.o, ll[0], ll[1]); };
const T = D.trous().map(t => Object.assign({}, t, { dep: P(t.dep), green: P(t.green) }));
{
  ok(r.bilan.greens === 19 && r.bilan.numerotes === 18 && r.bilan.libres === 1, 'greens : ' + JSON.stringify(r.bilan));
  ok(r.bilan.nom === 'Golf de la Jonchère' && r.bilan.pars.join('') === D.PARS.join(''), 'nom et pars lus sur les tracés');
  ok(carte.trous.length === 18 && carte.trous.every(t => t && t.g.length >= 12), 'dix-huit trous avec leur green');
  ok(carte.trous[11].g.length >= 12, 'green en multipolygone assemblé (trou 12)');
  const l7 = C.dePlat(carte.trous[6].l);
  proche(C.dist2(l7[0], T[6].dep), 0, 0.2, 'tracé à l\'envers remis du départ vers le green (trou 7)');
  ok(carte.trous[0].b.length === 1 && carte.trous[0].d.length === 1 && carte.trous[0].f.length === 0, 'par 3 : son bunker et son départ, pas de fairway');
  ok(carte.trous[1].f.length >= 1, 'par 4 : son fairway');
  ok(carte.trous[4].e.length === 1 && carte.trous[0].e.length === 0, 'l\'eau du trou 5 n\'apparaît que près de lui');
  proche(C.longueurTrouCarte(carte, 0), 150, 1, 'longueur du trou 1');
  ok(C.longueurTrouCarte(carte, 1) > 330 && C.longueurTrouCarte(carte, 1) < 345, 'longueur d\'un par 4 en léger coude : ' + C.longueurTrouCarte(carte, 1));
  ok(JSON.stringify(carte).length < 60000, 'carte compacte : ' + JSON.stringify(carte).length + ' caractères');
  ok(C.construireCarte({ elements: [] }) === null && C.construireCarte(null) === null, 'sans green : pas de carte');
  /* Le même golf en GeoJSON */
  const gj = { type: 'FeatureCollection', features: brut.elements.filter(e => e.type === 'way').map(e => ({ type: 'Feature', properties: e.tags,
    geometry: e.tags.golf === 'hole' ? { type: 'LineString', coordinates: e.geometry.map(g => [g.lon, g.lat]) } : { type: 'Polygon', coordinates: [e.geometry.map(g => [g.lon, g.lat])] } })) };
  const r2 = C.construireCarte(gj, 'fichier');
  ok(r2 && r2.bilan.numerotes === 18 && r2.bilan.estimes === 1 && r2.carte.trous[11].est === 1 && r2.carte.src === 'fichier', 'lecture d\'un GeoJSON : ' + (r2 && r2.bilan.numerotes) + ' greens, dont ' + (r2 && r2.bilan.estimes) + ' estimé (le 12 était une relation)');
  /* Ancien format : nœuds séparés */
  const noeuds = { elements: [{ type: 'node', id: 1, lat: 46.19, lon: 2.24 }, { type: 'node', id: 2, lat: 46.1902, lon: 2.24 }, { type: 'node', id: 3, lat: 46.1902, lon: 2.2403 }, { type: 'node', id: 4, lat: 46.19, lon: 2.2403 },
    { type: 'way', id: 9, nodes: [1, 2, 3, 4, 1], tags: { golf: 'green' } }] };
  ok(C.construireCarte(noeuds).bilan.greens === 1, 'voies décrites par leurs nœuds');
  /* Sans tracés : tous les greens sont à numéroter */
  const s = C.construireCarte(D.golfTest({ sansTraces: true }));
  ok(s.bilan.numerotes === 0 && s.bilan.libres === 19, 'sans tracé de trou, les greens restent à numéroter');
  ok(s.carte.libres[0].b.length === 1 && s.carte.libres[0].d.length === 0, 'un green sans numéro garde son bunker');
  ok(C.numeroterGreen(s.carte, 0, 3) && s.carte.trous[2] && s.carte.trous[2].b.length === 1 && s.carte.libres.length === 18 && !C.numeroterGreen(s.carte, 99, 1), 'numéroter un green à la main');
  const g3 = JSON.stringify(s.carte.trous[2].g);
  ok(C.numeroterGreen(s.carte, 0, 3) && JSON.stringify(s.carte.trous[2].g) !== g3 && s.carte.libres.length === 18, 'renuméroter : l\'ancien green redevient libre');
}

/* --- Distances entrée, milieu, fond --- */
{
  const t1 = T[0], pos = t1.dep;
  const d = C.distancesTrou(carte, 0, pos);
  proche(d.milieu, 150, 1, 'milieu depuis le départ du 1'); proche(d.entree, 136, 1, 'entrée'); proche(d.fond, 164, 1, 'fond');
  ok(d.entree < d.milieu && d.milieu < d.fond && !d.sur, 'entrée < milieu < fond');
  const cote = C.distancesTrou(carte, 0, [t1.green[0] - 80, t1.green[1]]);
  proche(cote.milieu, 80, 1, 'depuis le côté : milieu'); proche(cote.entree, 69, 1, 'depuis le côté : le green est moins profond'); proche(cote.fond, 91, 1, 'depuis le côté : fond');
  const sur = C.distancesTrou(carte, 0, [t1.green[0], t1.green[1] - 6]);
  ok(sur.sur && sur.entree === 0 && sur.milieu === 6 && sur.fond === 20, 'sur le green : ' + JSON.stringify(sur));
  ok(C.distancesTrou(carte, 0, t1.green).sur, 'au milieu du green');
  ok(C.distancesTrou(carte, 25, pos) === null && C.distancesTrou(null, 0, pos) === null && C.distancesTrou(carte, 0, null) === null, 'sans green ou sans position');
  /* Trou qui descend (sens −1) */
  const d2 = C.distancesTrou(carte, 1, T[1].dep);
  ok(d2.milieu > 325 && d2.milieu < 335 && d2.fond - d2.entree >= 24 && d2.fond - d2.entree <= 29, 'par 4 joué vers le sud : ' + JSON.stringify(d2));
}

/* --- Relevé à la main --- */
{
  const c = C.carteVide(46.19, 2.24, 'x');
  ok(C.poserReleve(c, 4, [0, 100], [0, 130]) && c.trous.length === 4 && c.trous[3].rel.length === 4 && c.trous[0] === null, 'relevé du green du trou 4');
  const d = C.distancesTrou(c, 3, [0, 0]);
  proche(d.entree, 100, 1, 'relevé : entrée'); proche(d.milieu, 115, 1, 'relevé : milieu'); proche(d.fond, 130, 1, 'relevé : fond');
  ok(C.greenReleve([0, 0], [0, 1]).length === 20 && C.airePoly(C.greenReleve([0, 0], [0, 1])) > 30, 'relevé trop serré : green minimal');
  ok(!C.poserReleve(c, 0, [0, 0], [1, 1]) && !C.poserReleve(c, 40, [0, 0], [1, 1]), 'numéro de trou invalide');
}

/* --- Vue tournée : le jeu vers le haut --- */
{
  const t = carte.trous[1], rep = C.repereTrou(t, null);
  const dep = C.versVue(rep, T[1].dep), g = C.versVue(rep, C.centrePoly(C.dePlat(t.g)));
  ok(Math.abs(g[0]) < 0.01 && Math.abs(g[1]) < 0.01, 'le milieu du green est l\'origine de la vue');
  ok(Math.abs(dep[0]) < 0.5 && dep[1] < -320, 'le départ est en bas, dans l\'axe : ' + dep.map(Math.round).join(', '));
  const q = C.depuisVue(rep, C.versVue(rep, [12, -34]));
  proche(q[0], 12, 1e-6, 'aller-retour de la vue x'); proche(q[1], -34, 1e-6, 'aller-retour de la vue y');
  const sans = C.repereTrou({ g: t.g, l: null }, [C.centrePoly(C.dePlat(t.g))[0] + 100, C.centrePoly(C.dePlat(t.g))[1]]);
  const moi = C.versVue(sans, [C.centrePoly(C.dePlat(t.g))[0] + 100, C.centrePoly(C.dePlat(t.g))[1]]);
  ok(Math.abs(moi[0]) < 0.01 && Math.abs(moi[1] + 100) < 0.01, 'sans tracé : la vue part de ma position');
}

/* --- Recherche --- */
{
  ok(C.motsNom('Golf de la Jonchère').join() === 'jonchere', 'mots utiles du nom');
  ok(C.motifNom('Golf de la Jonchère') === 'j(o|ô|ö)n(c|ç)h(e|é|è|ê|ë)r(e|é|è|ê|ë)', 'motif insensible aux accents : ' + C.motifNom('Golf de la Jonchère'));
  ok(new RegExp(C.motifNom('jonchere'), 'i').test('Golf de la Jonchère') && new RegExp(C.motifNom('La Jonchère Gouzon'), 'i').test('Golf de la Jonchère - Gouzon'), 'le motif retrouve le nom');
  ok(C.motifNom('golf') === null && C.motifNom('ab') === null && C.motifNom('') === null, 'nom vide ou trop court');
  ok(!/["\\]/.test(C.motifNom('jon"ch\\ere')), 'guillemets et barres retirés du motif');
  ok(/name"~"j\(o/.test(C.requeteNom('jonchere')) && /out tags bb 20;$/.test(C.requeteNom('jonchere')), 'requête par nom');
  ok(/around:8000,46\.19000,2\.24000/.test(C.requeteAutour(46.19, 2.24)), 'requête autour de moi');
  const rq = C.requeteGolf([46.18, 2.23, 46.2, 2.25]);
  ok(/nwr\["golf"\]\(46\.17880,2\.22880,46\.20120,2\.25120\)/.test(rq) && /out body geom;$/.test(rq), 'requête du parcours : ' + rq);
  const l = C.lireGolfs(D.rechercheTest());
  ok(l.length === 2 && l[0].nom === 'Golf de la Jonchère' && l[0].lieu === 'Gouzon' && l[0].bornes.length === 4 && l[1].bornes[2] - l[1].bornes[0] > 0.01, 'golfs trouvés : ' + l.map(x => x.nom).join(', '));
  ok(C.lireGolfs(null).length === 0 && C.lireGolfs({ elements: [{ type: 'way', tags: { leisure: 'park' } }] }).length === 0, 'réponse vide');
}

/* --- Golf sans green dessiné : drapeaux et tracés (comme La Jonchère) --- */
{
  const r = C.construireCarte(D.golfDrapeaux(), 'osm', '2026-11-16');
  ok(r && r.bilan.greens === 0 && r.bilan.numerotes === 18 && r.bilan.estimes === 18 && r.bilan.drapeaux === 19 && r.bilan.nom === 'Golf de la Jonchère', 'drapeaux seuls : ' + JSON.stringify(r && r.bilan));
  const c = r.carte, T = D.trous();
  ok(c.trous.every(t => t && t.est === 1 && t.g.length === 32) && c.libres.length === 1 && c.libres[0].est === 1, '18 greens estimés, le putting green reste sans numéro');
  const P = q => { const ll = C.deprojeter(D.O, q[0], q[1]); return C.projeter(c.o, ll[0], ll[1]); };
  const g1 = C.centrePoly(C.dePlat(c.trous[0].g)), m1 = P(T[0].green);
  ok(C.dist2(g1, m1) < 0.5, 'le green estimé est centré sur le drapeau');
  const d1 = C.distancesTrou(c, 0, P(T[0].dep));
  ok(d1 && Math.abs(d1.milieu - 150) <= 1 && Math.abs(d1.entree - 136) <= 1 && Math.abs(d1.fond - 164) <= 1, 'par 3 depuis le départ : ' + JSON.stringify(d1));
  const d7 = C.distancesTrou(c, 6, P(T[6].dep));
  ok(d7 && Math.abs(d7.milieu - C.dist2(P(T[6].dep), P(T[6].green))) <= 1 && d7.fond - d7.entree === 28, 'tracé à l\'envers remis dans le bon sens : ' + JSON.stringify(d7));
  const sans = C.construireCarte(D.golfDrapeaux({ sansDrapeau: [4] }), 'osm');
  ok(sans.bilan.estimes === 18 && C.dist2(C.centrePoly(C.dePlat(sans.carte.trous[3].g)), C.projeter(sans.carte.o, ...C.deprojeter(D.O, T[3].green[0], T[3].green[1]))) < 0.5, 'sans drapeau : green estimé au bout du tracé');
  const a = C.assainirCarte(JSON.parse(JSON.stringify(c)));
  ok(JSON.stringify(a) === JSON.stringify(c), 'la marque « estimé » survit au stockage');
  C.poserReleve(c, 1, [0, 0], [0, 30]);
  ok(!c.trous[0].est && c.trous[0].rel && c.trous[1].est === 1, 'un relevé sur place remplace le green estimé');
  C.numeroterGreen(c, 0, 2);
  ok(c.trous[1].est === 1 && c.libres.length === 1 && c.libres[0].est === 1, 'numéroter un green estimé garde la marque');
}

/* --- Recherche par Nominatim et téléchargement par l'API d'OpenStreetMap --- */
{
  const u = C.urlRechercheGolf('Jonchère');
  ok(/^https:\/\/nominatim\.openstreetmap\.org\/search\?format=jsonv2&addressdetails=1/.test(u) && /&q=golf%20Jonch%C3%A8re$/.test(u), 'recherche par nom : ' + u);
  ok(/&q=Golf%20de%20la%20Jonch%C3%A8re$/.test(C.urlRechercheGolf('Golf de la Jonchère')) && /&q=Jonch%C3%A8re$/.test(C.urlRechercheGolf('Jonchère', true)), 'pas de « golf » en double');
  ok(C.urlRechercheGolf('le') === null && C.urlRechercheGolf('golf') === null, 'nom trop court');
  ok(/&bounded=1&viewbox=2\.1200,46\.2700,2\.3600,46\.1100&q=golf$/.test(C.urlGolfsAutour(46.19, 2.24)), 'recherche autour de moi : ' + C.urlGolfsAutour(46.19, 2.24));
  const l = C.lireNominatim(D.nominatimTest());
  ok(l.length === 2 && l[0].nom === 'Golf de la Jonchère' && l[0].lieu === 'Gouzon, Creuse' && l[1].lieu === 'Montluçon, Auvergne-Rhône-Alpes' && l[0].bornes[0] < l[0].bornes[2] && l[0].bornes[1] < l[0].bornes[3], 'golfs lus dans Nominatim : ' + JSON.stringify(l.map(x => [x.nom, x.lieu])));
  const pres = C.lireNominatim(D.nominatimTest(), [46.4, 2.6]);
  ok(pres[0].nom === 'Golf des Jonchères', 'autour de moi : le plus proche en premier');
  ok(C.lireNominatim(null).length === 0 && C.lireNominatim([{ category: 'leisure', type: 'golf_course', boundingbox: ['x'] }]).length === 0, 'réponse Nominatim vide ou abîmée');
  const uo = C.urlCarteOSM([46.2048538, 2.2541593, 46.2110429, 2.2688742]);
  ok(uo === 'https://api.openstreetmap.org/api/0.6/map.json?bbox=2.252959,46.203654,2.270074,46.212243', 'téléchargement du parcours : ' + uo);
}

/* --- Contrôle du stockage --- */
{
  const a = C.assainirCarte(JSON.parse(JSON.stringify(carte)));
  ok(JSON.stringify(a) === JSON.stringify(carte), 'une carte saine est conservée à l\'identique');
  ok(C.assainirCarte(null) === null && C.assainirCarte({ o: [200, 0], trous: [] }) === null && C.assainirCarte({ o: ['a', 2] }) === null, 'origine invalide');
  const b = C.assainirCarte({ o: [46, 2], src: 'x', trous: [{ g: [1, 2, 3] }, { g: [0, 0, 10, 0, 10, 10], l: 'x', par: 9, b: [[1, 2], 'x', [0, 0, 1, 1, 2, 2]] }, 'x'], libres: 'x' });
  ok(b.src === 'osm' && b.trous[0] === null && b.trous[1].par === 0 && b.trous[1].l === null && b.trous[1].b.length === 1 && b.trous[2] === null && b.libres.length === 0 && C.assainirCarte({ o: [46, 2], trous: [], libres: [{ g: [0, 0, 5, 0, 5, 5], b: 'x' }, 'x', { g: [1] }] }).libres.length === 1, 'formes invalides écartées : ' + JSON.stringify(b));
  ok(C.assainirForme([1, 2, 3, 4, 5, 1e9]) === null && C.assainirForme([1, 2, 3, 4, 5]) === null, 'forme hors limites ou impaire');
}

console.log(n + ' vérifications · ' + ko + ' échec' + (ko > 1 ? 's' : ''));
process.exit(ko ? 1 : 0);
