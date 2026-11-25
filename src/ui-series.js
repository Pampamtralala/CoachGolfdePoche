  /* ============================================================
     SÉRIE AU PRACTICE : dix balles avec un club, leur dispersion et la distance
     que neuf balles sur dix dépassent, plutôt qu'une moyenne flatteuse.
     ============================================================ */

  /* Nuage de balles sur une ligne : la bande d'un écart-type autour de la moyenne, la moyenne, la distance fiable à 90 %. */
  function nuageHTML(l, dsp, titre) {
    if (!l.length) return "";
    var mn = Math.min.apply(null, l), mx = Math.max.apply(null, l), pad = Math.max(4, Math.round((mx - mn) * 0.12));
    var lo = mn - pad, hi = mx + pad, X = function (v) { return 14 + (v - lo) / (hi - lo) * 292; };
    var h = '<svg class="nuage" viewBox="0 0 320 86" role="img" aria-label="' + at(titre || ("Dispersion de " + pluriel(l.length, "balle"))) + '">', A = 40;
    if (dsp) {
      var xf = X(dsp.p10);
      h += '<rect class="n-bande" x="' + X(dsp.moy - dsp.sigma).toFixed(1) + '" y="' + (A - 17) + '" width="' + Math.max(2, X(dsp.moy + dsp.sigma) - X(dsp.moy - dsp.sigma)).toFixed(1) + '" height="34" rx="6"/>' +
        '<line class="n-fiable" x1="' + xf.toFixed(1) + '" x2="' + xf.toFixed(1) + '" y1="' + (A - 23) + '" y2="' + (A + 23) + '"/>' +
        '<text class="n-lib" x="' + Math.max(38, Math.min(282, xf)).toFixed(1) + '" y="11" text-anchor="middle">' + t("90 % · " + dsp.p10 + " m") + '</text>' +
        '<line class="n-moy" x1="' + X(dsp.moy).toFixed(1) + '" x2="' + X(dsp.moy).toFixed(1) + '" y1="' + (A - 19) + '" y2="' + (A + 19) + '"/>';
    }
    h += '<line class="n-axe" x1="10" x2="310" y1="' + A + '" y2="' + A + '"/>';
    l.forEach(function (v, i) { h += '<circle class="n-balle" cx="' + X(v).toFixed(1) + '" cy="' + (A + ((i * 7) % 5 - 2) * 4) + '" r="5"/>'; });
    return h + '<text class="n-lib" x="14" y="80">' + lo + ' m</text><text class="n-lib" x="306" y="80" text-anchor="end">' + hi + ' m</text></svg>';
  }
  function dispersionPhrase(dsp) {
    return "Moyenne " + dsp.moy + " m · dispersion ±" + dsp.sigma + " m · 9 balles sur 10 au-delà de " + dsp.p10 + " m";
  }
  /* Bloc pour la fiche d'un club : nuage et chiffres, dès trois mesures. */
  function dispersionClubHTML(l) {
    var dsp = dispersion(l);
    if (!dsp) return "";
    return '<div class="sac-dispersion"><h3>Dispersion</h3>' + nuageHTML(l, dsp) +
      '<dl class="disp-chiffres"><div><dt>Fiable à 90 %</dt><dd><span class="main">' + dsp.p10 + '</span> m</dd></div>' +
      '<div><dt>Dispersion</dt><dd><span class="main">±' + dsp.sigma + '</span> m</dd></div>' +
      '<div><dt>Moyenne</dt><dd><span class="main">' + dsp.moy + '</span> m</dd></div></dl>' +
      '<p class="aide">' + t("Choisis ce club quand l'obstacle est avant " + dsp.p10 + " m : neuf balles sur dix le passent.") + '</p></div>';
  }

  /* ---------- La fiche de série ---------- */
  function serieHTML() {
    var S = ui.serie, c = CLUB[S.c], dsp = dispersion(S.v), der = S.v[S.v.length - 1];
    var h = '<button class="voile" type="button" data-a="fermer-feuille" aria-label="Fermer la série" tabindex="-1"></button>' +
      '<section class="feuille serie" role="dialog" aria-modal="true" aria-labelledby="f-titre" id="feuille">' +
      '<header><p class="surtitre">Practice · série de balles</p><h2 id="f-titre">' + t(c ? nomLoft(c) : "Série au practice") + '</h2>' +
      '<button class="fermer" type="button" data-a="fermer-feuille" id="f-fermer">Fermer</button></header>' +
      '<div class="serie-clubs choix-ligne" role="group" aria-label="Club de la série">' + sacActuel().map(function (id) {
        return '<button class="opt" type="button" data-a="serie-club" data-id="' + id + '" aria-pressed="' + (S.c === id) + '">' + t(courtSac(CLUB[id]).replace(/^(\d)$/, "Fer $1")) + '</button>';
      }).join("") + '</div>' +
      '<p class="aide">' + t("Tape chaque balle : la distance de vol, au panneau ou au télémètre. Dix balles donnent une dispersion fiable.") + '</p>' +
      '<form class="serie-saisie" data-f="serie-balle" novalidate><label class="vh" for="serie-val">Distance de la balle, en mètres</label>' +
      '<input id="serie-val" type="text" inputmode="numeric" autocomplete="off" maxlength="3" placeholder="' + (der || (c && moyenneClub(mesuresTout(), S.c)) || "m") + '">' +
      '<button class="btn principal" type="submit">Ajouter</button></form>' +
      '<p class="erreur" id="serie-err" role="alert" hidden></p>' +
      '<div class="serie-rapide" id="serie-rapide">' + rapidesHTML(der) + '</div>' +
      '<div id="serie-poseur">' + poseurSerieHTML() + '</div>' +
      '<div id="serie-etat" aria-live="polite">' + serieEtatHTML() + '</div>' +
      '<div class="ligne-btn"><button class="btn principal" type="button" data-a="serie-fin">Terminer la série</button>' +
      '<button class="btn" type="button" data-a="serie-annuler">Annuler la série</button></div>';
    return h + '</section>';
  }
  /* Ellipse du club, balles de la série posées dessus, et le point de la balle à venir. */
  function poseurSerieHTML() {
    var S = ui.serie, e = ellipseDe(S.c), pts = [];
    S.v.forEach(function (d, i) { if (S.l && S.l[i] != null) pts.push({ d: d, l: S.l[i], src: "serie" }); });
    return poseurHTML({ ell: e, ctx: "serie", pts: pts, l: S.lp, dd: S.ddp || 0, titre: "Direction de la balle (facultatif)" });
  }
  function majPoseurSerie() { var z = document.getElementById("serie-poseur"); if (z) z.innerHTML = poseurSerieHTML(); }
  function ajouterBalle(v) {
    var S = ui.serie; if (!S.l) S.l = [];
    S.v.push(v); S.l.push(S.lp != null ? S.lp : null); S.lp = null; S.ddp = null; S.dTap = false;
  }
  /* Même distance que la balle précédente, ou cinq mètres de plus ou de moins : un toucher. */
  function rapidesHTML(der) {
    if (!der) return "";
    return [-5, 0, 5].map(function (d) {
      return '<button class="btn" type="button" data-a="serie-rapide" data-v="' + d + '">' + (d ? (d > 0 ? "+" : "−") + Math.abs(d) + " m" : "Même · " + der + " m") + '</button>';
    }).join("");
  }
  function serieEtatHTML() {
    var S = ui.serie, dsp = dispersion(S.v);
    if (!S.v.length) return '<p class="serie-compte">Aucune balle pour l’instant.</p>';
    return '<p class="serie-compte"><span class="main">' + S.v.length + '</span> ' + (S.v.length > 1 ? "balles" : "balle") + (dsp ? ' · ' + t(dispersionPhrase(dsp)) : '') + '</p>' +
      nuageHTML(S.v, dsp, "Série de " + pluriel(S.v.length, "balle")) +
      '<ul class="releves">' + S.v.map(function (v, i) { return '<li><button class="puce neutre" type="button" data-a="serie-suppr" data-v="' + i + '" aria-label="' + at("Retirer la balle " + (i + 1) + " : " + v + " m") + '">' + v + ' <span aria-hidden="true">×</span></button></li>'; }).join("") + '</ul>';
  }
  /* Mise à jour sans redessiner la fiche : le clavier du téléphone reste ouvert. */
  function majSerie() {
    var e = document.getElementById("serie-etat"); if (e) e.innerHTML = serieEtatHTML();
    majPoseurSerie();
    var r = document.getElementById("serie-rapide"), der = ui.serie.v[ui.serie.v.length - 1]; if (r) r.innerHTML = rapidesHTML(der);
    var i = document.getElementById("serie-val"); if (i && der) i.placeholder = der;
  }
  /* La série rejoint les mesures du club (les plus récentes d'abord gardées) et l'historique des séries. */
  function enregistrerSerie() {
    var S = ui.serie; if (!S || !S.v.length || !CLUB[S.c]) return null;
    var cb = etat.carnet;
    var se = { id: nouvelId("s"), d: auj(), c: S.c, v: S.v.slice() };
    if (S.l && S.l.some(function (x) { return x != null; })) se.l = S.l.slice(0, S.v.length);
    cb.series = (cb.series || []).concat([se]);
    cb.clubs[S.c] = (cb.clubs[S.c] || []).concat(S.v);
    var r = { c: S.c, n: S.v.length, dsp: dispersion(S.v), moy: Math.round(somme(S.v) / S.v.length) };
    S.v = []; S.l = []; S.lp = null; S.ddp = null;
    sauver();
    return r;
  }
  function annonceSerie(r) {
    return nomLoft(CLUB[r.c]) + " : " + pluriel(r.n, "balle") + ", moyenne " + (r.dsp ? r.dsp.moy : r.moy) + " m" + (r.dsp ? ", fiable à 90 % : " + r.dsp.p10 + " m" : "") + ".";
  }
  ACTIONS["serie-ouvrir"] = function (el) {
    var id = el.getAttribute("data-id"), sac = sacActuel();
    if (!CLUB[id]) id = CLUB[ui.club] && sac.indexOf(ui.club) >= 0 ? ui.club : sac.filter(function (k) { return CLUB[k].fam === "f"; })[0] || sac[0];
    if (!ui.feuille) ui.retourFocus = el;
    ui.serie = { c: id, v: [], l: [], lp: null }; ui.feuille = { serie: true }; ui.feuilleVue = false;
    rendreFeuille();
    var i = document.getElementById("serie-val"); if (i) i.focus();
  };
  /* Changer de club enregistre la série en cours et en commence une autre. */
  ACTIONS["serie-club"] = function (el) {
    var id = el.getAttribute("data-id"), S = ui.serie; if (!S || !CLUB[id] || id === S.c) return;
    var r = enregistrerSerie();
    S.c = id; S.v = []; S.l = []; S.lp = null;
    rendreFeuille(); rendre();
    var b = document.querySelector('#feuille [data-a="serie-club"][data-id="' + id + '"]'); if (b) b.focus({ preventScroll: true });
    if (r) messageEnregistre("Série enregistrée. " + annonceSerie(r));
  };
  FORMULAIRES["serie-balle"] = function (form) {
    var S = ui.serie, inp = form.querySelector("#serie-val"), err = document.getElementById("serie-err"); if (!S) return;
    var brut = inp.value.trim(), v = /^\d{1,3}$/.test(brut) ? parseInt(brut, 10) : NaN;
    if (isNaN(v) || v < 5 || v > 400) { err.textContent = "Entre une distance en mètres, entre 5 et 400."; err.hidden = false; inp.focus(); return; }
    err.hidden = true;
    if (S.v.length >= 30) { err.textContent = "Trente balles au plus par série : termine celle-ci."; err.hidden = false; return; }
    ajouterBalle(v); inp.value = "";
    majSerie(); inp.focus();
  };
  ACTIONS["serie-rapide"] = function (el) {
    var S = ui.serie; if (!S || !S.v.length || S.v.length >= 30) return;
    var v = Math.max(5, Math.min(400, S.v[S.v.length - 1] + parseInt(el.getAttribute("data-v"), 10)));
    ajouterBalle(v); majSerie();
    var b = document.querySelector('#feuille [data-a="serie-rapide"][data-v="' + el.getAttribute("data-v") + '"]'); if (b) b.focus({ preventScroll: true });
  };
  ACTIONS["serie-suppr"] = function (el) {
    var S = ui.serie, i = parseInt(el.getAttribute("data-v"), 10); if (!S || !(i >= 0 && i < S.v.length)) return;
    S.v.splice(i, 1); if (S.l) S.l.splice(i, 1); majSerie();
    var b = document.querySelector('#feuille [data-a="serie-suppr"][data-v="' + Math.min(i, S.v.length - 1) + '"]') || document.getElementById("serie-val"); if (b) b.focus({ preventScroll: true });
  };
  ACTIONS["serie-fin"] = function () {
    var r = enregistrerSerie();
    ui.serie = null; ui.feuille = null; ui.feuilleVue = false; rendreFeuille(); rendre();
    var b = ui.retourFocus; ui.retourFocus = null; if (b && document.body.contains(b)) b.focus({ preventScroll: true });
    message(r ? "Série enregistrée. " + annonceSerie(r) : "Série vide : rien à enregistrer.");
  };
  ACTIONS["serie-annuler"] = function () {
    if (ui.serie) ui.serie.v = [];
    ui.serie = null; fermerFeuille();
  };
  /* Bloc d'appel, en tête de la page Practice. */
  function serieAppelHTML() {
    var l = (etat.carnet.series || []), der = l[l.length - 1];
    return '<section class="bloc serie-appel"><h2>Au practice : une série par club</h2>' +
      '<p>' + t(der ? "Dernière série : " + nomLoft(CLUB[der.c]) + ", " + pluriel(der.v.length, "balle") + " le " + dateCourte(der.d) + "." : "Tape dix balles avec un club et note chaque distance : tu obtiens ta dispersion et la distance fiable à 90 %.") + '</p>' +
      '<button class="btn principal" type="button" data-a="serie-ouvrir">Commencer une série</button></section>';
  }
