/* ============================================================
   INTERFACE : accueil, questionnaire, plan, bilan, exercices, profil.
   Les données du joueur sont gardées sur l'appareil et, quand c'est possible,
   dans son espace personnel (voir « Sauvegarde »).
   ============================================================ */
(function () {
  "use strict";

  /* ---------- État et sauvegarde ---------- */
  var CLE = "coachgolf.v1";
  /* Date de fabrication de la page, écrite par le build : elle s'affiche dans le profil. */
  var VERSION_APPLI = "/*VERSION*/";
  function etatNeuf() {
    return { v: 1, schemaDonnees: 2, profil: null, plan: null, fait: {}, scores: {}, cycle: 1, historique: [], maj: 0,
      carnet: { clubs: {}, wedges: {}, sac: null, lofts: {}, wedgesPerso: [], series: [] }, defis: {}, parties: [], partie: null, parcours: [], detail: false, ecranClair: false, conditions: null };
  }
  function lireLocal() {
    try { var s = localStorage.getItem(CLE); var o = s ? JSON.parse(s) : null; return o && o.v === 1 ? o : null; } catch (e) { return null; }
  }
  var sauvegardeLocaleOK = true, sauvegardeIndexee = "attente", ouvertureDB = null, fileEcritures = Promise.resolve();
  function ecrireLocal(json) {
    try { localStorage.setItem(CLE, json || JSON.stringify(etat)); sauvegardeLocaleOK = true; return true; }
    catch (e) { sauvegardeLocaleOK = false; return false; }
  }
  function ouvrirDB() {
    if (!ouvertureDB) ouvertureDB = new Promise(function (ok, ko) {
      if (typeof indexedDB === "undefined") { ko(new Error("IndexedDB absent")); return; }
      var r = indexedDB.open("coachgolf-donnees", 1);
      r.onupgradeneeded = function () { if (!r.result.objectStoreNames.contains("etat")) r.result.createObjectStore("etat"); };
      r.onsuccess = function () { ok(r.result); };
      r.onerror = function () { ko(r.error || new Error("Stockage indisponible")); };
    });
    return ouvertureDB;
  }
  function ecrireDB(json) {
    return ouvrirDB().then(function (db) {
      return new Promise(function (ok, ko) {
        var tx = db.transaction("etat", "readwrite");
        tx.objectStore("etat").put(json, "principal");
        tx.oncomplete = ok;
        tx.onerror = function () { ko(tx.error || new Error("Écriture impossible")); };
        tx.onabort = function () { ko(tx.error || new Error("Écriture annulée")); };
      });
    });
  }
  var etat = lireLocal() || etatNeuf();
  function persisterIndexe(json) {
    sauvegardeIndexee = "attente";
    /* Les écritures sont ordonnées : une sauvegarde ancienne ne peut pas remplacer une nouvelle. */
    fileEcritures = fileEcritures.catch(function () {}).then(function () { return ecrireDB(json); })
      .then(function () { sauvegardeIndexee = "ok"; majStatut(); }, function () { sauvegardeIndexee = "erreur"; majStatut(); });
  }
  /* Parties prises en compte dans les calculs (P04) : sans les parties exclues, coups exclus sans distance ni direction.
     Recalculé seulement quand les données changent. */
  var cacheCalculs = { maj: null, l: null, n: -1, v: [] };
  function partiesAnalyse() {
    var l = etat.parties;
    if (cacheCalculs.maj !== etat.maj || cacheCalculs.l !== l || cacheCalculs.n !== l.length) cacheCalculs = { maj: etat.maj, l: l, n: l.length, v: partiesPourCalculs(l) };
    return cacheCalculs.v;
  }
  function sauver() {
    etat.maj = Math.max(Date.now(), (etat.maj || 0) + 1);
    var json = JSON.stringify(etat);
    ecrireLocal(json);
    persisterIndexe(json);
    planifierEnvoi();
    majStatut();
    return sauvegardeLocaleOK;
  }
  /* P04 : on n'annonce une réussite que si une écriture a abouti (copie locale, sinon sauvegarde de l'appareil). */
  function stockageEnPanne() { return !sauvegardeLocaleOK && sauvegardeIndexee === "erreur"; }
  var MSG_NON_ENREGISTRE = "Attention : ce n’est pas enregistré sur cet appareil (stockage plein ou bloqué). Télécharge une sauvegarde depuis Mes données.";
  function messageEnregistre(ok, ko) {
    if (sauvegardeLocaleOK) { message(ok); return; }
    fileEcritures.then(function () { message(sauvegardeIndexee === "ok" ? ok : (ko || MSG_NON_ENREGISTRE)); });
  }
  function sauverPuis(ok, ko) { sauver(); messageEnregistre(ok, ko); }
  function restaurerIndexe() {
    ouvrirDB().then(function (db) {
      return new Promise(function (ok, ko) {
        var tx = db.transaction("etat", "readonly"), r = tx.objectStore("etat").get("principal");
        r.onsuccess = function () { ok(r.result); };
        r.onerror = function () { ko(r.error); };
      });
    }).then(function (json) {
      if (!json) return;
      var recu = null;
      try { recu = assainir(JSON.parse(json)); } catch (e) { return; }
      if (!recu || (recu.maj || 0) <= (etat.maj || 0)) return;
      etat = recu; ecrireLocal(json); verifierPlan();
      ui.vue = "auto"; ui.partie = etat.partie ? "saisie" : null; ui.feuille = null;
      rendreSur(); rendreFeuille(); rendrePartie(); majStatut();
      message("Tes données ont été restaurées depuis la sauvegarde de cet appareil.");
    }).catch(function () { /* La copie locale reste disponible, si elle existe. */ });
  }

  /* Sauvegarde dans l'espace personnel du joueur, si la page y a accès. */
  var distant = { ref: null, etat: "attente", enCours: false, encore: false, minuterie: null };
  function initDistant(essai) {
    var c = window.claude;
    if (!c || typeof c.use !== "function") {
      if ((essai || 0) < 20) { setTimeout(function () { initDistant((essai || 0) + 1); }, 500); return; }
      distant.etat = "absent"; majStatut(); return;
    }
    Promise.all([c.use("db"), c.use("user")]).then(function (r) {
      var db = r[0], user = r[1];
      if (!db || !user) throw new Error("absent");
      return user.id().then(function (id) {
        if (!id) throw new Error("absent");
        var ref = db.doc("data/users/" + id + "/etat");
        distant.ref = ref;
        /* Une seule écoute pour toute la visite : elle reçoit l'état enregistré,
           puis les changements faits depuis un autre appareil. */
        ref.onSnapshot(function (snap) {
          var meta = snap.metadata || {};
          if (meta.hasPendingWrites) return;
          var d = snap.exists ? (snap.data() || {}) : null;
          if (d && typeof d.json === "string" && typeof d.maj === "number" && d.maj > (etat.maj || 0)) {
            var recu = null;
            try { recu = assainir(JSON.parse(d.json)); } catch (e) { recu = null; }
            if (recu) {
              var sansProfil = !etat.profil;
              etat = recu; ecrireLocal(); persisterIndexe(JSON.stringify(etat)); verifierPlan();
              if (etat.profil && (ui.vue !== "questionnaire" || !ui.mode)) { ui.vue = "app"; ui.brouillon = null; ui.mode = null; }
              if (sansProfil) ui.semaine = semaineCourante();
              if (!etat.partie && ui.partie === "saisie") ui.partie = null;
              ui.pile = []; ui.defiEvt = null; ui.depart = null;
              rendre(); rendreFeuille(); rendrePartie();
              message(sansProfil ? "Tes données ont été retrouvées." : "Données mises à jour depuis un autre appareil.");
            }
          }
          if (meta.fromCache) return;
          if (distant.etat !== "actif") {
            distant.etat = "actif"; majStatut();
            if (etat.profil && (!d || (etat.maj || 0) > (d.maj || 0))) envoyer();
          }
        }, function () { distant.etat = "absent"; majStatut(); });
      });
    }).catch(function () { distant.etat = "absent"; majStatut(); });
  }
  function planifierEnvoi() {
    if (distant.etat !== "actif") return;
    clearTimeout(distant.minuterie);
    distant.minuterie = setTimeout(envoyer, 1500);
  }
  function envoyer() {
    if (!distant.ref || distant.etat !== "actif") return;
    if (distant.enCours) { distant.encore = true; return; }
    distant.enCours = true;
    distant.ref.set({ maj: etat.maj, json: JSON.stringify(etat) }).catch(function (e) {
      if (!e || e.code !== "unavailable") { distant.etat = "absent"; majStatut(); }
    }).then(function () {
      distant.enCours = false;
      if (distant.encore) { distant.encore = false; envoyer(); }
    });
  }
  function texteStatut() {
    if (!sauvegardeLocaleOK && sauvegardeIndexee === "erreur") return "Attention : tes dernières données ne sont pas enregistrées. Exporte une sauvegarde depuis le profil.";
    if (!sauvegardeLocaleOK && sauvegardeIndexee === "attente") return "Sauvegarde en cours sur cet appareil…";
    if (distant.etat === "actif") return "Tes données sont enregistrées sur cet appareil et dans ton espace personnel. Tu les retrouves en ouvrant cette page avec ton compte sur un autre appareil.";
    if (distant.etat === "attente") return "Tes données sont enregistrées sur cet appareil.";
    return "Tes données sont enregistrées sur cet appareil uniquement. Copie une sauvegarde de temps en temps : vider le navigateur les efface.";
  }
  function versionHTML() {
    var d = new Date(VERSION_APPLI);
    if (isNaN(d.getTime())) return "";
    return '<p class="aide version">' + t("Version du " + d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) + " à " + d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) + ".") + '</p>';
  }
  function majStatut() {
    var el = document.getElementById("statut-donnees"); if (el) el.textContent = texteStatut();
    /* Bannière persistante tant que rien ne peut être écrit sur l'appareil. */
    var ban = document.getElementById("alerte-stockage");
    if (stockageEnPanne() && !ban && document.body) {
      ban = document.createElement("div"); ban.id = "alerte-stockage"; ban.setAttribute("role", "alert");
      ban.innerHTML = '<p>' + t("Tes dernières données ne sont pas enregistrées sur cet appareil (stockage plein ou bloqué).") + '</p><button class="btn" type="button" data-a="md-ouvrir">Sauvegarder</button>';
      document.body.insertBefore(ban, document.body.firstChild);
    } else if (!stockageEnPanne() && ban) ban.parentNode.removeChild(ban);
    var c = document.getElementById("statut-tete");
    if (c) { c.className = "statut-tete " + (distant.etat === "actif" ? "synchro" : "local"); c.setAttribute("aria-label", texteStatut()); c.title = texteStatut();
      c.lastChild.textContent = !sauvegardeLocaleOK && sauvegardeIndexee === "erreur" ? "Non enregistré" : (!sauvegardeLocaleOK && sauvegardeIndexee === "attente" ? "Sauvegarde…" : (distant.etat === "actif" ? "Synchronisé" : "Enregistré")); }
  }

  /* ---------- État de l'écran ---------- */
  /* Un accueil à trois portes (le sac, le parcours, le practice) et un menu latéral qui mène à tout.
     Chaque page a son adresse (#sac, #bilan…), sans sous-onglets. Les anciennes adresses restent valides. */
  var PAGES = ["accueil", "sac", "parcours", "practice", "exercices", "bilan", "profil", "journal"];
  /* Anciens noms et noms des entrées de navigation (UX03) : les liens existants mènent toujours quelque part. */
  var ALIAS = { jour: "accueil", distances: "sac", parties: "journal", carnet: "parcours", plan: "practice", entrainement: "practice",
    monjeu: "accueil", "mon-jeu": "accueil", analyses: "bilan", statistiques: "bilan", stats: "bilan", jouer: "parcours",
    progresser: "practice", coaching: "practice", programme: "practice", "mon-sac": "sac", historique: "journal" };
  function pageDe(nom) { if (a(ALIAS, nom)) nom = ALIAS[nom]; return PAGES.indexOf(nom) >= 0 ? nom : "accueil"; }
  var ui = { vue: "auto", onglet: "accueil", semaine: 1, etape: 0, brouillon: null, mode: null, filtre: { d: "tous", monPalier: true }, feuille: null, dialogue: null, anime: false, retourFocus: null,
    club: "f7", partie: null, bilanPartie: null, pile: [], defiEvt: null, depart: null, fenetre: 5, plis: { priorites: true }, feuilleRetour: null, sacApercu: null, sacSel: null, menu: false, partage: false, pvCoup: null, pvLong: false, serie: null, pvPanneau: null, sjc: null, strat: null, ellSel: null };
  var app = document.getElementById("app");

  /* ---------- Outils de texte ---------- */
  function t(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/'/g, "’")
      .replace(/ ([:;?!»])/g, " $1").replace(/« /g, "« ")
      .replace(/(\d) (cm|min|m|h|%)(?![a-zà-ÿ])/g, "$1 $2");
  }
  function at(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;"); }
  function lateralite() { return ui.vue === "questionnaire" && ui.brouillon ? ui.brouillon.lateralite : (etat.profil ? etat.profil.lateralite : "D"); }
  function L(s) { return t(lat(s, lateralite())); }
  function auj() { return new Date().toISOString(); }
  function dateCourte(iso) { try { return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }); } catch (e) { return ""; } }
  /* Période : l'année n'est ajoutée que si les deux dates ne sont pas de la même année, ou pas de l'année en cours. */
  function periodeLib(a, b) {
    var an = function (x) { return String(x || "").slice(0, 4); }, cour = String(new Date().getFullYear());
    var avecAn = an(a) !== an(b) || an(b) !== cour;
    var f = function (x) { try { return new Date(x).toLocaleDateString("fr-FR", avecAn ? { day: "numeric", month: "short", year: "numeric" } : { day: "numeric", month: "short" }); } catch (e) { return ""; } };
    return "du " + f(a) + " au " + f(b);
  }
  function dureeLib(min) {
    if (min < 60) return min + " min";
    var h = Math.floor(min / 60), m = min % 60;
    return h + " h" + (m ? " " + (m < 10 ? "0" + m : m) : "");
  }
  function nomLieu(id) { var l = LIEUX.filter(function (x) { return x.id === id; })[0]; return l ? l.nom : id; }
  function enListe(noms) {
    return noms.map(function (n, i) { return i ? n.charAt(0).toLowerCase() + n.slice(1) : n.charAt(0).toUpperCase() + n.slice(1); }).join(", ");
  }
  function nomsLieux(ids) { return enListe(ids.map(nomLieu)); }
  function indexLib(i) { return String(i).replace(".", ","); }
  function copie(o) { return JSON.parse(JSON.stringify(o)); }
  function pluriel(n, mot) { return n + " " + mot + (n > 1 ? "s" : ""); }
  function message(txt) {
    var el = document.getElementById("message");
    el.textContent = txt; el.hidden = false;
    clearTimeout(message.t); message.t = setTimeout(function () { el.hidden = true; }, 3200);
  }
  function semaineCourante() {
    if (!etat.plan) return 1;
    var d = (Date.now() - new Date(etat.plan.cree).getTime()) / 6048e5;
    return Math.max(1, Math.min(4, Math.floor(d) + 1));
  }
  function verifierPlan() {
    if (!etat.profil) { etat.plan = null; return; }
    var ok = !!etat.plan && Array.isArray(etat.plan.semaines);
    if (ok) {
      etat.plan.semaines.forEach(function (s) {
        s.seances.forEach(function (se) { se.blocs.forEach(function (b) { if (!EX[b.ex]) ok = false; }); });
        if (s.mission && !EX[s.mission]) ok = false;
        (s.maison || []).forEach(function (x) { if (!EX[x]) ok = false; });
      });
    }
    if (!ok) etat.plan = genererPlan(etat.profil, etat.cycle || 1);
    Object.keys(etat.profil.symptomes || {}).forEach(function (id) { if (!SYM[id]) delete etat.profil.symptomes[id]; });
  }

  /* ---------- Contrôle des données reçues ----------
     Une sauvegarde collée, ou des données venues d'un autre appareil, sont relues
     champ par champ : on ne garde que des valeurs attendues, et rien de ce qui est
     affiché ne peut contenir autre chose qu'un nombre ou un identifiant connu. */
  function a(o, k) { return typeof k === "string" && Object.prototype.hasOwnProperty.call(o, k); }
  function nombre(v) { return typeof v === "number" && isFinite(v); }
  function entier(v, min, max, def) { return nombre(v) && Math.round(v) >= min && Math.round(v) <= max ? Math.round(v) : def; }
  function estDate(v) { return typeof v === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/.test(v) && !isNaN(Date.parse(v)); }
  function dateOk(v) { return estDate(v) ? v : auj(); }
  function jeton(v) { return typeof v === "string" && /^[a-z0-9_]{1,40}$/.test(v); }
  function liste(v) { return Array.isArray(v) ? v : []; }
  function unique(l) { return l.filter(function (x, i) { return l.indexOf(x) === i; }); }
  function lieuConnu(l) { return LIEUX.some(function (x) { return x.id === l; }); }

  function assainirProfil(p) {
    /* P02 : un joueur sans index n'a pas d'index enregistré (null). Les anciens profils « sans index » gardent leur valeur, lue comme inconnue. */
    if (!p || typeof p !== "object" || (!nombre(p.index) && p.sansIndex !== true)) return null;
    var index = nombre(p.index) ? Math.max(0, Math.min(54, Math.round(p.index * 10) / 10)) : null, pal = palierDe(index == null ? INDEX_NIVEAU_INCONNU : index);
    var o = {
      prenom: (typeof p.prenom === "string" ? p.prenom : "").slice(0, 30).trim(),
      lateralite: p.lateralite === "G" ? "G" : "D",
      index: index, indexTexte: "", sansIndex: p.sansIndex === true || index == null,
      /* Questionnaire de coaching fait ? Absent dans les anciens profils : fait. */
      questionnaire: p.questionnaire !== false,
      objectif: OBJECTIFS.some(function (x) { return x.id === p.objectif; }) ? p.objectif : "score",
      envies: unique(liste(p.envies).filter(function (d) { return a(DOM, d) && !DOM[d].transversal; })).slice(0, 2),
      seances: entier(p.seances, 1, 4, 2),
      duree: [30, 45, 60, 90].indexOf(p.duree) >= 0 ? p.duree : 60,
      lieux: unique(liste(p.lieux).filter(lieuConnu)),
      indicateurs: {}, symptomes: {}, symptomePrincipal: null,
      pasDeParcours: p.pasDeParcours == null ? null : p.pasDeParcours === true,
      indexVise: OBJ_INDEX.indexOf(p.indexVise) >= 0 ? p.indexVise : null,
      maj: dateOk(p.maj)
    };
    if (!o.lieux.some(function (l) { return l !== "parcours"; })) o.lieux.push("maison");
    var ri = p.indicateurs && typeof p.indicateurs === "object" ? p.indicateurs : {};
    INDICATEURS.forEach(function (ind) {
      var r = a(ri, ind.id) && ri[ind.id] && typeof ri[ind.id] === "object" ? ri[ind.id] : {};
      o.indicateurs[ind.id] = {
        val: nombre(r.val) ? Math.max(0, Math.min(ind.max, Math.round(r.val))) : null,
        src: r.src === "test" || r.src === "partie" ? r.src : "declare",
        date: dateOk(r.date)
      };
    });
    var rs = p.symptomes && typeof p.symptomes === "object" ? p.symptomes : {};
    Object.keys(rs).forEach(function (id) {
      if (!a(SYM, id) || Object.keys(o.symptomes).length >= 3) return;
      var s = SYM[id];
      if (s.niv[0] > pal || pal > s.niv[1]) return;
      var src = rs[id] && rs[id].reponses && typeof rs[id].reponses === "object" ? rs[id].reponses : {}, rep = {};
      s.questions.forEach(function (q) {
        var v = a(src, q.id) ? src[q.id] : null;
        if (nombre(v) && v % 1 === 0 && v >= 0 && v < q.o.length) rep[q.id] = v;
      });
      o.symptomes[id] = { reponses: rep };
    });
    o.symptomePrincipal = a(o.symptomes, p.symptomePrincipal) ? p.symptomePrincipal : (Object.keys(o.symptomes)[0] || null);
    return o;
  }

  function assainirPlan(pl, cycle) {
    if (!pl || typeof pl !== "object" || pl.cycle !== cycle || !Array.isArray(pl.semaines) || pl.semaines.length !== 4) return null;
    var n = entier(pl.n, 1, 4, 0);
    if (!n || !estDate(pl.cree)) return null;
    var ok = true;
    function exo(x) { if (!a(EX, x)) ok = false; return x; }
    var semaines = pl.semaines.map(function (s, i) {
      if (!s || typeof s !== "object" || !Array.isArray(s.seances) || s.seances.length !== n) { ok = false; return null; }
      return {
        n: i + 1, theme: THEMES_SEMAINE[i],
        seances: s.seances.map(function (se, j) {
          if (!se || typeof se !== "object" || !Array.isArray(se.blocs) || !se.blocs.length || !nombre(se.min)) { ok = false; return null; }
          var doms = liste(se.doms).filter(function (d) { return a(DOM, d); }).slice(0, 2);
          if (!doms.length) ok = false;
          return {
            id: "c" + cycle + "-s" + (i + 1) + "-" + (j + 1), num: j + 1, doms: doms,
            min: entier(se.min, 0, 240, 0),
            lieux: unique(liste(se.lieux).filter(lieuConnu)),
            echauffement: se.echauffement === true,
            blocs: se.blocs.map(function (b) {
              if (!b || typeof b !== "object" || !a(EX, b.ex) || !a(ROLES, b.role) || !nombre(b.min)) { ok = false; return null; }
              var r = { ex: b.ex, min: entier(b.min, 0, 120, 10), role: b.role, lieu: lieuConnu(b.lieu) ? b.lieu : EX[b.ex].lieux[0] };
              if (a(SYM, b.sym) && jeton(b.cause)) { r.sym = b.sym; r.cause = b.cause; }
              return r;
            })
          };
        }),
        mission: s.mission == null ? null : exo(s.mission),
        maison: liste(s.maison).slice(0, 3).map(exo)
      };
    });
    if (!ok) return null;
    return {
      cycle: cycle, cree: pl.cree, palier: entier(pl.palier, 1, 4, 1), duree: entier(pl.duree, 10, 240, 60), n: n,
      priorites: liste(pl.priorites).filter(function (d) { return a(DOM, d); }).slice(0, 3),
      correctifs: liste(pl.correctifs).filter(function (c) { return c && a(SYM, c.sym) && jeton(c.c1); }).slice(0, 2)
        .map(function (c) { return { sym: c.sym, c1: c.c1, c2: jeton(c.c2) ? c.c2 : null }; }),
      nonPlanifies: liste(pl.nonPlanifies).filter(function (d) { return a(DOM, d); }),
      tests: liste(pl.tests).filter(function (x) { return a(EX, x); }),
      semaines: semaines
    };
  }

  function assainir(o) {
    if (!o || typeof o !== "object" || o.v !== 1) return null;
    var e = etatNeuf();
    e.schemaDonnees = 2; /* Migration non destructive des sauvegardes v1. */
    e.maj = nombre(o.maj) && o.maj > 0 ? o.maj : 0;
    e.profil = assainirProfil(o.profil);
    if (!e.profil) return e;
    e.cycle = entier(o.cycle, 1, 999, 1);
    var f = o.fait && typeof o.fait === "object" ? o.fait : {};
    Object.keys(f).slice(0, 2000).forEach(function (k) {
      if (/^c\d{1,3}-(s[1-4]-[1-4]|m[1-4]|h[1-4])$/.test(k)) e.fait[k] = dateOk(f[k]);
    });
    var sc = o.scores && typeof o.scores === "object" ? o.scores : {};
    Object.keys(sc).forEach(function (id) {
      if (!a(EX, id) || !EX[id].score) return;
      var max = EX[id].score.max;
      var l = liste(sc[id]).filter(function (x) { return x && nombre(x.v) && x.v >= 0 && x.v <= max; }).slice(-100)
        .map(function (x) { return { d: dateOk(x.d), v: Math.round(x.v) }; });
      if (l.length) e.scores[id] = l;
    });
    e.historique = liste(o.historique).filter(function (c) { return c && typeof c === "object"; }).map(function (c) {
      return {
        cycle: entier(c.cycle, 1, 999, 1), debut: dateOk(c.debut), fin: dateOk(c.fin),
        faites: entier(c.faites, 0, 16, 0), total: entier(c.total, 0, 16, 0),
        priorites: liste(c.priorites).filter(function (d) { return a(DOM, d); }).slice(0, 3)
      };
    });
    e.plan = assainirPlan(o.plan, e.cycle) || genererPlan(e.profil, e.cycle);
    assainirOutils(o, e);
    return e;
  }

  /* ============================================================
     ACCUEIL
     ============================================================ */
  function rendreAccueil() {
    /* P02 : le premier lancement ouvre un carnet de golf. Trois réponses, toutes facultatives sauf la main de jeu ;
       le questionnaire de coaching reste proposé, en option. */
    var b = ui.carnetNeuf || (ui.carnetNeuf = { prenom: "", lateralite: "D", indexTexte: "", sansIndex: false });
    app.innerHTML =
      '<section class="accueil carnet-neuf">' +
        '<p class="surtitre">Coach de golf de poche</p>' +
        '<h1>Ton carnet de golf, <span class="plume">dans la poche</span></h1>' +
        '<p class="chapo">Note tes parties trou par trou et retrouve tes statistiques, tes clubs et tes parcours. Le programme d’entraînement est en option.</p>' +
        '<form class="carnet-form" data-f="carnet-creer" novalidate>' +
          '<div class="champ"><label for="ac-prenom">Ton prénom <small>(facultatif)</small></label><input id="ac-prenom" type="text" autocomplete="given-name" maxlength="30" value="' + at(b.prenom) + '" data-i="ac-prenom"></div>' +
          '<fieldset class="champ"><legend>Tu joues</legend><div class="choix-ligne">' +
            '<button class="opt" type="button" data-a="ac-lat" data-v="D" aria-pressed="' + (b.lateralite === "D") + '">En droitier</button>' +
            '<button class="opt" type="button" data-a="ac-lat" data-v="G" aria-pressed="' + (b.lateralite === "G") + '">En gaucher</button>' +
          '</div></fieldset>' +
          '<div class="champ"><label for="ac-index">Ton index <small>(facultatif)</small></label>' +
            '<div class="ligne-index"><input id="ac-index" type="text" inputmode="decimal" autocomplete="off" maxlength="4" value="' + at(b.sansIndex ? "" : b.indexTexte) + '" data-i="ac-index"' + (b.sansIndex ? " disabled" : "") + ' aria-describedby="ac-index-aide">' +
            '<button class="opt" type="button" data-a="ac-sans-index" aria-pressed="' + b.sansIndex + '">Je ne connais pas mon index</button></div>' +
            '<p class="aide" id="ac-index-aide">' + t(b.sansIndex ? "Aucun index ne sera inventé : les coups reçus et les comparaisons à ton index attendront que tu en indiques un." : "Entre 0 et 54. Tu pourras le modifier dans ton profil.") + '</p></div>' +
          '<p class="erreur" id="ac-erreur" role="alert" hidden></p>' +
          '<button class="btn principal large" type="submit">Ouvrir mon carnet</button>' +
        '</form>' +
        '<p class="aide">Tes données restent sur cet appareil. Tu pourras les sauvegarder à tout moment.</p>' +
        '<div class="ligne-liens"><button class="lien" type="button" data-a="importer">J’ai déjà une sauvegarde à restaurer</button>' +
        '<button class="lien" type="button" data-a="commencer">Je veux aussi un programme d’entraînement (questionnaire, 5 min)</button></div>' +
        '<ul class="carnet-apercu"><li><b>Tes parties</b> score, putts, mises en jeu, en trois niveaux de saisie</li><li><b>Tes statistiques</b> tendances, erreurs récurrentes, putting</li><li><b>Tes clubs et tes parcours</b> distances, directions, trou par trou</li></ul>' +
      '</section>';
  }


  /* ============================================================
     QUESTIONNAIRE
     ============================================================ */
  var ETAPES = [
    { id: "toi", titre: "Toi", sous: "Ton index détermine ton palier, donc les exercices proposés." },
    { id: "objectif", titre: "Ton objectif", sous: "" },
    { id: "entrainement", titre: "Ton entraînement", sous: "Le plan tient dans le temps et les lieux dont tu disposes." },
    { id: "coups", titre: "Tes coups", sous: "Donne une estimation honnête, un jour normal. Tu pourras l'affiner avec les tests." },
    { id: "parties", titre: "Tes parties", sous: "Pense à tes dernières parties. Si tu joues 9 trous, double tes chiffres." },
    { id: "defauts", titre: "Tes défauts", sous: "Choisis ceux qui te coûtent le plus de coups en ce moment, trois au maximum." },
    { id: "precisions", titre: "Précisions", sous: "Ces réponses servent à départager les causes possibles." }
  ];
  var FAMILLES = ["Grand jeu", "Petit jeu", "Putting", "Sur le parcours"];

  function brouillonNeuf() {
    return { prenom: "", lateralite: "D", index: null, indexTexte: "", sansIndex: false, objectif: null, envies: [], seances: 2, duree: 60, lieux: [], indicateurs: {}, symptomes: {}, symptomePrincipal: null, pasDeParcours: null };
  }
  function indexBrouillon() {
    var b = ui.brouillon;
    if (b.sansIndex) return 54;
    var v = parseFloat(String(b.indexTexte || "").replace(",", "."));
    return isNaN(v) || v < 0 || v > 54 ? null : Math.round(v * 10) / 10;
  }
  function palierBrouillon() { var i = indexBrouillon(); return i == null ? 2 : palierDe(i); }
  function etapesActives() {
    var ids = Object.keys(ui.brouillon.symptomes);
    var besoin = ids.length >= 2 || ids.some(function (id) { return SYM[id] && SYM[id].questions.length; });
    return ETAPES.filter(function (e) { return e.id !== "precisions" || besoin; });
  }
  var TRAIT = '<svg class="trait" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 13.5c2.2 1.6 3.6 3.2 5 5.6C11.6 12.2 15.2 7.6 20.5 4"/></svg>';
  function coche(on) { return '<span class="coche" aria-hidden="true">' + (on ? TRAIT : "") + '</span>'; }

  function mesureHTML(ind) {
    var r = ui.brouillon.indicateurs[ind.id];
    var val = r ? r.val : undefined, nsp = !!r && r.val === null;
    return '<div class="mesure" data-ind="' + ind.id + '">' +
      '<p class="q" id="lab-' + ind.id + '">' + t(ind.q) + '</p>' +
      (ind.aide ? '<p class="aide">' + t(ind.aide) + '</p>' : '') +
      '<div class="reglage">' +
        '<button class="pm" type="button" data-a="ind-pas" data-d="-1" aria-label="Diminuer">−</button>' +
        '<div class="valeur"><output class="main" id="out-' + ind.id + '" for="ind-' + ind.id + '">' + (val == null ? "–" : val) + '</output><span class="unite">' + t(ind.unite) + '</span></div>' +
        '<button class="pm" type="button" data-a="ind-pas" data-d="1" aria-label="Augmenter">+</button>' +
      '</div>' +
      '<input type="range" id="ind-' + ind.id + '" aria-labelledby="lab-' + ind.id + '" min="0" max="' + ind.max + '" step="1" value="' + (val == null ? Math.round(ind.max / 2) : val) + '" data-i="ind"' + (val == null ? ' class="vide"' : '') + '>' +
      '<button class="lien" type="button" data-a="ind-nsp" aria-pressed="' + nsp + '">Je ne sais pas</button>' +
    '</div>';
  }
  function majMesure(id) {
    var r = ui.brouillon.indicateurs[id], val = r ? r.val : undefined;
    var boite = app.querySelector('.mesure[data-ind="' + id + '"]'); if (!boite) return;
    boite.querySelector("output").textContent = val == null ? "–" : val;
    var rg = boite.querySelector('input[type="range"]');
    if (val != null) rg.value = val;
    rg.classList.toggle("vide", val == null);
    boite.querySelector('[data-a="ind-nsp"]').setAttribute("aria-pressed", String(!!r && r.val === null));
  }

  var RENDU = {
    toi: function (b) {
      var i = indexBrouillon(), p = i == null ? null : PALIERS[palierDe(i) - 1];
      return '<div class="champ"><label for="q-prenom">Ton prénom</label><input id="q-prenom" type="text" autocomplete="given-name" maxlength="30" value="' + at(b.prenom) + '" data-i="prenom"></div>' +
        '<fieldset class="champ"><legend>Tu joues</legend><div class="choix-ligne">' +
          '<button class="opt" type="button" data-a="set" data-k="lateralite" data-v="D" aria-pressed="' + (b.lateralite === "D") + '">En droitier</button>' +
          '<button class="opt" type="button" data-a="set" data-k="lateralite" data-v="G" aria-pressed="' + (b.lateralite === "G") + '">En gaucher</button>' +
        '</div></fieldset>' +
        '<div class="champ"><label for="q-index">Ton index</label>' +
          '<div class="ligne-index"><input id="q-index" type="text" inputmode="decimal" autocomplete="off" maxlength="4" value="' + at(b.sansIndex ? "" : b.indexTexte) + '" data-i="index"' + (b.sansIndex ? " disabled" : "") + '>' +
          '<button class="opt" type="button" data-a="sans-index" aria-pressed="' + b.sansIndex + '">Pas d’index, ou je ne le connais pas</button></div>' +
          '<p class="aide" id="q-palier" aria-live="polite">' + (p ? t("Palier " + p.n + " · " + p.nom + " (" + p.plage.toLowerCase() + ")") : "Entre 0 et 54.") + '</p>' +
        '</div>';
    },
    objectif: function (b) {
      return '<fieldset class="champ"><legend>Ton objectif principal</legend><div class="pile">' +
        OBJECTIFS.map(function (o) {
          var on = b.objectif === o.id;
          return '<button class="carte-choix" type="button" data-a="set" data-k="objectif" data-v="' + o.id + '" aria-pressed="' + on + '">' + coche(on) + '<b>' + t(o.t) + '</b><span class="desc">' + t(o.s) + '</span></button>';
        }).join("") + '</div></fieldset>' +
        '<fieldset class="champ"><legend>Ce que tu as le plus envie de travailler <small>(facultatif, deux choix au plus)</small></legend><div class="choix-ligne">' +
        DOMAINES.filter(function (d) { return !d.transversal; }).map(function (d) {
          return '<button class="opt" type="button" data-a="envie" data-v="' + d.id + '" aria-pressed="' + (b.envies.indexOf(d.id) >= 0) + '">' + t(d.court) + '</button>';
        }).join("") + '</div></fieldset>';
    },
    entrainement: function (b) {
      return '<fieldset class="champ"><legend>Séances d’entraînement par semaine</legend><div class="choix-ligne">' +
        [1, 2, 3, 4].map(function (n) { return '<button class="opt" type="button" data-a="set" data-k="seances" data-v="' + n + '" aria-pressed="' + (b.seances === n) + '">' + n + '</button>'; }).join("") +
        '</div></fieldset>' +
        '<fieldset class="champ"><legend>Durée d’une séance</legend><div class="choix-ligne">' +
        [30, 45, 60, 90].map(function (n) { return '<button class="opt" type="button" data-a="set" data-k="duree" data-v="' + n + '" aria-pressed="' + (b.duree === n) + '">' + t(dureeLib(n)) + '</button>'; }).join("") +
        '</div></fieldset>' +
        '<fieldset class="champ"><legend>Ce dont tu disposes</legend><div class="pile">' +
        LIEUX.map(function (l) {
          var on = b.lieux.indexOf(l.id) >= 0;
          return '<button class="carte-choix case" type="button" data-a="lieu" data-v="' + l.id + '" aria-pressed="' + on + '">' + coche(on) + '<b>' + t(l.nom) + '</b><span class="desc">' + t(l.aide) + '</span></button>';
        }).join("") + '</div></fieldset>';
    },
    coups: function () {
      return INDICATEURS.filter(function (i) { return i.groupe === "coups"; }).map(mesureHTML).join("");
    },
    parties: function (b) {
      var sans = !!b.pasDeParcours;
      return '<div class="champ" style="margin-bottom:6px"><button class="carte-choix case" type="button" data-a="pas-parcours" aria-pressed="' + sans + '">' + coche(sans) + '<b>Je ne joue pas encore sur le parcours</b><span class="desc">Les questions de cette étape seront ignorées.</span></button></div>' +
        (sans ? "" : INDICATEURS.filter(function (i) { return i.groupe === "parties"; }).map(mesureHTML).join(""));
    },
    defauts: function (b) {
      var p = palierBrouillon(), n = Object.keys(b.symptomes).length;
      var h = '<p class="aide" aria-live="polite">' + n + ' sur 3 choisis. Tu peux aussi n’en choisir aucun.</p>';
      FAMILLES.forEach(function (f) {
        var liste = SYMPTOMES.filter(function (s) { return s.famille === f && s.niv[0] <= p && p <= s.niv[1]; });
        if (!liste.length) return;
        h += '<p class="groupe-titre">' + t(f) + '</p><div class="pile">' + liste.map(function (s) {
          var on = !!b.symptomes[s.id];
          return '<button class="carte-choix case" type="button" data-a="defaut" data-v="' + s.id + '" aria-pressed="' + on + '">' + coche(on) + '<b>' + L(s.t) + '</b><span class="desc">' + L(s.desc) + '</span></button>';
        }).join("") + '</div>';
      });
      return h;
    },
    precisions: function (b) {
      var ids = Object.keys(b.symptomes), h = "";
      if (ids.length >= 2) {
        h += '<fieldset class="champ"><legend>Lequel veux-tu corriger en premier ?</legend><div class="pile">' + ids.map(function (id) {
          var on = b.symptomePrincipal === id;
          return '<button class="carte-choix" type="button" data-a="principal" data-v="' + id + '" aria-pressed="' + on + '">' + coche(on) + '<b>' + L(SYM[id].t) + '</b></button>';
        }).join("") + '</div></fieldset>';
      }
      ids.forEach(function (id) {
        var s = SYM[id]; if (!s.questions.length) return;
        h += '<p class="groupe-titre">' + L(s.t) + '</p>';
        s.questions.forEach(function (q) {
          var rep = (b.symptomes[id].reponses || {})[q.id];
          h += '<fieldset class="champ"><legend>' + L(q.q) + '</legend><div class="pile">' + q.o.map(function (o, i) {
            var on = rep === i;
            return '<button class="carte-choix" type="button" data-a="rep" data-s="' + id + '" data-q="' + q.id + '" data-v="' + i + '" aria-pressed="' + on + '">' + coche(on) + '<b style="font-weight:' + (on ? 700 : 400) + '">' + L(o.l) + '</b></button>';
          }).join("") + '</div></fieldset>';
        });
      });
      return h;
    }
  };

  function rendreQuestionnaire() {
    var etapes = etapesActives();
    if (ui.etape > etapes.length - 1) ui.etape = etapes.length - 1;
    var i = ui.etape, e = etapes[i], b = ui.brouillon;
    var sur = ui.mode === "cycle" ? "Bilan du cycle " + etat.cycle + " · " : (ui.mode === "modif" ? (b.questionnaire === false ? "Ton programme · " : "Modifier mes réponses · ") : "");
    app.innerHTML =
      '<section class="quest">' +
        '<header class="q-tete"><p class="surtitre">' + t(sur + "Étape " + (i + 1) + " sur " + etapes.length) + '</p>' +
        '<div class="jauge" aria-hidden="true"><span style="width:' + Math.round(((i + 1) / etapes.length) * 100) + '%"></span></div>' +
        '<h1>' + t(e.titre) + '</h1>' + (e.sous ? '<p class="chapo">' + t(e.sous) + '</p>' : '') + '</header>' +
        '<div class="q-corps">' + RENDU[e.id](b) + '</div>' +
        '<p class="erreur" id="q-erreur" role="alert" hidden></p>' +
        '<footer class="q-pied"><button class="btn" type="button" data-a="q-retour">' + (i === 0 ? "Annuler" : "Retour") + '</button>' +
        '<button class="btn principal" type="button" data-a="q-suite">' + (i === etapes.length - 1 ? "Voir mon bilan" : "Continuer") + '</button></footer>' +
      '</section>';
  }
  function erreurQ(txt) { var el = document.getElementById("q-erreur"); if (!el) return; el.textContent = txt; el.hidden = !txt; if (txt) el.scrollIntoView({ block: "center" }); }

  function elaguerSymptomes(b) {
    var p = palierBrouillon();
    Object.keys(b.symptomes).forEach(function (id) { var s = SYM[id]; if (!s || s.niv[0] > p || p > s.niv[1]) delete b.symptomes[id]; });
    if (!b.symptomes[b.symptomePrincipal]) b.symptomePrincipal = Object.keys(b.symptomes)[0] || null;
  }

  function terminerQuestionnaire() {
    var b = ui.brouillon, maintenant = auj();
    /* Sans index : rien d'enregistré (P02), le niveau des exercices se déduit à part. */
    b.index = b.sansIndex ? null : indexBrouillon();
    if (b.index == null) b.sansIndex = true;
    b.questionnaire = true;
    elaguerSymptomes(b);
    INDICATEURS.forEach(function (ind) {
      var r = b.indicateurs[ind.id];
      if (!r || (b.pasDeParcours && ind.groupe === "parties")) b.indicateurs[ind.id] = { val: null, src: "declare", date: maintenant };
    });
    b.prenom = String(b.prenom || "").trim();
    b.maj = maintenant;
    if (ui.mode === "cycle" && etat.plan) {
      etat.historique.push({ cycle: etat.cycle, debut: etat.plan.cree, fin: maintenant, faites: compteFaites(), total: etat.plan.n * 4, priorites: etat.plan.priorites });
      etat.cycle = (etat.cycle || 1) + 1;
    } else {
      Object.keys(etat.fait).forEach(function (k) { if (k.indexOf("c" + etat.cycle + "-") === 0) delete etat.fait[k]; });
    }
    etat.profil = b;
    if (!b.sansIndex) noterIndex(b.index);
    etat.plan = genererPlan(b, etat.cycle);
    sauver();
    ui.vue = "app"; ui.brouillon = null; ui.mode = null; ui.semaine = 1; ui.anime = true;
    allerOnglet("bilan", true);
  }

  /* ============================================================
     APPLICATION : en-tête et onglets
     ============================================================ */
  function rendreApp() {
    var p = etat.profil;
    var ident = indexDeclare(p) != null ? (p.prenom ? p.prenom + " · " : "") + "index " + indexLib(p.index) : (p.prenom || "Mon carnet");
    app.className = "vue-" + ui.onglet + (estLarge() ? " large" : "");
    /* Partie en cours : le trou en cours reste en haut de chaque page. */
    app.innerHTML =
      '<header class="tete"><button class="marque-app" type="button" data-a="onglet" data-v="accueil" aria-label="Coach de poche : écran d’accueil">Coach de poche</button>' +
      '<span class="statut-tete ' + (distant.etat === "actif" ? "synchro" : "local") + '" id="statut-tete" role="img" aria-label="' + at(texteStatut()) + '" title="' + at(texteStatut()) + '">' + icone("coche") + '<span>' + (distant.etat === "actif" ? "Synchronisé" : "Enregistré") + '</span></span>' +
      '<button class="tete-btn" type="button" data-a="recherche" aria-label="Rechercher une fonction">' + icone("loupe") + '</button>' +
      '<button class="ident" type="button" data-a="onglet" data-v="profil"' + (ui.onglet === "profil" ? ' aria-current="page"' : '') + ' aria-label="' + at("Profil : " + ident) + '"><span>' + t(ident) + '</span>' + icone("profil") + '</button></header>' +
      bandeauPartieHTML() +
      '<main id="vue" class="' + (ui.anime ? 'anime' : '') + (ui.entree ? ' entree' : '') + '">' + VUES[ui.onglet]() + '</main>' +
      '';
    ui.anime = false; ui.entree = false;
  }
  function vueActive() { return ui.onglet; }
  /* Va à une page (les anciens noms, comme « plan » ou « distances », y mènent aussi). */
  function allerOnglet(nom, haut) {
    nom = pageDe(nom);
    ui.entree = ui.onglet !== nom; ui.onglet = nom; ui.menu = false;
    try { if (location.hash !== "#" + nom) location.hash = nom; } catch (e) { /* hash indisponible */ }
    rendre();
    if (haut) window.scrollTo(0, 0);
  }

  function compteFaites() {
    return Object.keys(etat.fait).filter(function (k) { return k.indexOf("c" + etat.cycle + "-s") === 0; }).length;
  }

  /* ---------- Plan ---------- */
  var ROLES = { test_initial: "Test de départ", test_final: "Test de fin de cycle", correctif: "Correctif", routine: "Routine de jeu", priorite: "Priorité", entretien: "Entretien" };

  function carteCycle() {
    var plan = etat.plan, enCours = semaineCourante();
    var h = '<div class="defile"><table class="cycle"><thead><tr><th scope="col">Semaine</th>';
    for (var w = 1; w <= 4; w++) {
      h += '<th scope="col"><button type="button" data-a="semaine" data-v="' + w + '" aria-pressed="' + (ui.semaine === w) + '"' + (w === enCours ? ' class="encours"' : '') + ' aria-label="Semaine ' + w + (w === enCours ? ", en cours" : "") + '">' + w + '</button></th>';
    }
    h += '</tr></thead><tbody>';
    for (var s = 1; s <= plan.n; s++) {
      h += '<tr><th scope="row">Séance ' + s + '</th>';
      for (var w2 = 1; w2 <= 4; w2++) {
        var fait = !!etat.fait[plan.semaines[w2 - 1].seances[s - 1].id];
        h += '<td' + (ui.semaine === w2 ? ' class="sel"' : '') + '><span class="trou' + (fait ? " fait" : "") + '"' + (fait ? ' aria-label="faite"' : ' aria-label="à faire"') + '>' + (fait ? TRAIT : "") + '</span></td>';
      }
      h += '</tr>';
    }
    if (plan.semaines.some(function (x) { return x.mission; })) {
      h += '<tr><th scope="row">Parcours</th>';
      plan.semaines.forEach(function (x, i) {
        var f = !!etat.fait["c" + plan.cycle + "-m" + (i + 1)];
        h += '<td' + (ui.semaine === i + 1 ? ' class="sel"' : '') + '><span class="trou' + (f ? " fait" : "") + '" aria-label="' + (f ? "faite" : "à faire") + '">' + (f ? TRAIT : "") + '</span></td>';
      });
      h += '</tr>';
    }
    return h + '</tbody></table></div>';
  }

  function ligneExo(id, opts) {
    var e = EX[id]; opts = opts || {};
    var der = (etat.scores[id] || []).slice(-1)[0];
    var sous = opts.sous || DOM[e.d].nom;
    if (e.score) sous += der ? " · dernier score : " + der.v : " · exercice noté";
    return '<button class="ligne' + (opts.min != null ? "" : " simple") + '" type="button" data-a="exo" data-id="' + id + '"' + (opts.sym ? ' data-sym="' + opts.sym + '" data-cause="' + (opts.cause || "") + '"' : '') + '>' +
      (opts.min != null ? '<span class="min">' + opts.min + '<small>min</small></span>' : '') +
      '<span class="quoi">' + (opts.role ? '<em class="role r-' + opts.role + '">' + t(ROLES[opts.role]) + '</em>' : '') + '<b>' + L(e.t) + '</b><small>' + L(sous) + '</small></span>' +
      '<span class="chev" aria-hidden="true">›</span></button>';
  }

  function seanceHTML(se) {
    var fait = !!etat.fait[se.id];
    var titre = se.doms.map(function (d) { return DOM[d].court; }).join(" et ");
    var h = '<article class="seance' + (fait ? " faite" : "") + '" id="seance-' + at(se.id) + '">' +
      '<header><p class="surtitre">' + t("Séance " + se.num + " · " + dureeLib(se.min) + " · " + nomsLieux(se.lieux)) + '</p><h2>' + t(titre) + '</h2>' +
      (fait ? '<span class="tampon">faite ' + TRAIT + '</span>' : '') + '</header><ol class="blocs">';
    if (se.echauffement) {
      h += '<li><div class="ligne"><span class="min">5<small>min</small></span><span class="quoi"><b>Échauffement</b><small>' +
        t(se.lieux.indexOf("practice") >= 0 ? "Rotations du buste et des épaules, puis dix balles au wedge sans viser de cible." : "Rotations du buste et des épaules, puis quelques coups sans viser de trou.") +
        '</small></span><span></span></div></li>';
    }
    se.blocs.forEach(function (b) {
      h += '<li>' + ligneExo(b.ex, { min: b.min, role: b.role, sym: b.sym, cause: b.cause, sous: b.role === "correctif" && b.sym && SYM[b.sym] ? "Pour : " + SYM[b.sym].t.toLowerCase() : null }) + '</li>';
    });
    h += '</ol><button class="btn' + (fait ? "" : " principal") + '" type="button" data-a="fait" data-id="' + at(se.id) + '" aria-pressed="' + fait + '">' + (fait ? "Annuler « séance faite »" : "Marquer la séance comme faite") + '</button></article>';
    return h;
  }

  var VUES = {};
  VUES.practice = function () {
    var plan = etat.plan, sem = plan.semaines[ui.semaine - 1], faites = compteFaites(), total = plan.n * 4;
    var h = '<section class="bloc premier">' + sousNavAnalysesHTML("practice") + '<p class="surtitre">Analyses · Coaching</p><h1>Ton programme</h1>' +
      (etat.profil.questionnaire === false ? '<div class="carte-tb programme-option"><p class="surtitre">' + t("Facultatif") + '</p><p>' + t("Ce programme est générique. Réponds au questionnaire (5 minutes) pour l'adapter à ton niveau, à tes défauts et à ton temps.") + '</p><button class="btn principal" type="button" data-a="modifier">Personnaliser mon programme</button></div>' : '') +
      progressionHTML() +
      '<div class="raccourcis"><button class="btn" type="button" data-a="serie-ouvrir">Série de balles</button><button class="btn" type="button" data-a="onglet" data-v="exercices">Exercices</button><button class="btn" type="button" data-a="aller-a" data-v="exercices" data-s="defis">Défis</button></div></section>' +
      '<section class="bloc" id="semaine"><h2 class="h2-semaine">Semaine ' + ui.semaine + '<span>' + t(sem.theme) + '</span></h2>' + carteCycle() + avancementHTML(ui.semaine) + '</section>';
    h += '<section class="bloc" style="border-top:0;padding-top:0">';
    sem.seances.forEach(function (se) { h += seanceHTML(se); });
    if (sem.mission) {
      var m = EX[sem.mission], cle = "c" + plan.cycle + "-m" + sem.n, mf = !!etat.fait[cle];
      h += '<article class="seance' + (mf ? " faite" : "") + '"><header><p class="surtitre">Sur le parcours cette semaine</p><h2>' + L(m.t) + '</h2>' + (mf ? '<span class="tampon">faite ' + TRAIT + '</span>' : '') + '</header>' +
        '<ol class="blocs"><li>' + ligneExo(m.id, { sous: m.but }) + '</li></ol>' +
        '<button class="btn" type="button" data-a="fait" data-id="' + at(cle) + '" aria-pressed="' + mf + '">' + (mf ? "Annuler « mission faite »" : "Mission faite") + '</button></article>';
    }
    if (sem.maison && sem.maison.length) {
      var ch = "c" + plan.cycle + "-h" + sem.n, hf = !!etat.fait[ch];
      h += '<article class="seance' + (hf ? " faite" : "") + '"><header><p class="surtitre">À la maison · dix minutes, deux ou trois fois dans la semaine</p><h2>Routine maison</h2>' + (hf ? '<span class="tampon">faite ' + TRAIT + '</span>' : '') + '</header><ol class="blocs">' +
        sem.maison.map(function (id) { return '<li>' + ligneExo(id, {}) + '</li>'; }).join("") + '</ol>' +
        '<button class="btn" type="button" data-a="fait" data-id="' + at(ch) + '" aria-pressed="' + hf + '">' + (hf ? "Annuler « routine faite »" : "Routine faite") + '</button></article>';
    }
    if (plan.nonPlanifies && plan.nonPlanifies.length) {
      h += '<p class="note">' + t("Non planifié faute de lieu adapté : " + plan.nonPlanifies.map(function (d) { return DOM[d].nom.toLowerCase(); }).join(", ") + ". Ajoute le lieu dans ton profil si tu y as accès.") + '</p>';
    }
    h += '</section>' + defisResumeHTML() + badgesHTML() + historiqueCoachingHTML() + serieAppelHTML() + '<section class="bloc"><h2>Fin du cycle</h2><p>Après la semaine 4, fais le bilan. Tu mets à jour tes chiffres et tes défauts, et l’appli construit le cycle suivant.</p>' +
      '<button class="btn" type="button" data-a="fin-cycle">Faire le bilan du cycle</button></section>';
    return h;
  };

  /* ---------- Bilan ---------- */
  function sourceLib(v) {
    var r = etat.profil.indicateurs[v.ind.id];
    if (!r || r.val == null) return "non renseigné";
    if (r.src === "test") return "mesuré le " + dateCourte(r.date);
    if (r.src === "partie") return "relevé en partie le " + dateCourte(r.date);
    return "déclaré";
  }
  function raisonPriorite(p, sc, pal) {
    var bouts = [];
    sc.vals.forEach(function (v) {
      if (v.val != null && v.etat === "dessous") bouts.push(v.ind.nom + " : " + v.val + " " + v.ind.unite + ". Repère du palier : " + v.ind.rep[pal - 1] + ".");
    });
    if (!bouts.length) {
      if (sc.score == null) bouts.push("Domaine non évalué. Il pèse lourd sur le score à ton palier.");
      else bouts.push("Tu es au repère, mais ce domaine pèse lourd sur le score à ton palier.");
    }
    if (p.nSym) bouts.push(p.nSym > 1 ? "Tu y as signalé plusieurs défauts." : "Tu y as signalé un défaut.");
    if (p.envie) bouts.push("Tu as envie de le travailler.");
    return bouts.join(" ");
  }

  /* Défaut : la carte du bilan va à l'action (cause probable, exercices correctifs) ;
     le diagnostic complet s'ouvre dans une fiche plein écran. */
  function diagnosticDefaut(id) {
    var p = etat.profil, pal = palierDe(indexNiveau(p)), causes = diagnostiquer(id, (p.symptomes[id] || {}).reponses, pal);
    var corr = (etat.plan.correctifs || []).filter(function (c) { return c.sym === id; })[0];
    function exosDe(c) { return c.cause.exos.map(function (x) { return EX[x]; }).filter(function (e) { return e && e.niv[0] <= pal && pal <= e.niv[1]; }); }
    return { pal: pal, causes: causes, ordre: ordreCorrection(causes), exosDe: exosDe,
      dansPlan: function (c) { return !!corr && (corr.c1 === c.cause.id || corr.c2 === c.cause.id); } };
  }
  function puceExo(e, id, cause) {
    return '<button class="puce" type="button" data-a="exo" data-id="' + e.id + '" data-sym="' + id + '" data-cause="' + cause + '">' + L(e.t) + '</button>';
  }
  function defautHTML(id) {
    var s = SYM[id], dg = diagnosticDefaut(id), prem = dg.ordre[0], vus = {}, exos = [];
    dg.causes.filter(function (c) { return c.rang !== "secondaire"; }).forEach(function (c) {
      dg.exosDe(c).forEach(function (e) { if (!vus[e.id] && exos.length < 4) { vus[e.id] = true; exos.push(puceExo(e, id, c.cause.id)); } });
    });
    return '<article class="defaut" id="defaut-' + id + '"><header><h3>' + L(s.t) + '</h3><p>' + L(s.desc) + '</p></header>' +
      '<p class="cause-courte"><span class="surtitre">' + (prem === dg.causes[0] ? "Cause la plus probable" : "À vérifier d’abord") + (dg.dansPlan(prem) ? " · dans ton plan" : "") + '</span>' + L(prem.cause.t) + '</p>' +
      (exos.length ? '<p class="surtitre">Exercices correctifs</p><div class="exos-lies">' + exos.join("") + '</div>' : '') +
      '<button class="btn large" type="button" data-a="defaut-fiche" data-id="' + id + '">Comprendre ce défaut</button></article>';
  }
  function defautFicheHTML(id) {
    var s = SYM[id], dg = diagnosticDefaut(id), pal = dg.pal, causes = dg.causes;
    var visibles = causes.filter(function (c) { return c.rang !== "secondaire"; }), autres = causes.filter(function (c) { return c.rang === "secondaire"; });
    var h = '<button class="voile" type="button" data-a="fermer-feuille" aria-label="Fermer" tabindex="-1"></button>' +
      '<section class="feuille plein" role="dialog" aria-modal="true" aria-labelledby="f-titre" id="feuille">' +
      '<header><p class="surtitre">Comprendre ce défaut</p><h2 id="f-titre">' + L(s.t) + '</h2><button class="fermer" type="button" data-a="fermer-feuille" id="f-fermer">Fermer</button></header>' +
      '<p class="but">' + L(s.desc) + '</p>';
    if (s.note && s.note[pal]) h += '<p class="note">' + L(s.note[pal]) + '</p>';
    if (dg.ordre[0] !== causes[0]) h += '<p class="aide">On commence par vérifier le réglage de base (' + L(dg.ordre[0].cause.t.toLowerCase()) + '), puis on passe au geste.</p>';
    visibles.forEach(function (c) {
      var exos = dg.exosDe(c);
      h += '<div class="cause ' + c.rang + '"><p class="rang">' + (c.rang === "probable" ? "Cause la plus probable" : "Cause possible") + (dg.dansPlan(c) ? " · travaillée dans ton plan" : "") + '</p>' +
        '<h3>' + L(c.cause.t) + '</h3><p>' + L(c.cause.pourquoi) + '</p>' +
        '<dl><dt>Vérifie</dt><dd>' + L(c.cause.verif) + '</dd><dt>Corrige</dt><dd>' + L(c.cause.conseil) + '</dd></dl>' +
        (exos.length ? '<div class="exos-lies">' + exos.map(function (e) { return puceExo(e, id, c.cause.id); }).join("") + '</div>' : '') + '</div>';
    });
    if (autres.length) {
      h += '<details><summary>' + (autres.length > 1 ? "Les " + autres.length + " autres causes à vérifier ensuite" : "Une autre cause à vérifier ensuite") + '</summary><ul>' +
        autres.map(function (c) { return '<li><b>' + L(c.cause.t) + '.</b> ' + L(c.cause.verif) + '</li>'; }).join("") + '</ul></details>';
    }
    return h + '<p class="glossaire">Ces causes sont les plus fréquentes pour ce défaut à ton palier. Elles ne remplacent pas le regard d’un enseignant de golf sur ton swing.</p></section>';
  }

  VUES.bilan = function () {
    var p = etat.profil, pal = palierDe(indexNiveau(p)), P = PALIERS[pal - 1];
    var sc = scoresDomaines(p), prios = priorites(p), i = 0, large = estLarge();
    /* UX06 : en-tête commun (sous-navigation, rubriques, filtre commun), puis la rubrique choisie. */
    var rb = rubriqueCourante();
    var h = '<section class="bloc premier">' + sousNavAnalysesHTML("bilan") + '<p class="surtitre">Analyses</p><h1>Tableau de bord</h1>' + rubriquesNavHTML(rb) +
      (rb === "comprendre" ? '' : tableauStatsHTML("filtres")) + '</section>';
    var sPalier = '<section class="bloc" id="palier-bloc"><p class="surtitre">' + t("Palier des index " + P.plage.replace(/^Index /, "").replace(/^inférieur à/, "inférieurs à")) + '</p><h2 class="h2-palier">Palier ' + pal + '<span>' + t(P.nom) + '</span></h2><p class="chapo">' + t(P.resume) + '</p>' +
      uneBilanHTML(prios, sc, pal) + '</section>';

    var c = '<ol class="priorites">' + prios.slice(0, 3).map(function (x, k) {
      return '<li><span class="rang" aria-hidden="true">' + (k + 1) + '</span><div><b>' + t(DOM[x.d].nom) + '</b><p>' + t(raisonPriorite(x, sc[x.d], pal)) + '</p></div></li>';
    }).join("") + '</ol>';
    var sPrios = pliHTML("priorites", "Tes trois priorités", prios.slice(0, 3).map(function (x) { return DOM[x.d].court; }).join(", ").toLowerCase(), c, 1);

    c = '<div class="defile"><table class="carte-score"><thead><tr><th scope="col">Indicateur</th><th scope="col" class="num">Toi</th><th scope="col" class="num">Repère</th></tr></thead><tbody>';
    var manquants = 0, dessous = 0, notes = 0;
    DOMAINES.forEach(function (d) {
      if (d.transversal) return;
      var rg = prios.map(function (x) { return x.d; }).indexOf(d.id);
      c += '<tr class="dom"><th colspan="3" scope="colgroup">' + t(d.nom) + (rg < 3 ? " · priorité " + (rg + 1) : "") + '</th></tr>';
      sc[d.id].vals.forEach(function (v) {
        if (v.val == null) manquants++; else { notes++; if (v.etat === "dessous") dessous++; }
        c += '<tr><td>' + t(v.ind.nom) + ' <small>' + t(v.ind.unite + " · " + sourceLib(v)) + '</small></td>' +
          '<td class="num">' + (v.val == null ? '<span class="marque inconnu">?</span>' : '<span class="marque ' + (v.etat === "repere" ? "" : v.etat) + '" style="--i:' + (i++) + '">' + v.val + '</span>') + '</td>' +
          '<td class="num rep">' + v.ind.rep[pal - 1] + '</td></tr>';
      });
    });
    c += '</tbody></table></div><p class="legende"><span><span class="marque dessus">7</span> mieux que le repère</span><span><span class="marque dessous">3</span> moins bien</span></p>' +
      (manquants ? '<p class="aide">' + t(pluriel(manquants, "indicateur") + " sans réponse : complète ton profil pour affiner le bilan.") + '</p>' : '') +
      comment('<p>Les repères sont des ordres de grandeur pour un joueur de ton palier. Un chiffre déclaré est remplacé dès que tu le mesures : par un test noté du plan, ou par tes parties saisies dans le carnet.</p>');
    var sCarte = pliHTML("carte", "Ta carte", notes ? dessous + " sous le repère sur " + notes : "à compléter", c, 2);

    var sg = coupsGagnesHTML(), rel = relevesHTML(), no = notesHTML(false), ev = erreursGlobalesHTML();
    var sNotes = pliHTML("notes", "Ton jeu sur 100", no.resume, no.html, 2);
    var sSG = pliHTML("sg", "Ton objectif d’index", sg.resume, sg.corps, 3);
    var sEvit = ev ? pliHTML("evitables", "Erreurs évitables", ev.resume, ev.html, 4) : "";
    var sRel = rel ? pliHTML("releves", "Relevés détaillés", rel.resume, rel.corps, 4) : "";

    var syms = symptomesOrdonnes(p);
    c = syms.length ? syms.map(defautHTML).join("")
      : '<p>Tu n’as signalé aucun défaut. Si un coup te pose problème, ajoute-le dans ton profil : le bilan en cherchera les causes.</p>';
    var sDef = pliHTML("defauts", "Tes défauts", syms.length ? syms.map(function (id) { return lat(SYM[id].t, p.lateralite); }).join(", ").toLowerCase() : "aucun signalé", c, 5);

    c = '<div class="deux-col"><div><h3>Ce qui fait gagner des coups</h3><ul>' + P.focus.map(function (x) { return '<li>' + t(x) + '</li>'; }).join("") + '</ul></div>' +
      (P.plusTard.length ? '<div><h3>À garder pour plus tard</h3><ul>' + P.plusTard.map(function (x) { return '<li>' + t(x) + '</li>'; }).join("") + '</ul></div>' : '') + '</div>' +
      '<p class="aide" style="margin-top:12px">' + t("Ton plan en cours a été construit le " + dateCourte(etat.plan.cree) + ". Il sera recalculé au prochain bilan de cycle.") + '</p>';
    var sPal = pliHTML("palier", "À ton palier", P.nom.toLowerCase(), c, 6);

    /* Deux colonnes sur grand écran : le déclaré à gauche, le mesuré en partie à droite. */
    /* UX04 : les repères face à l'objectif d'index (anciennes « Mes tendances » de l'accueil) sont rangés ici. */
    var sRep = etat.parties.length ? pliHTML("reperes", "Repères face à ton objectif", "petit jeu, coups gagnés estimés, conseils", chiffresClesHTML(), 3) : "";
    return h + rubriqueHTML(rb, { palier: sPalier, prios: sPrios, carte: sCarte, pal: sPal, notes: sNotes, rep: sRep, sg: sSG, evit: sEvit, rel: sRel, def: sDef });
  };

  /* ---------- Exercices ---------- */
  VUES.exercices = function () {
    var pal = palierDe(indexNiveau(etat.profil)), f = ui.filtre;
    var liste = EXERCICES.filter(function (e) { return (f.d === "tous" || e.d === f.d) && (!f.monPalier || (e.niv[0] <= pal && pal <= e.niv[1])); });
    var h = '<section class="bloc premier">' + sousNavAnalysesHTML("exercices") + '<button class="retour" type="button" data-a="onglet" data-v="practice">' + icone("retour") + 'Programme</button><p class="surtitre">' + t(pluriel(liste.length, "exercice") + (f.monPalier ? " pour ton palier" : ", tous paliers")) + '</p><h1>Exercices</h1>' +
      '<div class="filtres" role="group" aria-label="Domaine"><button class="puce neutre" type="button" data-a="filtre" data-v="tous" aria-pressed="' + (f.d === "tous") + '">Tous</button>' +
      DOMAINES.map(function (d) { return '<button class="puce neutre" type="button" data-a="filtre" data-v="' + d.id + '" aria-pressed="' + (f.d === d.id) + '">' + t(d.court) + '</button>'; }).join("") + '</div>' +
      '<button class="lien" type="button" data-a="filtre-palier" aria-pressed="' + f.monPalier + '">' + (f.monPalier ? "Voir aussi les autres paliers" : "Voir seulement mon palier") + '</button></section>';
    h += defisHTML(f.d);
    h += '<section class="bloc" style="border-top:0;padding-top:0"><ul class="liste-exos">';
    var courant = null;
    liste.forEach(function (e) {
      if (e.d !== courant) { courant = e.d; h += '<li class="dom">' + t(DOM[e.d].nom) + '</li>'; }
      var sous = TYPES[e.type] + (e.min ? " · " + dureeLib(e.min) : "") + " · " + nomsLieux(e.lieux).toLowerCase() + (f.monPalier ? "" : " · " + nivLib(e).toLowerCase());
      h += '<li><button class="ligne" type="button" data-a="exo" data-id="' + e.id + '"><span class="quoi"><b>' + L(e.t) + '</b><small>' + t(sous) + '</small></span><span class="chev" aria-hidden="true">›</span></button></li>';
    });
    if (!liste.length) h += '<li><div class="ligne"><span class="quoi">Aucun exercice pour ce filtre.</span><span></span></div></li>';
    return h + '</ul></section>';
  };
  function nivLib(e) {
    if (e.niv[0] === 1 && e.niv[1] === 4) return "Tous les paliers";
    return e.niv[0] === e.niv[1] ? "Palier " + e.niv[0] : "Paliers " + e.niv[0] + " à " + e.niv[1];
  }

  /* ---------- Profil ---------- */
  function donneesProfilHTML() {
    var h = '';
    h += '<section class="bloc" id="donnees"><h2>Tes données</h2><p id="statut-donnees">' + t(texteStatut()) + '</p>' +
      '<p><button class="btn principal" type="button" data-a="md-ouvrir">Voir et corriger mes données</button></p><div class="ligne-btn">' +
      '<button class="btn" type="button" data-a="exporter-fichier">Télécharger mes données (.json)</button><label class="btn" for="importer-fichier">Restaurer un fichier<input id="importer-fichier" type="file" accept=".json,application/json" data-c="importer-fichier" class="vh"></label><button class="btn" type="button" data-a="exporter">Copier une sauvegarde</button><button class="btn" type="button" data-a="importer">Restaurer un texte</button></div>' +
      '<p style="margin-top:14px"><button class="btn danger large" type="button" data-a="effacer">Tout effacer</button></p></section>';

    return h;
  }
  function aProposHTML() {
    var h = '';
    h += '<section class="bloc"><h2>À propos</h2><p>Prototype. Les repères par palier sont des ordres de grandeur, à affiner avec les résultats des joueurs. Si un exercice provoque une douleur, arrête-le. Les coups gagnés sont une estimation à partir de quelques chiffres par trou. L’index estimé suit la méthode du World Handicap System sans la reproduire entièrement : il ne remplace pas ton index officiel. Les causes proposées pour un défaut sont les plus fréquentes : elles ne remplacent pas le regard d’un enseignant de golf sur ton swing. Graphiques : Chart.js, sous licence MIT.</p>' +
      '<p class="aide">Vocabulaire : le pied avant est le plus proche de la cible, la main du haut est celle qui tient le haut du grip.</p></section>';
    return h;
  }
  VUES.profil = function () {
    var p = etat.profil, pal = PALIERS[palierDe(indexNiveau(p)) - 1], obj = OBJECTIFS.filter(function (o) { return o.id === p.objectif; })[0];
    var syms = symptomesOrdonnes(p).map(function (id) { return lat(SYM[id].t, p.lateralite); });
    var h = '<section class="bloc premier"><p class="surtitre">Profil</p><h1>' + t(p.prenom || "Ton profil") + '</h1><dl class="fiche">' +
      '<dt>Index</dt><dd>' + t(indexDeclare(p) != null ? indexLib(p.index) : "non renseigné") + '</dd>' +
      '<dt>Jeu</dt><dd>' + (p.lateralite === "G" ? "Gaucher" : "Droitier") + '</dd>';
    /* Sans questionnaire (P02) : le profil se limite au carnet ; le programme est proposé, pas imposé. */
    if (p.questionnaire === false) {
      h += '</dl><p class="aide">' + t("Pas encore de programme d'entraînement : il est facultatif. Le questionnaire (5 minutes) le règle sur ton niveau, tes défauts et ton temps.") + '</p>' +
        '<div class="ligne-btn"><button class="btn large" type="button" data-a="ac-profil">Modifier mon prénom, ma main ou mon index</button><button class="btn" type="button" data-a="modifier">Créer mon programme</button></div></section>';
      return h + indexViseHTML() + donneesProfilHTML() + aProposHTML() + versionHTML();
    }
    h += '<dt>Palier</dt><dd>' + t(pal.n + " · " + pal.nom) + '</dd>' +
      '<dt>Objectif</dt><dd>' + t(obj ? obj.t : "") + '</dd>' +
      '<dt>Rythme</dt><dd>' + t(pluriel(p.seances, "séance") + " de " + dureeLib(p.duree) + " par semaine") + '</dd>' +
      '<dt>Lieux</dt><dd>' + t(nomsLieux(p.lieux)) + '</dd>' +
      '<dt>Défauts</dt><dd>' + t(syms.length ? enListe(syms) : "Aucun signalé") + '</dd></dl>' +
      '<button class="btn large" type="button" data-a="modifier">Modifier mes réponses</button></section>';
    h += indexViseHTML();

    h += '<section class="bloc"><h2>Cycles</h2><p>' + t("Cycle " + etat.cycle + " commencé le " + dateCourte(etat.plan.cree) + " : " + pluriel(compteFaites(), "séance") + " faite" + (compteFaites() > 1 ? "s" : "") + " sur " + etat.plan.n * 4 + ".") + '</p>';
    if (etat.historique.length) {
      h += '<ul>' + etat.historique.map(function (c) { return '<li>' + t("Cycle " + c.cycle + ", du " + dateCourte(c.debut) + " au " + dateCourte(c.fin) + " : " + c.faites + " séances sur " + c.total + ".") + '</li>'; }).join("") + '</ul>';
    }
    h += '<button class="btn large" type="button" data-a="fin-cycle">Faire le bilan du cycle</button></section>';

    h += donneesProfilHTML() + aProposHTML();
    return h + versionHTML();
  };

  /* ============================================================
     FEUILLE D'EXERCICE
     ============================================================ */
  function scoreHTML(e, pal) {
    var sc = e.score, rep = sc.rep[pal - 1], hist = etat.scores[e.id] || [];
    var h = '<div class="score"><h3>Ton score</h3>' +
      '<form data-f="score" data-id="' + e.id + '" novalidate><label for="sc-val">' + L(sc.lib) + '</label>' +
      '<input id="sc-val" type="text" inputmode="numeric" autocomplete="off" maxlength="3" aria-describedby="sc-aide"><button class="btn principal" type="submit">Noter</button></form>' +
      '<p class="erreur" id="sc-err" role="alert" hidden style="margin-top:8px"></p>' +
      '<p class="aide" id="sc-aide" style="margin-top:8px">' + t("Repère pour ton palier : " + rep + "." + (sc.sens === "bas" ? " Plus le chiffre est bas, mieux c'est." : "") + (sc.ind ? " Ce score met à jour ton bilan." : "")) + '</p>';
    if (hist.length) {
      h += '<ul class="histo">' + hist.slice(-6).map(function (x) {
        var et = etatValeur(sc.sens, x.v, rep);
        return '<li><span class="marque ' + (et === "repere" ? "" : et) + '">' + x.v + '</span>' + t(dateCourte(x.d)) + '</li>';
      }).join("") + '</ul>';
      if (hist.length >= 2) h += courbe(hist.slice(-12).map(function (x) { return x.v; }), rep, hist.slice(-12).map(function (x) { return dateCourte(x.d); }), "ex-" + e.id);
    }
    return h + '</div>';
  }

  function rendreFeuille() { rendreFeuilleSeule(); monterGraphes(); }
  function rendreFeuilleSeule() {
    var c = document.getElementById("calque-feuille"), f = ui.feuille;
    if (f && f.defi && DEFI[f.defi] && etat.profil) { c.innerHTML = defiHTML(f.defi); entreeFeuille(); majFige(); return; }
    if (f && f.partie != null && etat.parties[f.partie] && etat.profil) { c.innerHTML = cartePartieHTML(f.partie); entreeFeuille(); majFige(); return; }
    if (f && f.parcours && parcoursDe(f.parcours) && etat.profil) { c.innerHTML = parcoursHTML(f.parcours); entreeFeuille(); majFige(); return; }
    if (f && f.defaut && etat.profil && a(etat.profil.symptomes, f.defaut)) { c.innerHTML = defautFicheHTML(f.defaut); entreeFeuille(); majFige(); return; }
    if (f && f.conditions && etat.profil) { c.innerHTML = conditionsHTML(); entreeFeuille(); majFige(); return; }
    if (f && f.donnees && etat.profil) { c.innerHTML = mesDonneesHTML(); entreeFeuille(); majFige(); return; }
    if (f && f.journal && etat.profil) { c.innerHTML = journalHTML(); entreeFeuille(); majFige(); monterGraphes(); return; }
    if (f && f.analyste && etat.profil) { c.innerHTML = analysteHTML(); entreeFeuille(); majFige(); return; }
    if (f && f.enseignements && etat.profil) { c.innerHTML = ensHTML(); entreeFeuille(); majFige(); return; }
    if (f && f.sac && (f.sac === "putter" || CLUB[f.sac]) && etat.profil) { c.innerHTML = sacFeuilleHTML(f.sac); entreeFeuille(); majFige(); return; }
    if (f && f.sacComposer && etat.profil) { c.innerHTML = sacComposerHTML(); entreeFeuille(); majFige(); return; }
    if (f && f.serie && ui.serie && etat.profil) { c.innerHTML = serieHTML(); entreeFeuille(); majFige(); return; }
    if (f && f.recherche && etat.profil) { c.innerHTML = rechercheHTML(); entreeFeuille(); majFige(); return; }
    if (f && f.carte && (f.carte === "nouveau" || parcoursDe(f.carte)) && etat.profil) { c.innerHTML = carteFeuilleHTML(f.carte); entreeFeuille(); majFige(); return; }
    if (!f || !EX[f.id] || !etat.profil) { ui.feuille = null; ui.feuilleVue = false; c.innerHTML = ""; majFige(); return; }
    var e = EX[f.id], p = etat.profil, pal = palierDe(indexNiveau(p));
    var meta = [DOM[e.d].nom, TYPES[e.type]]; if (e.min) meta.push(dureeLib(e.min));
    var dans = e.niv[0] <= pal && pal <= e.niv[1];
    var h = '<button class="voile" type="button" data-a="fermer-feuille" aria-label="Fermer la fiche" tabindex="-1"></button>' +
      '<section class="feuille" role="dialog" aria-modal="true" aria-labelledby="f-titre" id="feuille">' +
      '<header><p class="surtitre">' + t(meta.join(" · ")) + '</p><h2 id="f-titre">' + L(e.t) + '</h2><button class="fermer" type="button" data-a="fermer-feuille" id="f-fermer">Fermer</button></header>';
    if (f.sym && SYM[f.sym]) {
      var cause = SYM[f.sym].causes.filter(function (x) { return x.id === f.cause; })[0];
      h += '<p class="contexte"><b>' + L("Correctif pour : " + SYM[f.sym].t.toLowerCase()) + '</b>' + (cause ? '<br>' + L("Cause travaillée : " + cause.t.toLowerCase() + ". " + cause.conseil) : '') + '</p>';
    }
    h += '<p class="but">' + L(e.but) + '</p>' + schemaHTML(e.id) +
      '<dl class="fiche"><dt>Lieu</dt><dd>' + t(nomsLieux(e.lieux)) + '</dd>' + (e.mat ? '<dt>Matériel</dt><dd>' + L(e.mat) + '</dd>' : '') +
      '<dt>Niveau</dt><dd>' + t(nivLib(e) + (dans ? "" : " · hors de ton palier actuel")) + '</dd></dl>' +
      '<ol class="etapes">' + e.etapes.map(function (x) { return '<li><span>' + L(x) + '</span></li>'; }).join("") + '</ol>';
    if (e.palier && e.palier[pal]) h += '<div class="palier-adapt"><b>À ton palier</b>' + L(e.palier[pal]) + '</div>';
    h += outilHTML(e.id);
    if (e.score) h += scoreHTML(e, pal);
    h += '<p class="glossaire">Pied avant : le plus proche de la cible. Main du haut : celle qui tient le haut du grip.</p></section>';
    c.innerHTML = h;
    entreeFeuille(); majFige();
  }
  /* La feuille ne glisse qu'à son ouverture, pas à chaque mise à jour de son contenu. */
  function entreeFeuille() {
    var el = document.getElementById("feuille");
    if (el && !ui.feuilleVue) el.classList.add("entre");
    ui.feuilleVue = !!el;
  }
  function majFige() { document.body.classList.toggle("fige", !!ui.feuille || !!ui.partie); synchroHisto(); }
  function ouvrirFeuille(el) {
    if (ui.feuille && ui.feuille.defaut) { ui.feuilleRetour = { feuille: ui.feuille, focus: ui.retourFocus }; ui.feuilleVue = false; }
    else ui.retourFocus = el;
    ui.feuille = { id: el.getAttribute("data-id"), sym: el.getAttribute("data-sym"), cause: el.getAttribute("data-cause") };
    rendreFeuille();
    var b = document.getElementById("f-fermer"); if (b) b.focus();
  }
  function fermerFeuille() {
    if (ui.feuilleRetour) {
      var r = ui.feuilleRetour; ui.feuilleRetour = null;
      ui.feuille = r.feuille; ui.retourFocus = r.focus; ui.feuilleVue = false; rendreFeuille();
      var bf = document.getElementById("f-fermer"); if (bf) bf.focus();
      return;
    }
    /* Une série de balles en cours est enregistrée en fermant la fiche. */
    var serie = ui.feuille && ui.feuille.serie ? enregistrerSerie() : null;
    if (ui.feuille && ui.feuille.serie) ui.serie = null;
    /* Le sac a pu être redessiné en aperçu pendant la saisie : il est remis à l'état enregistré. */
    var defi = ui.feuille && (ui.feuille.defi || ui.feuille.parcours || ui.feuille.partie != null || ui.feuille.conditions || ui.feuille.sac || ui.feuille.sacComposer || ui.feuille.serie || ui.feuille.carte || ui.feuille.donnees || ui.feuille.journal || ui.feuille.analyste || ui.feuille.enseignements);
    var carteF = ui.feuille && ui.feuille.carte;
    if (serie) messageEnregistre("Série enregistrée. " + annonceSerie(serie));
    ui.sacApercu = null;
    ui.feuille = null; ui.pile = []; ui.defiEvt = null; rendreFeuille();
    var el = ui.retourFocus; ui.retourFocus = null;
    if (defi) rendre();
    if (carteF) { ui.carteRech = null; ui.carteNum = null; if (ui.partie) rendrePartie(); }
    if (el) {
      var sel = '[data-a="' + el.getAttribute("data-a") + '"][data-id="' + el.getAttribute("data-id") + '"]';
      var cible = document.body.contains(el) ? el : app.querySelector(sel);
      if (cible) cible.focus({ preventScroll: true });
    }
  }

  /* ============================================================
     DIALOGUES
     ============================================================ */
  function dialogue(d) { ui.dialogue = d; rendreDialogue(); }
  function rendreDialogue() {
    var c = document.getElementById("calque-dialogue"), d = ui.dialogue;
    if (!d) { c.innerHTML = ""; return; }
    c.innerHTML = '<button class="voile haut" type="button" data-a="fermer-dialogue" aria-label="Fermer" tabindex="-1"></button>' +
      '<section class="dialogue" role="dialog" aria-modal="true" aria-labelledby="d-titre"><h2 id="d-titre">' + t(d.titre) + '</h2>' + d.corps +
      '<div class="ligne-btn">' + d.boutons.map(function (b) { return '<button class="btn ' + (b.c || "") + '" type="button" data-a="' + b.a + '">' + t(b.l) + '</button>'; }).join("") + '</div></section>';
    var premier = c.querySelector("textarea:not([readonly]), .dialogue .btn"); if (premier) premier.focus();
    synchroHisto();
  }
  /* Les cartes GPS sont conservées à part : l'export JSON doit les inclure explicitement. */
  function archiveComplete() {
    var archive = JSON.parse(JSON.stringify(etat));
    archive.cartesGeo = cartesStock();
    return archive;
  }
  function lireCartesArchive(brut, restaure) {
    if (!brut || !Object.prototype.hasOwnProperty.call(brut, "cartesGeo")) return null; /* ancien export : conserver les cartes locales */
    var r = brut.cartesGeo;
    if (!r || typeof r !== "object" || Array.isArray(r)) throw new Error("Cartes GPS invalides");
    var ids = {};
    (restaure.parcours || []).forEach(function (pc) { ids[pc.id] = true; });
    var cartes = {};
    Object.keys(r).slice(0, 20).forEach(function (id) {
      if (!ids[id] || !/^p\d{1,6}$/.test(id)) return;
      var c = assainirCarte(r[id]);
      if (c) cartes[id] = c;
    });
    return cartes;
  }
  function restaurerCartesArchive(cartes) {
    if (cartes === null) return true;
    var avant = cartesStock();
    GEO.cartes = cartes;
    if (ecrireCartes()) return true;
    GEO.cartes = avant;
    return false;
  }
  /* Le texte de sauvegarde contient tout, comme le fichier : cartes GPS comprises. */
  function codeSauvegarde() { return btoa(unescape(encodeURIComponent(JSON.stringify(archiveComplete())))); }

  /* ============================================================
     RENDU GÉNÉRAL
     ============================================================ */
  function rendre() {
    if (etat && etat.carnet) majWedges();
    var dansAppli = !(ui.vue === "questionnaire" && ui.brouillon) && !!etat.profil && !!etat.plan;
    if (ui.vue === "questionnaire" && ui.brouillon) rendreQuestionnaire();
    else if (!dansAppli) rendreAccueil();
    else rendreApp();
    rendreMenu(dansAppli);
    monterGraphes();
  }
  /* Redessine en rendant le focus au bouton qui vient d'être actionné. */
  function rendreEtFocus(el) {
    var sel = "";
    ["a", "k", "v", "s", "q", "id", "d"].forEach(function (k) { var v = el.getAttribute("data-" + k); if (v != null) sel += '[data-' + k + '="' + v + '"]'; });
    var ind = el.closest(".mesure");
    rendre();
    var cible = sel ? (ind ? app.querySelector('.mesure[data-ind="' + ind.getAttribute("data-ind") + '"] ' + sel) : app.querySelector(sel)) : null;
    if (cible) cible.focus({ preventScroll: true });
  }

  /* ============================================================
     ACTIONS
     ============================================================ */
  function ouvrirQuestionnaire(mode) {
    ui.mode = mode;
    if (mode && etat.profil) {
      ui.brouillon = copie(etat.profil);
      ui.brouillon.indexTexte = ui.brouillon.sansIndex ? "" : indexLib(ui.brouillon.index);
    } else { ui.brouillon = brouillonNeuf(); }
    ui.etape = 0;
    ui.vue = "questionnaire"; ui.dialogue = null; rendreDialogue();
    rendre(); window.scrollTo(0, 0);
  }
  function setInd(id, val) { ui.brouillon.indicateurs[id] = { val: val, src: "declare", date: auj() }; majMesure(id); }

  var ACTIONS = {
    commencer: function () { ouvrirQuestionnaire(null); },
    "ac-profil": function () {
      var p = etat.profil, idx = indexDeclare(p);
      dialogue({ titre: "Prénom, main et index", corps:
        '<div class="champ"><label for="d-prenom">Prénom <small>(facultatif)</small></label><input id="d-prenom" type="text" autocomplete="given-name" maxlength="30" value="' + at(p.prenom) + '"></div>' +
        '<div class="champ"><label for="d-lat">Tu joues</label><select id="d-lat"><option value="D"' + (p.lateralite !== "G" ? " selected" : "") + '>En droitier</option><option value="G"' + (p.lateralite === "G" ? " selected" : "") + '>En gaucher</option></select></div>' +
        '<div class="champ"><label for="d-index">Index <small>(laisse vide si tu ne le connais pas)</small></label><input id="d-index" type="text" inputmode="decimal" maxlength="4" value="' + at(idx == null ? "" : indexLib(idx)) + '"></div>' +
        '<p class="erreur" id="d-err" role="alert" hidden></p>',
        boutons: [{ l: "Annuler", a: "fermer-dialogue" }, { l: "Enregistrer", a: "ac-profil-ok", c: "principal" }] });
    },
    "ac-profil-ok": function () {
      var p = etat.profil, err = document.getElementById("d-err"), brut = (document.getElementById("d-index").value || "").trim().replace(",", "."), index = null;
      if (brut) {
        index = /^\d{1,2}([.]\d)?$/.test(brut) ? parseFloat(brut) : NaN;
        if (!(index >= 0 && index <= 54)) { err.textContent = "L'index va de 0 à 54, ou laisse vide."; err.hidden = false; return; }
        index = Math.round(index * 10) / 10;
      }
      p.prenom = (document.getElementById("d-prenom").value || "").trim().slice(0, 30);
      p.lateralite = document.getElementById("d-lat").value === "G" ? "G" : "D";
      var avant = indexDeclare(p);
      p.index = index; p.sansIndex = index == null; p.maj = auj();
      if (index != null && index !== avant) noterIndex(index);
      ui.dialogue = null; rendreDialogue(); rendre();
      sauverPuis("Profil mis à jour.");
    },
    "ac-lat": function (el) { var b = ui.carnetNeuf; if (!b) return; b.lateralite = el.getAttribute("data-v") === "G" ? "G" : "D"; rendreEtFocus(el); },
    "ac-sans-index": function (el) { var b = ui.carnetNeuf; if (!b) return; b.sansIndex = !b.sansIndex; if (b.sansIndex) b.indexTexte = ""; rendreEtFocus(el); },
    "q-retour": function () {
      if (ui.etape === 0) {
        ui.vue = "app"; ui.brouillon = null; ui.mode = null; rendre(); window.scrollTo(0, 0); return;
      }
      ui.etape--; rendre(); window.scrollTo(0, 0);
    },
    "q-suite": function () {
      var etapes = etapesActives(), e = etapes[ui.etape], b = ui.brouillon, err = "";
      if (e.id === "toi" && indexBrouillon() == null) err = "Indique ton index, entre 0 et 54, ou choisis « Pas d'index, ou je ne le connais pas ».";
      if (e.id === "objectif" && !b.objectif) err = "Choisis ton objectif principal.";
      if (e.id === "entrainement" && !b.lieux.some(function (l) { return l !== "parcours"; })) err = "Choisis au moins un lieu d'entraînement en plus du parcours. « Maison ou jardin » suffit.";
      if (err) { erreurQ(err); return; }
      if (e.id === "toi") elaguerSymptomes(b);
      if (e.id === "entrainement" && b.pasDeParcours == null) b.pasDeParcours = b.lieux.indexOf("parcours") < 0;
      if (e.id === "defauts" || e.id === "precisions") elaguerSymptomes(b);
      etapes = etapesActives();
      if (ui.etape >= etapes.length - 1) { terminerQuestionnaire(); return; }
      ui.etape++; rendre(); window.scrollTo(0, 0);
    },
    set: function (el) {
      var k = el.getAttribute("data-k"), v = el.getAttribute("data-v");
      ui.brouillon[k] = (k === "seances" || k === "duree") ? parseInt(v, 10) : v;
      rendreEtFocus(el);
    },
    "sans-index": function (el) { ui.brouillon.sansIndex = !ui.brouillon.sansIndex; rendreEtFocus(el); },
    envie: function (el) {
      var v = el.getAttribute("data-v"), a = ui.brouillon.envies, i = a.indexOf(v);
      if (i >= 0) a.splice(i, 1); else { if (a.length >= 2) a.shift(); a.push(v); }
      rendreEtFocus(el);
    },
    lieu: function (el) {
      var v = el.getAttribute("data-v"), a = ui.brouillon.lieux, i = a.indexOf(v);
      if (i >= 0) a.splice(i, 1); else a.push(v);
      if (v === "parcours") ui.brouillon.pasDeParcours = a.indexOf("parcours") < 0;
      rendreEtFocus(el);
    },
    "pas-parcours": function (el) { ui.brouillon.pasDeParcours = !ui.brouillon.pasDeParcours; rendreEtFocus(el); },
    "ind-pas": function (el) {
      var id = el.closest(".mesure").getAttribute("data-ind"), ind = IND[id], r = ui.brouillon.indicateurs[id];
      var d = parseInt(el.getAttribute("data-d"), 10);
      var base = r && r.val != null ? r.val + d : parseInt(document.getElementById("ind-" + id).value, 10);
      setInd(id, Math.max(0, Math.min(ind.max, base)));
    },
    "ind-nsp": function (el) {
      var id = el.closest(".mesure").getAttribute("data-ind"), r = ui.brouillon.indicateurs[id];
      if (r && r.val === null) { delete ui.brouillon.indicateurs[id]; majMesure(id); } else setInd(id, null);
    },
    defaut: function (el) {
      var v = el.getAttribute("data-v"), s = ui.brouillon.symptomes;
      if (s[v]) delete s[v];
      else {
        if (Object.keys(s).length >= 3) { erreurQ("Trois défauts au maximum. Retires-en un pour en choisir un autre : on corrige mieux peu de choses à la fois."); return; }
        s[v] = { reponses: {} };
      }
      if (!s[ui.brouillon.symptomePrincipal]) ui.brouillon.symptomePrincipal = Object.keys(s)[0] || null;
      rendreEtFocus(el);
    },
    principal: function (el) { ui.brouillon.symptomePrincipal = el.getAttribute("data-v"); rendreEtFocus(el); },
    rep: function (el) {
      var s = ui.brouillon.symptomes[el.getAttribute("data-s")]; if (!s) return;
      s.reponses = s.reponses || {};
      s.reponses[el.getAttribute("data-q")] = parseInt(el.getAttribute("data-v"), 10);
      rendreEtFocus(el);
    },

    onglet: function (el) { allerOnglet(el.getAttribute("data-v"), true); },
    semaine: function (el) { ui.semaine = parseInt(el.getAttribute("data-v"), 10); rendreEtFocus(el); },
    fait: function (el) {
      var id = el.getAttribute("data-id"), coche = !etat.fait[id];
      if (coche) etat.fait[id] = auj(); else delete etat.fait[id];
      sauver(); rendreEtFocus(el);
      if (coche) feterFait(id);
    },
    exo: function (el) { ouvrirFeuille(el); },
    "defaut-fiche": function (el) {
      var id = el.getAttribute("data-id"); if (!a(etat.profil.symptomes, id)) return;
      ui.retourFocus = el; ui.feuille = { defaut: id }; ui.feuilleRetour = null;
      rendreFeuille(); var b = document.getElementById("f-fermer"); if (b) b.focus();
    },
    "fermer-feuille": function () { fermerFeuille(); },
    filtre: function (el) { ui.filtre.d = el.getAttribute("data-v"); rendreEtFocus(el); },
    "filtre-palier": function (el) { ui.filtre.monPalier = !ui.filtre.monPalier; rendreEtFocus(el); },

    modifier: function () {
      /* Carnet sans programme (P02) : rien à remettre à zéro, le questionnaire s'ouvre directement. */
      if (etat.profil && etat.profil.questionnaire === false) { ouvrirQuestionnaire("modif"); return; }
      dialogue({ titre: "Modifier tes réponses", corps: '<p>Ton plan sera recalculé à partir de tes nouvelles réponses, et les séances cochées de ce cycle seront remises à zéro. Tes scores d’exercices sont conservés.</p>',
        boutons: [{ l: "Annuler", a: "fermer-dialogue" }, { l: "Modifier", a: "ok-modifier", c: "principal" }] });
    },
    "ok-modifier": function () { ouvrirQuestionnaire("modif"); },
    "fin-cycle": function () {
      var f = compteFaites(), tot = etat.plan.n * 4;
      dialogue({ titre: "Bilan du cycle " + etat.cycle, corps: '<p>' + t("Tu as fait " + pluriel(f, "séance") + " sur " + tot + ".") + ' Tu vas revoir ton index, tes chiffres et tes défauts. Les résultats de tes tests sont déjà reportés. L’appli construira ensuite le cycle ' + (etat.cycle + 1) + '.</p>',
        boutons: [{ l: "Pas maintenant", a: "fermer-dialogue" }, { l: "Faire le bilan", a: "ok-cycle", c: "principal" }] });
    },
    "ok-cycle": function () { ouvrirQuestionnaire("cycle"); },
    effacer: function () {
      dialogue({ titre: "Tout effacer ?", corps: '<p>Ton profil, ton plan, tes scores, ton carnet, tes parties, tes parcours, leurs cartes et tes défis seront supprimés. Cette action est définitive.</p>',
        boutons: [{ l: "Annuler", a: "fermer-dialogue" }, { l: "Tout effacer", a: "ok-effacer", c: "danger" }] });
    },
    "ok-effacer": function () {
      etat = etatNeuf(); sauver(); effacerCartes();
      ui.vue = "auto"; ui.brouillon = null; ui.dialogue = null; ui.feuille = null; ui.feuilleRetour = null; ui.partie = null; ui.bilanPartie = null; ui.depart = null;
      rendreDialogue(); rendreFeuille(); rendrePartie(); rendre(); window.scrollTo(0, 0);
    },
    "exporter-fichier": function () {
      var blob = new Blob([JSON.stringify(archiveComplete(), null, 2)], { type: "application/json" });
      var url = URL.createObjectURL(blob), lien = document.createElement("a");
      lien.href = url; lien.download = "coachgolf-" + auj().slice(0, 10) + ".json";
      document.body.appendChild(lien); lien.click(); lien.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 30000);
      message("Export JSON préparé, avec les cartes GPS.");
    },
    "ok-importer-fichier": function () {
      if (!ui.importPrete) return;
      var cartes = ui.importCartesPretes;
      etat = ui.importPrete; ui.importPrete = null; ui.importCartesPretes = null; ui.dialogue = null; ui.feuille = null;
      verifierPlan(); sauver();
      var cartesOK = restaurerCartesArchive(cartes);
      rendreDialogue(); rendreFeuille();
      ui.vue = "auto"; ui.partie = etat.partie ? "saisie" : null;
      rendre(); rendrePartie();
      messageEnregistre(cartesOK ? "Données et cartes GPS du fichier restaurées." : "Données restaurées, mais les cartes GPS n’ont pas pu être enregistrées sur cet appareil.",
        "Données chargées, mais pas enregistrées sur cet appareil (stockage plein ou bloqué). Ne ferme pas l’appli avant d’avoir libéré de la place.");
    },
    exporter: function () {
      dialogue({ titre: "Copier une sauvegarde", corps: '<p>Copie ce texte et garde-le dans une note ou un message. Il permet de restaurer tes données ici ou sur un autre appareil.</p><div class="champ"><label for="d-code">Ta sauvegarde</label><textarea id="d-code" readonly>' + codeSauvegarde() + '</textarea></div>',
        boutons: [{ l: "Fermer", a: "fermer-dialogue" }, { l: "Copier", a: "copier", c: "principal" }] });
    },
    copier: function () {
      var ta = document.getElementById("d-code"); if (!ta) return;
      var secours = function () { ta.focus(); ta.select(); message("Le texte est sélectionné : copie-le à la main."); };
      try { navigator.clipboard.writeText(ta.value).then(function () { message("Sauvegarde copiée."); }, secours); } catch (e) { secours(); }
    },
    importer: function () {
      dialogue({ titre: "Restaurer une sauvegarde", corps: '<p>Colle ici le texte d’une sauvegarde. Elle remplacera les données actuelles.</p><div class="champ"><label for="d-code">Sauvegarde à restaurer</label><textarea id="d-code"></textarea></div><p class="erreur" id="d-err" role="alert" hidden></p>',
        boutons: [{ l: "Annuler", a: "fermer-dialogue" }, { l: "Restaurer", a: "ok-importer", c: "principal" }] });
    },
    "ok-importer": function () {
      var ta = document.getElementById("d-code"), err = document.getElementById("d-err"), o = null;
      var brut = null, cartes = null;
      try { brut = JSON.parse(decodeURIComponent(escape(atob(ta.value.replace(/\s+/g, ""))))); o = assainir(brut); if (o && o.profil) cartes = lireCartesArchive(brut, o); } catch (e) { o = null; }
      if (!o || !o.profil) { err.textContent = "Ce texte n'est pas une sauvegarde valide. Vérifie qu'il est complet."; err.hidden = false; return; }
      etat = o;
      verifierPlan(); sauver();
      var cartesOK = restaurerCartesArchive(cartes);
      ui.dialogue = null; ui.feuille = null; ui.depart = null; rendreDialogue(); rendreFeuille(); ui.vue = "auto"; ui.semaine = semaineCourante(); rendre();
      messageEnregistre(cartesOK ? (cartes ? "Sauvegarde et cartes GPS restaurées." : "Sauvegarde restaurée.") : "Sauvegarde restaurée, mais les cartes GPS n’ont pas pu être enregistrées sur cet appareil.",
        "Sauvegarde chargée, mais pas enregistrée sur cet appareil (stockage plein ou bloqué).");
    },
    "fermer-dialogue": function () { ui.dialogue = null; rendreDialogue(); }
  };

  var SAISIES = {
    prenom: function (el) { ui.brouillon.prenom = el.value; },
    index: function (el) {
      ui.brouillon.indexTexte = el.value;
      var i = indexBrouillon(), p = i == null ? null : PALIERS[palierDe(i) - 1], out = document.getElementById("q-palier");
      if (out) out.textContent = p ? "Palier " + p.n + " · " + p.nom + " (" + p.plage.toLowerCase() + ")" : "Entre 0 et 54.";
      erreurQ("");
    },
    ind: function (el) { setInd(el.id.replace("ind-", ""), parseInt(el.value, 10)); },
    "ac-prenom": function (el) { if (ui.carnetNeuf) ui.carnetNeuf.prenom = el.value; },
    "ac-index": function (el) { if (ui.carnetNeuf) ui.carnetNeuf.indexTexte = el.value; var e = document.getElementById("ac-erreur"); if (e) e.hidden = true; }
  };

  /* Note un score d'exercice et, s'il mesure un indicateur, met le bilan à jour. */
  function noterScoreExo(id, v) {
    var e = EX[id];
    if (!e || !e.score) return;
    v = Math.max(0, Math.min(e.score.max, Math.round(v)));
    (etat.scores[id] = etat.scores[id] || []).push({ d: auj(), v: v });
    if (e.score.ind && IND[e.score.ind]) {
      etat.profil.indicateurs[e.score.ind] = { val: Math.min(v, IND[e.score.ind].max), src: e.lieux[0] === "parcours" ? "partie" : "test", date: auj() };
    }
  }

  var FORMULAIRES = {
    /* P02 : création du carnet sans questionnaire. Index facultatif, jamais inventé. */
    "carnet-creer": function () {
      var b = ui.carnetNeuf || { prenom: "", lateralite: "D", indexTexte: "", sansIndex: false }, err = document.getElementById("ac-erreur");
      var brut = String(b.indexTexte || "").trim().replace(",", "."), index = null;
      if (!b.sansIndex && brut) {
        index = /^\d{1,2}([.]\d)?$/.test(brut) ? parseFloat(brut) : NaN;
        if (!(index >= 0 && index <= 54)) { if (err) { err.textContent = "L'index va de 0 à 54. Laisse vide ou choisis « Je ne connais pas mon index »."; err.hidden = false; } var i = document.getElementById("ac-index"); if (i) i.focus(); return; }
        index = Math.round(index * 10) / 10;
      }
      var p = brouillonNeuf();
      p.prenom = String(b.prenom || "").trim().slice(0, 30); p.lateralite = b.lateralite === "G" ? "G" : "D";
      p.index = index; p.sansIndex = index == null; p.objectif = "score"; p.lieux = ["practice", "putting", "parcours"];
      p.questionnaire = false; p.maj = auj();
      INDICATEURS.forEach(function (ind) { p.indicateurs[ind.id] = { val: null, src: "declare", date: p.maj }; });
      etat.profil = p;
      if (index != null) noterIndex(index);
      etat.plan = genererPlan(p, etat.cycle);
      ui.carnetNeuf = null; ui.vue = "app"; ui.anime = true;
      sauverPuis("Ton carnet est prêt. Note ta première partie quand tu veux.", MSG_NON_ENREGISTRE);
      allerOnglet("accueil", true);
      var c = document.querySelector('[data-a="partie-rapide"]'); if (c) c.focus({ preventScroll: true });
    },
    score: function (form) {
      var e = EX[form.getAttribute("data-id")], inp = form.querySelector("input"), err = document.getElementById("sc-err");
      var brut = inp.value.trim(), v = /^\d+$/.test(brut) ? parseInt(brut, 10) : NaN;
      if (isNaN(v) || v > e.score.max) { err.textContent = "Entre un nombre entier entre 0 et " + e.score.max + "."; err.hidden = false; inp.focus(); return; }
      noterScoreExo(e.id, v);
      sauver(); rendre(); rendreFeuille();
      if (recordExo(e, v)) feter("record", "Ton meilleur score sur cet exercice", lat(e.t, lateralite()) + " : " + v + "." + (e.score.ind ? " Ton bilan est à jour." : ""));
      else message(e.score.ind ? "Score noté. Ton bilan est à jour." : "Score noté.");
    }
  };

  document.addEventListener("click", function (ev) {
    var el = ev.target.closest ? ev.target.closest("[data-a]") : null;
    if (!el) return;
    var f = ACTIONS[el.getAttribute("data-a")];
    if (f) f(el, ev);
  });
  document.addEventListener("input", function (ev) {
    var k = ev.target.getAttribute ? ev.target.getAttribute("data-i") : null;
    if (k && SAISIES[k]) SAISIES[k](ev.target);
  });
  document.addEventListener("submit", function (ev) {
    ev.preventDefault();
    var k = ev.target.getAttribute("data-f");
    if (k && FORMULAIRES[k]) FORMULAIRES[k](ev.target);
  });
  document.addEventListener("change", function (ev) {
    var k = ev.target.getAttribute ? ev.target.getAttribute("data-c") : null;
    if (k && CHANGEMENTS[k]) CHANGEMENTS[k](ev.target);
  });
  document.addEventListener("keydown", function (ev) {
    /* Les lignes de graphique cliquables se comportent comme des boutons au clavier. */
    if ((ev.key === "Enter" || ev.key === " ") && ev.target.getAttribute && ev.target.getAttribute("role") === "button" && ev.target.tagName !== "BUTTON") {
      var f = ACTIONS[ev.target.getAttribute("data-a")];
      if (f) { ev.preventDefault(); f(ev.target, ev); }
      return;
    }
    if (ev.key === "Escape") fermerDessus();
  });
  window.addEventListener("hashchange", function () {
    histo.pousse = false;
    var nom = location.hash.replace("#", "");
    if (!nom || !(PAGES.indexOf(nom) >= 0 || a(ALIAS, nom))) return;
    if (pageDe(nom) !== ui.onglet && ui.vue !== "questionnaire" && etat.profil) allerOnglet(nom, true);
  });

  /*INCLURE:ui-carnet.js*/
  /*INCLURE:sac3d.js*/
  /*INCLURE:ui-sac.js*/
  /*INCLURE:ui-menu.js*/
  /*INCLURE:ui-golf.js*/
  /*INCLURE:ui-partie.js*/
  /*INCLURE:vendor-eveil.js*/
  /*INCLURE:ui-jeu.js*/
  /*INCLURE:ui-strategie.js*/
  /*INCLURE:ui-carte.js*/
  /*INCLURE:ui-analyse.js*/
  /*INCLURE:ui-tableau.js*/
  /*INCLURE:ui-stats.js*/
  /*INCLURE:ui-clubs.js*/
  /*INCLURE:ui-erreurs.js*/
  /*INCLURE:ui-putting.js*/
  /*INCLURE:ui-donnees.js*/
  /*INCLURE:ui-journal.js*/
  /*INCLURE:ui-analyste.js*/
  /*INCLURE:ui-enseignements.js*/
  /*INCLURE:ui-rubriques.js*/
  /*INCLURE:ui-monsac.js*/
  /*INCLURE:ui-apres.js*/
  /*INCLURE:ui-series.js*/
  /*INCLURE:ui-parcours.js*/
  /*INCLURE:ui-objectifs.js*/
  /*INCLURE:ui-front.js*/
  /*INCLURE:ui-graphes.js*/
  /*INCLURE:ui-defis.js*/
  /*INCLURE:ui-schemas.js*/

  /* Enregistrer les actions après l'inclusion qui initialise CHANGEMENTS. */
  CHANGEMENTS["importer-fichier"] = function (el) {
    var fichier = el.files && el.files[0]; if (!fichier) return;
    if (fichier.size > 40e6) { message("Fichier trop volumineux."); return; }
    var fr = new FileReader();
    fr.onload = function () {
      var r = null, cartes = null;
      try {
        var brut = JSON.parse(String(fr.result));
        r = assainir(brut);
        if (r && r.profil) cartes = lireCartesArchive(brut, r);
      } catch (e) { r = null; }
      if (!r || !r.profil) { message("Fichier de sauvegarde invalide."); return; }
      ui.importPrete = r; ui.importCartesPretes = cartes;
      dialogue({ titre: "Remplacer les données actuelles ?", corps: "<p>Cette restauration remplacera toutes les données actuellement présentes sur cet appareil. Télécharge d’abord une sauvegarde si nécessaire.</p>", boutons: [{ l: "Annuler", a: "fermer-dialogue" }, { l: "Restaurer", a: "ok-importer-fichier", c: "principal" }] });
    };
    fr.onerror = function () { message("Impossible de lire le fichier."); };
    fr.readAsText(fichier);
    el.value = "";
  };


  /* ============================================================
     DÉMARRAGE
     ============================================================ */
  /* Reprend l'état d'écran transmis par la plateforme quand la page est remplacée
     par une version plus récente pendant qu'elle est ouverte. */
  function reprendre(repris) {
    var r = repris && repris.ui;
    if (!r || typeof r !== "object") return false;
    if (["auto", "app", "questionnaire"].indexOf(r.vue) >= 0) ui.vue = r.vue;
    if (typeof r.onglet === "string") ui.onglet = pageDe(r.onglet);
    ui.semaine = entier(r.semaine, 1, 4, ui.semaine);
    ui.etape = entier(r.etape, 0, 10, 0);
    ui.mode = r.mode === "modif" || r.mode === "cycle" ? r.mode : null;
    ui.brouillon = r.brouillon && typeof r.brouillon === "object" ? r.brouillon : null;
    if (ui.vue === "questionnaire" && !ui.brouillon) ui.vue = "auto";
    if (r.filtre && typeof r.filtre === "object") {
      ui.filtre = { d: r.filtre.d === "tous" || a(DOM, r.filtre.d) ? r.filtre.d : "tous", monPalier: r.filtre.monPalier !== false };
    }
    return true;
  }
  /* Si l'écran repris ne peut pas être affiché, on revient à l'écran de départ. */
  function rendreSur() {
    try { rendre(); } catch (e) {
      ui.vue = "auto"; ui.brouillon = null; ui.mode = null; ui.feuille = null; ui.dialogue = null; ui.onglet = "accueil";
      rendre();
    }
  }
  function demarrer(repris) {
    etat = assainir(etat) || etatNeuf();
    verifierPlan();
    /* L'appli s'ouvre toujours sur l'accueil. */
    try { if (location.hash && location.hash !== "#accueil") history.replaceState(null, "", "#accueil"); } catch (e) { /* historique indisponible */ }
    ui.semaine = semaineCourante();
    reprendre(repris);
    /* Une partie commencée il y a moins de huit heures se rouvre toute seule. */
    if (etat.partie && Date.now() - Date.parse(etat.partie.d) < 288e5 && ui.vue !== "questionnaire") ui.partie = "saisie";
    rendreSur();
    try { rendrePartie(); } catch (e) { ui.partie = null; rendrePartie(); }
    restaurerIndexe(); initDistant(); verifierPartage();
  }
  var chaud = null;
  try { chaud = window.claude && window.claude.hot; } catch (e) { chaud = null; }
  try {
    if (chaud && typeof chaud.snapshot === "function") {
      chaud.snapshot(function () { return { ui: { vue: ui.vue, onglet: ui.onglet, semaine: ui.semaine, etape: ui.etape, brouillon: ui.brouillon, mode: ui.mode, filtre: ui.filtre } }; });
    }
  } catch (e) { /* reprise d'écran indisponible */ }
  /* La page démarre toujours tout de suite. Si la plateforme transmet ensuite
     l'état d'écran d'une version précédente, il est appliqué à son arrivée. */
  demarrer((chaud && chaud.data) || {});
  try {
    if (chaud && typeof chaud.ready === "function") chaud.ready(function (r) { if (reprendre(r)) rendreSur(); });
  } catch (e) { /* reprise d'écran indisponible */ }
})();
