  /* ============================================================
     JOURNAL CHRONOLOGIQUE (roadmap UX, UX10)
     Parties, séries, index, cycles et défis dans une seule chronologie calculée à l'affichage (rien n'est stocké en
     double), filtrable par type, période et parcours ; chaque événement ouvre son détail ; faits marquants en tête.
     ============================================================ */
  var PERIODES_CHRONO = [{ id: "tout", lib: "Tout" }, { id: "30", lib: "30 jours" }, { id: "90", lib: "3 mois" }, { id: "saison", lib: "Saison" }];
  var NB_CHRONO = 30;
  function etatChrono() { return ui.chrono || (ui.chrono = { type: "tous", periode: "tout", parcours: "", n: NB_CHRONO }); }
  function evenementsChrono() {
    return chronologie({ parties: etat.parties, series: [], /* V4-03 : séries archivées, hors activité */ indexHist: etat.indexHist || [], cycles: etat.historique || [],
      defis: DEFIS.map(function (d) { return { id: d.id, t: d.t, hist: etatDefi(d.id).hist || [] }; }),
      nomParcours: function (id) { var pc = parcoursDe(id); return pc ? pc.nom : "Parcours supprimé"; }, nomClub: nomClub });
  }
  function bornesChrono(per) {
    var j = auj().slice(0, 10);
    if (per === "saison") return { debut: j.slice(0, 4) + "-01-01", fin: j };
    var n = parseInt(per, 10); if (!n) return {};
    return { debut: new Date(Date.parse(j + "T00:00:00Z") - (n - 1) * 864e5).toISOString().slice(0, 10), fin: j };
  }
  var MOIS_CHRONO = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
  function lienChrono(e) {
    if (e.type === "partie") return 'data-a="pt-carte" data-id="' + e.ref.partie + '"';
    if (e.type === "practice") return CLUB[e.ref.club] ? 'data-a="sac-fiche-club" data-id="' + e.ref.club + '"' : 'data-a="aller-a" data-v="sac" data-s="c-historique"';
    if (e.type === "index") return 'data-a="aller-a" data-v="profil" data-s="objectif-index"';
    if (e.ref.defi) return 'data-a="aller-a" data-v="exercices" data-s="defis"';
    return 'data-a="onglet" data-v="practice"';
  }
  var TYPE_LIB_CHRONO = { partie: "Partie", practice: "Practice", index: "Index", entrainement: "Entraînement" };
  function chronologieHTML() {
    var C = etatChrono(), tout = evenementsChrono(), B = bornesChrono(C.periode);
    var l = filtrerChronologie(tout, { type: C.type, debut: B.debut, fin: B.fin, parcours: C.parcours });
    var h = '<section class="bloc" id="c-chronologie"><h2 class="vh">Chronologie</h2>';
    if (!tout.length) return h + '<p class="aide">' + t("Rien pour l'instant : tes parties, mises à jour d'index et défis apparaîtront ici, du plus récent au plus ancien.") + '</p></section>';
    var marq = tout.filter(function (e) { return e.marquant; }).slice(0, 3);
    if (marq.length) h += '<div class="chrono-marquants"><p class="titre-liste">' + t("Faits marquants") + '</p><ul class="constats">' + marq.map(function (e) {
      return '<li><button class="lien" type="button" ' + lienChrono(e) + '>' + t(e.marquant) + '</button> ' + t("(" + dateCourte(e.d) + " · " + e.titre + ")") + '</li>';
    }).join("") + '</ul></div>';
    /* V4-09 : Tout · Parties · Entraînement en vue (index et notes restent dans « Tout ») ; période et parcours repliés. */
    var typesVus = TYPES_CHRONO.filter(function (x) { return /^(tous|partie|entrainement)$/.test(x.id) || x.id === C.type; });
    h += '<div class="fenetres periode" role="group" aria-label="Type d\'activité">' + typesVus.map(function (x) { return '<button class="opt" type="button" data-a="chrono-type" data-v="' + x.id + '" aria-pressed="' + (C.type === x.id) + '">' + t(x.lib) + '</button>'; }).join("") + '</div>' +
      '<details class="aide-pli chrono-filtres"' + (C.periode !== "tout" || C.parcours || C.filtres ? ' open' : '') + '><summary><span class="ico-info" aria-hidden="true">i</span>' + t("Période et parcours") + '</summary><div>' +
      '<div class="fenetres periode" role="group" aria-label="Période">' + PERIODES_CHRONO.map(function (x) { return '<button class="opt" type="button" data-a="chrono-periode" data-v="' + x.id + '" aria-pressed="' + (C.periode === x.id) + '">' + t(x.lib) + '</button>'; }).join("") + '</div>' +
      (etat.parcours.length > 1 ? '<div class="champ"><label for="chrono-parcours">Parcours</label><select id="chrono-parcours" data-c="chrono-parcours"><option value="">Tous les parcours</option>' +
        etat.parcours.map(function (pc) { return '<option value="' + at(pc.id) + '"' + (pc.id === C.parcours ? " selected" : "") + '>' + t(pc.nom) + '</option>'; }).join("") + '</select></div>' : '') + '</div></details>';
    h += '<p class="aide chrono-compte">' + t(l.length ? pluriel(l.length, "événement") + (l.length < tout.length ? " sur " + tout.length : "") + "." : "Aucun événement pour ces filtres.") + '</p>';
    var mois = null, vus = l.slice(0, C.n);
    h += '<ol class="chrono-liste">' + vus.map(function (e) {
      var m = e.d.slice(0, 7), titreMois = '';
      if (m !== mois) { mois = m; titreMois = '<li class="chrono-mois" aria-hidden="false"><h3>' + t(MOIS_CHRONO[+m.slice(5, 7) - 1] + " " + m.slice(0, 4)) + '</h3></li>'; }
      return titreMois + '<li class="chrono-ev type-' + e.type + (e.marquant ? " marquant" : "") + '"><button class="ligne" type="button" ' + lienChrono(e) + '>' +
        '<span class="hist-date">' + t(dateCourte(e.d)) + '</span><span class="quoi"><b>' + t(e.titre) + '</b><small>' + t(TYPE_LIB_CHRONO[e.type] + " · " + e.detail + (e.marquant ? " · " + e.marquant : "")) + '</small>' +
        (e.note ? '<small class="chrono-note">' + t("« " + e.note.slice(0, 120) + (e.note.length > 120 ? "…" : "") + " »") + '</small>' : '') + '</span><span class="chev" aria-hidden="true">›</span></button></li>';
    }).join("") + '</ol>';
    if (l.length > vus.length) h += '<button class="btn" type="button" data-a="chrono-plus">' + t("Afficher " + Math.min(NB_CHRONO, l.length - vus.length) + " de plus") + '</button>';
    return h + '</section>';
  }
  ACTIONS["chrono-type"] = function (el) { var C = etatChrono(); C.type = el.getAttribute("data-v"); C.n = NB_CHRONO; rendreEtFocus(el); };
  ACTIONS["chrono-periode"] = function (el) { var C = etatChrono(); C.filtres = true; C.periode = el.getAttribute("data-v"); C.n = NB_CHRONO; rendreEtFocus(el); };
  ACTIONS["chrono-plus"] = function () { etatChrono().n += NB_CHRONO; rendre(); };
  CHANGEMENTS["chrono-parcours"] = function (el) { etatChrono().filtres = true; etatChrono().parcours = el.value; rendre(); var s = document.getElementById("chrono-parcours"); if (s) s.focus({ preventScroll: true }); };
