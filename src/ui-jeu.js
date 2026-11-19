  /* ============================================================
     PARTIE EN DIRECT, À UNE MAIN : pavé géant, coups notés avec club et distance,
     position GPS quand le navigateur la donne, partenaires (mode marqueur),
     écran toujours allumé, vibration à la validation d'un trou.
     ============================================================ */

  /* ---------- Écran allumé ----------
     Verrou d'écran du navigateur ; s'il est refusé (cadre, ancien navigateur), une vidéo muette en boucle. */
  var EVEIL = { verrou: null, video: null, voulu: false };
  function videoEveil() {
    if (EVEIL.video) return EVEIL.video;
    var v = document.createElement("video");
    v.setAttribute("muted", ""); v.muted = true; v.setAttribute("playsinline", ""); v.setAttribute("loop", ""); v.setAttribute("aria-hidden", "true");
    v.setAttribute("title", "Écran allumé");
    v.style.cssText = "position:fixed;left:0;bottom:0;width:1px;height:1px;opacity:.01;pointer-events:none";
    [["webm", MEDIA_EVEIL.webm], ["mp4", MEDIA_EVEIL.mp4]].forEach(function (m) { var s = document.createElement("source"); s.src = m[1]; s.type = "video/" + m[0]; v.appendChild(s); });
    document.body.appendChild(v);
    EVEIL.video = v;
    return v;
  }
  function eveilParVideo() { try { var p = videoEveil().play(); if (p && p.catch) p.catch(function () { /* lecture refusée */ }); } catch (e) { /* vidéo indisponible */ } }
  function garderEcran(oui) {
    EVEIL.voulu = !!oui && etat.ecranAllume !== false;
    if (!EVEIL.voulu) {
      if (EVEIL.verrou) { try { EVEIL.verrou.release(); } catch (e) { /* déjà libéré */ } EVEIL.verrou = null; }
      if (EVEIL.video) { try { EVEIL.video.pause(); } catch (e) { /* rien */ } }
      return;
    }
    if (EVEIL.verrou) return;
    if (navigator.wakeLock && navigator.wakeLock.request) {
      navigator.wakeLock.request("screen").then(function (l) {
        EVEIL.verrou = l;
        l.addEventListener("release", function () { EVEIL.verrou = null; });
      }).catch(eveilParVideo);
    } else eveilParVideo();
  }
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible" && EVEIL.voulu && !EVEIL.verrou) garderEcran(true);
  });
  function vibrer(ms) { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) { /* vibration refusée */ } }

  /* ---------- Position GPS ----------
     Refusée dans certains cadres (la page hébergée dans claude.ai, par exemple) : les boutons n'y apparaissent pas. */
  var GPS = { refuse: false };
  function gpsPossible() {
    if (GPS.refuse || !navigator.geolocation) return false;
    try { if (document.featurePolicy && !document.featurePolicy.allowsFeature("geolocation")) return false; } catch (e) { /* pas de politique lisible */ }
    return true;
  }
  /* Une position, tout de suite : la dernière du suivi si elle a moins de cinq secondes, sinon une demande au téléphone ;
     si la demande n'aboutit pas, la dernière position connue (moins de deux minutes) sert de repli. */
  /* Position du joueur au moment du toucher : un point reçu dans les 3 dernières secondes, sinon le prochain.
     Trois points de moins de 10 m de précision en six secondes au plus, moyennés : la distance du coup gagne en justesse.
     Plus de repli sur une position ancienne : sans point frais, la mesure échoue et le dit. */
  function prendrePosition(fin) { positionFraiche(fin, { age: 2000, n: 3, prMax: 10, attente: 6000 }); }

  /* ---------- Données du trou ---------- */
  function coupsDuTrou(p, k) { if (!p.coups) p.coups = []; return p.coups[k] || []; }
  /* Longueur du trou : celle notée à la main, sinon celle de la carte GPS (départ → milieu du green). Une seule source affichée. */
  function longueurTrou(p, k) {
    var pc = parcoursDe(p.pc), h = trouPhysique(p, k), m = pc && pc.longueurs ? pc.longueurs[h] || 0 : 0;
    if (m) return m;
    var c = pc ? carteDe(pc.id) : null, l = c ? longueurTrouCarte(c, h) : null;
    return l >= 40 && l <= 700 ? l : 0;
  }
  function nomClub(id) { return CLUB[id] ? CLUB[id].nom.split(",")[0] : ""; }
  /* Green en régulation : sur le green en par moins deux coups, pénalités comprises. */
  function girDe(v) { return v[4] - v[2] <= v[5] - 2 ? 1 : 0; }
  function poserTrou(v) {
    var p = etat.partie; v[1] = girDe(v);
    v = assainirTrou(v); if (!v) return null;
    p.trous[p.i] = v;
    return v;
  }
  function nomLie(id) { var x = LIES.filter(function (l) { return l.id === id; })[0]; return x ? x.nom : ""; }
  function nomType(id) { var x = TYPES_COUP.filter(function (l) { return l.id === id; })[0]; return x && id ? x.nom : ""; }
  function libCoup(c, n) { return n + " · " + (c.t ? nomType(c.t).toLowerCase() + " · " : "") + (c.p && c.p !== "dep" ? nomLie(c.p).toLowerCase() + " · " : "") + nomClub(c.c) + (c.a && c.a !== "plein" ? " " + AMPLITUDES.filter(function (x) { return x.id === c.a; })[0].nom : "") + (c.d ? " · " + c.d + " m" : "") + (c.l != null ? " · " + libLat(c.l).toLowerCase() : ""); }
  /* Résumé du trou en cours, pour le bandeau : « Trou 7 · par 4 · 5 + 2 putts ». */
  function resumeTrou(p) {
    var x = p.trous[p.i], par = x ? x[5] : trouCourant()[5];
    return "Trou " + numeroTrou(p, p.i) + " · par " + par + (x ? " · " + x[4] + " + " + pluriel(x[2], "putt") : " · à noter");
  }
  function cumulPartie(p) {
    var s = statsTrous(p.trous), R = recusPartie(p);
    return s.T ? (s.N === s.T ? ecartLib(s.S - s.PAR) + (R && R.notes ? " · " + R.points + " pts" : "") : pluriel(s.P, "putt")) + " après " + pluriel(s.T, "trou") : "premier trou";
  }
  /* Coups reçus sur le trou en cours et points Stableford du score affiché. */
  function recusTrouHTML(p, v) {
    var R = recusPartie(p); if (!R) return "";
    var r = R.recus[p.i] || 0;
    return '<small class="pv-recus">' + t((r > 0 ? (r > 1 ? r + " coups reçus" : "1 coup reçu") : r < 0 ? "1 coup rendu" : "Pas de coup reçu") + " · " + pluriel(pointsStableford(v[4], v[5], r), "point")) + '</small>';
  }

  /* ---------- Le pavé ---------- */
  function paveHTML() {
    var p = etat.partie, v = trouCourant(), dernier = p.i === p.n - 1, pc = parcoursDe(p.pc), lg = longueurTrou(p, p.i);
    var coups = coupsDuTrou(p, p.i), detail = etat.detail;
    var h = '<section class="partie pave' + (etat.ecranClair ? " clair" : "") + '" role="dialog" aria-modal="true" aria-labelledby="pt-titre">' +
      '<div class="pv-haut"><header class="pv-barre"><button class="fermer" type="button" data-a="pt-fermer">Fermer</button>' +
      '<p class="pv-cumul" aria-live="polite">' + t((pc ? pc.nom + " · " : "") + cumulPartie(p)) + '</p>' +
      '<button class="pt-theme" type="button" data-a="pt-theme" aria-pressed="' + !!etat.ecranClair + '" aria-label="Écran clair, pour le plein soleil">' + icone(etat.ecranClair ? "lune" : "soleil") + '</button></header>' +
      '<div class="pv-trou"><h2 id="pt-titre">Trou <span class="main">' + numeroTrou(p, p.i) + '</span></h2>' +
      '<button class="pv-info" type="button" data-a="pv-par" aria-label="' + at("Par " + v[5] + ". Toucher pour passer au par " + (v[5] === 5 ? 3 : v[5] + 1)) + '"><small>Par</small><b>' + v[5] + '</b></button>' +
      (ui.pvLong ? '<form class="pv-long" data-f="pv-long" novalidate><label class="vh" for="pv-long">Longueur du trou en mètres</label><input id="pv-long" type="text" inputmode="numeric" maxlength="3" autocomplete="off" value="' + (lg || "") + '" placeholder="m"><button class="btn" type="submit">OK</button></form>'
        : '<button class="pv-info" type="button" data-a="pv-long" aria-label="' + at(lg ? "Longueur : " + lg + " mètres. Toucher pour corriger" : "Longueur du trou inconnue. Toucher pour la noter") + '"><small>Longueur</small><b>' + (lg ? lg + '<i>m</i>' : '?') + '</b></button>') +
      '</div>' + bandeHTML(p) + '</div>';

    var expr = modeSaisie() === "express";
    h += '<div class="pv-corps">' + emfLigneHTML() + (expr ? '' : sjcLigneHTML()) + planDuTrou(p) +
      '<div class="pv-score" role="group" aria-label="Score du trou"><button class="pv-pm" type="button" data-a="pt-score" data-d="-1" aria-label="Un coup de moins"' + (v[4] <= scoreMini(v[2], v[3]) ? " disabled" : "") + '>−</button>' +
      '<p aria-live="polite"><span class="main">' + v[4] + '</span><small>' + t(nomScore(v[4], v[5])) + '</small>' + recusTrouHTML(p, v) + '</p>' +
      '<button class="pv-pm" type="button" data-a="pt-score" data-d="1" aria-label="Un coup de plus"' + (v[4] >= 15 ? " disabled" : "") + '>+</button></div>' +
      '<div class="pv-duo"><div class="pv-putts" role="group" aria-label="Putts"><span>Putts</span>' +
      '<button class="pv-pm petit" type="button" data-a="pv-putts" data-d="-1" aria-label="Un putt de moins"' + (v[2] <= 0 ? " disabled" : "") + '>−</button>' +
      '<b class="main" aria-live="polite">' + (v[2] >= 4 ? "4+" : v[2]) + '</b>' +
      '<button class="pv-pm petit" type="button" data-a="pv-putts" data-d="1" aria-label="Un putt de plus"' + (v[2] >= 4 ? " disabled" : "") + '>+</button></div>' +
      '<div class="pv-penal-bloc"><button class="pv-penal" type="button" data-a="pv-penal" data-d="1"' + (v[3] >= 3 ? " disabled" : "") + ' aria-label="' + at("Pénalité ou drop : un coup de plus" + (v[3] ? ". " + v[3] + " déjà noté" + (v[3] > 1 ? "es" : "e") : "")) + '">' +
      '<span>Pénalité<br>ou drop</span><b>' + (v[3] ? "+" + v[3] : "+1") + '</b></button>' +
      (v[3] ? '<button class="pv-penal-moins" type="button" data-a="pv-penal" data-d="-1" aria-label="Retirer une pénalité">−1</button>' : '') + '</div></div>' +
      (v[5] >= 4 ? '<button class="pv-depart" type="button" data-a="pv-depart" aria-pressed="' + !!v[0] + '"><span>Mise en jeu</span><b>' + (v[0] ? "Jouable " + TRAIT : "Ratée ×") + '</b></button>' : '');

    /* Erreurs évitables : la double approche se marque d'un toucher ; le trois-putts court se déduit du premier putt ou se marque. */
    var court = premierPuttMoins(v, 5), p3auto = v[2] >= 3 && court === true, p3 = p3auto || (v[2] >= 3 && (v[9] & EVIT_PUTT3));
    if (!expr) h += '<div class="pv-evit" role="group" aria-label="Erreurs évitables"><h3>Erreurs évitables</h3><div class="pv-evit-l">' +
      '<button type="button" class="pv-evit-b" data-a="pv-evit" data-v="' + EVIT_DOUBLE + '" aria-pressed="' + !!(v[9] & EVIT_DOUBLE) + '">Double approche<small>deux coups pour rejoindre le green</small></button>' +
      '<button type="button" class="pv-evit-b" data-a="pv-evit" data-v="' + EVIT_PUTT3 + '" aria-pressed="' + !!p3 + '"' + (v[2] < 3 || p3auto ? " disabled" : "") + '>3 putts à moins de 5 m<small>' + t(v[2] < 3 ? "avec 3 putts ou plus" : p3auto ? "déduit du premier putt" : "premier putt court") + '</small></button>' +
      (v[3] ? '<p class="pv-evit-pen">' + t(pluriel(v[3], "pénalité") + " comptée" + (v[3] > 1 ? "s" : "")) + '</p>' : '') + '</div></div>';

    /* Coups : club et distance, qui nourrissent le sac */
    if (!expr) h += '<div class="pv-coups"><div class="pv-coups-tete"><h3>Coups</h3><small>' + t(coups.length ? "Touche un coup pour le corriger." : "Club et distance : ton sac se met à jour tout seul.") + '</small></div>' +
      (coups.length ? '<ol class="pv-coups-liste">' + coups.map(function (c, i) { return '<li><button class="puce neutre" type="button" data-a="pv-coup" data-v="' + i + '">' + t(libCoup(c, i + 1)) + '</button></li>'; }).join("") + '</ol>' : '') +
      '<button class="btn pv-coup-ajout" type="button" data-a="pv-coup" data-v="-1">' + t("Noter le coup " + (coups.length + 1)) + '</button></div>';

    /* Mode marqueur */
    if (p.joueurs && p.joueurs.length) {
      h += '<div class="pv-joueurs"><h3>Partenaires</h3>' + p.joueurs.map(function (j, n) {
        var s = j.s[p.i], val = s == null ? v[5] : s;
        return '<div class="pv-joueur" role="group" aria-label="' + at(j.nom) + '"><span>' + t(j.nom) + '</span>' +
          '<button class="pv-pm petit" type="button" data-a="pv-joueur" data-j="' + n + '" data-d="-1" aria-label="' + at(j.nom + " : un coup de moins") + '"' + (val <= 1 ? " disabled" : "") + '>−</button>' +
          '<button class="pv-j-val' + (s == null ? " vide" : "") + '" type="button" data-a="pv-joueur" data-j="' + n + '" data-d="0" aria-label="' + at(j.nom + (s == null ? " : score à noter, toucher pour noter le par" : " : " + s)) + '">' + val + '</button>' +
          '<button class="pv-pm petit" type="button" data-a="pv-joueur" data-j="' + n + '" data-d="1" aria-label="' + at(j.nom + " : un coup de plus") + '"' + (val >= 15 ? " disabled" : "") + '>+</button></div>';
      }).join("") + '</div>';
    }

    /* Détails facultatifs */
    if (!expr) h += '<details class="pv-plus"' + (detail ? " open" : "") + '><summary data-a="pt-detail">Plus de détails</summary>' +
      (!v[0] && v[5] >= 4 ? sousChoix("Ratée où ?", 6, COTES, v) : "") +
      (v[5] >= 4 ? sousChoix("Club de départ", 7, CLUBS_DEPART, v) : "") +
      (v[2] ? sousChoix("Premier putt", 8, v.length >= 11 ? PUTT1B : PUTT1, v) : "") +
      (v.length >= 11 ? sousChoix("Bunker près du green", 10, ["", "Sorti sur le green", "Resté à côté"], v) : "") +
      '<p class="aide">' + t("Green en régulation : " + (v[1] ? "oui" : "non") + ", d'après le score et les putts.") + '</p></details>';
    h += '<div class="ligne-liens"><button class="lien" type="button" data-a="pv-eveil" aria-pressed="' + (etat.ecranAllume !== false) + '">' + (etat.ecranAllume !== false ? "Écran toujours allumé" : "Garder l’écran allumé") + '</button>' +
      (dernier ? "" : '<button class="lien" type="button" data-a="pt-terminer">Terminer la partie ici</button>') + '</div>' +
      (statsTrous(p.trous).T ? '' : '<p class="pt-cumul">Score et putts sont déjà proposés : un toucher pour corriger, un pour valider. Tu peux aussi glisser le doigt vers la gauche pour valider.</p>') +
      '';
    h += '<div class="pv-validation"><p class="aide">' + t((p.validation || [])[p.i] === "confirme" ? "Score confirmé par toi." : "Score proposé automatiquement : confirme-le avant de terminer le trou.") + '</p>' +
      '<button class="btn" type="button" data-a="pt-confirmer">' + ((p.validation || [])[p.i] === "confirme" ? "Score confirmé ✓" : "Confirmer le score") + '</button></div>';
    h += '<div class="pv-mode" role="group" aria-label="Mode de saisie"><button type="button" data-a="mode-saisie" data-v="express" aria-pressed="' + expr + '">Score express</button><button type="button" data-a="mode-saisie" data-v="detail" aria-pressed="' + !expr + '">Performance détaillée</button></div></div>';

    h += '<footer class="pv-pied"><button class="btn" type="button" data-a="pt-prec"' + (p.i === 0 ? " disabled" : "") + ' aria-label="' + at(p.i === 0 ? "Trou précédent" : "Revenir au trou " + numeroTrou(p, p.i - 1)) + '">' + (p.i === 0 ? "‹" : "‹ " + numeroTrou(p, p.i - 1)) + '</button>' +
      '<button class="btn principal" type="button" data-a="pt-suiv" id="pt-suiv">' + (dernier ? "Terminer la partie" : t("Valider · trou " + numeroTrou(p, p.i + 1))) + '</button></footer>';
    if (ui.pvCoup) h += coupPanneauHTML();
    else if (ui.pvPanneau === "sjc") h += sjcPanneauHTML();
    else if (ui.pvPanneau === "strat") h += stratPanneauHTML();
    else if (ui.pvPanneau === "carte") h += cartePanneauHTML();
    return h + '</section>';
  }

  /* Club de départ des détails du trou (1 driver, 2 bois, 3 hybride, 4 fer ou wedge) d'après un club du sac. */
  function clubDepartDe(id) { return id === "dr" ? 1 : /^b/.test(id) ? 2 : /^h/.test(id) ? 3 : CLUB[id] ? 4 : 0; }
  /* Position de la balle d'après la carte GPS : bunker ou fairway, quand le départ du coup est marqué dedans. */
  function lieDepuisCarte(g) {
    var x = ctxCarte(); if (!g || g[0] == null || !x || !x.trou) return null;
    var q = projeter(x.carte.o, g[0], g[1]), dans = function (k) { return (x.trou[k] || []).some(function (f) { return pointDansPoly(q, dePlat(f)); }); };
    return dans("b") ? "bk" : dans("f") ? "fw" : null;
  }

  /* ---------- Panneau d'un coup ---------- */
  function coupPanneauHTML() {
    var p = etat.partie, C = ui.pvCoup, n = C.i < 0 ? coupsDuTrou(p, p.i).length + 1 : C.i + 1, club = CLUB[C.c], gps = gpsPossible();
    var h = '<div class="pv-voile" aria-hidden="true"></div><div class="pv-panneau" role="dialog" aria-modal="true" aria-labelledby="pv-coup-titre">' +
      '<h3 id="pv-coup-titre">' + t("Coup " + n + " · trou " + numeroTrou(p, p.i)) + '</h3>' +
      '<p class="pv-etiq">Balle</p><div class="pv-choix" role="group" aria-label="Position de la balle">' + LIES.map(function (x) {
        return '<button type="button" data-a="pv-lie" data-v="' + x.id + '" aria-pressed="' + (C.p === x.id) + '">' + t(x.nom) + '</button>';
      }).join("") + '</div>' +
      '<p class="pv-etiq">Coup</p><div class="pv-choix" role="group" aria-label="Type de coup">' + TYPES_COUP.map(function (x) {
        return '<button type="button" data-a="pv-type" data-v="' + x.id + '" aria-pressed="' + ((C.t || "") === x.id) + '"' + (x.aide ? ' title="' + at(x.aide) + '"' : '') + '>' + t(x.nom) + '</button>';
      }).join("") + '</div>' +
      (C.t || LIES_HORS_SAC.indexOf(C.p) >= 0 ? '<p class="aide">' + t("Ce coup ne compte pas dans les distances de ton sac.") + '</p>' : '');
    var sac = sacJeu(), autres = CLUBS.filter(function (c) { return sac.indexOf(c.id) < 0; }).map(function (c) { return c.id; });
    h += '<p class="pv-etiq">Club</p><div class="pv-clubs" role="group" aria-label="Club joué">' + sac.map(function (id) {
        var fo = fourchetteDe(id);
        return '<button type="button" data-a="pv-club" data-id="' + id + '" aria-pressed="' + (C.c === id) + '" aria-label="' + at(nomClub(id) + (fo ? ", " + libFourchette(fo) : "")) + '">' + t(courtSac(CLUB[id]).replace(/^(\d)$/, "Fer $1")) + (fo ? '<small>' + t(libFourchette(fo).replace(" m", "")) + '</small>' : '') + '</button>';
      }).join("") + '</div>';
    /* Les autres clubs restent accessibles, repliés : un club absent du sac s'y ajoute quand on le joue. */
    if (autres.length) h += '<details class="pv-autres"' + (C.autres || autres.indexOf(C.c) >= 0 ? " open" : "") + '><summary data-a="pv-autres">' + t(sacCompose() ? "Un club qui n'est pas dans ton sac" : "Autres clubs") + '</summary><div class="pv-clubs petit" role="group" aria-label="Autres clubs">' +
      autres.map(function (id) { return '<button type="button" data-a="pv-club" data-id="' + id + '" aria-pressed="' + (C.c === id) + '">' + t(courtSac(CLUB[id]).replace(/^(\d)$/, "Fer $1")) + '</button>'; }).join("") + '</div>' +
      (sacCompose() ? "" : '<p class="aide">' + t("La liste du haut : les clubs que tu as déjà mesurés. Compose ton sac dans « Mon sac » pour la fixer.") + '</p>') + '</details>';
    if (club && club.fam === "w") {
      h += '<div class="pv-amplitudes" role="group" aria-label="Amplitude du swing">' + [{ id: "plein", nom: "Plein" }].concat(AMPLITUDES.slice().reverse()).map(function (am) {
        return '<button type="button" data-a="pv-amplitude" data-v="' + am.id + '" aria-pressed="' + ((C.a || "plein") === am.id) + '">' + t(am.nom) + '</button>';
      }).join("") + '</div>';
    }
    h += '<div class="pv-dist"><label for="pv-dist">Distance de vol, en mètres</label><div class="pv-dist-reglage">' +
      [-5, -1].map(function (d) { return '<button class="pv-pm petit" type="button" data-a="pv-dist" data-d="' + d + '" aria-label="' + at(Math.abs(d) + " mètre" + (d < -1 ? "s" : "") + " de moins") + '">' + d + '</button>'; }).join("") +
      '<input id="pv-dist" type="text" inputmode="numeric" maxlength="3" autocomplete="off" data-i="pv-dist" value="' + (C.d || "") + '" placeholder="m">' +
      [1, 5].map(function (d) { return '<button class="pv-pm petit" type="button" data-a="pv-dist" data-d="' + d + '" aria-label="' + at(d + " mètre" + (d > 1 ? "s" : "") + " de plus") + '">+' + d + '</button>'; }).join("") + '</div></div>';
    if (club) {
      var el = ellipseDe(C.c);
      h += poseurHTML({ ell: el, ctx: "coup", l: C.l, dd: C.d != null && el ? C.d - el.d : C.dd || 0 });
    }
    if (gps) {
      var g = C.g || [];
      h += '<div class="pv-gps"><button class="btn" type="button" data-a="pv-gps" data-v="a">' + (g[0] != null ? "Départ marqué " + TRAIT : "Marquer le départ") + '</button>' +
        '<button class="btn" type="button" data-a="pv-gps" data-v="b"' + (g[0] == null ? " disabled" : "") + '>' + (g[2] != null ? "Arrivée marquée " + TRAIT : "Marquer l’arrivée") + '</button></div>' +
        '<p class="aide" id="pv-gps-etat" aria-live="polite">' + t(C.gpsMsg || "Marque ta position à la balle, puis là où elle s'arrête : la distance se remplit seule.") + '</p>';
    } else if (GPS.refuse || navigator.geolocation) {
      h += '<p class="aide">' + t("La position GPS n'est pas accessible ici : saisis la distance au compteur ou à la carte du parcours.") + '</p>';
    }
    h += '<p class="erreur" id="pv-coup-err" role="alert" hidden></p><div class="pv-panneau-pied">' +
      '<button class="btn" type="button" data-a="pv-coup-annuler">Annuler</button>' +
      (C.i >= 0 ? '<button class="btn danger" type="button" data-a="pv-coup-suppr">Supprimer</button>' : '') +
      '<button class="btn principal" type="button" data-a="pv-coup-ok" id="pv-coup-ok">Enregistrer</button></div></div>';
    return h;
  }

  /* ---------- Actions du pavé ---------- */
  function rePave(sel) { sauver(); rendrePartie(); if (sel) focusPartie(sel); }
  ACTIONS["pv-putts"] = function (el) {
    var p = etat.partie; if (!p) return;
    var v = trouCourant().slice(), d = parseInt(el.getAttribute("data-d"), 10), np = Math.max(0, Math.min(4, v[2] + d));
    if (np === v[2]) return;
    /* Un putt de plus ou de moins change le score d'autant : le nombre de coups jusqu'au green ne bouge pas. */
    v[4] = Math.max(1 + np + v[3], Math.min(15, v[4] + (np - v[2]))); v[2] = np;
    if (np < 3 && v.length >= 11) v[9] &= ~EVIT_PUTT3;
    poserTrou(v); rePave('[data-a="pv-putts"][data-d="' + d + '"]:not([disabled]), [data-a="pv-putts"]:not([disabled])');
  };
  ACTIONS["pv-penal"] = function (el) {
    var p = etat.partie; if (!p) return;
    var v = trouCourant().slice(), d = parseInt(el.getAttribute("data-d"), 10), nx = Math.max(0, Math.min(3, v[3] + d));
    if (nx === v[3]) return;
    v[4] = Math.max(1 + v[2] + nx, Math.min(15, v[4] + (nx - v[3]))); v[3] = nx;
    poserTrou(v); rePave(d > 0 ? '[data-a="pv-penal"][data-d="1"]' : '[data-a="pv-penal"]');
  };
  ACTIONS["pv-depart"] = function () {
    var p = etat.partie; if (!p) return;
    var v = trouCourant().slice(); v[0] = v[0] ? 0 : 1; if (v[0]) v[6] = 0;
    poserTrou(v); rePave('[data-a="pv-depart"]');
  };
  /* Le par passe de 3 à 4 à 5 ; le score garde le même écart au par. */
  ACTIONS["pv-par"] = function () {
    var p = etat.partie; if (!p) return;
    var v = trouCourant().slice(), np = v[5] === 5 ? 3 : v[5] + 1;
    v[4] = Math.max(1 + v[2] + v[3], Math.min(15, v[4] + (np - v[5]))); v[5] = np;
    if (np === 3) { v[7] = 0; v[0] = 1; v[6] = 0; }
    poserTrou(v); memoriserPar(p, p.i); rePave('[data-a="pv-par"]');
  };
  ACTIONS["pv-long"] = function () { if (!etat.partie) return; ui.pvLong = true; rendrePartie(); var i = document.getElementById("pv-long"); if (i) { i.focus(); i.select(); } };
  FORMULAIRES["pv-long"] = function (form) {
    var p = etat.partie, pc = p && parcoursDe(p.pc); ui.pvLong = false;
    var brut = form.querySelector("#pv-long").value.trim(), v = /^\d{2,3}$/.test(brut) ? parseInt(brut, 10) : 0;
    if (pc) {
      if (!pc.longueurs) pc.longueurs = pc.pars.map(function () { return 0; });
      pc.longueurs[trouPhysique(p, p.i)] = v >= 40 && v <= 700 ? v : 0;
    }
    rePave('[data-a="pv-long"]');
  };
  ACTIONS["pv-evit"] = function (el) {
    var p = etat.partie; if (!p) return;
    var b = parseInt(el.getAttribute("data-v"), 10), v = trouOnze(trouCourant().slice());
    if (b !== EVIT_DOUBLE && b !== EVIT_PUTT3) return;
    v[9] ^= b; poserTrou(v); rePave('[data-a="pv-evit"][data-v="' + b + '"]');
  };
  ACTIONS["pv-joueur"] = function (el) {
    var p = etat.partie; if (!p || !p.joueurs) return;
    var j = p.joueurs[parseInt(el.getAttribute("data-j"), 10)], d = parseInt(el.getAttribute("data-d"), 10); if (!j) return;
    var par = trouCourant()[5], s = j.s[p.i];
    j.s[p.i] = d === 0 ? (s == null ? par : s) : Math.max(1, Math.min(15, (s == null ? par : s) + d));
    rePave('[data-a="pv-joueur"][data-j="' + el.getAttribute("data-j") + '"][data-d="' + d + '"]:not([disabled])');
  };
  ACTIONS["pv-eveil"] = function () {
    etat.ecranAllume = etat.ecranAllume === false;
    garderEcran(etat.ecranAllume !== false);
    rePave('[data-a="pv-eveil"]');
  };

  /* ---------- Actions du panneau d'un coup ---------- */
  ACTIONS["pv-coup"] = function (el) {
    var p = etat.partie; if (!p) return;
    var i = parseInt(el.getAttribute("data-v"), 10), l = coupsDuTrou(p, p.i), c = i >= 0 ? l[i] : null;
    if (i >= 0 && !c) return;
    var prec = i < 0 ? l[l.length - 1] : l[i - 1];
    /* Le départ d'un coup reprend l'arrivée du coup précédent, quand elle a été marquée. */
    var g = c && c.g ? c.g.slice() : (prec && prec.g && prec.g[2] != null ? [prec.g[2], prec.g[3], null, null] : null);
    ui.pvCoup = c ? { i: i, c: c.c, d: c.d, a: c.a, g: g, l: c.l != null ? c.l : null, p: c.p || null, t: c.t || "" }
      : { i: -1, c: null, d: null, a: "plein", g: g, l: null, p: l.length ? lieDepuisCarte(g) : "dep", t: "" };
    ui.pvRetour = i >= 0 ? '[data-a="pv-coup"][data-v="' + i + '"]' : '[data-a="pv-coup"][data-v="-1"]';
    rendrePartie();
    focusPartie(ui.pvCoup.c ? '[data-a="pv-club"][aria-pressed="true"]' : '[data-a="pv-club"]');
  };
  function fermerCoup() {
    var sel = ui.pvRetour || "#pt-suiv"; ui.pvCoup = null; ui.pvRetour = null;
    rendrePartie(); focusPartie(sel + ", #pt-suiv");
  }
  ACTIONS["pv-coup-annuler"] = fermerCoup;
  ACTIONS["pv-lie"] = function (el) {
    var C = ui.pvCoup, v = el.getAttribute("data-v"); if (!C) return;
    C.p = C.p === v ? null : v;
    rendrePartie(); focusPartie('[data-a="pv-lie"][data-v="' + v + '"]');
  };
  ACTIONS["pv-type"] = function (el) {
    var C = ui.pvCoup, v = el.getAttribute("data-v") || ""; if (!C) return;
    C.t = v;
    rendrePartie(); focusPartie('[data-a="pv-type"][data-v="' + v + '"]');
  };
  ACTIONS["pv-autres"] = function () { var C = ui.pvCoup; if (C) C.autres = !C.autres; };
  ACTIONS["pv-club"] = function (el) {
    var C = ui.pvCoup, id = el.getAttribute("data-id"); if (!C || !CLUB[id]) return;
    var avant = C.c; C.c = id;
    if (CLUB[id].fam !== "w") C.a = "plein";
    /* Distance proposée : la moyenne du club, tant que le joueur n'en a pas tapé une. */
    if (!C.d || C.dAuto) { var m = moyenneClub(mesuresTout(), id); C.d = m; C.dAuto = m != null; }
    if (avant !== id) { rendrePartie(); focusPartie('[data-a="pv-club"][data-id="' + id + '"]'); }
  };
  ACTIONS["pv-amplitude"] = function (el) {
    var C = ui.pvCoup; if (!C) return;
    C.a = el.getAttribute("data-v"); if (C.dAuto) { C.d = null; C.dAuto = false; }
    rendrePartie(); focusPartie('[data-a="pv-amplitude"][data-v="' + C.a + '"]');
  };
  SAISIES["pv-dist"] = function (el) {
    var C = ui.pvCoup; if (!C) return;
    var v = el.value.trim(); C.d = /^\d{1,3}$/.test(v) ? parseInt(v, 10) : null; C.dAuto = false; C.dTap = false;
  };
  ACTIONS["pv-dist"] = function (el) {
    var C = ui.pvCoup; if (!C) return;
    C.d = Math.max(1, Math.min(400, (C.d || moyenneClub(mesuresTout(), C.c) || 100) + parseInt(el.getAttribute("data-d"), 10))); C.dAuto = false; C.dTap = false;
    var i = document.getElementById("pv-dist"); if (i) i.value = C.d;
  };
  ACTIONS["pv-gps"] = function (el) {
    var C = ui.pvCoup, k = el.getAttribute("data-v"); if (!C) return;
    C.gpsMsg = "Mesure GPS : reste immobile quelques secondes…"; var e = document.getElementById("pv-gps-etat"); if (e) e.textContent = C.gpsMsg;
    prendrePosition(function (pos, prec, err) {
      if (ui.pvCoup !== C) return;
      if (!pos) { C.gpsMsg = GPS.refuse ? "Position refusée : saisis la distance." : "Position introuvable pour l'instant. Réessaie à découvert."; rendrePartie(); focusPartie('[data-a="pv-gps"][data-v="' + k + '"], #pv-dist'); return; }
      var g = C.g || [null, null, null, null];
      if (k === "a") { g[0] = pos[0]; g[1] = pos[1]; g[2] = null; g[3] = null; C.gpsMsg = "Départ marqué, à " + prec + " m près. Marque l'arrivée quand tu es à la balle."; }
      else {
        g[2] = pos[0]; g[3] = pos[1];
        var d = distanceGPS([g[0], g[1]], [g[2], g[3]]);
        if (d >= 1 && d <= 400) { C.d = d; C.dAuto = false; }
        C.gpsMsg = "Distance mesurée : " + d + " m, à " + prec + " m près.";
      }
      C.g = g; rendrePartie(); focusPartie(k === "a" ? '[data-a="pv-gps"][data-v="b"]' : "#pv-coup-ok");
    });
  };
  ACTIONS["pv-coup-ok"] = function () {
    var p = etat.partie, C = ui.pvCoup; if (!p || !C) return;
    var err = document.getElementById("pv-coup-err");
    if (!C.c) { if (err) { err.textContent = "Choisis le club joué."; err.hidden = false; } focusPartie('[data-a="pv-club"]'); return; }
    if (C.d != null && !(C.d >= 1 && C.d <= 400)) { if (err) { err.textContent = "Distance entre 1 et 400 m, ou laisse vide."; err.hidden = false; } focusPartie("#pv-dist"); return; }
    var coup = { c: C.c, d: C.d || null, a: C.a || "plein", g: C.g && C.g[0] != null && C.g[2] != null ? C.g.slice() : null,
      source: C.g && C.g[2] != null ? "gps" : "manuel", distanceType: C.g && C.g[2] != null ? "total" : "carry", mesureLe: Date.now() };
    if (C.l != null) coup.l = C.l;
    if (C.p) coup.p = C.p;
    if (C.t) coup.t = C.t;
    /* Un club joué qui n'est pas dans le sac composé y entre (dans la limite de la règle). */
    var ajoute = sacCompose() && sacActuel().indexOf(C.c) < 0 && sacActuel().length < 13;
    if (ajoute) fixerSac(sacActuel().concat([C.c]));
    if (!p.coups) p.coups = [];
    var l = (p.coups[p.i] || []).slice();
    if (C.i >= 0) l[C.i] = coup; else l.push(coup);
    p.coups[p.i] = l.slice(0, 15);
    var n = C.i >= 0 ? C.i + 1 : l.length;
    if (n === 1 && coup.g) apprendreDepart([coup.g[0], coup.g[1]]);
    /* Club de départ (détails du trou) : déduit du premier coup, pour ne pas le noter deux fois. */
    if (n === 1 && (!coup.p || coup.p === "dep")) {
      var v = trouCourant().slice(), fam = clubDepartDe(coup.c);
      if (v[5] >= 4 && fam && v[7] !== fam) { v[7] = fam; poserTrou(v); }
    }
    ui.pvCoup = null; ui.pvRetour = null;
    sauver(); rendrePartie(); focusPartie('[data-a="pv-coup"][data-v="-1"]');
    if (ajoute) message(nomClub(coup.c) + " ajouté à ton sac.");
    else if (coup.d && coupPlein(coup)) message(nomClub(coup.c) + " : " + coup.d + " m notés. Ton sac est à jour.");
    else if (coup.d) message("Coup noté. Il ne compte pas dans les distances du sac.");
  };
  ACTIONS["pv-coup-suppr"] = function () {
    var p = etat.partie, C = ui.pvCoup; if (!p || !C || C.i < 0) return;
    var l = (p.coups[p.i] || []).slice(); l.splice(C.i, 1); p.coups[p.i] = l;
    ui.pvCoup = null; ui.pvRetour = null;
    sauver(); rendrePartie(); focusPartie('[data-a="pv-coup"][data-v="-1"]');
  };

  /* ---------- Bandeau du trou en cours, en haut de toutes les pages ---------- */
  function bandeauPartieHTML() {
    var p = etat.partie; if (!p) return "";
    var s = statsTrous(p.trous), tot = s.T && s.N === s.T ? ecartLib(s.S - s.PAR) : "";
    return '<button class="bandeau-partie" type="button" data-a="pt-reprendre" aria-label="' + at("Partie en cours. " + resumeTrou(p) + (tot ? ". Total " + tot : "") + ". Reprendre la saisie") + '">' +
      icone("partie") + '<span class="bp-txt">' + t(resumeTrou(p)) + '</span>' + (tot ? '<span class="bp-total main">' + tot + '</span>' : '') + icone("chevron") + '</button>';
  }

  /* ---------- Départ : partenaires du mode marqueur ---------- */
  function joueursDepartHTML() {
    var d = ui.depart, l = d.joueurs || [];
    return '<fieldset class="champ dp-joueurs"><legend>Mode marqueur <small>facultatif</small></legend>' +
      '<p class="aide">Note aussi le score de tes partenaires, jusqu’à trois.</p>' +
      (l.length ? '<ul class="releves">' + l.map(function (n, i) { return '<li><button class="puce neutre" type="button" data-a="dp-joueur-suppr" data-v="' + i + '" aria-label="' + at("Retirer " + n) + '">' + t(n) + ' <span aria-hidden="true">×</span></button></li>'; }).join("") + '</ul>' : '') +
      (l.length < 3 ? '<div class="duo"><input id="dp-joueur" type="text" maxlength="20" autocomplete="off" aria-label="Prénom du partenaire" placeholder="Prénom"><button class="btn" type="button" data-a="dp-joueur-ajout">Ajouter</button></div>' : '') + '</fieldset>';
  }
  ACTIONS["dp-joueur-ajout"] = function () {
    var d = ui.depart, i = document.getElementById("dp-joueur"); if (!d || !i) return;
    var nom = texteCourt(i.value, 20); if (!nom) { i.focus(); return; }
    d.joueurs = (d.joueurs || []).concat([nom]).slice(0, 3);
    rendre(); var n = document.getElementById("dp-joueur") || app.querySelector('[data-a="pt-nouvelle"]'); if (n) n.focus({ preventScroll: true });
  };
  ACTIONS["dp-joueur-suppr"] = function (el) {
    var d = ui.depart, i = parseInt(el.getAttribute("data-v"), 10); if (!d || !d.joueurs) return;
    d.joueurs.splice(i, 1); rendre(); var n = document.getElementById("dp-joueur"); if (n) n.focus({ preventScroll: true });
  };
