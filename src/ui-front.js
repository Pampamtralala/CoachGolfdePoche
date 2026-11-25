  /* ============================================================
     FRONT : écran « Aujourd'hui », sections repliées, aides repliées,
     détail des graphiques au toucher, avancement, tampon de réussite, gestes.
     ============================================================ */

  /* ---------- Icônes (trait, 24 px) ---------- */
  var ICONES = {
    jour: '<path d="M4 11.5 12 4l8 7.5"/><path d="M6.5 10v9.5h11V10"/><path d="M10 19.5v-5h4v5"/>',
    accueil: '<path d="M4 11.5 12 4l8 7.5"/><path d="M6.5 10v9.5h11V10"/><path d="M10 19.5v-5h4v5"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    carte: '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/>',
    position: '<circle cx="12" cy="12" r="3.5"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>',
    loupe: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>',
    drapeau: '<path d="M6 21V4"/><path d="M6 4.5h11l-2.5 3.75L17 12H6"/>',
    stats: '<path d="M4 20h16"/><path d="M7 16v-5M12 16V7M17 16v-8"/>',
    coche: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    retour: '<path d="M14.5 6 8.5 12l6 6"/>',
    medaille: '<circle cx="12" cy="14.5" r="5"/><path d="M8.5 10.5 6 3h4l2 5M15.5 10.5 18 3h-4l-2 5"/><path d="m12 12.3.8 1.5 1.7.3-1.2 1.2.3 1.7-1.6-.8-1.6.8.3-1.7-1.2-1.2 1.7-.3z"/>',
    sac: '<path d="M8 8.5h8l-1 12.5H9Z"/><path d="M7.2 8.5h9.6"/><path d="M10 8.5 8.5 3M12 8.5V2.5M14 8.5l1.6-5"/><path d="M15.4 11.5l2.6 1.4-1 5.6"/>',
    progres: '<path d="M4 20h16"/><path d="M5 16l4.5-5 3.5 3 6-7"/><path d="M15.5 7H19v3.5"/>',
    entrainement: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r=".9"/>',
    carnet: '<rect x="6.5" y="3" width="12.5" height="18" rx="2"/><path d="M4 7.5h3M4 12h3M4 16.5h3M10.5 8.5h5M10.5 12.5h5"/>',
    partie: '<path d="M8 21V3"/><path d="M8 4l10.5 3.6L8 11.2"/><path d="M4.5 21h8"/>',
    profil: '<circle cx="12" cy="8.2" r="3.7"/><path d="M4.8 20c1-4 4-6 7.2-6s6.2 2 7.2 6"/>',
    soleil: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3 7 7M17 17l1.7 1.7M18.7 5.3 17 7M7 17l-1.7 1.7"/>',
    lune: '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z"/>',
    vent: '<path d="M3 8.5h11a2.8 2.8 0 1 0-2.8-2.8"/><path d="M3 12.5h15.5a2.8 2.8 0 1 1-2.8 2.8"/><path d="M3 16.5h7"/>',
    chevron: '<path d="m9 5 7 7-7 7"/>'
  };
  function icone(nom) { return '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + ICONES[nom] + '</svg>'; }

  /* ---------- Mise en page large ---------- */
  var requeteLarge = null;
  try { requeteLarge = window.matchMedia("(min-width: 900px)"); } catch (e) { requeteLarge = null; }
  function estLarge() { return !!requeteLarge && requeteLarge.matches; }
  if (requeteLarge) {
    var surLargeur = function () { if (etat.profil && ui.vue !== "questionnaire") rendre(); };
    if (requeteLarge.addEventListener) requeteLarge.addEventListener("change", surLargeur);
    else if (requeteLarge.addListener) requeteLarge.addListener(surLargeur);
  }

  /* ---------- Sections repliées ----------
     Sur téléphone, chaque section du bilan se replie sous son titre. Sur grand écran,
     tout est ouvert et le bilan passe sur deux colonnes. */
  function pliHTML(id, titre, resume, corps, ordre) {
    var large = estLarge(), ouvert = large || !!ui.plis[id];
    return '<section class="bloc pli' + (ouvert ? " ouvert" : "") + '" id="' + id + '" style="order:' + ordre + '">' +
      (large ? '<h2>' + t(titre) + '</h2>'
        : '<h2 class="pli-h"><button class="pli-tete" type="button" data-a="pli" data-v="' + id + '" aria-expanded="' + ouvert + '" aria-controls="pli-' + id + '">' +
          '<span class="pli-titre">' + t(titre) + '</span>' + (resume ? '<span class="pli-resume">' + t(resume) + '</span>' : '') + '<span class="pli-chev" aria-hidden="true"></span></button></h2>') +
      '<div class="pli-corps" id="pli-' + id + '"' + (ouvert ? "" : " hidden") + '>' + corps + '</div></section>';
  }
  ACTIONS.pli = function (el) { var id = el.getAttribute("data-v"); ui.plis[id] = !ui.plis[id]; rendreEtFocus(el); };
  ACTIONS.sommaire = function (el) {
    var id = el.getAttribute("data-v");
    ui.plis[id] = true; rendre(); allerSection(id);
    var b = app.querySelector('[data-a="pli"][data-v="' + id + '"]'); if (b) b.focus({ preventScroll: true });
  };
  /* Aide repliée sous un intitulé. Le contenu est déjà du HTML sûr. */
  function comment(html, titre) { return '<details class="comment"><summary>' + (titre || "Comment ça marche") + '</summary><div>' + html + '</div></details>'; }

  /* ---------- Avancement de la semaine et du cycle ---------- */
  function seancesSemaine(w) {
    var l = etat.plan.semaines[w - 1].seances;
    return { total: l.length, faites: l.filter(function (se) { return !!etat.fait[se.id]; }).length };
  }
  function barreAvance(faites, total, lib, fine) {
    var seg = "";
    for (var i = 0; i < total; i++) seg += '<span' + (i < faites ? ' class="fait"' : '') + '></span>';
    return '<div class="avance' + (fine ? " fine" : "") + '" role="img" aria-label="' + at(lib) + '">' + seg + '</div>';
  }
  function avancementHTML(w) {
    var s = seancesSemaine(w), f = compteFaites(), tot = etat.plan.n * 4;
    var ls = "Semaine " + w + " : " + pluriel(s.faites, "séance") + " sur " + s.total, lc = "Cycle " + etat.plan.cycle + " : " + f + " sur " + tot;
    return '<div class="avancement"><p><b>' + t(ls) + '</b>' + (s.faites >= s.total ? ' <span class="tampon">bouclée ' + TRAIT + '</span>' : '') + '</p>' + barreAvance(s.faites, s.total, ls) +
      '<p class="aide">' + t(lc) + '</p>' + barreAvance(f, tot, lc, true) + '</div>';
  }

  /* ---------- Tampon de réussite ---------- */
  function feter(mot, titre, texte) {
    var el = document.getElementById("fete");
    el.innerHTML = '<button class="fete" type="button" data-a="fete-fermer"><span class="fete-tampon" aria-hidden="true">' + t(mot) + '</span><span class="fete-texte"><b>' + t(titre) + '</b>' + (texte ? '<span>' + t(texte) + '</span>' : '') + '</span></button>';
    el.hidden = false;
    clearTimeout(feter.t); feter.t = setTimeout(function () { el.hidden = true; el.innerHTML = ""; }, 3400);
  }
  ACTIONS["fete-fermer"] = function () { var el = document.getElementById("fete"); clearTimeout(feter.t); el.hidden = true; el.innerHTML = ""; };
  /* Après une case cochée dans le plan : séance, mission ou routine. */
  function feterFait(id) {
    var m = /^c\d+-(s|m|h)(\d)/.exec(id); if (!m) return;
    var w = parseInt(m[2], 10);
    if (m[1] === "m") { feter("fait", "Mission faite", "Sur le parcours, semaine " + w + "."); return; }
    if (m[1] === "h") { feter("fait", "Routine faite", "À la maison, semaine " + w + "."); return; }
    var s = seancesSemaine(w), f = compteFaites(), tot = etat.plan.n * 4;
    if (f >= tot) feter("cycle bouclé", "Toutes les séances du cycle sont faites", "Fais le bilan du cycle pour construire le suivant.");
    else if (s.faites >= s.total) feter("semaine bouclée", "Semaine " + w + " terminée", f + " séances sur " + tot + " dans ce cycle.");
    else feter("fait", "Séance faite", pluriel(s.faites, "séance") + " sur " + s.total + " cette semaine.");
  }
  /* Meilleur score d'un exercice noté, hors la dernière note. */
  function recordExo(e, v) {
    var hist = (etat.scores[e.id] || []).slice(0, -1);
    if (!hist.length) return false;
    return hist.every(function (x) { return e.score.sens === "bas" ? v < x.v : v > x.v; });
  }
  /* Meilleure partie de 18 trous : écart au par le plus bas, à partir de deux parties notées. */
  function recordPartie(pt) {
    var sc = scorePartie(pt);
    if (!sc.complet || sc.T !== 18) return false;
    var autres = partiesAnalyse().filter(function (x) { var s = scorePartie(x); return x !== pt && (!pt.id || x.id !== pt.id) && s.complet && s.T === 18; });
    return autres.length > 0 && autres.every(function (x) { return scorePartie(x).ecart > sc.ecart; });
  }

  /* ============================================================
     AUJOURD'HUI : ce qu'il y a à faire en ouvrant l'appli
     ============================================================ */
  function prochaineSeance() {
    var plan = etat.plan, w0 = semaineCourante(), ordre = [];
    for (var w = w0; w <= 4; w++) ordre.push(w);
    for (w = 1; w < w0; w++) ordre.push(w);
    for (var i = 0; i < ordre.length; i++) {
      var l = plan.semaines[ordre[i] - 1].seances;
      for (var j = 0; j < l.length; j++) if (!etat.fait[l[j].id]) return { w: ordre[i], se: l[j], retard: ordre[i] < w0 };
    }
    return null;
  }
  function defiDuJour() {
    var p = etat.profil, prios = etat.plan.priorites || [];
    var l = DEFIS.filter(function (d) { return etatDefi(d.id).niv < d.niveaux.length; });
    if (!l.length) l = DEFIS.slice();
    var ici = l.filter(function (d) { return p.lieux.indexOf(d.lieu) >= 0; });
    if (ici.length) l = ici;
    for (var i = 0; i < prios.length; i++) {
      var c = l.filter(function (d) { return d.d === prios[i]; })[0];
      if (c) return c;
    }
    return l[0];
  }
  function secteurPire(r) {
    var m = r ? r.secteurs.filter(function (x) { return x.sg != null; }).sort(function (x, y) { return x.sg - y.sg; })[0] : null;
    return m && m.sg <= -0.5 ? m : null;
  }

  /* Jauge circulaire de l'avancement du cycle. */
  function jaugeHTML(faites, total) {
    var r = 46, c = 2 * Math.PI * r, part = total ? faites / total : 0;
    return '<svg class="jauge-cycle" viewBox="0 0 120 120" aria-hidden="true">' +
      '<circle class="j-fond" cx="60" cy="60" r="' + r + '"/>' +
      (faites ? '<circle class="j-plein" cx="60" cy="60" r="' + r + '" style="stroke-dasharray:' + c.toFixed(1) + ';stroke-dashoffset:' + (c * (1 - part)).toFixed(1) + ';--c:' + c.toFixed(1) + '" transform="rotate(-90 60 60)"/>' : '') +
      '<text class="j-n" x="60" y="62" text-anchor="middle">' + faites + '</text><text class="j-sur" x="60" y="84" text-anchor="middle">sur ' + total + '</text></svg>';
  }

  /* ---------- Conditions du jour : noté par le joueur ----------
     La page ne peut lire ni la position du téléphone ni un service météo :
     le joueur note le vent et la température en deux touches. */
  var VENTS = [null, { nom: "Calme", aide: "moins de 10 km/h" }, { nom: "Modéré", aide: "10 à 25 km/h" }, { nom: "Fort", aide: "plus de 25 km/h" }];
  var TEMPS = [null, { nom: "Froid", aide: "moins de 10 °C" }, { nom: "Doux", aide: "10 à 25 °C" }, { nom: "Chaud", aide: "plus de 25 °C" }];
  function jourLocal() { var d = new Date(); return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
  function conditionsDuJour() { var c = etat.conditions; return c && c.d === jourLocal() && (c.vent || c.temp) ? c : null; }
  function conseilsConditions(c, pal) {
    var l = [];
    if (c.vent === 3) {
      l.push(pal <= 2 ? "Face au vent, prends un à deux clubs de plus et swingue à 80 % : frapper plus fort fait monter la balle."
        : "Joue des balles basses : balle reculée d'une largeur, mains en avant, finish court. Face au vent, compte deux clubs de plus.");
      l.push("Vent de côté : vise du côté d'où il vient et laisse la balle revenir.");
      l.push("Au putting, écarte un peu plus les pieds pour rester stable.");
    } else if (c.vent === 2) {
      l.push("Face au vent, un club de plus. Vent dans le dos, un club de moins.");
      l.push(pal <= 2 ? "Vent de côté : vise un peu du côté d'où il vient." : "Vent de côté : vise du côté d'où il vient plutôt que de travailler la balle contre lui.");
    } else if (c.vent === 1) {
      l.push("Pas de vent : joue tes distances habituelles. C'est le bon jour pour vérifier ton carnet de distances.");
    }
    if (c.temp === 1) l.push("Par temps froid, la balle porte moins loin : jusqu'à un club de plus sur les longs coups. Échauffe-toi plus longtemps.");
    if (c.temp === 3) l.push("Par temps chaud, la balle porte un peu plus loin. Bois régulièrement.");
    return l;
  }
  function conditionsHTML() {
    var c = conditionsDuJour() || { vent: 0, temp: 0 }, pal = palierDe(indexNiveau(etat.profil)), l = conseilsConditions(c, pal);
    function choix(k, liste) {
      return '<div class="choix-ligne">' + [1, 2, 3].map(function (v) {
        return '<button class="opt" type="button" data-a="cond" data-k="' + k + '" data-v="' + v + '" aria-pressed="' + (c[k] === v) + '">' + t(liste[v].nom) + '<small>' + t(liste[v].aide) + '</small></button>';
      }).join("") + '</div>';
    }
    return '<button class="voile" type="button" data-a="fermer-feuille" aria-label="Fermer" tabindex="-1"></button>' +
      '<section class="feuille" role="dialog" aria-modal="true" aria-labelledby="f-titre" id="feuille">' +
      '<header><p class="surtitre">' + t("Aujourd'hui · " + (new Date()).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })) + '</p><h2 id="f-titre">Conditions du jour</h2>' +
      '<button class="fermer" type="button" data-a="fermer-feuille" id="f-fermer">Fermer</button></header>' +
      '<fieldset class="champ"><legend>Vent</legend>' + choix("vent", VENTS) + '</fieldset>' +
      '<fieldset class="champ"><legend>Température</legend>' + choix("temp", TEMPS) + '</fieldset>' +
      (l.length ? '<h3>Pour tes trajectoires</h3><ul class="constats">' + l.map(function (x) { return '<li>' + t(x) + '</li>'; }).join("") + '</ul>' : '') +
      '<p class="aide">L’appli ne peut pas lire la météo ni ta position : note ce que tu observes au départ. Les prévisions sont sur <a href="https://meteofrance.com" target="_blank" rel="noopener">meteofrance.com</a>.</p></section>';
  }
  ACTIONS.cond = function (el) {
    var k = el.getAttribute("data-k"), v = parseInt(el.getAttribute("data-v"), 10);
    if ((k !== "vent" && k !== "temp") || !(v >= 1 && v <= 3)) return;
    var c = conditionsDuJour() || { d: jourLocal(), vent: 0, temp: 0 };
    c = { d: jourLocal(), vent: c.vent, temp: c.temp };
    c[k] = c[k] === v ? 0 : v;
    etat.conditions = c; sauver(); rendre(); rendreFeuille();
    var b = document.querySelector('#feuille [data-a="cond"][data-k="' + k + '"][data-v="' + v + '"]'); if (b) b.focus({ preventScroll: true });
  };
  ACTIONS["cond-ouvrir"] = function (el) {
    ui.retourFocus = el; ui.feuille = { conditions: true }; rendreFeuille();
    var b = document.getElementById("f-fermer"); if (b) b.focus();
  };

  /* ============================================================
     ACCUEIL : trois portes (le sac, le parcours, le practice), puis l'essentiel du jour
     ============================================================ */
  /* Accueil centré sur les données du joueur : le coaching est rangé dans Analyses. */
  VUES.accueil = function () {
    var p = etat.profil, pt = etat.partie, parties = etat.parties;
    var totalTrous = parties.reduce(function (n, x) { return n + (x.trous || []).length; }, 0);
    var nbCoups = parties.reduce(function (n, x) {
      return n + (x.coups || []).reduce(function (a, l) { return a + (l || []).length; }, 0);
    }, 0);
    var derniere = parties.length ? parties[parties.length - 1] : null;
    var h = '<section class="bloc premier mon-jeu"><p class="surtitre">Carnet golfique personnel</p><h1>' +
      t(p.prenom ? "Mon jeu · " + p.prenom : "Mon jeu") + '</h1>' +
      '<p class="chapo">Mieux connaître ton jeu pour mieux jouer. Chaque partie enrichit tes statistiques et tes distances.</p>' +
      '<div class="acces-rapides">' +
      '<button class="btn principal" type="button" data-a="' + (pt ? "pt-reprendre" : "partie-rapide") + '">' +
      icone("drapeau") + t(pt ? " Reprendre ma partie" : " Nouvelle partie") + '</button>' +
      '<button class="btn" type="button" data-a="serie-ouvrir">' + icone("sac") + ' Mesurer mes clubs</button>' +
      '<button class="btn" type="button" data-a="onglet" data-v="journal">Mes parties</button>' +
      '<button class="btn" type="button" data-a="onglet" data-v="sac">Mon sac</button></div>' +
      '<p class="aide">' + t(pluriel(parties.length, "partie") + " conservée" + (parties.length > 1 ? "s" : "") +
      " · " + totalTrous + " trous · " + nbCoups + " coups documentés") + '</p></section>';
    if (derniere) {
      var sc = scorePartie(derniere), st = statsTrous(derniere.trous);
      h += '<section class="bloc"><h2>Dernière partie</h2><button type="button" class="carte-tb lien-tb derniere" data-a="pt-carte" data-id="' + (parties.length - 1) + '">' +
        '<p class="surtitre">' + t(dateCourte(derniere.d)) + '</p><p class="tb-titre">' +
        t(sc.complet ? sc.coups + " coups · " + ecartLib(sc.ecart) : st.T + " trous saisis") +
        '</p><p class="tb-meta">' + t(st.G + " GIR · " + st.P + " putts · " + st.X + " pénalités") + '</p></button></section>';
    }
    /* P12 : poser une question à son carnet. */
    h += '<section class="bloc comprendre"><h2>Comprendre mon jeu</h2><p class="aide">' + t("Des réponses chiffrées, tirées de ton carnet.") + '</p><div class="an-raccourcis">' +
      ["score", "troisPutts", "cotes", "trous"].map(function (id) { var q = QUESTIONS_ANALYSTE.filter(function (x) { return x.id === id; })[0]; return '<button class="btn" type="button" data-a="an-ouvrir" data-v="' + id + '">' + t(q.q) + '</button>'; }).join("") +
      '<button class="lien" type="button" data-a="an-ouvrir">Toutes les questions</button></div></section>';
    h += '<section class="bloc"><h2>Mes tendances</h2>' + chiffresClesHTML() + '</section>' + qualiteGolfHTML();
    h += '<section class="bloc"><h2>À découvrir dans mes données</h2>' +
      '<p class="aide">Pour des distances fiables, mesure plusieurs balles par club. Les chiffres détaillés et leur historique sont disponibles dans Mon sac et Analyses.</p>' +
      '<div class="acces-rapides"><button class="btn" type="button" data-a="onglet" data-v="bilan">Toutes mes statistiques</button>' +
      '<button class="btn" type="button" data-a="onglet" data-v="practice">Coaching (facultatif)</button></div></section>';
    return h;
  };

  ACTIONS["voir-seance"] = function (el) {
    var w = parseInt(el.getAttribute("data-v"), 10), id = el.getAttribute("data-id");
    if (w >= 1 && w <= 4) ui.semaine = w;
    allerOnglet("practice", true); allerSection("seance-" + id);
  };
  /* Bouton « Partie » des onglets : reprend la partie en cours, ou en prépare une. */
  ACTIONS["partie-rapide"] = function () {
    if (!etat.profil || ui.vue === "questionnaire") return;
    if (etat.partie) { ACTIONS["pt-reprendre"](); return; }
    if (ui.feuille) { ui.feuille = null; ui.feuilleRetour = null; ui.retourFocus = null; rendreFeuille(); }
    allerOnglet("parcours", false);
    ACTIONS["dp-ouvrir"](); allerSection("c-partie");
  };

  /* ============================================================
     BILAN : la phrase d'ouverture
     ============================================================ */
  var SECTEUR_DE = { drive: "depart", fers: "attaque", wedge: "petit", approche: "petit", bunker: "petit", putt_court: "putting", putt_long: "putting", strategie: "penal" };
  function uneBilanHTML(prios, sc, pal) {
    var x = prios[0], cible = cibleCourante(), r = coupsGagnes(partiesAnalyse(), cible);
    var h = '<div class="une"><p class="surtitre">Ta priorité</p><p class="une-titre">' + t(DOM[x.d].nom) + '</p>';
    var v = sc[x.d].vals.filter(function (y) { return y.val != null && y.etat === "dessous"; })[0];
    if (v) h += '<p>' + t(v.ind.nom + " : " + v.val + " " + v.ind.unite + ", pour un repère de " + v.ind.rep[pal - 1] + " à ton palier.") + '</p>';
    if (r) {
      var sec = r.secteurs.filter(function (s) { return s.id === SECTEUR_DE[x.d]; })[0], pire = secteurPire(r);
      if (sec && sec.sg != null && sec.sg <= -0.5) h += '<p>' + t("En partie, ce secteur (" + sec.nom.toLowerCase() + ") te coûte environ " + nb1(sec.sg) + " coup" + (Math.abs(sec.sg) >= 2 ? "s" : "") + " par partie face à un index " + cible + ".") + '</p>';
      else if (sec && sec.sg != null) h += '<p>' + t("En partie, ce secteur (" + sec.nom.toLowerCase() + ") ne te coûte pas de coups face à un index " + cible + ".") + '</p>';
      if (pire && (!sec || pire.id !== sec.id) && (!sec || sec.sg == null || pire.sg <= sec.sg - 1)) {
        h += '<p>' + t("Tes parties désignent surtout un autre secteur : " + pire.nom.toLowerCase() + ", " + coupsLib(pire.sg, "perdu") + " par partie.") + '</p>';
      }
    } else {
      h += '<p class="aide">Saisis une partie pour chiffrer ce qu’elle te coûte.</p>';
    }
    return h + '<button class="btn principal large" type="button" data-a="onglet" data-v="practice">Voir mon plan</button></div>';
  }

  /* ============================================================
     GESTES : retour du téléphone, glissements
     ============================================================ */
  /* Ferme ce qui est au-dessus : dialogue, puis fiche, puis écran de partie. */
  function fermerDessus() {
    if (ui.menu) { ui.menu = false; }
    if (ui.dialogue) { ui.dialogue = null; rendreDialogue(); return true; }
    if (ui.feuille) { fermerFeuille(); return true; }
    if (ui.partie && ui.pvCoup) { ACTIONS["pv-coup-annuler"](); return true; }
    if (ui.partie && ui.pvPanneau) { ACTIONS[ui.pvPanneau === "strat" ? "sjc-ouvrir" : ui.pvPanneau === "carte" ? "carte-fermer" : "sjc-fermer"](); return true; }
    if (ui.partie && ui.pvLong) { ui.pvLong = false; rendrePartie(); focusPartie('[data-a="pv-long"]'); return true; }
    if (ui.partie) { ACTIONS[ui.partie === "bilan" || ui.partie === "express" ? "pt-bilan-fermer" : "pt-fermer"](); return true; }
    return false;
  }
  /* Touche retour : une entrée d'historique est ajoutée quand un calque s'ouvre,
     pour que « retour » ferme le calque au lieu de quitter l'appli. */
  var histo = { pousse: false };
  function synchroHisto() {
    if (histo.pousse || !(ui.dialogue || ui.feuille || ui.partie)) return;
    try { history.pushState({ couche: 1 }, ""); histo.pousse = true; } catch (e) { /* historique indisponible */ }
  }
  window.addEventListener("popstate", function () {
    if (!histo.pousse) return;
    histo.pousse = false;
    if (fermerDessus()) synchroHisto();
  });

  /* Glissements au doigt. */
  var geste = null;
  function debutGeste(ev) {
    var tc = ev.touches && ev.touches.length === 1 ? ev.touches[0] : null, c = ev.target;
    geste = null;
    if (!tc || !c.closest) return;
    if (c.closest('input, textarea, select, .defile')) return;
    var f = c.closest(".feuille");
    geste = { x: tc.clientX, y: tc.clientY, t: Date.now(), feuille: f && f.scrollTop <= 0 ? f : null, partie: !!c.closest(".partie") && ui.partie === "saisie", tire: false };
  }
  function suiteGeste(ev) {
    if (!geste || !geste.feuille || !ev.touches[0]) return;
    var dy = ev.touches[0].clientY - geste.y, dx = ev.touches[0].clientX - geste.x;
    if (!geste.tire && dy > 14 && dy > Math.abs(dx) * 1.5) geste.tire = true;
    if (geste.tire) { geste.feuille.style.transition = "none"; geste.feuille.style.transform = "translateY(" + Math.max(0, dy) + "px)"; }
  }
  function finGeste(ev) {
    var g = geste; geste = null;
    if (!g || !ev.changedTouches[0]) return;
    var dx = ev.changedTouches[0].clientX - g.x, dy = ev.changedTouches[0].clientY - g.y;
    if (g.feuille && g.tire) {
      /* Fiche tirée vers le bas : elle se ferme au-delà de 110 px, sinon elle revient. */
      if (dy > 110 && ui.feuille) { fermerFeuille(); return; }
      g.feuille.style.transition = "transform .18s ease-out"; g.feuille.style.transform = "";
      return;
    }
    /* Partie : glisser vers la gauche valide le trou, vers la droite revient au précédent. */
    if (g.partie && etat.partie && Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 2.5 && Date.now() - g.t < 700) {
      if (dx < 0) { if (etat.partie.i < etat.partie.n - 1) ACTIONS["pt-suiv"](); }
      else ACTIONS["pt-prec"]();
    }
  }
  try {
    document.addEventListener("touchstart", debutGeste, { passive: true });
    document.addEventListener("touchmove", suiteGeste, { passive: true });
    document.addEventListener("touchend", finGeste, { passive: true });
    document.addEventListener("touchcancel", function () { if (geste && geste.feuille) { geste.feuille.style.transform = ""; } geste = null; }, { passive: true });
  } catch (e) { /* gestes indisponibles */ }
