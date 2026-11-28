  /* ============================================================
     CARTE GPS : carte des trous d'un parcours (OpenStreetMap, fichier ou relevé sur place),
     position du joueur, distances à l'entrée, au milieu et au fond du green.
     Les cartes sont rangées à part de l'état de l'appli : elles restent sur l'appareil et se retéléchargent.
     ============================================================ */
  var CLE_GEO = "coachgolf.geo.v1";
  var OVERPASS = ["https://overpass-api.de/api/interpreter", "https://overpass.private.coffee/api/interpreter"];
  var GEO = { cartes: null };
  function cartesStock() {
    if (GEO.cartes) return GEO.cartes;
    GEO.cartes = {};
    try {
      var o = JSON.parse(localStorage.getItem(CLE_GEO) || "null");
      if (o && o.v === 1 && o.pcs && typeof o.pcs === "object") Object.keys(o.pcs).slice(0, 20).forEach(function (k) {
        var c = /^p\d{1,4}$/.test(k) ? assainirCarte(o.pcs[k]) : null; if (c) GEO.cartes[k] = c;
      });
    } catch (e) { /* stockage illisible : aucune carte */ }
    return GEO.cartes;
  }
  function carteDe(id) { return id && a(cartesStock(), id) ? cartesStock()[id] : null; }
  function ecrireCartes() { try { localStorage.setItem(CLE_GEO, JSON.stringify({ v: 1, pcs: cartesStock() })); return true; } catch (e) { return false; } }
  function poserCarte(id, c) { cartesStock()[id] = c; return ecrireCartes(); }
  function retirerCarte(id) { if (a(cartesStock(), id)) { delete cartesStock()[id]; ecrireCartes(); } }
  function effacerCartes() { GEO.cartes = {}; try { localStorage.removeItem(CLE_GEO); } catch (e) { /* rien */ } }

  /* ---------- Position suivie pendant la partie ---------- */
  var POS = { veille: null, ll: null, pr: null, t: 0, main: null, abonnes: [], hist: [] };
  function suiviVoulu() { return ui.partie === "saisie" && !!etat.partie && gpsPossible() && document.visibilityState !== "hidden"; }
  function arreterSuivi() { if (POS.veille != null) { try { navigator.geolocation.clearWatch(POS.veille); } catch (e) { /* rien */ } POS.veille = null; } }
  function majSuivi() {
    if (!suiviVoulu()) { arreterSuivi(); return; }
    if (POS.veille != null) return;
    try {
      POS.veille = navigator.geolocation.watchPosition(surPosition, function (e) {
        if (e && e.code === 1) { GPS.refuse = true; arreterSuivi(); majCarteDirect(); }
      }, { enableHighAccuracy: true, maximumAge: 2000, timeout: 30000 });
    } catch (e) { POS.veille = null; }
  }
  function surPosition(p) {
    var ll = [p.coords.latitude, p.coords.longitude], now = Date.now();
    if (!nombre(ll[0]) || !nombre(ll[1])) return;
    var pr = Math.max(1, Math.round(p.coords.accuracy || 0));
    POS.abonnes.slice().forEach(function (f) { f(ll, pr); });
    /* Position lissée : moyenne des points récents quand le joueur est immobile. */
    POS.hist.push({ ll: ll, pr: pr, t: now });
    POS.hist = POS.hist.filter(function (x) { return now - x.t <= 10000; }).slice(-12);
    var L = lisserGPS(POS.hist, now); if (!L) return;
    if (POS.ll && now - POS.t < 900 && dist2(projeter(POS.ll, L.ll[0], L.ll[1]), [0, 0]) < 1 && L.pr >= POS.pr) return;
    POS.ll = L.ll; POS.pr = L.pr; POS.t = now;
    majCarteDirect();
  }
  document.addEventListener("visibilitychange", majSuivi);

  /* Position prise APRÈS le toucher : une position gardée d'avant n'est jamais utilisée, sauf si elle a moins de o.age ms.
     o.n : nombre de points GPS à moyenner ; o.prMax : précision visée (m) ; o.attente : délai maximal (ms).
     fin(ll, précision, erreur) : ll arrondi au millionième, ou null. */
  function positionFraiche(fin, o) {
    o = o || {};
    var N = o.n || 1, prMax = o.prMax || 30, pts = [], fini = false, tm = null, err = null;
    var terminer = function () {
      if (fini) return; fini = true;
      if (tm) clearTimeout(tm);
      POS.abonnes = POS.abonnes.filter(function (f) { return f !== recevoir; });
      if (!pts.length) { fin(null, null, err); return; }
      /* Moyenne des meilleurs points, points aberrants écartés. */
      var M = moyenneGPS(pts);
      fin(M.ll, M.pr, null);
    };
    var recevoir = function (ll, pr) {
      if (fini) return;
      pts.push({ ll: ll, pr: pr });
      if (pts.filter(function (q) { return q.pr <= prMax; }).length >= N) terminer();
    };
    if (o.age && POS.ll && Date.now() - POS.t <= o.age) recevoir(POS.ll.slice(), POS.pr);
    if (fini) return;
    POS.abonnes.push(recevoir);
    tm = setTimeout(terminer, o.attente || 12000);
    try {
      navigator.geolocation.getCurrentPosition(function (p) {
        if (nombre(p.coords.latitude) && nombre(p.coords.longitude)) recevoir([p.coords.latitude, p.coords.longitude], Math.max(1, Math.round(p.coords.accuracy || 0)));
      }, function (e) {
        err = e;
        if (e && e.code === 1) { GPS.refuse = true; terminer(); }
      }, { enableHighAccuracy: true, timeout: o.attente || 12000, maximumAge: 0 });
    } catch (e) { err = e; terminer(); }
  }

  /* ---------- Apprentissage : drapeau en fin de trou, départ au premier coup ---------- */
  function jourDuJour() { return Math.floor(Date.now() / 864e5); }
  function apprendreFinTrou() {
    var x = ctxCarte();
    if (!x || !x.carte || !x.trou || !POS.ll || Date.now() - POS.t > 10000 || POS.pr > 12) return;
    var r = noterFinTrou(x.carte, x.h, projeter(x.carte.o, POS.ll[0], POS.ll[1]), jourDuJour());
    if (!r) return;
    poserCarte(x.pc.id, x.carte);
    if (r === "appris") message("Green du trou " + (x.h + 1) + " affiné d'après tes parties : les distances sont plus justes.");
  }
  function apprendreDepart(ll) {
    var x = ctxCarte(); if (!x || !x.carte || !ll) return;
    if (noterDepart(x.carte, x.h, projeter(x.carte.o, ll[0], ll[1]), jourDuJour())) poserCarte(x.pc.id, x.carte);
  }

  /* Le trou en cours, son parcours et sa carte. */
  function ctxCarte() {
    var p = etat.partie; if (!p) return null;
    var pc = parcoursDe(p.pc), h = trouPhysique(p, p.i), c = pc ? carteDe(pc.id) : null;
    return { p: p, pc: pc, h: h, carte: c, trou: c ? trouCarte(c, h) : null };
  }
  /* Position du joueur dans le repère de la carte : le GPS s'il est sur le trou, sinon le point posé du doigt sur ce trou. */
  /* Position GPS utilisable pour ce trou : moins de 20 secondes (le joueur a pu marcher), à moins de 1 500 m du green. */
  function positionGPS(x) {
    if (!x || !x.carte || !POS.ll || Date.now() - POS.t >= 20000) return null;
    var q = projeter(x.carte.o, POS.ll[0], POS.ll[1]);
    return !x.trou || dist2(q, centrePoly(dePlat(x.trou.g))) <= 1500 ? { q: q, gps: true, pr: POS.pr, age: Math.round((Date.now() - POS.t) / 1000) } : null;
  }
  /* Position de la balle : posée à la main (« Placer la balle »), sinon le GPS, sinon le dernier point posé. */
  function positionJoueur(x) {
    if (!x || !x.carte) return null;
    var m = POS.main, main = m && x.pc && m.pc === x.pc.id && m.h === x.h ? { q: m.q, gps: false, pr: null } : null;
    if (main && ui.carteMode === "position") return main;
    return positionGPS(x) || main;
  }
  function distancesCourantes() {
    var x = ctxCarte(), pos = positionJoueur(x);
    return pos && x.trou ? distancesGreen(pos.q, dePlat(x.trou.g)) : null;
  }

  /* ---------- Sur le pavé : entrée, milieu, fond ---------- */
  function emfChiffres(d) {
    var v = function (k, lib, n) { return '<span class="emf-c' + (k === "m" ? " milieu" : "") + '"><small>' + lib + '</small><b data-emf="' + k + '">' + (n == null ? "–" : n) + '</b></span>'; };
    return v("e", "Entrée", d ? d.entree : null) + v("m", "Milieu", d ? d.milieu : null) + v("f", "Fond", d ? d.fond : null);
  }
  function emfEtat(x, pos, d) {
    if (!x.trou) return gpsPossible() ? "Green à relever sur place" : "Green absent de la carte";
    if (d && d.sur) return "Tu es sur le green";
    if (pos && pos.gps) return (x.trou.est ? "Green estimé · " : x.trou.app ? "Green appris · " : "") + (pos.age > 8 ? "GPS d'il y a " + pos.age + " s" : "GPS ± " + pos.pr + " m");
    if (pos) return "Position posée à la main";
    if (gpsPossible()) return POS.ll ? "Tu es loin de ce trou" : "Recherche du GPS…";
    return "Touche pour te placer";
  }
  function emfAria(x, pos, d) {
    return (d ? "Green" + (x.trou && x.trou.est ? " estimé" : "") + " : entrée à " + d.entree + " mètres, milieu à " + d.milieu + ", fond à " + d.fond + ". " : "") + emfEtat(x, pos, d) + ". Ouvrir la carte du trou";
  }
  function emfLigneHTML() {
    var x = ctxCarte(); if (!x || !x.pc) return "";
    if (!x.carte) return modeSaisie() === "express" ? "" : '<button class="pv-emf vide" type="button" data-a="carte-feuille" data-id="' + x.pc.id + '">' + icone("carte") + '<span>Carte GPS du parcours</span><b>à relier</b></button>';
    var pos = positionJoueur(x), d = pos && x.trou ? distancesGreen(pos.q, dePlat(x.trou.g)) : null;
    return '<button class="pv-emf" type="button" data-a="carte-ouvrir" aria-label="' + at(emfAria(x, pos, d)) + '"><span class="emf-l">' + emfChiffres(d) + '</span>' +
      '<span class="emf-etat"><span id="emf-etat">' + t(emfEtat(x, pos, d)) + '</span>' + icone("carte") + '</span></button>';
  }
  /* Remplace le contenu d'un bouton sans le retirer de la page : un toucher en cours n'est pas perdu. */
  function remplacerDedans(el, html) {
    var tmp = document.createElement("div"); tmp.innerHTML = html;
    var n = tmp.firstElementChild; if (!n) { el.hidden = true; return; }
    el.hidden = false; el.className = n.className; el.innerHTML = n.innerHTML;
    ["aria-label", "data-a", "data-id"].forEach(function (k) { if (n.hasAttribute(k)) el.setAttribute(k, n.getAttribute(k)); else el.removeAttribute(k); });
  }
  /* À chaque nouvelle position : les chiffres changent sur place, sans redessiner le pavé. */
  function majCarteDirect() {
    if (ui.partie !== "saisie" || !etat.partie) return;
    if (ui.pvPanneau === "carte") { majCartePanneau(); return; }
    if (ui.pvCoup || ui.pvPanneau) return;
    var b = document.querySelector("#calque-partie .pv-emf"), s = document.querySelector("#calque-partie .pv-sjc");
    if (b) remplacerDedans(b, emfLigneHTML());
    if (s) remplacerDedans(s, sjcLigneHTML());
  }

  /* ---------- Carte du trou ---------- */
  var VUE = null;   /* dernière carte dessinée : repère et échelle, pour retrouver le point touché */
  function chemin(pts) { return "M" + pts.map(function (q) { return q[0].toFixed(1) + " " + q[1].toFixed(1); }).join("L") + "Z"; }
  /* Photo aérienne de l'IGN sous la carte. rep : rotation de la vue ; k : pixels par mètre ; (cxv, cyv) : centre de la vue.
     Rien dans claude.ai (images extérieures interdites), hors de France, ou si le joueur a choisi le plan. */
  function photoOk(c) { return !dansCadre() && etat.cartePhoto !== false && !!c && photoPossible(c.o); }
  function photoCouche(c, rep, k, cxv, cyv, W, H) {
    if (!photoOk(c)) return "";
    var coins = [[0, 0], [W, 0], [0, H], [W, H]].map(function (p) { return depuisVue(rep, [cxv + (p[0] - W / 2) / k, cyv - (p[1] - H / 2) / k]); });
    var tu = tuilesPour(c.o, coins, zoomPhoto(c.o, k * 1.25), 40); if (!tu.length) return "";
    var a = k * rep.cos, b = -k * rep.sin, cc = -k * rep.sin, d = -k * rep.cos;
    var e = W / 2 + k * (-rep.cx * rep.cos + rep.cy * rep.sin - cxv), f = H / 2 + k * (rep.cx * rep.sin + rep.cy * rep.cos + cyv);
    var n = function (v) { return v.toFixed(4); };
    return '<g class="cp-photo" transform="matrix(' + [a, b, cc, d, e, f].map(n).join(" ") + ')">' + tu.map(function (t) {
      var sx = (t.x1 - t.x0) * 1.004, sy = (t.y1 - t.y0) * 1.004;
      return '<image href="' + at(t.url) + '" width="1" height="1" preserveAspectRatio="none" transform="matrix(' + [sx, 0, 0, -sy, t.x0, t.y1].map(n).join(" ") + ')"/>';
    }).join("") + '</g>';
  }
  /* ---------- Depuis la balle : cône de dispersion du club et dangers devant ---------- */
  function clubsCone() {
    return clubsFourchettes().filter(function (c) { return c.f; }).sort(function (a, b) { return b.f.med - a.f.med; }).map(function (c) { return c.id; });
  }
  /* Cible : le point touché, sinon le milieu du green. Club : choisi par le joueur, sinon celui de la distance. */
  function coneCourant(x, pos) {
    if (!x || !x.trou || !pos) return null;
    var M = ui.carteMesure, aPoint = M && M.pc === x.pc.id && M.h === x.h, cib = aPoint ? M.q : centrePoly(dePlat(x.trou.g));
    var dist = dist2(pos.q, cib); if (dist < 25) return null;
    var l = clubsCone(), id = ui.carteClub && l.indexOf(ui.carteClub) >= 0 ? ui.carteClub : null, auto = !id;
    if (!id) { var cp = clubPour(dist, clubsFourchettes()); id = cp ? cp.id : null; }
    var e = id ? ellipseDe(id) : null; if (!e) return null;
    var cn = coneTir(pos.q, cib, e);
    return cn ? { id: id, auto: auto, e: e, cn: cn, cible: cib, dist: Math.round(dist), point: aPoint } : null;
  }
  function coneHTML(x, pos) {
    if (!x || !x.trou || !pos) return "";
    var C = coneCourant(x, pos), dg = dangersDepuis(pos.q, C ? C.cible : centrePoly(dePlat(x.trou.g)), x.trou), h = '<div class="carte-cone">';
    if (C) {
      var e = C.e, cn = C.cn, l = clubsCone(), i = l.indexOf(C.id);
      h += '<div class="cone-club"><button class="btn petit" type="button" data-a="carte-club" data-v="long"' + (i <= 0 ? " disabled" : "") + ' aria-label="Club plus long">‹</button>' +
        '<p><b>' + t(nomClub(C.id)) + '</b><small>' + t(C.auto ? "choisi pour " + C.dist + " m" : "choisi par toi") + '</small></p>' +
        '<button class="btn petit" type="button" data-a="carte-club" data-v="court"' + (i < 0 || i >= l.length - 1 ? " disabled" : "") + ' aria-label="Club plus court">›</button></div>' +
        '<p class="aide">' + t("La balle tombe le plus souvent entre " + cn.court + " et " + cn.long + " m, sur " + (2 * e.rx) + " m de large" + (e.cx ? ", " + Math.abs(e.cx) + " m à " + (e.cx > 0 ? "droite" : "gauche") + " de la visée" : "") + ". " +
          (cn.reste > 3 ? "Il reste environ " + cn.reste + " m jusqu'" + (C.point ? "à ton point" : "au milieu du green") + "." : cn.reste < -3 ? "Ça dépasse " + (C.point ? "ton point" : "le milieu du green") + " de " + (-cn.reste) + " m." : "Pile sur " + (C.point ? "ton point" : "le milieu du green") + ".") +
          (e.estimeeL || e.estimeeP ? " Largeur estimée d'après ton index : note la direction de tes coups pour l'affiner." : "")) + '</p>' +
        (C.auto ? "" : '<button class="lien" type="button" data-a="carte-club" data-v="auto">Laisser l’appli choisir le club</button>');
    } else if (!clubsCone().length) h += '<p class="aide">' + t("Note des distances avec tes clubs (pendant les parties ou au practice) : la carte dessinera ton cône de dispersion.") + '</p>';
    if (dg.length) h += '<ul class="cone-dangers">' + dg.map(function (d) {
      return '<li><b>' + t(d.nom + " " + d.cote) + '</b> ' + t(d.atteindre ? d.atteindre + " m pour l'atteindre, " + d.passer + " m pour le passer" : "tu es dedans") + '</li>';
    }).join("") + '</ul>';
    return h + '</div>';
  }
  function cartePlanHTML() {
    var x = ctxCarte(), tr = x.trou, pos = positionJoueur(x);
    if (!tr) { VUE = null; return '<p class="carte-vide">' + t("Ce trou n'a pas encore de green sur la carte.") + '</p>'; }
    var rep = repereTrou(tr, pos ? pos.q : null), V = function (q) { return versVue(rep, q); };
    var g = dePlat(tr.g).map(V), l = tr.l ? dePlat(tr.l).map(V) : null;
    var F = function (k) { return (tr[k] || []).map(function (f) { return dePlat(f).map(V); }); };
    var fw = F("f"), eau = F("e"), bk = F("b"), dp = F("d");
    var moi = pos ? V(pos.q) : null, M = ui.carteMesure, mes = M && M.pc === x.pc.id && M.h === x.h ? V(M.q) : null;
    var zoom = ui.carteZoom === "green", pts = g.slice();
    if (zoom) { bk.forEach(function (f) { f.forEach(function (q) { if (Math.abs(q[0]) < 45 && Math.abs(q[1]) < 45) pts.push(q); }); }); if (moi && dist2(moi, [0, 0]) < 70) pts.push(moi); }
    else {
      /* Sans tracé du trou, la carte montre 160 m autour du green : assez pour s'y placer du doigt. */
      if (l) pts = pts.concat(l); else pts.push([-160, -160], [160, 160]);
      [bk, dp, eau].forEach(function (ls) { ls.forEach(function (f) { pts = pts.concat(f); }); });
      if (moi && dist2(moi, [0, 0]) < 650) pts.push(moi);
    }
    if (mes) pts.push(mes);
    var x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity, mg = zoom ? 12 : 22;
    pts.forEach(function (q) { x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); });
    x0 -= mg; x1 += mg; y0 -= mg; y1 += mg;
    var W = 320, sx = Math.max(x1 - x0, 50), sy = Math.max(y1 - y0, 50), H = Math.max(230, Math.min(470, Math.round(W * sy / sx)));
    var k = Math.min(W / sx, H / sy), cxv = (x0 + x1) / 2, cyv = (y0 + y1) / 2;
    var S = function (q) { return [W / 2 + (q[0] - cxv) * k, H / 2 - (q[1] - cyv) * k]; };
    VUE = { rep: rep, k: k, cxv: cxv, cyv: cyv, W: W, H: H };
    var formes = function (ls, cls) { return ls.map(function (f) { return '<path class="' + cls + '" d="' + chemin(f.map(S)) + '"/>'; }).join(""); };
    var d = pos ? distancesGreen(pos.q, dePlat(tr.g)) : null;
    var photo = photoCouche(x.carte, rep, k, cxv, cyv, W, H);
    var h = '<svg class="cp' + (photo ? " photo" : "") + '" viewBox="0 0 ' + W + ' ' + H + '" data-k="' + k.toFixed(4) + '" role="img" aria-label="' + at("Carte du trou, le jeu vers le haut" + (photo ? ", sur photo aérienne" : "") + ". " + emfAria(x, pos, d).replace(". Ouvrir la carte du trou", "")) + '">' +
      '<clipPath id="cp-cadre"><rect width="' + W + '" height="' + H + '" rx="16"/></clipPath><g clip-path="url(#cp-cadre)">' +
      '<rect class="cp-fond" width="' + W + '" height="' + H + '"/>' + photo + formes(fw, "cp-fairway") + formes(eau, "cp-eau") + formes(dp, "cp-depart") + formes(bk, "cp-bunker") +
      '<path class="cp-green' + (tr.est ? " est" : "") + '" d="' + chemin(g.map(S)) + '"/>';
    /* Cercles de distance au milieu du green, tous les 50 m. */
    if (!zoom) for (var rc = 50; rc * k < Math.max(W, H) && rc <= 500; rc += 50) {
      var cc = S([0, 0]), ly = cc[1] + rc * k - 3;
      h += '<circle class="cp-cercle" cx="' + cc[0].toFixed(1) + '" cy="' + cc[1].toFixed(1) + '" r="' + (rc * k).toFixed(1) + '"/>' +
        (ly < H - 4 ? '<text class="cp-cercle-lib" x="' + (cc[0] + 4).toFixed(1) + '" y="' + ly.toFixed(1) + '">' + rc + '</text>' : '');
    }
    if (l && !zoom) {
      var sd = S(l[0]);
      h += '<polyline class="cp-ligne" points="' + l.concat([[0, 0]]).map(function (q) { var s = S(q); return s[0].toFixed(1) + "," + s[1].toFixed(1); }).join(" ") + '"/>' +
        '<g class="cp-tee"><rect x="' + (sd[0] - 6).toFixed(1) + '" y="' + (sd[1] - 6).toFixed(1) + '" width="12" height="12" rx="3"/><text x="' + sd[0].toFixed(1) + '" y="' + (sd[1] + 4).toFixed(1) + '" text-anchor="middle">D</text></g>';
    }
    /* Green en cours de dessin sur la photo */
    var De = ui.carteDessin && ui.carteDessin.pc === x.pc.id && ui.carteDessin.h === x.h ? ui.carteDessin : null;
    if (De && De.e) { var se = S(V(De.e)); h += '<circle class="cp-bord dessin" cx="' + se[0].toFixed(1) + '" cy="' + se[1].toFixed(1) + '" r="6"/>'; }
    var c0 = S([0, 0]);
    h += '<circle class="cp-milieu" cx="' + c0[0].toFixed(1) + '" cy="' + c0[1].toFixed(1) + '" r="3"/>';
    if (moi && d && !d.sur) {
      /* L'axe de jeu, et les deux bords du green qu'il croise. */
      var dm = dist2(moi, [0, 0]), ux = -moi[0] / dm, uy = -moi[1] / dm;
      var pe = S([moi[0] + ux * d.entree, moi[1] + uy * d.entree]), pf = S([moi[0] + ux * d.fond, moi[1] + uy * d.fond]), pm = S(moi);
      h += '<line class="cp-axe" x1="' + pm[0].toFixed(1) + '" y1="' + pm[1].toFixed(1) + '" x2="' + pf[0].toFixed(1) + '" y2="' + pf[1].toFixed(1) + '"/>' +
        '<circle class="cp-bord" cx="' + pe[0].toFixed(1) + '" cy="' + pe[1].toFixed(1) + '" r="4"/><circle class="cp-bord" cx="' + pf[0].toFixed(1) + '" cy="' + pf[1].toFixed(1) + '" r="4"/>';
    }
    /* Cône de dispersion du club, de la balle vers la cible. */
    var CN = moi && !zoom && !(d && d.sur) ? coneCourant(x, pos) : null;
    if (CN) {
      var sb = S(moi), sg = S(V(CN.cn.gauche)), sdr = S(V(CN.cn.droite)), sc = S(V(CN.cn.c));
      h += '<path class="cp-cone" d="M' + sb[0].toFixed(1) + ' ' + sb[1].toFixed(1) + 'L' + sg[0].toFixed(1) + ' ' + sg[1].toFixed(1) + 'L' + sdr[0].toFixed(1) + ' ' + sdr[1].toFixed(1) + 'Z"/>' +
        '<path class="cp-ellipse-tir" d="' + chemin(CN.cn.pts.map(function (q) { return S(V(q)); })) + '"/>' +
        '<text class="cp-cone-lib" x="' + sc[0].toFixed(1) + '" y="' + (sc[1] + 4).toFixed(1) + '" text-anchor="middle">' + t(courtSac(CLUB[CN.id]).replace(/^(\d)$/, "Fer $1")) + '</text>';
    }
    if (mes) {
      var sm = S(mes);
      if (moi) { var s0 = S(moi); h += '<line class="cp-fil" x1="' + s0[0].toFixed(1) + '" y1="' + s0[1].toFixed(1) + '" x2="' + sm[0].toFixed(1) + '" y2="' + sm[1].toFixed(1) + '"/>'; }
      h += '<line class="cp-fil" x1="' + sm[0].toFixed(1) + '" y1="' + sm[1].toFixed(1) + '" x2="' + c0[0].toFixed(1) + '" y2="' + c0[1].toFixed(1) + '"/>' +
        '<g class="cp-mesure"><circle cx="' + sm[0].toFixed(1) + '" cy="' + sm[1].toFixed(1) + '" r="7"/><path d="M' + (sm[0] - 11).toFixed(1) + ' ' + sm[1].toFixed(1) + 'h22M' + sm[0].toFixed(1) + ' ' + (sm[1] - 11).toFixed(1) + 'v22"/></g>';
    }
    if (moi) {
      var sj = S(moi);
      if (pos.gps) h += '<circle class="cp-halo" cx="' + sj[0].toFixed(1) + '" cy="' + sj[1].toFixed(1) + '" r="' + Math.max(9, Math.min(70, pos.pr * k)).toFixed(1) + '"/>';
      h += '<circle class="cp-moi' + (pos.gps ? "" : " main") + '" cx="' + sj[0].toFixed(1) + '" cy="' + sj[1].toFixed(1) + '" r="6.5"/>';
    }
    return h + '</g></svg>';
  }
  function carteChiffresHTML() {
    var x = ctxCarte(), pos = positionJoueur(x), d = pos && x.trou ? distancesGreen(pos.q, dePlat(x.trou.g)) : null;
    return '<div class="emf-grand" role="group" aria-label="' + at(emfAria(x, pos, d).replace(". Ouvrir la carte du trou", "")) + '">' + emfChiffres(d) + '</div>' +
      '<p class="carte-etat">' + t(emfEtat(x, pos, d)) + '</p>';
  }
  function carteInfo() {
    var x = ctxCarte(), pos = positionJoueur(x), M = ui.carteMesure, De = ui.carteDessin;
    if (De && De.pc === x.pc.id && De.h === x.h) return De.e ? "Touche maintenant le fond du green, au bout opposé." : "Touche l'entrée du green sur la photo : le bord le plus proche du départ.";
    if (!x.trou) return "";
    if (M && M.pc === x.pc.id && M.h === x.h) {
      var reste = Math.round(dist2(M.q, centrePoly(dePlat(x.trou.g))));
      return pos ? "Point touché : à " + Math.round(dist2(pos.q, M.q)) + " m de toi, puis " + reste + " m jusqu'au milieu du green." : "Point touché : à " + reste + " m du milieu du green.";
    }
    if (ui.carteMode === "position") return "Touche la carte là où est ta balle : les distances et le cône partent de ce point.";
    if (pos && pos.gps) return "Touche la carte pour mesurer un point : un bunker à passer, un endroit où poser la balle. Le cône vise ce point.";
    return ui.carteMode === "mesure" ? "Touche la carte pour mesurer un point." : "Touche la carte là où est ta balle : les distances et le cône partent de ce point.";
  }
  /* Relevé sur place : deux positions GPS, l'entrée puis le fond du green. */
  function releveHTML(x) {
    if (!gpsPossible() || (x.trou && !x.trou.rel && !x.trou.est)) return "";
    var R = ui.releve && ui.releve.pc === x.pc.id && ui.releve.h === x.h ? ui.releve : {};
    return '<div class="carte-releve"><h4>' + t(x.trou && x.trou.est ? "Green estimé : le relever" : x.trou ? "Refaire le relevé du green" : "Relever ce green") + '</h4>' +
      '<p class="aide">' + t("Marche jusqu'à l'entrée du green et marque-la, puis fais de même au fond. Deux touchers, une fois pour toutes.") + '</p>' +
      '<div class="carte-releve-b"><button class="btn" type="button" data-a="carte-releve" data-v="e" aria-pressed="' + !!R.e + '"' + (R.attente ? " disabled" : "") + '>' + t(R.attente === "e" ? "Mesure GPS…" : R.e ? "Entrée marquée ✓" : "Je suis à l'entrée") + '</button>' +
      '<button class="btn" type="button" data-a="carte-releve" data-v="f" aria-pressed="' + !!R.f + '"' + (R.attente ? " disabled" : "") + '>' + t(R.attente === "f" ? "Mesure GPS…" : R.f ? "Fond marqué ✓" : "Je suis au fond") + '</button></div>' +
      (R.attente ? '<p class="aide" role="status">' + t("Reste immobile, téléphone à plat devant toi : l'appli prend jusqu'à cinq points GPS en dix secondes et en fait la moyenne.") + '</p>' : '') +
      (R.msg ? '<p class="erreur" role="alert">' + t(R.msg) + '</p>' : '') + '</div>';
  }
  function carteReglagesHTML() {
    var x = ctxCarte(), pos = positionJoueur(x), h = coneHTML(x, pos);
    if (x.trou) {
      h += '<div class="carte-reglages">' + choixLigne("carte-zoom", [{ v: "trou", t: "Trou entier" }, { v: "green", t: "Green" }], ui.carteZoom === "green" ? "green" : "trou");
      if (positionGPS(x)) h += choixLigne("carte-mode", [{ v: "mesure", t: "Mesurer un point" }, { v: "position", t: "Placer la balle" }], ui.carteMode === "position" ? "position" : "mesure");
      else h += choixLigne("carte-mode", [{ v: "position", t: "Placer la balle" }, { v: "mesure", t: "Mesurer" }], ui.carteMode === "mesure" ? "mesure" : "position");
      h += '</div>';
      if (positionGPS(x) && pos && !pos.gps) h += '<button class="btn large" type="button" data-a="carte-gps">' + icone("position") + t(" Revenir à ma position GPS") + '</button>';
    }
    if (x.carte && !dansCadre() && photoPossible(x.carte.o)) {
      h += '<div class="carte-reglages">' + choixLigne("carte-fond", [{ v: "plan", t: "Plan" }, { v: "photo", t: "Photo aérienne" }], etat.cartePhoto !== false ? "photo" : "plan") + '</div>';
      if (etat.cartePhoto !== false && x.trou) {
        var De = ui.carteDessin && ui.carteDessin.pc === x.pc.id && ui.carteDessin.h === x.h;
        h += '<button class="btn large" type="button" data-a="carte-dessin" aria-pressed="' + !!De + '">' + t(De ? "Annuler le dessin du green" : x.trou ? "Redessiner le green sur la photo" : "Dessiner le green sur la photo") + '</button>';
      }
    }
    return h + releveHTML(x);
  }
  function cartePanneauHTML() {
    var x = ctxCarte(), p = x.p, v = trouCourant();
    return '<div class="pv-voile" data-a="carte-fermer" aria-hidden="true"></div><div class="pv-panneau carte" role="dialog" aria-modal="true" aria-labelledby="carte-titre">' +
      '<header class="carte-tete"><h3 id="carte-titre">' + t("Trou " + numeroTrou(p, p.i) + " · par " + v[5]) + '</h3><button class="fermer" type="button" data-a="carte-fermer" id="carte-fermer">Fermer</button></header>' +
      '<div id="carte-chiffres" aria-live="polite">' + carteChiffresHTML() + '</div>' +
      '<div class="carte-plan" id="carte-plan" data-a="carte-toucher">' + cartePlanHTML() + '</div>' +
      '<p class="carte-info" id="carte-info" aria-live="polite">' + t(carteInfo()) + '</p>' +
      '<div id="carte-reglages">' + carteReglagesHTML() + '</div>' +
      '<p class="carte-credit">' + t((x.carte && x.carte.src === "releve" ? "Greens relevés sur place." : "Carte : © les contributeurs d'OpenStreetMap.") + (photoOk(x.carte) ? " Photo aérienne : © IGN." : "")) + '</p>' +
      '<div class="pv-panneau-pied"><button class="btn" type="button" data-a="carte-fermer">Fermer</button>' +
      (x.trou && modeSaisie() !== "express" ? '<button class="btn principal" type="button" data-a="sjc-ouvrir">Se joue comme</button>' : '') + '</div></div>';
  }
  function majCartePanneau() {
    var z = document.getElementById("carte-plan"); if (!z) return;
    document.getElementById("carte-chiffres").innerHTML = carteChiffresHTML();
    z.innerHTML = cartePlanHTML();
    document.getElementById("carte-info").textContent = carteInfo();
    var r = document.getElementById("carte-reglages"), foc = document.activeElement && r.contains(document.activeElement) ? document.activeElement : null;
    var sel = foc ? '[data-a="' + foc.getAttribute("data-a") + '"][data-v="' + foc.getAttribute("data-v") + '"]' : null;
    r.innerHTML = carteReglagesHTML();
    if (sel) { var b = r.querySelector(sel); if (b) b.focus({ preventScroll: true }); }
  }
  ACTIONS["carte-ouvrir"] = function () {
    if (!etat.partie) return;
    ui.pvCoup = null; ui.pvPanneau = "carte"; ui.carteMesure = null; ui.carteDessin = null;
    rendrePartie(); focusPartie("#carte-fermer");
  };
  ACTIONS["carte-fermer"] = function () { ui.pvPanneau = null; rendrePartie(); focusPartie(".pv-emf"); };
  ACTIONS["carte-fond"] = function (el) { etat.cartePhoto = el.getAttribute("data-v") === "photo"; if (!etat.cartePhoto) ui.carteDessin = null; sauver(); majCartePanneau(); };
  ACTIONS["carte-dessin"] = function () {
    var x = ctxCarte(); if (!x || !x.carte) return;
    ui.carteDessin = ui.carteDessin && ui.carteDessin.pc === x.pc.id && ui.carteDessin.h === x.h ? null : { pc: x.pc.id, h: x.h, e: null };
    if (ui.carteDessin) ui.carteZoom = "trou";
    majCartePanneau();
  };
  ACTIONS["carte-zoom"] = function (el) { ui.carteZoom = el.getAttribute("data-v") === "green" ? "green" : "trou"; majCartePanneau(); };
  ACTIONS["carte-mode"] = function (el) { ui.carteMode = el.getAttribute("data-v") === "mesure" ? "mesure" : "position"; majCartePanneau(); };
  /* Retour à la position GPS après avoir posé la balle à la main. */
  ACTIONS["carte-gps"] = function () { POS.main = null; ui.carteMode = "mesure"; majCartePanneau(); };
  /* Club du cône : plus long, plus court, ou choisi par l'appli d'après la distance. */
  ACTIONS["carte-club"] = function (el) {
    var x = ctxCarte(), cn = coneCourant(x, positionJoueur(x)), l = clubsCone();
    var v = el.getAttribute("data-v");
    if (v === "auto") ui.carteClub = null;
    else if (cn && l.length) {
      var i = l.indexOf(cn.id), j = Math.max(0, Math.min(l.length - 1, (i < 0 ? 0 : i) + (v === "long" ? -1 : 1)));
      ui.carteClub = l[j];
    }
    majCartePanneau();
  };
  ACTIONS["carte-toucher"] = function (el, ev) {
    var svg = el.querySelector("svg"), x = ctxCarte();
    var De = ui.carteDessin && x && ui.carteDessin.pc === x.pc.id && ui.carteDessin.h === x.h ? ui.carteDessin : null;
    if (!VUE || !svg || !x || (!x.trou && !De) || !ev || ev.detail === 0) return;
    var r = svg.getBoundingClientRect(), s = Math.min(r.width / VUE.W, r.height / VUE.H);
    if (!(s > 0)) return;
    var px = (ev.clientX - r.left - (r.width - VUE.W * s) / 2) / s, py = (ev.clientY - r.top - (r.height - VUE.H * s) / 2) / s;
    if (px < 0 || py < 0 || px > VUE.W || py > VUE.H) return;
    var q = depuisVue(VUE.rep, [VUE.cxv + (px - VUE.W / 2) / VUE.k, VUE.cyv - (py - VUE.H / 2) / VUE.k]), pos = positionJoueur(x);
    q = [Math.round(q[0] * 10) / 10, Math.round(q[1] * 10) / 10];
    if (De) {
      if (!De.e) { De.e = q; majCartePanneau(); return; }
      if (dist2(De.e, q) < 6 || dist2(De.e, q) > 80) { message("Entrée et fond doivent être à 6 à 80 m l'un de l'autre."); return; }
      poserReleve(x.carte, x.h + 1, De.e, q); x.carte.maj = auj(); ui.carteDessin = null;
      message(poserCarte(x.pc.id, x.carte) ? "Green du trou " + (x.h + 1) + " dessiné." : "Le téléphone n'a plus de place pour enregistrer la carte.");
      rendrePartie(); focusPartie('[data-a="carte-dessin"]'); return;
    }
    var placer = ui.carteMode === "position" || (!positionGPS(x) && ui.carteMode !== "mesure");
    if (placer) { POS.main = { pc: x.pc.id, h: x.h, q: q }; ui.carteMode = "position"; }
    else ui.carteMesure = { pc: x.pc.id, h: x.h, q: q };
    majCartePanneau();
  };
  ACTIONS["carte-releve"] = function (el) {
    var x = ctxCarte(), k = el.getAttribute("data-v") === "f" ? "f" : "e"; if (!x || !x.pc) return;
    if (!ui.releve || ui.releve.pc !== x.pc.id || ui.releve.h !== x.h) ui.releve = { pc: x.pc.id, h: x.h, e: null, f: null };
    var R = ui.releve, sel = '[data-a="carte-releve"][data-v="' + k + '"]';
    if (R.attente) return;
    var poser = function (ll, pr) {
      if (ui.releve !== R) return;
      if (!ll) R.msg = GPS.refuse ? "Position refusée par le téléphone." : "Aucune position GPS récente. Réessaie à découvert.";
      else if (pr > 25) R.msg = "Le GPS est encore imprécis (± " + pr + " m). Attends quelques secondes et recommence.";
      else {
        R.msg = ""; R[k] = ll;
        if (R.e && R.f) {
          var c = carteDe(x.pc.id) || carteVide(R.e[0], R.e[1], auj());
          poserReleve(c, x.h + 1, projeter(c.o, R.e[0], R.e[1]), projeter(c.o, R.f[0], R.f[1]));
          c.maj = auj();
          ui.releve = null;
          message(poserCarte(x.pc.id, c) ? "Green du trou " + (x.h + 1) + " enregistré." : "Le téléphone n'a plus de place pour enregistrer la carte.");
        }
      }
      if (ui.pvPanneau === "carte") { rendrePartie(); focusPartie(ui.releve ? sel : "#carte-fermer"); }
    };
    /* Trois points GPS (celui de l'instant du toucher, puis les suivants), moyennés : jamais une position de plus de 2 secondes. */
    R.attente = k; R.msg = "";
    if (ui.pvPanneau === "carte") { rendrePartie(); focusPartie(sel); }
    positionFraiche(function (ll, pr) { R.attente = null; poser(ll, pr); }, { age: 2000, n: 5, prMax: 8, attente: 10000 });
  };
  ACTIONS["sjc-carte"] = function () { var s = etatSjc(); s.brut = null; rePanneau('[data-a="sjc-brut"][data-d="1"]'); };

  /* ---------- Fiche « Carte GPS » d'un parcours (ou d'un golf à ajouter) ---------- */
  /* Lecture d'une adresse JSON, abandonnée au bout de ms millisecondes. */
  function chargerJSON(url, ms, opt) {
    var ctl = typeof AbortController === "function" ? new AbortController() : null, tm = ctl ? setTimeout(function () { ctl.abort(); }, ms) : null;
    var o = opt || {}; if (ctl) o.signal = ctl.signal;
    return fetch(url, o).then(function (r) { if (!r.ok) throw new Error("http " + r.status); return r.json(); })
      .then(function (d) { if (tm) clearTimeout(tm); return d; }, function (e) { if (tm) clearTimeout(tm); throw e; });
  }
  function attendre(ms) { return new Promise(function (ok) { setTimeout(ok, ms); }); }
  /* Overpass ne sert plus que de secours : ses serveurs publics sont souvent saturés. */
  function overpass(q, i) {
    i = i || 0;
    return chargerJSON(OVERPASS[i], 15000, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" }, body: "data=" + encodeURIComponent(q) })
      .then(null, function (e) { if (i + 1 < OVERPASS.length) return overpass(q, i + 1); throw e; });
  }
  function resumeCarte(c, pc) {
    var n = pc ? pc.pars.length : c.trous.length, ok = 0, est = 0, app = 0;
    for (var i = 0; i < n; i++) { var tr = trouCarte(c, i); if (tr) { ok++; if (tr.est) est++; if (tr.app) app++; } }
    return { n: n, ok: ok, est: est, libres: c.libres.length, texte: (c.src === "releve" ? "Relevé sur place" : c.src === "fichier" ? "Fichier importé" : "OpenStreetMap") + " : " + ok + " green" + (ok > 1 ? "s" : "") + " sur " + n + (c.maj ? ", le " + dateCourte(c.maj).replace(/\.$/, "") : "") + "." +
      (est ? " " + (est === ok ? "Tous estimés" : est + " estimé" + (est > 1 ? "s" : "")) + " d'après les drapeaux : le milieu correspond au drapeau, l'entrée et le fond sont approchés." : "") +
      (app ? " " + pluriel(app, "green") + " appris au fil de tes parties." : "") +
      (est ? " Chaque partie jouée avec le GPS les affine : après " + CARTE_APPRIS.jours + " parties, un green estimé devient un green appris." : "") };
  }
  /* Vue d'ensemble, nord en haut : greens numérotés, greens sans numéro à toucher. */
  function carteApercuHTML(c) {
    var gs = [], x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    c.trous.forEach(function (tr, i) { if (tr && tr.g) gs.push({ p: dePlat(tr.g), n: i + 1, est: tr.est }); });
    c.libres.forEach(function (x, i) { gs.push({ p: dePlat(x.g), libre: i, est: x.est }); });
    if (!gs.length) return "";
    gs.forEach(function (g) { g.c = centrePoly(g.p); g.p.forEach(function (q) { x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); }); });
    x0 -= 40; x1 += 40; y0 -= 40; y1 += 40;
    var W = 320, sx = Math.max(x1 - x0, 120), sy = Math.max(y1 - y0, 120), H = Math.max(200, Math.min(420, Math.round(W * sy / sx))), k = Math.min(W / sx, H / sy);
    var S = function (q) { return [W / 2 + (q[0] - (x0 + x1) / 2) * k, H / 2 - (q[1] - (y0 + y1) / 2) * k]; };
    var photo = photoCouche(c, { cx: 0, cy: 0, cos: 1, sin: 0 }, k, (x0 + x1) / 2, (y0 + y1) / 2, W, H);
    var h = '<svg class="cp apercu' + (photo ? " photo" : "") + '" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + at("Vue d'ensemble du parcours, nord en haut : " + gs.filter(function (g) { return g.n; }).length + " greens numérotés" + (c.libres.length ? ", " + c.libres.length + " sans numéro" : "")) + '">' +
      '<clipPath id="ap-cadre"><rect width="' + W + '" height="' + H + '" rx="16"/></clipPath><g clip-path="url(#ap-cadre)">' +
      '<rect class="cp-fond" width="' + W + '" height="' + H + '"/>' + photo;
    gs.forEach(function (g) {
      var s = S(g.c), sel = g.libre != null && ui.carteNum === g.libre;
      h += '<g' + (g.libre != null ? ' class="cp-libre' + (sel ? " sel" : "") + '" data-a="carte-num" data-v="' + g.libre + '"' : '') + '><path class="cp-green' + (g.est ? " est" : "") + '" d="' + chemin(g.p.map(S)) + '"/>' +
        '<circle class="cp-pastille" cx="' + s[0].toFixed(1) + '" cy="' + s[1].toFixed(1) + '" r="10"/><text x="' + s[0].toFixed(1) + '" y="' + (s[1] + 4).toFixed(1) + '" text-anchor="middle">' + (g.n || "?") + '</text></g>';
    });
    return h + '</g></svg>';
  }
  function carteRechercheHTML(pc) {
    var R = ui.carteRech || {}, h = "";
    if (dansCadre()) {
      return '<p>' + t("Ici, dans claude.ai, la page n'a pas le droit de télécharger la carte. Elle se télécharge depuis la version installée de l'appli. Tu peux aussi importer un fichier exporté d'OpenStreetMap.") + '</p>';
    }
    h += '<form class="carte-form" data-f="carte-chercher" novalidate><label for="carte-q">Nom du golf</label><div class="serie-saisie"><input id="carte-q" type="text" maxlength="40" autocomplete="off" enterkeyhint="search" value="' + at(R.q != null ? R.q : pc ? pc.nom : "") + '">' +
      '<button class="btn principal" type="submit">Chercher</button></div></form>' +
      (gpsPossible() ? '<button class="btn large" type="button" data-a="carte-autour">' + icone("position") + ' Chercher autour de moi</button>' : '');
    if (R.etat === "cherche" || R.etat === "charge") h += '<p class="carte-attente" role="status">' + t(R.etat === "cherche" ? "Recherche en cours…" : "Téléchargement de " + R.nom + "…") + '</p>';
    else if (R.etat === "liste") h += '<ul class="liste-exos carte-resultats">' + R.l.map(function (g, i) {
      return '<li><button class="ligne" type="button" data-a="carte-choisir" data-v="' + i + '"><span class="quoi"><b>' + t(g.nom) + '</b><small>' + t(g.lieu ? g.lieu : g.c[0].toFixed(3).replace(".", ",") + "° N, " + g.c[1].toFixed(3).replace(".", ",") + "° E") + '</small></span><span class="chev" aria-hidden="true">›</span></button></li>';
    }).join("") + '</ul>';
    else if (R.etat) h += '<p class="erreur" role="alert">' + t(R.etat === "court" ? "Donne au moins trois lettres du nom du golf, par exemple « Jonchère »."
      : R.etat === "vide" ? "Aucun golf trouvé sous ce nom. Essaie un seul mot du nom, ou la recherche autour de toi une fois sur place."
      : R.etat === "sansgreen" ? "Ce golf est sur OpenStreetMap, mais ni ses greens ni ses trous n'y sont dessinés. Tu peux relever les greens toi-même sur place, deux touchers par green."
      : R.etat === "plein" ? "Tu as déjà 20 parcours. Supprimes-en un pour ajouter celui-ci."
      : R.etat === "place" ? "Le téléphone n'a plus de place pour enregistrer la carte."
      : R.etat === "fichier" ? "Ce fichier n'est pas un export OpenStreetMap lisible (JSON ou GeoJSON)."
      : R.etat === "position" ? "Position introuvable. Cherche plutôt par le nom du golf."
      : "Les serveurs d'OpenStreetMap n'ont pas répondu. Vérifie le réseau et réessaie dans quelques minutes.") + '</p>';
    return h;
  }
  function carteFeuilleHTML(id) {
    var pc = id === "nouveau" ? null : parcoursDe(id), c = pc ? carteDe(pc.id) : null, R = ui.carteRech || {};
    var h = '<button class="voile" type="button" data-a="fermer-feuille" aria-label="Fermer la carte" tabindex="-1"></button>' +
      '<section class="feuille" role="dialog" aria-modal="true" aria-labelledby="f-titre" id="feuille">' +
      '<header><p class="surtitre">Carte GPS</p><h2 id="f-titre">' + t(pc ? pc.nom : "Ajouter mon golf") + '</h2><button class="fermer" type="button" data-a="fermer-feuille" id="f-fermer">Fermer</button></header>';
    if (c) {
      var rs = resumeCarte(c, pc);
      h += '<p class="carte-resume">' + t(rs.texte) + '</p>' + (R.etat === "ok" ? '<p class="carte-ok" role="status">' + t("Carte enregistrée : les distances s'affichent sur le pavé pendant la partie.") + '</p>' : '') + carteApercuHTML(c) + photosHorsLigneHTML(pc, c);
      if (rs.libres) {
        h += '<p class="aide">' + t(rs.ok < rs.n ? "Des greens n'ont pas de numéro. Touche un green marqué « ? », puis choisis son trou." : pluriel(rs.libres, "green") + " sans numéro (putting green, autre parcours) : rien à faire.") + '</p>';
        if (ui.carteNum != null && c.libres[ui.carteNum]) h += '<div class="carte-numeros" role="group" aria-label="Numéro du trou de ce green">' + pc.pars.map(function (v, i) {
          return '<button type="button" data-a="carte-num-ok" data-v="' + (i + 1) + '"' + (trouCarte(c, i) ? ' class="pris"' : '') + '>' + (i + 1) + '</button>';
        }).join("") + '</div>';
      }
      if (rs.est && gpsPossible()) h += '<p class="aide">' + t("Pour des distances exactes, relève un green estimé pendant la partie : carte du trou, puis « Je suis à l'entrée » et « Je suis au fond ».") + '</p>';
    } else if (pc) h += '<p>' + t("Ce parcours n'a pas encore de carte. Avec elle, le pavé affiche la distance à l'entrée, au milieu et au fond du green.") + '</p>';
    else h += '<p>' + t("Cherche ton golf : l'appli crée le parcours et télécharge ses greens. La carte reste ensuite dans le téléphone, même sans réseau.") + '</p>';
    h += '<h3 class="titre-bloc">' + t(c ? "Mettre à jour depuis OpenStreetMap" : "Trouver le golf sur OpenStreetMap") + '</h3>' + carteRechercheHTML(pc) +
      '<details class="aide-pli"' + (dansCadre() ? " open" : "") + '><summary>Importer un fichier</summary><div><p>' + t("Un export OpenStreetMap du golf, au format JSON ou GeoJSON (par exemple depuis Overpass Turbo).") + '</p>' +
      '<label class="btn large carte-fichier">Choisir un fichier<input type="file" class="vh" data-c="carte-fichier" accept=".json,.geojson,application/json,application/geo+json"></label></div></details>';
    if (pc && !c && gpsPossible()) h += '<h3 class="titre-bloc">Sans OpenStreetMap</h3><p>' + t("Tu peux relever chaque green sur place : pendant la partie, ouvre la carte du trou, marque l'entrée puis le fond du green.") + '</p>' +
      '<button class="btn large" type="button" data-a="carte-vide" data-id="' + pc.id + '">Relever les greens moi-même</button>';
    if (c) h += '<p style="margin-top:16px"><button class="btn danger large" type="button" data-a="carte-suppr" data-id="' + pc.id + '">Supprimer cette carte</button></p>';
    return h + '<p class="carte-credit">' + t("Données cartographiques : © les contributeurs d'OpenStreetMap, sous licence ODbL. Recherche : Nominatim." + (photoOk(c) ? " Photos aériennes : © IGN." : "")) + '</p></section>';
  }
  /* Photos aériennes gardées dans le téléphone, pour jouer sans réseau. */
  var CACHE_PHOTOS = "coach-photos-1";
  function photosHorsLigneHTML(pc, c) {
    if (!photoOk(c) || typeof caches === "undefined" || !("serviceWorker" in navigator)) return "";
    var P = ui.photosDl && ui.photosDl.pc === pc.id ? ui.photosDl : null;
    return '<div class="carte-photos"><button class="btn large" type="button" data-a="carte-photos" data-id="' + pc.id + '"' + (P && !P.fini ? " disabled" : "") + '>' + icone("carte") + t(" Garder les photos aériennes pour jouer sans réseau") + '</button>' +
      (P ? '<p class="aide" role="status">' + t(P.fini ? (P.ko ? P.ok + " photos gardées sur " + P.total + ". Réessaie avec un meilleur réseau pour les autres." : "Les " + P.total + " photos du parcours sont dans le téléphone.") : "Téléchargement : " + P.ok + " sur " + P.total + "…") + '</p>'
        : '<p class="aide">' + t("Environ " + Math.max(1, Math.round(tuilesParcours(c).length * 0.03)) + " Mo, à faire en wifi avant d'aller au golf.") + '</p>') + '</div>';
  }
  ACTIONS["carte-photos"] = function (el) {
    var pc = parcoursDe(el.getAttribute("data-id")), c = pc ? carteDe(pc.id) : null; if (!c || typeof caches === "undefined") return;
    var urls = tuilesParcours(c), P = ui.photosDl = { pc: pc.id, total: urls.length, ok: 0, ko: 0, fini: false }, i = 0;
    var maj = function () { if (ui.photosDl === P) { var z = document.querySelector("#feuille .carte-photos"); if (z) z.outerHTML = photosHorsLigneHTML(pc, c); } };
    maj();
    caches.open(CACHE_PHOTOS).then(function (cache) {
      var suivant = function () {
        if (i >= urls.length) return Promise.resolve();
        var u = urls[i++];
        return cache.match(u).then(function (g) {
          return g ? true : fetch(u, { mode: "cors" }).then(function (r) { if (!r.ok) throw new Error("http"); return cache.put(u, r); });
        }).then(function () { P.ok++; }, function () { P.ko++; }).then(function () { if ((P.ok + P.ko) % 8 === 0) maj(); return suivant(); });
      };
      /* Quatre téléchargements à la fois. */
      return Promise.all([suivant(), suivant(), suivant(), suivant()]);
    }).then(function () { P.fini = true; maj(); }, function () { P.fini = true; P.ko = P.total - P.ok; maj(); });
  };
  function majFeuilleCarte(sel) {
    if (!ui.feuille || !ui.feuille.carte) return;
    rendreFeuilleSeule();
    var b = sel ? document.querySelector("#feuille " + sel) : null; if (b) b.focus({ preventScroll: true });
  }
  function ouvrirCarteFeuille(id, el) {
    ui.feuille = { carte: id }; ui.feuilleVue = false; ui.carteRech = null; ui.carteNum = null; ui.retourFocus = el || document.activeElement;
    rendreFeuille(); var b = document.getElementById("f-fermer"); if (b) b.focus();
  }
  ACTIONS["carte-feuille"] = function (el) { var id = el.getAttribute("data-id"); if (id === "nouveau" || parcoursDe(id)) ouvrirCarteFeuille(id, el); };
  ACTIONS["carte-nouveau"] = function (el) { ouvrirCarteFeuille("nouveau", el); };
  /* Recherche : Nominatim d'abord (rapide), Overpass en secours. s = { urls, pres, req }. */
  function chercherGolfs(s, q) {
    ui.carteRech = { etat: "cherche", q: q }; majFeuilleCarte();
    var essai = function (i) {
      return chargerJSON(s.urls[i], 12000).then(function (d) {
        var l = lireNominatim(d, s.pres);
        /* Nominatim demande au plus une requête par seconde. */
        return l.length || i + 1 >= s.urls.length ? l : attendre(1100).then(function () { return essai(i + 1); });
      });
    };
    essai(0).then(null, function () { return overpass(s.req).then(function (d) { return lireGolfs(d); }); })
      .then(function (l) { ui.carteRech = l.length ? { etat: "liste", l: l, q: q } : { etat: "vide", q: q }; }, function () { ui.carteRech = { etat: "erreur", q: q }; })
      .then(function () { if (ui.carteRech.q === q) majFeuilleCarte(ui.carteRech.etat === "liste" ? '[data-a="carte-choisir"]' : "#carte-q"); });
  }
  FORMULAIRES["carte-chercher"] = function () {
    var inp = document.getElementById("carte-q"), q = texteCourt(inp ? inp.value : "", 40), u = urlRechercheGolf(q);
    if (!u) { ui.carteRech = { etat: "court", q: q }; majFeuilleCarte("#carte-q"); return; }
    var urls = [u], u2 = urlRechercheGolf(q, true); if (u2 !== u) urls.push(u2);
    chercherGolfs({ urls: urls, req: requeteNom(q) }, q);
  };
  ACTIONS["carte-autour"] = function () {
    var inp = document.getElementById("carte-q"), q = inp ? inp.value : "";
    ui.carteRech = { etat: "cherche", q: q }; majFeuilleCarte();
    prendrePosition(function (ll) {
      if (!ll) { ui.carteRech = { etat: "position", q: q }; majFeuilleCarte("#carte-q"); return; }
      chercherGolfs({ urls: [urlGolfsAutour(ll[0], ll[1])], pres: ll, req: requeteAutour(ll[0], ll[1]) }, q);
    });
  };
  ACTIONS["carte-choisir"] = function (el) {
    var R = ui.carteRech, g = R && R.l ? R.l[parseInt(el.getAttribute("data-v"), 10)] : null; if (!g) return;
    ui.carteRech = { etat: "charge", nom: g.nom, q: R.q }; majFeuilleCarte();
    /* L'API d'OpenStreetMap d'abord, Overpass en secours. */
    var lire = function (data) { var r = construireCarte(data, "osm", auj()); if (!r && !(data && data.elements && data.elements.length)) throw new Error("vide"); return r; };
    chargerJSON(urlCarteOSM(g.bornes), 20000).then(lire).then(null, function () { return overpass(requeteGolf(g.bornes)).then(lire); })
      .then(function (r) { installerCarte(r, g.nom); }, function () { ui.carteRech = { etat: "erreur", q: R.q }; majFeuilleCarte("#carte-q"); });
  };
  function creerParcoursCarte(r, nom) {
    if (etat.parcours.length >= 20) return null;
    var num = 1, pars = [], n = r.bilan.numerotes > 9 || r.bilan.traces > 9 || r.bilan.greens > 13 ? 18 : 9;
    etat.parcours.forEach(function (x) { num = Math.max(num, parseInt(x.id.slice(1), 10) + 1); });
    for (var i = 0; i < n; i++) pars.push(0);
    var pc = { id: "p" + num, nom: texteCourt(nom || r.bilan.nom, 40) || "Mon golf", pars: pars, sss: null, slope: null };
    etat.parcours.push(pc);
    return pc;
  }
  function installerCarte(r, nom) {
    var f = ui.feuille, q = ui.carteRech ? ui.carteRech.q : null; if (!f || !f.carte) return;
    if (!r) { ui.carteRech = { etat: "sansgreen", q: q }; majFeuilleCarte("#carte-q"); return; }
    var pc = f.carte === "nouveau" ? creerParcoursCarte(r, nom) : parcoursDe(f.carte);
    if (!pc) { ui.carteRech = { etat: "plein", q: q }; majFeuilleCarte("#carte-q"); return; }
    /* Les greens déjà relevés sur place restent, là où la nouvelle carte n'en a pas. */
    var anc = carteDe(pc.id);
    if (anc) anc.trous.forEach(function (tr, i) { if (tr && tr.rel && !trouCarte(r.carte, i)) { while (r.carte.trous.length <= i) r.carte.trous.push(null); r.carte.trous[i] = tr; } });
    r.bilan.pars.forEach(function (par, i) { if (par >= 3 && par <= 5 && i < pc.pars.length && !pc.pars[i]) pc.pars[i] = par; });
    /* Handicap des trous : repris d'OpenStreetMap s'il y est complet et que le parcours n'en a pas. */
    var hcO = r.bilan.hcp.slice(0, pc.pars.length);
    if (!(pc.hcp && pc.hcp.some(function (v) { return v > 0; })) && hcO.length === pc.pars.length && lireHcp(hcO.join(" "), pc.pars.length)) pc.hcp = hcO;
    var ok = poserCarte(pc.id, r.carte);
    sauver();
    ui.feuille = { carte: pc.id }; ui.carteNum = null; ui.carteRech = { etat: ok ? "ok" : "place", q: q };
    rendre(); rendreFeuille(); rendrePartie();
    var b = document.getElementById("f-fermer"); if (b) b.focus({ preventScroll: true });
  }
  CHANGEMENTS["carte-fichier"] = function (el) {
    var fic = el.files && el.files[0]; if (!fic) return;
    var ko = function () { ui.carteRech = { etat: "fichier" }; majFeuilleCarte(".carte-fichier"); };
    if (fic.size > 12e6 || typeof FileReader !== "function") { ko(); return; }
    var lect = new FileReader();
    lect.onload = function () {
      var data = null; try { data = JSON.parse(String(lect.result)); } catch (e) { /* pas du JSON */ }
      if (!data || typeof data !== "object") { ko(); return; }
      installerCarte(construireCarte(data, "fichier", auj()), fic.name.replace(/\.[a-z]+$/i, "").replace(/[_-]+/g, " "));
    };
    lect.onerror = ko;
    lect.readAsText(fic);
  };
  ACTIONS["carte-num"] = function (el) {
    var i = parseInt(el.getAttribute("data-v"), 10); ui.carteNum = ui.carteNum === i ? null : i;
    majFeuilleCarte(ui.carteNum != null ? ".carte-numeros button" : null);
  };
  ACTIONS["carte-num-ok"] = function (el) {
    var f = ui.feuille, pc = f && f.carte ? parcoursDe(f.carte) : null, c = pc ? carteDe(pc.id) : null, n = parseInt(el.getAttribute("data-v"), 10);
    if (!c || ui.carteNum == null || !(n >= 1 && n <= pc.pars.length)) return;
    if (numeroterGreen(c, ui.carteNum, n)) { poserCarte(pc.id, c); message("Green du trou " + n + " numéroté."); }
    ui.carteNum = null; majFeuilleCarte("#f-fermer"); rendrePartie();
  };
  ACTIONS["carte-vide"] = function (el) {
    var pc = parcoursDe(el.getAttribute("data-id")); if (!pc || carteDe(pc.id)) return;
    ui.carteRech = { etat: "cherche" }; majFeuilleCarte();
    prendrePosition(function (ll) {
      if (!ll) { ui.carteRech = { etat: "position" }; majFeuilleCarte(); return; }
      poserCarte(pc.id, carteVide(ll[0], ll[1], auj()));
      ui.carteRech = null; majFeuilleCarte("#f-fermer"); rendrePartie();
      message("Carte créée : ouvre la carte d'un trou pour relever son green.");
    });
  };
  ACTIONS["carte-suppr"] = function (el) {
    var pc = parcoursDe(el.getAttribute("data-id")); if (!pc) return;
    ui.aSupprimer = pc.id;
    dialogue({ titre: "Supprimer cette carte ?", corps: '<p>' + t("Les greens de " + pc.nom + " seront retirés du téléphone. Tes parties et tes statistiques ne changent pas.") + '</p>',
      boutons: [{ l: "Annuler", a: "fermer-dialogue" }, { l: "Supprimer", a: "carte-ok-suppr", c: "danger" }] });
  };
  ACTIONS["carte-ok-suppr"] = function () {
    var id = ui.aSupprimer; ui.aSupprimer = null;
    retirerCarte(id); ui.dialogue = null; ui.carteRech = null; ui.carteNum = null;
    rendreDialogue(); majFeuilleCarte("#f-fermer"); rendrePartie();
  };
  /* Dans la fiche d'un parcours et sur la page Jouer. */
  function carteBlocParcours(pc) {
    var c = carteDe(pc.id);
    return '<h3 class="titre-bloc">Carte GPS</h3><p>' + t(c ? resumeCarte(c, pc).texte : "Pas encore de carte : relie ce parcours pour voir les distances au green pendant la partie.") + '</p>' +
      '<button class="btn large" type="button" data-a="carte-feuille" data-id="' + pc.id + '">' + icone("carte") + t(c ? " Voir ou mettre à jour la carte" : " Relier la carte du parcours") + '</button>';
  }
  function carteAppelHTML() {
    var n = etat.parcours.filter(function (pc) { return carteDe(pc.id); }).length;
    return '<section class="bloc" id="c-carte"><h2>Carte GPS</h2><p>' + t((n ? pluriel(n, "parcours") + " avec sa carte. " : "") + "En partie : distances à l'entrée, au milieu et au fond du green.") + '</p>' +
      (etat.parcours.length < 20 ? '<button class="btn" type="button" data-a="carte-feuille" data-id="nouveau">' + icone("carte") + ' Ajouter un golf avec sa carte</button>' : '') + '</section>';
  }
