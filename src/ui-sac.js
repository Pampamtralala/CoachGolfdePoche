  /* ============================================================
     SAC DE GOLF VIRTUEL : composition du sac, distance moyenne par club, étagement.
     Le sac remplace l'ancien formulaire de saisie du carnet de distances.
     Données : etat.carnet.sac (identifiants des clubs du sac, ou null pour le sac par défaut)
     et etat.carnet.clubs (mesures en mètres par club, inchangé).
     ============================================================ */
  var SAC_DEFAUT = ["dr", "b3", "b5", "f4", "f5", "f6", "f7", "f8", "f9", "pw", "sw"];
  var MESURES_MAX = 30; /* balles gardées par club : assez pour mesurer une dispersion */
  var SAC_MAX = 13; /* 14 clubs au plus selon la règle, putter compris */
  var SAC_COURT = { dr: "Dr", b3: "B3", b5: "B5", b7: "B7", h3: "H3", h4: "H4", h5: "H5", f3: "3", f4: "4", f5: "5", f6: "6", f7: "7", f8: "8", f9: "9", pw: "PW", gw: "GW", sw: "SW", lw: "LW" };
  var SAC_FAMILLES = { b: "Bois et hybrides", f: "Fers", w: "Wedges" };
  var SAC_STATUT = { ok: "Écart idéal", trou: "Trou de distance", doublon: "Redondance", inverse: "Ordre inversé" };

  /* Wedges ajoutés et lofts précisés : la liste des clubs suit l'état. */
  function majWedges() { definirWedges(etat.carnet.wedgesPerso, etat.carnet.lofts); }
  /* Nom court gravé sur la tête et repris dans les listes : « PW », « 54° »… */
  function courtSac(c) { return SAC_COURT[c.id] || c.court; }
  /* Libellé d'un wedge avec son loft quand il est connu : « Sand wedge · 56° », « Wedge 54° ». */
  function nomLoft(c) { return c.nom.split(",")[0] + (c.fam === "w" && c.loftPrecise && !c.perso ? " · " + c.loft + "°" : ""); }

  /* Clubs du sac, du plus long au plus court. */
  function sacActuel() {
    if (etat.carnet.sac) return etat.carnet.sac.slice();
    return CLUBS.filter(function (c) { return SAC_DEFAUT.indexOf(c.id) >= 0 || etat.carnet.clubs[c.id]; }).map(function (c) { return c.id; }).slice(0, SAC_MAX);
  }
  /* Clubs proposés pendant la partie : le sac composé ; sinon les clubs déjà mesurés (au moins trois) ; sinon le sac type. */
  function sacJeu() {
    if (etat.carnet.sac) return etat.carnet.sac.slice();
    var m = mesuresTout(), mes = CLUBS.filter(function (c) { return m[c.id] && m[c.id].length; }).map(function (c) { return c.id; });
    return mes.length >= 3 ? mes.slice(0, SAC_MAX) : sacActuel();
  }
  function sacCompose() { return !!etat.carnet.sac; }
  function fixerSac(ids) {
    etat.carnet.sac = CLUBS.filter(function (c) { return ids.indexOf(c.id) >= 0; }).map(function (c) { return c.id; }).slice(0, SAC_MAX);
  }
  /* Coups mesurés sur le parcours (parties notées et partie en cours). */
  function coupsDuParcours() { return mesuresParcours(etat.partie ? etat.parties.concat([etat.partie]) : etat.parties); }
  /* Mesures du practice et du parcours réunies : la base des distances du sac. */
  function mesuresTout() { return fusionMesures(etat.carnet.clubs, coupsDuParcours().clubs); }
  /* Matrice de wedges : cases saisies, complétées par les coups du parcours. */
  function wedgesTout() { return fusionWedges(etat.carnet.wedges, coupsDuParcours().wedges); }
  /* Mesures, avec la distance en cours de saisie dans la fiche (aperçu en direct). */
  function clubsVus() {
    var src = mesuresTout(), ap = ui.sacApercu, out = {};
    Object.keys(src).forEach(function (k) { out[k] = src[k]; });
    if (ap) { if (ap.v == null) delete out[ap.id]; else out[ap.id] = [ap.v]; }
    return out;
  }
  function analyseSac() { return analyseCarnet(clubsVus(), sacActuel()); }
  function moyenneClub(clubs, id) { var s = statsClub(clubs[id]); return s ? s.moy : null; }
  function sacParfait(an) { return an.paires.length >= 5 && an.ok === an.paires.length; }

  /* ---------- Textes d'alerte ---------- */
  function phraseSac(x, club) {
    var autre = x.a.id === club.id ? x.b : x.a;
    if (x.type === "trou") return x.ecart + " m d'écart avec " + leClub(autre) + " : il manque un club ou un coup intermédiaire.";
    if (x.type === "doublon") return x.ecart + " m seulement d'écart avec " + leClub(autre) + " : ces deux clubs font presque le même travail.";
    return majuscule(leClub(club)) + " et " + leClub(autre) + " sont dans le mauvais ordre de distance : vérifie tes mesures.";
  }
  function alertesDe(an, id) { return an.alertes.filter(function (x) { return x.a.id === id || x.b.id === id; }); }

  /* ---------- Le sac en perspective ---------- */
  function nomCourt(c) { return c.nom.split(",")[0]; }
  /* Les clubs du sac, décrits pour la scène : type de tête, numéro, distance, alerte. */
  function clubsScene(an, mini) {
    var clubs = clubsVus(), sel = ui.sacSel;
    var l = sacActuel().map(function (id) {
      var c = CLUB[id], v = moyenneClub(clubs, id), al = alertesDe(an, id);
      var type = /^(dr|b\d)$/.test(id) ? "bois" : id.charAt(0) === "h" ? "hybride" : c.fam === "f" ? "fer" : "wedge";
      var nm = id === "dr" ? 1 : parseInt(id.slice(1), 10) || 0;
      var court = type === "bois" ? String(nm) : type === "hybride" ? "H" + nm : type === "fer" ? String(nm) : c.perso ? String(c.loft) : SAC_COURT[id];
      var lib = nomCourt(c) + " : " + (v != null ? v + " mètres" : "distance à saisir") +
        (al.length ? ". Attention : " + al.map(function (x) { return phraseSac(x, c); }).join(" ") : "") +
        (sel === id ? ". Touche encore pour modifier la distance." : ".");
      var fo = v != null ? fourchette(clubs[id]) : null, plage = fo && fo.bas !== fo.haut && !(ui.sacApercu && ui.sacApercu.id === id) ? fo.bas + "–" + fo.haut : null;
      if (plage) lib = lib.replace(v + " mètres", "de " + fo.bas + " à " + fo.haut + " mètres");
      return { id: id, nom: nomCourt(c), court: court, type: type, n: nm, distance: v, plage: plage, vide: v == null, alerte: !!al.length, titre: lib, attrs: 'data-a="sac-club" data-id="' + id + '"' };
    });
    l.push({ id: "putter", nom: "Putter", court: "", type: "putter", distance: null, titre: "Putter : hors étagement des distances.", attrs: 'data-a="sac-club" data-id="putter"' });
    return mini ? l.map(function (c) { c.attrs = ""; return c; }) : l;
  }
  function sacScene(an) {
    return Sac3D.scene(clubsScene(an), { pre: "s3", sel: ui.sacSel, fond: 'data-a="sac-vide"' });
  }
  /* Vignette de l'accueil : le même sac, sans bouton. */
  function sacMiniHTML() {
    return Sac3D.scene(clubsScene(analyseCarnet(mesuresTout(), sacActuel()), true), { pre: "s3m", mini: true });
  }
  /* Carte sous le sac : le club sorti, sa distance, ses voisins. */
  function sacInfoHTML() {
    var id = ui.sacSel;
    if (!id) return '<p class="sac-info-vide">' + t("Touche un club : il sort du sac et affiche sa distance.") + '</p>';
    if (id === "putter") return '<p class="surtitre">Putter</p><p class="sac-info-txt">' + t("Le putter ne compte pas dans l'étagement des distances. Ton putting se suit dans le Bilan, avec les coups gagnés.") + '</p>';
    var c = CLUB[id], s = statsClub(clubsVus()[id]), fo = s ? fourchette(clubsVus()[id]) : null, plage = fo && fo.bas !== fo.haut;
    return '<div class="sac-info-tete"><div><p class="surtitre">' + t(SAC_FAMILLES[c.fam]) + '</p><h3>' + t(nomCourt(c)) + '</h3></div>' +
      '<p class="sac-info-dist">' + (s ? '<b class="main">' + (plage ? fo.bas + '–' + fo.haut : s.moy) + '</b><span>m</span>' : '<b class="main vide">?</b>') + '</p></div>' +
      (s ? '<p class="aide">' + t(plage ? "Fourchette jouable" + (fo.provisoire ? " provisoire" : "") + " : la moitié de tes coups pleins y tombe. Distance habituelle " + fo.med + " m" + (fo.p10 ? ", fiable à 90 % : " + fo.p10 + " m" : "") + "." + (fo.ecartes ? " " + pluriel(fo.ecartes, "coup raté") + " écarté" + (fo.ecartes > 1 ? "s" : "") + "." : "")
        : s.n > 1 ? "Moyenne de " + pluriel(s.n, "mesure") + "." : "Distance moyenne de vol.") + '</p>' : '') +
      '<ul class="sac-voisins">' + sacVoisinsHTML(id) + '</ul>' +
      '<button class="btn principal large" type="button" data-a="sac-modifier">' + (s ? "Modifier la distance" : "Saisir la distance") + '</button>';
  }

  /* Dans la liste des écarts, un fer garde son nom (« Fer 4 ») : le chiffre seul ne se lit que dans le sac. */
  function nomEcart(c) { return c.fam === "f" ? c.nom : courtSac(c); }
  /* Petite échelle de 0 à 30 m : zone idéale et position de l'écart. */
  function miniEcart(p) {
    function X(v) { return 4 + Math.max(0, Math.min(30, v)) / 30 * 80; }
    return '<svg class="sac-mini" viewBox="0 0 88 14" aria-hidden="true"><rect class="m-axe" x="4" y="6" width="80" height="2" rx="1"/>' +
      '<rect class="m-cible" x="' + X(SAC_ECART.min) + '" y="3" width="' + (X(p.max) - X(SAC_ECART.min)) + '" height="8" rx="4"/>' +
      '<circle class="m-point" cx="' + X(p.ecart) + '" cy="7" r="4.5"/></svg>';
  }
  function sacBilanHTML(an) {
    var P = an.paires;
    if (!P.length) return '<p class="aide">' + t("Saisis deux clubs voisins pour voir l'écart qui les sépare. Visé : " + SAC_ECART.min + " à " + SAC_ECART.max + " m.") + '</p>';
    var pc = Math.round(100 * an.ok / P.length), n = {};
    an.alertes.forEach(function (x) { n[x.type] = (n[x.type] || 0) + 1; });
    var resume = [n.trou ? pluriel(n.trou, "trou") : "", n.doublon ? pluriel(n.doublon, "redondance") : "", n.inverse ? n.inverse + (n.inverse > 1 ? " ordres inversés" : " ordre inversé") : ""].filter(Boolean).join(", ");
    return '<p class="sac-score"><b class="main">' + an.ok + '/' + P.length + '</b><span>' + t("écarts dans la zone idéale" + (resume ? " · " + resume : "")) + '</span></p>' +
      '<div class="sac-jauge" aria-hidden="true"><span style="width:' + pc + '%"></span></div>' +
      (sacParfait(an) ? '<p class="sac-parfait">Sac parfaitement étagé</p>' : '') +
      '<ol class="sac-ecarts">' + P.map(function (p) {
        return '<li class="e-' + p.statut + '"><span class="sac-paire">' + nomEcart(p.a) + ' → ' + nomEcart(p.b) + '<small>' + SAC_STATUT[p.statut] + '</small></span>' +
          miniEcart(p) + '<span class="sac-val main">' + p.ecart + ' m</span></li>';
      }).join("") + '</ol>' +
      '<p class="aide">' + t("Zone idéale : " + SAC_ECART.min + " à " + SAC_ECART.max + " m entre deux clubs voisins, jusqu'à " + SAC_ECART.maxBois + " m entre deux bois.") + '</p>';
  }
  /* Carte complète du sac, placée en tête de la page Mon sac. */
  function sacHTML() {
    var an = analyseSac(), nb = sacActuel().length;
    return '<div class="sac-carte">' +
      '<div class="sac-scene" id="sac-scene">' + sacScene(an) + '</div>' +
      '<div class="sac-info" id="sac-info" aria-live="polite">' + sacInfoHTML() + '</div>' +
      '<div class="sac-pied"><span>' + t(pluriel(nb, "club") + " + putter") + '</span><button class="btn" type="button" data-a="sac-composer" data-id="sac">Composer mon sac</button></div></div>' +
      '<div class="sac-bilan" id="sac-bilan"><h3>Écarts entre clubs voisins</h3>' + sacBilanHTML(an) + '</div>';
  }
  /* Mise à jour du sac et de sa carte, pendant la saisie dans la fiche. */
  function majSacDirect() {
    var sc = document.getElementById("sac-scene"); if (sc) sc.innerHTML = sacScene(analyseSac());
    var inf = document.getElementById("sac-info"); if (inf) inf.innerHTML = sacInfoHTML();
  }

  /* ---------- Fiche d'un club ---------- */
  function sacVoisinsHTML(id) {
    var an = analyseSac(), clubs = clubsVus();
    var l = an.paires.filter(function (p) { return p.a.id === id || p.b.id === id; });
    if (!l.length) return '<li>' + t("Saisis aussi un club voisin pour juger l'écart.") + '</li>';
    return l.map(function (p) {
      var autre = p.a.id === id ? p.b : p.a;
      return '<li class="' + (p.statut === "ok" ? "" : "alerte") + '"><span>' + t(autre.nom.split(",")[0] + " · " + moyenneClub(clubs, autre.id) + " m") + '</span><span>' + t(Math.abs(p.ecart) + " m · " + SAC_STATUT[p.statut].toLowerCase()) + '</span></li>';
    }).join("");
  }
  /* Valeur proposée pour un club sans mesure : le milieu entre ses voisins mesurés. */
  function sacEstimation(id) {
    var ids = sacActuel(), i = ids.indexOf(id), cl = mesuresTout(), av = null, ap = null, k;
    for (k = i - 1; k >= 0 && av == null; k--) av = moyenneClub(cl, ids[k]);
    for (k = i + 1; k < ids.length && ap == null; k++) ap = moyenneClub(cl, ids[k]);
    if (av != null && ap != null) return Math.round((av + ap) / 2);
    if (av != null) return av - 12;
    if (ap != null) return ap + 12;
    return null;
  }
  function sacFeuilleHTML(id) {
    var tete = '<button class="voile" type="button" data-a="fermer-feuille" aria-label="Fermer" tabindex="-1"></button>' +
      '<section class="feuille sac-fiche" role="dialog" aria-modal="true" aria-labelledby="f-titre" id="feuille">';
    function entete(sur, titre) { return '<header><p class="surtitre">' + t(sur) + '</p><h2 id="f-titre">' + t(titre) + '</h2><button class="fermer" type="button" data-a="fermer-feuille" id="f-fermer">Fermer</button></header>'; }
    if (id === "putter") {
      return tete + entete("Putter", "Putter") + '<p>' + t("Le putter ne compte pas dans l'étagement des distances. Ton putting se suit dans le Bilan, avec les coups gagnés.") + '</p></section>';
    }
    var c = CLUB[id], mes = etat.carnet.clubs[id] || [], parc = coupsDuParcours().clubs[id] || [], tout = mes.concat(parc);
    var s = statsClub(tout), an = analyseCarnet(mesuresTout(), sacActuel());
    var depart = s ? s.moy : sacEstimation(id), al = alertesDe(an, id);
    var h = tete + entete(SAC_FAMILLES[c.fam] + " · dans ton sac", nomLoft(c));
    if (c.fam === "w") {
      h += '<form class="sac-loft" data-f="sac-loft-club" novalidate><label for="sac-loft-club">Loft</label>' +
        '<span class="sac-loft-champ"><input id="sac-loft-club" type="text" inputmode="numeric" autocomplete="off" maxlength="2" value="' + (c.loftPrecise ? c.loft : "") + '" placeholder="' + c.loft + '" aria-describedby="sac-loft-aide"><span aria-hidden="true">°</span></span>' +
        '<button class="btn" type="submit">Enregistrer le loft</button></form>' +
        '<p class="aide" id="sac-loft-aide">' + t(c.loftPrecise ? "Le loft range tes wedges du plus fermé au plus ouvert." : "Loft habituel : " + c.petitBase + ". Précise le tien pour ranger tes wedges.") + '</p>' +
        '<p class="erreur" id="sac-loft-err" role="alert" hidden></p>';
    }
    if (al.length) h += '<ul class="constats">' + al.map(function (x) { return '<li class="alerte">' + t(phraseSac(x, c)) + '</li>'; }).join("") + '</ul>';
    h += '<form class="sac-saisie" data-f="sac-dist" novalidate>' +
      '<label for="sac-val">Distance moyenne de vol, en mètres</label>' +
      '<div class="sac-reglage"><button class="pm" type="button" data-a="sac-pas" data-v="-1" aria-label="Un mètre de moins">−</button>' +
      '<input id="sac-val" type="text" inputmode="numeric" autocomplete="off" maxlength="3" data-i="sac-val" value="' + (depart != null ? depart : "") + '" aria-describedby="sac-voisins">' +
      '<button class="pm" type="button" data-a="sac-pas" data-v="1" aria-label="Un mètre de plus">+</button></div>' +
      '<ul class="sac-voisins" id="sac-voisins" aria-live="polite">' + sacVoisinsHTML(id) + '</ul>' +
      '<p class="erreur" id="sac-err" role="alert" hidden></p>' +
      (s && s.n > 1 ? '<p class="aide">' + t("Moyenne de " + pluriel(s.n, "mesure") + (parc.length ? " dont " + parc.length + " sur le parcours" : "") + ", de " + s.min + " à " + s.max + " m." + (mes.length > 1 ? " Enregistrer une autre moyenne remplace les mesures du practice." : "")) + '</p>' : '') +
      '<button class="btn principal large" type="submit">Enregistrer</button></form>';
    h += ellipseClubHTML(id) || dispersionClubHTML(tout);
    if (parc.length) h += '<p class="sac-parcours">' + t("Sur le parcours : " + parc.slice(-8).join(", ") + " m" + (parc.length > 8 ? " (" + parc.length + " coups)" : "") + ".") + '</p>';
    h += '<p class="sac-serie"><button class="btn large" type="button" data-a="serie-ouvrir" data-id="' + id + '">Faire une série de balles avec ce club</button></p>';
    h += '<details class="sac-balles"' + (s && s.n > 1 || ui.sacBalles ? " open" : "") + '><summary>Mesurer balle par balle</summary>' +
      '<p class="aide">' + t("Au practice, saisis chaque balle. À partir de cinq, la moyenne écarte la plus longue et la plus courte.") + '</p>' +
      (mes.length ? '<ul class="releves">' + mes.map(function (v, i) { return '<li><button class="puce neutre" type="button" data-a="sac-balle-suppr" data-v="' + i + '" aria-label="' + at("Retirer la balle de " + v + " m") + '">' + v + ' m <span aria-hidden="true">×</span></button></li>'; }).join("") + '</ul>' : '') +
      '<form class="sac-balle" data-f="sac-balle" novalidate><label class="vh" for="sac-balle">Distance d’une balle, en mètres</label>' +
      '<input id="sac-balle" type="text" inputmode="numeric" autocomplete="off" maxlength="3" placeholder="m"><button class="btn" type="submit">Ajouter la balle</button></form>' +
      '<p class="erreur" id="sac-balle-err" role="alert" hidden></p></details>';
    h += '<div class="ligne-btn sac-actions">' + (mes.length ? '<button class="btn" type="button" data-a="sac-effacer">Effacer les mesures du practice</button>' : '') +
      '<button class="btn danger" type="button" data-a="sac-retirer">Retirer du sac</button></div>';
    return h + '</section>';
  }

  /* ---------- Fiche de composition du sac ---------- */
  function sacComposerHTML() {
    var ids = sacActuel(), plein = ids.length >= SAC_MAX, tout = mesuresTout();
    var h = '<button class="voile" type="button" data-a="fermer-feuille" aria-label="Fermer" tabindex="-1"></button>' +
      '<section class="feuille" role="dialog" aria-modal="true" aria-labelledby="f-titre" id="feuille">' +
      '<header><p class="surtitre">' + t(pluriel(ids.length, "club") + " et le putter, " + (SAC_MAX + 1) + " au plus") + '</p><h2 id="f-titre">Composer mon sac</h2>' +
      '<button class="fermer" type="button" data-a="fermer-feuille" id="f-fermer">Fermer</button></header>' +
      '<p class="aide">' + t("Touche un club pour le mettre dans le sac ou l'en sortir. Ses mesures sont gardées.") + '</p>';
    ["b", "f", "w"].forEach(function (fam) {
      h += '<fieldset class="champ"><legend>' + t(SAC_FAMILLES[fam]) + '</legend><div class="choix-ligne">' +
        CLUBS.filter(function (c) { return c.fam === fam; }).map(function (c) {
          var dedans = ids.indexOf(c.id) >= 0, m = moyenneClub(tout, c.id);
          var sous = [c.fam === "w" && !c.perso ? (c.loftPrecise ? c.loft + "°" : c.petitBase) : "", m != null ? m + " m" : ""].filter(Boolean).join(" · ");
          return '<button class="opt" type="button" data-a="sac-basculer" data-id="' + c.id + '" aria-pressed="' + dedans + '"' + (!dedans && plein ? " disabled" : "") + '>' + t(c.nom.split(",")[0]) + (sous ? '<small>' + t(sous) + '</small>' : '') + '</button>';
        }).join("") + '</div></fieldset>';
      if (fam === "w") h += ajoutWedgeHTML(plein);
    });
    if (plein) h += '<p class="aide sac-plein">' + t("Ton sac est plein : sors un club pour en mettre un autre ou ajouter un wedge.") + '</p>';
    return h + '</section>';
  }

  /* Ajouter un wedge désigné par son loft : lofts courants en un toucher, ou loft libre. */
  var LOFTS_COURANTS = [48, 50, 52, 54, 56, 58, 60, 62];
  function ajoutWedgeHTML(plein) {
    var sac = sacActuel(), libres = LOFTS_COURANTS.filter(function (l) { return !wedgeAuLoft(l, null, sac); });
    if (plein) return '';
    return '<div class="sac-ajout-wedge"><p class="sac-ajout-titre">Ajouter un wedge</p>' +
      (libres.length ? '<p class="aide">Lofts courants</p><div class="choix-ligne lofts">' + libres.map(function (l) {
        return '<button class="opt" type="button" data-a="sac-wedge-ajout" data-v="' + l + '" aria-label="' + at("Ajouter un wedge de " + l + " degrés") + '">' + l + '°</button>';
      }).join("") + '</div>' : '') +
      '<form class="sac-loft" data-f="sac-wedge" novalidate><label for="sac-loft-neuf">Autre loft</label>' +
      '<span class="sac-loft-champ"><input id="sac-loft-neuf" type="text" inputmode="numeric" autocomplete="off" maxlength="2" placeholder="64"><span aria-hidden="true">°</span></span>' +
      '<button class="btn" type="submit">Ajouter</button></form>' +
      '<p class="erreur" id="sac-wedge-err" role="alert" hidden></p></div>';
  }
  function lireLoft(champ) {
    var brut = champ ? champ.value.trim().replace(/°$/, "") : "";
    return /^\d{2}$/.test(brut) && +brut >= LOFT_MIN && +brut <= LOFT_MAX ? parseInt(brut, 10) : NaN;
  }
  /* Crée le wedge, le met dans le sac s'il reste de la place, et garde la fiche ouverte. */
  function ajouterWedge(l, errId, focusSel) {
    var err = document.getElementById(errId), deja = wedgeAuLoft(l, null, sacActuel());
    if (deja) { if (err) { err.textContent = "Tu as déjà un wedge à " + l + "° : le " + deja.nom.split(",")[0].toLowerCase() + "."; err.hidden = false; } return false; }
    var ids = sacActuel();
    if (ids.length >= SAC_MAX) { if (err) { err.textContent = "Ton sac est plein : sors un club pour ajouter un wedge."; err.hidden = false; } return false; }
    etat.carnet.wedgesPerso = etat.carnet.wedgesPerso.concat([l]).sort(function (x, y) { return x - y; }).slice(0, 8);
    majWedges();
    var id = "w" + l;
    fixerSac(ids.concat([id]));
    sauver(); rendre(); rendreFeuille();
    message("Wedge " + l + "° ajouté au sac.");
    var b = document.querySelector('#feuille [data-a="sac-basculer"][data-id="' + id + '"]') || document.querySelector(focusSel);
    if (b) b.focus({ preventScroll: true });
    return true;
  }
  ACTIONS["sac-wedge-ajout"] = function (el) {
    var l = parseInt(el.getAttribute("data-v"), 10);
    if (loftValide(l)) ajouterWedge(l, "sac-wedge-err", "#sac-loft-neuf");
  };
  FORMULAIRES["sac-wedge"] = function (form) {
    var champ = form.querySelector("#sac-loft-neuf"), l = lireLoft(champ), err = document.getElementById("sac-wedge-err");
    if (isNaN(l)) { err.textContent = "Entre un loft en degrés, entre " + LOFT_MIN + " et " + LOFT_MAX + "."; err.hidden = false; champ.focus(); return; }
    if (!ajouterWedge(l, "sac-wedge-err", "#sac-loft-neuf")) champ.focus();
  };
  /* Changer le loft d'un wedge. Un wedge ajouté change d'identifiant : ses mesures le suivent. */
  FORMULAIRES["sac-loft-club"] = function (form) {
    var id = ui.feuille && ui.feuille.sac, c = CLUB[id]; if (!c || c.fam !== "w") return;
    var champ = form.querySelector("#sac-loft-club"), l = lireLoft(champ), err = document.getElementById("sac-loft-err");
    if (isNaN(l)) { err.textContent = "Entre un loft en degrés, entre " + LOFT_MIN + " et " + LOFT_MAX + "."; err.hidden = false; champ.focus(); return; }
    var deja = wedgeAuLoft(l, id, sacActuel());
    if (deja) { err.textContent = "Tu as déjà un wedge à " + l + "° : le " + deja.nom.split(",")[0].toLowerCase() + "."; err.hidden = false; champ.focus(); return; }
    var neuf = id;
    if (c.perso) {
      neuf = "w" + l;
      if (neuf !== id) {
        var cb = etat.carnet;
        cb.wedgesPerso = cb.wedgesPerso.filter(function (v) { return v !== c.loft; }).concat([l]).sort(function (x, y) { return x - y; });
        if (cb.clubs[id]) { cb.clubs[neuf] = cb.clubs[id]; delete cb.clubs[id]; }
        if (cb.wedges[id]) { cb.wedges[neuf] = cb.wedges[id]; delete cb.wedges[id]; }
        var ids = sacActuel().map(function (k) { return k === id ? neuf : k; });
        majWedges(); fixerSac(ids);
        if (ui.sacSel === id) ui.sacSel = neuf;
        if (ui.club === id) ui.club = neuf;
        ui.feuille.sac = neuf;
      }
    } else etat.carnet.lofts[id] = l;
    majWedges(); sauver(); rendre(); rendreFeuille();
    message(nomLoft(CLUB[neuf]) + " : loft enregistré.");
    var ch = document.getElementById("sac-loft-club"); if (ch) ch.focus({ preventScroll: true });
  };

  /* ---------- Actions ---------- */
  function ouvrirSac(f, el) {
    ui.retourFocus = el; ui.sacApercu = null; ui.sacBalles = false; ui.feuille = f; ui.feuilleVue = false; rendreFeuille();
    if (f.sac && f.sac !== "putter") { var inp = document.getElementById("sac-val"); if (inp) { inp.focus(); inp.select(); } }
    else { var b = document.getElementById("f-fermer"); if (b) b.focus(); }
    majSacDirect();
  }
  /* Premier toucher : le club sort du sac et montre sa distance. Second toucher : la fiche de saisie. */
  ACTIONS["sac-club"] = function (el) {
    var id = el.getAttribute("data-id");
    if (id !== "putter" && !CLUB[id]) return;
    if (ui.sacSel === id && id !== "putter") { ouvrirSac({ sac: id }, el); return; }
    ui.sacSel = id; if (id !== "putter") ui.club = id;
    var sc = document.getElementById("sac-scene");
    if (sc) {
      Sac3D.choisir(sc, id);
      var an = analyseSac();
      clubsScene(an).forEach(function (c) { var b = sc.querySelector('[data-id="' + c.id + '"]'); if (b) b.setAttribute("aria-label", c.titre); });
      var inf = document.getElementById("sac-info"); if (inf) inf.innerHTML = sacInfoHTML();
    } else rendre();
  };
  ACTIONS["sac-vide"] = function () {
    if (!ui.sacSel) return;
    ui.sacSel = null;
    var sc = document.getElementById("sac-scene"); if (sc) Sac3D.choisir(sc, null);
    var inf = document.getElementById("sac-info"); if (inf) inf.innerHTML = sacInfoHTML();
  };
  ACTIONS["sac-modifier"] = function (el) {
    var id = ui.sacSel; if (!id || !CLUB[id]) return;
    ouvrirSac({ sac: id }, app.querySelector('[data-a="sac-club"][data-id="' + id + '"]') || el);
  };
  ACTIONS["sac-composer"] = function (el) { ouvrirSac({ sacComposer: true }, el); };
  function lireSacVal() {
    var inp = document.getElementById("sac-val"), brut = inp ? inp.value.trim() : "";
    if (brut === "") return null;
    return /^\d+$/.test(brut) && +brut >= 10 && +brut <= 400 ? parseInt(brut, 10) : NaN;
  }
  /* Aperçu en direct : le sac et les écarts voisins suivent la saisie, sans rien enregistrer. */
  function apercuSac() {
    var id = ui.feuille && ui.feuille.sac; if (!id || !CLUB[id]) return;
    var v = lireSacVal();
    ui.sacApercu = v == null || isNaN(v) ? null : { id: id, v: v };
    var vs = document.getElementById("sac-voisins"); if (vs) vs.innerHTML = sacVoisinsHTML(id);
    var err = document.getElementById("sac-err"); if (err) err.hidden = true;
    majSacDirect();
  }
  SAISIES["sac-val"] = apercuSac;
  ACTIONS["sac-pas"] = function (el) {
    var id = ui.feuille && ui.feuille.sac, inp = document.getElementById("sac-val"); if (!id || !inp) return;
    var v = lireSacVal(), base = typeof v === "number" && !isNaN(v) ? v : (sacEstimation(id) || 100);
    inp.value = String(Math.max(10, Math.min(400, base + parseInt(el.getAttribute("data-v"), 10))));
    apercuSac();
  };
  /* Après un enregistrement : fiche fermée, sac redessiné, fête si le sac devient parfaitement étagé. */
  function apresSac(id, avant, texte) {
    sauver();
    var apres = analyseCarnet(mesuresTout(), sacActuel());
    ui.sacApercu = null; ui.feuille = null; ui.feuilleVue = false; rendreFeuille(); rendre();
    var b = app.querySelector('[data-a="sac-club"][data-id="' + id + '"]'); if (b) b.focus({ preventScroll: true });
    ui.retourFocus = null;
    if (sacParfait(apres) && !sacParfait(avant)) feter("sac étagé", "Ton sac est parfaitement étagé", "Tous les écarts entre clubs voisins sont entre " + SAC_ECART.min + " et " + SAC_ECART.max + " m.");
    else {
      var al = alertesDe(apres, id);
      message(texte + (al.length ? " " + phraseSac(al[0], CLUB[id]) : ""));
    }
  }
  FORMULAIRES["sac-dist"] = function () {
    var id = ui.feuille && ui.feuille.sac; if (!id || !CLUB[id]) return;
    var v = lireSacVal(), err = document.getElementById("sac-err");
    if (v == null || isNaN(v)) {
      err.textContent = "Entre une distance en mètres, entre 10 et 400."; err.hidden = false;
      document.getElementById("sac-val").focus(); return;
    }
    var avant = analyseCarnet(mesuresTout(), sacActuel());
    etat.carnet.clubs[id] = [v];
    apresSac(id, avant, CLUB[id].nom.split(",")[0] + " : " + v + " m.");
  };
  ACTIONS["sac-effacer"] = function () {
    var id = ui.feuille && ui.feuille.sac; if (!id || !CLUB[id]) return;
    var avant = analyseCarnet(mesuresTout(), sacActuel());
    delete etat.carnet.clubs[id];
    apresSac(id, avant, CLUB[id].nom.split(",")[0] + " : mesures du practice effacées.");
  };
  ACTIONS["sac-retirer"] = function () {
    var id = ui.feuille && ui.feuille.sac; if (!id || !CLUB[id]) return;
    fixerSac(sacActuel().filter(function (k) { return k !== id; }));
    if (ui.sacSel === id) ui.sacSel = null;
    sauver();
    ui.sacApercu = null; ui.feuille = null; ui.feuilleVue = false; ui.retourFocus = null; rendreFeuille(); rendre();
    var b = app.querySelector('[data-a="sac-composer"]'); if (b) b.focus({ preventScroll: true });
    message(CLUB[id].nom.split(",")[0] + " retiré du sac. Ses mesures sont gardées.");
  };
  /* Balle par balle : la fiche reste ouverte, le sac se met à jour derrière. */
  function majFicheSac(focusId) {
    ui.sacApercu = null; ui.sacBalles = true; sauver(); rendre(); rendreFeuille();
    var el = document.getElementById(focusId); if (el) el.focus({ preventScroll: true });
  }
  FORMULAIRES["sac-balle"] = function (form) {
    var id = ui.feuille && ui.feuille.sac; if (!id || !CLUB[id]) return;
    var inp = form.querySelector("#sac-balle"), brut = inp.value.trim(), v = /^\d+$/.test(brut) ? parseInt(brut, 10) : NaN;
    if (isNaN(v) || v < 5 || v > 400) { var err = document.getElementById("sac-balle-err"); err.textContent = "Entre une distance en mètres, entre 5 et 400."; err.hidden = false; inp.focus(); return; }
    var l = etat.carnet.clubs[id] = etat.carnet.clubs[id] || [];
    l.push(v); if (l.length > MESURES_MAX) l.splice(0, l.length - MESURES_MAX);
    majFicheSac("sac-balle");
  };
  ACTIONS["sac-balle-suppr"] = function (el) {
    var id = ui.feuille && ui.feuille.sac, l = id && etat.carnet.clubs[id], i = parseInt(el.getAttribute("data-v"), 10);
    if (!l || !(i >= 0 && i < l.length)) return;
    l.splice(i, 1); if (!l.length) delete etat.carnet.clubs[id];
    var reste = l.length ? Math.min(i, l.length - 1) : -1;
    majFicheSac("sac-balle");
    var suivant = reste >= 0 && document.querySelector('#feuille [data-a="sac-balle-suppr"][data-v="' + reste + '"]'); if (suivant) suivant.focus({ preventScroll: true });
  };
  ACTIONS["sac-basculer"] = function (el) {
    var id = el.getAttribute("data-id"), ids = sacActuel(); if (!CLUB[id]) return;
    var oubli = false;
    if (ids.indexOf(id) >= 0) {
      ids = ids.filter(function (k) { return k !== id; }); if (ui.sacSel === id) ui.sacSel = null;
      /* Un wedge ajouté qu'on sort du sac sans l'avoir mesuré disparaît de la liste. */
      if (CLUB[id].perso && !etat.carnet.clubs[id] && !etat.carnet.wedges[id]) {
        etat.carnet.wedgesPerso = etat.carnet.wedgesPerso.filter(function (v) { return v !== CLUB[id].loft; }); oubli = true;
      }
    }
    else if (ids.length < SAC_MAX) ids.push(id);
    else return;
    fixerSac(ids); if (oubli) majWedges(); sauver(); rendre(); rendreFeuille();
    var b = document.querySelector('#feuille [data-a="sac-basculer"][data-id="' + id + '"]') || document.querySelector('#feuille [data-a="sac-wedge-ajout"]') || document.getElementById("sac-loft-neuf");
    if (b) b.focus({ preventScroll: true });
  };
