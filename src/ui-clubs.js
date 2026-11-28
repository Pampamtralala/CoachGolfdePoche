  /* ============================================================
     PROFIL DES CLUBS (roadmap DATA, P06 ; dans Sac › Performance depuis V4-S05)
     Sur les parties choisies par le filtre commun (le même que Performance) : régularité et résultat de chaque club.
     Se lit sans distance ; la distance n'est qu'une indication, arrondie à 5 m.
     ============================================================ */
  function ordreClubs() { return sacActuel().concat(CLUBS.map(function (c) { return c.id; })); }
  function pctClub(v) { return v == null ? "–" : v + " %"; }
  function profilClubHTML(P, court) {
    var D = P.direction, A = P.arrivees, M = P.departs, d = P.distance, T = P.tendance, h = "";
    h += barreRepartitionHTML(court ? nomClub(P.club) + " : gauche ou droite" : "Gauche ou droite",
      [{ lib: "À gauche", v: D.gauche, c: "g" }, { lib: "Dans l'axe", v: D.centre, c: "c" }, { lib: "À droite", v: D.droite, c: "d" }],
      pluriel(D.n, "coup") + " avec direction", court ? "" : "À plus de " + SEUIL_LATERAL + " m de la ligne de visée : gauche ou droite." + (P.n > D.n ? " " + pluriel(P.n - D.n, "coup") + " sans direction notée." : ""));
    if (court) return h || '<p class="aide">' + t(nomClub(P.club) + " : aucune direction notée.") + '</p>';
    if (!D.n) h += '<p class="aide">' + t("Aucune direction notée : touche le côté de l'ellipse quand tu notes un coup.") + '</p>';
    h += barreRepartitionHTML("Où la balle arrive",
      [{ lib: "En jeu", v: A.jeu + A.green, c: "c" }, { lib: "Rough", v: A.rough, c: "k" }, { lib: "Bunker ou arbres", v: A.obstacle, c: "d" }],
      pluriel(A.n, "coup"), "D'après la position du coup suivant ; « en jeu » : fairway, avant-green ou green (déduit du score du trou)." + (A.inconnues ? " " + pluriel(A.inconnues, "coup") + " sans suite connue, non comptés." : ""));
    if (M.departs) {
      h += '<p class="club-ligne"><b>Au départ des par 4 et 5</b> ' + t((M.n ? M.jouables + " mises en jeu jouables sur " + M.n + " renseignées (" + M.part + " %)" +
        (M.n > M.jouables ? " · ratées : " + [M.gauche ? M.gauche + " à gauche" : "", M.droite ? M.droite + " à droite" : "", M.courtes ? M.courtes + " courtes" : ""].filter(Boolean).join(", ") : "") + "." : "aucune mise en jeu renseignée.") +
        (M.inconnues ? " " + M.inconnues + " non renseignées (saisie express), non comptées." : "") +
        (M.avecPenalite ? " Pénalité sur " + pluriel(M.avecPenalite, "trou") + " où il a pris le départ." : "")) + '</p>';
    }
    h += '<p class="club-ligne"><b>Distance</b> ' + t(d.valeur != null
      ? "environ " + d.valeur + " m sur le parcours (de " + d.min + " à " + d.max + " m). Indicatif : " + pluriel(d.n, "mesure") + (d.gps ? " dont " + d.gps + " au GPS, roule comprise, approximatives" : "") + ". Les estimations n'y entrent pas."
      : "pas assez de mesures (" + d.n + " sur " + MIN_DISTANCES + " nécessaires). Le profil se lit sans.") + '</p>';
    h += '<p class="club-ligne"><b>Tendance</b> ' + t(T
      ? "des " + T.n + " coups les plus anciens aux " + T.n + " plus récents : " + [T.axe ? "dans l'axe " + T.axe.avant + " % → " + T.axe.apres + " %" : "", T.enJeu ? "en jeu " + T.enJeu.avant + " % → " + T.enJeu.apres + " %" : ""].filter(Boolean).join(" ; ") + "."
      : "à partir de " + MIN_TENDANCE + " coups notés avec ce club.") + '</p>';
    return h;
  }
  function comparaisonClubsHTML(A, B) {
    var l = comparerClubs(A, B);
    function cel(x, id) {
      if (x.v == null) return '<td class="num">–<small>' + t(x.n ? "n = " + x.n : "aucun") + '</small></td>';
      return '<td class="num">' + t(id === "coups" ? String(x.v) : id === "distance" ? "≈ " + x.v + " m" : x.v + " %") + (id === "coups" ? "" : '<small>' + t("n = " + x.n) + '</small>') + '</td>';
    }
    return '<div class="defile"><table class="carte-score comparaison-clubs"><caption class="vh">' + t("Comparaison de " + nomClub(A.club) + " et " + nomClub(B.club)) + '</caption>' +
      '<thead><tr><th scope="col"></th><th scope="col" class="num">' + t(nomClub(A.club)) + '</th><th scope="col" class="num">' + t(nomClub(B.club)) + '</th></tr></thead><tbody>' +
      l.map(function (x) { return '<tr><th scope="row">' + t(x.lib) + '</th>' + cel(x.a, x.id) + cel(x.b, x.id) + '</tr>'; }).join("") + '</tbody></table></div>' +
      '<p class="aide">' + t("Côte à côte, sur les mêmes parties et la même période. n : nombre de coups (ou de départs) sur lequel repose chaque pourcentage. Sous une dizaine, l'écart entre deux clubs peut être le hasard. Pas de note globale : chaque ligne se lit seule.") + '</p>' +
      '<details class="aide-pli"><summary><span class="ico-info" aria-hidden="true">i</span>' + t("Détail des deux profils") + '</summary><div>' + profilClubHTML(A, true) + profilClubHTML(B, true) + '</div></details>';
  }
  function departsFamillesHTML(F) {
    if (!F.length) return "";
    return '<h3 class="titre-bloc">Départs par type de club</h3><div class="defile"><table class="carte-score departs-familles"><thead><tr><th scope="col">Au départ</th><th scope="col" class="num">Jouables</th><th scope="col" class="num">À gauche</th><th scope="col" class="num">À droite</th></tr></thead><tbody>' +
      F.map(function (f) {
        return '<tr><th scope="row">' + t(f.nom) + '<small>' + t(pluriel(f.n, "départ") + " renseigné" + (f.n > 1 ? "s" : "") + (f.avecPenalite ? " · " + f.avecPenalite + " avec pénalité" : "")) + '</small></th>' +
          '<td class="num">' + pctClub(f.part) + '</td><td class="num">' + pctClub(f.n ? Math.round(100 * f.gauche / f.n) : null) + '</td><td class="num">' + pctClub(f.n ? Math.round(100 * f.droite / f.n) : null) + '</td></tr>';
      }).join("") + '</tbody></table></div><p class="aide">' + t("Notés en saisie Standard ou Expert, sans distance : le club de départ et la mise en jeu suffisent.") + '</p>';
  }
  /* V4-S06 : classements des clubs sur un seul critère à la fois — jamais de score global. Même période (filtre commun),
     effectif affiché ; sous MIN_CLASSEMENT observations, le club est listé à part, sans rang. */
  var MIN_CLASSEMENT = 5;
  var TRIS_CLUBS = [
    { id: "precision", court: "Précision", lib: "dans l'axe", unite: "%", n: "coup" },
    { id: "utilisation", court: "Utilisation", lib: "coups par partie", unite: "", n: "coup" },
    { id: "arrivees", court: "En jeu", lib: "arrivées en jeu", unite: "%", n: "arrivée" },
    { id: "departs", court: "Départs", lib: "départs jouables", unite: "%", n: "départ" }];
  function mesureTri(P, tri) {
    if (tri === "precision") return { v: P.direction.partCentre, n: P.direction.n };
    if (tri === "utilisation") return { v: P.parties ? Math.round(10 * P.n / P.parties) / 10 : null, n: P.n };
    if (tri === "arrivees") return { v: P.arrivees.partEnJeu, n: P.arrivees.n };
    return P.departs.departs ? { v: P.departs.part, n: P.departs.n } : null;
  }
  function classementClubsHTML(l, notes) {
    var tri = ui.triClubs || "precision", T = TRIS_CLUBS.filter(function (x) { return x.id === tri; })[0];
    var L = notes.map(function (x) { var P = profilClub(l, x.club), m = mesureTri(P, tri); return m ? { club: x.club, v: m.v, n: m.n, parties: P.parties } : null; }).filter(Boolean);
    var classes = L.filter(function (x) { return x.v != null && x.n >= MIN_CLASSEMENT; }).sort(function (a, b) { return b.v - a.v || b.n - a.n; });
    var peu = L.filter(function (x) { return !(x.v != null && x.n >= MIN_CLASSEMENT); });
    var max = classes.length ? Math.max.apply(null, classes.map(function (x) { return x.v; })) || 1 : 1;
    function val(x) { return x.v == null ? "—" : (T.unite === "%" ? x.v + " %" : String(x.v).replace(".", ",")); }
    function ligne(x, rang) {
      return '<li><button class="ligne classement-l" type="button" data-a="sac-fiche-club" data-id="' + at(x.club) + '" aria-label="' + at((rang ? rang + ". " : "") + nomClub(x.club) + " : " + val(x) + " " + T.lib + ", " + pluriel(x.n, T.n) + ". Ouvrir la fiche") + '">' +
        '<span class="cl-rang">' + (rang || "") + '</span><span class="quoi"><b>' + t(nomClub(x.club)) + '</b><small>' + t(pluriel(x.n, T.n) + (tri === "utilisation" && x.parties ? " en " + pluriel(x.parties, "partie") : "")) + '</small></span>' +
        (rang ? '<span class="cl-barre" aria-hidden="true"><span style="width:' + Math.max(4, Math.round(100 * x.v / max)) + '%"></span></span>' : '<span></span>') +
        '<span class="cl-val">' + t(val(x)) + '</span></button></li>';
    }
    return '<div id="st-classements"><h3 class="titre-bloc">Classements</h3>' +
      '<div class="fenetres" role="group" aria-label="Classer les clubs par">' + TRIS_CLUBS.map(function (x) {
        return '<button class="opt" type="button" data-a="st-tri-clubs" data-v="' + x.id + '" aria-pressed="' + (x.id === tri) + '">' + t(x.court) + '</button>'; }).join("") + '</div>' +
      (classes.length ? '<ol class="liste-exos classement-clubs">' + classes.map(function (x, i) { return ligne(x, i + 1); }).join("") + '</ol>'
        : '<p class="aide">' + t("Aucun club n'a encore " + MIN_CLASSEMENT + " " + T.n + "s ou plus pour ce critère.") + '</p>') +
      (peu.length ? '<details class="aide-pli"><summary><span class="ico-info" aria-hidden="true">i</span>' + t("Peu de données, non classés (" + peu.length + ")") + '</summary><div><ul class="liste-exos classement-clubs">' + peu.map(function (x) { return ligne(x, 0); }).join("") + '</ul></div></details>' : '') +
      '<p class="aide">' + t("Un seul critère à la fois, sur la période choisie : " + T.lib + ". Classés à partir de " + MIN_CLASSEMENT + " " + T.n + "s ; pas de note globale.") + '</p></div>';
  }
  ACTIONS["st-tri-clubs"] = function (el) { ui.triClubs = el.getAttribute("data-v"); rendreEtFocus(el); };
  function clubsStatsHTML() {
    var F = filtresStats(), l = selectionStats(F), notes = clubsNotes(l, ordreClubs()), fam = departsParFamille(l);
    var h = '<section class="bloc" id="st-clubs"><h2>Profil des clubs</h2>';
    if (!notes.length && !fam.length) return h + etatVideHTML("sac", "Aucun club à profiler", "Note tes coups en saisie Expert pour suivre chaque club. En saisie Standard, le club de départ suffit pour suivre tes mises en jeu par type de club.") + '</section>';
    if (notes.length) h += classementClubsHTML(l, notes);
    h += departsFamillesHTML(fam);
    if (notes.length) {
      var ids = notes.map(function (x) { return x.club; });
      if (ids.indexOf(F.club) < 0) F.club = notes.slice().sort(function (a, b) { return b.n - a.n; })[0].club;
      if (F.club2 && (ids.indexOf(F.club2) < 0 || F.club2 === F.club)) F.club2 = "";
      h += '<h3 class="titre-bloc" id="st-comparateur">Club par club et comparateur</h3><div class="fenetres clubs-notes" role="group" aria-label="Club">' + notes.map(function (x) {
        return '<button class="opt" type="button" data-a="st-club" data-v="' + at(x.club) + '" aria-pressed="' + (x.club === F.club) + '">' + t(nomClub(x.club)) + ' <small>' + x.n + '</small></button>';
      }).join("") + '</div>';
      var A = profilClub(l, F.club);
      var ech = nomClub(F.club) + " : " + pluriel(A.n, "coup") + " noté" + (A.n > 1 ? "s" : "") + " sur " + pluriel(A.parties, "partie") + (A.premier ? ", du " + dateCourte(A.premier) + " au " + dateCourte(A.dernier) : "");
      h += '<p class="aide stats-club-echantillon">' + t(/\.$/.test(ech) ? ech : ech + ".") + '</p>';
      if (ids.length > 1) h += '<div class="champ"><label for="st-club2">Comparer avec</label><select id="st-club2" data-c="st-club2"><option value="">Aucun autre club</option>' +
        notes.filter(function (x) { return x.club !== F.club; }).map(function (x) { return '<option value="' + at(x.club) + '"' + (x.club === F.club2 ? " selected" : "") + '>' + t(nomClub(x.club) + " (" + pluriel(x.n, "coup") + ")") + '</option>'; }).join("") + '</select></div>';
      h += F.club2 ? comparaisonClubsHTML(A, profilClub(l, F.club2)) : profilClubHTML(A, false);
    } else {
      h += '<p class="aide">' + t("Aucun coup noté club par club sur ces parties : note tes coups en saisie Expert pour voir la direction et le résultat de chaque club.") + '</p>';
    }
    return h + '</section>';
  }
  ACTIONS["st-club"] = function (el) { var F = filtresStats(); F.club = el.getAttribute("data-v"); if (F.club2 === F.club) F.club2 = ""; rendreEtFocus(el); };
  CHANGEMENTS["st-club2"] = function (el) { filtresStats().club2 = el.value; rendre(); var s = document.getElementById("st-club2"); if (s) s.focus({ preventScroll: true }); };
  /* Depuis la fiche d'un club du sac : ouvre son profil dans les statistiques. */
  ACTIONS["st-voir-club"] = function (el) {
    var id = el.getAttribute("data-v"), F = filtresStats();
    if (!clubsNotes(selectionStats(F), []).some(function (x) { return x.club === id; })) { F.derniers = 0; F.format = ""; F.parcours = ""; F.debut = ""; F.fin = ""; }
    F.club = id; F.club2 = "";
    /* V4-S05 : le profil des clubs vit dans Sac (onglet Performance). */
    fermerFeuille(); ui.sacClub = null; ui.sacOnglet = "performance"; allerOnglet("sac", false);
    var s = document.getElementById("st-clubs");
    if (s) { s.scrollIntoView({ block: "start" }); var b = s.querySelector('[data-a="st-club"][aria-pressed="true"]'); if (b) b.focus({ preventScroll: true }); }
  };
