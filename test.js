const E = require('./src/engine.js');
const { EXERCICES, EX, SYM, DOM, IND } = E;
let err = 0; const bad = m => { err++; console.log('ERREUR', m); };

// 1. Intégrité
const ids = new Set();
for (const e of EXERCICES) {
  if (ids.has(e.id)) bad('id en double ' + e.id); ids.add(e.id);
  if (!DOM[e.d]) bad('domaine inconnu ' + e.id);
  if (!['technique','dosage','jeu','test','routine'].includes(e.type)) bad('type ' + e.id);
  if (!(e.niv[0] >= 1 && e.niv[1] <= 4 && e.niv[0] <= e.niv[1])) bad('niv ' + e.id);
  for (const l of e.lieux) if (!LIEUX.find(x => x.id === l)) bad('lieu ' + e.id + ' ' + l);
  if (!e.but || !e.etapes || e.etapes.length < 3) bad('contenu ' + e.id);
  if (e.score) { if (e.score.rep.length !== 4) bad('rep ' + e.id); if (e.score.ind && !IND[e.score.ind]) bad('ind ' + e.id); }
  if (e.palier) for (const k of Object.keys(e.palier)) if (+k < e.niv[0] || +k > e.niv[1]) bad('palier hors plage ' + e.id + ' ' + k);
  const txt = JSON.stringify(e);
  const m = txt.match(/\{[a-z]+\}/g); if (m) for (const t of m) if (!['{gf}','{gm}','{df}','{dm}'].includes(t)) bad('jeton ' + e.id + ' ' + t);
}
for (const s of SYMPTOMES) {
  if (!DOM[s.d]) bad('sym domaine ' + s.id);
  const cids = new Set(s.causes.map(c => c.id));
  for (const q of s.questions) for (const o of q.o) for (const k of Object.keys(o.e)) if (!cids.has(k)) bad(`sym ${s.id} q ${q.id} cause inconnue ${k}`);
  for (const c of s.causes) {
    if (c.p.length !== 4) bad('p ' + s.id + ' ' + c.id);
    for (const x of c.exos) if (!EX[x]) bad(`exo inconnu ${x} dans ${s.id}/${c.id}`);
    // au moins un exercice éligible par palier concerné, tous lieux confondus
    for (let p = s.niv[0]; p <= s.niv[1]; p++) if (!c.exos.some(x => EX[x] && EX[x].niv[0] <= p && p <= EX[x].niv[1])) bad(`aucun exo palier ${p} pour ${s.id}/${c.id}`);
  }
}
for (const p of [1,2,3,4]) for (const id of MISSIONS_DEFAUT[p]) if (!EX[id]) bad('mission ' + id);
for (const k of Object.keys(MISSION_PAR_DOMAINE)) if (!EX[MISSION_PAR_DOMAINE[k]]) bad('mission dom ' + k);

// 2. Couverture : nb d'exercices par domaine et palier
console.log('Total exercices', EXERCICES.length, '· symptômes', SYMPTOMES.length, '· causes', SYMPTOMES.reduce((a,s)=>a+s.causes.length,0));
for (const d of DOMAINES) console.log(d.id.padEnd(11), [1,2,3,4].map(p => EXERCICES.filter(e => e.d === d.id && e.niv[0] <= p && p <= e.niv[1]).length).join(' '));

// 3. Génération sur un grand nombre de profils
const lieuxSets = [['practice','putting','zone','sable','parcours','maison'], ['practice','putting','parcours'], ['practice'], ['maison'], ['putting','zone'], ['practice','maison'], ['parcours','maison']];
let nPlans = 0;
for (const index of [54, 40, 30, 24, 18, 12, 6, 0]) for (const seances of [1,2,3,4]) for (const duree of [30,45,60,90]) for (const lieux of lieuxSets) for (const objectif of ['score','defaut','competition','regularite']) for (const symSet of [[], ['slice'], ['gratte','putt_dosage_s'], ['cata','penalites','socket']]) {
  const pal = E.palierDe(index);
  const symptomes = {}; symSet.forEach(s => { if (SYM[s].niv[0] <= pal && pal <= SYM[s].niv[1]) symptomes[s] = { reponses: {} }; });
  const indicateurs = {}; INDICATEURS.forEach((i, k) => { indicateurs[i.id] = { val: k % 3 === 0 ? null : Math.max(0, i.rep[pal-1] - (k % 4)), src: 'declare' }; });
  const profil = { index, lateralite: 'D', objectif, envies: ['putt_court'], seances, duree, lieux, indicateurs, symptomes };
  const plan = E.genererPlan(profil, 1); nPlans++;
  if (plan.semaines.length !== 4) bad('semaines');
  for (const sem of plan.semaines) {
    if (sem.seances.length !== seances) bad('nb séances');
    for (const se of sem.seances) {
      if (!se.blocs.length) bad(`séance vide idx ${index} ${lieux} ${duree}`);
      if (se.min > duree + 5) bad(`séance trop longue ${se.min}/${duree} idx ${index} ${lieux}`);
      if (se.min < duree - 15) bad(`séance trop courte ${se.min}/${duree} idx ${index} ${lieux} ${JSON.stringify(se.blocs.map(b=>b.ex))}`);
      const seen = new Set();
      for (const b of se.blocs) { if (seen.has(b.ex)) bad('doublon dans séance'); seen.add(b.ex); const e = EX[b.ex]; if (!(e.niv[0] <= pal && pal <= e.niv[1])) bad('palier exo ' + b.ex); if (!b.lieu) bad('lieu bloc ' + b.ex); }
    }
    if (lieux.includes('parcours') && !sem.mission) bad('mission manquante');
    if (sem.mission && !(EX[sem.mission].niv[0] <= pal && pal <= EX[sem.mission].niv[1])) bad('mission palier');
  }
}
console.log('Plans générés', nPlans, '· erreurs', err);
