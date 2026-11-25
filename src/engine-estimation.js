/* Coach de golf de poche — estimation responsable des coups perdus (roadmap DATA, P10). Fonctions pures.
   Ce n'est pas du Strokes Gained : le Strokes Gained compare chaque coup à une référence selon la distance et la
   position de la balle. Ici, on estime par secteur à partir du score, des greens en régulation (déduits), des
   mises en jeu renseignées, des putts et des pénalités. Aucune distance n'est nécessaire. */

var HABITUEL_RECENT = 5, HABITUEL_BASE = 20, HABITUEL_MIN_RECENT = 27, HABITUEL_MIN_BASE = 72;

function arr1E(v) { return v == null ? null : Math.round(v * 10) / 10; }
function arr2E(v) { return v == null ? null : Math.round(v * 100) / 100; }
function jourE(d) { return typeof d === "string" ? d.slice(0, 10) : null; }

/* Chiffres d'un groupe de parties, ramenés à 18 trous. La mise en jeu ne compte que là où elle est connue. */
function profilSecteurs(parties) {
  var s = statsTrous([]), cm = couvertureMej(parties, Infinity);
  parties.forEach(function (p) { ajouterStats(s, statsTrous(p.trous)); });
  var k = s.T ? 18 / s.T : 0;
  return {
    parties: parties.length, trous: s.T, notes: s.N, mej: cm,
    du: parties.length ? jourE(parties[0].d) : null, au: parties.length ? jourE(parties[parties.length - 1].d) : null,
    u: cm.u,
    m: s.M * k, g: s.G * k,
    pg: s.G ? s.PG / s.G : null, pm: s.M ? s.PM / s.M : null,
    x: s.X * k, e: s.N >= 9 ? s.E * 18 / s.N : null,
    score: s.N >= 9 ? (s.S - s.PAR) * 18 / s.N : null
  };
}

/* Écart des dernières parties à la performance habituelle du joueur (les parties d'avant), secteur par secteur.
   Positif : mieux que d'habitude. Ne demande ni index cible ni distance. null + raison si les données manquent. */
function ecartsHabituels(parties) {
  var l = (parties || []).filter(function (p) { return p && Array.isArray(p.trous) && p.trous.length; });
  var nr = Math.min(HABITUEL_RECENT, Math.floor(l.length / 2));
  if (nr < 1) return { ok: false, raison: "parties", manque: Math.max(0, 2 - l.length) };
  var recent = l.slice(l.length - nr), base = l.slice(Math.max(0, l.length - nr - HABITUEL_BASE), l.length - nr);
  var R = profilSecteurs(recent), B = profilSecteurs(base);
  if (R.trous < HABITUEL_MIN_RECENT || B.trous < HABITUEL_MIN_BASE)
    return { ok: false, raison: "trous", recent: R, base: B, manqueRecent: Math.max(0, HABITUEL_MIN_RECENT - R.trous), manqueBase: Math.max(0, HABITUEL_MIN_BASE - B.trous) };
  var v = 1 + (B.pm == null ? 1 : B.pm) - (B.pg == null ? 2 : B.pg);   /* ce que coûte un green manqué, d'habitude */
  var departConnu = R.u != null && B.u != null;
  var brut = {
    depart: departConnu ? -(R.u - B.u) * v : null,
    attaque: departConnu ? -((R.m - R.u) - (B.m - B.u)) * v : -(R.m - B.m) * v,
    petit: R.pm != null && B.pm != null ? -(R.pm - B.pm) * R.m : null,
    putting: R.pg != null && B.pg != null ? -(R.pg - B.pg) * R.g : null,
    penal: -(R.x - B.x),
    rattrapage: R.e != null && B.e != null ? -(R.e - B.e) : null
  };
  var total = 0;
  var secteurs = SG_SECTEURS.map(function (s) {
    var val = brut[s.id] == null ? null : arr1E(brut[s.id]);
    if (val === 0) val = 0;
    if (val != null) total += val;
    return { id: s.id, nom: s.id === "attaque" && !departConnu ? "Attaques de green (départ compris)" : s.nom, d: s.d, ecart: val };
  });
  return { ok: true, recent: R, base: B, departConnu: departConnu, secteurs: secteurs, total: arr1E(total),
    scoreEcart: R.score != null && B.score != null ? arr1E(B.score - R.score) : null };
}

/* Fiabilité et données manquantes d'une estimation face à un index cible (résultat de coupsGagnes). */
function limitesEstimation(r) {
  if (!r) return null;
  var l = [];
  if (!r.departConnu) l.push({ id: "mej", txt: "Mises en jeu trop peu renseignées (" + r.mej.connus + " départs connus sur " + r.mej.departs + " par 4 et 5) : le départ n'est pas séparé des attaques de green." });
  else if (r.mej.inconnus) l.push({ id: "mej", txt: r.mej.inconnus + " départs sans mise en jeu renseignée (saisie express) : le départ est estimé sur les " + r.mej.connus + " autres." });
  if (r.N < r.T) l.push({ id: "score", txt: (r.T - r.N) + " trous sans score : le rattrapage porte sur les " + r.N + " autres." });
  if (r.detail < Math.min(9, r.T)) l.push({ id: "putt1", txt: "Longueur du premier putt rarement notée (" + r.detail + " trous) : le putting compare ta moyenne de putts à celle de la cible, sans tenir compte de la longueur." });
  var fiab = r.T >= 72 ? "établie" : r.T >= 36 ? "indicative" : "tendance";
  return { fiabilite: fiab, limites: l };
}

if (typeof module !== "undefined") {
  var EPx = require("./engine-plus.js");
  var statsTrous = EPx.statsTrous, ajouterStats = EPx.ajouterStats, couvertureMej = EPx.couvertureMej;
  var SG_SECTEURS = require("./data-plus.js").SG_SECTEURS;
  module.exports = { ecartsHabituels, profilSecteurs, limitesEstimation, HABITUEL_MIN_RECENT, HABITUEL_MIN_BASE };
}
