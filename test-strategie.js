/* Tests des calculs de stratégie et d'analyse. */
const S = require('./src/engine-strategie.js');
const A = require('./src/engine-analyse.js');
const D = require('./src/data-strategie.js');
const E = Object.assign({}, require('./src/data-plus.js'), require('./src/engine-plus.js'));
let ko = 0, n = 0;
function ok(c, m) { n++; if (!c) { ko++; console.log('ÉCHEC :', m); } }
function proche(a, b, tol, m) { ok(Math.abs(a - b) <= tol, m + ' (obtenu ' + a + ', attendu ' + b + ')'); }

/* --- Étalonnage --- */
{
  const f = S.filtrerPleins([145, 150, 60, 148, 152, 147, 80]);
  ok(f.med === 147 && f.ecartes.join(',') === '60,80' && f.gardes.length === 5, 'coups sous 60 % de la médiane écartés : ' + JSON.stringify(f));
  const fo = S.fourchette([140, 142, 144, 146, 148, 150, 152, 154, 156, 70]);
  ok(fo.n === 9 && fo.ecartes === 1 && !fo.provisoire, 'fourchette sur 9 coups gardés');
  ok(fo.bas === 144 && fo.haut === 152 && fo.med === 148, 'fourchette P25–P75 : ' + fo.bas + '–' + fo.haut + ' (méd ' + fo.med + ')');
  ok(fo.p10 === 142 && fo.p90 === 154, 'P10 et P90 : ' + fo.p10 + ' ' + fo.p90);
  const pr = S.fourchette([140, 150, 145]);
  ok(pr.provisoire && pr.bas === 140 && pr.haut === 150, 'moins de 5 coups : fourchette provisoire du plus court au plus long');
  ok(S.fourchette([]) === null && S.fourchette(null) === null, 'aucun coup');
  const la = S.lateral([-10, -4, 0, 2, 6, 8, -2, 4, 12, 4]);
  ok(la.biais === 2 && !la.provisoire, 'tendance latérale : ' + la.biais);
  proche(la.demi, 6.5, 0.6, 'demi-largeur à 80 %');
  ok(S.lateral([3, 4]).provisoire && S.lateral([]) === null, 'latéral provisoire sous 5 coups');
  const el = S.ellipseClub([140, 142, 144, 146, 148, 150, 152, 154, 156], [-10, -4, 0, 2, 6, 8, -2, 4, 12, 4], 18);
  ok(el.d === 148 && el.cx === 2 && !el.estimeeL && !el.estimeeP && el.ry === 6, 'ellipse mesurée : ' + JSON.stringify(el));
  const es = S.ellipseClub([150, 148, 152], [], 18);
  ok(es.estimeeL && es.estimeeP && es.cx === 0, 'ellipse estimée sans direction notée');
  proche(es.rx, 150 * 0.077, 1, 'largeur estimée à l\'index 18');
  ok(S.ellipseClub([150, 150, 150, 150, 150, 150], [], 0).ry >= 2, 'profondeur minimale de 2 m');
  const cc = S.coupsClub([{ d: 150, l: -3 }, { d: 140 }, { d: null, l: 4 }, null]);
  ok(cc.d.join(',') === '150,140' && cc.l.join(',') === '-3', 'coups d\'un club : distances et écarts');
}

/* --- Se joue comme --- */
{
  const r = S.seJoueComme(150, { vent: 'face', force: 2, pente: 5, temp: 'froid' });
  ok(r.d === 150 + 18 + 5 + 3 && r.detail.length === 3 && r.derive === 0, 'vent de face moyen, montée de 5 m, froid : ' + r.d);
  ok(S.seJoueComme(150, { vent: 'dos', force: 3, pente: -10, temp: 'chaud' }).d === 126, 'vent de dos fort, descente, chaud : ' + S.seJoueComme(150, { vent: 'dos', force: 3, pente: -10, temp: 'chaud' }).d);
  const tr = S.seJoueComme(150, { vent: 'gauche', force: 3 });
  ok(tr.d === 150 && tr.derive === 15, 'vent de gauche : dérive vers la droite, sans changer la distance');
  ok(S.seJoueComme(150, { vent: 'droite', force: 1 }).derive === -5, 'vent de droite : dérive à gauche');
  ok(S.seJoueComme(150, {}).d === 150 && S.seJoueComme(150, {}).detail.length === 0, 'sans conditions : distance brute');
  ok(S.seJoueComme(0, {}) === null && S.seJoueComme('x', {}) === null, 'distance invalide');
  ok(S.seJoueComme(100, { pente: 99 }).d === 130, 'pente bornée à 30 m');
}

/* --- Club conseillé --- */
{
  const clubs = [{ id: 'f6', f: { bas: 152, haut: 160, med: 156 } }, { id: 'f7', f: { bas: 142, haut: 150, med: 146 } }, { id: 'f8', f: { bas: 132, haut: 140, med: 136 } }, { id: 'f9', f: null }];
  ok(S.clubPour(147, clubs).id === 'f7' && S.clubPour(147, clubs).dans, 'distance dans la fourchette du fer 7');
  ok(S.clubPour(150.6, clubs).id === 'f7' && !S.clubPour(150.6, clubs).dans, 'entre deux fourchettes : la médiane la plus proche');
  ok(S.clubPour(151, clubs).id === 'f6', 'à égale distance de deux clubs : le plus long');
  ok(S.clubPour(170, clubs).id === 'f6', 'au-delà : le club le plus long');
  ok(S.clubPour(150, []) === null && S.clubPour(null, clubs) === null, 'sans club mesuré');
}

/* --- Visée --- */
{
  proche(S.phi(0), 0.5, 1e-6, 'phi(0)'); proche(S.phi(1.2816), 0.9, 1e-3, 'phi(1,28)'); proche(S.phi(-1.96), 0.025, 1e-3, 'phi(−1,96)');
  const ell = { rx: 10, ry: 8, cx: 0 };
  const libre = S.viser({ ell, green: 'm', drapeau: { p: 'milieu', c: 'centre' }, dangers: {} });
  ok(libre.visee.ax === 0 && libre.visee.ay === 0, 'sans danger, drapeau au centre : on vise le drapeau');
  const eau = S.viser({ ell, green: 'm', drapeau: { p: 'milieu', c: 'gauche' }, dangers: { g: 'eau' } });
  ok(eau.visee.ax > 0 && eau.visee.pd < eau.drapeau.pd && eau.gain > 0, 'eau à gauche, drapeau à gauche : viser à droite (' + eau.visee.ax + ' m, danger ' + Math.round(eau.visee.pd * 100) + ' % au lieu de ' + Math.round(eau.drapeau.pd * 100) + ' %)');
  const hl = S.viser({ ell, green: 'm', drapeau: { p: 'milieu', c: 'gauche' }, dangers: { g: 'hl' } });
  const bk = S.viser({ ell, green: 'm', drapeau: { p: 'milieu', c: 'gauche' }, dangers: { g: 'bunker' } });
  ok(hl.visee.ax >= eau.visee.ax && eau.visee.ax >= bk.visee.ax, 'plus le danger coûte, plus on s\'en écarte : ' + [bk.visee.ax, eau.visee.ax, hl.visee.ax].join(' ≤ '));
  const biais = S.viser({ ell: { rx: 10, ry: 8, cx: 6 }, green: 'm', drapeau: {}, dangers: {} });
  ok(biais.visee.ax === -6, 'balle qui part à droite de 6 m : viser 6 m à gauche (' + biais.visee.ax + ')');
  const vent = S.viser({ ell, derive: 5, green: 'm', drapeau: {}, dangers: {} });
  ok(vent.visee.ax === -5, 'vent de gauche qui déporte de 5 m : viser 5 m à gauche');
  const court = S.viser({ ell, green: 'm', drapeau: { p: 'avant', c: 'centre' }, dangers: { c: 'eau' } });
  ok(court.visee.ay > 0, 'eau devant, drapeau à l\'avant : viser plus long (' + court.visee.ay + ' m)');
  ok(eau.visee.sur >= 0 && eau.visee.sur <= 1 && eau.visee.pg <= eau.visee.sur + 1e-9, 'parts cohérentes');
  ok(S.libVisee(-8, 0) === 'Vise 8 m à gauche du drapeau' && S.libVisee(3, 4) === 'Vise 3 m à droite du drapeau, 4 m plus long' && S.libVisee(0, -5) === 'Vise 5 m plus court que le drapeau' && S.libVisee(0, 1) === 'Vise le drapeau', 'phrases de visée');
  ok(S.viser(null) === null, 'sans ellipse');
}

/* --- Erreurs évitables --- */
{
  const t = (j, g, p, x, s, par, p1, ev, bk) => [j, g, p, x, s, par, 0, 0, p1, ev, bk];
  ok(JSON.stringify(A.erreursTrou(t(1, 0, 3, 0, 6, 4, 3, 0, 0))) === '{"pen":0,"double":0,"putt3":1}', '3 putts depuis 2 à 5 m : erreur automatique');
  ok(A.erreursTrou(t(1, 0, 3, 0, 6, 4, 4, 0, 0)).putt3 === 0, '3 putts depuis 5 à 10 m : pas une erreur courte');
  ok(A.erreursTrou(t(1, 0, 3, 0, 6, 4, 0, D.EVIT_PUTT3, 0)).putt3 === 1, '3 putts courts marqués à la main');
  ok(A.erreursTrou(t(1, 0, 2, 0, 5, 4, 0, D.EVIT_PUTT3, 0)).putt3 === 0, 'marque sans 3 putts : ignorée');
  ok(A.erreursTrou(t(0, 0, 2, 2, 7, 4, 0, D.EVIT_DOUBLE, 0)).pen === 2 && A.erreursTrou(t(0, 0, 2, 2, 7, 4, 0, D.EVIT_DOUBLE, 0)).double === 1, 'pénalités et double approche');
  ok(A.erreursTrou([1, 0, 3, 0, 6, 4, 0, 0, 2]).putt3 === 1 && A.erreursTrou([1, 0, 3, 0, 6, 4, 0, 0, 3]).putt3 === 0, 'ancienne échelle : 1 à 3 m compte, 3 à 8 m non');
  const pt = { trous: [t(1, 0, 3, 0, 6, 4, 2, 0, 0), t(0, 0, 2, 1, 6, 4, 0, D.EVIT_DOUBLE, 0), t(1, 1, 2, 0, 4, 4, 4, 0, 0)], o: 0 };
  const ep = A.erreursPartie(pt);
  ok(ep.total === 3 && ep.trous.map(x => x.h).join(',') === '0,1', 'erreurs d\'une partie : ' + JSON.stringify(ep));
  const pts = []; for (let i = 0; i < 2; i++) pts.push({ trous: Array.from({ length: 18 }, (_, k) => k === 3 ? t(0, 0, 2, 1, 7, 4, 0, D.EVIT_DOUBLE, 0) : k === 7 ? t(1, 0, 3, 0, 6, 4, 2, 0, 0) : t(1, 1, 2, 0, 4, 4, 3, 0, 0)) });
  const ee = A.erreursEvitables(pts, 90);
  ok(ee.pen === 1 && ee.double === 1 && ee.putt3 === 1 && ee.erreurs === 3 && ee.coups === 3 && ee.n === 2, 'moyennes par partie : ' + JSON.stringify(ee));
  ok(A.erreursEvitables([{ trous: [[1, 0, 2, 1, 6, 4, 0, 0, 0]] }]).double === null, 'doubles approches non mesurables sur les anciens trous');
  ok(A.erreursEvitables([]) === null, 'sans partie');
}

/* --- Notes, comparaison, priorité --- */
{
  ok(A.indexEquivalent(D.REPERES_PLUS.jouable[3], D.REPERES_PLUS.jouable) === 15, 'index équivalent sur un repère exact');
  proche(A.indexEquivalent(5.6 - (5.6 - 4.6) / 2, E.SG_REPERES.gir), 17.5, 0.01, 'index équivalent interpolé (GIR)');
  ok(A.indexEquivalent(99, D.REPERES_PLUS.jouable) === 0 && A.indexEquivalent(0, D.REPERES_PLUS.jouable) === 54, 'bornes 0 et 54');
  ok(A.indexEquivalent(3.0, E.SG_REPERES.p3) === 15, 'repère décroissant (3 putts)');
  /* Un joueur d'index 18 environ : 4 parties de 18 trous */
  const partie = g => Array.from({ length: 18 }, (_, k) => {
    const par = [4, 4, 3, 5][k % 4], gir = (k + g) % 4 === 0 ? 1 : 0, p1 = gir ? 4 : (k % 3 === 0 ? 2 : 3), putts = (k + g) % 6 === 0 ? 3 : (k % 5 === 0 ? 1 : 2);
    const s = par - 2 + (gir ? 0 : 1) + putts + (k === 9 ? 1 : 0) + (k % 7 === 2 ? 1 : 0);
    return [par === 3 ? 1 : (k % 3 === 1 ? 0 : 1), s - putts <= par - 2 ? 1 : 0, putts, k === 9 ? 1 : 0, s, par, 0, 0, p1, k % 7 === 2 ? D.EVIT_DOUBLE : 0, k % 9 === 4 ? (k % 2 ? 2 : 1) : 0];
  });
  const parties = [1, 2, 3, 4].map(g => ({ d: '2026-11-0' + g, trous: partie(g), o: 0 }));
  const m = A.mesuresJoueur(parties, 90);
  ok(m.T === 72 && m.jouable && m.prox && m.sv && m.double && m.r5, 'mesures disponibles : ' + Object.keys(m).filter(k => m[k] && m[k].v != null).join(' '));
  const no = A.notesSecteurs(parties);
  ok(no && no.secteurs.length === 4 && no.secteurs.every(s => s.note == null || (s.note >= 0 && s.note <= 100)), 'quatre notes entre 0 et 100 : ' + no.secteurs.map(s => s.id + '=' + s.note + '/' + s.index).join(' '));
  ok(no.secteurs.every(s => s.note === Math.round(100 * (54 - (s.mesures.reduce((a, x) => a + x.index * A.MESURES_SECTEUR[s.id].find(y => y[0] === x.id)[1], 0) / s.mesures.reduce((a, x) => a + A.MESURES_SECTEUR[s.id].find(y => y[0] === x.id)[1], 0))) / 54) || Math.abs(s.note - Math.round(100 * (54 - s.index) / 54)) <= 1), 'note = 100 × (54 − index équivalent) / 54');
  ok(A.notesSecteurs(parties.slice(0, 1)) === null, 'moins de 27 trous : pas de note');
  const cmp = A.comparaisonObjectif(parties, 12);
  ok(cmp.length === 10 && cmp.every(c => c.cible != null), 'comparaison : 10 lignes avec repère');
  proche(cmp.find(c => c.id === 'gir').cible, E.repereSG(12).gir, 1e-9, 'repère GIR à l\'index 12 = celui des coups gagnés');
  const pr = A.prioriteSemaine(parties, 12);
  ok(pr.deux.length === 2 && pr.deux[0].sg <= pr.deux[1].sg && pr.priorite.id === pr.deux[0].id, 'priorité = secteur qui coûte le plus face à l\'objectif : ' + pr.deux.map(s => s.id + ' ' + s.sg).join(', '));
  ok(A.prioriteSemaine(parties, 54).deux.length === 0 || A.prioriteSemaine(parties, 54).deux.every(s => s.sg < 0), 'face à un index 54, peu ou pas de secteur perdant');
}

/* --- Échelle du premier putt dans les coups gagnés --- */
{
  const base = Array.from({ length: 18 }, () => [1, 1, 2, 0, 4, 4, 0, 0, 3, 0, 0]);
  const s = E.statsTrous(base);
  ok(s.gb3 === 18 && s.g3 === 0 && s.Gb === 18, 'trous du pavé comptés sur la nouvelle échelle');
  const s2 = E.statsTrous([[1, 1, 2, 0, 4, 4, 0, 0, 3]]);
  ok(s2.g3 === 1 && s2.gb3 === 0, 'anciens trous sur l\'ancienne échelle');
  const r = E.coupsGagnes([{ trous: base }], 18);
  ok(r && r.secteurs.find(x => x.id === 'putting').sg != null, 'coups gagnés calculés avec la nouvelle échelle');
  ok(A.premierPuttMoins([1, 1, 1, 0, 3, 4, 0, 0, 2, 0, 0], 2) === true && A.premierPuttMoins([1, 1, 1, 0, 3, 4, 0, 0, 2], 2) === null, 'moins de 2 m : sûr sur le pavé, inconnu sur l\'ancienne échelle (1 à 3 m)');
}

console.log(n + ' vérifications · ' + ko + ' échec' + (ko > 1 ? 's' : ''));
process.exit(ko ? 1 : 0);
