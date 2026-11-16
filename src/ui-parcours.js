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
      var an = analyseParcours(etat.parties, pc);
      var pire = pireTrouLib(an);
      var sous = resumeParcours(pc, an) + (pire ? " · " + pire : an.noirs.length ? " · " + pluriel(an.noirs.length, "trou") + " noir" + (an.noirs.length > 1 ? "s" : "") : "");
      h += '<li><button class="ligne" type="button" data-a="pc-ouvrir" data-id="' + pc.id + '"><span class="quoi"><b>' + t(pc.nom) + '</b><small>' + t(sous) + '</small></span><span class="chev" aria-hidden="true">›</span></button></li>';
    });
    return h + '</ul>' + comment('<p>Touche un parcours pour voir ton score moyen trou par trou et corriger ses pars. À partir de deux parties, l’appli repère les trous qui te coûtent le plus, tes trous noirs, et propose un plan de jeu pour chacun.</p>') + '</section>';
  }

  /* Plan de jeu d'un trou noir : ce que disent les chiffres, quoi faire, et une mission liée. */
  function exoPour(ids) {
    var pal = palierDe(etat.profil.index);
    return ids.filter(function (id) { var e = a(EX, id) ? EX[id] : null; return e && e.niv[0] <= pal && pal <= e.niv[1]; })[0] || null;
  }
  function planTrou(x) {
    var pal = palierDe(etat.profil.index), constats = [], conseils = [], exo = null;
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
        }).join("") + '</tr>';
    }
    return h + '</tbody></table></div><p class="aide">Touche un par pour le changer. Les parties déjà jouées sur ce parcours suivent.</p>';
  }

  /* Fiche d'un parcours, dans le calque des fiches. */
  function parcoursHTML(id) {
    var pc = parcoursDe(id), an = analyseParcours(etat.parties, pc);
    var h = '<button class="voile" type="button" data-a="fermer-feuille" aria-label="Fermer le parcours" tabindex="-1"></button>' +
      '<section class="feuille" role="dialog" aria-modal="true" aria-labelledby="f-titre" id="feuille">' +
      '<header><p class="surtitre">' + t("Parcours · " + resumeParcours(pc, an)) + '</p><h2 id="f-titre">' + t(pc.nom) + '</h2>' +
      '<button class="fermer" type="button" data-a="fermer-feuille" id="f-fermer">Fermer</button></header>';
    if (an.N) {
      h += '<h3 class="titre-bloc">Ton score trou par trou</h3>' + grapheTrous(an) +
        '<p class="legende"><span><svg class="cle large" viewBox="0 0 24 14" aria-hidden="true"><rect class="g-moins" x="1" y="1" width="22" height="12" rx="3"/></svg> trou noir</span>' +
        '<span>' + t("Moyenne par trou : " + signe(an.moyTrou) + " sur " + pluriel(an.n, "partie")) + '</span></p>' +
        topFlopHTML(an) +
        '<h3 class="titre-bloc">Tes trous noirs</h3>' + trousNoirsHTML(an);
    } else {
      h += '<p>Joue une partie sur ce parcours : l’appli tracera ton score moyen trou par trou.</p>';
    }
    h += carteBlocParcours(pc) + '<h3 class="titre-bloc">Les pars</h3>' + parsHTML(pc);
    if (an.N) {
      h += '<details><summary>Tes chiffres trou par trou</summary><div class="defile"><table class="carte-score trous"><thead><tr><th scope="col">Trou</th><th scope="col" class="num">Par</th><th scope="col" class="num">Score</th>' +
        '<th scope="col" class="num">Dép.</th><th scope="col" class="num">Green</th><th scope="col" class="num">Putts</th><th scope="col" class="num">Pén.</th></tr></thead><tbody>' +
        an.trous.map(function (x) {
          return '<tr><th scope="row">' + (x.h + 1) + '</th><td class="num rep">' + (x.par || "–") + '</td><td class="num">' + (x.moy == null ? "–" : signe(x.moy)) + '</td>' +
            (x.n ? '<td class="num">' + x.J + "/" + x.n + '</td><td class="num">' + x.G + "/" + x.n + '</td><td class="num">' + nb1(x.putts) + '</td><td class="num">' + nb1(x.pen) + '</td>' : '<td class="num" colspan="4">pas encore joué</td>') + '</tr>';
        }).join("") + '</tbody></table></div><p class="aide" style="margin-top:8px">Score : moyenne par rapport au par. Départs et greens : réussites sur le nombre de passages. Putts et pénalités : moyenne par passage.</p></details>';
    }
    h += '<details><summary>Nom, SSS et slope</summary><form data-f="pc-infos" data-id="' + pc.id + '" novalidate>' +
      '<div class="champ"><label for="pc-nom">Nom du parcours</label><input id="pc-nom" type="text" maxlength="40" autocomplete="off" value="' + at(pc.nom) + '"></div>' +
      '<div class="duo"><div class="champ"><label for="pc-sss">SSS</label><input id="pc-sss" type="text" inputmode="decimal" autocomplete="off" maxlength="5" value="' + (pc.sss == null ? "" : indexLib(pc.sss)) + '"></div>' +
      '<div class="champ"><label for="pc-slope">Slope</label><input id="pc-slope" type="text" inputmode="numeric" autocomplete="off" maxlength="3" value="' + (pc.slope == null ? "" : pc.slope) + '"></div></div>' +
      '<p class="aide">Le SSS et le slope figurent sur la carte de score du club, pour tes repères de départ. Ils affinent ton index estimé. ' + (pc.pars.length === 9 ? "Donne les valeurs pour 18 trous. " : "") + 'Tu peux laisser ces deux cases vides.</p>' +
      '<p class="erreur" id="pc-err" role="alert" hidden></p><button class="btn large" type="submit">Enregistrer</button></form></details>';
    return h + '<p style="margin-top:16px"><button class="btn danger large" type="button" data-a="pc-suppr" data-v="' + pc.id + '">Supprimer ce parcours</button></p></section>';
  }

  ACTIONS["pc-ouvrir"] = function (el) {
    var id = el.getAttribute("data-id"); if (!parcoursDe(id)) return;
    ui.retourFocus = el;
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
    var bs = document.getElementById("pc-sss").value.trim().replace(",", "."), bl = document.getElementById("pc-slope").value.trim();
    var sss = bs === "" ? null : (/^\d{2}(\.\d)?$/.test(bs) ? parseFloat(bs) : NaN), slope = bl === "" ? null : (/^\d{2,3}$/.test(bl) ? parseInt(bl, 10) : NaN);
    var txt = !nom ? "Donne un nom au parcours."
      : sss !== null && !(sss >= 50 && sss <= 85) ? "Le SSS est un nombre entre 50 et 85, par exemple 70,4."
      : slope !== null && !(slope >= 55 && slope <= 155) ? "Le slope est un nombre entier entre 55 et 155." : "";
    if (txt) { err.textContent = txt; err.hidden = false; return; }
    pc.nom = nom; pc.sss = sss; pc.slope = slope;
    sauver(); rendre(); rendreFeuille(); message("Parcours enregistré.");
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
