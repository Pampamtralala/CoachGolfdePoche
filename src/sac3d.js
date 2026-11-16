  /* ============================================================
     SAC DE GOLF EN PERSPECTIVE (fausse 3D)
     Le même module sert à l'appli et au composant autonome : ES5, sans dépendance.
     Sac.scene(liste, options) rend le HTML d'une scène :
       - un SVG arrière (ombre au sol, moitié arrière du col, intérieur, séparateurs),
       - les clubs, chacun posé sur un pivot dans l'ouverture et incliné en éventail,
       - un SVG avant (corps du sac, panneau, poche, sangle, moitié avant du col) qui cache le bas des tiges.
     Club : { id, nom, court, type: "bois"|"hybride"|"fer"|"wedge"|"putter", n, distance, alerte, vide, titre, attrs }
     Options : { pre: préfixe des identifiants SVG, sel: club sorti du sac, mini: vignette sans bouton, fond: attributs du fond de scène }
     ============================================================ */
  var Sac3D = (function () {
    /* Repère : viewBox de 400 × 500 unités. L'ouverture du sac est une ellipse ; le haut de la scène
       laisse la place à la bulle du club sorti. */
    var OUV = { cx: 200, y: 322 };
    /* Profondeur des pivots dans l'ouverture : bois au fond, fers sur deux rangs en quinconce, wedges devant. */
    var PROF = [307, 317, 326, 336], ECH = [0.9, 0.95, 0.97, 1];
    /* Groupes : écart entre deux têtes, largeur maximale, inclinaison maximale de l'éventail. */
    var GROUPES = { bois: { pas: 66, max: 210, angle: 16 }, fers: { pas: 46, max: 250, angle: 16 }, avant: { pas: 66, max: 236, angle: 15 } };
    /* Demi-largeur utile de l'ouverture à chaque profondeur : les pivots y restent. */
    var OUVERT = [62, 74, 76, 54];
    /* Taille des têtes (unités) et position du col sur la largeur de la tête (0 talon, 1 pointe). */
    var TETES = {
      bois: { w: 64, h: 77, hx: 0.5 }, hybride: { w: 58, h: 70, hx: 0.5 },
      fer: { w: 60, h: 65, hx: 0.19 }, wedge: { w: 60, h: 68, hx: 0.19 }, putter: { w: 72, h: 54, hx: 0.5 }
    };

    function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
    function num(v) { return Math.round(v * 10) / 10; }

    /* Hauteur du sommet de la tête : le driver dépasse le plus, le putter le moins. */
    function sommet(c, i) {
      var n = c.n || 0;
      if (c.type === "bois") return 86 + Math.max(0, n - 1) * 6;
      if (c.type === "hybride") return 126 + Math.max(0, n - 3) * 6;
      if (c.type === "fer") return 140 + Math.max(0, (n || 7) - 3) * 6;
      if (c.type === "wedge") return 224 + i * 4;
      return 262;
    }

    /* Trois groupes, de gauche à droite du plus long au plus court. Les hybrides rejoignent les fers si le fond est plein. */
    function repartir(liste) {
      var de = function (t) { return liste.filter(function (c) { return c.type === t; }); };
      var bois = de("bois"), hyb = de("hybride");
      var fond = bois.length + hyb.length <= 4 ? bois.concat(hyb) : bois;
      return { bois: fond, fers: (fond.length === bois.length ? hyb : []).concat(de("fer")), avant: de("wedge"), putter: de("putter") };
    }

    /* ---------- Têtes, en vue de trois quarts ---------- */
    function teteSVG(c, pre) {
      var u = function (id) { return "url(#" + pre + "-" + id + ")"; };
      var lib = esc(c.court);
      if (c.type === "bois" || c.type === "hybride") {
        var h = c.type === "hybride";
        return '<svg viewBox="0 0 50 60" aria-hidden="true" focusable="false">' +
          '<path fill="' + u(h ? "couvre-h" : "couvre") + '" d="M25 2C39 2 47 11 47 23c0 9-5 15-12 18l-2 17q-8 3-16 0l-2-17C8 38 3 32 3 23 3 11 11 2 25 2Z"/>' +
          '<path fill="none" stroke="#fff" stroke-opacity=".08" stroke-width="2" d="M14 9c-3 9-3 21 1 30M25 4v37M36 9c3 9 3 21-1 30"/>' +
          '<path fill="#DDE4F0" d="M15.6 44q9.4 3 18.8 0l-.3 5q-9.1 3-18.2 0Z"/>' +
          '<ellipse cx="25" cy="22" rx="10" ry="9.5" fill="#E9EDF5"/>' +
          '<text x="25" y="' + (h ? 25.2 : 26) + '" text-anchor="middle" font-size="' + (h ? 8.5 : 11.5) + '" font-weight="700" fill="#24345A" font-family="Barlow Condensed, Arial Narrow, sans-serif">' + lib + '</text>' +
          '<path fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="2.5" stroke-linecap="round" d="M11 12c4-5 9-7 14-7"/></svg>';
      }
      if (c.type === "putter") {
        return '<svg viewBox="0 0 56 42" aria-hidden="true" focusable="false">' +
          '<path fill="' + u("arete") + '" d="M24.5 42h7l1-9h-9Z"/>' +
          '<path fill="' + u("mail") + '" d="M6 19C6 9 15 3 28 3s22 6 22 16c0 7-5 11-12 12l-3 6H21l-3-6C11 30 6 26 6 19Z"/>' +
          '<path fill="#24345A" d="M9 21q19 6 38 0l-.6 3.6q-18.4 5.6-36.8 0Z"/>' +
          '<path fill="none" stroke="#fff" stroke-opacity=".9" stroke-width="2.4" stroke-linecap="round" d="M13 10c4-3 9-4.4 15-4.4"/></svg>';
      }
      if (c.type === "wedge") {
        return '<svg viewBox="0 0 44 50" aria-hidden="true" focusable="false">' +
          '<path fill="' + u("arete") + '" d="M5.8 50h5.4l.9-16-6.1-.6Z"/>' +
          '<path fill="' + u("metal") + '" d="M8.6 22 35 3.4c4.4-2.4 8 .8 7 6l-3 16.8c-.6 3.4-2.8 5-6 5.4L12.6 35c-3.2.4-5-1.8-4.5-4.8Z"/>' +
          '<path fill="' + u("arete") + '" opacity=".7" d="M8.6 22 35 3.4c4.4-2.4 8 .8 7 6l-.5 2.6c.3-3.8-2.4-5.6-5.6-3.8L9.6 25Z"/>' +
          '<path fill="none" stroke="#7D8794" stroke-width=".9" stroke-linecap="round" d="M14 31.2l18.6-2.8M13.4 27.6l20.4-3.2M14.2 24l20.8-3.6M17.2 20.6l18.6-4M21.6 17.4l15-3.6"/>' +
          '<text x="36.6" y="30" text-anchor="middle" font-size="7" font-weight="700" fill="#4E5765" font-family="Barlow Condensed, Arial Narrow, sans-serif">' + lib + '</text></svg>';
      }
      return '<svg viewBox="0 0 44 48" aria-hidden="true" focusable="false">' +
        '<path fill="' + u("arete") + '" d="M5.8 48h5.4l.9-17.5-6.1-.6Z"/>' +
        '<path fill="' + u("metal") + '" d="M8.6 23.5 36 5.2c4.2-2.4 7.6.6 6.6 5.6l-3 14.4c-.6 3-2.6 4.6-5.6 5L12.4 33.6c-3 .4-4.8-1.8-4.3-4.6Z"/>' +
        '<path fill="' + u("arete") + '" opacity=".7" d="M8.6 23.5 36 5.2c4.2-2.4 7.6.6 6.6 5.6l-.5 2.4c.4-3.6-2.2-5.4-5.4-3.6L9.6 26.4Z"/>' +
        '<path fill="none" stroke="#7D8794" stroke-width=".9" stroke-linecap="round" d="M13.6 29.6l17.6-2.6M13.2 26l19.4-3M15 22.4l19-3.4M19.4 19l16.2-3.6"/>' +
        '<text x="36.4" y="29.6" text-anchor="middle" font-size="8.5" font-weight="700" fill="#4E5765" font-family="Barlow Condensed, Arial Narrow, sans-serif">' + lib + '</text></svg>';
    }

    /* ---------- Le sac ---------- */
    function defs(pre) {
      var g = function (id, x2, y2, stops) {
        return '<linearGradient id="' + pre + '-' + id + '" x1="0" y1="0" x2="' + x2 + '" y2="' + y2 + '">' + stops.map(function (s) { return '<stop offset="' + s[0] + '" stop-color="' + s[1] + '"/>'; }).join("") + '</linearGradient>';
      };
      var r = function (id, stops) {
        return '<radialGradient id="' + pre + '-' + id + '" cx=".36" cy=".3" r=".75">' + stops.map(function (s) { return '<stop offset="' + s[0] + '" stop-color="' + s[1] + '"/>'; }).join("") + '</radialGradient>';
      };
      return '<defs>' +
        g("corps", 1, 0, [[0, "#0F1729"], [0.16, "#24365E"], [0.36, "#3B548C"], [0.56, "#24365E"], [0.84, "#16223F"], [1, "#0C1323"]]) +
        g("panneau", 1, 0, [[0, "#C3CCD9"], [0.35, "#F6F8FB"], [1, "#D5DCE6"]]) +
        g("poche", 0, 1, [[0, "#30467A"], [1, "#1A2849"]]) +
        g("col-ar", 0, 1, [[0, "#33477A"], [1, "#141E36"]]) +
        g("col-av", 0, 1, [[0, "#22325A"], [0.6, "#121B32"], [1, "#0B1222"]]) +
        g("fond", 0, 1, [[0, "#2A3B63"], [0.42, "#0D1426"], [1, "#03060C"]]) +
        g("metal", 1, 1, [[0, "#F4F6F9"], [0.45, "#C6CDD6"], [0.72, "#9BA5B2"], [1, "#DCE1E7"]]) +
        g("arete", 1, 1, [[0, "#8B95A2"], [1, "#5A6371"]]) +
        r("couvre", [[0, "#40598F"], [0.6, "#24365E"], [1, "#152038"]]) +
        r("couvre-h", [[0, "#6680B8"], [0.6, "#3D558B"], [1, "#24365E"]]) +
        r("mail", [[0, "#FFFFFF"], [0.7, "#E4E9F0"], [1, "#BCC5D1"]]) +
        '<radialGradient id="' + pre + '-sol" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#000" stop-opacity=".28"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>' +
        '</defs>';
    }
    function arriereSVG(pre) {
      var u = function (id) { return "url(#" + pre + "-" + id + ")"; };
      return '<svg class="s3d-arriere" viewBox="0 0 400 500" aria-hidden="true" focusable="false">' + defs(pre) +
        '<ellipse cx="200" cy="484" rx="118" ry="13" fill="' + u("sol") + '"/>' +
        /* moitié arrière du col */
        '<path fill="' + u("col-ar") + '" d="M108 322A92 26 0 0 1 292 322H282A82 20 0 0 0 118 322Z"/>' +
        /* intérieur : la paroi du fond est éclairée, l'avant plonge dans l'ombre */
        '<ellipse cx="200" cy="322" rx="82" ry="20" fill="' + u("fond") + '"/>' +
        /* séparateurs du sac */
        '<path fill="#2B3C63" d="M129 311h142l-.5 2.6H129.5ZM126.8 330h146.4l-.5 2.6H127.3Z"/>' +
        '<path stroke="#4A5F92" stroke-opacity=".7" stroke-width="1" d="M129.5 311.1h141M127.3 330.1h145.4"/></svg>';
    }
    function avantSVG(pre) {
      var u = function (id) { return "url(#" + pre + "-" + id + ")"; };
      return '<svg class="s3d-avant" viewBox="0 0 400 500" aria-hidden="true" focusable="false">' +
        /* corps cylindrique : le bord haut suit la moitié avant de l'ouverture */
        '<path fill="' + u("corps") + '" d="M109 322A91 25 0 0 0 291 322L280 472A80 15 0 0 1 120 472Z"/>' +
        /* panneau clair et inscription */
        '<path fill="' + u("panneau") + '" d="M138 341q19 5 38 6l2 139q-17-1-34-3.5Z"/>' +
        '<text x="0" y="0" transform="translate(154 362) rotate(90)" font-size="10" font-weight="700" textLength="104" lengthAdjust="spacingAndGlyphs" fill="#24345A" font-family="Barlow Condensed, Arial Narrow, sans-serif">COACH DE POCHE</text>' +
        /* poche avant */
        '<path fill="#0B1222" opacity=".35" d="M229 361q22 3 44-3l-4 96q-19 5-38 2Z"/>' +
        '<path fill="' + u("poche") + '" d="M226 356q22 3 44-3l-4 96q-19 5-38 2Z"/>' +
        '<path fill="none" stroke="#C9D2E0" stroke-opacity=".7" stroke-width="1.5" stroke-dasharray="3 3" d="M231 366q18 2.4 35-2"/>' +
        '<rect x="260" y="360" width="3.6" height="9" rx="1.8" fill="#C9D2E0" transform="rotate(-6 262 364)"/>' +
        /* sangle sur le flanc droit */
        '<path fill="none" stroke="#0B1222" stroke-opacity=".45" stroke-width="11" stroke-linecap="round" d="M283 340c16 34 20 82 6 124"/>' +
        '<path fill="none" stroke="#E4E9F1" stroke-width="8" stroke-linecap="round" d="M281 338c16 34 20 82 6 124"/>' +
        /* pied du sac */
        '<path fill="#0A101E" d="M119.5 456A80 14 0 0 0 280.5 456L280 472A80 15 0 0 1 120 472Z"/>' +
        /* moitié avant du col, avec un reflet sur l'arête */
        '<path fill="' + u("col-av") + '" d="M108 322A92 26 0 0 0 292 322H282A82 20 0 0 1 118 322Z"/>' +
        '<path fill="none" stroke="#5A70A6" stroke-opacity=".75" stroke-width="1.3" d="M118 323A82 20 0 0 0 282 323"/></svg>';
    }

    /* ---------- La scène ---------- */
    function scene(liste, o) {
      o = o || {};
      var pre = o.pre || "s3", g = repartir(liste), h = "", iw = 0;
      /* Le putter, le plus court, sort au centre, sous les têtes des wedges pour ne pas les cacher. */
      ["bois", "fers", "avant", "putter"].forEach(function (nom) {
        var l = g[nom], G = GROUPES[nom] || { pas: 0, max: 0, angle: 0 }, n = l.length, pas = n > 1 ? Math.min(G.pas, G.max / (n - 1)) : 0;
        l.forEach(function (c, i) {
          /* Rang de profondeur : les fers alternent entre deux rangs pour ne pas s'aligner. */
          var ri = nom === "bois" ? 0 : nom === "avant" || nom === "putter" ? 3 : 1 + (i % 2);
          var T = TETES[c.type] || TETES.fer, w = T.w * ECH[ri], hh = T.h * ECH[ri];
          var pos = (i - (n - 1) / 2) * pas, bord = (n - 1) / 2 * pas;
          /* Le pivot reste dans l'ouverture ; c'est l'inclinaison qui écarte les têtes. */
          var pivot = OUV.cx + pos * (bord ? Math.min(0.85, OUVERT[ri] / bord) : 0) - (0.5 - T.hx) * w * 0.6;
          /* Devant, quand les wedges sont nombreux, une tête sur deux monte un peu pour rester visible. */
          var haut = sommet(c, c.type === "wedge" ? iw++ : 0) - (nom === "avant" && n > 4 && i % 2 ? 18 : 0), L = PROF[ri] - haut;
          /* Sorti du sac, le club monte un peu, sans venir couvrir la rangée de derrière. */
          var monte = ri === 0 ? 0.12 * L : Math.min(24, 0.22 * L);
          var rot = pos / 115 * G.angle;
          if (nom === "putter") { pivot = OUV.cx; rot = 0; }
          var st = "--x:" + num(pivot - T.hx * w) + ";--y:" + num(haut) + ";--w:" + num(w) + ";--h:" + num(L) + ";--hh:" + num(hh) + ";--hx:" + T.hx + ";--r:" + num(rot) + "deg;--z:" + (nom === "putter" ? ri * 10 : ri * 10 + i + 1) + ";--monte:" + num(-monte / L * 100) + "%";
          var cls = "c3d t-" + c.type + (c.vide ? " vide" : "") + (c.alerte ? " alerte" : "") + (o.sel === c.id ? " sel" : "");
          var corps = teteSVG(c, pre) + '<span class="c3d-pastille" aria-hidden="true">!</span>';
          h += '<div class="' + cls + '" style="' + st + '"><span class="c3d-tige" aria-hidden="true"></span>' +
            (o.mini ? '<span class="c3d-tete">' + corps + '</span>'
              : '<button type="button" class="c3d-tete" ' + (c.attrs || "") + ' aria-pressed="' + (o.sel === c.id) + '" aria-label="' + esc(c.titre || c.nom) + '">' + corps + '</button>' +
                '<span class="c3d-bulle' + (c.plage ? ' plage' : '') + '" aria-hidden="true"><b>' + esc(c.nom) + '</b><span>' + (c.plage ? c.plage + '<small>m</small>' : c.distance != null ? c.distance + '<small>m</small>' : c.type === "putter" ? "—" : "?") + '</span></span>') +
            '</div>';
        });
      });
      return '<div class="s3d' + (o.mini ? " s3d-mini" : "") + (o.sel ? " choix" : "") + '"' + (o.mini ? ' aria-hidden="true"' : '') + '>' +
        arriereSVG(pre) + '<div class="s3d-clubs"' + (o.fond ? " " + o.fond : "") + '>' + h + '</div>' + avantSVG(pre) + '</div>';
    }

    /* Sort un club du sac sans tout redessiner : la transition joue. */
    function choisir(racine, id) {
      var s = racine.querySelector(".s3d"); if (!s) return;
      s.classList.toggle("choix", !!id);
      Array.prototype.forEach.call(s.querySelectorAll(".c3d"), function (el) {
        var b = el.querySelector(".c3d-tete"), oui = !!id && b && b.getAttribute("data-id") === id;
        el.classList.toggle("sel", oui);
        if (b && b.tagName === "BUTTON") b.setAttribute("aria-pressed", String(oui));
      });
    }

    return { scene: scene, choisir: choisir, repartir: repartir };
  })();
