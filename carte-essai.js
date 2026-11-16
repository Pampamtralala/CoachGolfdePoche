/* Données d'essai pour la carte GPS : un golf inventé de 18 trous, au format des réponses Overpass (OpenStreetMap). */
const C = require('./src/engine-carte.js');
const O = [46.19, 2.24];
const PARS = [3, 4, 5, 4, 4, 3, 4, 5, 4, 4, 3, 5, 4, 4, 3, 4, 5, 4];
const LONG = { 3: 150, 4: 330, 5: 480 };
let ID = 1000;
const geo = pts => pts.map(q => { const ll = C.deprojeter(O, q[0], q[1]); return { lat: ll[0], lon: ll[1] }; });
const ovale = (cx, cy, rx, ry, n) => { const p = []; for (let i = 0; i < (n || 16); i++) { const t = 2 * Math.PI * i / (n || 16); p.push([cx + rx * Math.cos(t), cy + ry * Math.sin(t)]); } p.push(p[0]); return p; };
const voie = (tags, pts) => ({ type: 'way', id: ID++, tags, geometry: geo(pts) });

/* Départ et milieu du green de chaque trou, en mètres autour de l'origine : les trous montent et descendent tour à tour. */
function trous() {
  return PARS.map((par, i) => {
    const col = i % 6, rang = Math.floor(i / 6), sens = i % 2 ? -1 : 1, L = LONG[par];
    const x = col * 130 - 325, y0 = rang * 560 - 840 + (sens < 0 ? 500 : 0);
    return { n: i + 1, par, sens, dep: [x, y0], green: [x + (par > 3 ? 20 : 0), y0 + sens * L], coude: par > 3 ? [x + 28, y0 + sens * L * 0.55] : null };
  });
}
/* Réponse à la requête du parcours : greens, tracés, bunkers, eau, fairways. */
function golfTest(opts) {
  opts = opts || {};
  ID = 1000;
  const el = [];
  el.push(voie({ leisure: 'golf_course', name: 'Golf de la Jonchère' }, [[-450, -900], [450, -900], [450, 900], [-450, 900], [-450, -900]]));
  trous().forEach(t => {
    const g = ovale(t.green[0], t.green[1], 11, 14);
    if (t.n === 12) {
      /* Green en multipolygone, en deux moitiés. */
      el.push({ type: 'relation', id: ID++, tags: { type: 'multipolygon', golf: 'green' }, members: [
        { type: 'way', ref: ID++, role: 'outer', geometry: geo(g.slice(0, 9)) }, { type: 'way', ref: ID++, role: 'outer', geometry: geo(g.slice(8)) }] });
    } else el.push(voie({ golf: 'green' }, g));
    if (!opts.sansTraces) {
      let l = t.coude ? [t.dep, t.coude, t.green] : [t.dep, t.green];
      if (t.n === 7) l = l.slice().reverse();   /* tracé dessiné à l'envers */
      el.push(voie({ golf: 'hole', ref: String(t.n), par: String(t.par) }, l));
    }
    el.push(voie({ golf: 'tee' }, ovale(t.dep[0], t.dep[1], 4, 6, 8)));
    el.push(voie({ golf: 'bunker' }, ovale(t.green[0] - 18, t.green[1] - t.sens * 16, 5, 4, 10)));
    if (t.par > 3) el.push(voie({ golf: 'fairway' }, [[t.dep[0] - 14, t.dep[1] + t.sens * 90], [t.dep[0] + 16, t.dep[1] + t.sens * 90], [t.green[0] + 16, t.green[1] - t.sens * 30], [t.green[0] - 14, t.green[1] - t.sens * 30], [t.dep[0] - 14, t.dep[1] + t.sens * 90]]));
  });
  const t5 = trous()[4];
  el.push(voie({ natural: 'water' }, ovale(t5.green[0] + 26, t5.green[1] - t5.sens * 5, 9, 14, 12)));
  el.push(voie({ golf: 'green' }, ovale(380, -700, 15, 15)));                       /* putting green, sans numéro */
  el.push(voie({ golf: 'green', sport: 'miniature_golf' }, ovale(400, -640, 2, 2)));  /* minigolf : ignoré */
  return { version: 0.6, elements: el };
}
/* Réponse à une recherche de golf par nom ou autour d'une position. */
function rechercheTest() {
  const a = C.deprojeter(O, -450, -900), b = C.deprojeter(O, 450, 900);
  return { version: 0.6, elements: [
    { type: 'way', id: 1, tags: { leisure: 'golf_course', name: 'Golf de la Jonchère', 'addr:city': 'Gouzon' }, bounds: { minlat: a[0], minlon: a[1], maxlat: b[0], maxlon: b[1] } },
    { type: 'node', id: 2, lat: 46.4, lon: 2.6, tags: { leisure: 'golf_course', name: 'Golf des Jonchères' } }] };
}
/* Position en degrés d'un point donné en mètres. */
const position = (x, y) => { const ll = C.deprojeter(O, x, y); return { latitude: ll[0], longitude: ll[1] }; };
module.exports = { O, PARS, LONG, trous, golfTest, rechercheTest, position };
