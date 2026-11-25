  /* ============================================================
     MES DONNÉES (roadmap DATA, P04)
     Ce que contient le carnet et d'où vient chaque donnée ; exclure une partie ou un coup des calculs
     sans rien supprimer ; vérifier les distances inhabituelles ; sauvegarder tout, cartes GPS comprises.
     ============================================================ */
  function ligneInventaire(lib, v, sous) {
    return '<tr><th scope="row">' + t(lib) + (sous ? '<small>' + t(sous) + '</small>' : '') + '</th><td class="num">' + t(String(v)) + '</td></tr>';
  }
  function partieLib(p) {
    var pc = parcoursDe(p.pc), sc = scorePartie(p);
    return dateCourte(p.d) + (pc ? " · " + pc.nom : "") + " · " + p.trous.length + " trous" + (sc.complet ? " · " + sc.coups : "");
  }
  function mesDonneesHTML() {
    var I = inventaireDonnees(etat.parties, etat.carnet, Object.keys(cartesStock()).length), D = I.distances;
    var h = '<button class="voile" type="button" data-a="fermer-feuille" aria-label="Fermer" tabindex="-1"></button>' +
      '<section class="feuille mes-donnees" role="dialog" aria-modal="true" aria-labelledby="f-titre" id="feuille">' +
      '<header><p class="surtitre">Provenance et sauvegarde</p><h2 id="f-titre">Mes données</h2><button class="fermer" type="button" data-a="fermer-feuille" id="f-fermer">Fermer</button></header>';
    /* Stockage */
    var panne = stockageEnPanne();
    h += '<p class="md-statut' + (panne ? ' alerte' : '') + '"' + (panne ? ' role="alert"' : '') + '>' + t(texteStatut()) + '</p>';
    /* Inventaire */
    h += '<h3 class="titre-bloc">Ce que contient ton carnet</h3><div class="defile"><table class="carte-score inventaire"><tbody>' +
      ligneInventaire("Parties", I.parties, I.exclues ? I.exclues + " exclue" + (I.exclues > 1 ? "s" : "") + " des calculs" : "") +
      ligneInventaire("Trous joués avec un score", I.trous, I.trousSansScore ? I.trousSansScore + " sans score, non comptés" : "") +
      ligneInventaire("Mises en jeu renseignées", I.mej + " / " + I.mejPossibles, "sur les par 4 et 5 joués") +
      ligneInventaire("Premiers putts notés", I.premiersPutts, "longueur, en Standard ou Expert") +
      ligneInventaire("Coups notés", I.coups, I.coupsExclus ? I.coupsExclus + " exclu" + (I.coupsExclus > 1 ? "s" : "") + " des calculs" : "") +
      ligneInventaire("Directions connues", I.directions, "gauche ou droite notée sur un coup") +
      ligneInventaire("Distances GPS", D.gps, "roulé compris, approximatives") +
      ligneInventaire("Distances déclarées", D.declaree, "tapées par toi") +
      ligneInventaire("Distances estimées", D.estimee, "jamais dans les moyennes") +
      ligneInventaire("Coups sans distance", D.inconnue, "") +
      ligneInventaire("Séances de practice", I.seances, "") +
      ligneInventaire("Cartes GPS de parcours", I.cartes, "gardées sur cet appareil") +
      '</tbody></table></div>';
    /* Distances à vérifier */
    var S = distancesSuspectes(etat.parties);
    h += '<h3 class="titre-bloc">Distances à vérifier</h3>';
    if (S.length) {
      h += '<p class="aide">' + t("Loin de ce que tu tapes d'habitude avec le même club (moins de 60 % ou plus de 140 % de ta médiane). Exclure ne supprime rien : tu peux réintégrer à tout moment.") + '</p><ul class="md-liste">' +
        S.slice(0, 12).map(function (x) {
          var att = ' data-p="' + x.partie + '" data-k="' + x.k + '" data-ci="' + x.ci + '"';
          return '<li><p>' + t(nomClub(x.club) + " · " + x.d + " m" + (x.gps ? " (GPS)" : "") + (x.jour ? " · " + dateCourte(x.jour) : "")) + '<small>' + t("Ta médiane : " + x.mediane + " m sur " + x.n + " mesures.") + '</small></p>' +
            '<div class="ligne-btn"><button class="btn" type="button" data-a="md-coup-exclure"' + att + '>Exclure des calculs</button><button class="btn" type="button" data-a="md-coup-ok"' + att + '>C’est juste</button></div></li>';
        }).join("") + '</ul>' + (S.length > 12 ? '<p class="aide">' + t((S.length - 12) + " autres à vérifier ensuite.") + '</p>' : '');
    } else h += '<p class="aide">' + t("Aucune distance inhabituelle. La comparaison commence à " + MIN_SUSPECT + " mesures d'un même club.") + '</p>';
    /* Coups exclus */
    var exclus = [];
    etat.parties.forEach(function (p, pi) { (p.coups || []).forEach(function (l, k) { (l || []).forEach(function (c, ci) { if (c && c.x) exclus.push({ p: p, pi: pi, k: k, ci: ci, c: c }); }); }); });
    if (exclus.length) h += '<h3 class="titre-bloc">Coups exclus des calculs</h3><ul class="md-liste">' + exclus.map(function (x) {
      return '<li><p>' + t(nomClub(x.c.c) + (x.c.d ? " · " + x.c.d + " m" : "") + " · " + dateCourte(x.p.d) + " · trou " + numeroTrou(x.p, x.k)) + '</p><div class="ligne-btn"><button class="btn" type="button" data-a="md-coup-reintegrer" data-p="' + x.pi + '" data-k="' + x.k + '" data-ci="' + x.ci + '">Réintégrer</button></div></li>';
    }).join("") + '</ul>';
    /* Parties */
    if (etat.parties.length) {
      var idx = [];
      for (var i = etat.parties.length - 1; i >= 0; i--) if (idx.length < 20 || etat.parties[i].exclue) idx.push(i);
      h += '<h3 class="titre-bloc">Tes parties</h3><p class="aide">' + t("Corrige une partie (trous, mises en jeu, coups, directions) ou exclus-la des statistiques sans l'effacer.") + '</p><ul class="md-liste md-parties">' +
        idx.map(function (i) {
          var p = etat.parties[i];
          return '<li' + (p.exclue ? ' class="exclue"' : '') + '><p>' + t(partieLib(p)) + (p.exclue ? '<small>' + t("Exclue des calculs") + '</small>' : '') + '</p><div class="ligne-btn">' +
            '<button class="btn" type="button" data-a="pt-editer" data-v="' + i + '">Corriger</button>' +
            '<button class="btn" type="button" data-a="md-partie" data-v="' + i + '" aria-pressed="' + !!p.exclue + '">' + (p.exclue ? "Réintégrer" : "Exclure des calculs") + '</button></div></li>';
        }).join("") + '</ul>' + (etat.parties.length > idx.length ? '<p class="aide">' + t("Les parties plus anciennes sont dans le carnet.") + '</p>' : '');
    }
    /* Sauvegarde */
    h += '<h3 class="titre-bloc">Sauvegarde complète</h3><p class="aide">' + t("Le fichier et le texte contiennent toutes tes données, y compris les cartes GPS de tes parcours. Une restauration remplace les données de cet appareil.") + '</p>' +
      '<div class="ligne-btn"><button class="btn" type="button" data-a="exporter-fichier">Télécharger mes données (.json)</button><label class="btn" for="md-importer">Restaurer un fichier<input id="md-importer" type="file" accept=".json,application/json" data-c="importer-fichier" class="vh"></label>' +
      '<button class="btn" type="button" data-a="exporter">Copier une sauvegarde</button><button class="btn" type="button" data-a="importer">Restaurer un texte</button></div>';
    return h + '</section>';
  }
  function coupCible(el) {
    var p = etat.parties[+el.getAttribute("data-p")], k = +el.getAttribute("data-k"), ci = +el.getAttribute("data-ci");
    return p && p.coups && p.coups[k] && p.coups[k][ci] ? p.coups[k][ci] : null;
  }
  function apresModifDonnees(msg) {
    var f = document.getElementById("feuille"), y = f ? f.scrollTop : 0;
    sauverPuis(msg, "Modification faite, mais pas enregistrée sur cet appareil : exporte une sauvegarde.");
    rendre(); rendreFeuille();
    f = document.getElementById("feuille"); if (f) f.scrollTop = y;
    var b = document.getElementById("f-fermer"); if (b && document.activeElement === document.body) b.focus({ preventScroll: true });
  }
  ACTIONS["md-ouvrir"] = function (el) { ui.retourFocus = el; ui.feuille = { donnees: true }; rendreFeuille(); var b = document.getElementById("f-fermer"); if (b) b.focus(); };
  ACTIONS["md-coup-exclure"] = function (el) { var c = coupCible(el); if (!c) return; c.x = 1; delete c.ok; apresModifDonnees("Coup exclu des calculs. Rien n’est supprimé."); };
  ACTIONS["md-coup-ok"] = function (el) { var c = coupCible(el); if (!c) return; c.ok = 1; apresModifDonnees("Distance gardée : elle ne sera plus signalée."); };
  ACTIONS["md-coup-reintegrer"] = function (el) { var c = coupCible(el); if (!c) return; delete c.x; apresModifDonnees("Coup réintégré dans les calculs."); };
  ACTIONS["md-partie"] = function (el) {
    var p = etat.parties[+el.getAttribute("data-v")]; if (!p) return;
    if (p.exclue) delete p.exclue; else p.exclue = 1;
    majIndicateursParties();
    apresModifDonnees(p.exclue ? "Partie exclue des calculs. Elle reste dans ton carnet." : "Partie réintégrée dans les calculs.");
    var b = document.querySelector('#feuille [data-a="md-partie"][data-v="' + el.getAttribute("data-v") + '"]'); if (b) b.focus({ preventScroll: true });
  };
