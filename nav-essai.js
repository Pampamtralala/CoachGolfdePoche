/* Navigation commune aux parcours de test : le menu latéral (tiroir sur téléphone, colonne sur grand écran). */
const ANCIENS = { jour: 'accueil', plan: 'practice', entrainement: 'practice', distances: 'sac', parties: 'parcours', carnet: 'parcours' };
/* Navigation : la barre des cinq rubriques, le bouton du profil, et la recherche qui mène à chaque fonction. */
const ONGLETS = ['accueil', 'parcours', 'practice', 'bilan', 'sac'];
async function ouvrirMenu(page) {
  if (!(await page.locator('#recherche-q').count())) await page.click('.tete [data-a="recherche"]');
  await page.waitForSelector('#recherche-q');
}
async function allerVue(page, n, section) {
  n = ANCIENS[n] || n;
  if (section) {
    await page.evaluate(([v, s]) => { const b = document.createElement('button'); b.setAttribute('data-a', 'aller-a'); b.setAttribute('data-v', v); b.setAttribute('data-s', s); b.hidden = true; document.getElementById('app').appendChild(b); b.click(); }, [n, section]);
  } else if (ONGLETS.includes(n)) await page.click(`#barre [data-a="onglet"][data-v="${n}"]`);
  else if (n === 'profil') await page.click('.tete .ident');
  else if (n === 'exercices') { await page.click('#barre [data-a="onglet"][data-v="practice"]'); await page.click('#vue [data-a="onglet"][data-v="exercices"]'); }
  await page.waitForTimeout(60);
}
async function menuAction(page, action) {
  await ouvrirMenu(page);
  await page.click(`#recherche-l [data-a="fonction"][data-v="${action}"]`);
}
/* Pavé de la partie : lit le trou affiché. */
function lirePave(page) {
  return page.evaluate(() => {
    const q = s => document.querySelector('#calque-partie ' + s);
    const moins = q('.pv-penal-moins'), mej = q('.pv-mej');
    const mejJ = q('.pv-mej [data-v="j"][aria-pressed="true"]'), mejR = q('.pv-mej [data-v="r"][aria-pressed="true"]');
    const sel = k => { const b = q(`[data-a="pt-set"][data-k="${k}"][aria-pressed="true"]`); return b ? +b.dataset.v : 0; };
    return {
      par: parseInt(q('.pv-info b').textContent, 10), score: parseInt(q('.pv-score .main').textContent, 10),
      putts: parseInt(q('.pv-putts .main').textContent, 10), pen: moins ? parseInt(q('.pv-penal b').textContent.replace('+', ''), 10) : 0,
      /* Mise en jeu : 1 jouable, 0 ratée, null non renseignée (P03) ; sans bloc (express, par 3) : 1. */
      j: mej ? (mejJ ? 1 : mejR ? 0 : null) : 1, k6: sel(6), k7: sel(7), k8: sel(8), detail: !!q('.pv-plus[open]'),
      a6: !!q('[data-a="pt-set"][data-k="6"]'), a7: !!q('[data-a="pt-set"][data-k="7"]'), a8: !!q('[data-a="pt-set"][data-k="8"]')
    };
  });
}
/* Règle le trou en cours sur t = [jouable, gir, putts, pénalités, score, par, côté, club, premier putt], puis le valide.
   Le GIR n'est plus saisi : il se déduit du score et des putts. */
async function saisirTrou(page, t, valider = true) {
  const P = '#calque-partie ';
  let v = await lirePave(page);
  for (let n = 0; n < 3 && v.par !== t[5]; n++) { await page.click(P + '[data-a="pv-par"]'); v = await lirePave(page); }
  for (let n = 0; n < 6 && v.putts !== t[2]; n++) { await page.click(`${P}[data-a="pv-putts"][data-d="${v.putts < t[2] ? 1 : -1}"]`); v = await lirePave(page); }
  for (let n = 0; n < 4 && v.pen !== t[3]; n++) { await page.click(v.pen < t[3] ? P + '[data-a="pv-penal"][data-d="1"]' : P + '.pv-penal-moins'); v = await lirePave(page); }
  for (let n = 0; n < 15 && v.score !== t[4]; n++) { await page.click(`${P}[data-a="pt-score"][data-d="${v.score < t[4] ? 1 : -1}"]`); v = await lirePave(page); }
  if (t[5] >= 4 && v.j !== t[0] && await page.locator(P + '.pv-mej').count()) { await page.click(P + `[data-a="pv-mej"][data-v="${t[0] ? 'j' : 'r'}"]`); v = await lirePave(page); }
  const ecart = k => v['a' + k] && v['k' + k] !== (t[k] || 0);
  /* Côté et club de départ sont avec la mise en jeu ; le premier putt est sous les putts (Standard et Expert). */
  for (const k of [6, 7, 8]) if (ecart(k)) { await page.click(`${P}[data-a="pt-set"][data-k="${k}"][data-v="${t[k] || v['k' + k]}"]`); v = await lirePave(page); }
  if (valider) await page.click('#pt-suiv');
  return v;
}
/* Un trou tel que le pavé l'enregistre : GIR déduit, par 3 toujours « jouable » sans club ni côté. */
function trouPave(t) {
  const x = t.slice(); x[1] = x[4] - x[2] <= x[5] - 2 ? 1 : 0;
  if (x[5] === 3) { x[0] = 1; x[6] = 0; x[7] = 0; }
  if (x[0]) x[6] = 0;
  if (!x[2]) x[8] = 0;
  while (x.length < 11) x.push(0);
  return x;
}
/* La saisie démarre en score express depuis le 19/11 : les scénarios qui notent coups et détails passent en mode détaillé. */
async function modeDetail(page) {
  const b = page.locator('#calque-partie [data-a="mode-saisie"][data-v="detail"]');
  if (await b.count() && (await b.getAttribute('aria-pressed')) !== 'true') await b.click();
}
module.exports = { allerVue, menuAction, ouvrirMenu, lirePave, saisirTrou, trouPave, modeDetail };
