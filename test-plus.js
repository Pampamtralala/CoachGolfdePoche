/* Tests des fonctions pures des outils : carnet, parties, coups gagnés, défis. */
const D = require('./src/data-plus.js');
const E = require('./src/engine-plus.js');
const B = require('./src/data-base.js');
let ko = 0, n = 0;
function ok(cond, msg) { n++; if (!cond) { ko++; console.log('ÉCHEC :', msg); } }
function proche(a, b, tol, msg) { ok(Math.abs(a - b) <= tol, msg + ' (obtenu ' + a + ', attendu ' + b + ')'); }

/* --- Carnet --- */
ok(E.statsClub([]) === null && E.statsClub(null) === null, 'club sans mesure');
ok(E.statsClub([150]).moy === 150, 'une mesure');
let s = E.statsClub([140, 200, 150, 170, 160]);
ok(s.moy === 160 && s.min === 140 && s.max === 200 && s.elague, 'moyenne élaguée à partir de 5 mesures');
ok(E.statsClub([100, 110, 120, 130]).moy === 115, 'moyenne simple sous 5 mesures');
let an = E.analyseCarnet({ dr: [210], b3: [190], f5: [160], f6: [158], f7: [130], f8: [135], zz: [999] });
ok(an.lignes.length === 6 && an.lignes[0].club.id === 'dr', 'ordre des clubs, club inconnu ignoré');
ok(an.alertes.map(a => a.type + ':' + a.a.id + '-' + a.b.id).join(' ') === 'trou:b3-f5 doublon:f5-f6 trou:f6-f7 inverse:f7-f8', 'alertes : ' + an.alertes.map(a => a.type + ':' + a.a.id + '-' + a.b.id).join(' '));
ok(E.analyseCarnet({ dr: [230], b3: [205] }).alertes.length === 0, '25 m entre driver et bois 3 : normal');
ok(E.analyseCarnet({}).lignes.length === 0 && E.analyseCarnet({}).ecartMoyen === null, 'carnet vide');
/* Sac de golf : voisins du sac, règle des 8 à 15 m, 25 m entre deux bois */
{
  const sac = ['dr', 'b3', 'b5', 'f4', 'f5', 'f6', 'f7', 'f8', 'f9', 'pw', 'sw'];
  const m = { dr: [225], b3: [205], b5: [190], f4: [168], f5: [163], f6: [150], f7: [140], f8: [130], f9: [112], pw: [100], sw: [80], lw: [60] };
  const an = E.analyseCarnet(m, sac);
  const st = an.paires.map(p => p.a.id + '-' + p.b.id + ':' + p.statut).join(' ');
  ok(st === 'dr-b3:ok b3-b5:ok b5-f4:trou f4-f5:doublon f5-f6:ok f6-f7:ok f7-f8:ok f8-f9:trou f9-pw:ok pw-sw:trou', 'étagement du sac : ' + st);
  ok(an.ok === 6 && an.paires.length === 10 && an.lignes.length === 11, 'lob wedge hors du sac ignoré, 6 écarts sur 10 justes');
  ok(an.paires[0].max === 25 && an.paires[2].max === 15, 'écart toléré : 25 m entre deux bois, 15 m sinon');
  const trou = E.analyseCarnet({ f6: [150], f8: [130] }, ['f6', 'f7', 'f8']);
  ok(trou.paires.length === 0 && trou.alertes.length === 0, 'un club du sac sans mesure ne crée pas de faux trou');
  const bornes = E.analyseCarnet({ f5: [160], f6: [152], f7: [137], f8: [121] }, ['f5', 'f6', 'f7', 'f8']).paires.map(p => p.statut).join(' ');
  ok(bornes === 'ok ok trou', '8 et 15 m inclus, 16 m de trop : ' + bornes);
  ok(E.analyseCarnet({ h4: [180], f5: [165] }, ['h4', 'f5']).paires[0].max === 15, 'un hybride n\'est pas un bois pour l\'écart toléré');
  ok(E.SAC_ECART.min === 8 && E.SAC_ECART.max === 15, 'seuils exportés');
}
/* Coups du parcours, dispersion, points clés, meilleurs et pires trous, chronomètre */
{
  const pt = { coups: [[{ c: 'dr', d: 220, a: 'plein' }, { c: 'f7', d: 140, a: 'plein' }], [{ c: 'sw', d: 45, a: 'a2' }, { c: 'sw', d: 50, a: 'a2' }, { c: 'pw', d: null, a: 'plein' }, { c: 'zz', d: 90 }]] };
  const m = E.mesuresParcours([pt, { coups: [[{ c: 'f7', d: 150, a: 'plein' }]] }]);
  ok(JSON.stringify(m.clubs) === '{"dr":[220],"f7":[140,150]}' && JSON.stringify(m.wedges) === '{"sw":{"a2":[45,50]}}', 'coups du parcours : ' + JSON.stringify(m));
  ok(JSON.stringify(E.fusionMesures({ f7: [145] }, m.clubs).f7) === '[145,140,150]', 'mesures du practice et du parcours réunies');
  const fw = E.fusionWedges({ sw: { a1: 30, a2: 44 } }, { sw: { a2: [45, 50], a3: [60, 63] } });
  ok(fw.sw.a1 === 30 && fw.sw.a2 === 44 && fw.sw.a3 === 62, 'case saisie gardée, case vide remplie par le parcours : ' + JSON.stringify(fw));
  const d = E.dispersion([140, 145, 150, 138, 152, 147, 143, 149, 141, 146]);
  ok(d.n === 10 && d.moy === 145 && d.sigma === 5 && d.p10 === 140 && d.p90 === 150, 'dispersion : ' + JSON.stringify(d));
  ok(E.dispersion([140, 150]) === null, 'dispersion à partir de trois balles');
  const melange = E.mesuresParcours([{ coups: [[
    { c: 'f7', d: 160, source: 'gps', distanceType: 'total' },
    { c: 'f7', d: 143, source: 'manuel', distanceType: 'carry' }
  ]] }]);
  ok(JSON.stringify(melange.clubs.f7) === '[143]', 'le sac utilise le carry et écarte les distances totales GPS');
  const obsMixte = E.observationsGolf([{ d: '2026-11-20', coups: [[
    { c: 'f7', d: 160, source: 'gps', distanceType: 'total' },
    { c: 'f7', d: 143, source: 'manuel', distanceType: 'carry' }
  ]] }], {});
  ok(obsMixte.length === 2 && obsMixte[0].distanceType === 'total', 'distance totale GPS conservée dans les observations');

  ok(Math.abs(E.distanceGPS([45.9, 2.17], [45.9013, 2.17]) - 145) <= 1, 'distance GPS');
  const trous = []; for (let k = 0; k < 18; k++) trous.push([k % 3 ? 1 : 0, k % 4 ? 0 : 1, k % 5 ? 2 : 3, k === 7 ? 1 : 0, k % 2 ? 6 : 5, 4, 0, 0, 0]);
  const pc = E.pointsCles({ d: '2026-11-14', trous: trous }, 18);
  ok(pc.length === 3 && pc[0].type === 'fort' && pc[1].type === 'travail' && pc[2].type === 'travail' && pc.every(x => x.fait && x.d) && pc[1].sg <= pc[2].sg, 'trois points clés : ' + pc.map(x => x.type + ':' + x.id + ':' + x.sg).join(' '));
  ok(E.pointsCles({ trous: trous.slice(0, 5) }, 18).length === 0, 'pas de points clés sous neuf trous');
  const an = { trous: [1, 2, 3, 4, 5, 6, 7].map((h, i) => ({ h: i, par: 4, N: i === 6 ? 1 : 2, moy: [0.5, 1.5, -0.5, 2, 0, 1, 3][i] })) };
  const tf = E.topFlopTrous(an, 2);
  ok(tf.n === 6 && tf.flop.map(x => x.h).join() === '3,1,5' && tf.top.map(x => x.h).join() === '2,4,0', 'meilleurs et pires trous : ' + JSON.stringify(tf.flop.map(x => x.h)) + JSON.stringify(tf.top.map(x => x.h)));
  ok(E.scoreJoueur([5, null, 4, 6], [4, 4, 4, 5]).coups === 15 && E.scoreJoueur([5, null, 4, 6], [4, 4, 4, 5]).ecart === 2, 'score d\'un partenaire');
  const vingt = E.DEFI.vingt, Dv = E.defiNeuf();
  let ev = null; for (let i = 0; i < 20; i++) ev = E.defiCoup(vingt, Dv, i !== 3, '2026-11-14', 1.8e12 + i * 6000);
  ok(ev && ev.type === 'reussi' && ev.v === 19 && ev.s === 114 && Dv.temps === 114 && Dv.niv === 3 && Dv.hist[0].s === 114, 'défi chronométré : ' + JSON.stringify(ev) + ' ' + Dv.temps);
  const D2 = E.defiNeuf(); E.defiCoup(E.DEFI.putts10, D2, true, '2026-11-14');
  ok(!('t0' in D2.cours), 'sans heure, pas de chronomètre');
}
/* Wedges désignés par leur loft */
{
  const ordre = E.definirWedges([54, 58, 54, 70, 'x'], { sw: 56, gw: 99 });
  ok(ordre.join(' ') === 'pw gw w54 sw w58 lw', 'wedges rangés par loft : ' + ordre.join(' '));
  ok(E.CLUB.w54 && E.CLUB.w54.nom === 'Wedge 54°' && E.CLUB.w54.fam === 'w' && E.CLUB.w54.loft === 54, 'wedge ajouté décrit par son loft');
  ok(E.CLUB.sw.loft === 56 && E.CLUB.sw.loftPrecise && E.CLUB.gw.loft === 50 && !E.CLUB.gw.loftPrecise, 'loft précisé gardé, loft hors bornes ignoré');
  ok(E.WEDGES.join(' ') === 'pw gw w54 sw w58 lw', 'matrice de wedges alignée');
  const an = E.analyseCarnet({ f9: [110], pw: [100], w54: [86], sw: [80], w58: [70] }, ['f9', 'pw', 'w54', 'sw', 'w58']);
  ok(an.paires.map(p => p.a.id + '-' + p.b.id + ':' + p.statut).join(' ') === 'f9-pw:ok pw-w54:ok w54-sw:doublon sw-w58:ok', 'étagement avec wedges ajoutés');
  ok(E.wedgeAuLoft(56, null, ['sw']) === E.CLUB.sw && E.wedgeAuLoft(56, null, []) === null && E.wedgeAuLoft(54, null, []) === E.CLUB.w54 && E.wedgeAuLoft(54, 'w54', []) === null, 'loft déjà pris : wedge ajouté ou wedge du sac au loft précisé');
  E.definirWedges([], {});
  ok(!E.CLUB.w54 && E.WEDGES.join(' ') === 'pw gw sw lw' && E.CLUB.sw.petit === '54 à 56°', 'retour aux quatre wedges de base');
}

/* --- Wedges --- */
let aw = E.analyseWedges({ sw: { a1: 30, a2: 45, a3: 62 }, pw: { a2: 75 } }, {});
ok(aw.n === 4 && aw.trous.length === 3 && JSON.stringify(aw.trous.map(t => [t.lo, t.hi])) === '[[30,45],[45,62],[62,75]]', 'trois trous : ' + JSON.stringify(aw.trous.map(t => [t.lo, t.hi])));
aw = E.analyseWedges({ sw: { a1: 30, a2: 42, a3: 54 }, gw: { a2: 66, a3: 75 } }, { pw: [105] });
ok(aw.trous.length === 1 && aw.trous[0].lo === 75 && aw.trous[0].hi === 105 && aw.trous[0].ecart === 30, 'trou qui dépasse la fenêtre : gardé en entier');
aw = E.analyseWedges({ sw: { a1: 45, a2: 55, a3: 65 } }, { sw: [80, 80, 80] });
ok(aw.trous.length === 2 && aw.trous[0].de === null && aw.trous[0].lo === 30 && aw.trous[0].hi === 45, 'trou en bas de fenêtre');
ok(aw.trous[1].de.v === 65 && aw.trous[1].a.a === 'plein' && aw.trous[1].hi === 80, 'le plein swing ferme la fenêtre');
aw = E.analyseWedges({ lw: { a1: 28, a2: 38, a3: 48 }, sw: { a1: 34, a2: 44, a3: 56 }, pw: { a1: 50, a2: 64, a3: 76 } }, {});
ok(aw.trous.length === 0, 'matrice complète sans trou : ' + JSON.stringify(aw.trous));
ok(E.analyseWedges({}, { pw: [100] }).n === 0, 'pas de graphique sans amplitude');

/* --- Parties --- */
const trou = (j, g, p, x) => [j, g, p, x];
let t18 = [];
for (let i = 0; i < 18; i++) t18.push(trou(i < 11 ? 1 : 0, i < 4 ? 1 : 0, i < 3 ? 3 : 2, i === 17 ? 2 : 0));
let st = E.statsTrous(t18);
ok(st.T === 18 && st.J === 11 && st.G === 4 && st.P === 39 && st.P3 === 3 && st.X === 2, 'cinq chiffres');
ok(st.M === 14 && st.U === 7 && st.PG === 11 && st.PM === 28, 'greens manqués, départs coûteux, putts répartis');
let ind = E.indicateursParties([{ d: 'a', trous: t18 }]);
ok(ind.vals.drive_jeu === 6 && ind.vals.fers_gir === 4 && ind.vals.putt_3 === 3 && ind.vals.strat_penal === 2, 'indicateurs sur 18 trous');
let t9 = t18.slice(0, 9);
ind = E.indicateursParties([{ d: 'a', trous: t9 }]);
ok(ind.vals.drive_jeu === 10 && ind.vals.fers_gir === 8 && ind.vals.putt_3 === 6 && ind.vals.strat_penal === 0, '9 trous ramenés à 18');
let cu = E.cumulParties([{ d: '1', trous: t18 }, { d: '2', trous: t18 }, { d: '3', trous: t18 }, { d: '4', trous: t9 }], 54);
ok(cu.n === 3 && cu.T === 45 && cu.date === '4', 'cumul limité à 54 trous, parties récentes d\'abord');
ok(E.cumulParties([{ d: '1', trous: t18 }], 9).T === 18, 'la dernière partie compte toujours');
ok(E.indicateursParties([]) === null, 'aucune partie');

/* --- Repères des coups gagnés : cohérence avec les repères des paliers --- */
const repInd = id => B.INDICATEURS.find(i => i.id === id).rep;
[[45, 0], [30, 1], [18, 2], [6, 3]].forEach(([idx, p]) => {
  const R = E.repereSG(idx);
  proche(10 * (1 - R.u / 18), repInd('drive_jeu')[p], 0.6, 'mises en jeu jouables, index ' + idx);
  proche(R.gir, repInd('fers_gir')[p], 0.6, 'greens en régulation, index ' + idx);
  proche(R.x, repInd('strat_penal')[p], 0.6, 'pénalités, index ' + idx);
});
let prec = null;
for (let i = 0; i <= 54; i += 0.5) {
  const R = E.repereSG(i);
  ok(18 - R.gir - R.u > 0, 'greens manqués > départs coûteux à l\'index ' + i);
  if (prec) ok(R.u >= prec.u && R.gir <= prec.gir && R.pg >= prec.pg && R.pm >= prec.pm && R.x >= prec.x, 'repères monotones à l\'index ' + i);
  const putts = R.gir * R.pg + (18 - R.gir) * R.pm;
  ok(putts > 29 && putts < 43, 'total de putts plausible à l\'index ' + i + ' : ' + putts.toFixed(1));
  prec = R;
}
ok(E.cibleAuto(28.4) === 25 && E.cibleAuto(18) === 15 && E.cibleAuto(8) === 5 && E.cibleAuto(2) === 0 && E.cibleAuto(54) === 45 && E.cibleAuto(40) === 36, 'cible automatique');

/* --- Coups gagnés --- */
ok(E.coupsGagnes([{ d: 'a', trous: t18.slice(0, 8) }], 20) === null, 'moins de 9 trous : pas de calcul');
/* Un joueur exactement au niveau de la cible : tous les secteurs à zéro. */
function partiesAuNiveau(idx, n) {
  const R = E.repereSG(idx), T = 18 * n, trous = [];
  const U = Math.round(R.u * n), G = Math.round(R.gir * n), M = T - G;
  const PG = Math.round(G * R.pg), PM = Math.round(M * R.pm), X = Math.round(R.x * n);
  for (let i = 0; i < T; i++) {
    const g = i < G ? 1 : 0, j = (!g && i - G < U) ? 0 : 1;
    trous.push([j, g, 0, 0]);
  }
  let reste = PG; for (let i = 0; i < G; i++) { const p = Math.round(reste / (G - i)); trous[i][2] = p; reste -= p; }
  reste = PM; for (let i = G; i < T; i++) { const p = Math.round(reste / (T - i)); trous[i][2] = p; reste -= p; }
  reste = X; for (let i = T - 1; reste > 0; i--) { const x = Math.min(3, reste); trous[i][3] = x; reste -= x; }
  const parties = [];
  for (let k = 0; k < n; k++) parties.push({ d: 'p' + k, trous: [] });
  trous.forEach((t, i) => parties[i % n].trous.push(t));
  return parties;
}
[5, 15, 25, 36].forEach(idx => {
  const r = E.coupsGagnes(partiesAuNiveau(idx, 5), idx);
  ok(r.T === 90, '90 trous cumulés');
  r.secteurs.forEach(sx => proche(sx.sg, 0, 0.25, 'joueur au niveau de la cible ' + idx + ', secteur ' + sx.id));
});
/* Sens et ampleur de chaque secteur. */
const base = partiesAuNiveau(20, 5), cl = p => JSON.parse(JSON.stringify(p));
const sg = (p, id) => E.coupsGagnes(p, 20).secteurs.find(x => x.id === id).sg;
let m1 = cl(base); m1.forEach(p => { p.trous[17][3] += 2; });
proche(sg(m1, 'penal') - sg(base, 'penal'), -2, 0.11, 'deux pénalités de plus par partie coûtent deux coups');
proche(sg(m1, 'depart'), sg(base, 'depart'), 0.01, 'les pénalités ne touchent pas la mise en jeu');
let m2 = cl(base); m2.forEach(p => { let k = 0; p.trous.forEach(t => { if (t[1] && k < 2) { t[2] += 1; k++; } }); });
proche(sg(m2, 'putting') - sg(base, 'putting'), -2, 0.11, 'deux putts de plus sur les greens touchés coûtent deux coups au putting');
proche(sg(m2, 'petit'), sg(base, 'petit'), 0.01, 'sans effet sur le petit jeu');
let m3 = cl(base); m3.forEach(p => { let k = 0; p.trous.forEach(t => { if (!t[1] && k < 3) { t[2] = Math.max(0, t[2] - 1); k++; } }); });
proche(sg(m3, 'petit') - sg(base, 'petit'), 3, 0.11, 'trois putts de moins sur les greens manqués rapportent trois coups au petit jeu');
let m4 = cl(base); m4.forEach(p => { let k = 0; p.trous.forEach(t => { if (!t[1] && t[0] && k < 2) { t[0] = 0; k++; } }); });
ok(sg(m4, 'depart') < sg(base, 'depart') - 1.5, 'deux départs coûteux de plus pèsent sur la mise en jeu');
ok(sg(m4, 'attaque') > sg(base, 'attaque') + 1, 'et déchargent d\'autant les attaques de green');
/* La somme des secteurs est l'écart de score estimé par le modèle. */
function ecartModele(parties, idx) {
  const c = E.cumulParties(parties, 90), k = 18 / c.T, R = E.repereSG(idx);
  const joueur = (c.M + c.P + c.X + D.SG_RECENTRAGE * c.U) * k;
  const cible = (18 - R.gir) + R.gir * R.pg + (18 - R.gir) * R.pm + R.x + D.SG_RECENTRAGE * R.u;
  return joueur - cible;
}
let graine = 7; const alea = () => (graine = (graine * 16807) % 2147483647) / 2147483647;
for (let essai = 0; essai < 300; essai++) {
  const parties = [];
  for (let k = 0; k < 1 + Math.floor(alea() * 5); k++) {
    const trous = [];
    for (let i = 0; i < (alea() < 0.3 ? 9 : 18); i++) trous.push([alea() < 0.6 ? 1 : 0, alea() < 0.3 ? 1 : 0, Math.floor(alea() * 5), alea() < 0.15 ? 1 + Math.floor(alea() * 3) : 0]);
    parties.push({ d: 'x', trous });
  }
  const idx = D.SG_CIBLES[Math.floor(alea() * D.SG_CIBLES.length)], r = E.coupsGagnes(parties, idx);
  if (!r) continue;
  if (r.secteurs.some(x => x.sg == null && x.id !== 'rattrapage')) continue;
  proche(r.total, -ecartModele(parties, idx), 0.3, 'somme des secteurs = écart de score du modèle');
  proche(r.total, r.secteurs.reduce((a, x) => a + (x.sg || 0), 0), 0.051, 'total = somme des valeurs affichées');
}
/* Aucun green touché : putting non mesuré, pas d'erreur. */
let r0 = E.coupsGagnes([{ d: 'a', trous: t18.map(t => [t[0], 0, t[2], t[3]]) }], 36);
ok(r0.secteurs.find(x => x.id === 'putting').sg === null && r0.joueur.pg === null && isFinite(r0.total), 'aucun green touché');

/* --- Défis --- */
const onze = E.DEFI.onze; let Dd = E.defiNeuf(), evt;
ok(E.niveauVise(onze, Dd) === 1 && E.cibleDefi(onze, Dd) === 5, 'niveau 1 au départ');
for (let i = 0; i < 4; i++) ok(E.defiCoup(onze, Dd, true, 'd') === null, 'série en cours');
evt = E.defiCoup(onze, Dd, true, 'd');
ok(evt.type === 'reussi' && evt.niveau === 1 && evt.v === 5 && Dd.niv === 1 && Dd.parNiv[0] === 1 && Dd.essais === 1 && Dd.eN === 0, 'niveau 1 validé au premier essai');
ok(E.cibleDefi(onze, Dd) === 8 && Dd.cours.s === 0 && Dd.cours.m === 5 && Dd.cours.e === 1, 'niveau 2 en jeu');
for (let i = 0; i < 3; i++) E.defiCoup(onze, Dd, true, 'd');
evt = E.defiCoup(onze, Dd, false, 'd');
ok(evt.type === 'rate' && evt.v === 3 && evt.niveau === null && Dd.essais === 2 && Dd.eN === 1 && Dd.record === 5 && Dd.coups === 9 && Dd.ok === 8, 'raté : nouvel essai');
evt = E.defiCoup(onze, Dd, false, 'd');
ok(evt.v === 0 && Dd.essais === 3 && Dd.hist.length === 3, 'raté au premier putt');
for (let i = 0; i < 8; i++) evt = E.defiCoup(onze, Dd, true, 'd');
ok(evt.niveau === 2 && Dd.parNiv[1] === 3 && Dd.record === 8, 'niveau 2 au troisième essai');
for (let i = 0; i < 11; i++) evt = E.defiCoup(onze, Dd, true, 'd');
ok(evt.niveau === 3 && Dd.niv === 3 && E.niveauVise(onze, Dd) === 3 && E.cibleDefi(onze, Dd) === 11, 'défi bouclé');
for (let i = 0; i < 11; i++) evt = E.defiCoup(onze, Dd, true, 'd');
ok(evt.type === 'reussi' && evt.niveau === null && Dd.niv === 3 && Dd.record === 11, 'rejoué après bouclage');
E.defiCoup(onze, Dd, true, 'd'); E.defiCoup(onze, Dd, true, 'd');
ok(E.defiFinSeance(onze, Dd) === 11 && Dd.cours === null, 'fin de séance : meilleure série');
ok(E.defiFinSeance(onze, Dd) === null, 'fin de séance sans coup');
const dix = E.DEFI.approches; Dd = E.defiNeuf();
[1, 0, 1, 1, 0, 0, 1, 0, 0].forEach(v => ok(E.defiCoup(dix, Dd, !!v, 'd') === null, 'comptage en cours'));
evt = E.defiCoup(dix, Dd, true, 'd');
ok(evt.type === 'reussi' && evt.v === 5 && evt.niveau === 2 && evt.nb === 2 && Dd.niv === 2 && Dd.parNiv[0] === 1 && Dd.parNiv[1] === 1 && Dd.cours === null && Dd.record === 5 && Dd.coups === 10 && Dd.ok === 5 && evt.l.length === 10, '5 sur 10 valide les niveaux 1 et 2');
for (let i = 0; i < 10; i++) evt = E.defiCoup(dix, Dd, i < 4, 'd');
ok(evt.type === 'rate' && evt.v === 4 && evt.cible === 7 && evt.niveau === null && Dd.niv === 2 && Dd.eN === 1, '4 sur 10 ne valide pas le niveau 3');
D.DEFIS.forEach(d => {
  ok(B.DOMAINES.some(x => x.id === d.d) && B.LIEUX.some(x => x.id === d.lieu), 'domaine et lieu du défi ' + d.id);
  ok(d.niveaux.length === 3 && d.niveaux.every((x, i) => i === 0 || x.cible >= d.niveaux[i - 1].cible), 'niveaux croissants ' + d.id);
  if (d.mode === 'compte') ok([10, 20].includes(d.n) && d.niveaux.every(x => x.cible <= d.n), 'cibles atteignables ' + d.id);
});


/* --- Carte de score : statistiques d'un trou noté --- */
const T9 = (j, g, p, x, s, par, c, cl, p1) => [j, g, p, x, s, par, c || 0, cl || 0, p1 || 0];
ok(E.scoreSuggere(4, 0, 2, 0) === 5 && E.scoreSuggere(4, 1, 2, 0) === 4 && E.scoreSuggere(3, 1, 0, 0) === 1 && E.scoreSuggere(5, 0, 3, 2) === 9, 'score suggéré');
ok(E.scoreMini(2, 1) === 4 && E.scoreMini(0, 0) === 1, 'score minimal');
ok(E.trouNote(T9(1, 0, 2, 0, 5, 4)) && !E.trouNote([1, 0, 2, 0]) && !E.trouNote(T9(1, 0, 2, 0, 0, 4)) && !E.trouNote(null), 'trou noté');
st = E.statsTrous([T9(1, 1, 2, 0, 4, 4, 0, 1, 4), T9(0, 0, 2, 1, 8, 4, 3, 1, 2), T9(1, 0, 1, 0, 3, 3, 0, 0, 1), T9(1, 0, 3, 0, 7, 4, 0, 2, 3), [1, 0, 2, 0]]);
ok(st.T === 5 && st.N === 4 && st.S === 22 && st.PAR === 15 && st.C === 2 && st.MN === 3 && st.SV === 1, 'score, par, catastrophes, pars sauvés : ' + JSON.stringify(st));
ok(st.E === 0 + 2 + 0 + 1, 'coups de rattrapage : ' + st.E);
ok(st.Gb === 1 && st.PGb === 2 && st.g4 === 1 && st.Mb === 3 && st.PMb === 6 && st.m2 === 1 && st.m1 === 1 && st.m3 === 1, 'premiers putts par longueur');
ok(E.statsTrous(t18).N === 0 && E.statsTrous(t18).E === 0, 'anciennes parties : aucun trou noté');
const sp = E.scorePartie({ trous: [T9(1, 1, 2, 0, 4, 4), T9(1, 0, 2, 0, 6, 5)] });
ok(sp.complet && sp.coups === 10 && sp.par === 9 && sp.ecart === 1 && !E.scorePartie({ trous: [T9(1, 1, 2, 0, 4, 4), [1, 0, 2, 0]] }).complet, 'score d\'une partie');
/* Partie réaliste tirée au sort, avec score, par et réponses détaillées. */
function partieNotee(g, opts) {
  opts = opts || {}; let gr = g; const al = () => (gr = (gr * 48271) % 2147483647) / 2147483647;
  for (let i = 0; i < 5; i++) al();
  const pars = opts.pars || [4, 5, 3, 4, 4, 3, 5, 4, 4, 4, 4, 3, 5, 4, 4, 4, 3, 5];
  return pars.map(par => {
    const j = al() < 0.6 ? 1 : 0, gir = al() < 0.3 ? 1 : 0, p = al() < 0.15 ? 3 : al() < 0.3 ? 1 : 2, x = al() < 0.12 ? 1 : 0, extra = gir ? 0 : (al() < 0.4 ? 1 : al() < 0.2 ? 2 : 0);
    const t = [j, gir, p, x, par - 2 + (gir ? 0 : 1) + p + x + extra, par, j ? 0 : 1 + Math.floor(al() * 3), par === 3 ? 0 : 1 + Math.floor(al() * 4), opts.detail === false ? 0 : 1 + Math.floor(al() * 4)];
    if (opts.detail === false) { t[6] = 0; t[7] = 0; }
    return t;
  });
}
ind = E.indicateursParties([{ d: 'a', trous: partieNotee(3) }]);
ok(ind.vals.strat_cata === E.statsTrous(partieNotee(3)).C, 'trous catastrophe reportés au bilan');
ok(!('strat_cata' in E.indicateursParties([{ d: 'a', trous: t18 }]).vals), 'pas de trous catastrophe sans score');

/* --- Repères ajoutés : score, 3 putts, catastrophes, rattrapage --- */
[[45, 0], [30, 1], [18, 2], [6, 3]].forEach(([idx, p]) => {
  const R = E.repereSG(idx);
  proche(R.p3, repInd('putt_3')[p], 0.6, 'greens à 3 putts, index ' + idx);
  proche(R.cata, repInd('strat_cata')[p], 0.6, 'trous catastrophe, index ' + idx);
});
prec = null;
for (let i = 0; i <= 54; i += 0.5) {
  const R = E.repereSG(i), O = E.objectifs(i);
  ok(R.e > 1 && R.e >= D.SG_RECENTRAGE * R.u, 'rattrapage positif et au moins égal au forfait de recentrage, index ' + i + ' : ' + R.e.toFixed(2));
  proche(R.s, (18 - R.gir) + (R.gir * R.pg + (18 - R.gir) * R.pm) + R.x + R.e - 36, 1e-9, 'score = greens manqués + putts + pénalités + rattrapage, index ' + i);
  if (prec) ok(R.s >= prec.s && R.p3 >= prec.p3 && R.cata >= prec.cata && R.sv <= prec.sv && R.e >= prec.e, 'repères de score monotones à l\'index ' + i);
  ok(O.jeu > 0 && O.jeu < 18 && Math.abs(O.putts - (R.gir * R.pg + (18 - R.gir) * R.pm)) < 1e-9 && O.score === R.s, 'objectifs cohérents à l\'index ' + i);
  for (let b = 1; b <= 4; b++) ok(E.puttsAttendus(i, b) > (b > 1 ? E.puttsAttendus(i, b - 1) : 1) && (!prec || E.puttsAttendus(i, b) >= E.puttsAttendus(i - 0.5, b)), 'putts attendus croissants avec la distance et l\'index');
  prec = R;
}

/* --- Coups gagnés avec score : le total est l'écart de score réel --- */
graine = 99;
for (let essai = 0; essai < 200; essai++) {
  const parties = [];
  for (let k = 0; k < 1 + Math.floor(alea() * 4); k++) parties.push({ d: 'x', trous: partieNotee(1000 + essai * 7 + k, { detail: alea() < 0.5 }).slice(0, alea() < 0.3 ? 9 : 18) });
  const idx = D.SG_CIBLES[Math.floor(alea() * D.SG_CIBLES.length)], r = E.coupsGagnes(parties, idx), c = E.cumulParties(parties, 90);
  if (r.secteurs.some(x => x.sg == null)) continue;
  const reel = (c.S - c.PAR) * 18 / c.T;
  proche(r.total, E.repereSG(idx).s - reel, 0.31, 'total des secteurs = écart de score réel avec la cible');
  proche(r.joueur.s, reel, 0.051, 'score moyen affiché');
  /* La longueur du premier putt redistribue les coups entre attaque, petit jeu et putting, sans changer leur somme. */
  const sans = E.coupsGagnes(parties.map(p => ({ d: p.d, trous: p.trous.map(t => t.slice(0, 8).concat([0])) })), idx);
  const trois = x => ['attaque', 'petit', 'putting'].reduce((a, id) => a + x.secteurs.find(s => s.id === id).sg, 0);
  proche(trois(r), trois(sans), 0.31, 'premier putt : somme attaque + petit jeu + putting inchangée');
  ['depart', 'penal', 'rattrapage'].forEach(id => ok(r.secteurs.find(s => s.id === id).sg === sans.secteurs.find(s => s.id === id).sg, 'premier putt : secteur ' + id + ' inchangé'));
}
/* Sens du partage : laisser la balle près du trou crédite le coup d'avant, pas le putting. */
const pres = [], loin = [];
for (let i = 0; i < 18; i++) { pres.push(T9(1, 0, 1, 0, 4, 4, 0, 0, 1)); loin.push(T9(1, 0, 1, 0, 4, 4, 0, 0, 4)); }
const sgP = (l, id) => E.coupsGagnes([{ d: 'a', trous: l }], 20).secteurs.find(x => x.id === id).sg;
ok(sgP(pres, 'petit') > sgP(loin, 'petit') + 15 && sgP(pres, 'putting') < sgP(loin, 'putting') - 15, 'approche donnée : crédit au petit jeu ; long putt rentré : crédit au putting');
proche(sgP(pres, 'petit') + sgP(pres, 'putting'), sgP(loin, 'petit') + sgP(loin, 'putting'), 0.11, 'même total dans les deux cas');
/* Un coup de rattrapage de plus par trou coûte 18 coups, et le forfait de recentrage disparaît. */
const b18 = partieNotee(8), plus = b18.map(t => { const c = t.slice(); c[4]++; return c; });
proche(sgP(plus, 'rattrapage') - sgP(b18, 'rattrapage'), -18, 0.11, 'rattrapage : un coup de plus par trou');
const sansScore = b18.map(t => t.slice(0, 4));
const dep = (l) => E.coupsGagnes([{ d: 'a', trous: l }], 20);
ok(dep(sansScore).secteurs.find(x => x.id === 'rattrapage').sg === null && dep(sansScore).joueur.s === null && dep(b18).joueur.s !== null, 'rattrapage non mesuré sans score');
const R20 = E.repereSG(20), u8 = E.statsTrous(b18).U;
proche(dep(sansScore).secteurs[0].sg - dep(b18).secteurs[0].sg, -(u8 - R20.u) * D.SG_RECENTRAGE, 0.11, 'forfait de recentrage retiré quand le score est noté');

/* --- Objectifs et tendance --- */
ok(E.statsFenetre([], 5) === null, 'pas de fenêtre sans partie');
const serie = [10, 11, 12, 13, 14, 15].map((g, i) => ({ d: 'd' + i, trous: partieNotee(g).map(t => { const c = t.slice(); if (i >= 3) { c[1] = 1; c[4] = c[5] - 2 + c[2] + c[3]; } return c; }) }));
let fen = E.statsFenetre(serie, 5);
ok(fen.n === 5 && fen.serie.length === 5 && fen.vals.gir > 10 && fen.tendance.gir === 'mieux' && fen.tendance.score === 'mieux', 'tendance : greens et score en progrès : ' + JSON.stringify(fen.tendance));
ok(E.statsFenetre(serie.slice().reverse(), 6).tendance.gir === 'moins', 'tendance en recul');
ok(Object.keys(E.statsFenetre(serie, 3).tendance).length === 0 && E.statsFenetre(serie, 20).n === 6, 'pas de tendance sous 4 parties ; fenêtre plus large que l\'historique');
fen = E.statsFenetre([{ d: 'a', trous: t18 }], 5);
ok(fen.vals.score === null && fen.vals.cata === null && fen.vals.sv === null && fen.vals.gir === 4 && fen.vals.putts === 39, 'sans score : lignes de score vides');
const stGir = D.OBJ_STATS.find(x => x.id === 'gir'), stPutts = D.OBJ_STATS.find(x => x.id === 'putts');
ok(E.etatObjectif(stGir, 7, 5.6) === 'dessus' && E.etatObjectif(stGir, 4, 5.6) === 'dessous' && E.etatObjectif(stGir, 5.3, 5.6) === 'repere' && E.etatObjectif(stPutts, 30, 33.8) === 'dessus' && E.etatObjectif(stPutts, 36, 33.8) === 'dessous' && E.etatObjectif(stGir, null, 5) === null, 'position face à l\'objectif');
D.OBJ_STATS.forEach(x => ok(x.id in E.objectifs(15) && x.seuil > 0, 'objectif défini pour ' + x.id));

/* --- Index estimé --- */
const plat = (sc, n) => { const l = []; for (let i = 0; i < n; i++) l.push(T9(1, 0, 2, 0, 4 + (i < sc ? 1 : 0), 4)); return l; };
let df = E.differentiel({ trous: plat(18, 18) }, null, 18);
ok(df.v === 18 && df.ajuste === 90, '18 trous, 90 coups sur un par 72 : différentiel 18');
df = E.differentiel({ trous: plat(18, 18) }, { pars: new Array(18).fill(4), sss: 70, slope: 130 }, 18);
proche(df.v, 113 / 130 * (90 - 70), 0.051, 'différentiel avec SSS et slope');
df = E.differentiel({ trous: plat(0, 9) }, null, 14);
proche(df.v, 0.52 * 14 + 1.2, 0.051, '9 trous dans le par, index 14 : score attendu sur les 9 autres');
const gros = plat(18, 18); gros[0] = T9(0, 0, 3, 3, 13, 4);
ok(E.differentiel({ trous: gros }, null, 18).ajuste === 17 * 5 + 7, 'trou plafonné au double bogey net');
ok(E.differentiel({ trous: plat(18, 18).map((t, i) => (i ? t : [1, 0, 2, 0])) }, null, 18) === null && E.differentiel({ trous: plat(8, 8) }, null, 18) === null, 'pas de différentiel sans score complet ni sous 9 trous');
const pd = v => ({ trous: plat(v, 18) });
ok(E.indexEstime([pd(10), pd(12)], null, 18).v === null && E.indexEstime([pd(10), pd(12)], null, 18).n === 2, 'moins de 3 parties : pas d\'index');
ok(E.indexEstime([pd(10), pd(12), pd(15)], null, 18).v === 8, '3 parties : la meilleure moins 2');
ok(E.indexEstime([pd(10), pd(12), pd(15), pd(11), pd(14)], null, 18).v === 10, '5 parties : la meilleure');
ok(E.indexEstime([pd(10), pd(12), pd(15), pd(11), pd(14), pd(13)], null, 18).v === 9.5, '6 parties : moyenne des 2 meilleures, moins 1');
const vingt = []; for (let i = 0; i < 24; i++) vingt.push(pd(i < 4 ? 0 : i - 4));
ok(E.indexEstime(vingt, null, 18).v === 3.5 && E.indexEstime(vingt, null, 18).n === 20, '20 dernières parties : moyenne des 8 meilleures');
ok(E.indexEstime([pd(10), { trous: t18 }, pd(12), pd(15)], null, 18).n === 3, 'parties sans score ignorées');
ok(E.indexEstime([pd(0), pd(0), pd(0)], null, 0).v === 0 && E.indexEstime([pd(18), pd(18), pd(18)].map(p => ({ trous: p.trous.map(t => { const c = t.slice(); c[4] = 15; return c; }) })), null, 54).v <= 54, 'index borné entre 0 et 54');
ok(D.WHS_BAREME.length === 21 && D.WHS_BAREME.slice(3).every((r, i, l) => !i || r[0] >= l[i - 1][0]), 'barème complet et croissant');

/* --- Parcours et trous noirs --- */
const PC = { id: 'p1', pars: [4, 5, 3, 4, 4, 3, 5, 4, 4, 4, 4, 3, 5, 4, 4, 4, 3, 5] };
const rondes = [1, 2, 3, 4].map(g => { const tr = partieNotee(50 + g, { pars: PC.pars }); tr[6] = T9(0, 0, 2, 2, 11, 5, 3, 1, 2); tr[13] = T9(1, 1, 4, 0, 6, 4, 0, 1, 4); return { d: 'r' + g, pc: 'p1', o: 0, trous: tr }; });
an = E.analyseParcours(rondes.concat([{ d: 'z', pc: 'p2', o: 0, trous: partieNotee(9) }, { d: 'y', pc: null, trous: partieNotee(9) }]), PC);
ok(an.n === 4 && an.trous.length === 18 && an.trous[6].N === 4 && an.trous[6].moy === 6 && an.trous[13].putts === 4, 'parties du parcours seulement, moyennes par trou');
ok(an.noirs[0].h === 6 && an.noirs.some(x => x.h === 13) && an.noirs.length <= 3 && an.assez, 'trous noirs repérés : ' + an.noirs.map(x => x.h + 1).join(','));
ok(an.noirs[0].causes[0].id === 'long' && an.noirs[0].causes[1].id === 'penal' && an.noirs.find(x => x.h === 13).causes[0].id === 'putts', 'causes : ' + JSON.stringify(an.noirs.map(x => x.causes.map(c => c.id))));
proche(an.surcout, an.noirs.reduce((a, x) => a + x.moy - an.moyTrou, 0), 1e-9, 'surcoût des trous noirs');
ok(E.coteDominant(an.trous[6].cotes, 2) === 3 && an.trous[6].clubs[1][0] === 4 && an.trous[6].clubs[1][1] === 0, 'côté et club relevés sur le trou');
/* Le retour commence au trou 10 ; un neuf trous joué deux fois repasse par les mêmes trous. */
const retour = E.analyseParcours([{ d: 'a', pc: 'p1', o: 9, trous: partieNotee(4, { pars: PC.pars.slice(9) }) }], PC);
ok(retour.trous[0].n === 0 && retour.trous[9].n === 1 && retour.trous[17].n === 1 && !retour.assez && retour.noirs.length === 0, 'retour : trous 10 à 18, pas de trou noir sur un seul passage');
const neuf = E.analyseParcours([{ d: 'a', pc: 'p9', o: 0, trous: partieNotee(4) }], { id: 'p9', pars: PC.pars.slice(0, 9) });
ok(neuf.trous.length === 9 && neuf.trous.every(x => x.n === 2) && neuf.assez, 'neuf trous joué deux fois : deux passages par trou');
ok(E.analyseParcours([], PC).N === 0 && E.analyseParcours([], PC).moyTrou === null, 'parcours sans partie');
ok(E.causesTrou({ par: 3, pen: 0, jeu: 1, gir: 0, putts: 2, extra: 1.2 }).map(c => c.id).join('+') === 'autour+par3' && E.causesTrou({ par: 4, pen: 0, jeu: 0.9, gir: 0.5, putts: 2, extra: 0.2 })[0].id === 'general' && E.causesTrou({ par: 4, pen: 0, jeu: 0.25, gir: 0, putts: 2, extra: 0.3 })[0].id === 'depart', 'causes d\'un trou');
ok(E.coteDominant([0, 1, 0, 1], 2) === 0 && E.coteDominant([0, 4, 1, 1], 5) === 1 && E.coteDominant([0, 3, 0, 0], 5) === 0, 'côté dominant : 60 % au moins, et assez de relevés');

/* --- Relevés de la saisie détaillée --- */
const rel = E.releveDetail([{ d: 'a', trous: [T9(0, 0, 3, 0, 7, 4, 3, 1, 4), T9(1, 0, 1, 0, 4, 4, 0, 2, 2), T9(1, 1, 2, 0, 4, 4, 0, 1, 3), T9(0, 0, 2, 0, 6, 4, 0, 0, 0), T9(1, 0, 0, 0, 3, 4, 0, 1, 0)] }], 90);
ok(rel.T === 5 && rel.nCotes === 1 && rel.cotes[3] === 1 && rel.clubs[1][0] === 3 && rel.clubs[1][1] === 2 && rel.clubs[2][0] === 1, 'côtés et clubs');
ok(rel.nP1 === 3 && rel.p1[4][0] === 1 && rel.p1[4][2] === 1 && rel.p1[2][1] === 1 && rel.nApp === 2 && rel.app[4] === 1 && rel.app[2] === 1, 'premiers putts : ' + JSON.stringify(rel.p1) + ' ' + JSON.stringify(rel.app));
ok(E.releveDetail([{ d: 'a', trous: t18 }], 90).nP1 === 0 && E.releveDetail([], 90).T === 0, 'aucun relevé sur une ancienne partie');

/* --- Modèle unifié des données collectées --- */
{
  const parties = [{ d: '2026-11-19', o: 9, coups: [[
    { c: 'f7', d: 145, source: 'gps', distanceType: 'total', mesureLe: 123, g: [46, 2, 46.001, 2] },
    { c: 'pw', d: 90 }
  ]] }];
  const carnet = { series: [{ d: '2026-11-18', c: 'f7', v: [137, 140], l: [-3, 5] }] };
  const r = E.observationsGolf(parties, carnet), q = E.qualiteObservations(r);
  ok(r.length === 4 && r[0].type === 'coup' && r[0].trou === 10, 'observations parcours et practice unifiées');
  ok(r[0].origine === 'gps' && r[0].distanceType === 'total' && r[1].origine === 'inconnu', 'provenance connue ou explicitement inconnue');
  ok(r[2].type === 'practice' && r[2].distanceType === 'carry' && r[2].deviation === -3, 'distance practice avec dispersion');
  ok(q.total === 4 && q.gps === 1 && q.distance === 4 && q.origineConnue === 3, 'qualité et comptage des sources');
  ok(E.qualiteObservations([]).total === 0 && E.observationsGolf([], {}).length === 0, 'cas vide');
}

console.log(n + ' vérifications · ' + ko + ' échec' + (ko > 1 ? 's' : ''));
process.exit(ko ? 1 : 0);
