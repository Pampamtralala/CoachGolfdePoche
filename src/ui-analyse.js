  /* ============================================================
     ANALYSE DE PERFORMANCE (interface) : ton jeu sur 100, priorité de la semaine,
     comparaison à l'objectif d'index, erreurs évitables.
     ============================================================ */

  /* Jauge d'une note sur 100 : un anneau, la note au centre. */
  function jaugeNote(s, prio) {
    var r = 30, c = 2 * Math.PI * r, part = s.note == null ? 0 : s.note / 100;
    return '<div class="jn' + (prio ? " prio" : "") + (s.note == null ? " vide" : "") + '" role="img" aria-label="' + at(s.nom + (s.note == null ? " : à mesurer" : " : " + s.note + " sur 100, comme un index " + s.index) + (prio ? ". Priorité de la semaine" : "")) + '">' +
      '<svg viewBox="0 0 76 76" aria-hidden="true" focusable="false"><circle class="jn-fond" cx="38" cy="38" r="' + r + '"/>' +
      (s.note ? '<circle class="jn-plein" cx="38" cy="38" r="' + r + '" style="stroke-dasharray:' + c.toFixed(1) + ';stroke-dashoffset:' + (c * (1 - part)).toFixed(1) + '" transform="rotate(-90 38 38)"/>' : '') +
      '<text x="38" y="45" text-anchor="middle">' + (s.note == null ? "–" : s.note) + '</text></svg>' +
      '<b>' + t(s.nom) + '</b><small>' + t(s.note == null ? "à mesurer" : "comme un index " + s.index) + '</small></div>';
  }
  function secteurDomaine(pr) {
    var x = pr.priorite; if (!x) return null;
    if (x.id === "putting") {
      var rl = releveDetail(partiesAnalyse(), 90), p3 = rl.p1[1][2] + rl.p1[2][2] + rl.p1[3][2] + rl.p1[4][2];
      return p3 >= 3 && rl.p1[4][2] * 2 >= p3 ? "putt_long" : "putt_court";
    }
    return x.d;
  }
  /* Bloc « Ton jeu sur 100 » : quatre jauges et la priorité de la semaine. */
  function notesHTML(court, sansPrio) {
    var cible = indexVise(), pr = prioriteSemaine(partiesAnalyse(), cible), no = pr.notes;
    if (!no) {
      var T = partiesAnalyse().reduce(function (s, p) { return s + p.trous.length; }, 0);
      return { vide: true, resume: "à mesurer en partie", html: '<p>' + t("Les notes sur 100 demandent " + NOTES_MIN_TROUS + " trous saisis" + (T ? " : encore " + Math.max(0, NOTES_MIN_TROUS - T) + "." : ", soit deux ou trois parties.")) + '</p>' };
    }
    var x = pr.priorite, d = secteurDomaine(pr);
    var h = '<div class="jauges">' + no.secteurs.map(function (s) { return jaugeNote(s, x && x.id === s.id); }).join("") + '</div>';
    if (x && !sansPrio) {
      h += '<div class="prio-semaine"><p class="surtitre">Priorité de la semaine</p><p class="une-titre">' + t(x.nom) + '</p>' +
        '<p>' + t(x.sg != null ? "Face à ton objectif d'index " + cible + ", ce secteur te coûte " + coupsLib(x.sg, "perdu") + " par partie." : "C'est ta note la plus basse.") + '</p>' +
        (d && DOM[d] ? '<button class="btn principal large" type="button" data-a="voir-exos" data-v="' + d + '">' + t("Exercices : " + DOM[d].nom.toLowerCase()) + '</button>' : '') + '</div>';
    }
    if (!court) h += '<p class="aide">' + t("100 correspond au niveau scratch, 0 à un index 54. Chaque secteur réunit plusieurs mesures de tes " + pluriel(no.n, "dernière partie").replace("dernière parties", "dernières parties") + " (" + no.T + " trous).") + '</p>' +
      '<details class="calcul"><summary>Le détail des notes</summary><ul class="detail-notes">' + no.secteurs.map(function (s) {
        return '<li><b>' + t(s.nom + (s.note == null ? " : à mesurer" : " : " + s.note + "/100")) + '</b>' + (s.mesures.length ? '<ul>' + s.mesures.map(function (m) {
          return '<li>' + t(m.lib + " : " + nbMesure(m.v, m.unite) + " " + m.unite + ", comme un index " + m.index) + '</li>';
        }).join("") + '</ul>' : '') + '</li>';
      }).join("") + '</ul></details>';
    return { vide: false, resume: no.secteurs.filter(function (s) { return s.note != null; }).map(function (s) { return s.nom.split(" ")[0] + " " + s.note; }).join(" · "), html: h, pr: pr };
  }
  function nbMesure(v, unite) { return unite === "%" ? String(Math.round(v)) : (Math.round(v * 10) / 10).toString().replace(".", ","); }

  /* Les deux secteurs qui coûtent le plus face à l'objectif, puis les repères qui s'ajoutent aux objectifs. */
  function deuxSecteursHTML(cible) {
    var pr = prioriteSemaine(partiesAnalyse(), cible);
    if (!pr.deux.length) return "";
    return '<div class="deux-secteurs"><p class="tf-titre">' + t("Où tu perds le plus face à l'index " + cible) + '</p><ol>' + pr.deux.map(function (s) {
      return '<li><b class="main">' + signe(s.sg) + '</b><span><b>' + t(s.nom) + '</b><small>' + t("coup" + (Math.abs(s.sg) >= 2 ? "s" : "") + " par partie" + (s.note != null ? " · note " + s.note + "/100" : "")) + '</small></span></li>';
    }).join("") + '</ol></div>';
  }
  function reperesPlusHTML(cible) {
    var l = comparaisonObjectif(partiesAnalyse(), cible).filter(function (c) { return ["prox", "sable", "double", "r2", "r5", "jouable"].indexOf(c.id) >= 0; });
    var fmt = function (v, c) { return v == null ? null : c.unite === "%" ? Math.round(v) + " %" : (Math.round(v * Math.pow(10, c.dec)) / Math.pow(10, c.dec)).toString().replace(".", ",") + (c.unite === "m" ? " m" : ""); };
    var mesurees = l.filter(function (c) { return c.moi != null; });
    var h = '<h3 class="titre-bloc">' + t("Plus de repères face à l'index " + cible) + '</h3>';
    if (mesurees.length) {
      h += '<div class="defile"><table class="carte-score calcul"><thead><tr><th scope="col">Statistique</th><th scope="col" class="num">Toi</th><th scope="col" class="num">' + t("Index " + cible) + '</th></tr></thead><tbody>' +
        mesurees.map(function (c) {
          return '<tr><td>' + t(c.lib) + ' <small>' + t(c.unite === "%" || c.unite === "m" ? "sur " + pluriel(c.n, c.id === "jouable" ? "départ" : "occasion") : c.unite) + '</small></td>' +
            '<td class="num"><span class="marque ' + (c.mieux ? "dessus" : "dessous") + '">' + fmt(c.moi, c) + '</span></td><td class="num rep">' + fmt(c.cible, c) + '</td></tr>';
        }).join("") + '</tbody></table></div>';
    }
    var manque = l.filter(function (c) { return c.moi == null; });
    if (manque.length) h += '<p class="aide">' + t("À mesurer : " + manque.map(function (c) { return c.lib.toLowerCase(); }).join(", ") + ". Note le premier putt, le bunker et les doubles approches dans le pavé.") + '</p>';
    return h;
  }

  /* ---------- Erreurs évitables ---------- */
  function erreursGlobalesHTML() {
    var e = erreursEvitables(partiesAnalyse(), 90);
    if (!e) return null;
    var h = '<p class="evit-total"><span class="main">' + nb1(e.erreurs) + '</span>' + t(" erreur" + (e.erreurs >= 2 ? "s" : "") + " évitable" + (e.erreurs >= 2 ? "s" : "") + " par partie") + '</p>' +
      '<dl class="disp-chiffres evit"><div><dt>Pénalités</dt><dd><span class="main">' + nb1(e.pen) + '</span></dd></div>' +
      '<div><dt>Doubles approches</dt><dd>' + (e.double == null ? "–" : '<span class="main">' + nb1(e.double) + '</span>') + '</dd></div>' +
      '<div><dt>3 putts &lt; 5 m</dt><dd><span class="main">' + nb1(e.putt3) + '</span></dd></div></dl>' +
      '<p>' + t(e.coups >= 0.5 ? "Environ " + nb1(e.coups) + " coup" + (e.coups >= 2 ? "s" : "") + " à gagner par partie sans changer de swing : en jouant la sécurité, en sortant la balle du premier coup près du green, et en laissant les premiers putts au pied du trou." : "Presque aucune erreur évitable : la stratégie tient.") + '</p>' +
      '<p class="aide">' + t("Sur " + pluriel(e.n, "partie") + " (" + e.T + " trous). Chaque coup de pénalité, double approche ou trois-putts à moins de 5 m compte pour un coup." + (e.double == null ? " Les doubles approches se comptent sur les parties notées avec le pavé." : "")) + '</p>';
    return { resume: nb1(e.erreurs) + " par partie", html: h };
  }
  function erreursPartieHTML(pt) {
    var e = erreursPartie(pt);
    if (!e.T) return "";
    if (!e.total) return '<div class="evit-partie ok"><b>Aucune erreur évitable</b><p>' + t("Ni pénalité, ni double approche, ni trois-putts à moins de 5 m.") + '</p></div>';
    var lib = function (n, mot, cle) {
      var trous = e.trous.filter(function (x) { return x[cle]; }).map(function (x) { return x.h + 1; });
      return n ? pluriel(n, mot) + " (trou" + (trous.length > 1 ? "s " : " ") + enListe(trous.map(String)) + ")" : null;
    };
    var l = [lib(e.pen, "coup de pénalité", "pen"), lib(e.double, "double approche", "double"), lib(e.putt3, "trois-putts à moins de 5 m", "putt3")].filter(Boolean);
    return '<div class="evit-partie"><b>' + t(e.total + (e.total > 1 ? " erreurs évitables" : " erreur évitable") + " · " + pluriel(e.total, "coup") + " à gagner sans changer de swing") + '</b><p>' + t(enListe(l) + ".") + '</p></div>';
  }

  /* ---------- Objectif d'index, dans le profil ---------- */
  function indexViseHTML() {
    var p = etat.profil, v = p.indexVise;
    return '<section class="bloc" id="objectif-index"><h2>Objectif d’index</h2><p>' + t("Tes statistiques et tes coups gagnés se comparent à un joueur de cet index, pas aux pros." + (v == null ? " Sans choix, l'appli prend l'index " + cibleAuto(p.index) + ", trois points sous le tien." : "")) + '</p>' +
      '<div class="choix-ligne index-vise" role="group" aria-label="Objectif d’index">' + OBJ_INDEX.slice().reverse().map(function (x) {
        return '<button class="opt" type="button" data-a="index-vise" data-v="' + x + '" aria-pressed="' + (indexVise() === x) + '">' + (x === 0 ? "Scratch" : "Index " + x) + '</button>';
      }).join("") + '</div></section>';
  }
  ACTIONS["index-vise"] = function (el) {
    var v = parseInt(el.getAttribute("data-v"), 10); if (OBJ_INDEX.indexOf(v) < 0) return;
    etat.profil.indexVise = v; sauver(); rendreEtFocus(el);
  };
