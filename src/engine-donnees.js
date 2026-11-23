/* Coach de golf de poche — identifiants stables des données (roadmap DATA, P01).
   Chaque partie, coup et série de practice reçoit un identifiant qui ne change plus :
   - créé à la saisie (aléatoire, horodaté) ;
   - pour les anciennes données, calculé à partir du contenu et de la position (déterministe : le même
     résultat à chaque chargement, même si l'écriture précédente a échoué), puis enregistré.
   Un identifiant déjà présent et valide n'est jamais modifié. Rien n'est supprimé. */

var ID_FORME = /^[pcs]_[0-9a-z]{4,24}$/;
function idValide(v, prefixe) { return typeof v === "string" && ID_FORME.test(v) && v.charAt(0) === prefixe; }
function nouvelId(prefixe) { return prefixe + "_" + Date.now().toString(36) + Math.floor(Math.random() * 2176782336).toString(36); }
/* FNV-1a 32 bits, deux passes, en base 36 : court et stable. */
function hashTexte(s) {
  var h1 = 0x811c9dc5, h2 = 0x01000193 ^ s.length;
  for (var i = 0; i < s.length; i++) {
    var c = s.charCodeAt(i);
    h1 ^= c; h1 = Math.imul(h1, 16777619) >>> 0;
    h2 ^= c + i; h2 = Math.imul(h2, 2246822519) >>> 0;
  }
  return h1.toString(36) + h2.toString(36);
}
function idDerive(prefixe, texte, vus) {
  var base = prefixe + "_" + hashTexte(texte).slice(0, 14), id = base, k = 1;
  while (vus[id]) id = base + (k++).toString(36);
  vus[id] = true;
  return id;
}

/* Attribue les identifiants manquants ou en double. e : { parties, partie, carnet: { series } }.
   Rend le nombre d'identifiants créés (0 au second passage : l'opération est idempotente). */
function attribuerIds(e) {
  var crees = 0, vusP = {}, vusS = {};
  var coupsDe = function (p, cle) {
    var vusC = {};
    (p.coups || []).forEach(function (l, t) {
      (l || []).forEach(function (c, i) {
        if (!c || typeof c !== "object") return;
        if (idValide(c.id, "c") && !vusC[c.id]) { vusC[c.id] = true; return; }
        c.id = idDerive("c", cle + "|" + t + "|" + i + "|" + c.c + "|" + (c.d == null ? "" : c.d) + "|" + (c.l == null ? "" : c.l), vusC);
        crees++;
      });
    });
  };
  var partie = function (p, i, enCours) {
    if (!p || typeof p !== "object") return;
    if (idValide(p.id, "p") && !vusP[p.id]) vusP[p.id] = true;
    else {
      p.id = idDerive("p", (enCours ? "encours|" : "partie|" + i + "|") + (p.d || "") + "|" + (p.pc || "") + "|" + (p.o || 0) + "|" + JSON.stringify(p.trous || []), vusP);
      crees++;
    }
    coupsDe(p, p.id);
  };
  (e.parties || []).forEach(function (p, i) { partie(p, i, false); });
  if (e.partie) partie(e.partie, -1, true);
  ((e.carnet || {}).series || []).forEach(function (s, i) {
    if (!s || typeof s !== "object") return;
    if (idValide(s.id, "s") && !vusS[s.id]) { vusS[s.id] = true; return; }
    s.id = idDerive("s", i + "|" + (s.d || "") + "|" + s.c + "|" + (s.v || []).join(","), vusS);
    crees++;
  });
  return crees;
}

if (typeof module !== "undefined") {
  module.exports = { idValide, nouvelId, hashTexte, attribuerIds };
}
