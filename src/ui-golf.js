  /* ============================================================
     ACCUEIL EN PAYSAGE : un golf illustré où chaque lieu mène à une partie de l'appli.
     Le départ et le sac → Mon sac ; le green et son drapeau → Parcours ;
     le practice → la séance du jour ; le club-house → le bilan.
     Le paysage est un SVG (viewBox 400 × 600) ; les étiquettes et les zones sont des boutons posés dessus.
     ============================================================ */
  var GOLF_SVG = (function () {
    var arbre = function (x, y, r, cls) {
      return '<g class="' + (cls || "g-arbre-2") + '"><rect class="g-tronc" x="' + (x - 1.6) + '" y="' + (y - 2) + '" width="3.2" height="' + (r * 0.9) + '" rx="1"/>' +
        '<circle cx="' + x + '" cy="' + (y - r * 0.55) + '" r="' + r + '"/><circle cx="' + (x - r * 0.55) + '" cy="' + (y - r * 0.1) + '" r="' + (r * 0.72) + '"/>' +
        '<circle cx="' + (x + r * 0.6) + '" cy="' + (y - r * 0.15) + '" r="' + (r * 0.68) + '"/>' +
        '<circle class="g-reflet" cx="' + (x - r * 0.3) + '" cy="' + (y - r * 0.85) + '" r="' + (r * 0.38) + '"/></g>';
    };
    var touffes = function (l) {
      return '<path class="g-touffe" d="' + l.map(function (p) { var x = p[0], y = p[1]; return "M" + x + " " + y + "l-2.4-6.5M" + x + " " + y + "l.4-8M" + x + " " + y + "l2.8-6"; }).join("") + '"/>';
    };
    var etoiles = [[34, 30], [70, 62], [118, 22], [150, 74], [196, 40], [232, 18], [262, 64], [372, 30], [356, 112], [20, 112], [212, 98], [300, 132]]
      .map(function (p, i) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + (i % 3 ? 0.9 : 1.4) + '"/>'; }).join("");
    return '<svg class="golf-fond" viewBox="0 0 400 600" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">' +
      '<defs><linearGradient id="g-ciel" x1="0" y1="0" x2="0" y2="1"><stop class="g-ciel-1" offset="0"/><stop class="g-ciel-2" offset=".55"/><stop class="g-ciel-3" offset="1"/></linearGradient>' +
      '<radialGradient id="g-halo" cx=".5" cy=".5" r=".5"><stop class="g-halo-1" offset="0"/><stop class="g-halo-2" offset="1"/></radialGradient>' +
      '<clipPath id="g-fw-clip"><path d="M150 476C166 424 252 380 266 318c5-24 10-46 15-60h38c4 14 8 34 4 62-6 44-46 100-30 156Z"/></clipPath>' +
      '<clipPath id="g-range-clip"><path d="M30 300 146 292 174 404 6 414Z"/></clipPath></defs>' +
      /* ciel, étoiles, soleil ou lune, nuages */
      '<rect width="400" height="600" fill="url(#g-ciel)"/>' +
      '<g class="g-etoiles">' + etoiles + '</g>' +
      '<circle class="g-astre-halo" cx="332" cy="82" r="46" fill="url(#g-halo)"/>' +
      '<circle class="g-astre" cx="332" cy="82" r="21"/><circle class="g-croissant" cx="341" cy="76" r="18"/>' +
      '<g class="g-nuages"><g class="g-nuage n1"><ellipse cx="62" cy="128" rx="30" ry="9"/><circle cx="52" cy="122" r="11"/><circle cx="70" cy="118" r="14"/></g>' +
      '<g class="g-nuage n2"><ellipse cx="236" cy="54" rx="38" ry="10"/><circle cx="222" cy="47" r="13"/><circle cx="244" cy="42" r="17"/><circle cx="262" cy="49" r="11"/></g></g>' +
      /* collines lointaines et lisière */
      '<path class="g-colline-1" d="M0 206C54 182 118 170 186 184s128-18 214 0v80H0Z"/>' +
      '<g class="g-arbre-1">' + [[170, 188, 7], [184, 186, 9], [199, 188, 7], [214, 185, 8], [352, 180, 8], [366, 182, 10], [382, 181, 8], [396, 183, 9], [8, 200, 8], [22, 196, 7]]
        .map(function (a) { return '<circle cx="' + a[0] + '" cy="' + a[1] + '" r="' + a[2] + '"/>'; }).join("") + '</g>' +
      /* club-house */
      '<g class="g-club">' +
      '<rect class="g-mur" x="56" y="181" width="66" height="27"/><rect class="g-mur-ombre" x="56" y="181" width="66" height="4"/>' +
      '<path class="g-toit" d="M49 184 89 160l40 24Z"/><path class="g-toit-arete" d="M49 184 89 160l40 24h-6L89 164 55 184Z"/>' +
      '<rect class="g-fenetre" x="62" y="190" width="11" height="8" rx="1"/><rect class="g-fenetre" x="104" y="190" width="11" height="8" rx="1"/>' +
      '<rect class="g-porte" x="83" y="192" width="12" height="16" rx="1"/><rect class="g-fenetre" x="85" y="172" width="8" height="6" rx="1"/>' +
      '<path class="g-mat" d="M136 208V150"/><path class="g-fanion" d="M137 151h15l-4 5 4 5h-15Z"/></g>' +
      /* collines du milieu, green, bunker */
      '<path class="g-colline-2" d="M0 250c70-26 150-30 230-16s110 6 170-14v90H0Z"/>' +
      arbre(18, 252, 13) + arbre(40, 258, 10) + arbre(384, 236, 14) + arbre(362, 246, 10) +
      '<ellipse class="g-frange" cx="300" cy="252" rx="60" ry="17"/><ellipse class="g-green" cx="302" cy="251" rx="48" ry="12.5"/>' +
      '<path class="g-green-raie" d="M262 247q40-5 80 0M258 253q44 4 88 0"/>' +
      '<ellipse class="g-sable-bord" cx="246" cy="266" rx="22" ry="7"/><ellipse class="g-sable" cx="246" cy="265" rx="20" ry="5.6"/>' +
      '<ellipse class="g-trou" cx="314" cy="251" rx="3.4" ry="1.4"/>' +
      '<path class="g-mat-drapeau" d="M314 251V196"/><path class="g-drapeau" d="M315 197c8 1 16 4 25 7-9 3-17 6-25 8Z"/>' +
      /* terrain principal, étang, fairway */
      '<path class="g-colline-3" d="M0 286c90-18 200-22 300-10 40 5 70 2 100-6v330H0Z"/>' +
      '<ellipse class="g-eau-bord" cx="226" cy="336" rx="36" ry="11"/><ellipse class="g-eau" cx="226" cy="335" rx="33" ry="9"/>' +
      '<path class="g-eau-reflet" d="M206 333h16M230 337h14M214 339h8"/>' +
      '<path class="g-fairway" d="M150 476C166 424 252 380 266 318c5-24 10-46 15-60h38c4 14 8 34 4 62-6 44-46 100-30 156Z"/>' +
      '<g clip-path="url(#g-fw-clip)" class="g-fairway-raie"><path d="M120 300h220v26H120ZM120 352h220v30H120ZM120 414h220v34H120Z"/></g>' +
      /* practice : terrain, cibles, panneaux de distance, abri et tapis */
      '<path class="g-range" d="M30 300 146 292 174 404 6 414Z"/>' +
      '<g clip-path="url(#g-range-clip)" class="g-range-raie"><path d="M40 300 18 414h18L56 300ZM88 296l-2 114h18L104 296ZM132 293l18 114h18L148 293Z"/></g>' +
      '<g class="g-cible"><ellipse cx="96" cy="336" rx="17" ry="5"/><ellipse cx="96" cy="336" rx="10" ry="3"/><ellipse cx="96" cy="336" rx="3.6" ry="1.2"/></g>' +
      '<g class="g-panneau"><path d="M64 360v-13M118 318v-11M78 316v-10"/><rect x="56" y="339" width="16" height="9" rx="1.5"/><rect x="111" y="300" width="14" height="8" rx="1.5"/><rect x="71" y="300" width="14" height="7" rx="1.5"/></g>' +
      '<g class="g-panneau-txt"><text x="64" y="346">50</text><text x="118" y="306.4">100</text><text x="78" y="305.6">150</text></g>' +
      '<g class="g-balles"><circle cx="70" cy="378" r="1.3"/><circle cx="110" cy="372" r="1.3"/><circle cx="128" cy="352" r="1.1"/><circle cx="52" cy="330" r="1"/><circle cx="96" cy="356" r="1.2"/><circle cx="140" cy="388" r="1.3"/><circle cx="36" cy="396" r="1.3"/></g>' +
      '<path class="g-abri-ombre" d="M4 414 176 404v10L2 424Z"/>' +
      '<g class="g-tapis"><rect x="22" y="408" width="24" height="7" rx="1.5" transform="rotate(-3 34 411)"/><rect x="62" y="406" width="24" height="7" rx="1.5" transform="rotate(-3 74 409)"/><rect x="102" y="404" width="24" height="7" rx="1.5" transform="rotate(-3 114 407)"/><rect x="140" y="402" width="24" height="7" rx="1.5" transform="rotate(-3 152 405)"/></g>' +
      '<path class="g-abri" d="M0 396 180 384l4 8L0 406Z"/><path class="g-abri-bord" d="M0 404l184-12v3L0 408Z"/>' +
      '<path class="g-poteau" d="M6 406v18M90 400v19M176 394v18"/>' +
      /* premier plan : départ, boules de départ, balle sur son tee */
      '<path class="g-rough" d="M0 448c80-14 160-20 240-16s120 4 160-4v172H0Z"/>' +
      '<ellipse class="g-depart-ombre" cx="214" cy="508" rx="124" ry="30"/><ellipse class="g-depart" cx="214" cy="504" rx="120" ry="27"/>' +
      '<path class="g-depart-raie" d="M110 498q104-8 208 0M104 510q110 8 220 0"/>' +
      '<g class="g-boule"><circle cx="128" cy="499" r="4.4"/><circle cx="246" cy="493" r="4.4"/></g>' +
      '<path class="g-tee" d="M188 500l1.4 7h1.2l1.4-7Z"/><circle class="g-balle" cx="190" cy="497" r="3.4"/>' +
      touffes([[18, 560], [52, 584], [92, 552], [330, 566], [372, 586], [388, 546], [150, 590], [250, 588], [12, 476], [392, 470]]) +
      '</svg>';
  })();

  /* Étiquettes et zones cliquables, une par lieu ; l lieu = { cle, action, attrs, lieu, titre, meta, ico, vif } */
  function paysageHTML(lieux, titreHTML, vent) {
    var duree = vent === 3 ? 0.7 : vent === 2 ? 1.4 : vent === 1 ? 3 : 2.2, h = new Date().getHours();
    return '<div class="golf' + (h >= 17 && h < 22 ? " soir" : "") + '" role="group" aria-label="Le golf" style="--vent:' + duree + 's">' + GOLF_SVG +
      '<div class="golf-titre">' + titreHTML + '</div>' +
      '<div class="golf-sac">' + sacMiniHTML() + '</div>' +
      lieux.map(function (l) {
        return '<button class="golf-zone z-' + l.cle + '" type="button" ' + l.attrs + ' tabindex="-1" aria-hidden="true"></button>' +
          '<button class="golf-etiq e-' + l.cle + (l.vif ? ' vif' : '') + (l.cle === "sac" ? ' haut' : '') + '" type="button" ' + l.attrs + ' aria-label="' + at(l.lieu + " : " + l.titre + (l.meta ? ". " + l.meta : "")) + '">' +
          '<span class="ge-lieu">' + icone(l.ico) + t(l.lieu) + '</span><b>' + t(l.titre) + '</b>' + (l.meta ? '<small>' + t(l.meta) + '</small>' : '') + '</button>';
      }).join("") + '</div>';
  }
