  /* ============================================================
     SCHÉMAS ANIMÉS des éducatifs : dispositif, passage du club, roule de la balle.
     Dessinés pour un droitier, la cible en haut ; retournés pour un gaucher.
     Sans animation si le joueur a demandé moins de mouvement à l'écran.
     ============================================================ */
  var REDUIT = false;
  try { REDUIT = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches); } catch (e) { REDUIT = false; }
  function sv(n) { return Math.round(n * 1000) / 1000; }

  /* Déplacement le long d'un tracé entre deux instants du cycle (de 0 à 1) ; immobile avant et après.
     frein : départ vif puis ralentissement (une balle) ; sinon accélération puis ralentissement (un club). */
  function mvt(d, dur, t0, t1, frein, auto) {
    if (REDUIT) return "";
    return '<animateMotion path="' + d + '" dur="' + dur + 's" repeatCount="indefinite" calcMode="spline" keyTimes="0;' + sv(t0) + ';' + sv(t1) + ';1" keyPoints="0;0;1;1" ' +
      'keySplines="0 0 1 1;' + (frein ? "0.1 0.6 0.3 1" : "0.45 0 0.6 1") + ';0 0 1 1"' + (auto ? ' rotate="auto"' : '') + '/>';
  }
  /* Opacité par étapes : liste de [instant, valeur]. */
  function fondu(dur, pts) {
    if (REDUIT) return "";
    return '<animate attributeName="opacity" dur="' + dur + 's" repeatCount="indefinite" keyTimes="' + pts.map(function (p) { return sv(p[0]); }).join(";") +
      '" values="' + pts.map(function (p) { return p[1]; }).join(";") + '"/>';
  }
  function sBalle(x, y, dedans) { return '<circle class="s-balle" cx="' + x + '" cy="' + y + '" r="5.5">' + (dedans || "") + '</circle>'; }
  function sTee(x, y, dedans) { return '<circle class="s-tee" cx="' + x + '" cy="' + y + '" r="3.2">' + (dedans || "") + '</circle>'; }
  function sTrou(x, y, r) { return '<circle class="s-trou" cx="' + x + '" cy="' + y + '" r="' + (r || 9) + '"/>'; }
  /* Ligne de jeu verticale, la cible en haut. */
  function sLigneJeu(x, y1, y2) {
    return '<line class="s-jeu" x1="' + x + '" y1="' + y1 + '" x2="' + x + '" y2="' + y2 + '"/>' +
      '<path class="s-fleche" d="M' + (x - 5) + ' ' + (y2 + 9) + 'L' + x + ' ' + y2 + 'L' + (x + 5) + ' ' + (y2 + 9) + '"/>';
  }
  /* Pieds d'un droitier tourné vers la droite de l'image : pied avant en haut, côté cible. */
  function sPieds(yAvant, yArriere) {
    return '<rect class="s-pied" x="78" y="' + ((yAvant || 99) - 7) + '" width="34" height="14" rx="7"/>' +
      '<rect class="s-pied" x="78" y="' + ((yArriere || 157) - 7) + '" width="34" height="14" rx="7"/>';
  }
  /* Tête de club vue de dessus, en travers de la ligne de jeu, qui remonte tout droit. */
  function sTeteDroite(x, y, dy, dur, t0, t1) {
    return '<rect class="s-tete" x="' + (x - 13) + '" y="' + (y - 4) + '" width="26" height="8" rx="2.5">' + mvt("M0 0L0 " + dy, dur, t0, t1) + '</rect>';
  }
  /* Tête de club qui suit un chemin courbe. Sans animation, elle reste au départ du chemin. */
  function sTeteChemin(d, x0, y0, angle, dur, t0, t1) {
    return '<g' + (REDUIT ? ' transform="translate(' + x0 + ' ' + y0 + ') rotate(' + angle + ')"' : '') + '><rect class="s-tete" x="-4" y="-13" width="8" height="26" rx="2.5"/>' + mvt(d, dur, t0, t1, false, true) + '</g>';
  }
  /* Balle frappée : elle part vite, puis disparaît jusqu'au cycle suivant. */
  function sBalleFrappee(x, y, dx, dy, dur, t0, t1) {
    return sBalle(x, y, mvt("M0 0L" + dx + " " + dy, dur, t0, t1, true) + fondu(dur, [[0, 1], [t1 - 0.05, 1], [t1 + 0.01, 0], [1, 0]]));
  }

  var SCHEMAS = {};
  var BON_CHEMIN = "M150 204C164 176 176 150 180 128S190 80 200 46";

  SCHEMAS.dr_porte = function () {
    var D = 3.8;
    return { vue: "dessus", alt: "Vue de dessus. Un couvre-club est posé à l'extérieur de la balle, un peu en arrière. Le club arrive de l'intérieur, passe à côté de l'obstacle et envoie la balle légèrement à {df} de la cible.",
      geo: sLigneJeu(180, 202, 14) + sPieds() +
        '<path class="s-evite" d="M214 204C204 176 190 150 180 128S166 80 158 46"/>' +
        '<rect class="s-obst" x="195" y="129" width="18" height="34" rx="5"/>' +
        '<path class="s-chemin" d="' + BON_CHEMIN + '"/>' +
        sBalleFrappee(180, 128, 16, -112, D, 0.31, 0.52) + sTeteChemin(BON_CHEMIN, 150, 204, -62, D, 0.12, 0.5),
      txt: [[190, 24, "cible", "start"], [220, 150, "couvre-club", "start"], [224, 200, "à éviter", "start"], [140, 200, "ton chemin", "end"]] };
  };

  SCHEMAS.fe_porte_int = function () {
    var D = 3.8, bon = "M172 204C176 178 179 152 180 128S181 80 178 46";
    return { vue: "dessus", alt: "Vue de dessus. Un couvre-club est posé entre la balle et toi, un peu en arrière. Le club arrive davantage de face, sans le toucher, et la balle part droit.",
      geo: sLigneJeu(180, 202, 14) + sPieds() +
        '<path class="s-evite" d="M128 204C148 184 166 156 180 128S200 80 212 50"/>' +
        '<rect class="s-obst" x="147" y="129" width="18" height="34" rx="5"/>' +
        '<path class="s-chemin" d="' + bon + '"/>' +
        sBalleFrappee(180, 128, -3, -112, D, 0.31, 0.52) + sTeteChemin(bon, 172, 204, -82, D, 0.12, 0.5),
      txt: [[190, 24, "cible", "start"], [142, 124, "couvre-club", "end"], [120, 200, "à éviter", "end"], [192, 200, "ton chemin", "start"]] };
  };

  SCHEMAS.fe_barriere = function () {
    var D = 4;
    var tete = REDUIT ? "" : '<animateMotion path="M0 0L0 40L0 -64" dur="' + D + 's" repeatCount="indefinite" calcMode="spline" keyTimes="0;0.1;0.32;0.56;1" keyPoints="0;0;0.278;1;1" keySplines="0 0 1 1;0.4 0 0.6 1;0.45 0 0.6 1;0 0 1 1"/>';
    return { vue: "dessus", alt: "Vue de dessus. Un couvre-club est posé le long de la ligne de jeu, juste à l'extérieur de la pointe du club. Le club recule puis traverse la balle sans toucher l'obstacle.",
      geo: sLigneJeu(180, 202, 14) + sPieds() +
        '<rect class="s-obst" x="198" y="92" width="14" height="74" rx="5"/>' +
        sBalleFrappee(180, 128, 0, -112, D, 0.42, 0.62) +
        '<rect class="s-tete" x="167" y="135" width="26" height="8" rx="2.5">' + tete + '</rect>',
      txt: [[190, 24, "cible", "start"], [220, 132, "couvre-club", "start"], [176, 186, "pointe du club", "middle"]] };
  };

  SCHEMAS.fe_alignement = function () {
    var D = 5.4;
    function eclat(t0, t1) { return fondu(D, [[0, 0.3], [t0, 0.3], [t0 + 0.03, 1], [t1, 1], [t1 + 0.03, 0.3], [1, 0.3]]); }
    return { vue: "dessus", alt: "Vue de dessus. Une baguette pointe vers la cible, juste à l'extérieur de la balle. Une seconde, parallèle, longe les pointes de pieds. On aligne la face du club, puis les pieds, puis les épaules.",
      geo: '<line class="s-bag" x1="198" y1="192" x2="198" y2="40"/><path class="s-fleche" d="M193 44L198 30L203 44"/>' +
        '<line class="s-bag" x1="118" y1="192" x2="118" y2="40"/>' +
        '<g>' + sPieds() + eclat(0.34, 0.6) + '</g>' +
        '<line class="s-epaule" x1="98" y1="82" x2="98" y2="174">' + eclat(0.66, 0.92) + '</line>' +
        sBalle(180, 128) +
        '<rect class="s-tete" x="167" y="135" width="26" height="8" rx="2.5">' + eclat(0.02, 0.28) + '</rect>',
      txt: [[208, 36, "cible", "start"], [208, 144, "1 · face", "start"], [70, 132, "2 · pieds", "end"], [110, 72, "3 · épaules", "end"]] };
  };

  SCHEMAS.dr_pied_recule = function () {
    var D = 4.4;
    var glisse = REDUIT ? "" : '<animateTransform attributeName="transform" type="translate" dur="' + D + 's" repeatCount="indefinite" keyTimes="0;0.06;0.2;1" values="0 0;0 0;-22 0;-22 0"/>';
    return { vue: "dessus", alt: "Vue de dessus. Le pied arrière recule d'une vingtaine de centimètres, les épaules restent parallèles à la ligne de jeu. Le club a la place d'arriver de l'intérieur.",
      geo: sLigneJeu(180, 202, 14) +
        '<rect class="s-pied" x="78" y="92" width="34" height="14" rx="7"/>' +
        '<rect class="s-fantome" x="78" y="150" width="34" height="14" rx="7"/>' +
        '<rect class="s-pied" x="78" y="150" width="34" height="14" rx="7"' + (REDUIT ? ' transform="translate(-22 0)"' : '') + '>' + glisse + '</rect>' +
        '<line class="s-epaule" x1="124" y1="84" x2="124" y2="172"/>' +
        '<path class="s-chemin" d="' + BON_CHEMIN + '"/>' +
        sBalleFrappee(180, 128, 6, -112, D, 0.5, 0.7) + sTeteChemin(BON_CHEMIN, 150, 204, -62, D, 0.3, 0.7),
      txt: [[190, 24, "cible", "start"], [18, 186, "pied arrière reculé", "start"], [124, 74, "épaules parallèles", "middle"]] };
  };

  SCHEMAS.fe_ligne = function () {
    var D = 3.8;
    return { vue: "dessus", alt: "Vue de dessus. Une ligne est tracée en travers de la ligne de jeu, la balle posée dessus. Le club frappe la balle, puis le divot commence sur la ligne, côté cible.",
      geo: sLigneJeu(180, 202, 14) + sPieds() +
        '<line class="s-ligne" x1="126" y1="128" x2="234" y2="128"/>' +
        '<rect class="s-divot" x="172" y="94" width="16" height="31" rx="3">' + fondu(D, [[0, 0], [0.31, 0], [0.37, 1], [0.94, 1], [1, 0]]) + '</rect>' +
        sBalleFrappee(180, 128, 0, -112, D, 0.31, 0.52) + sTeteDroite(180, 196, -136, D, 0.12, 0.5),
      txt: [[190, 24, "cible", "start"], [242, 132, "ligne", "start"], [196, 104, "divot", "start"], [196, 116, "après la ligne", "start"]] };
  };

  SCHEMAS.fe_tee_devant = function () {
    var D = 3.8;
    return { vue: "dessus", alt: "Vue de dessus. Un tee est planté cinq centimètres devant la balle, côté cible. Le club frappe la balle, puis arrache le tee.",
      geo: sLigneJeu(180, 202, 14) + sPieds() +
        sTee(180, 110, mvt("M0 0L4 -44", D, 0.36, 0.54, true) + fondu(D, [[0, 1], [0.5, 1], [0.56, 0], [1, 0]])) +
        sBalleFrappee(180, 128, 0, -112, D, 0.31, 0.52) + sTeteDroite(180, 196, -136, D, 0.12, 0.5),
      txt: [[190, 24, "cible", "start"], [194, 132, "1 · la balle", "start"], [194, 114, "2 · le tee", "start"]] };
  };

  SCHEMAS.bu_ligne = function () {
    var D = 4;
    var grains = '<g class="s-grain"><circle cx="174" cy="100" r="2.5"/><circle cx="181" cy="97" r="3"/><circle cx="187" cy="101" r="2.5"/><circle cx="178" cy="93" r="2"/>' +
      mvt("M0 0L0 -40", D, 0.31, 0.56, true) + fondu(D, [[0, 0], [0.3, 0], [0.33, 1], [0.5, 1], [0.58, 0], [1, 0]]) + '</g>';
    return { vue: "dessus", alt: "Vue de dessus, dans le bunker. Une ligne est tracée dans le sable, en face du talon avant. La balle est posée cinq centimètres devant. Le club entre dans le sable sur la ligne et le sable emporte la balle.",
      geo: '<ellipse class="s-sable" cx="174" cy="110" rx="132" ry="92"/>' + sLigneJeu(180, 196, 14) + sPieds(104, 160) +
        '<line class="s-ligne" x1="126" y1="104" x2="234" y2="104"/>' + (REDUIT ? "" : grains) +
        sBalleFrappee(180, 90, 2, -70, D, 0.33, 0.58) + sTeteDroite(180, 172, -136, D, 0.12, 0.5),
      txt: [[190, 24, "cible", "start"], [242, 100, "le club entre", "start"], [242, 112, "sur la ligne", "start"], [194, 86, "balle", "start"]] };
  };

  SCHEMAS.pc_porte = function () {
    var D = 4.2;
    return { vue: "dessus", miroir: false, alt: "Vue de dessus. Deux tees forment une porte à trente centimètres devant la balle, sur un putt droit d'un mètre cinquante. La balle passe entre les tees sans les toucher et tombe dans le trou.",
      geo: sTrou(160, 34, 10) + '<line class="s-jeu" x1="160" y1="180" x2="160" y2="46"/>' +
        '<path class="s-cote" d="M124 186V152M119 186H129M119 152H129"/><path class="s-cote" d="M98 186V34M93 186H103M93 34H103"/>' +
        sTee(148.5, 152) + sTee(171.5, 152) +
        '<rect class="s-tete" x="145" y="194" width="30" height="7" rx="2.5"/>' +
        sBalle(160, 186, mvt("M0 0L0 -152", D, 0.1, 0.7, true) + fondu(D, [[0, 1], [0.69, 1], [0.74, 0], [1, 0]])),
      txt: [[118, 173, "30 cm", "end"], [92, 114, "1,5 m", "end"], [182, 156, "porte", "start"]] };
  };

  SCHEMAS.pc_cadran = function () {
    var D = 9.6, N = 8, R = 70, cx = 160, cy = 100, g = '<circle class="s-guide" cx="' + cx + '" cy="' + cy + '" r="' + R + '"/>' + sTrou(cx, cy, 9);
    for (var k = 0; k < N; k++) {
      var an = (-90 + k * 45) * Math.PI / 180, x = sv(cx + R * Math.cos(an)), y = sv(cy + R * Math.sin(an));
      var t0 = (k + 0.25) / N, t1 = (k + 0.85) / N;
      g += sBalle(x, y, mvt("M0 0L" + sv(cx - x) + " " + sv(cy - y), D, t0, t1, true) + fondu(D, [[0, 1], [t1 - 0.012, 1], [t1 + 0.012, 0], [1, 0]]));
    }
    return { vue: "dessus", miroir: false, h: 200, alt: "Vue de dessus. Huit balles sont posées en cercle autour du trou. Elles sont rentrées l'une après l'autre, dans l'ordre du cadran.",
      geo: g, txt: [[160, 192, "un raté : on repart de zéro", "middle"]] };
  };

  SCHEMAS.pl_echelle = function () {
    var D = 9;
    function b(y, dx, dy, t0, t1) { return sTee(160, y + 9) + sBalle(160, y, mvt("M0 0L" + dx + " " + dy, D, t0, t1, true)); }
    return { vue: "dessus", miroir: false, alt: "Vue de dessus. Trois tees sont plantés à trois distances du même trou. Depuis chacun, la balle roule et s'arrête dans la zone autour du trou.",
      geo: '<circle class="s-zone" cx="160" cy="36" r="25"/>' + sTrou(160, 36, 8) +
        b(92, -11, -42, 0.04, 0.26) + b(140, 12, -110, 0.36, 0.6) + b(188, 3, -136, 0.68, 0.95),
      txt: [[194, 32, "zone : une longueur", "start"], [194, 44, "de putter", "start"], [176, 96, "court", "start"], [176, 144, "moyen", "start"], [176, 192, "long", "start"]] };
  };

  SCHEMAS.pl_point_haut = function () {
    var D = 4.6;
    return { vue: "dessus", miroir: false, alt: "Vue de dessus. Sur un putt en pente, deux tees forment une porte au point le plus haut de la courbe. La balle passe la porte, puis tourne vers le trou.",
      geo: sTrou(90, 40, 9) + '<line class="s-jeu" x1="240" y1="185" x2="98" y2="48"/>' +
        '<path class="s-chemin" d="M240 185Q228 62 90 40"/>' + sTee(205.5, 78) + sTee(187.5, 96.5) +
        '<path class="s-pente" d="M300 122L274 156M274 156L276 144M274 156L285 153"/>' +
        sBalle(240, 185, mvt("M0 0Q-12 -123 -150 -145", D, 0.1, 0.72, true) + fondu(D, [[0, 1], [0.71, 1], [0.76, 0], [1, 0]])),
      txt: [[214, 70, "point haut", "start"], [304, 114, "pente", "end"], [150, 150, "ligne directe", "end"]] };
  };

  SCHEMAS.we_horloge = function () {
    var D = 10, c = "160 100";
    var tourne = REDUIT ? "" : '<animateTransform attributeName="transform" type="rotate" dur="' + D + 's" repeatCount="indefinite" calcMode="spline" ' +
      'keyTimes="0;0.07;0.24;0.31;0.4;0.57;0.64;0.75;0.92;1" keySplines="0.4 0 0.6 1;0 0 1 1;0.4 0 0.6 1;0.4 0 0.6 1;0 0 1 1;0.4 0 0.6 1;0.4 0 0.6 1;0 0 1 1;0.4 0 0.6 1" ' +
      'values="0 ' + c + ';45 ' + c + ';45 ' + c + ';0 ' + c + ';90 ' + c + ';90 ' + c + ';0 ' + c + ';135 ' + c + ';135 ' + c + ';0 ' + c + '"/>';
    function repere(a) { return '<line class="s-fantome-trait" x1="160" y1="100" x2="160" y2="178" transform="rotate(' + a + ' ' + c + ')"/>'; }
    return { vue: "face", h: 200, alt: "Vue de face. Le bras avant et le club montent comme l'aiguille d'une horloge : jusqu'à 7 h 30, puis 9 h, puis 10 h 30. La tête est à midi, la balle à 6 h.",
      geo: '<circle class="s-guide" cx="160" cy="100" r="78"/>' + repere(45) + repere(90) + repere(135) +
        '<circle class="s-tetejoueur" cx="160" cy="30" r="9"/><path class="s-corps" d="M160 39V126M160 126L147 174M160 126L173 174"/>' +
        sBalle(160, 180) +
        '<g><line class="s-bras" x1="160" y1="100" x2="160" y2="174"/><circle class="s-mainjoueur" cx="160" cy="140" r="4.5"/>' + tourne + '</g>',
      txt: [[96, 168, "7 h 30", "end"], [74, 104, "9 h", "end"], [98, 40, "10 h 30", "end"], [176, 34, "midi", "start"], [176, 186, "6 h", "start"]] };
  };

  SCHEMAS.ap_serviette = function () {
    var D = 4.6;
    var vol = REDUIT ? "" : '<animateMotion path="M0 0Q52 -96 104 0L240 0" dur="' + D + 's" repeatCount="indefinite" calcMode="spline" keyTimes="0;0.1;0.45;0.86;1" keyPoints="0;0;0.528;1;1" keySplines="0 0 1 1;0.3 0.1 0.7 0.9;0.1 0.6 0.3 1;0 0 1 1"/>';
    return { vue: "profil", miroir: false, h: 190, alt: "Vue de profil. La balle vole jusqu'à une serviette posée au sol, y tombe, puis roule jusqu'au trou.",
      geo: '<line class="s-terrain" x1="10" y1="160" x2="310" y2="160"/>' +
        '<rect class="s-serviette" x="116" y="155" width="44" height="6" rx="2"/>' +
        '<line class="s-mat" x1="280" y1="160" x2="280" y2="112"/><path class="s-drapeau" d="M280 112L300 120L280 128Z"/>' +
        '<path class="s-chemin" d="M34 154Q86 58 138 154"/>' +
        sBalle(34, 154, vol),
      txt: [[138, 182, "point de chute", "middle"], [222, 148, "roule", "middle"]] };
  };

  SCHEMAS.we_echelle = function () {
    var D = 10, xs = [96, 144, 192, 240, 288], g = '<line class="s-terrain" x1="10" y1="160" x2="310" y2="160"/>';
    xs.forEach(function (x, k) {
      var t0 = 0.02 + k * 0.19, t1 = t0 + 0.13, dx = x - 22, hmax = 60 + k * 18;
      g += '<line class="s-mat" x1="' + x + '" y1="160" x2="' + x + '" y2="136"/><path class="s-drapeau" d="M' + x + ' 136L' + (x + 12) + ' 141L' + x + ' 146Z"/>' +
        (REDUIT && k ? "" : sBalle(22, 154, mvt("M0 0Q" + (dx / 2) + " " + (-hmax) + " " + dx + " 0", D, t0, t1, false) + fondu(D, [[0, k ? 0 : 1], [Math.max(0.005, t0 - 0.01), k ? 0 : 1], [t0, 1], [t0 + 0.17, 1], [t0 + 0.18, 0], [1, 0]])));
    });
    return { vue: "profil", miroir: false, h: 190, alt: "Vue de profil. Cinq drapeaux sont plantés à 30, 40, 50, 60 et 70 mètres. Une balle est jouée vers chaque distance, de la plus courte à la plus longue.",
      geo: g, txt: xs.map(function (x, k) { return [x, 178, (30 + k * 10) + " m", "middle"]; }).concat([[22, 178, "toi", "middle"]]) };
  };

  function schemaHTML(id) {
    if (!a(SCHEMAS, id)) return "";
    var s = SCHEMAS[id](), gaucher = lateralite() === "G", G = gaucher && s.miroir !== false, W = 320, H = s.h || 210;
    var txt = (s.txt || []).map(function (x) {
      var anc = x[3] || "start";
      if (G) anc = anc === "start" ? "end" : anc === "end" ? "start" : anc;
      return '<text class="s-txt" x="' + (G ? W - x[0] : x[0]) + '" y="' + x[1] + '" text-anchor="' + anc + '">' + L(x[2]) + '</text>';
    }).join("");
    var vues = { dessus: "vu de dessus", face: "vu de face", profil: "vu de profil" };
    return '<figure class="schema"><svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + at(lat(s.alt, lateralite())) + '">' +
      '<rect class="s-sol" x="1" y="1" width="' + (W - 2) + '" height="' + (H - 2) + '" rx="6"/>' +
      '<g' + (G ? ' transform="translate(' + W + ' 0) scale(-1 1)"' : '') + '>' + s.geo + '</g>' + txt + '</svg>' +
      '<figcaption>' + t("Schéma " + (REDUIT ? "" : "animé, ") + vues[s.vue] + (s.miroir !== false ? (gaucher ? ", pour un gaucher" : ", pour un droitier") : "")) + '</figcaption></figure>';
  }
