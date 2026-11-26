  /* ============================================================
     JOURNAL ET RAPPORTS (roadmap DATA, P11)
     Bilan sur un mois, trois mois, la saison ou une période libre ; journal des parties ; notes facultatives
     (associations, jamais des causes) ; rapport daté et reproductible ; import CSV / JSON sans écrasement.
     ============================================================ */
  var PERIODES_JOURNAL = [{ id: "mois", lib: "Un mois" }, { id: "trimestre", lib: "Trois mois" }, { id: "saison", lib: "Saison" }, { id: "libre", lib: "Période libre" }];
  function etatJournal() { return ui.journal || (ui.journal = { periode: "trimestre", debut: "", fin: "" }); }
  function bornesJournal() {
    var J = etatJournal();
    return bornesPeriode(J.periode, auj(), J.debut, J.fin) || bornesPeriode("trimestre", auj());
  }
  function resumeNote(n) {
    if (!n) return "";
    var l = [];
    Object.keys(NOTES_ECHELLES).forEach(function (k) { if (n[k]) l.push(NOTES_ECHELLES[k].lib.toLowerCase() + " " + NOTES_ECHELLES[k].v[n[k]]); });
    if (n.meteo) l.push(NOTES_METEO.filter(function (m) { return m.id === n.meteo; })[0].lib);
    if (n.texte) l.push("« " + n.texte + " »");
    return l.join(" · ");
  }
  function chiffreJournal(lib, v, sous) { return '<div class="kpi"><p class="kpi-t">' + t(lib) + '</p><p class="kpi-v"><span class="main">' + t(v) + '</span></p><p class="kpi-n">' + t(sous) + '</p></div>'; }
  function journalHTML() {
    var J = etatJournal(), B = bornesJournal(), R = rapportPeriode(partiesAnalyse(), B, auj()), S = R.stats;
    var h = '<button class="voile" type="button" data-a="fermer-feuille" aria-label="Fermer" tabindex="-1"></button>' +
      '<section class="feuille journal" role="dialog" aria-modal="true" aria-labelledby="f-titre" id="feuille">' +
      '<header><p class="surtitre">Journal de progression</p><h2 id="f-titre">Bilans et rapports</h2><button class="fermer" type="button" data-a="fermer-feuille" id="f-fermer">Fermer</button></header>';
    h += '<div class="fenetres" role="group" aria-label="Période">' + PERIODES_JOURNAL.map(function (p) {
      return '<button class="opt" type="button" data-a="j-periode" data-v="' + p.id + '" aria-pressed="' + (J.periode === p.id) + '">' + t(p.lib) + '</button>';
    }).join("") + '</div>';
    if (J.periode === "libre") h += '<div class="ligne-dates"><div class="champ"><label for="j-debut">Du</label><input id="j-debut" type="date" value="' + at(J.debut) + '" data-c="j-debut"></div><div class="champ"><label for="j-fin">Au</label><input id="j-fin" type="date" value="' + at(J.fin) + '" data-c="j-fin"></div></div>';
    h += '<p class="aide journal-periode">' + t(B.lib + " : " + periodeLib(B.debut, B.fin) + (/\.$/.test(periodeLib(B.debut, B.fin)) ? " " : ". ") + (R.parties ? pluriel(R.parties, "partie") + ", " + S.trous + " trous." : "Aucune partie sur cette période.")) + '</p>';
    if (R.parties) {
      h += '<div class="kpi-grille journal-kpis">' +
        chiffreJournal("Score", S.ecart18 == null ? "–" : signe(S.ecart18), S.trousScore + " trous avec score, sur 18 trous") +
        chiffreJournal("Putts par trou", S.puttsParTrou == null ? "–" : nb2(S.puttsParTrou), S.trous + " trous") +
        chiffreJournal("Trois-putts", S.partTroisPutts == null ? "–" : S.partTroisPutts + " %", S.troisPutts + " sur " + S.trous + " trous") +
        chiffreJournal("Mises en jeu jouables", S.mej.part == null ? "–" : S.mej.part + " %", S.mej.n + " renseignées" + (S.mej.inconnues ? ", " + S.mej.inconnues + " non" : "")) +
        chiffreJournal("Greens en régulation", S.partGir == null ? "–" : S.partGir + " %", "déduits, " + S.trous + " trous") +
        chiffreJournal("Pénalités", S.penalites18 == null ? "–" : nb1(S.penalites18), "sur 18 trous, " + S.penalites + " au total") + '</div>';
      if (S.parPartie.length >= 2) h += grapheScoresHTML(S.parPartie);
      if (R.erreurs.length) h += '<h3 class="titre-bloc">Erreurs les plus fréquentes</h3><ul class="constats">' + R.erreurs.map(function (e) {
        return '<li>' + t(e.lib + " : " + e.n + " fois sur " + e.base + " " + e.baseLib + " (" + e.part + " %), " + nb1(e.par18) + " pour 18 trous.") + '</li>';
      }).join("") + '</ul>';
      h += '<h3 class="titre-bloc">Notes de partie</h3><p class="aide">' + t(R.notes.notees + " partie" + (R.notes.notees > 1 ? "s notées" : " notée") + " sur " + R.parties + ".") + '</p>';
      if (R.notes.associations.length) h += '<ul class="constats">' + R.notes.associations.map(function (a) {
        return '<li>' + t(a.lib + " : « " + a.bas.lib + " » " + signe(a.bas.ecart18) + " (" + pluriel(a.bas.n, "partie") + "), « " + a.haut.lib + " » " + signe(a.haut.ecart18) + " (" + pluriel(a.haut.n, "partie") + "), écart au par sur 18 trous.") + '</li>';
      }).join("") + '</ul><p class="aide">' + t("Ce sont des associations, pas des causes : d'autres choses ont pu changer ces jours-là.") + '</p>';
      else h += '<p class="aide">' + t("Pour comparer, il faut au moins " + MIN_ASSOCIATION_NOTE + " parties complètes de chaque côté (par exemple « fatigué » et « en forme »).") + '</p>';
      h += '<h3 class="titre-bloc">Journal</h3><ul class="md-liste journal-liste">' + R.journal.slice().reverse().map(function (x) {
        var i = etat.parties.map(function (p) { return p.id; }).indexOf(x.id), pc = parcoursDe(x.pc);
        return '<li><p>' + t(dateCourte(x.d) + (pc ? " · " + pc.nom : "") + " · " + x.trous + " trous" + (x.complet ? " · " + x.score + " (" + ecartLib(x.ecart) + ")" : "")) + (x.note ? '<small>' + t(resumeNote(x.note)) + '</small>' : '') + '</p>' +
          (i >= 0 ? '<div class="ligne-btn"><button class="btn" type="button" data-a="j-note" data-v="' + i + '">' + (x.note ? "Modifier la note" : "Noter") + '</button></div>' : '') + '</li>';
      }).join("") + '</ul>';
      h += '<div class="ligne-btn"><button class="btn principal" type="button" data-a="j-rapport">Télécharger le rapport</button></div>' +
        '<p class="aide">' + t("Un fichier daté, avec ses chiffres, son graphique et le nombre d'observations. Mêmes parties et même période : même empreinte.") + '</p>';
    }
    h += '<h3 class="titre-bloc">Importer des parties</h3><p class="aide">' + t("CSV (une ligne par trou : date ; parcours ; trou ; par ; score ; putts ; penalites ; mise_en_jeu) ou export JSON de l'appli. Tu vois un aperçu avant d'ajouter ; les doublons sont écartés et rien n'est remplacé.") + '</p>' +
      '<div class="ligne-btn"><label class="btn" for="j-import">Choisir un fichier<input id="j-import" type="file" accept=".csv,.json,text/csv,application/json" data-c="j-import" class="vh"></label><button class="btn" type="button" data-a="j-modele">Modèle CSV</button></div>';
    return h + '</section>';
  }
  /* UX03 : page Journal (entrée de la barre). Les bilans, notes, rapports et l'import restent dans la fiche. */
  VUES.journal = function () {
    var n = etat.parties.length;
    /* UX10 : la chronologie de toutes les activités d'abord, puis le tableau des parties. */
    return '<section class="bloc premier"><p class="surtitre">Journal</p><h1>Mon journal</h1>' +
      '<p class="aide">' + t(n ? pluriel(n, "partie") + " enregistrée" + (n > 1 ? "s" : "") + ", avec tes séries de practice, ton index et tes défis." : "Ton historique de parties, de notes et de rapports.") + '</p>' +
      '<div class="raccourcis"><button class="btn" type="button" data-a="j-ouvrir">Bilans, notes et rapports</button>' +
      '<button class="btn" type="button" data-a="j-ouvrir">Importer des parties</button>' +
      '<button class="btn" type="button" data-a="md-ouvrir">Mes données</button></div></section>' + chronologieHTML() + dernieresPartiesHTML();
  };
  function rendreJournal(focusSel) {
    var f = document.getElementById("feuille"), y = f ? f.scrollTop : 0;
    rendreFeuille(); f = document.getElementById("feuille"); if (f) f.scrollTop = y;
    var b = focusSel && document.querySelector("#feuille " + focusSel); if (b) b.focus({ preventScroll: true });
  }
  function telecharger(nom, contenu, type) {
    var blob = new Blob([contenu], { type: type }), url = URL.createObjectURL(blob), lien = document.createElement("a");
    lien.href = url; lien.download = nom; document.body.appendChild(lien); lien.click(); lien.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 30000);
  }
  /* Rapport autonome : HTML imprimable, graphique en SVG, chaque chiffre avec son effectif. */
  function rapportHTML(R) {
    var S = R.stats, e = function (s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); };
    var l = S.parPartie, svg = "";
    if (l.length) {
      var W = 640, H = 200, max = Math.max(1, Math.max.apply(null, l.map(function (x) { return Math.abs(x.ecart18); }))), bw = Math.max(4, Math.min(40, (W - 40) / l.length - 4));
      svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Écart au par de chaque partie, ramené à 18 trous" style="width:100%;max-width:640px"><line x1="30" y1="' + (H - 20) + '" x2="' + W + '" y2="' + (H - 20) + '" stroke="#999"/>' +
        l.map(function (x, i) { var h = Math.max(1, Math.abs(x.ecart18) / max * (H - 40)), X = 34 + i * (bw + 4); return '<rect x="' + X + '" y="' + (H - 20 - h) + '" width="' + bw + '" height="' + h + '" rx="2" fill="#2E9460"><title>' + e(x.d + " : " + (x.ecart18 > 0 ? "+" : "") + x.ecart18) + '</title></rect>'; }).join("") +
        '<text x="30" y="14" font-size="11" fill="#555">' + e("max " + (max > 0 ? "+" : "") + Math.round(max)) + '</text></svg>';
    }
    var ligne = function (lib, v, n) { return '<tr><th>' + e(lib) + '</th><td>' + e(v) + '</td><td>' + e(n) + '</td></tr>'; };
    var nb = function (v, d) { return v == null ? "–" : String(Math.round(v * Math.pow(10, d)) / Math.pow(10, d)).replace(".", ","); };
    return '<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + e("Rapport golf · " + R.periode.debut + " au " + R.periode.fin) + '</title>' +
      '<style>body{font:15px/1.5 system-ui,sans-serif;color:#1d2320;max-width:720px;margin:24px auto;padding:0 16px}h1{font-size:24px;margin:0 0 4px}h2{font-size:17px;margin:24px 0 8px}table{border-collapse:collapse;width:100%}th,td{text-align:left;padding:6px 8px;border-top:1px solid #ddd}td{font-variant-numeric:tabular-nums}.aide{color:#555;font-size:13px}@media print{button{display:none}}</style></head><body>' +
      '<h1>Rapport de golf</h1><p class="aide">' + e("Période : du " + R.periode.debut + " au " + R.periode.fin + " (" + R.periode.lib + "). Généré le " + R.genereLe.slice(0, 10) + " par Coach de golf de poche. Empreinte des données : " + R.empreinte + ".") + '</p>' +
      '<button onclick="window.print()">Imprimer ou enregistrer en PDF</button>' +
      '<h2>En chiffres</h2><table><thead><tr><th>Indicateur</th><th>Valeur</th><th>Observations</th></tr></thead><tbody>' +
      ligne("Parties", R.parties, S.trous + " trous") +
      ligne("Écart au par (sur 18 trous)", S.ecart18 == null ? "–" : (S.ecart18 > 0 ? "+" : "") + nb(S.ecart18, 1), S.trousScore + " trous avec score") +
      ligne("Score brut moyen, 18 trous", S.scoreBrut18 == null ? "–" : nb(S.scoreBrut18, 1), S.parties18 + " parties de 18 trous") +
      ligne("Putts par trou", nb(S.puttsParTrou, 2), S.trous + " trous") +
      ligne("Trois-putts", S.partTroisPutts == null ? "–" : S.partTroisPutts + " %", S.troisPutts + " sur " + S.trous + " trous") +
      ligne("Mises en jeu jouables", S.mej.part == null ? "–" : S.mej.part + " %", S.mej.n + " renseignées, " + S.mej.inconnues + " non renseignées") +
      ligne("Greens en régulation (déduits)", S.partGir == null ? "–" : S.partGir + " %", S.trous + " trous") +
      ligne("Pénalités (sur 18 trous)", nb(S.penalites18, 1), S.penalites + " au total") +
      '</tbody></table>' +
      (svg ? '<h2>Écart au par, partie par partie</h2>' + svg + '<p class="aide">' + e(l.length + " parties complètes, ramenées à 18 trous.") + '</p>' : '') +
      (R.erreurs.length ? '<h2>Erreurs les plus fréquentes</h2><ul>' + R.erreurs.map(function (x) { return '<li>' + e(x.lib + " : " + x.n + " fois sur " + x.base + " " + x.baseLib + " (" + x.part + " %)") + '</li>'; }).join("") + '</ul>' : '') +
      '<h2>Notes de partie</h2><p>' + e(R.notes.notees + " partie(s) notée(s) sur " + R.parties + ".") + '</p>' +
      (R.notes.associations.length ? '<ul>' + R.notes.associations.map(function (a) { return '<li>' + e(a.lib + " : « " + a.bas.lib + " » " + a.bas.ecart18 + " (" + a.bas.n + " parties), « " + a.haut.lib + " » " + a.haut.ecart18 + " (" + a.haut.n + " parties)") + '</li>'; }).join("") + '</ul><p class="aide">Associations, pas des causes.</p>' : '') +
      '<h2>Journal</h2><table><thead><tr><th>Date</th><th>Trous</th><th>Score</th><th>Note</th></tr></thead><tbody>' +
      R.journal.map(function (x) { var pc = parcoursDe(x.pc); return '<tr><td>' + e(x.d + (pc ? " · " + pc.nom : "")) + '</td><td>' + x.trous + '</td><td>' + e(x.complet ? x.score + " (" + (x.ecart > 0 ? "+" : "") + x.ecart + ")" : "incomplet") + '</td><td>' + e(resumeNote(x.note)) + '</td></tr>'; }).join("") +
      '</tbody></table><p class="aide">Les greens en régulation sont déduits du score et des putts. Les mises en jeu non renseignées ne sont jamais comptées comme jouables.</p></body></html>';
  }
  /* Import : aperçu, puis ajout sans rien remplacer. */
  function preparerImport(nom, texte) {
    var L, brut = null;
    if (/\.json$/i.test(nom) || /^\s*[\[{]/.test(texte)) {
      try { brut = JSON.parse(texte); } catch (e) { message("Fichier JSON illisible."); return; }
      L = lireJSONParties(brut);
    } else L = lireCSV(texte);
    var parties = L.parties.map(function (p) {
      if (p.parcoursNom && !p.pc) { var pc = etat.parcours.filter(function (x) { return x.nom.toLowerCase() === p.parcoursNom.toLowerCase() && (x.pars.length === p.trous.length || x.pars.length === 18); })[0]; if (pc) p.pc = pc.id; }
      return p;
    });
    /* Passées par l'assainissement : seules les parties valides sont proposées. */
    var propre = assainir(JSON.parse(JSON.stringify(Object.assign({}, etat, { parties: parties, partie: null })))), valides = propre ? propre.parties : [];
    var F = fusionImport(etat.parties, valides);
    ui.importJournal = F.ajout;
    var err = L.erreurs.concat(parties.length > valides.length ? [{ ligne: 0, msg: (parties.length - valides.length) + " partie(s) refusée(s) par le contrôle des données." }] : []);
    dialogue({ titre: "Aperçu de l’import", corps:
      '<p>' + t(nom + " : " + pluriel(F.ajout.length, "partie") + " à ajouter" + (F.doublons.length ? ", " + pluriel(F.doublons.length, "doublon") + " écarté" + (F.doublons.length > 1 ? "s" : "") + " (déjà dans ton carnet)" : "") + ".") + '</p>' +
      (F.ajout.length ? '<ul class="constats">' + F.ajout.slice(0, 6).map(function (p) { var s = scorePartie(p), pc = parcoursDe(p.pc); return '<li>' + t(dateCourte(p.d) + (pc ? " · " + pc.nom : "") + " · " + p.trous.length + " trous" + (s.complet ? " · " + s.coups : "")) + '</li>'; }).join("") + (F.ajout.length > 6 ? '<li>' + t("et " + (F.ajout.length - 6) + " autres") + '</li>' : '') + '</ul>' : '') +
      (err.length ? '<p class="aide">' + t(pluriel(err.length, "remarque") + " : " + err.slice(0, 4).map(function (x) { return (x.ligne ? "ligne " + x.ligne + " : " : "") + x.msg; }).join(" ; ") + (err.length > 4 ? " ; …" : "")) + '</p>' : '') +
      '<p class="aide">' + t("Rien n'est remplacé : les parties s'ajoutent à ton carnet, à leur date.") + '</p>',
      boutons: F.ajout.length ? [{ l: "Annuler", a: "fermer-dialogue" }, { l: "Ajouter " + pluriel(F.ajout.length, "partie"), a: "j-import-ok", c: "principal" }] : [{ l: "Fermer", a: "fermer-dialogue" }] });
  }
  ACTIONS["j-ouvrir"] = function (el) { ui.retourFocus = el; ui.feuille = { journal: true }; rendreFeuille(); var b = document.getElementById("f-fermer"); if (b) b.focus(); };
  ACTIONS["j-periode"] = function (el) { var J = etatJournal(); J.periode = el.getAttribute("data-v"); if (J.periode === "libre" && !J.debut) { var B = bornesPeriode("trimestre", auj()); J.debut = B.debut; J.fin = B.fin; } rendreJournal('[data-a="j-periode"][data-v="' + J.periode + '"]'); };
  CHANGEMENTS["j-debut"] = function (el) { etatJournal().debut = el.value; rendreJournal("#j-debut"); };
  CHANGEMENTS["j-fin"] = function (el) { etatJournal().fin = el.value; rendreJournal("#j-fin"); };
  ACTIONS["j-rapport"] = function () {
    var B = bornesJournal(), R = rapportPeriode(partiesAnalyse(), B, new Date().toISOString());
    telecharger("rapport-golf-" + B.debut + "-au-" + B.fin + ".html", rapportHTML(R), "text/html");
    message("Rapport préparé : " + pluriel(R.parties, "partie") + ", empreinte " + R.empreinte + ".");
  };
  ACTIONS["j-modele"] = function () {
    var l = ["date;parcours;trou;par;score;putts;penalites;mise_en_jeu"], pars = [4, 4, 3, 5, 4, 4, 3, 5, 4];
    pars.forEach(function (p, k) { l.push("2026-05-01;Mon parcours;" + (k + 1) + ";" + p + ";" + (p + 1) + ";2;0;" + (p === 3 ? "" : "o")); });
    telecharger("modele-parties.csv", "﻿" + l.join("\n") + "\n", "text/csv");
  };
  CHANGEMENTS["j-import"] = function (el) {
    var f = el.files && el.files[0]; if (!f) return;
    if (f.size > 20e6) { message("Fichier trop volumineux."); return; }
    var fr = new FileReader();
    fr.onload = function () { preparerImport(f.name, String(fr.result)); };
    fr.onerror = function () { message("Impossible de lire le fichier."); };
    fr.readAsText(f); el.value = "";
  };
  ACTIONS["j-import-ok"] = function () {
    var l = ui.importJournal || []; ui.importJournal = null;
    if (!l.length) return;
    l.forEach(function (p) { if (!idValide(p.id, "p")) p.id = nouvelId("p"); });
    /* Insertion à la date de chaque partie : l'ordre chronologique du carnet est gardé. */
    etat.parties = etat.parties.concat(l).map(function (p, i) { return { p: p, i: i }; })
      .sort(function (a, b) { var da = String(a.p.d), db = String(b.p.d); return da < db ? -1 : da > db ? 1 : a.i - b.i; }).map(function (x) { return x.p; });
    majIndicateursParties();
    ui.dialogue = null; rendreDialogue(); rendre(); rendreFeuille();
    sauverPuis(pluriel(l.length, "partie") + " ajoutée" + (l.length > 1 ? "s" : "") + " à ton carnet.");
  };
  /* Note de partie */
  ACTIONS["j-note"] = function (el) {
    var i = +el.getAttribute("data-v"), p = etat.parties[i]; if (!p) return;
    ui.noteCible = i; var n = p.note || {};
    function sel(k) {
      var E = NOTES_ECHELLES[k];
      return '<div class="champ"><label for="n-' + k + '">' + t(E.lib) + '</label><select id="n-' + k + '"><option value="">—</option>' + [1, 2, 3].map(function (v) { return '<option value="' + v + '"' + (n[k] === v ? " selected" : "") + '>' + t(E.v[v]) + '</option>'; }).join("") + '</select></div>';
    }
    dialogue({ titre: "Note de la partie du " + dateCourte(p.d), corps: '<p class="aide">' + t("Tout est facultatif. Ces notes servent à repérer des associations (par exemple la forme et le score), jamais des causes.") + '</p>' +
      sel("driving") + sel("putting") + sel("forme") + sel("ressenti") +
      '<div class="champ"><label for="n-meteo">Météo</label><select id="n-meteo"><option value="">—</option>' + NOTES_METEO.map(function (m) { return '<option value="' + m.id + '"' + (n.meteo === m.id ? " selected" : "") + '>' + t(m.lib) + '</option>'; }).join("") + '</select></div>' +
      '<div class="champ"><label for="n-texte">Un mot <small>(140 caractères)</small></label><input id="n-texte" type="text" maxlength="140" value="' + at(n.texte || "") + '"></div>',
      boutons: [{ l: "Annuler", a: "fermer-dialogue" }, { l: "Enregistrer", a: "j-note-ok", c: "principal" }] });
  };
  ACTIONS["j-note-ok"] = function () {
    var p = etat.parties[ui.noteCible]; if (!p) return;
    var v = function (id) { var x = document.getElementById(id); return x ? x.value : ""; };
    var n = noteValide({ driving: +v("n-driving") || null, putting: +v("n-putting") || null, forme: +v("n-forme") || null, ressenti: +v("n-ressenti") || null, meteo: v("n-meteo") || null, texte: v("n-texte") });
    if (n) p.note = n; else delete p.note;
    ui.dialogue = null; rendreDialogue(); rendre(); rendreFeuille(); if (ui.partie) rendrePartie();
    sauverPuis(n ? "Note enregistrée." : "Note retirée.");
  };
