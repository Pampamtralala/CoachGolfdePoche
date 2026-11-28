  /* ============================================================
     APRÈS LA PARTIE : bilan express au club-house, carte de score en image,
     meilleurs et pires trous de chaque parcours.
     ============================================================ */

  /* ---------- Bilan express : trois points clés, tout de suite après le dernier trou ---------- */
  function exosDuDomaine(d, n) {
    var pal = palierDe(indexNiveau(etat.profil));
    return EXERCICES.filter(function (e) { return e.d === d && e.niv[0] <= pal && pal <= e.niv[1]; }).slice(0, n || 1);
  }
  function expressHTML() {
    var pt = ui.bilanPartie, s = statsTrous(pt.trous), sc = scorePartie(pt), cible = cibleCourante(), pts = pointsCles(pt, cible);
    var h = '<section class="partie express' + (etat.ecranClair ? " clair" : "") + '" role="dialog" aria-modal="true" aria-labelledby="pt-titre">' +
      '<header><p class="surtitre">' + t(nomPartie(pt) + " · " + s.T + " trous") + '</p></header>' +
      '<h2 id="pt-titre">Ton bilan express</h2>' +
      '<p class="xp-score"><span class="main">' + (sc.complet ? sc.coups : "–") + '</span><span>' + t(sc.complet ? (sc.ecart ? ecartLib(sc.ecart) + " par rapport au par" : "dans le par") : "score incomplet") + ' · ' + t(pluriel(s.P, "putt")) + '</span>' +
      (recordPartie(pt) ? ' <span class="tampon">record ' + TRAIT + '</span>' : '') + '</p>';
    if (pts.length) {
      h += '<p class="xp-intro">' + t("Trois points à retenir, face à ton objectif d'index " + cible + " :") + '</p><ol class="xp-points">' + pts.map(function (x) {
        /* V4-08 : bilan court — le constat et son poids ; exercices et défis sont dans le profil (coaching). */
        return '<li class="' + x.type + '"><b>' + t((x.type === "fort" ? "Ce qui a marché · " : "À travailler · ") + x.nom) + '</b>' +
          '<p>' + t(x.fait) + '</p><small>' + t(x.sg > 0 ? "environ " + coupsLib(x.sg, "gagné") : x.sg < 0 ? "environ " + coupsLib(x.sg, "perdu") : "à égalité") + '</small></li>';
      }).join("") + '</ol>';
    }
    if (pt.joueurs && pt.joueurs.length) {
      var pars = pt.trous.map(function (x) { return x[5]; });
      h += '<p class="xp-joueurs">' + t("Partenaires : " + pt.joueurs.map(function (j) { var r = scoreJoueur(j.s, pars); return j.nom + (r.n ? " " + r.coups + " (" + ecartLib(r.ecart) + ")" : " –"); }).join(", ") + ".") + '</p>';
    }
    /* V4-08 : le reste (habitudes, trous marquants, clubs, erreurs) est replié : pas de long rapport imposé. */
    var plus = apresComparaisonHTML(pt) + apresTrousClubsHTML(pt) + erreursPartieHTML(pt);
    if (plus) h += '<details class="aide-pli xp-plus"><summary><span class="ico-info" aria-hidden="true">i</span>' + t("Plus de détails sur cette partie") + '</summary><div>' + plus + '</div></details>';
    var i = etat.parties.indexOf(pt);
    return h + '<div class="xp-actions">' + (ui.partage && i >= 0 ? '<button class="btn large" type="button" data-a="pt-image" data-id="' + i + '">Partager ma carte en image</button>' : '') +
      '<button class="lien" type="button" data-a="pt-express-chiffres">Voir la partie en chiffres</button></div>' +
      '<div class="pt-nav"><button class="btn" type="button" data-a="pt-bilan-fermer">Fermer</button>' +
      '<button class="btn principal" type="button" data-a="pt-voir-sg" id="pt-suiv">Voir l’analyse complète</button></div></section>';
  }
  ACTIONS["pt-express-chiffres"] = function () { if (!ui.bilanPartie) return; ui.partie = "bilan"; rendrePartie(); hautPartie(); focusPartie("#pt-suiv"); };

  /* ---------- Carte de score en image ----------
     Dessinée sur un canevas : le joueur et ses partenaires, cercles sous le par et carrés au-dessus, comme sur une carte papier. */
  function carteImage(pt) {
    var W = 1080, P = 56, n = pt.trous.length, neufs = n > 9 ? 2 : 1, joueurs = [{ nom: etat.profil.prenom || "Moi", s: pt.trous.map(function (x) { return x[4] || null; }) }].concat(pt.joueurs || []);
    var rangH = 66, blocH = rangH * (2 + joueurs.length) + 40, H = 330 + neufs * blocH + 150;
    var cv = document.createElement("canvas"); cv.width = W; cv.height = H;
    var g = cv.getContext("2d"), pc = parcoursDe(pt.pc), sc = scorePartie(pt), s = statsTrous(pt.trous), o = pt.o || 0;
    var F = '"Barlow Condensed", "Arial Narrow", sans-serif', T = '"Atkinson Hyperlegible", system-ui, sans-serif';
    function rect(x, y, w, h, r, c) { g.fillStyle = c; g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); g.fill(); }
    function texte(txt, x, y, taille, police, couleur, align, gras) { g.font = (gras ? "700 " : "400 ") + taille + "px " + police; g.fillStyle = couleur; g.textAlign = align || "left"; g.textBaseline = "middle"; g.fillText(txt, x, y); }
    g.fillStyle = "#F2F4EF"; g.fillRect(0, 0, W, H);
    rect(P / 2, P / 2, W - P, H - P, 36, "#FFFFFF");
    texte("COACH DE POCHE", P + 14, 92, 30, F, "#2A6243", "left", true);
    texte(pc ? pc.nom : "Partie", P + 14, 158, 56, T, "#16211A", "left", true);
    texte(dateCourte(pt.d) + " · " + n + " trous", P + 14, 214, 32, T, "#56635B");
    if (sc.complet) {
      texte(String(sc.coups), W - P - 14, 150, 104, F, "#1E3EC2", "right", true);
      texte(sc.ecart ? ecartLib(sc.ecart).replace("−", "-") : "par", W - P - 14, 222, 38, F, "#16211A", "right", true);
    }
    var colNom = 190, colTot = 104, cases = 9, x0 = P + 14, cw = (W - 2 * P - 28 - colNom - colTot) / cases;
    for (var b = 0; b < neufs; b++) {
      var y = 300 + b * blocH, deb = b * 9, fin = Math.min(n, deb + 9), lignes = [["Trou"], ["Par"]].concat(joueurs.map(function (j) { return [j.nom]; }));
      rect(x0 - 8, y - 6, W - 2 * P - 12, rangH * 2 - 8, 14, "#F2F4EF");
      lignes.forEach(function (l, r) {
        var yy = y + r * rangH + rangH / 2 - 4;
        texte(l[0].length > 11 ? l[0].slice(0, 10) + "." : l[0], x0 + 6, yy, r < 2 ? 30 : 34, r < 2 ? F : T, r < 2 ? "#56635B" : "#16211A", "left", r >= 2);
        var tot = 0, nb = 0;
        for (var k = deb; k < fin; k++) {
          var cx = x0 + colNom + (k - deb + 0.5) * cw, par = pt.trous[k][5];
          if (r === 0) texte(String(o + k + 1), cx, yy, 30, F, "#56635B", "center", true);
          else if (r === 1) { texte(par ? String(par) : "–", cx, yy, 32, F, "#16211A", "center"); if (par) { tot += par; nb++; } }
          else {
            var v = joueurs[r - 2].s[k];
            if (v) {
              var d = par ? v - par : 0; tot += v; nb++;
              g.strokeStyle = "#1E3EC2"; g.lineWidth = 3;
              if (par && d < 0) { g.beginPath(); g.arc(cx, yy, 24, 0, 2 * Math.PI); g.stroke(); if (d < -1) { g.beginPath(); g.arc(cx, yy, 30, 0, 2 * Math.PI); g.stroke(); } }
              else if (par && d > 0) { g.strokeStyle = "#8A958D"; g.strokeRect(cx - 23, yy - 23, 46, 46); if (d > 1) g.strokeRect(cx - 29, yy - 29, 58, 58); }
              texte(String(v), cx, yy + 1, 36, F, d < 0 ? "#1E3EC2" : "#16211A", "center", true);
            } else texte("–", cx, yy, 32, F, "#8A958D", "center");
          }
        }
        var lib = r === 0 ? (neufs === 1 ? "Total" : b ? (o ? "Ret." : "Ret.") : "Aller") : nb ? String(tot) : "–";
        texte(lib, x0 + colNom + cases * cw + colTot / 2, yy, r === 0 ? 30 : 36, F, r === 0 ? "#56635B" : "#16211A", "center", true);
      });
    }
    var yb = 300 + neufs * blocH + 30;
    texte("Greens " + s.G + "/" + s.T + "  ·  Putts " + s.P + "  ·  Pénalités " + s.X + "  ·  Départs jouables " + s.J + "/" + s.T, P + 14, yb, 30, T, "#56635B");
    texte("Noté trou par trou avec Coach de poche", P + 14, yb + 52, 26, T, "#8A958D");
    return new Promise(function (ok) { cv.toBlob(function (bl) { ok(bl); }, "image/png"); });
  }

  /* ---------- Enregistrer ou partager un fichier ----------
     Dans claude.ai, la capacité « downloads » (le téléphone propose alors de partager l'image).
     Ailleurs, le partage natif, puis un téléchargement ordinaire. */
  var EXPORT = { p: null };
  function dansCadre() { try { return window.self !== window.top; } catch (e) { return true; } }
  function claudeDownloads() {
    var c = window.claude;
    if (!c || typeof c.use !== "function") return Promise.resolve(null);
    if (!EXPORT.p) EXPORT.p = c.use("downloads").then(function (d) { return d || null; }, function () { return null; });
    return EXPORT.p;
  }
  function verifierPartage(essai) {
    var c = window.claude;
    if (c && typeof c.use === "function") {
      claudeDownloads().then(function (d) { var avant = ui.partage; ui.partage = !!d; if (avant !== ui.partage) { rendre(); rendreFeuille(); rendrePartie(); } });
      return;
    }
    if ((essai || 0) < 10 && dansCadre()) { setTimeout(function () { verifierPartage((essai || 0) + 1); }, 500); return; }
    ui.partage = !dansCadre();
  }
  function partagerFichier(blob, nom, titre) {
    return claudeDownloads().then(function (dl) {
      if (dl) {
        return dl.save({ filename: nom, data: blob }).then(function () { message("Image prête : " + nom + "."); }, function (e) {
          if (e && e.code === "declined") return;
          message("L’image n’a pas pu être enregistrée ici.");
        });
      }
      var f = null;
      try { f = new File([blob], nom, { type: "image/png" }); } catch (e) { f = null; }
      if (f && navigator.canShare && navigator.canShare({ files: [f] })) return navigator.share({ files: [f], title: titre }).catch(function () { /* partage annulé */ });
      var url = URL.createObjectURL(blob), a = document.createElement("a");
      a.href = url; a.download = nom; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 5000);
    });
  }
  ACTIONS["pt-image"] = function (el) {
    var pt = etat.parties[parseInt(el.getAttribute("data-id"), 10)]; if (!pt) return;
    el.disabled = true;
    var fini = function () { el.disabled = false; };
    var pret = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    pret.then(function () { return carteImage(pt); }).then(function (bl) {
      if (!bl) throw new Error("image");
      var pc = parcoursDe(pt.pc);
      return partagerFichier(bl, "carte-de-score-" + String(pt.d).slice(0, 10).replace(/[^0-9-]/g, "") + ".png", "Ma carte de score" + (pc ? " · " + pc.nom : ""));
    }).then(fini, function () { fini(); message("L’image n’a pas pu être préparée."); });
  };

  /* ---------- Carte de score : partenaires et coups notés ---------- */
  function carteCompleteHTML(pt, i) {
    var h = "", pars = pt.trous.map(function (x) { return x[5]; }), o = pt.o || 0;
    if (pt.joueurs && pt.joueurs.length) {
      h += '<h3 class="titre-bloc">Partenaires</h3><div class="defile"><table class="carte-score marqueur"><thead><tr><th scope="col">Trou</th>' +
        pt.trous.map(function (x, k) { return '<th scope="col" class="num">' + (o + k + 1) + '</th>'; }).join("") + '<th scope="col" class="num">Total</th></tr></thead><tbody>' +
        pt.joueurs.map(function (j) {
          var r = scoreJoueur(j.s, pars);
          return '<tr><th scope="row">' + t(j.nom) + '</th>' + j.s.map(function (v, k) {
            var d = v && pars[k] ? v - pars[k] : 0;
            return '<td class="num">' + (v ? '<span class="marque ' + (d < 0 ? "dessus" : d > 0 ? "dessous" : "") + '">' + v + '</span>' : '–') + '</td>';
          }).join("") + '<td class="num"><span class="main">' + (r.n ? r.coups : "–") + '</span>' + (r.n ? '<small>' + ecartLib(r.ecart) + '</small>' : '') + '</td></tr>';
        }).join("") + '</tbody></table></div>';
    }
    var coups = [];
    (pt.coups || []).forEach(function (l, k) { (l || []).forEach(function (c, n) { coups.push({ k: k, n: n + 1, c: c }); }); });
    if (coups.length) {
      var mes = coups.filter(function (x) { return x.c.d; }).length;
      h += '<details><summary>' + t(pluriel(coups.length, "coup") + " noté" + (coups.length > 1 ? "s" : "") + ", dont " + mes + " mesuré" + (mes > 1 ? "s" : "")) + '</summary><ul class="liste-coups">' +
        coups.map(function (x) { return '<li>' + t("Trou " + (o + x.k + 1) + " · " + libCoup(x.c, x.n)) + '</li>'; }).join("") + '</ul>' +
        '<p class="aide">Les coups mesurés comptent dans les distances de ton sac et dans ta matrice de wedges.</p></details>';
    }
    if (ui.partage) h += '<p style="margin-top:14px"><button class="btn large" type="button" data-a="pt-image" data-id="' + i + '">Partager la carte en image</button></p>';
    return h;
  }

  /* ---------- Meilleurs et pires trous d'un parcours ---------- */
  function topFlopHTML(an) {
    var tf = topFlopTrous(an, 2);
    if (tf.n < 2) return "";
    function ligne(x, mauvais) {
      return '<li class="' + (mauvais ? "flop" : "top") + '" aria-label="' + at("Trou " + (x.h + 1) + (x.par ? ", par " + x.par : "") + " : " + signe(x.moy) + " en moyenne sur " + pluriel(x.N, "passage")) + '"><span class="tf-trou main" aria-hidden="true">' + (x.h + 1) + '</span><span class="tf-txt" aria-hidden="true"><b class="main">' + t(signe(x.moy)) + '</b><small>' + t((x.par ? "par " + x.par + " · " : "") + pluriel(x.N, "passage")) + '</small></span></li>';
    }
    return '<h3 class="titre-bloc">Tes meilleurs et tes pires trous</h3><div class="top-flop">' +
      '<div><p class="tf-titre">Là où tu perds le plus</p><ol>' + tf.flop.map(function (x) { return ligne(x, true); }).join("") + '</ol></div>' +
      '<div><p class="tf-titre">Là où tu scores le mieux</p><ol>' + tf.top.map(function (x) { return ligne(x, false); }).join("") + '</ol></div></div>' +
      '<p class="aide">' + t("Écart moyen au par, trou par trou, sur les trous joués au moins deux fois.") + '</p>';
  }
  /* Une phrase pour la liste des parcours : « tu perds le plus au 12 (+1,8) ». */
  function pireTrouLib(an) {
    var tf = topFlopTrous(an, 2), x = tf.flop[0];
    return x && x.moy > 0 ? "pire trou : le " + (x.h + 1) + " (" + signe(x.moy) + ")" : "";
  }

  /* ============================================================
     APRÈS LA PARTIE (roadmap UX, UX11) : la partie face à tes habitudes, ce qui a changé dans tes statistiques,
     meilleurs et pires trous, clubs utilisés, accès direct aux analyses. Seulement ce que la partie contient.
     ============================================================ */
  var HABITUDES_N = 10;
  function chiffres18(l) { var A = tableauStats(l); return { e: A.ecart18, p: A.putts18, g: A.gir18, x: A.penalites18, parties: A.parties, completes: A.parPartie.length }; }
  /* Synthèse et comparaison : la partie (ramenée à 18 trous) contre la moyenne des 10 parties précédentes. */
  function apresComparaisonHTML(pt) {
    var toutes = partiesAnalyse(), i = toutes.indexOf(pt), avant = (i >= 0 ? toutes.slice(0, i) : toutes.filter(function (x) { return x !== pt; })).slice(-HABITUDES_N);
    var P = chiffres18([pt]), H = chiffres18(avant), h = '';
    var lignes = [], meilleurs = [];
    function ligne(lib, v, ref, bas, unite, k) {
      if (v == null || ref == null) return;
      var d = Math.round((v - ref) * 10) / 10, mieux = Math.abs(d) < 0.3 ? 0 : (bas ? d < 0 : d > 0) ? 1 : -1;
      lignes.push('<li class="' + (mieux > 0 ? "mieux" : mieux < 0 ? "moins" : "") + '"><b>' + t(lib) + '</b> ' + t(nbStat(v, k === "e") + unite + " contre " + nbStat(ref, k === "e") + unite + " habituellement") +
        ' <span class="tend ' + (mieux > 0 ? "mieux" : mieux < 0 ? "moins" : "stable") + '"' + (mieux ? ' title="' + (mieux > 0 ? "mieux" : "moins bien") + '"' : '') + '>' + (mieux ? (d > 0 ? "▲ " : "▼ ") + nbStat(Math.abs(d)) + '<span class="vh">' + (mieux > 0 ? " (mieux)" : " (moins bien)") + '</span>' : "= stable") + '</span></li>');
      if (mieux) meilleurs.push({ k: k, lib: lib, d: d, mieux: mieux });
    }
    if (H.parties >= 3) {
      ligne("Score", P.completes ? P.e : null, H.completes ? H.e : null, true, "", "e");
      ligne("Putts", P.p, H.p, true, "", "p");
      ligne("Greens en régulation", P.g, H.g, false, "", "g");
      ligne("Pénalités", P.x, H.x, true, "", "x");
    }
    if (lignes.length) {
      var se = meilleurs.filter(function (m) { return m.k === "e"; })[0], autres = meilleurs.filter(function (m) { return m.k !== "e"; }).sort(function (a, b) { return Math.abs(b.d) - Math.abs(a.d); });
      var raison = se ? autres.filter(function (m) { return m.mieux === se.mieux; })[0] : null;
      var synth = se ? (se.mieux > 0 ? "Partie meilleure que d'habitude de " + nb1(Math.abs(se.d)) + " coup" + (Math.abs(se.d) >= 2 ? "s" : "") : "Partie plus difficile que d'habitude de " + nb1(Math.abs(se.d)) + " coup" + (Math.abs(se.d) >= 2 ? "s" : "")) +
        (raison ? ", surtout " + (se.mieux > 0 ? "grâce " : "à cause ") + ({ p: "au putting", g: "aux greens en régulation", x: "aux pénalités" })[raison.k] : "") + " (ramené à 18 trous)." : "Partie proche de tes habitudes.";
      h += '<div class="apres-habitudes"><h3 class="titre-bloc">' + t("Par rapport à tes habitudes") + '</h3><p class="apres-synthese">' + t(synth) + '</p><ul class="constats">' + lignes.join("") + '</ul>' +
        '<p class="aide">' + t("Moyenne de tes " + pluriel(H.parties, "partie") + " précédentes, ramenée à 18 trous.") + '</p></div>';
      /* Ce qui a changé dans tes statistiques : les 10 dernières parties avant et avec celle-ci. */
      var avec = (i >= 0 ? toutes.slice(0, i + 1) : avant.concat([pt])).slice(-HABITUDES_N), N = chiffres18(avec);
      if (N.e != null && H.e != null && H.completes && N.completes) h += '<p class="aide apres-change">' + t("Tes " + HABITUDES_N + " dernières parties : score moyen " + nbStat(H.e, true) + " → " + nbStat(N.e, true) + ", putts " + nbStat(H.p) + " → " + nbStat(N.p) + " par 18 trous.") + '</p>';
    } else if (H.parties < 3) h += '<p class="aide">' + t("La comparaison avec tes habitudes apparaîtra à partir de 3 parties précédentes.") + '</p>';
    return h;
  }
  /* Meilleur et plus coûteux trou ; clubs utilisés (coups notés, sinon familles de départ). */
  function apresTrousClubsHTML(pt) {
    var h = '', ec = [];
    pt.trous.forEach(function (tr, k) { if (tr && tr[4] > 0 && tr[5] > 0) ec.push({ n: numeroTrou(pt, k), e: tr[4] - tr[5], par: tr[5] }); });
    if (ec.length >= 3) {
      var tri = ec.slice().sort(function (a, b) { return a.e - b.e || a.n - b.n; }), meil = tri[0], pire = tri[tri.length - 1];
      if (meil.e < pire.e) h += '<p class="apres-trous">' + t("Meilleur trou : le " + meil.n + " (par " + meil.par + ", " + ecartLib(meil.e) + ") · plus coûteux : le " + pire.n + " (par " + pire.par + ", " + ecartLib(pire.e) + ").") + '</p>';
    }
    var n = {}; (pt.coups || []).forEach(function (l) { (l || []).forEach(function (c) { if (c && CLUB[c.c]) n[c.c] = (n[c.c] || 0) + 1; }); });
    var ids = Object.keys(n);
    if (ids.length) h += '<p class="apres-clubs">' + t("Clubs utilisés : " + ids.sort(function (a, b) { return n[b] - n[a]; }).map(function (id) { return nomClub(id) + " (" + n[id] + ")"; }).join(", ") + ".") + '</p>';
    else {
      var f = {}; pt.trous.forEach(function (tr) { if (tr && tr[5] >= 4 && FAMILLES_DEPART[tr[7]]) f[FAMILLES_DEPART[tr[7]].nom] = (f[FAMILLES_DEPART[tr[7]].nom] || 0) + 1; });
      if (Object.keys(f).length) h += '<p class="apres-clubs">' + t("Au départ : " + Object.keys(f).map(function (k) { return k.toLowerCase() + " (" + f[k] + ")"; }).join(", ") + ".") + '</p>';
    }
    return h;
  }
  function apresLiensHTML() {
    return '<div class="apres-liens"><p class="titre-liste">' + t("Voir l'analyse") + '</p><div class="raccourcis">' +
      [["rb-perf", "Performance"], ["st-putting", "Putting"], ["rb-mej", "Mises en jeu"], ["st-erreurs", "Erreurs"]].map(function (x) {
        return '<button class="btn" type="button" data-a="pt-voir-rubrique" data-s="' + x[0] + '">' + t(x[1]) + '</button>';
      }).join("") + '</div></div>';
  }
  ACTIONS["pt-voir-rubrique"] = function (el) {
    var s = el.getAttribute("data-s");
    ui.partie = null; ui.bilanPartie = null; rendrePartie(); allerA("bilan", s);
  };
