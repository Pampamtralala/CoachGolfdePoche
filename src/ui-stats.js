  /* ============================================================
     STATISTIQUES : tableau de bord filtrable (roadmap DATA, P05)
     Filtres cumulables (parties, format, parcours, période libre), comparaison avec la période précédente,
     effectif sous chaque chiffre, base « ramené à 18 trous » dite en clair, GIR marqué « déduit ».
     ============================================================ */
  function filtresStats() {
    var F = ui.stats || (ui.stats = { derniers: 10, format: "", parcours: "", debut: "", fin: "", comparer: true });
    if (F.parcours && !parcoursDe(F.parcours)) F.parcours = "";
    return F;
  }
  function selectionStats(F, avant) {
    var f = { parcours: F.parcours || null, format: F.format || null, debut: F.debut || null, fin: F.fin || null };
    if (F.derniers) { f.derniers = F.derniers; if (avant) f.avant = F.derniers; }
    else if (avant) {
      /* Toutes les parties d'une période libre : comparées à la période de même durée juste avant
         (sans date de fin, la période court jusqu'à aujourd'hui, comme la saison en cours). */
      var pp = periodePrecedente(F.debut, F.fin || (F.debut ? auj() : ""));
      if (!pp) return [];
      f.debut = pp.debut; f.fin = pp.fin;
    }
    return selectionParties(partiesAnalyse(), f);
  }
  /* ---------- UX07 : filtre commun à toutes les analyses ----------
     Un seul état (ui.stats) : nombre de parties, saison (année civile en cours), toutes, format, parcours, période libre.
     Il est conservé d'un écran à l'autre ; chaque écran qui l'utilise affiche son périmètre. */
  function debutSaison() { return auj().slice(0, 4) + "-01-01"; }
  function choixPeriode(F) { F = F || filtresStats(); return F.derniers ? String(F.derniers) : F.debut === debutSaison() && !F.fin ? "saison" : !F.debut && !F.fin ? "0" : "libre"; }
  var CHOIX_PERIODE = [["5", "5 parties"], ["10", "10 parties"], ["20", "20 parties"], ["saison", "Saison"], ["0", "Toutes"]];
  /* Pastilles de période (même état partout) ; action : st-derniers par défaut, ou une action propre à une fiche. */
  function pastillesPeriodeHTML(action) {
    var c = choixPeriode();
    return '<div class="fenetres periode" role="group" aria-label="Période">' + CHOIX_PERIODE.map(function (x) { return puceStat(action || "st-derniers", x[0], x[1], c === x[0]); }).join("") + '</div>';
  }
  function appliquerPeriode(v) {
    var F = filtresStats();
    if (v === "saison") { F.derniers = 0; F.debut = debutSaison(); F.fin = ""; }
    else { var n = parseInt(v, 10) || 0; F.derniers = n; if (!n || F.debut === debutSaison()) { F.debut = ""; F.fin = ""; } }
    return F;
  }
  /* Périmètre en clair : effectif, dates, format, parcours. */
  function perimetreTexte(l) {
    var F = filtresStats(), T = l.reduce(function (n, p) { return n + p.trous.length; }, 0);
    if (!l.length) return "Aucune partie dans ce périmètre.";
    var pc = F.parcours && parcoursDe(F.parcours);
    return "Sur " + pluriel(l.length, "partie") + " (" + T + " trous), " + periodeLib(l[0].d.slice(0, 10), l[l.length - 1].d.slice(0, 10)).replace(/\.$/, "") +
      (F.format ? ", " + F.format + " trous seulement" : "") + (pc ? ", à " + pc.nom : "") + ".";
  }
  /* L'ouverture de « Plus de filtres » est gardée d'un rendu à l'autre. */
  document.addEventListener("toggle", function (ev) { var d = ev.target; if (d && d.classList && d.classList.contains("plus-filtres")) ui.plusFiltres = d.open; }, true);
  function partiesFiltrees() { return selectionStats(filtresStats()); }
  /* Nombre de parties pour les écrans qui raisonnent en « N dernières parties » (objectifs, tendances). */
  function fenetreCommune() { var F = filtresStats(); return F.derniers || partiesFiltrees().length || 5; }
  function nbStat(v, signe) { return v == null ? "–" : (signe && v > 0 ? "+" : "") + String(v).replace(".", ",").replace("-", "−"); }
  function tendanceStat(c) {
    if (!c) return "";
    if (!c.mieux) return '<span class="tend stable">= stable</span>';
    /* UX14 : le sens est dit en mots (lecteurs d'écran, daltonisme), pas seulement par la couleur. */
    return '<span class="tend ' + (c.mieux > 0 ? "mieux" : "moins") + '" title="' + (c.mieux > 0 ? "mieux" : "moins bien") + '">' + (c.d > 0 ? "▲ " : "▼ ") + nbStat(Math.abs(c.d)) + '<span class="vh">' + (c.mieux > 0 ? " (mieux)" : " (moins bien)") + '</span></span>';
  }
  function puceStat(action, v, lib, actif) { return '<button class="opt" type="button" data-a="' + action + '" data-v="' + v + '" aria-pressed="' + actif + '">' + t(lib) + '</button>'; }

  /* Score de chaque partie, écart au par ramené à 18 trous : barres au-dessus (en bleu) ou au-dessous du par. */
  /* legende : remplace « ramené à 18 trous » quand les écarts sont bruts (un seul tracé). */
  function grapheScoresHTML(l, legende) {
    if (l.length < 2) return "";
    var W = 320, H = 120, pad = 18, max = 0;
    l.forEach(function (x) { max = Math.max(max, Math.abs(x.ecart18)); });
    max = Math.max(4, Math.ceil(max / 4) * 4);
    var y0 = H / 2, ky = (H / 2 - pad) / max, bw = Math.min(22, (W - 20) / l.length - 4);
    var h = '<figure class="graphe-scores"><svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + at((legende || "Écart au par de chaque partie, ramené à 18 trous") + " : " + l.map(function (x) { return dateCourte(x.d) + " " + nbStat(x.ecart18, true); }).join(" ; ")) + '">' +
      '<line class="gs-par" x1="0" x2="' + W + '" y1="' + y0 + '" y2="' + y0 + '"/><text class="gs-lib" x="2" y="' + (y0 - 4) + '">par</text>';
    l.forEach(function (x, i) {
      var cx = 20 + (i + 0.5) * (W - 20) / l.length, hgt = Math.max(1.5, Math.abs(x.ecart18) * ky), y = x.ecart18 >= 0 ? y0 - hgt : y0;
      h += '<rect class="gs-barre' + (x.ecart18 < 0 ? " sous" : "") + '" x="' + (cx - bw / 2).toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + hgt.toFixed(1) + '" rx="3"><title>' + at(dateCourte(x.d) + " · " + x.score + " coups sur " + x.trous + " trous · " + nbStat(x.ecart18, true) + (legende ? " au par" : " sur 18")) + '</title></rect>';
    });
    return h + '</svg><figcaption>' + t(legende ? legende + " (" + l.length + "). Une barre haute : plus de coups." : "Écart au par de chaque partie (" + l.length + "), ramené à 18 trous. Une barre haute : plus de coups.") + '</figcaption></figure>';
  }
  /* Une barre empilée gauche / centre (ou jouable) / droite, avec les effectifs écrits. */
  function barreRepartitionHTML(titre, parts, n, note) {
    var total = parts.reduce(function (a, x) { return a + x.v; }, 0);
    if (!total) return "";
    return '<div class="repartition"><p class="rep-titre">' + t(titre) + ' <small>' + t("sur " + n) + '</small></p><div class="rep-barre" role="img" aria-label="' + at(titre + " : " + parts.map(function (x) { return x.lib + " " + x.v; }).join(", ")) + '">' +
      parts.map(function (x) { return x.v ? '<span class="' + x.c + '" style="flex:' + x.v + '">' + x.v + '</span>' : ''; }).join("") + '</div>' +
      '<p class="rep-leg">' + parts.map(function (x) { return '<span><i class="' + x.c + '"></i>' + t(x.lib + " " + Math.round(100 * x.v / total) + " %") + '</span>'; }).join("") + '</p>' +
      (note ? '<p class="aide">' + t(note) + '</p>' : '') + '</div>';
  }

  /* Répartitions gauche / centre / droite : mises en jeu renseignées et direction des coups notés (UX06 : réutilisées par la rubrique Mises en jeu). */
  function repartitionsStatsHTML(l, A) {
    var h = '';
    /* Gauche / droite : mises en jeu ratées (renseignées) et direction des coups notés en expert. */
    var M = A.mej;
    h += barreRepartitionHTML("Mises en jeu", [{ lib: "Ratées à gauche", v: M.gauche, c: "g" }, { lib: "Jouables", v: M.jouables, c: "c" }, { lib: "Courtes", v: M.courtes, c: "k" }, { lib: "Ratées à droite", v: M.droite, c: "d" }],
      pluriel(M.n, "départ") + " renseigné" + (M.n > 1 ? "s" : ""), M.ratees > M.gauche + M.droite + M.courtes ? (M.ratees - M.gauche - M.droite - M.courtes) + " ratées sans côté noté." : "");
    var obs = observationsGolf(l, null, etat.parcours), dirs = croiserObservations(obs, "type", { type: "coup" })[0];
    if (dirs && dirs.direction.n) h += barreRepartitionHTML("Direction des coups notés", [{ lib: "Gauche", v: dirs.direction.gauche, c: "g" }, { lib: "Dans l'axe", v: dirs.direction.centre, c: "c" }, { lib: "Droite", v: dirs.direction.droite, c: "d" }],
      pluriel(dirs.direction.n, "coup") + " avec direction", "À plus de 5 m de la ligne de visée : gauche ou droite. " + (dirs.n - dirs.direction.n) + " coups sans direction notée.");
    return h;
  }
  /* UX06 : mode « filtres » → le filtre commun et la ligne d'échantillon (en tête de chaque rubrique d'Analyses) ;
     mode « contenu » → le reste (chiffres, graphique, répartitions, index). */
  function tableauStatsHTML(mode) {
    var F = filtresStats(), l = selectionStats(F), A = tableauStats(l);
    var PP = !F.derniers ? periodePrecedente(F.debut, F.fin || (F.debut ? auj() : "")) : null, comparable = F.derniers || PP;
    var B = F.comparer && comparable ? tableauStats(selectionStats(F, true)) : null, C = B && B.parties ? comparerStats(A, B) : null;
    var h = '<div class="filtres-stats">' +
      pastillesPeriodeHTML() +
      /* UX06 : format, parcours, période libre et comparaison repliés ; ouverts dès qu'un réglage n'est pas celui par défaut. */
      '<details class="plus-filtres"' + (F.format || F.parcours || F.debut && F.debut !== debutSaison() || F.fin || F.comparer === false || ui.plusFiltres ? " open" : "") + '><summary>' + t("Plus de filtres") + '</summary>' +
      '<div class="fenetres" role="group" aria-label="Format">' + [["", "9 et 18 trous"], ["9", "9 trous"], ["18", "18 trous"]].map(function (x) { return puceStat("st-format", x[0], x[1], F.format === x[0]); }).join("") + '</div>' +
      (etat.parcours.length ? '<div class="champ"><label for="st-parcours">Parcours</label><select id="st-parcours" data-c="st-parcours"><option value="">Tous les parcours</option>' +
        etat.parcours.map(function (pc) { return '<option value="' + at(pc.id) + '"' + (pc.id === F.parcours ? " selected" : "") + '>' + t(pc.nom) + '</option>'; }).join("") + '</select></div>' : '') +
      '<details class="periode-libre"' + (F.debut || F.fin ? " open" : "") + '><summary>Période libre</summary><div class="duo">' +
        '<div class="champ"><label for="st-debut">Du</label><input id="st-debut" type="date" data-c="st-debut" value="' + at(F.debut || "") + '"></div>' +
        '<div class="champ"><label for="st-fin">Au</label><input id="st-fin" type="date" data-c="st-fin" value="' + at(F.fin || "") + '"></div></div>' +
        (F.debut || F.fin ? '<button class="lien" type="button" data-a="st-periode-effacer">Effacer la période</button>' : '') + '</details>' +
      (comparable ? '<label class="case"><input type="checkbox" data-c="st-comparer"' + (F.comparer ? " checked" : "") + '> ' + t(F.derniers ? "Comparer avec les " + F.derniers + " parties précédentes" : "Comparer avec les " + PP.jours + " jours précédents, du " + dateCourte(PP.debut) + " au " + dateCourte(PP.fin)) + '</label>' : '') + '</details></div>';
    if (!A.parties) return h + etatVideHTML("stats", "Aucune partie pour ces filtres", etat.parties.length ? "Élargis la période, le format ou le parcours." : "Note une partie : score, putts et pénalités suffisent pour démarrer.", etat.parties.length ? "" : "partie-rapide", "Lancer une partie");
    var mixte = A.parties9 && A.parties18;
    h += '<p class="aide stats-echantillon">' + t("Sur " + pluriel(A.parties, "partie") + " (" + A.trous + " trous), " + periodeLib(A.premiere, A.derniere) + (/\.$/.test(periodeLib(A.premiere, A.derniere)) ? "" : ".") +
      (C ? (F.derniers ? " Comparé aux " + pluriel(B.parties, "partie") + " précédentes (" + B.trous + " trous)." : " Comparé à la période précédente : " + pluriel(B.parties, "partie") + " (" + B.trous + " trous).") : F.comparer && comparable ? (F.derniers ? " Pas de parties précédentes à comparer." : " Aucune partie sur la période précédente.") : "") +
      (mixte ? " Parties de 9 et de 18 trous : les chiffres sont ramenés à 18 trous." : "")) + '</p>';
    if (mode === "filtres") return h;
    var debutContenu = h.length;
    var cartes = [
      { t: "Score", v: nbStat(A.ecart18, true), u: "écart au par, ramené à 18 trous", tend: C && tendanceStat(C.ecart18),
        x: (A.scoreBrut18 != null ? "18 trous : " + nbStat(A.scoreBrut18) + " coups en moyenne (" + A.parties18 + "). " : "") + (A.scoreBrut9 != null ? "9 trous : " + nbStat(A.scoreBrut9) + " (" + A.parties9 + ")." : ""), n: A.trousScore + " trous avec score" },
      { t: "Putts", v: nbStat(A.putts18), u: "par 18 trous", tend: C && tendanceStat(C.putts18), x: nbStat(A.puttsParTrou) + " par trou · " + nbStat(A.partUnPutt) + " % de trous à un putt.", n: A.trous + " trous" },
      { t: "Trois-putts", v: nbStat(A.troisPutts18), u: "par 18 trous", tend: C && tendanceStat(C.troisPutts18), x: A.troisPutts + " en tout, " + nbStat(A.partTroisPutts) + " % des trous.", n: A.trous + " trous" },
      { t: "Pénalités", v: nbStat(A.penalites18), u: "coups par 18 trous", tend: C && tendanceStat(C.penalites18), x: A.penalites + " coups de pénalité en tout.", n: A.trous + " trous" },
      { t: "Mises en jeu", v: A.mej.part == null ? "–" : A.mej.part + " %", u: "jouables, par 4 et par 5", tend: C && tendanceStat(C.mej),
        x: A.mej.n ? A.mej.jouables + " jouables sur " + A.mej.n + " renseignées." + (A.mej.inconnues ? " " + A.mej.inconnues + " non renseignées (saisie express), non comptées." : "") : "Aucune mise en jeu renseignée : passe en saisie standard.", n: A.mej.n + " départs" },
      { t: "Greens en régulation", v: nbStat(A.gir18), u: "par 18 trous · déduit", tend: C && tendanceStat(C.gir18), x: "Déduit du score et des putts, pas observé : " + nbStat(A.partGir) + " % des trous.", n: A.trous + " trous" }];
    h += kpisHTML(cartes.map(function (x) { return { t: x.t, v: x.v, u: x.u, tend: x.tend, n: x.n, aide: x.x || null, aideTitre: "Détail" }; }));
    h += grapheScoresHTML(A.parPartie);
    h += repartitionsStatsHTML(l, A);
    /* Évolution de l'index : toute l'histoire, quels que soient les filtres. */
    var ci = courbeIndexHTML(null, 300, 70);
    if (ci) h += '<div class="carte-tb evol-index"><p class="surtitre">Évolution de ton index</p>' + ci + '<p class="aide">Toutes les parties, quels que soient les filtres.</p></div>';
    return mode === "contenu" ? h.slice(debutContenu) : h;
  }
  ACTIONS["st-derniers"] = function (el) { appliquerPeriode(el.getAttribute("data-v")); rendreEtFocus(el); };
  ACTIONS["st-format"] = function (el) { filtresStats().format = el.getAttribute("data-v") || ""; rendreEtFocus(el); };
  ACTIONS["st-periode-effacer"] = function () { var F = filtresStats(); F.debut = ""; F.fin = ""; rendre(); };
  CHANGEMENTS["st-parcours"] = function (el) { filtresStats().parcours = el.value; rendre(); var s = document.getElementById("st-parcours"); if (s) s.focus({ preventScroll: true }); };
  CHANGEMENTS["st-debut"] = function (el) { filtresStats().debut = /^\d{4}-\d{2}-\d{2}$/.test(el.value) ? el.value : ""; rendre(); };
  CHANGEMENTS["st-fin"] = function (el) { filtresStats().fin = /^\d{4}-\d{2}-\d{2}$/.test(el.value) ? el.value : ""; rendre(); };
  CHANGEMENTS["st-comparer"] = function (el) { filtresStats().comparer = !!el.checked; rendre(); };
