/* ============================================================
   MOTEUR : palier, scores par domaine, priorités, diagnostic des symptômes,
   génération du plan de 4 semaines. Fonctions pures, sans accès à l'écran.
   ============================================================ */

if (typeof module !== "undefined") {
  Object.assign(globalThis, require("./data-base.js"), require("./data-symptomes.js"),
    require("./data-exercices-1.js"), require("./data-exercices-2.js"));
}

const EXERCICES = EXERCICES_1.concat(EXERCICES_2);
EXERCICES.forEach(function (e, i) { e.ord = i; });
const EX = {}; EXERCICES.forEach(function (e) { EX[e.id] = e; });
const SYM = {}; SYMPTOMES.forEach(function (s) { SYM[s.id] = s; });
const DOM = {}; DOMAINES.forEach(function (d) { DOM[d.id] = d; });
const IND = {}; INDICATEURS.forEach(function (i) { IND[i.id] = i; });

const LIEUX_GOLF = ["practice", "putting", "zone", "sable"];
const ORDRE_DOMAINES = ["fers", "drive", "wedge", "approche", "bunker", "putt_court", "putt_long", "strategie", "physique"];

function palierDe(index) {
  if (index >= 36) return 1;
  if (index >= 24) return 2;
  if (index >= 12) return 3;
  return 4;
}

/* Index déclaré par le joueur, ou null s'il ne le connaît pas (P02) : jamais de faux index. */
function indexDeclare(profil) { return profil && !profil.sansIndex && typeof profil.index === "number" && isFinite(profil.index) ? profil.index : null; }
/* Niveau servant seulement à choisir les exercices et les repères d'entraînement : l'index déclaré, sinon celui
   d'un joueur qui débute (palier 1). Il n'est jamais affiché ni utilisé dans une statistique. */
var INDEX_NIVEAU_INCONNU = 54;
function indexNiveau(profil) { var i = indexDeclare(profil); return i == null ? INDEX_NIVEAU_INCONNU : i; }

/* Latéralité : remplace les jetons {gf} {gm} {df} {dm}. */
function lat(txt, lateralite) {
  var G = lateralite === "G";
  return String(txt).replace(/\{(gf|gm|df|dm)\}/g, function (m, k) {
    if (!G) return { gf: "gauche", gm: "gauche", df: "droite", dm: "droit" }[k];
    return { gf: "droite", gm: "droit", df: "gauche", dm: "gauche" }[k];
  });
}

/* Score d'un indicateur par rapport au repère du palier : 1 = au repère. */
function scoreIndicateur(ind, val, palier) {
  if (val == null) return null;
  var T = ind.rep[palier - 1];
  var s = ind.sens === "bas" ? 1 - (val - T) / (T + 2) : val / T;
  return Math.max(0, Math.min(1.3, s));
}

/* Position par rapport au repère : "dessus", "repere" ou "dessous". */
function etatValeur(sens, val, repere) {
  if (val == null) return null;
  var diff = sens === "bas" ? repere - val : val - repere;
  if (diff >= 1) return "dessus";
  if (diff <= -1) return "dessous";
  return "repere";
}

function valeurInd(profil, id) {
  var r = profil.indicateurs && profil.indicateurs[id];
  return r && r.val != null ? r.val : null;
}

function scoresDomaines(profil) {
  var p = palierDe(indexNiveau(profil)), res = {};
  DOMAINES.forEach(function (d) {
    if (d.transversal) return;
    var vals = INDICATEURS.filter(function (i) { return i.d === d.id; }).map(function (i) {
      var v = valeurInd(profil, i.id);
      var r = profil.indicateurs && profil.indicateurs[i.id];
      return { ind: i, val: v, src: r ? r.src : null, score: scoreIndicateur(i, v, p), etat: etatValeur(i.sens, v, i.rep[p - 1]) };
    });
    var connus = vals.filter(function (v) { return v.score != null; });
    var score = connus.length ? connus.reduce(function (a, v) { return a + v.score; }, 0) / connus.length : null;
    res[d.id] = { score: score, vals: vals };
  });
  return res;
}

function priorites(profil) {
  var p = palierDe(indexNiveau(profil)), sc = scoresDomaines(profil);
  var syms = Object.keys(profil.symptomes || {}).filter(function (id) { return SYM[id]; });
  return DOMAINES.filter(function (d) { return !d.transversal; }).map(function (d) {
    var s = sc[d.id];
    var ecart = s.score == null ? 0.25 : 1 - Math.min(1, s.score);
    var nSym = syms.filter(function (id) { return SYM[id].d === d.id; }).length;
    var envie = (profil.envies || []).indexOf(d.id) >= 0 ? 1 : 0;
    var poids = IMPACT[d.id][p - 1] * (0.3 + ecart) * (1 + 0.25 * envie) + 0.4 * Math.min(nSym, 2);
    return { d: d.id, poids: poids, ecart: ecart, score: s.score, nSym: nSym, envie: envie };
  }).sort(function (a, b) { return b.poids - a.poids; });
}

/* Classe les causes d'un symptôme selon le palier et les réponses. */
function diagnostiquer(symId, reponses, palier) {
  var sym = SYM[symId], sc = {};
  sym.causes.forEach(function (c) { sc[c.id] = c.p[palier - 1]; });
  sym.questions.forEach(function (q) {
    var i = reponses ? reponses[q.id] : null;
    if (i == null || !q.o[i]) return;
    var e = q.o[i].e;
    Object.keys(e).forEach(function (k) { if (k in sc) sc[k] += e[k]; });
  });
  var liste = sym.causes.map(function (c, i) { return { cause: c, score: sc[c.id], i: i }; })
    .sort(function (a, b) { return b.score - a.score || a.i - b.i; });
  var top = liste[0].score;
  liste.forEach(function (x, i) { x.rang = i === 0 ? "probable" : (x.score >= 0.6 * top ? "possible" : "secondaire"); });
  return liste;
}

/* Ordre de correction : les réglages de base passent avant le geste,
   parmi les causes jugées probables ou possibles. */
function ordreCorrection(causes) {
  var retenues = causes.filter(function (c) { return c.rang !== "secondaire"; });
  var autres = causes.filter(function (c) { return c.rang === "secondaire"; });
  retenues = retenues.filter(function (c) { return c.cause.base; }).concat(retenues.filter(function (c) { return !c.cause.base; }));
  return retenues.concat(autres);
}

function symptomesOrdonnes(profil) {
  var ids = Object.keys(profil.symptomes || {}).filter(function (id) { return SYM[id]; });
  var pr = profil.symptomePrincipal;
  if (pr && ids.indexOf(pr) > 0) { ids.splice(ids.indexOf(pr), 1); ids.unshift(pr); }
  return ids;
}

function exoEligible(ex, palier, lieux) {
  return ex.niv[0] <= palier && palier <= ex.niv[1] && ex.lieux.some(function (l) { return lieux.indexOf(l) >= 0; });
}

/* ------------------------------------------------------------
   Génération du plan : 4 semaines, n séances par semaine.
   ------------------------------------------------------------ */
function genererPlan(profil, cycle) {
  var palier = palierDe(indexNiveau(profil));
  var prios = priorites(profil);
  var lieux = profil.lieux || [];
  var lieuxGolf = LIEUX_GOLF.filter(function (l) { return lieux.indexOf(l) >= 0; });
  var surPlace = lieuxGolf.length > 0;
  var lieuxSeance = surPlace ? lieuxGolf : ["maison"];
  var aMaison = lieux.indexOf("maison") >= 0, aParcours = lieux.indexOf("parcours") >= 0;
  var n = Math.max(1, Math.min(4, profil.seances || 1));
  var duree = profil.duree || 60;
  var used = {};
  function elig(e) { return exoEligible(e, palier, lieuxSeance); }
  function nb(id) { return used[id] || 0; }

  /* Symptômes et exercices correctifs */
  var symIds = symptomesOrdonnes(profil);
  var diags = symIds.map(function (id) {
    return { id: id, causes: diagnostiquer(id, (profil.symptomes[id] || {}).reponses, palier) };
  });
  var correctifs = diags.map(function (dg) {
    var ordre = ordreCorrection(dg.causes);
    var c1 = ordre[0], c2 = ordre[1];
    function liste(c) { return c ? c.cause.exos.map(function (x) { return EX[x]; }).filter(function (e) { return e && elig(e); }) : []; }
    return { sym: dg.id, c1: c1.cause.id, c2: c2 ? c2.cause.id : null, promu: c1.rang !== "probable", e1: liste(c1), e2: liste(c2), k: 0 };
  }).filter(function (c) { return c.e1.length || c.e2.length; }).slice(0, 2);

  /* Domaines planifiables et rotation pondérée */
  var rangPoids = [5, 4, 3, 1.5, 1, 0.75, 0.5, 0.5];
  var domElig = [], nonPlanifies = [];
  prios.forEach(function (p) {
    if (p.d === "strategie") return;
    if (EXERCICES.some(function (e) { return e.d === p.d && elig(e); })) domElig.push(p.d);
    else nonPlanifies.push(p.d);
  });
  var wrr = domElig.map(function (d, i) { return { d: d, w: rangPoids[Math.min(i, rangPoids.length - 1)], cur: 0 }; });
  var totalW = wrr.reduce(function (a, x) { return a + x.w; }, 0);
  function prochainDomaine(exclu) {
    wrr.forEach(function (x) { x.cur += x.w; });
    var cands = wrr.filter(function (x) { return !exclu(x.d); });
    if (!cands.length) return null;
    cands.sort(function (a, b) { return b.cur - a.cur; });
    cands[0].cur -= totalW;
    return cands[0].d;
  }
  var plafond = Math.max(2, Math.ceil((duree / 10) / Math.max(1, domElig.length)));
  function rangDomaine(d) { var i = domElig.indexOf(d); return i < 0 ? 99 : i; }

  /* Tests de début et de fin de cycle : les deux premiers domaines planifiables */
  var tests = [];
  domElig.slice(0, 3).forEach(function (d) {
    if (tests.length >= 2) return;
    var t = EXERCICES.filter(function (e) { return e.d === d && e.type === "test" && elig(e); })[0];
    if (t) tests.push(t);
  });
  var reserves = {}; tests.forEach(function (t) { reserves[t.id] = true; });

  var typesSemaine = {
    1: ["technique", "routine", "dosage", "jeu", "test"],
    2: ["technique", "dosage", "jeu", "routine", "test"],
    3: ["dosage", "jeu", "technique", "routine", "test"],
    4: ["jeu", "dosage", "technique", "routine", "test"]
  };
  if (profil.objectif === "competition") {
    typesSemaine[3] = ["jeu", "dosage", "test", "technique", "routine"];
    typesSemaine[4] = ["jeu", "test", "dosage", "technique", "routine"];
  }
  if (profil.objectif === "regularite") {
    typesSemaine[2] = ["technique", "jeu", "dosage", "routine", "test"];
  }

  function choisir(d, semaine, reste, ids) {
    var pref = typesSemaine[semaine];
    var cands = EXERCICES.filter(function (e) {
      return e.d === d && !e.corr && elig(e) && !ids[e.id] && !reserves[e.id] && e.min <= reste;
    });
    cands.sort(function (a, b) {
      return nb(a.id) - nb(b.id) || pref.indexOf(a.type) - pref.indexOf(b.type) || a.ord - b.ord;
    });
    return cands[0] || null;
  }

  var roleOrdre = { test_initial: 0, test_final: 0, correctif: 1, routine: 2, priorite: 3, entretien: 3 };
  var semaines = [], g = 0;

  for (var w = 1; w <= 4; w++) {
    var seances = [];
    for (var s = 1; s <= n; s++, g++) {
      var reste = duree - (surPlace ? 5 : 0);
      var blocs = [], ids = {}, parDom = {};
      var ajouter = function (ex, role, extra) {
        var b = { ex: ex.id, min: ex.min, role: role };
        if (extra) { b.sym = extra.sym; b.cause = extra.cause; }
        blocs.push(b); ids[ex.id] = true; used[ex.id] = nb(ex.id) + 1; reste -= ex.min;
        parDom[ex.d] = (parDom[ex.d] || 0) + 1;
      };

      /* 1. Tests */
      var premier = w === 1 && s === 1, dernier = w === 4 && s === n;
      if (premier || dernier) {
        tests.forEach(function (t, i) {
          if ((i === 0 || duree >= 45) && !ids[t.id]) ajouter(t, premier ? "test_initial" : "test_final");
        });
      }

      /* 2. Exercices correctifs */
      if (correctifs.length) {
        var nbCorr = (profil.objectif === "defaut" && duree >= 45) ? 2 : 1;
        for (var i = 0; i < nbCorr && reste >= 10; i++) {
          var c = correctifs[(g + i) % correctifs.length];
          /* Réglage de base passé devant la cause la plus probable : semaine 1, puis on
             passe au geste. Sinon : cause principale pendant deux semaines, puis alternance. */
          var surC2;
          if (!c.e2.length) surC2 = false;
          else if (!c.e1.length) surC2 = true;
          else if (c.promu) surC2 = w >= 3 || (w === 2 && c.k++ % 2 === 1);
          else surC2 = w >= 3 && c.k++ % 2 === 0;
          var liste = surC2 ? c.e2 : c.e1;
          var cause = surC2 ? c.c2 : c.c1;
          var dispo = liste.filter(function (e) { return !ids[e.id] && e.min <= reste; })
            .sort(function (a, b) { return nb(a.id) - nb(b.id) || liste.indexOf(a) - liste.indexOf(b); });
          if (dispo.length) { ajouter(dispo[0], "correctif", { sym: c.sym, cause: cause }); }
        }
      }

      /* 3. Routine de jeu en semaine 3 */
      if (w === 3 && s === 1 && reste >= 10 && EX.st_routine && elig(EX.st_routine) && !ids.st_routine) {
        ajouter(EX.st_routine, "routine");
      }

      /* 4. Remplissage selon les priorités */
      var garde = 0;
      while (reste >= 10 && garde++ < 40) {
        var d = prochainDomaine(function (dd) { return (parDom[dd] || 0) >= plafond; });
        if (!d) break;
        var ex = choisir(d, w, reste, ids);
        if (!ex) continue;
        ajouter(ex, rangDomaine(d) < 3 ? "priorite" : "entretien");
      }

      blocs.sort(function (a, b) {
        return roleOrdre[a.role] - roleOrdre[b.role] ||
          ORDRE_DOMAINES.indexOf(EX[a.ex].d) - ORDRE_DOMAINES.indexOf(EX[b.ex].d);
      });

      /* Titre et lieux de la séance */
      var minutes = {};
      blocs.forEach(function (b) { var dd = EX[b.ex].d; minutes[dd] = (minutes[dd] || 0) + b.min; });
      var doms = Object.keys(minutes).sort(function (a, b) { return minutes[b] - minutes[a] || rangDomaine(a) - rangDomaine(b); }).slice(0, 2);
      var lieuxUtilises = [];
      blocs.forEach(function (b) {
        var l = EX[b.ex].lieux.filter(function (x) { return lieuxSeance.indexOf(x) >= 0; })[0];
        b.lieu = l;
        if (l && lieuxUtilises.indexOf(l) < 0) lieuxUtilises.push(l);
      });
      var total = blocs.reduce(function (a, b) { return a + b.min; }, 0) + (surPlace ? 5 : 0);
      seances.push({ id: "c" + cycle + "-s" + w + "-" + s, num: s, doms: doms, min: total, lieux: lieuxUtilises, echauffement: surPlace, blocs: blocs });
    }
    semaines.push({ n: w, theme: THEMES_SEMAINE[w - 1], seances: seances, mission: null, maison: [] });
  }

  /* Missions de parcours : une par semaine */
  if (aParcours) {
    var cand = [];
    function pousser(id) {
      var e = EX[id];
      if (e && cand.indexOf(id) < 0 && e.lieux.indexOf("parcours") >= 0 && e.niv[0] <= palier && palier <= e.niv[1] && e.lieux[0] === "parcours") cand.push(id);
    }
    diags.forEach(function (dg) {
      dg.causes.slice(0, 2).forEach(function (c) { c.cause.exos.forEach(pousser); });
    });
    prios.slice(0, 3).forEach(function (p) { if (MISSION_PAR_DOMAINE[p.d]) pousser(MISSION_PAR_DOMAINE[p.d]); });
    (MISSIONS_DEFAUT[palier] || []).forEach(pousser);
    EXERCICES.forEach(function (e) { pousser(e.id); });
    semaines.forEach(function (sem, i) { sem.mission = cand[i % cand.length] || null; });
  }

  /* Routine à la maison : deux exercices courts par semaine */
  if (aMaison && surPlace) {
    var maisonOk = function (e) { return e && e.lieux.indexOf("maison") >= 0 && e.niv[0] <= palier && palier <= e.niv[1] && e.min > 0; };
    var mCorr = [];
    diags.forEach(function (dg) {
      dg.causes.slice(0, 2).forEach(function (c) {
        c.cause.exos.forEach(function (x) { if (maisonOk(EX[x]) && mCorr.indexOf(x) < 0) mCorr.push(x); });
      });
    });
    var mPrio = [];
    prios.forEach(function (p) {
      EXERCICES.forEach(function (e) {
        if (e.d === p.d && !e.corr && maisonOk(e) && e.type !== "test" && mPrio.indexOf(e.id) < 0 && mCorr.indexOf(e.id) < 0) mPrio.push(e.id);
      });
    });
    ["ph_mobilite", "ph_equilibre"].forEach(function (x) { if (maisonOk(EX[x]) && mPrio.indexOf(x) < 0) mPrio.push(x); });
    semaines.forEach(function (sem, i) {
      var a = mCorr.length ? mCorr[i % mCorr.length] : null;
      var reste2 = mPrio.filter(function (x) { return x !== a; });
      var b = reste2.length ? reste2[i % reste2.length] : null;
      var c2 = (!a && reste2.length > 1) ? reste2[(i + Math.ceil(reste2.length / 2)) % reste2.length] : null;
      sem.maison = [a, b, c2].filter(function (x, j, arr) { return x && arr.indexOf(x) === j; }).slice(0, 2);
    });
  }

  return {
    cycle: cycle, cree: new Date().toISOString(), palier: palier, duree: duree, n: n,
    priorites: prios.slice(0, 3).map(function (p) { return p.d; }),
    correctifs: correctifs.map(function (c) { return { sym: c.sym, c1: c.c1, c2: c.c2 }; }),
    nonPlanifies: nonPlanifies,
    tests: tests.map(function (t) { return t.id; }),
    semaines: semaines
  };
}

if (typeof module !== "undefined") {
  module.exports = { EXERCICES, EX, SYM, DOM, IND, palierDe, indexDeclare, indexNiveau, lat, scoreIndicateur, etatValeur, scoresDomaines, priorites, diagnostiquer, ordreCorrection, symptomesOrdonnes, exoEligible, genererPlan };
}
