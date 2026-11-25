  /* ============================================================
     PARCOURS : pars, score moyen trou par trou, trous noirs et plan de jeu
     ============================================================ */
  function parTotal(pc) { return pc.pars.every(function (v) { return v > 0; }) ? somme(pc.pars) : null; }
  function resumeParcours(pc, an) {
    var par = parTotal(pc), l = [pc.pars.length + " trous"];
    if (par) l.push("par " + par);
    l.push(an.n ? pluriel(an.n, "partie") : "aucune partie");
    return l.join(" · ");
  }

  /* Liste des parcours, dans le carnet. */
  function parcoursListeHTML() {
    if (!etat.parcours.length) return "";
    var h = '<section class="bloc" id="c-parcours"><h2>Mes parcours</h2><ul class="liste-exos">';
    etat.parcours.forEach(function (pc) {
      var an = analyseParcours(partiesAnalyse(), pc);
      var pire = pireTrouLib(an);
      var sous = resumeParcours(pc, an) + (pire ? " · " + pire : an.noirs.length ? " · " + pluriel(an.noirs.length, "trou") + " noir" + (an.noirs.length > 1 ? "s" : "") : "");
      h += '<li><button class="ligne" type="button" data-a="pc-ouvrir" data-id="' + pc.id + '"><span class="quoi"><b>' + t(pc.nom) + '</b><small>' + t(sous) + '</small></span><span class="chev" aria-hidden="true">›</span></button></li>';
    });
    return h + '</ul>' + comment('<p>Touche un parcours pour voir ton score moyen trou par trou et corriger ses pars. À partir de deux parties, l’appli repère les trous qui te coûtent le plus, tes trous noirs, et propose un plan de jeu pour chacun.</p>') + '</section>';
  }

  /* Plan de jeu d'un trou noir : ce que disent les chiffres, quoi faire, et une mission liée. */
  function exoPour(ids) {
    var pal = palierDe(indexNiveau(etat.profil));
    return ids.filter(function (id) { var e = a(EX, id) ? EX[id] : null; return e && e.niv[0] <= pal && pal <= e.niv[1]; })[0] || null;
  }
  function planTrou(x) {
    var pal = palierDe(indexNiveau(etat.profil)), constats = [], conseils = [], exo = null;
    var cote = coteDominant(x.cotes, 2), bord = cote === 1 ? "droit" : "gauche";
    /* Les conseils suivent l'ordre du jeu : le départ, puis le chemin vers le green, puis le green. */
    var ordre = { penal: 0, depart: 0, par3: 0, long: 1, autour: 2, putts: 3, general: 4 };
    x.causes.slice().sort(function (a1, b1) { return ordre[a1.id] - ordre[b1.id]; }).forEach(function (c) {
      if (c.id === "penal") {
        constats.push(nb1(x.pen) + " coup" + (x.pen >= 2 ? "s" : "") + " de pénalité par passage en moyenne.");
        conseils.push("Au départ, prends le club que tu mets en jeu 7 fois sur 10, même s'il est plus court." +
          (cote === 1 || cote === 3 ? " Tes ratés partent à " + (cote === 1 ? "gauche" : "droite") + " sur ce trou : vise le bord " + bord + " du fairway."
            : " Repère d'où viennent tes pénalités sur ce trou et vise à l'opposé du danger."));
        exo = exo || exoPour(["st_cible_large", "st_remise"]);
      } else if (c.id === "depart") {
        constats.push("Mise en jeu jouable " + x.J + " fois sur " + x.n + ".");
        var usuel = 0;
        [1, 2, 3, 4].forEach(function (k) { if (x.clubs[k][0] >= 2 && (!usuel || x.clubs[k][0] > x.clubs[usuel][0])) usuel = k; });
        conseils.push((usuel && usuel < 4 && x.clubs[usuel][1] / x.clubs[usuel][0] <= 0.5
          ? "Avec " + (usuel === 3 ? "l'hybride" : "le " + CLUBS_DEPART[usuel].toLowerCase()) + ", " + x.clubs[usuel][1] + " mise" + (x.clubs[usuel][1] > 1 ? "s" : "") + " en jeu jouable" + (x.clubs[usuel][1] > 1 ? "s" : "") + " sur " + x.clubs[usuel][0] + " ici : joue un club plus court au départ."
          : "Change de club au départ : prends celui que tu mets en jeu 7 fois sur 10, quitte à jouer le trou un coup plus long.") +
          (cote === 2 ? " Tes ratés sont des balles courtes : swingue à 80 % et cherche le contact, pas la distance."
            : cote ? " Tes ratés partent à " + (cote === 1 ? "gauche" : "droite") + " : aligne-toi sur le bord " + bord + " du fairway." : ""));
        exo = exo || exoPour(["st_cible_large", "st_par_perso", "st_remise"]);
      } else if (c.id === "long") {
        constats.push("Il te faut en moyenne " + nb1(x.extra) + " coup" + (x.extra >= 2 ? "s" : "") + " de rattrapage pour rejoindre le green.");
        conseils.push(pal <= 2 && x.par ? "Joue-le comme un par " + (x.par + 1) + " : avance par coups faciles et garde ton club préféré pour entrer sur le green."
          : "Quand le green est hors de portée, pose la balle à ta meilleure distance de wedge au lieu de forcer un long coup.");
        exo = exo || exoPour(["st_par_perso", "st_club_plus", "st_remise"]);
      } else if (c.id === "autour") {
        constats.push("Green manqué : il te faut en moyenne " + nb1(1 + x.extra) + " coups pour y arriver.");
        conseils.push("Une fois le green manqué, joue l'approche la plus sûre : la balle sur le green d'abord, près du trou ensuite.");
        exo = exo || exoPour(["st_remise"]);
      } else if (c.id === "par3") {
        constats.push("Green touché " + x.G + " fois sur " + x.n + ".");
        conseils.push("Prends un club de plus et vise le centre du green. À côté du green, le bogey reste un bon score.");
        exo = exo || exoPour(["st_club_plus", "st_centre_green"]);
      } else if (c.id === "putts") {
        constats.push(nb1(x.putts) + " putts en moyenne.");
        conseils.push("À l'approche, vise le centre du green. Au premier putt, cherche à finir à moins d'un mètre du trou.");
        exo = exo || exoPour(["st_putts_compte"]);
      } else {
        constats.push("Aucune cause ne ressort : les coups se perdent un peu partout.");
        conseils.push("Fixe-toi un score réaliste avant de jouer ce trou. Après chaque coup raté, joue le coup le plus simple.");
        exo = exo || exoPour(["st_remise"]);
      }
    });
    return { constats: constats, conseils: conseils, exo: exo };
  }

  function trousNoirsHTML(an) {
    if (!an.assez) return '<p>Rejoue ce parcours : à partir de deux passages sur un trou, l’appli repère tes trous noirs et te propose un plan de jeu.</p>';
    if (!an.noirs.length) return '<p>' + t("Aucun trou noir : aucun trou ne te coûte un demi-coup de plus que ton trou moyen ici (" + signe(an.moyTrou) + ").") + '</p>';
    var n = an.noirs.length;
    var h = '<p>' + t((n > 1 ? "Tes " + n + " trous noirs te coûtent ensemble " : "Ton trou noir te coûte ") + nb1(an.surcout) + " coup" + (an.surcout >= 2 ? "s" : "") + " de plus que ta moyenne à chaque partie. Leur plan de jeu s'affiche aussi pendant la saisie, au départ du trou.") + '</p>';
    an.noirs.forEach(function (x) {
      var pl = planTrou(x);
      h += '<article class="noir"><header><span class="main" aria-hidden="true">' + (x.h + 1) + '</span><div><h4>' + t("Trou " + (x.h + 1) + (x.par ? " · par " + x.par : "")) + '</h4>' +
        '<p>' + t(signe(x.moy) + " en moyenne sur " + pluriel(x.N, "passage") + ", soit " + nb1(x.surcout) + " coup" + (x.surcout >= 2 ? "s" : "") + " de plus que ton trou moyen.") + '</p></div></header>' +
        '<ul class="constats">' + pl.constats.map(function (c) { return '<li class="alerte">' + t(c) + '</li>'; }).join("") + '</ul>' +
        '<div class="plan-jeu"><b>Plan de jeu</b>' + pl.conseils.map(function (c) { return '<p>' + t(c) + '</p>'; }).join("") + '</div>' +
        (pl.exo ? '<div class="exos-lies"><button class="puce" type="button" data-a="exo" data-id="' + pl.exo + '">' + L("Mission : " + EX[pl.exo].t.toLowerCase()) + '</button></div>' : '') + '</article>';
    });
    return h;
  }

  function parsHTML(pc) {
    var h = '<div class="defile"><table class="carte-score pars"><tbody>';
    for (var d = 0; d < pc.pars.length; d += 9) {
      h += '<tr><th scope="row">Trou</th>' + pc.pars.slice(d, d + 9).map(function (v, i) { return '<td class="num rep">' + (d + i + 1) + '</td>'; }).join("") + '</tr>' +
        '<tr><th scope="row">Par</th>' + pc.pars.slice(d, d + 9).map(function (v, i) {
          return '<td class="num"><button type="button" data-a="pc-par" data-v="' + (d + i) + '" aria-label="' + at("Trou " + (d + i + 1) + ", par " + (v || "non renseigné") + ". Toucher pour changer") + '"><span class="main">' + (v || "–") + '</span></button></td>';
        }).join("") + '</tr>' +
        (pc.hcp ? '<tr><th scope="row">Hcp</th>' + pc.pars.slice(d, d + 9).map(function (v, i) { return '<td class="num rep">' + (pc.hcp[d + i] || "–") + '</td>'; }).join("") + '</tr>' : '');
    }
    return h + '</tbody></table></div><p class="aide">Touche un par pour le changer. Les parties déjà jouées sur ce parcours suivent.</p>';
  }

  /* ---------- Carte de score du parcours : pars, handicap des trous, repères ---------- */
  function libRep(r, i) { return r.n || (i ? "Repère " + (i + 1) : "Mes repères"); }
  function coupsRecusLib(pc, rep) {
    var p = etat.profil; if (!p || p.sansIndex || !nombre(p.index)) return "";
    var hj = handicapJeu(p.index, rep, pc, 18);
    return hj ? "Avec ton index de " + indexLib(p.index) + ", tu reçois " + pluriel(hj.v, "coup") + " sur 18 trous" + (hj.exact ? "" : " (approximatif : il manque le SSS, le slope ou un par)") + "." : "";
  }
  function carteScoreParcoursHTML(pc) {
    var reps = pc.reps || [], n = pc.pars.length, F = ui.pcCarte && ui.pcCarte.id === pc.id ? ui.pcCarte : {};
    var h = '<h3 class="titre-bloc">Carte de score</h3>' + parsHTML(pc);
    if (reps.length) h += '<ul class="liste-reps">' + reps.map(function (r, i) {
      return '<li><b>' + t(libRep(r, i)) + '</b><span>' + t("SSS " + (r.sss == null ? "–" : indexLib(r.sss)) + " · slope " + (r.slope || "–")) + '</span><small>' + t(coupsRecusLib(pc, r).replace(/^Avec ton index de [^,]+, tu reçois /, "").replace(/ sur 18 trous.*$/, " reçus")) + '</small></li>';
    }).join("") + '</ul>';
    var lib = coupsRecusLib(pc, reps[0]);
    h += '<p class="aide">' + t(lib ? lib + (pc.hcp ? "" : " Ajoute le handicap des trous pour savoir sur quels trous.") : "Ajoute le SSS et le slope de tes repères : l'appli calcule tes coups reçus, ton score net et tes points Stableford.") + '</p>';
    /* Saisie à la main */
    h += '<details' + (F.ouvert === "main" ? " open" : "") + '><summary>Modifier les repères et le handicap des trous</summary><form data-f="pc-carte" data-id="' + pc.id + '" novalidate>';
    var lignes = reps.slice(); while (lignes.length < Math.min(8, reps.length + 1)) lignes.push({ n: "", sss: null, slope: null });
    lignes.forEach(function (r, i) {
      h += '<fieldset class="champ rep-ligne"><legend>' + t(i < reps.length ? libRep(r, i) : "Nouveau repère") + '</legend><div class="trio">' +
        '<div class="champ"><label for="rp-n' + i + '">Nom</label><input id="rp-n' + i + '" type="text" maxlength="30" autocomplete="off" placeholder="Jaune" value="' + at(r.n || "") + '"></div>' +
        '<div class="champ"><label for="rp-s' + i + '">SSS</label><input id="rp-s' + i + '" type="text" inputmode="decimal" maxlength="5" autocomplete="off" value="' + (r.sss == null ? "" : indexLib(r.sss)) + '"></div>' +
        '<div class="champ"><label for="rp-l' + i + '">Slope</label><input id="rp-l' + i + '" type="text" inputmode="numeric" maxlength="3" autocomplete="off" value="' + (r.slope == null ? "" : r.slope) + '"></div></div></fieldset>';
    });
    h += '<p class="aide">' + t("Le SSS et le slope sont sur la carte de score du club, pour chaque couleur de départ (Messieurs ou Dames)." + (n === 9 ? " Donne les valeurs pour 18 trous, comme sur la carte." : "") + " Vide une ligne pour retirer un repère.") + '</p>' +
      '<div class="champ"><label for="pc-hcp">Handicap des trous, du trou 1 au trou ' + n + '</label><input id="pc-hcp" type="text" inputmode="numeric" autocomplete="off" maxlength="60" placeholder="' + (n === 18 ? "12 2 18 16 6 14 10 8 4 9 11 1 17 5 15 3 13 7" : "5 9 1 3 7 2 8 4 6") + '" value="' + (pc.hcp ? pc.hcp.join(" ") : "") + '"></div>' +
      '<p class="aide">' + t("La ligne « Hcp » ou « Coups reçus » de la carte : le trou 1 reçoit le premier coup.") + '</p>' +
      '<p class="erreur" id="pc-carte-err" role="alert" hidden></p><button class="btn large" type="submit">Enregistrer</button></form></details>';
    /* Collage de la carte de score */
    h += '<details' + (F.ouvert === "coller" ? " open" : "") + '><summary>Coller la carte de score</summary><form data-f="pc-coller" data-id="' + pc.id + '" novalidate>' +
      '<label for="pc-texte">Texte de la carte de score</label><textarea id="pc-texte" rows="6" maxlength="6000" placeholder="' + at("Jaune 69,4 126 75,2 134\nPar 4 3 5 4 4 3 4 5 4 …\nHcp 12 2 18 16 6 14 10 8 4 …") + '">' + t(F.texte || "") + '</textarea>' +
      '<p class="aide">' + t("Copie le tableau depuis le site du club ou de la fédération, puis colle-le ici. L'appli y cherche les repères (SSS et slope), les pars et le handicap des trous.") + '</p>' +
      '<button class="btn large" type="submit">Lire la carte</button></form>';
    if (F.lu) {
      var L = F.lu, rien = !L.reps.length && !L.pars && !L.hcp;
      h += rien ? '<p class="erreur" role="alert">' + t("Rien de lisible : vérifie qu'une ligne commence par une couleur (« Jaune 69,4 126 »), par « Par » ou par « Hcp ».") + '</p>'
        : '<div class="pc-lu" role="status"><p><b>Trouvé :</b></p><ul>' +
          (L.reps.length ? '<li>' + t(pluriel(L.reps.length, "repère") + " : " + L.reps.map(function (r) { return r.n + " (" + indexLib(r.sss) + " / " + r.slope + ")"; }).join(", ")) + '</li>' : '') +
          (L.pars ? '<li>' + t("Pars : " + L.pars.join(" ")) + '</li>' : '') + (L.hcp ? '<li>' + t("Handicap des trous : " + L.hcp.join(" ")) + '</li>' : '') +
          '</ul><button class="btn principal large" type="button" data-a="pc-coller-ok">Utiliser ces valeurs</button></div>';
    }
    return h + '</details>';
  }
  FORMULAIRES["pc-carte"] = function (form) {
    var pc = parcoursDe(form.getAttribute("data-id")), err = document.getElementById("pc-carte-err"); if (!pc) return;
    var reps = [], txt = "", i = 0, el;
    while ((el = document.getElementById("rp-n" + i))) {
      var nm = texteCourt(el.value, 30), bs = document.getElementById("rp-s" + i).value.trim().replace(",", "."), bl = document.getElementById("rp-l" + i).value.trim();
      var sss = bs === "" ? null : (/^\d{2}(\.\d)?$/.test(bs) ? parseFloat(bs) : NaN), slope = bl === "" ? null : (/^\d{2,3}$/.test(bl) ? parseInt(bl, 10) : NaN);
      if (!txt && sss !== null && !(sss >= 50 && sss <= 85)) txt = "Le SSS est un nombre entre 50 et 85, par exemple 70,4.";
      if (!txt && slope !== null && !(slope >= 55 && slope <= 155)) txt = "Le slope est un nombre entier entre 55 et 155.";
      if (sss !== null || slope !== null) reps.push({ n: nm, sss: sss, slope: slope });
      i++;
    }
    var bh = document.getElementById("pc-hcp").value.trim(), hcp = bh === "" ? null : lireHcp(bh, pc.pars.length);
    if (!txt && bh !== "" && !hcp) txt = "Le handicap des trous : " + pc.pars.length + " nombres différents, de 1 à 18, séparés par des espaces.";
    if (txt) { err.textContent = txt; err.hidden = false; return; }
    pc.reps = reps.slice(0, 8); pc.hcp = hcp;
    pc.sss = reps[0] ? reps[0].sss : null; pc.slope = reps[0] ? reps[0].slope : null;
    ui.pcCarte = null;
    majIndicateursParties(); sauver(); rendre(); rendreFeuille(); messageEnregistre("Carte de score enregistrée.");
  };
  FORMULAIRES["pc-coller"] = function (form) {
    var pc = parcoursDe(form.getAttribute("data-id")); if (!pc) return;
    var tx = document.getElementById("pc-texte").value;
    ui.pcCarte = { id: pc.id, ouvert: "coller", texte: tx.slice(0, 6000), lu: lireCarteScore(tx, pc.pars.length) };
    rendreFeuille();
    var b = document.querySelector('#feuille [data-a="pc-coller-ok"]') || document.getElementById("pc-texte"); if (b) b.focus({ preventScroll: true });
  };
  ACTIONS["pc-coller-ok"] = function () {
    var F = ui.pcCarte, pc = F ? parcoursDe(F.id) : null; if (!pc || !F.lu) return;
    var L = F.lu;
    if (L.reps.length) { pc.reps = L.reps.slice(0, 8); pc.sss = pc.reps[0].sss; pc.slope = pc.reps[0].slope; }
    if (L.hcp) pc.hcp = L.hcp.slice();
    if (L.pars) {
      pc.pars = L.pars.slice();
      var suivre = function (p) { if (p && p.pc === pc.id) p.trous.forEach(function (tr, k) { if (tr) { tr[5] = pc.pars[((p.o || 0) + k) % pc.pars.length]; if (tr[5] === 3) tr[7] = 0; } }); };
      etat.parties.forEach(suivre); suivre(etat.partie);
    }
    ui.pcCarte = null;
    majIndicateursParties(); sauver(); rendre(); rendreFeuille(); rendrePartie(); messageEnregistre("Carte de score enregistrée.");
    var b = document.getElementById("f-fermer"); if (b) b.focus({ preventScroll: true });
  };

  /* ---------- Fiche du parcours (P07) : passages, scores par tracé, évolution, passages sur un trou ---------- */
  function passagesParcoursHTML(pc, F) {
    if (!F.parties) return "";
    var h = '<h3 class="titre-bloc">Tes passages</h3><p class="aide pc-passages">' + t(pluriel(F.parties, "partie") + " sur ce parcours" + (F.premiere ? (F.premiere === F.derniere ? ", le " + dateCourte(F.premiere) : ", du " + dateCourte(F.premiere) + " au " + dateCourte(F.derniere)) : "") + (F.premiere && /\.$/.test(dateCourte(F.derniere)) ? "" : ".") +
      (F.incompletes ? " " + pluriel(F.incompletes, "partie") + " sans score sur chaque trou : comptée" + (F.incompletes > 1 ? "s" : "") + " dans les passages, pas dans les scores." : "")) + '</p>';
    h += '<div class="defile"><table class="carte-score traces"><thead><tr><th scope="col">Tracé</th><th scope="col" class="num">Parties</th><th scope="col" class="num">Moyenne</th><th scope="col" class="num">Meilleur</th></tr></thead><tbody>' +
      F.traces.map(function (T) {
        return '<tr><th scope="row">' + t(T.lib) + '</th><td class="num">' + T.parties + (T.n < T.parties ? '<small>' + t(T.n + " avec score") + '</small>' : '') + '</td>' +
          '<td class="num">' + (T.n ? t(String(Math.round(T.moyenneScore))) + '<small>' + t(Math.abs(T.moyenne) < 0.05 ? "par" : signe(T.moyenne)) + '</small>' : "–") + '</td>' +
          '<td class="num">' + (T.meilleur ? t(String(T.meilleur.score)) + '<small>' + t(ecartLib(T.meilleur.ecart) + " · " + dateCourte(T.meilleur.d)) + '</small>' : "–") + '</td></tr>';
      }).join("") + '</tbody></table></div><p class="aide">' + t("Score brut ; en dessous, l'écart au par. L'aller, le retour et le parcours complet sont comptés à part ; l'évolution est dans le graphique.") + '</p>';
    var T0 = F.traces.filter(function (T) { return T.n >= 2; })[0];
    if (T0) {
      h += grapheScoresHTML(T0.scores.map(function (x) { return { d: x.d, id: x.id, ecart: x.ecart, ecart18: x.ecart, score: x.score, trous: T0.trous }; }), "Écart au par de chaque partie, " + T0.lib.charAt(0).toLowerCase() + T0.lib.slice(1));
      if (T0.tendance) h += '<p class="pc-tendance">' + t("Tendance (" + T0.lib.toLowerCase() + ") : " + signe(T0.tendance.avant) + " sur tes " + T0.tendance.n + " premières parties, " + signe(T0.tendance.apres) + " sur les " + T0.tendance.n + " dernières" + (Math.abs(T0.tendance.d) < 1 ? ", à peu près stable." : T0.tendance.d < 0 ? " : tu progresses." : " : en recul.")) + '</p>';
    }
    return h;
  }
  function departLib(x) {
    if (x.par < 4) return "–";
    if (!x.mej) return "non noté";
    return x.mej.j ? "jouable" : ["raté", "raté à gauche", "court", "raté à droite"][x.mej.cote || 0];
  }
  function coupsPassageLib(l) {
    return l.map(function (c) { return nomClub(c.c) + (c.d != null ? " " + Math.round(c.d) + " m" + (c.gps ? " GPS" : "") : ""); }).join(" → ");
  }
  function trouParcoursHTML(pc, h) {
    var P = passagesTrou(partiesAnalyse(), pc, h), R = bilanPassages(P), l = P.passages;
    var s = '<div class="pc-trou" id="pc-trou-detail"><h4>' + t("Trou " + (h + 1) + (pc.pars[h] ? " · par " + pc.pars[h] : "") + " · " + pluriel(R.n, "passage")) + '</h4>';
    if (!R.n) return s + '<p class="aide">' + t(P.sansScore ? "Joué sans score : pas encore de passage à comparer." : "Pas encore joué.") + '</p></div>';
    var bouts = ["moyenne " + signe(R.moyenne), "meilleur " + ecartLib(R.meilleur), "pire " + ecartLib(R.pire), nb1(R.putts) + " putts par passage"];
    if (R.doubles) bouts.push(R.doubles + (R.doubles > 1 ? " doubles bogeys" : " double bogey") + " ou pire");
    if (R.troisPutts) bouts.push(R.troisPutts + " trois-putts");
    if (R.avecPenalite) bouts.push("pénalité sur " + pluriel(R.avecPenalite, "passage"));
    if (P.par >= 4) bouts.push(R.mej.n ? "départ jouable " + R.mej.jouables + " fois sur " + R.mej.n + (R.mej.ratees ? " (" + [R.mej.gauche ? R.mej.gauche + " à gauche" : "", R.mej.droite ? R.mej.droite + " à droite" : "", R.mej.courtes ? R.mej.courtes + " court" + (R.mej.courtes > 1 ? "s" : "") : ""].filter(Boolean).join(", ") + ")" : "") : "mises en jeu non notées");
    s += '<p class="pc-trou-resume">' + t(bouts.join(" · ") + ".") + '</p>';
    s += '<div class="defile"><table class="carte-score passages"><thead><tr><th scope="col">Passage</th><th scope="col" class="num">Score</th><th scope="col">Départ</th><th scope="col" class="num">Putts</th><th scope="col" class="num">Pén.</th></tr></thead><tbody>' +
      l.slice().reverse().map(function (x) {
        return '<tr' + (x.coups.length ? ' class="avec-coups"' : '') + '><th scope="row">' + t(dateCourte(x.jour) + (x.tour > 1 ? " · 2e tour" : "")) + '</th>' +
          '<td class="num"><b>' + x.score + '</b><small>' + t(ecartLib(x.ecart)) + '</small></td><td>' + t(departLib(x)) + '</td><td class="num">' + x.putts + '</td><td class="num">' + (x.pen || "–") + '</td></tr>' +
          (x.coups.length ? '<tr class="coups-passage"><td colspan="5">' + t("Coups : " + coupsPassageLib(x.coups)) + '</td></tr>' : '');
      }).join("") + '</tbody></table></div>' +
      '<p class="aide">' + t("Du plus récent au plus ancien." + (P.sansScore ? " " + pluriel(P.sansScore, "passage") + " sans score, non compté" + (P.sansScore > 1 ? "s" : "") + "." : "") + " Les distances affichées sont seulement celles mesurées ; aucune trajectoire n'est reconstituée.") + '</p>';
    return s + '</div>';
  }
  function trousParcoursHTML(pc, an) {
    if (!an.N) return "";
    var sel = ui.pcTrou && ui.pcTrou.id === pc.id ? ui.pcTrou.h : null;
    var h = '<h3 class="titre-bloc">Compare tes passages sur un trou</h3><div class="trous-choix" role="group" aria-label="Trou">' +
      an.trous.map(function (x) {
        return '<button class="opt" type="button" data-a="pc-trou" data-v="' + x.h + '" aria-pressed="' + (x.h === sel) + '"' + (x.N ? "" : " disabled") + ' aria-label="' + at("Trou " + (x.h + 1) + (x.N ? ", " + pluriel(x.N, "passage") : ", pas encore joué")) + '">' + (x.h + 1) + '</button>';
      }).join("") + '</div>';
    return h + (sel != null ? trouParcoursHTML(pc, sel) : '<p class="aide">' + t("Touche un trou pour voir chaque passage : score, départ, putts, pénalités et clubs joués.") + '</p>');
  }
  ACTIONS["pc-trou"] = function (el) {
    var f = ui.feuille; if (!f || !f.parcours) return;
    var h = +el.getAttribute("data-v");
    ui.pcTrou = ui.pcTrou && ui.pcTrou.id === f.parcours && ui.pcTrou.h === h ? null : { id: f.parcours, h: h };
    var feuille = document.getElementById("feuille"), y = feuille ? feuille.scrollTop : 0;
    rendreFeuille();
    feuille = document.getElementById("feuille"); if (feuille) feuille.scrollTop = y;
    var b = document.querySelector('#feuille [data-a="pc-trou"][data-v="' + h + '"]'); if (b) b.focus({ preventScroll: true });
  };

  /* Fiche d'un parcours, dans le calque des fiches. */
  function parcoursHTML(id) {
    var pc = parcoursDe(id), an = analyseParcours(partiesAnalyse(), pc), F = ficheParcours(partiesAnalyse(), pc);
    var h = '<button class="voile" type="button" data-a="fermer-feuille" aria-label="Fermer le parcours" tabindex="-1"></button>' +
      '<section class="feuille" role="dialog" aria-modal="true" aria-labelledby="f-titre" id="feuille">' +
      '<header><p class="surtitre">' + t("Parcours · " + resumeParcours(pc, an)) + '</p><h2 id="f-titre">' + t(pc.nom) + '</h2>' +
      '<button class="fermer" type="button" data-a="fermer-feuille" id="f-fermer">Fermer</button></header>';
    h += passagesParcoursHTML(pc, F);
    if (an.N) {
      h += '<h3 class="titre-bloc">Ton score trou par trou</h3>' + grapheTrous(an) +
        '<p class="legende"><span><svg class="cle large" viewBox="0 0 24 14" aria-hidden="true"><rect class="g-moins" x="1" y="1" width="22" height="12" rx="3"/></svg> trou noir</span>' +
        '<span>' + t("Moyenne par trou : " + signe(an.moyTrou) + " sur " + pluriel(an.n, "partie")) + '</span></p>' +
        topFlopHTML(an) +
        '<h3 class="titre-bloc">Tes trous noirs</h3>' + trousNoirsHTML(an) + trousParcoursHTML(pc, an);
    } else {
      h += '<p>Joue une partie sur ce parcours : l’appli tracera ton score moyen trou par trou.</p>';
    }
    h += carteBlocParcours(pc) + carteScoreParcoursHTML(pc);
    if (an.N) {
      h += '<details><summary>Tes chiffres trou par trou</summary><div class="defile"><table class="carte-score trous"><thead><tr><th scope="col">Trou</th><th scope="col" class="num">Par</th><th scope="col" class="num">Score</th>' +
        '<th scope="col" class="num">Pass.</th><th scope="col" class="num">Dép.</th><th scope="col" class="num">Green</th><th scope="col" class="num">Putts</th><th scope="col" class="num">Pén.</th></tr></thead><tbody>' +
        an.trous.map(function (x) {
          return '<tr><th scope="row">' + (x.h + 1) + '</th><td class="num rep">' + (x.par || "–") + '</td><td class="num">' + (x.moy == null ? "–" : signe(x.moy)) + '</td>' +
            (x.N ? '<td class="num">' + x.N + '</td><td class="num">' + (x.par >= 4 && x.M ? x.J + "/" + x.M : "–") + '</td><td class="num">' + x.G + "/" + x.N + '</td><td class="num">' + nb1(x.putts) + '</td><td class="num">' + nb1(x.pen) + '</td>' : '<td class="num" colspan="5">' + (x.n ? "joué sans score" : "pas encore joué") + '</td>') + '</tr>';
        }).join("") + '</tbody></table></div><p class="aide" style="margin-top:8px">Passages : trous joués avec un score. Score : moyenne par rapport au par. Départs : mises en jeu jouables sur celles renseignées (par 4 et 5). Greens : en régulation, sur les passages. Putts et pénalités : moyenne par passage.</p></details>';
    }
    h += '<details><summary>Nom du parcours</summary><form data-f="pc-infos" data-id="' + pc.id + '" novalidate>' +
      '<div class="champ"><label for="pc-nom">Nom du parcours</label><input id="pc-nom" type="text" maxlength="40" autocomplete="off" value="' + at(pc.nom) + '"></div>' +
      '<p class="erreur" id="pc-err" role="alert" hidden></p><button class="btn large" type="submit">Enregistrer</button></form></details>';
    return h + '<p style="margin-top:16px"><button class="btn danger large" type="button" data-a="pc-suppr" data-v="' + pc.id + '">Supprimer ce parcours</button></p></section>';
  }

  ACTIONS["pc-ouvrir"] = function (el) {
    var id = el.getAttribute("data-id"); if (!parcoursDe(id)) return;
    ui.retourFocus = el; ui.pcCarte = null; ui.pcTrou = null;
    ui.feuille = { parcours: id };
    rendreFeuille();
    var b = document.getElementById("f-fermer"); if (b) b.focus();
  };
  /* Change le par d'un trou : 3, 4, 5, puis de nouveau 3. Les parties du parcours suivent. */
  ACTIONS["pc-par"] = function (el) {
    var pc = ui.feuille ? parcoursDe(ui.feuille.parcours) : null, h = parseInt(el.getAttribute("data-v"), 10);
    if (!pc || !(h >= 0 && h < pc.pars.length)) return;
    var par = pc.pars[h] >= 3 && pc.pars[h] < 5 ? pc.pars[h] + 1 : 3;
    pc.pars[h] = par;
    function suivre(p) {
      if (!p || p.pc !== pc.id) return;
      p.trous.forEach(function (tr, k) {
        if (!tr || !tr[5] || ((p.o || 0) + k) % pc.pars.length !== h) return;
        tr[5] = par; if (par === 3) tr[7] = 0;
      });
    }
    etat.parties.forEach(suivre); suivre(etat.partie);
    majIndicateursParties(); sauver(); rendreFeuille();
    var b = document.querySelector('#feuille [data-a="pc-par"][data-v="' + h + '"]'); if (b) b.focus({ preventScroll: true });
  };
  FORMULAIRES["pc-infos"] = function (form) {
    var pc = parcoursDe(form.getAttribute("data-id")), err = document.getElementById("pc-err"); if (!pc) return;
    var nom = texteCourt(document.getElementById("pc-nom").value, 40);
    if (!nom) { err.textContent = "Donne un nom au parcours."; err.hidden = false; return; }
    pc.nom = nom;
    sauver(); rendre(); rendreFeuille(); messageEnregistre("Parcours enregistré.");
  };
  ACTIONS["pc-suppr"] = function (el) {
    var pc = parcoursDe(el.getAttribute("data-v")); if (!pc) return;
    ui.aSupprimer = pc.id;
    dialogue({ titre: "Supprimer ce parcours ?", corps: '<p>' + t("Les parties jouées sur " + pc.nom + " sont conservées dans tes statistiques, mais elles ne seront plus rattachées à un parcours. Ses trous noirs disparaissent.") + '</p>',
      boutons: [{ l: "Annuler", a: "fermer-dialogue" }, { l: "Supprimer", a: "pc-ok-suppr", c: "danger" }] });
  };
  ACTIONS["pc-ok-suppr"] = function () {
    var id = ui.aSupprimer; ui.aSupprimer = null;
    if (parcoursDe(id)) {
      etat.parcours = etat.parcours.filter(function (x) { return x.id !== id; });
      retirerCarte(id);
      etat.parties.forEach(function (p) { if (p.pc === id) { p.pc = null; p.o = 0; } });
      if (etat.partie && etat.partie.pc === id) { etat.partie.pc = null; etat.partie.o = 0; }
      sauver();
    }
    ui.dialogue = null; ui.feuille = null; ui.retourFocus = null;
    rendreDialogue(); rendreFeuille(); rendre(); rendrePartie();
  };
