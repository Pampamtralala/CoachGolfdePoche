  /* ============================================================
     GRAPHIQUES : Chart.js, intégré à la page.
     Un rendu écrit un <canvas> et met sa fabrique en attente ;
     monterGraphes() dessine les graphiques une fois le HTML en place.
     L'animation d'entrée ne rejoue que si les données ont changé.
     ============================================================ */
  var CJ = typeof window.Chart === "function" ? window.Chart : null;
  var graphesAttente = [], graphesVus = {}, graphesActifs = [], numGraphe = 0;
  var POLICE_CHIFFRES = '"Barlow Condensed", "Arial Narrow", sans-serif';
  if (CJ) {
    CJ.defaults.font.family = '"Atkinson Hyperlegible", system-ui, sans-serif';
    CJ.defaults.font.size = 13;
    CJ.defaults.maintainAspectRatio = false;
  }
  function mouvementReduit() { try { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; } }
  function teinte(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
  function couleursGraphe() {
    return { plus: teinte("--g-plus"), moins: teinte("--g-moins"), neutre: teinte("--g-neutre"), encre: teinte("--encre"), encre2: teinte("--encre-2"),
      filet: teinte("--filet"), carte: teinte("--carte"), fond: teinte("--papier-2"), zero: teinte("--encre-2") };
  }
  /* "#1E3EC2" et une opacité → "rgba(…)". */
  function alpha(hex, a) {
    var m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
    return m ? "rgba(" + parseInt(m[1], 16) + "," + parseInt(m[2], 16) + "," + parseInt(m[3], 16) + "," + a + ")" : hex;
  }

  /* cle : nom stable du graphique ; resume : phrase lue par les lecteurs d'écran ;
     fabrique(C) rend la configuration Chart.js avec les couleurs du thème. */
  function grapheHTML(cle, hauteur, resume, fabrique, sig) {
    var id = "gr-" + (++numGraphe);
    graphesAttente.push({ id: id, cle: cle, fabrique: fabrique, sig: sig, resume: resume });
    return '<div class="graphe-cj" style="height:' + hauteur + 'px"><canvas id="' + id + '" role="img" aria-label="' + at(resume) + '"></canvas></div>';
  }
  function monterGraphes() {
    graphesActifs = graphesActifs.filter(function (g) {
      if (g.canvas && document.body.contains(g.canvas)) return true;
      try { g.destroy(); } catch (e) { /* déjà détruit */ }
      return false;
    });
    var l = graphesAttente; graphesAttente = [];
    if (!l.length) return;
    var C = couleursGraphe(), reduit = mouvementReduit();
    l.forEach(function (x) {
      var cv = document.getElementById(x.id); if (!cv) return;
      var repli = function () { cv.parentNode.outerHTML = '<p class="aide graphe-repli">' + t(x.resume) + '</p>'; };
      if (!CJ) { repli(); return; }
      var anime = !reduit && graphesVus[x.cle] !== x.sig;
      graphesVus[x.cle] = x.sig;
      try {
        var cfg = x.fabrique(C);
        cfg.options = cfg.options || {};
        cfg.options.responsive = true;
        cfg.options.maintainAspectRatio = false;
        cfg.options.animation = anime ? { duration: 700, easing: "easeOutQuart" } : false;
        cfg.options.events = ["mousemove", "mouseout", "click", "touchstart", "touchmove"];
        graphesActifs.push(new CJ(cv, cfg));
      } catch (e) { repli(); }
    });
  }
  /* Le thème du téléphone change : les graphiques reprennent ses couleurs. */
  try {
    var themeSombre = window.matchMedia("(prefers-color-scheme: dark)");
    var surTheme = function () { if (etat.profil) { rendre(); if (ui.feuille) rendreFeuille(); } };
    if (themeSombre.addEventListener) themeSombre.addEventListener("change", surTheme); else if (themeSombre.addListener) themeSombre.addListener(surTheme);
  } catch (e) { /* thème indisponible */ }

  function titreAxe(C, txt) { return { display: true, text: txt, color: C.encre2, padding: { top: 2 }, font: { size: 12 } }; }
  function infobulle(C, rappels) {
    return { backgroundColor: C.encre, titleColor: C.carte, bodyColor: C.carte, padding: 10, cornerRadius: 10, displayColors: false,
      titleFont: { weight: "700", size: 14 }, bodyFont: { size: 13 }, caretSize: 6, callbacks: rappels };
  }
  /* Texte posé sur le graphique après les barres (valeurs, mentions). */
  function etiquettes(dessin) { return { id: "etiquettes", afterDatasetsDraw: function (chart) { var c = chart.ctx; c.save(); dessin(chart, c); c.restore(); } }; }
  function texte(c, s, x, y, align, couleur, police) {
    c.font = police || ("700 15px " + POLICE_CHIFFRES); c.fillStyle = couleur; c.textAlign = align || "left"; c.textBaseline = "middle"; c.fillText(s, x, y);
  }
  /* Phrase en lignes courtes pour une infobulle. */
  function lignes(s, n) {
    var mots = String(s).split(" "), l = [], cur = "";
    mots.forEach(function (m) { if ((cur + " " + m).trim().length > (n || 38)) { l.push(cur.trim()); cur = m; } else cur += " " + m; });
    if (cur.trim()) l.push(cur.trim());
    return l;
  }

  /* ---------- Distances par club : plage de la plus courte à la plus longue, et moyenne ---------- */
  function grapheDistances(an, sel) {
    var L = an.lignes, ids = L.map(function (x) { return x.club.id; });
    var lo = Math.max(0, Math.floor((an.min - 8) / 20) * 20), hi = Math.ceil((an.max + 8) / 20) * 20;
    if (hi - lo < 40) hi = lo + 40;
    var resume = "Distance de vol moyenne par club : " + L.map(function (x) { return x.club.court + " " + x.s.moy + " m"; }).join(", ") + ".";
    return grapheHTML("distances", 52 + L.length * 34, resume, function (C) {
      return {
        type: "bar",
        data: {
          labels: L.map(function (x) { return x.club.court; }),
          datasets: [
            { label: "Plage", data: L.map(function (x) { return x.s.max > x.s.min ? [x.s.min, x.s.max] : null; }),
              backgroundColor: ids.map(function (id) { return alpha(C.plus, id === sel ? 0.42 : 0.2); }), borderRadius: 6, borderSkipped: false, barThickness: 10, order: 2 },
            { type: "line", label: "Moyenne", data: L.map(function (x) { return x.s.moy; }), showLine: false, order: 1,
              pointRadius: ids.map(function (id) { return id === sel ? 7 : 5.5; }), pointHoverRadius: 8, pointBackgroundColor: C.plus, pointBorderColor: C.carte, pointBorderWidth: 2 }
          ]
        },
        options: {
          indexAxis: "y",
          layout: { padding: { right: 44, top: 4 } },
          interaction: { mode: "index", axis: "y", intersect: false },
          scales: {
            x: { min: lo, max: hi, grid: { color: C.filet }, border: { display: false }, title: titreAxe(C, "mètres"),
              ticks: { color: C.encre2, stepSize: hi - lo > 160 ? 50 : 20, maxRotation: 0, autoSkipPadding: 6, includeBounds: false } },
            y: { grid: { display: false }, border: { display: false }, ticks: { color: C.encre, font: { family: POLICE_CHIFFRES, weight: "700", size: 15 } } }
          },
          plugins: {
            legend: { display: false },
            tooltip: infobulle(C, {
              title: function (it) { return L[it[0].dataIndex].club.nom; },
              label: function (it) { if (it.datasetIndex !== 1) return null; var s = L[it.dataIndex].s; return "Moyenne : " + s.moy + " m"; },
              afterBody: function (it) { var s = L[it[0].dataIndex].s; return s.n > 1 ? "De " + s.min + " à " + s.max + " m · " + s.n + " mesures" : "Une mesure"; }
            })
          }
        },
        plugins: [etiquettes(function (chart, c) {
          var meta = chart.getDatasetMeta(1);
          meta.data.forEach(function (pt, i) { texte(c, String(L[i].s.moy), chart.chartArea.right + 40, pt.y, "right", C.encre); });
        })]
      };
    }, JSON.stringify(L.map(function (x) { return [x.club.id, x.s.min, x.s.moy, x.s.max]; })));
  }

  /* ---------- Matrice de wedges : un point par coup, trous de la fenêtre 30-80 m ---------- */
  function grapheWedges(an) {
    var lo = 20, hi = 110, fen = WEDGE_FENETRE;
    var vis = an.pts.filter(function (p) { return p.v >= lo && p.v <= hi; });
    var rangs = ["Tous"].concat(WEDGES.filter(function (w) { return an.pts.some(function (p) { return p.w === w; }); }).map(function (w) { return CLUB[w].court; }));
    function pts(plein) {
      var l = [];
      vis.filter(function (p) { return (p.a === "plein") === plein; }).forEach(function (p) { l.push({ x: p.v, y: CLUB[p.w].court, p: p }); l.push({ x: p.v, y: "Tous", p: p }); });
      return l;
    }
    var resume = "Distances de wedge, en mètres : " + vis.map(function (p) { return nomPoint(p) + " " + p.v + " m"; }).join(", ") + "." +
      (an.trous.length ? " Trous : " + an.trous.map(function (x) { return Math.round(x.ecart) + " m entre " + Math.round(x.lo) + " et " + Math.round(x.hi); }).join(", ") + "." : "");
    return grapheHTML("wedges", 70 + rangs.length * 34, resume, function (C) {
      var point = { pointRadius: 6, pointHoverRadius: 8, pointBorderWidth: 2 };
      return {
        type: "scatter",
        data: { datasets: [
          Object.assign({ label: "Amplitude", data: pts(false), pointBackgroundColor: C.plus, pointBorderColor: C.carte }, point),
          Object.assign({ label: "Plein swing", data: pts(true), pointBackgroundColor: C.carte, pointBorderColor: C.plus }, point, { pointBorderWidth: 2.5 })
        ] },
        options: {
          layout: { padding: { top: 14 } },
          scales: {
            x: { type: "linear", min: lo, max: hi, grid: { color: C.filet }, border: { display: false }, title: titreAxe(C, "mètres"),
              ticks: { color: C.encre2, stepSize: 10, autoSkip: false, maxRotation: 0, callback: function (v) { return v % 20 === 10 ? v : ""; } } },
            y: { type: "category", labels: rangs, offset: true, grid: { display: false }, border: { display: false },
              ticks: { color: C.encre, font: { family: POLICE_CHIFFRES, weight: "700", size: 15 } } }
          },
          plugins: {
            legend: { display: false },
            tooltip: infobulle(C, { title: function () { return ""; }, label: function (it) { return nomPoint(it.raw.p) + " : " + it.raw.p.v + " m"; } })
          }
        },
        plugins: [{
          id: "fenetre",
          beforeDatasetsDraw: function (chart) {
            var c = chart.ctx, X = chart.scales.x, a = chart.chartArea, y = chart.scales.y.getPixelForValue(0);
            c.save();
            c.fillStyle = C.fond; c.fillRect(X.getPixelForValue(fen[0]), a.top, X.getPixelForValue(fen[1]) - X.getPixelForValue(fen[0]), a.bottom - a.top);
            an.trous.forEach(function (tr) {
              var xa = X.getPixelForValue(Math.max(lo, tr.lo)), xb = X.getPixelForValue(Math.min(hi, tr.hi));
              c.fillStyle = C.moins;
              c.beginPath();
              if (c.roundRect) c.roundRect(xa, y - 4, xb - xa, 8, 4); else c.rect(xa, y - 4, xb - xa, 8);
              c.fill();
              texte(c, Math.round(tr.ecart) + " m", (xa + xb) / 2, y - 15, "center", C.encre, "700 13px " + POLICE_CHIFFRES);
            });
            c.restore();
          }
        }]
      };
    }, JSON.stringify([vis.map(function (p) { return [p.w, p.a, p.v]; }), an.trous.map(function (x) { return [x.lo, x.hi]; })]));
  }

  /* ---------- Coups gagnés ou perdus par secteur ---------- */
  function grapheSG(r, details) {
    var S = r.secteurs, mx = Math.max(1.5, Math.ceil(Math.max.apply(null, S.map(function (s) { return Math.abs(s.sg || 0); })) * 2) / 2);
    var resume = "Coups gagnés ou perdus sur 18 trous face à un joueur d'index " + r.cible + " : " +
      S.map(function (s) { return s.nom + " " + (s.sg == null ? "non mesuré" : signe(s.sg)); }).join(" ; ") + ".";
    return grapheHTML("sg", 30 + S.length * 40, resume, function (C) {
      return {
        type: "bar",
        data: { labels: S.map(function (s) { return s.nom; }), datasets: [{
          data: S.map(function (s) { return s.sg; }),
          backgroundColor: S.map(function (s) { return s.sg != null && s.sg < 0 ? C.moins : C.plus; }),
          borderRadius: 5, borderSkipped: "start", barThickness: 16
        }] },
        options: {
          indexAxis: "y",
          layout: { padding: { top: 20, right: 6 } },
          scales: {
            x: { min: -mx - 0.9, max: mx + 0.9, border: { display: false }, ticks: { display: false },
              grid: { color: function (ctx) { return ctx.tick && ctx.tick.value === 0 ? C.zero : "transparent"; }, lineWidth: function (ctx) { return ctx.tick && ctx.tick.value === 0 ? 1.5 : 0; } } },
            y: { grid: { display: false }, border: { display: false }, ticks: { color: C.encre, font: { weight: "700", size: 13 } } }
          },
          plugins: {
            legend: { display: false },
            tooltip: infobulle(C, {
              title: function (it) { return S[it[0].dataIndex].nom; },
              label: function (it) { return lignes(details[S[it.dataIndex].id] || "", 40); }
            })
          }
        },
        plugins: [etiquettes(function (chart, c) {
          var X = chart.scales.x, x0 = X.getPixelForValue(0), meta = chart.getDatasetMeta(0);
          texte(c, "perdus", x0 - 8, chart.chartArea.top - 11, "right", C.encre2, "600 12px " + POLICE_CHIFFRES);
          texte(c, "gagnés", x0 + 8, chart.chartArea.top - 11, "left", C.encre2, "600 12px " + POLICE_CHIFFRES);
          meta.data.forEach(function (b, i) {
            var v = S[i].sg;
            if (v == null) { texte(c, "non mesuré", x0 + 8, b.y, "left", C.encre2, "400 13px Atkinson Hyperlegible, sans-serif"); return; }
            texte(c, signe(v), v >= 0 ? b.x + 6 : b.x - 6, b.y, v >= 0 ? "left" : "right", C.encre);
          });
        })]
      };
    }, JSON.stringify([r.cible, S.map(function (s) { return s.sg; })]));
  }

  /* ---------- Score moyen trou par trou sur un parcours ---------- */
  function grapheTrous(an) {
    var T = an.trous, noirs = {};
    an.noirs.forEach(function (x) { noirs[x.h] = true; });
    var vals = T.filter(function (x) { return x.moy != null; }).map(function (x) { return x.moy; });
    var mx = Math.max(1, Math.ceil(Math.max.apply(null, vals) + 0.4)), mn = Math.min(0, Math.floor(Math.min.apply(null, vals)));
    var resume = "Score moyen de chaque trou par rapport au par : " + T.filter(function (x) { return x.moy != null; }).map(function (x) { return "trou " + (x.h + 1) + " " + signe(x.moy); }).join(", ") + ".";
    return grapheHTML("trous-" + an.trous.length + "-" + an.n, 230, resume, function (C) {
      return {
        type: "bar",
        data: { labels: T.map(function (x) { return String(x.h + 1); }), datasets: [{
          data: T.map(function (x) { return x.moy == null ? null : Math.round(x.moy * 10) / 10; }),
          backgroundColor: T.map(function (x) { return noirs[x.h] ? C.moins : C.neutre; }),
          borderRadius: 4, borderSkipped: "start", categoryPercentage: 0.8, barPercentage: 0.8
        }] },
        options: {
          layout: { padding: { top: 18 } },
          scales: {
            y: { min: mn, max: mx, border: { display: false },
              ticks: { color: C.encre2, stepSize: mx - mn > 5 ? 2 : 1, callback: function (v) { return v === 0 ? "par" : (v > 0 ? "+" : "−") + Math.abs(v); } },
              grid: { color: function (ctx) { return ctx.tick && ctx.tick.value === 0 ? C.zero : C.filet; } } },
            x: { grid: { display: false }, border: { display: false },
              ticks: { autoSkip: false, maxRotation: 0, color: function (ctx) { return noirs[ctx.index] ? C.encre : C.encre2; },
                font: function (ctx) { return { family: POLICE_CHIFFRES, size: 13, weight: noirs[ctx.index] ? "700" : "600" }; } } }
          },
          plugins: {
            legend: { display: false },
            tooltip: infobulle(C, {
              title: function (it) { var x = T[it[0].dataIndex]; return "Trou " + (x.h + 1) + (x.par ? " · par " + x.par : "") + (noirs[x.h] ? " · trou noir" : ""); },
              label: function (it) {
                var x = T[it.dataIndex];
                return [(Math.abs(x.moy) < 0.05 ? "Dans le par" : signe(x.moy)) + " en moyenne sur " + pluriel(x.N, "passage"),
                  "Départs jouables : " + x.J + " sur " + x.n, "Greens touchés : " + x.G + " sur " + x.n, nb1(x.putts) + " putts · " + nb1(x.pen) + " pénalité par passage"];
              }
            })
          }
        },
        plugins: [etiquettes(function (chart, c) {
          chart.getDatasetMeta(0).data.forEach(function (b, i) { if (noirs[T[i].h] && T[i].moy != null) texte(c, signe(T[i].moy), b.x, b.y - 10, "center", C.encre, "700 14px " + POLICE_CHIFFRES); });
        })]
      };
    }, JSON.stringify(T.map(function (x) { return x.moy == null ? null : Math.round(x.moy * 10); })));
  }

  /* ---------- Évolution d'un score (exercice noté, défi) face à son repère ---------- */
  function courbe(vals, rep, libelles, cle) {
    var resume = "Évolution de tes scores : " + vals.join(", ") + ". Repère : " + rep + ".";
    var haut = Math.max(rep, Math.max.apply(null, vals));
    return grapheHTML("courbe-" + cle, 170, resume, function (C) {
      return {
        type: "line",
        data: { labels: libelles, datasets: [
          { label: "Score", data: vals, borderColor: C.plus, borderWidth: 2.5, tension: 0.3, fill: "origin", backgroundColor: alpha(C.plus, 0.1),
            pointRadius: vals.map(function (v, i) { return i === vals.length - 1 ? 5.5 : 4; }), pointHoverRadius: 7, pointBackgroundColor: C.plus, pointBorderColor: C.carte, pointBorderWidth: 2 },
          { label: "Repère", data: vals.map(function () { return rep; }), borderColor: C.encre2, borderWidth: 1.5, borderDash: [5, 4], pointRadius: 0, pointHoverRadius: 0, fill: false }
        ] },
        options: {
          layout: { padding: { top: 6, right: 6 } },
          interaction: { mode: "index", intersect: false },
          scales: {
            y: { min: 0, suggestedMax: haut + 1, border: { display: false }, grid: { color: C.filet }, ticks: { color: C.encre2, precision: 0, maxTicksLimit: 5 } },
            x: { grid: { display: false }, border: { display: false }, ticks: { color: C.encre2, maxRotation: 0, autoSkipPadding: 12 } }
          },
          plugins: {
            legend: { display: false },
            tooltip: infobulle(C, { label: function (it) { return it.datasetIndex === 0 ? "Score : " + it.parsed.y : "Repère : " + rep; } })
          }
        },
        plugins: [etiquettes(function (chart, c) {
          var y = chart.scales.y.getPixelForValue(rep);
          texte(c, "repère " + rep, chart.chartArea.left + 4, y - 9, "left", C.encre2, "600 12px " + POLICE_CHIFFRES);
        })]
      };
    }, JSON.stringify([vals, rep]));
  }
