  /* ============================================================
     DÉFIS : séries sans faute et comptages, avec niveaux, essais et record
     ============================================================ */
  function etatDefi(id) { return etat.defis[id] || defiNeuf(); }

  /* Liste des défis, en tête de l'onglet Exercices. */
  function defisHTML(dom) {
    var l = DEFIS.filter(function (d) { return dom === "tous" || d.d === dom; });
    if (!l.length) return "";
    var h = '<section class="bloc" id="defis" style="border-top:0;padding-top:0"><h2>Défis</h2>' +
      '<p class="aide">Trois niveaux à valider par défi.</p><ul class="liste-exos defis">';
    l.forEach(function (df) {
      var D = etatDefi(df.id), n = df.niveaux.length;
      var sous = DOM[df.d].nom + " · " + (D.niv >= n ? "bouclé" : "niveau " + (D.niv + 1) + " : " + df.niveaux[D.niv].nom) + (D.essais ? " · record " + D.record : "");
      h += '<li><button class="ligne" type="button" data-a="defi" data-id="' + df.id + '" aria-label="' + at(df.t + ", " + D.niv + " niveau" + (D.niv > 1 ? "x" : "") + " sur " + n) + '">' +
        '<span class="min">' + D.niv + '<small>sur ' + n + '</small></span><span class="quoi"><b>' + t(df.t) + '</b><small>' + t(sous) + '</small></span><span class="chev" aria-hidden="true">›</span></button></li>';
    });
    return h + '</ul></section>';
  }

  function texteEvt(df, evt) {
    var n = df.niveaux.length, bilan = df.mode === "compte" && df.ex && EX[df.ex] && EX[df.ex].score && EX[df.ex].score.ind ? " Ton bilan est à jour." : "";
    if (evt.type === "reussi") {
      if (evt.niveau) return (evt.nb > 1 ? "Niveaux " + (evt.niveau - evt.nb + 1) + " à " + evt.niveau + " validés." : "Niveau " + evt.niveau + " validé.") + (evt.niveau < n ? " Niveau suivant : " + df.niveaux[evt.niveau].nom + "." : " Défi bouclé : rejoue-le pour garder la main.") + bilan;
      return (df.mode === "serie" ? "Série complète : " + evt.v + " sur " + evt.cible + "." : evt.v + " sur " + df.n + " : objectif tenu.") + bilan;
    }
    if (df.mode === "serie") return evt.v ? "Série arrêtée à " + evt.v + ". Nouvel essai." : "Raté d'entrée. Nouvel essai.";
    return evt.v + " sur " + df.n + ". Il en fallait " + evt.cible + " pour valider le niveau." + bilan;
  }

  /* Écran d'un défi, dans le calque des fiches. */
  function defiHTML(id) {
    var df = DEFI[id], D = etatDefi(id), pal = palierDe(etat.profil.index), n = df.niveaux.length;
    var nv = niveauVise(df, D), cible = df.niveaux[nv - 1].cible, boucle = D.niv >= n, c = D.cours, evt = ui.defiEvt;
    var h = '<button class="voile" type="button" data-a="fermer-feuille" aria-label="Fermer le défi" tabindex="-1"></button>' +
      '<section class="feuille defi" role="dialog" aria-modal="true" aria-labelledby="f-titre" id="feuille">' +
      '<header><p class="surtitre">' + t("Défi · " + DOM[df.d].nom + " · " + nomLieu(df.lieu)) + '</p><h2 id="f-titre">' + t(df.t) + '</h2>' +
      '<button class="fermer" type="button" data-a="fermer-feuille" id="f-fermer">Fermer</button></header>' +
      '<p class="but">' + t(df.but) + '</p>';

    h += '<ol class="niveaux">' + df.niveaux.map(function (x, i) {
      var fait = i < D.niv, ici = !boucle && i === nv - 1;
      var suite = fait ? "validé " + (D.parNiv[i] === 1 ? "au premier essai" : "au " + D.parNiv[i] + "e essai")
        : ici ? "en cours" + (D.eN ? " · " + pluriel(D.eN, "essai") : "") : "à débloquer";
      return '<li' + (ici ? ' class="ici"' : '') + '><span class="trou' + (fait ? " fait" : "") + '" aria-hidden="true">' + (fait ? TRAIT : "") + '</span>' +
        '<b>' + t("Niveau " + (i + 1) + " · " + x.nom) + '</b><small>' + t(suite) + '</small></li>';
    }).join("") + '</ol>';

    /* Comptage terminé : la série jouée reste affichée jusqu'à ce que le joueur relance. */
    var fini = df.mode === "compte" && !c && !!evt && Array.isArray(evt.l);
    h += '<div class="jeu">';
    if (evt) h += '<p class="evt' + (evt.type === "reussi" ? " ok" : "") + '" role="status">' + t(texteEvt(df, evt) + (evt.s != null ? " Temps : " + dureeChrono(evt.s) + "." : "")) + '</p>';
    if (df.chrono) h += chronoHTML(D, evt);
    if (df.mode === "serie") {
      h += '<p class="compteur" aria-live="polite"><span class="main">' + (c ? c.s : 0) + '</span><span class="sur">sur ' + cible + '</span><span class="lib">' + t(df.lib) + '</span></p>';
    } else {
      var l = c ? c.l : fini ? evt.l : [];
      h += '<ol class="coups" aria-label="' + at("Coups joués : " + l.length + " sur " + df.n) + '">';
      for (var i = 0; i < df.n; i++) {
        h += '<li class="' + (i < l.length ? (l[i] ? "ok" : "ko") : i === l.length ? "ici" : "") + '">' + (i < l.length ? (l[i] ? TRAIT : "×") : i + 1) + '</li>';
      }
      h += '</ol><p class="compteur" aria-live="polite"><span class="main">' + somme(l) + '</span><span class="sur">' + t(df.lib) + '</span>' +
        '<span class="lib">' + t("objectif du niveau : " + cible + " sur " + df.n) + '</span></p>';
    }
    h += (fini ? '<button class="btn principal xl large" type="button" data-a="defi-rejouer">' + t("Rejouer " + df.n + " coups") + '</button>'
      : '<div class="duo"><button class="btn principal xl" type="button" data-a="defi-coup" data-v="1">' + t(df.oui) + '</button>' +
      '<button class="btn xl" type="button" data-a="defi-coup" data-v="0">' + t(df.non) + '</button></div>') +
      '<div class="ligne-liens"><button class="lien" type="button" data-a="defi-annuler"' + (ui.pile.length ? "" : " disabled") + '>Annuler le dernier coup</button>' +
      (df.mode === "serie" && c && (c.e || c.s) ? '<button class="lien" type="button" data-a="defi-fin">Terminer la séance</button>' : '') + '</div></div>';

    var taux = D.coups ? Math.round(100 * D.ok / D.coups) : null;
    h += '<dl class="stats"><div><dt>Essais</dt><dd>' + D.essais + '</dd></div><div><dt>' + t(df.coup) + '</dt><dd>' + D.coups + '</dd></div>' +
      '<div><dt>Réussite</dt><dd>' + (taux == null ? "–" : taux + "&nbsp;%") + '</dd></div>' +
      '<div><dt>' + (df.mode === "serie" ? "Meilleure série" : "Meilleur score") + '</dt><dd>' + D.record + '</dd></div>' +
      (df.chrono ? '<div><dt>Meilleur temps</dt><dd>' + (D.temps ? dureeChrono(D.temps) : "–") + '</dd></div>' : '') + '</dl>';
    if (D.hist.length >= 2) { var dh = D.hist.slice(-12), n0 = D.hist.length - dh.length; h += '<h3>Tes derniers essais</h3>' + courbe(dh.map(function (x) { return x.v; }), cible, dh.map(function (x, i) { return "Essai " + (n0 + i + 1); }), "defi-" + id); }

    var adapt = df.ex && EX[df.ex] && EX[df.ex].palier && EX[df.ex].palier[pal] && df.id !== "cadran" ? EX[df.ex].palier[pal] : null;
    h += '<details open><summary>Règles du défi</summary><ol class="regles">' + df.regles.map(function (x) { return '<li>' + L(x) + '</li>'; }).join("") + '</ol>' +
      (adapt ? '<div class="palier-adapt"><b>À ton palier</b>' + L(adapt) + '</div>' : '') + '</details>';
    return h + '</section>';
  }

  /* ---------- Chronomètre des défis de putting ----------
     Il part au premier coup de l'essai et s'arrête au dernier ; le meilleur temps d'un essai réussi est gardé. */
  function dureeChrono(s) { return s < 60 ? s + " s" : Math.floor(s / 60) + " min " + (s % 60 < 10 ? "0" : "") + (s % 60) + " s"; }
  function chronoHTML(D, evt) {
    var t0 = D.cours && D.cours.t0, fini = evt && evt.s != null;
    var s = t0 ? Math.max(0, Math.round((Date.now() - t0) / 1000)) : fini ? evt.s : 0;
    return '<p class="chrono' + (t0 ? " actif" : "") + '"' + (t0 ? ' data-t0="' + t0 + '"' : '') + '><span class="vh">Chronomètre : </span><span class="main">' + horloge(s) + '</span>' +
      '<small>' + t(t0 ? "en cours" : fini ? "temps de l'essai" : "part au premier coup") + '</small></p>';
  }
  function horloge(s) { return Math.floor(s / 60) + ":" + (s % 60 < 10 ? "0" : "") + (s % 60); }
  setInterval(function () {
    var c = document.querySelector("#feuille .chrono[data-t0] .main"); if (!c) return;
    var t0 = parseInt(c.parentNode.getAttribute("data-t0"), 10);
    c.textContent = horloge(Math.max(0, Math.round((Date.now() - t0) / 1000)));
  }, 1000);

  /* État avant un coup, pour pouvoir l'annuler : le défi, et le score d'exercice qu'il alimente. */
  function indDuDefi(df) { return df.ex && EX[df.ex] && EX[df.ex].score ? EX[df.ex].score.ind || null : null; }
  function instantaneDefi(df) {
    var ind = indDuDefi(df);
    return JSON.stringify({ D: etat.defis[df.id] || null, sc: df.ex ? (etat.scores[df.ex] || null) : null, ind: ind ? etat.profil.indicateurs[ind] : null });
  }
  function defiOuvert() { var f = ui.feuille; return f && f.defi && DEFI[f.defi] ? DEFI[f.defi] : null; }
  function focusDefi(sel) { var b = document.querySelector("#feuille " + sel); if (b) b.focus({ preventScroll: true }); }

  ACTIONS.defi = function (el) {
    var id = el.getAttribute("data-id"); if (!DEFI[id]) return;
    if (!ui.feuille) ui.retourFocus = el;
    ui.feuille = { defi: id }; ui.pile = []; ui.defiEvt = null; ui.recordEssai = null;
    rendreFeuille(); focusDefi("#f-fermer");
    var f = document.getElementById("feuille"); if (f) f.scrollTop = 0;
  };
  ACTIONS["defi-coup"] = function (el) {
    var df = defiOuvert(); if (!df) return;
    ui.pile.push(instantaneDefi(df)); if (ui.pile.length > 20) ui.pile.shift();
    var D = etat.defis[df.id] = etat.defis[df.id] || defiNeuf(), v = el.getAttribute("data-v");
    /* Record au début de l'essai en cours, pour savoir s'il a été battu à la fin. */
    var debut = !D.cours || (df.mode === "serie" ? D.cours.s === 0 : D.cours.l.length === 0), essaisAvant = D.essais, tempsAvant = D.temps;
    if (debut || ui.recordEssai == null) ui.recordEssai = D.record;
    var evt = defiCoup(df, D, v === "1", auj(), Date.now());
    if (evt && df.mode === "compte" && df.ex) noterScoreExo(df.ex, evt.v);
    ui.defiEvt = evt;
    sauver(); rendreFeuille(); focusDefi('[data-a="defi-coup"][data-v="' + (v === "1" ? "1" : "0") + '"]');
    /* Niveau validé, défi bouclé ou record battu : le tampon. */
    if (evt && evt.type === "reussi" && evt.niveau) {
      if (evt.niveau >= df.niveaux.length) feter("défi bouclé", df.t, "Les " + df.niveaux.length + " niveaux sont validés.");
      else feter("validé", "Niveau " + evt.niveau + " validé", df.t + ". Niveau suivant : " + df.niveaux[evt.niveau].nom + ".");
    } else if (evt && essaisAvant > 0 && D.record > ui.recordEssai) {
      feter("record", "Nouveau record : " + D.record, df.t + ".");
    } else if (evt && evt.s != null && evt.type === "reussi" && tempsAvant != null && D.temps < tempsAvant) {
      feter("record", "Meilleur temps : " + dureeChrono(D.temps), df.t + ".");
    }
  };
  ACTIONS["defi-annuler"] = function () {
    var df = defiOuvert(); if (!df || !ui.pile.length) return;
    var s = JSON.parse(ui.pile.pop()), ind = indDuDefi(df);
    if (s.D) etat.defis[df.id] = s.D; else delete etat.defis[df.id];
    if (df.ex) { if (s.sc) etat.scores[df.ex] = s.sc; else delete etat.scores[df.ex]; }
    if (ind && s.ind) etat.profil.indicateurs[ind] = s.ind;
    ui.defiEvt = null;
    sauver(); rendreFeuille(); focusDefi(ui.pile.length ? '[data-a="defi-annuler"]' : '[data-a="defi-coup"][data-v="1"]');
  };
  ACTIONS["defi-rejouer"] = function () {
    if (!defiOuvert()) return;
    ui.defiEvt = null; ui.pile = [];
    rendreFeuille(); focusDefi('[data-a="defi-coup"][data-v="1"]');
  };
  ACTIONS["defi-fin"] = function () {
    var df = defiOuvert(), D = df && etat.defis[df.id]; if (!D) return;
    var m = defiFinSeance(df, D);
    if (m != null && df.ex) noterScoreExo(df.ex, m);
    ui.pile = []; ui.defiEvt = null;
    sauver(); rendreFeuille(); focusDefi('[data-a="defi-coup"][data-v="1"]');
    message(m == null ? "Séance terminée." : "Séance terminée. Meilleure série : " + m + ".");
  };

  /* Outil rattaché à un exercice : carnet, saisie de partie ou défi. */
  var OUTILS = {
    fe_distances: { a: "aller-carnet", v: "c-distances", l: "Ouvrir mon carnet de distances" },
    we_matrice: { a: "aller-carnet", v: "c-wedges", l: "Remplir ma matrice de wedges" },
    we_horloge: { a: "aller-carnet", v: "c-wedges", l: "Noter ces distances dans ma matrice" },
    st_bilan: { a: "aller-carnet", v: "c-partie", l: "Saisir une partie trou par trou" },
    st_putts_compte: { a: "aller-carnet", v: "c-partie", l: "Saisir mes putts trou par trou" },
    st_carte: { a: "aller-carnet", v: "c-parcours", l: "Voir mes parcours et mes trous noirs" }
  };
  DEFIS.forEach(function (d) { if (d.ex) OUTILS[d.ex] = { a: "defi", id: d.id, l: "Jouer en mode défi" }; });
  function outilHTML(id) {
    var o = a(OUTILS, id) ? OUTILS[id] : null;
    if (!o) return "";
    return '<p class="outil"><button class="btn large" type="button" data-a="' + o.a + '"' + (o.v ? ' data-v="' + o.v + '"' : '') + (o.id ? ' data-id="' + o.id + '"' : '') + '>' + t(o.l) + '</button></p>';
  }
