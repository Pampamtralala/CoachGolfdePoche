  /* ============================================================
     PARTIE EN DIRECT : saisie trou par trou sur le parcours.
     Un trou : [mise en jeu jouable, green en régulation, putts, pénalités,
     score, par, côté du raté, club de départ, longueur du premier putt].
     ============================================================ */
  function parcoursDe(id) { return id ? etat.parcours.filter(function (x) { return x.id === id; })[0] || null : null; }
  /* Rang du trou sur le parcours : le retour commence au 10, un neuf trous joué deux fois repasse par le 1. */
  function trouPhysique(p, k) { var pc = parcoursDe(p.pc); return pc ? ((p.o || 0) + k) % pc.pars.length : k; }
  function numeroTrou(p, k) { return (p.o || 0) + k + 1; }
  function trouDefaut(p, k) {
    var pc = parcoursDe(p.pc), par = (pc && pc.pars[trouPhysique(p, k)]) || 4, club = 0;
    /* Le club de départ reprend celui du dernier trou long. */
    if (etat.detail && par >= 4) {
      for (var i = k - 1; i >= 0 && !club; i--) if (p.trous[i] && p.trous[i][5] >= 4) club = p.trous[i][7];
    }
    return [1, 0, 2, 0, scoreSuggere(par, 0, 2, 0), par, 0, club, 0, 0, 0];
  }
  function trouCourant() { var p = etat.partie; return p.trous[p.i] ? trouOnze(p.trous[p.i]) : trouDefaut(p, p.i); }
  function nbSaisis(p) { return p.trous.filter(Boolean).length; }
  function cibleCourante() { return indexVise(); }

  var NOMS_SCORE = { "-3": "albatros", "-2": "eagle", "-1": "birdie", "0": "par", "1": "bogey", "2": "double bogey", "3": "triple bogey" };
  function ecartLib(d) { return d > 0 ? "+" + d : d < 0 ? "−" + (-d) : "par"; }
  function nomScore(s, par) { var d = s - par; return s === 1 ? "trou en un" : a(NOMS_SCORE, String(d)) ? NOMS_SCORE[String(d)] : ecartLib(d); }
  function nomPartie(pt) { var pc = parcoursDe(pt.pc); return "Partie du " + dateCourte(pt.d) + (pc ? " · " + pc.nom : ""); }

  /* Reporte dans le profil les chiffres des dernières parties. */
  function majIndicateursParties() {
    var r = indicateursParties(partiesAnalyse());
    if (!r) return;
    Object.keys(r.vals).forEach(function (id) {
      etat.profil.indicateurs[id] = { val: Math.min(IND[id].max, r.vals[id]), src: "partie", date: r.date };
    });
  }

  /* ---------- Dans le carnet ---------- */
  function normaliserDepart() {
    var d = ui.depart, pc = d.pc === "nouveau" ? null : parcoursDe(d.pc);
    if (!pc) d.pc = "nouveau";
    var choix = (pc ? pc.pars.length : d.L) === 18 ? ["18", "aller", "retour"] : ["9", "2x9"];
    if (choix.indexOf(d.jeu) < 0) d.jeu = choix[0];
    /* Repère : le dernier joué sur ce parcours, sinon le premier. */
    var nr = pc && pc.reps ? pc.reps.length : 0;
    if (!(d.rep >= 0 && d.rep < nr)) {
      d.rep = 0;
      for (var i = etat.parties.length - 1; i >= 0; i--) if (etat.parties[i].pc === d.pc && etat.parties[i].rep >= 0 && etat.parties[i].rep < nr) { d.rep = etat.parties[i].rep; break; }
    }
  }
  function departHTML() {
    var d = ui.depart, nouveau = d.pc === "nouveau", pc = nouveau ? null : parcoursDe(d.pc), L = pc ? pc.pars.length : d.L;
    function opt(k, v, lib, cur) { return '<button class="opt" type="button" data-a="dp-set" data-k="' + k + '" data-v="' + v + '" aria-pressed="' + (String(cur) === v) + '">' + t(lib) + '</button>'; }
    var h = '<div class="depart">';
    if (etat.parcours.length) {
      h += '<div class="champ"><label for="dp-pc">Parcours</label><select id="dp-pc" data-c="dp-pc">' +
        etat.parcours.map(function (x) { return '<option value="' + x.id + '"' + (x.id === d.pc ? " selected" : "") + '>' + t(x.nom) + '</option>'; }).join("") +
        '<option value="nouveau"' + (nouveau ? " selected" : "") + '>Nouveau parcours…</option></select></div>';
    }
    if (nouveau) {
      h += '<div class="champ"><label for="dp-nom">Nom du parcours</label><input id="dp-nom" type="text" maxlength="40" autocomplete="off" data-i="dp-nom" value="' + at(d.nom) + '"></div>' +
        '<fieldset class="champ"><legend>Ce parcours compte</legend><div class="choix-ligne">' + opt("L", "18", "18 trous", L) + opt("L", "9", "9 trous", L) + '</div></fieldset>';
    }
    h += '<fieldset class="champ"><legend>Aujourd’hui, tu joues</legend><div class="choix-ligne">' +
      (L === 18 ? opt("jeu", "18", "Les 18 trous", d.jeu) + opt("jeu", "aller", "L'aller, 1 à 9", d.jeu) + opt("jeu", "retour", "Le retour, 10 à 18", d.jeu)
        : opt("jeu", "9", "9 trous", d.jeu) + opt("jeu", "2x9", "18 trous, en deux tours", d.jeu)) + '</div></fieldset>' +
      (nouveau ? '<p class="aide">Tu indiques le par de chaque trou en jouant. L’appli s’en souvient pour les parties suivantes.</p>' : '') +
      (pc && pc.reps && pc.reps.length > 1 ? '<div class="champ"><label for="dp-rep">Tes repères de départ</label><select id="dp-rep" data-c="dp-rep">' +
        pc.reps.map(function (r, i) { return '<option value="' + i + '"' + (i === d.rep ? " selected" : "") + '>' + t(r.n || "Repère " + (i + 1)) + '</option>'; }).join("") + '</select></div>' : '') +
      joueursDepartHTML() +
      '<p class="erreur" id="dp-err" role="alert" hidden></p>' +
      '<div class="ligne-btn"><button class="btn principal" type="button" data-a="pt-nouvelle">Commencer</button><button class="btn" type="button" data-a="dp-annuler">Annuler</button></div></div>';
    return h;
  }

  function indexEstimeHTML() {
    var p = etat.profil, idx = indexDeclare(p), r = indexEstime(partiesAnalyse(), function (pt) { return parcoursDe(pt.pc); }, idx);
    if (!r.n) return "";
    if (r.v == null) return '<p class="aide">' + t("Index estimé : encore " + pluriel(3 - r.n, "partie") + " avec un score à chaque trou, et l'appli pourra l'estimer.") + '</p>';
    var ecart = idx == null ? 0 : Math.round((r.v - idx) * 10) / 10;
    return '<div class="index-estime"><p><span class="surtitre">Index estimé</span><b class="main">' + indexLib(r.v) + '</b></p>' +
      (idx == null ? '' : '<p class="aide">' + t("Index déclaré : " + indexLib(idx) + "." + (Math.abs(ecart) >= 2 ? " L'écart est net : mets ton profil à jour si ton index officiel a bougé." : "")) + '</p>') +
      comment('<p>' + t("D'après " + (r.n >= 20 ? "tes 20 dernières parties" : "tes " + r.n + " parties") + " notées, en gardant " + (r.k > 1 ? "les " + r.k + " meilleures" : "la meilleure") +
        ", selon le barème du World Handicap System. Ce n'est pas ton index officiel : seule ta fédération le calcule." +
        (etat.parcours.some(function (x) { return !x.sss || !x.slope; }) ? " Ajoute le SSS et le slope de tes parcours, dans leur fiche, pour l'affiner." : "")) + '</p>', "Comment il est calculé") + '</div>';
  }

  /* UX03 : la partie en cours reste dans Jouer ; la liste des parties passe dans Journal. */
  function partiesHTML() {
    var l = etat.parties;
    return partieEnDirectHTML() + (l.length ? '<section class="bloc journal-lien"><h2>Mes parties</h2><p class="aide">' +
      t(pluriel(l.length, "partie") + " dans ton journal, avec leur carte de score.") + '</p><button class="btn" type="button" data-a="onglet" data-v="journal">Voir mes parties dans le journal</button></section>' : '');
  }
  function partieEnDirectHTML() {
    var p = etat.partie;
    var h = '<section class="bloc" id="c-partie" style="border-top:0;padding-top:0">' + (p || ui.depart ? '<h2>Partie en direct</h2>' : '');
    if (p) {
      var n = nbSaisis(p), pc = parcoursDe(p.pc);
      h += '<p>' + t("Partie commencée le " + dateCourte(p.d) + (pc ? " sur " + pc.nom : "") + " : " + n + " trou" + (n > 1 ? "s saisis" : " saisi") + " sur " + p.n + ".") + '</p>' +
        '<div class="ligne-btn"><button class="btn principal" type="button" data-a="pt-reprendre">' + t("Reprendre au trou " + numeroTrou(p, p.i)) + '</button>' +
        '<button class="btn" type="button" data-a="pt-abandonner">Abandonner</button></div>';
    } else if (ui.depart) {
      h += departHTML();
    } else {
      h += comment('<p>Sur le parcours, note chaque trou en marchant vers le départ suivant : mise en jeu, green, putts, pénalités et score. Les réponses les plus courantes sont déjà cochées. Tes chiffres mettent à jour ton bilan, tes objectifs et l’estimation de tes coups gagnés.</p>');
    }
    return h + '</section>';
  }
  /* Tableau des parties (Journal), de la plus récente à la plus ancienne. */
  function dernieresPartiesHTML() {
    var l = etat.parties, h = '<section class="bloc" id="c-parties" style="border-top:0;padding-top:0">';
    if (!l.length) h += '<p>' + t("Aucune partie pour l'instant. Lance ta première partie depuis Jouer : elle apparaîtra ici avec sa carte de score.") + '</p><button class="btn principal" type="button" data-a="partie-rapide">Nouvelle partie</button>';
    if (l.length) {
      h += '<h2>Toutes mes parties</h2><div class="defile"><table class="carte-score parties"><thead><tr><th scope="col">Partie</th>' +
        '<th scope="col" class="num">Score</th><th scope="col" class="num">Greens</th><th scope="col" class="num">Putts</th><th scope="col" class="num">Pén.</th></tr></thead><tbody>';
      for (var i = l.length - 1; i >= 0; i--) {
        var s = statsTrous(l[i].trous), sc = scorePartie(l[i]), pci = parcoursDe(l[i].pc);
        var sous = (pci ? pci.nom : "") + (s.T < 18 ? (pci ? " · " : "") + s.T + " trous" : "") + (l[i].exclue ? " · exclue des calculs" : "");
        h += '<tr><th scope="row"><button class="rang-lien" type="button" data-a="pt-carte" data-id="' + i + '"><span>' + t(dateCourte(l[i].d)) + '</span>' + (sous ? '<small>' + t(sous) + '</small>' : '') + '</button></th>' +
          '<td class="num">' + (sc.complet ? '<span class="main">' + ecartLib(sc.ecart) + '</span><small>' + sc.coups + '</small>' : '<span class="marque inconnu">–</span>') + '</td>' +
          [s.G, s.P, s.X].map(function (v) { return '<td class="num"><span class="main">' + v + '</span></td>'; }).join("") + '</tr>';
      }
      var cu = cumulParties(partiesAnalyse(), 54);
      h += '</tbody></table></div><p class="aide" style="margin-top:8px">' +
        t("Touche une partie pour voir sa carte.") + '</p>' +
        indexEstimeHTML() +
        '<button class="btn large" type="button" data-a="pt-voir-sg">Voir mes objectifs et l’estimation de mes coups gagnés</button>';
    }
    return h + '</section>';
  }

  /* ---------- Carte de score d'une partie, dans le calque des fiches ---------- */
  function cartePartieHTML(i) {
    var pt = etat.parties[i], s = statsTrous(pt.trous), sc = scorePartie(pt), o = pt.o || 0, n = pt.trous.length, R = recusPartie(pt), MJ = misesEnJeu(pt.trous, pt.renseigne);
    function pts(k) { var tr = pt.trous[k]; return R && trouNote(tr) ? pointsStableford(tr[4], tr[5], R.recus[k] || 0) : null; }
    function ptsTotal(a, b) { var x = 0; for (var k = a; k < b; k++) x += pts(k) || 0; return x; }
    function oui(v) { return v ? '<span class="main" aria-label="oui">' + TRAIT + '</span>' : '<span class="non" aria-label="non">×</span>'; }
    function total(lib, a, b) {
      var x = statsTrous(pt.trous.slice(a, b)), note = x.N === x.T;
      return '<tr class="total"><th scope="row">' + lib + '</th><td class="num rep">' + (note ? x.PAR : "–") + '</td><td class="num"><span class="main">' + (note ? x.S : "–") + '</span></td>' +
        '<td class="num">' + (function () { var m = misesEnJeu(pt.trous.slice(a, b), Array.isArray(pt.renseigne) ? pt.renseigne.slice(a, b) : null); return m.n ? m.jouables + '/' + m.n : '–'; })() + '</td><td class="num">' + x.G + '</td><td class="num">' + x.P + '</td><td class="num">' + x.X + '</td>' + (R ? '<td class="num">' + ptsTotal(a, b) + '</td>' : '') + '</tr>';
    }
    var h = '<button class="voile" type="button" data-a="fermer-feuille" aria-label="Fermer la carte" tabindex="-1"></button>' +
      '<section class="feuille" role="dialog" aria-modal="true" aria-labelledby="f-titre" id="feuille">' +
      '<header><p class="surtitre">' + t(nomPartie(pt)) + '</p><h2 id="f-titre">' +
      (sc.complet ? t(sc.coups + " coups") + ' <span class="main">' + ecartLib(sc.ecart) + '</span>' : 'Carte de score') + '</h2>' +
      '<button class="fermer" type="button" data-a="fermer-feuille" id="f-fermer">Fermer</button></header>' +
      '<dl class="stats"><div><dt>Mises en jeu jouables</dt><dd>' + (MJ.n ? MJ.jouables + '/' + MJ.n : '–') + (MJ.inconnues ? '<small>' + t(MJ.inconnues + " non renseignée" + (MJ.inconnues > 1 ? "s" : "")) + '</small>' : '') + '</dd></div><div><dt>Greens en régulation</dt><dd>' + s.G + '</dd></div>' +
      '<div><dt>Putts</dt><dd>' + s.P + '</dd></div><div><dt>Coups de pénalité</dt><dd>' + s.X + '</dd></div></dl>' +
      '<div class="defile"><table class="carte-score trous"><thead><tr><th scope="col">Trou</th><th scope="col" class="num">Par</th><th scope="col" class="num">Score</th>' +
      '<th scope="col" class="num">Dép.</th><th scope="col" class="num">Green</th><th scope="col" class="num">Putts</th><th scope="col" class="num">Pén.</th>' + (R ? '<th scope="col" class="num">Pts</th>' : '') + '</tr></thead><tbody>';
    pt.trous.forEach(function (tr, k) {
      var note = trouNote(tr), d = tr[4] - tr[5];
      h += '<tr><th scope="row">' + (o + k + 1) + '</th><td class="num rep">' + (tr[5] || "–") + '</td>' +
        '<td class="num">' + (note ? '<span class="marque ' + (d < 0 ? "dessus" : d > 0 ? "dessous" : "") + '" aria-label="' + at(tr[4] + ", " + nomScore(tr[4], tr[5])) + '">' + tr[4] + '</span>' : '<span class="marque inconnu">–</span>') + '</td>' +
        '<td class="num">' + (tr[5] < 4 ? '<span class="non" aria-label="par 3">–</span>' : !renseigneTrou(pt.renseigne, k, RENS_MEJ) ? '<span class="non" aria-label="non renseignée">?</span>' : oui(tr[0]) + (tr[0] ? (tr[7] ? '<small>' + t(CLUBS_DEPART[tr[7]].toLowerCase()) + '</small>' : '') : (tr[6] ? '<small>' + t(COTES[tr[6]].toLowerCase().replace("à ", "")) + '</small>' : ''))) + '</td>' +
        '<td class="num">' + oui(tr[1]) + '</td>' +
        '<td class="num">' + tr[2] + (tr[8] ? '<small>' + t((tr.length >= 11 ? PUTT1B : PUTT1)[tr[8]] || "") + '</small>' : '') + '</td><td class="num">' + (tr[3] || "") + '</td>' +
        (R ? '<td class="num">' + (pts(k) == null ? "–" : pts(k)) + (R.recus[k] > 0 ? '<small>' + t(R.recus[k] > 1 ? R.recus[k] + " reçus" : "1 reçu") + '</small>' : '') + '</td>' : '') + '</tr>';
      if (k === 8 && n > 9) h += total(o ? "Retour" : "Aller", 0, 9);
    });
    if (n > 9) h += total("Retour", 9, n);
    h += total("Total", 0, n) + '</tbody></table></div>';
    if (R && R.notes) h += '<p class="aide">' + t("Stableford : " + R.points + " points, score net " + R.net + ", avec " + pluriel(R.H, "coup") + " reçu" + (R.H > 1 ? "s" : "") + (R.hcpConnus ? "." : ". Sans le handicap des trous (fiche du parcours), les coups reçus sont répartis dans l'ordre des trous."))+ '</p>';
    if (sc.N) h += '<p class="legende"><span><span class="marque dessus">3</span> sous le par</span><span><span class="marque dessous">5</span> au-dessus</span></p>';
    else h += '<p class="aide">Cette partie a été saisie avant la carte de score : elle n’a pas de score par trou.</p>';
    h += carteCompleteHTML(pt, i);
    if (sc.N && s.C) h += '<p>' + t(pluriel(s.C, "trou") + " à triple bogey ou pire.") + '</p>';
    h += (pt.note ? '<p class="note-partie-ligne">' + t("Note : " + resumeNote(pt.note)) + '</p>' : '') +
      '<p style="margin-top:16px"><button class="btn large" type="button" data-a="pt-editer" data-v="' + i + '">Compléter ou corriger cette partie</button></p>' +
      '<p><button class="btn" type="button" data-a="j-note" data-v="' + i + '">' + (pt.note ? "Modifier la note" : "Ajouter une note (forme, météo, ressenti)") + '</button></p>' +
      '<p class="aide">' + t("Ajoute ce que tu n'as pas noté sur le parcours (mises en jeu, clubs, coups) ou corrige un trou. Rien n'est écrasé tant que tu n'as pas terminé.") + '</p>';
    return h + '<p style="margin-top:16px"><button class="btn danger large" type="button" data-a="pt-suppr" data-v="' + i + '">Supprimer cette partie</button></p></section>';
  }

  /* ---------- Écran de saisie ---------- */
  function choixPartie(k, vals, libs, v, petit) {
    return '<div class="pt-choix' + (petit ? " petit" : "") + '">' + vals.map(function (x, i) {
      return '<button type="button" data-a="pt-set" data-k="' + k + '" data-v="' + x + '" aria-pressed="' + (v[k] === x) + '">' + t(libs[i]) + '</button>';
    }).join("") + '</div>';
  }
  function sousChoix(lib, k, libs, v) {
    var vals = []; for (var i = 1; i < libs.length; i++) vals.push(i);
    return '<div class="pt-sous" role="group" aria-label="' + at(lib) + '"><span>' + t(lib) + '</span>' + choixPartie(k, vals, libs.slice(1), v, true) + '</div>';
  }
  function planDuTrou(p) {
    var pc = parcoursDe(p.pc);
    if (!pc) return "";
    var an = analyseParcours(partiesAnalyse(), pc), h = trouPhysique(p, p.i);
    var noir = an.noirs.filter(function (x) { return x.h === h; })[0];
    if (!noir) return "";
    return '<p class="pt-plan"><b>' + t("Trou noir · " + signe(noir.moy) + " en moyenne") + '</b>' + t(planTrou(noir, an).conseils[0]) + '</p>';
  }
  /* Nombre de trous saisis depuis le premier, sans interruption. */
  function trousContigus(p) { var k = 0; while (k < p.n && p.trous[k]) k++; return k; }
  /* Bande des scores, trou par trou : cercle sous le par, carré au-dessus. */
  function bandeHTML(p) {
    var max = trousContigus(p);
    return '<ol class="pt-bande' + (p.n > 9 ? " dix-huit" : "") + '" aria-label="Scores trou par trou">' + p.trous.map(function (x, i) {
      var num = numeroTrou(p, i), d = x ? x[4] - x[5] : 0;
      var cl = (i === p.i ? "ici " : "") + (x ? (d < 0 ? "sous" : d > 0 ? "sur" : "par") : "vide");
      var lib = "Trou " + num + (x ? " : " + x[4] + ", " + nomScore(x[4], x[5]) : i === p.i ? ", en cours" : ", à jouer");
      return '<li><button type="button" class="' + cl + '" data-a="pt-aller" data-v="' + i + '" aria-label="' + at(lib) + '"' + (i === p.i ? ' aria-current="step"' : '') + (i > max ? " disabled" : "") + '>' +
        '<small aria-hidden="true">' + num + '</small><b aria-hidden="true">' + (x ? x[4] : "·") + '</b></button></li>';
    }).join("") + '</ol>';
  }

  /* Coups reçus, score net et points Stableford d'une partie (si l'index est connu). */
  function recusPartie(pt) {
    var pr = etat.profil; if (!pr || pr.sansIndex || !nombre(pr.index)) return null;
    return coupsRecusPartie(pt, parcoursDe(pt.pc), pr.index);
  }
  /* Coups joués hors du fairway et coups de recentrage, quand la position de la balle a été notée. */
  function liesResume(b) {
    var l = [];
    ["ro", "bk", "ar"].forEach(function (k) { if (b.lies[k]) l.push(b.lies[k] + " " + LIES.filter(function (x) { return x.id === k; })[0].nom.toLowerCase()); });
    ["rec", "sec", "app"].forEach(function (k) { if (b.types[k]) l.push(pluriel(b.types[k], TYPES_COUP.filter(function (x) { return x.id === k; })[0].nom.toLowerCase())); });
    return l.join(", ");
  }
  function liesChiffre(pt, chiffre) {
    var b = bilanLies([pt]); if (!b.notes && !Object.keys(b.types).length) return "";
    var hors = (b.lies.ro || 0) + (b.lies.bk || 0) + (b.lies.ar || 0);
    return chiffre("Hors fairway", hors, liesResume(b));
  }
  function stablefordChiffre(pt, chiffre) {
    var r = recusPartie(pt); if (!r || !r.notes) return "";
    return chiffre("Stableford", r.points + " pts", "net " + r.net + ", " + pluriel(r.H, "coup") + " reçu" + (r.H > 1 ? "s" : "") + (r.hcpConnus && r.exact ? "" : " (approximatif)"));
  }

  /* ---------- Bilan de fin de partie ---------- */
  function bilanPartieHTML() {
    var pt = ui.bilanPartie, s = statsTrous(pt.trous), sc = scorePartie(pt), cu = cumulParties(partiesAnalyse(), 54);
    var cible = cibleCourante(), r = coupsGagnes(partiesAnalyse(), cible);
    function chiffre(lib, v, sur) { return '<div><dt>' + t(lib) + '</dt><dd><span class="main">' + v + '</span>' + (sur ? '<small>' + t(sur) + '</small>' : '') + '</dd></div>'; }
    var h = '<section class="partie bilan' + (etat.ecranClair ? " clair" : "") + '" role="dialog" aria-modal="true" aria-labelledby="pt-titre">' +
      '<header><p class="surtitre">' + t(nomPartie(pt) + " · " + s.T + " trous") + '</p></header>' +
      '<h2 id="pt-titre">Ta partie en chiffres' + (recordPartie(pt) ? ' <span class="tampon">record ' + TRAIT + '</span>' : '') + '</h2><dl class="cinq">' +
      chiffre("Score", sc.complet ? sc.coups : "–", sc.complet ? (sc.ecart ? ecartLib(sc.ecart) + " par rapport au par" : "dans le par") : "") +
      (function () { var M = misesEnJeu(pt.trous, pt.renseigne); return M.n ? chiffre("Mises en jeu jouables", M.jouables, "sur " + M.n + " renseignées") : chiffre("Mises en jeu", "–", "non renseignées"); })() +
      chiffre("Greens en régulation", s.G, "sur " + s.T) +
      chiffre("Putts", s.P, s.P3 ? s.P3 + " fois 3 putts ou plus" : "") + chiffre("Coups de pénalité", s.X, "") + stablefordChiffre(pt, chiffre) + liesChiffre(pt, chiffre) + '</dl>' +
      '<p>' + t((sc.complet && s.C ? pluriel(s.C, "trou") + " à triple bogey ou pire. " : "") + "Ton bilan est à jour. Il s'appuie sur " + (cu.n > 1 ? "tes " + cu.n + " dernières parties, soit " + cu.T + " trous." : "cette partie.")) + '</p>';
    if (r) {
      var pire = r.secteurs.filter(function (x) { return x.sg != null; }).sort(function (x, y) { return x.sg - y.sg; })[0];
      h += '<p>' + t("Face à ton objectif d'index " + cible + " : " +
        (r.total < 0 ? "environ " + coupsLib(r.total, "perdu") : r.total > 0 ? "environ " + coupsLib(r.total, "gagné") : "à égalité") + " sur 18 trous." +
        (pire && pire.sg <= -0.5 ? " Secteur le plus coûteux : " + pire.nom.toLowerCase() + "." : "")) + '</p>';
    }
    h += erreursPartieHTML(pt);
    /* P11 : note facultative (forme, météo, ressenti…). */
    var ip = etat.parties.indexOf(pt);
    if (ip >= 0) h += '<p class="note-partie-ligne">' + (pt.note ? '<span>' + t("Note : " + resumeNote(pt.note)) + '</span> ' : '') + '<button class="btn" type="button" data-a="j-note" data-v="' + ip + '">' + (pt.note ? "Modifier la note" : "Ajouter une note (facultatif)") + '</button></p>';
    return h + '<button class="lien" type="button" data-a="pt-bilan-carte">Voir ma carte de score</button>' +
      '<div class="pt-nav"><button class="btn" type="button" data-a="pt-bilan-fermer">Fermer</button>' +
      '<button class="btn principal" type="button" data-a="pt-voir-sg" id="pt-suiv">Voir l’analyse</button></div></section>';
  }

  function rendrePartie() {
    var c = document.getElementById("calque-partie");
    if (ui.partie === "saisie" && !etat.partie) ui.partie = null;
    if ((ui.partie === "bilan" || ui.partie === "express") && !ui.bilanPartie) ui.partie = null;
    if (!ui.partie || !etat.profil) { ui.partie = null; c.innerHTML = ""; c.hidden = true; majFige(); majSuivi(); return; }
    c.hidden = false;
    c.className = etat.ecranClair ? "clair" : "";
    /* Le panneau ouvert (coup, carte…) garde sa position de défilement quand il est redessiné :
       toucher l'ellipse ou un choix ne ramène plus en haut. Un autre panneau repart du haut. */
    var pan = c.querySelector(".pv-panneau"), cle = pan ? pan.className + "|" + (pan.getAttribute("aria-labelledby") || "") : null, haut = pan ? pan.scrollTop : 0, hautCalque = c.scrollTop;
    c.innerHTML = ui.partie === "bilan" ? bilanPartieHTML() : ui.partie === "express" ? expressHTML() : paveHTML();
    var pan2 = c.querySelector(".pv-panneau");
    if (pan2 && cle && pan2.className + "|" + (pan2.getAttribute("aria-labelledby") || "") === cle) pan2.scrollTop = haut;
    if (pan2 || cle) c.scrollTop = hautCalque;
    majFige(); majSuivi();
  }
  function focusPartie(sel) { var b = document.querySelector("#calque-partie " + sel); if (b) b.focus({ preventScroll: true }); }

  /* Le par saisi sur un trou est retenu pour le parcours. */
  function memoriserPar(p, k) {
    var pc = parcoursDe(p.pc), tr = p.trous[k];
    if (pc && tr && tr[5]) pc.pars[trouPhysique(p, k)] = tr[5];
  }

  function terminerPartie() {
    var p = etat.partie, saisis = p.trous.filter(Boolean);
    if (saisis.length < 9) {
      dialogue({ titre: "Partie trop courte",
        corps: '<p>' + t("Tu as saisi " + pluriel(saisis.length, "trou") + ". Il en faut au moins 9 pour que la partie compte dans tes statistiques.") + '</p>',
        boutons: [{ l: "Continuer la partie", a: "fermer-dialogue", c: "principal" }, { l: "Abandonner la partie", a: "pt-ok-abandon", c: "danger" }] });
      return;
    }
    p.trous.forEach(function (x, k) { if (x) memoriserPar(p, k); });
    var idx = []; p.trous.forEach(function (x, k) { if (x) idx.push(k); });
    var pt = { id: idValide(p.id, "p") ? p.id : nouvelId("p"), d: p.d, trous: saisis, pc: parcoursDe(p.pc) ? p.pc : null, o: p.o || 0 };
    if (Array.isArray(p.renseigne)) pt.renseigne = idx.map(function (k) { return p.renseigne[k] || 0; });
    if (pt.pc && p.rep >= 0) pt.rep = p.rep;
    pt.validation = idx.map(function (k) { return (p.validation || [])[k] === "confirme" ? "confirme" : "suggere"; });
    /* Coups et partenaires suivent les trous gardés. */
    var coups = idx.map(function (k) { return (p.coups && p.coups[k]) || []; });
    if (coups.some(function (l) { return l.length; })) pt.coups = coups;
    if (p.joueurs && p.joueurs.length) pt.joueurs = p.joueurs.map(function (j) { return { nom: j.nom, s: idx.map(function (k) { return j.s[k] == null ? null : j.s[k]; }) }; });
    /* Partie complétée après coup : elle remplace l'originale, à sa place ; sinon elle s'ajoute. */
    var deja = p.edition ? etat.parties.map(function (x) { return x.id; }).indexOf(pt.id) : -1;
    /* Une partie exclue des calculs le reste après avoir été complétée. */
    if (deja >= 0 && etat.parties[deja].exclue) pt.exclue = 1;
    if (deja >= 0) etat.parties[deja] = pt; else etat.parties.push(pt);
    etat.partie = null;
    majIndicateursParties();
    sauver();
    garderEcran(false); vibrer([40, 60, 40]);
    ui.bilanPartie = pt; ui.partie = "express"; ui.pvCoup = null; ui.pvLong = false;
    rendre(); rendrePartie(); hautPartie(); focusPartie("#pt-suiv");
  }
  function hautPartie() { var c = document.getElementById("calque-partie"); if (c) c.scrollTop = 0; }

  ACTIONS["dp-ouvrir"] = function () {
    if (etat.partie) return;
    var pc = null;
    for (var i = etat.parties.length - 1; i >= 0 && !pc; i--) if (parcoursDe(etat.parties[i].pc)) pc = etat.parties[i].pc;
    ui.depart = { pc: pc || (etat.parcours.length ? etat.parcours[0].id : "nouveau"), nom: "", L: 18, jeu: "" };
    normaliserDepart(); rendre();
    var c = document.getElementById("dp-pc") || document.getElementById("dp-nom"); if (c) c.focus({ preventScroll: true });
  };
  ACTIONS["dp-annuler"] = function () {
    ui.depart = null; rendre();
    var b = app.querySelector('[data-a="dp-ouvrir"]'); if (b) b.focus({ preventScroll: true });
  };
  ACTIONS["dp-set"] = function (el) {
    var d = ui.depart, k = el.getAttribute("data-k"), v = el.getAttribute("data-v"); if (!d) return;
    if (k === "L") d.L = v === "9" ? 9 : 18; else if (k === "jeu") d.jeu = v;
    normaliserDepart(); rendreEtFocus(el);
  };
  SAISIES["dp-nom"] = function (el) { if (ui.depart) ui.depart.nom = el.value; };
  CHANGEMENTS["dp-rep"] = function (el) { if (ui.depart) ui.depart.rep = parseInt(el.value, 10) || 0; };
  CHANGEMENTS["dp-pc"] = function (el) {
    if (!ui.depart) return;
    ui.depart.pc = el.value; normaliserDepart(); rendre();
    var c = document.getElementById(ui.depart.pc === "nouveau" ? "dp-nom" : "dp-pc"); if (c) c.focus({ preventScroll: true });
  };
  ACTIONS["pt-nouvelle"] = function () {
    var d = ui.depart; if (!d || etat.partie) return;
    var err = document.getElementById("dp-err"), pc = d.pc === "nouveau" ? null : parcoursDe(d.pc), i;
    function refuser(txt) { if (err) { err.textContent = txt; err.hidden = false; } var c = document.getElementById("dp-nom"); if (c) c.focus(); }
    if (!pc) {
      var nom = texteCourt(d.nom, 40), num = 1, pars = [];
      if (!nom) { refuser("Donne un nom au parcours."); return; }
      if (etat.parcours.length >= 20) { refuser("Tu as déjà 20 parcours. Supprimes-en un pour en ajouter un autre."); return; }
      etat.parcours.forEach(function (x) { num = Math.max(num, parseInt(x.id.slice(1), 10) + 1); });
      for (i = 0; i < (d.L === 9 ? 9 : 18); i++) pars.push(0);
      pc = { id: "p" + num, nom: nom, pars: pars, sss: null, slope: null };
      etat.parcours.push(pc);
    }
    var n = pc.pars.length === 18 ? (d.jeu === "aller" || d.jeu === "retour" ? 9 : 18) : (d.jeu === "2x9" ? 18 : 9), tr = [];
    for (i = 0; i < n; i++) tr.push(null);
    etat.partie = { id: nouvelId("p"), d: auj(), n: n, i: 0, trous: tr, pc: pc.id, renseigne: tr.map(function () { return 0; }), o: d.jeu === "retour" && pc.pars.length === 18 ? 9 : 0,
      coups: tr.map(function () { return []; }),
      validation: tr.map(function () { return "suggere"; }),
      joueurs: (d.joueurs || []).map(function (nm) { return { nom: nm, s: tr.map(function () { return null; }) }; }) };
    if (pc.reps && pc.reps.length) etat.partie.rep = d.rep >= 0 && d.rep < pc.reps.length ? d.rep : 0;
    ui.depart = null;
    sauver(); garderEcran(true);
    ui.partie = "saisie"; rendre(); rendrePartie(); focusPartie("#pt-suiv");
  };
  /* Rouvrir une partie terminée dans le pavé (P03) : une copie, qui remplace l'originale seulement à la fin. */
  ACTIONS["pt-editer"] = function (el) {
    var i = parseInt(el.getAttribute("data-v"), 10), pt = etat.parties[i]; if (!pt) return;
    if (etat.partie) { message("Termine ou ferme d'abord la partie en cours."); return; }
    if (!idValide(pt.id, "p")) { pt.id = nouvelId("p"); }
    var L = pt.trous.length, n = L <= 9 ? 9 : 18, tr = [], cp = [], va = [], rs = [];
    for (var k = 0; k < n; k++) {
      tr.push(k < L ? trouOnze(pt.trous[k].slice()) : null);
      cp.push(k < L && pt.coups && pt.coups[k] ? JSON.parse(JSON.stringify(pt.coups[k])) : []);
      va.push(k < L && pt.validation && pt.validation[k] === "confirme" ? "confirme" : "suggere");
      rs.push(k < L ? (Array.isArray(pt.renseigne) ? pt.renseigne[k] || 0 : 7) : 0);
    }
    etat.partie = { id: pt.id, d: pt.d, n: n, i: 0, trous: tr, pc: pt.pc, o: pt.o || 0, coups: cp, validation: va, renseigne: rs, edition: true,
      joueurs: (pt.joueurs || []).map(function (j) { var s = []; for (var k = 0; k < n; k++) s.push(k < L ? j.s[k] : null); return { nom: j.nom, s: s }; }) };
    if (pt.rep >= 0) etat.partie.rep = pt.rep;
    sauver();
    ui.feuille = null; rendreFeuille();
    ui.partie = "saisie"; ui.pvCoup = null; ui.pvLong = false; ui.pvPanneau = null;
    rendrePartie(); rendre(); focusPartie("#pt-suiv");
    message("Partie rouverte : complète-la puis termine-la.");
  };
  ACTIONS["pt-reprendre"] = function () { if (!etat.partie) return; ui.partie = "saisie"; ui.pvCoup = null; ui.pvLong = false; garderEcran(true); rendrePartie(); focusPartie("#pt-suiv"); };
  ACTIONS["pt-fermer"] = function () {
    ui.partie = null; ui.pvCoup = null; ui.pvLong = false; ui.pvPanneau = null; garderEcran(false); rendrePartie(); rendre();
    var b = app.querySelector('[data-a="pt-reprendre"]'); if (b) b.focus({ preventScroll: true });
  };
  /* Une réponse du trou. Le score suit les réponses tant que le joueur ne l'a pas corrigé lui-même. */
  ACTIONS["pt-set"] = function (el) {
    var p = etat.partie; if (!p) return;
    var k = parseInt(el.getAttribute("data-k"), 10), val = parseInt(el.getAttribute("data-v"), 10), v = trouCourant().slice();
    if (!(k >= 0 && k <= 11) || k === 4 || k === 9 || isNaN(val)) return;
    if (k === 11 && v.length === 11) v.push(0);
    var suit = v[4] === scoreSuggere(v[5], v[1], v[2], v[3]);
    v[k] = k >= 6 && v[k] === val ? 0 : val;
    /* Côté d'une mise en jeu ratée : la mise en jeu est renseignée (ratée) ; club de départ, premier putt : renseignés. */
    if (k === 6) { if (v[6]) v[0] = 0; marquerRenseigne(RENS_MEJ, true); }
    if (k === 7) marquerRenseigne(RENS_CLUB, !!v[7]);
    if (k === 8) marquerRenseigne(RENS_PUTT1, !!v[8]);
    if (k === 2 && v.length >= 11 && v[2] < 3) v[9] &= ~EVIT_PUTT3;
    if (k === 2 && v.length === 12 && v[2] < 2) v[11] = 0;
    if (suit) v[4] = scoreSuggere(v[5], v[1], v[2], v[3]);
    v = assainirTrou(v); if (!v) return;
    p.trous[p.i] = v;
    sauver(); rendrePartie();
    focusPartie('[data-a="pt-set"][data-k="' + k + '"][data-v="' + val + '"]');
  };
  ACTIONS["pt-score"] = function (el) {
    var p = etat.partie; if (!p) return;
    var v = trouCourant().slice(), d = el.getAttribute("data-d") === "1" ? 1 : -1;
    v[4] = Math.max(scoreMini(v[2], v[3]), Math.min(15, v[4] + d));
    if (!p.validation) p.validation = p.trous.map(function () { return "suggere"; });
    p.validation[p.i] = "confirme";
    poserTrou(v);
    sauver(); rendrePartie();
    focusPartie('[data-a="pt-score"][data-d="' + d + '"]:not([disabled]), [data-a="pt-score"]:not([disabled])');
  };
  ACTIONS["pt-confirmer"] = function () {
    var p = etat.partie; if (!p) return;
    poserTrou(trouCourant().slice());
    if (!p.validation) p.validation = p.trous.map(function () { return "suggere"; });
    p.validation[p.i] = "confirme";
    sauver(); rendrePartie(); focusPartie('[data-a="pt-confirmer"]');
  };
  ACTIONS["pt-theme"] = function () {
    etat.ecranClair = !etat.ecranClair;
    sauver(); rendrePartie(); focusPartie('[data-a="pt-theme"]');
  };
  /* Bande des scores : toucher un trou déjà saisi, ou le premier à saisir, pour y aller. */
  ACTIONS["pt-aller"] = function (el) {
    var p = etat.partie, k = parseInt(el.getAttribute("data-v"), 10); if (!p) return;
    if (!(k >= 0 && k < p.n) || k > trousContigus(p)) return;
    p.i = k; ui.pvLong = false; ui.pvPanneau = null;
    sauver(); rendrePartie(); focusPartie("#pt-suiv");
  };
  ACTIONS["pt-detail"] = function () {
    etat.detail = !etat.detail;
    sauver(); rendrePartie(); focusPartie('[data-a="pt-detail"]');
  };
  ACTIONS["pt-suiv"] = function () {
    var p = etat.partie; if (!p) return;
    if (!p.edition) apprendreFinTrou();   /* une partie complétée après coup : le joueur n'est plus au drapeau */
    var vs = trouCourant().slice();
    /* Club de départ repris du trou précédent et laissé tel quel en standard ou expert : accepté. */
    if (niveauSaisie() >= 1 && vs[5] >= 4 && vs[7]) marquerRenseigne(RENS_CLUB, true);
    poserTrou(vs);
    if (!p.validation) p.validation = p.trous.map(function () { return "suggere"; });
    p.validation[p.i] = "confirme";
    memoriserPar(p, p.i);
    vibrer(35); ui.pvLong = false; ui.pvCoup = null; ui.pvPanneau = null;
    if (p.i >= p.n - 1) { sauver(); terminerPartie(); return; }
    p.i++;
    sauver(); rendrePartie(); focusPartie("#pt-suiv");
    var c = document.getElementById("calque-partie"); if (c) c.scrollTop = 0;
  };
  ACTIONS["pt-prec"] = function () {
    var p = etat.partie; if (!p || p.i === 0) return;
    p.i--; ui.pvLong = false; ui.pvPanneau = null;
    sauver(); rendrePartie(); focusPartie('[data-a="pt-prec"]:not([disabled]), #pt-suiv');
  };
  ACTIONS["pt-terminer"] = function () { if (etat.partie) terminerPartie(); };
  ACTIONS["pt-abandonner"] = function () {
    dialogue({ titre: "Abandonner la partie ?", corps: '<p>Les trous déjà saisis seront effacés. Cette partie ne comptera pas dans tes statistiques.</p>',
      boutons: [{ l: "Garder la partie", a: "fermer-dialogue" }, { l: "Abandonner", a: "pt-ok-abandon", c: "danger" }] });
  };
  ACTIONS["pt-ok-abandon"] = function () {
    etat.partie = null; sauver(); garderEcran(false);
    ui.partie = null; ui.dialogue = null; rendreDialogue(); rendrePartie(); rendre();
  };
  ACTIONS["pt-carte"] = function (el) {
    var i = parseInt(el.getAttribute("data-id"), 10); if (!etat.parties[i]) return;
    ui.retourFocus = el;
    ui.feuille = { partie: i };
    rendreFeuille();
    var b = document.getElementById("f-fermer"); if (b) b.focus();
  };
  ACTIONS["pt-suppr"] = function (el) {
    var i = parseInt(el.getAttribute("data-v"), 10), pt = etat.parties[i]; if (!pt) return;
    ui.aSupprimer = i;
    dialogue({ titre: "Supprimer cette partie ?", corps: '<p>' + t("La partie du " + dateCourte(pt.d) + " sera retirée de tes statistiques.") + '</p>',
      boutons: [{ l: "Annuler", a: "fermer-dialogue" }, { l: "Supprimer", a: "pt-ok-suppr", c: "danger" }] });
  };
  ACTIONS["pt-ok-suppr"] = function () {
    var i = ui.aSupprimer; ui.aSupprimer = null;
    if (etat.parties[i]) { etat.parties.splice(i, 1); majIndicateursParties(); sauver(); }
    ui.dialogue = null; ui.feuille = null; ui.retourFocus = null;
    rendreDialogue(); rendreFeuille(); rendre();
  };
  ACTIONS["pt-bilan-fermer"] = function () {
    ui.partie = null; ui.bilanPartie = null; rendrePartie(); allerOnglet("parcours", true);
  };
  ACTIONS["pt-bilan-carte"] = function () {
    var i = etat.parties.indexOf(ui.bilanPartie);
    ui.partie = null; ui.bilanPartie = null; rendrePartie(); allerOnglet("journal", true);
    if (i >= 0) { ui.feuille = { partie: i }; ui.retourFocus = app.querySelector('[data-a="pt-carte"][data-id="' + i + '"]'); rendreFeuille(); var b = document.getElementById("f-fermer"); if (b) b.focus(); }
  };
  ACTIONS["pt-voir-sg"] = function () {
    ui.partie = null; ui.bilanPartie = null; rendrePartie();
    ui.rubrique = "sg"; allerOnglet("bilan", false); allerSection("sg");
  };
