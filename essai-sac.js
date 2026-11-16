/* Contrôle du composant autonome livrable/sac-de-golf.html : rendu, alertes, modale, aperçu en direct, stockage. */
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const D = 'shots-sac'; fs.mkdirSync(D, { recursive: true });
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const res = {}, errs = [];
  for (const [w, sombre] of [[390, false], [360, false], [390, true], [800, false]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, deviceScaleFactor: 2, colorScheme: sombre ? 'dark' : 'light', hasTouch: w < 500 });
    const page = await ctx.newPage();
    page.on('pageerror', e => errs.push(w + ' PAGEERROR ' + e.message));
    page.on('console', m => { if (m.type() === 'error') errs.push(w + ' CONSOLE ' + m.text()); });
    await page.goto('file://' + __dirname + '/livrable/sac-de-golf.html');
    await page.evaluate(() => localStorage.clear()); await page.reload();
    await page.waitForTimeout(300);
    const nom = `${w}${sombre ? '-sombre' : ''}`;
    await page.screenshot({ path: `${D}/${nom}-sac.png`, fullPage: true });
    if (w === 390 && !sombre) {
      res.alertes = await page.$$eval('.sdg-club.is-alerte', l => l.map(b => b.dataset.id));
      res.score = await page.$eval('.sdg-score', x => x.textContent.replace(/\s+/g, ' ').trim());
      res.ecarts = await page.$$eval('.sdg-ecarts li', l => l.map(li => li.className + ':' + li.querySelector('.sdg-val').textContent));
      res.labelF5 = await page.getAttribute('[data-id="fer5"]', 'aria-label');
      /* Débordement horizontal ? */
      res.debord = await page.evaluate(() => [...document.querySelectorAll('.sdg-club')].filter(b => { const r = b.getBoundingClientRect(); return r.left < 0 || r.right > innerWidth; }).map(b => b.dataset.id));
      res.chevauche = await page.evaluate(() => {
        const bs = [...document.querySelectorAll('.sdg-rang')].map(r => [...r.querySelectorAll('.sdg-etiq')].map(e => e.getBoundingClientRect()));
        const out = [];
        bs.forEach((row, ri) => row.forEach((a, i) => { const b = row[i + 1]; if (b && a.right > b.left + 0.5) out.push(ri + ':' + i); }));
        return out;
      });
      /* Ouvrir le fer 5, saisir 158 : l'aperçu doit enlever le doublon 4-5 en direct */
      await page.click('[data-id="fer5"]'); await page.waitForTimeout(300);
      res.modaleOuverte = await page.$eval('.sdg-modale', d => d.open);
      res.valeurInitiale = await page.inputValue('#sdg-m-val');
      await page.screenshot({ path: `${D}/${nom}-modale.png` });
      await page.fill('#sdg-m-val', '156'); await page.waitForTimeout(150);
      res.voisinsApercu = await page.$$eval('.sdg-m-voisins li', l => l.map(x => x.className + '|' + x.textContent.replace(/\s+/g, ' ')));
      res.alertesApercu = await page.$$eval('.sdg-club.is-alerte', l => l.map(b => b.dataset.id));
      await page.screenshot({ path: `${D}/${nom}-modale-apercu.png` });
      /* Annuler : retour à l'état d'origine */
      await page.click('.sdg-m-fermer'); await page.waitForTimeout(250); res.fermee = await page.$eval('.sdg-modale', d => d.open);
      res.apresAnnuler = await page.$eval('[data-id="fer5"] .sdg-dist', x => x.textContent);
      res.alertesApresAnnuler = await page.$$eval('.sdg-club.is-alerte', l => l.map(b => b.dataset.id));
      /* Valeur invalide */
      await page.click('[data-id="fer5"]'); await page.fill('#sdg-m-val', '5'); await page.click('[data-role="ok"]');
      res.erreur = await page.$eval('.sdg-m-erreur', x => x.hidden ? '' : x.textContent);
      res.toujoursOuverte = await page.$eval('.sdg-modale', d => d.open);
      /* Bouton + depuis 5 → 10 (borne basse), puis saisie valide */
      await page.fill('#sdg-m-val', '155'); await page.click('[data-pas="1"]');
      res.apresPlus = await page.inputValue('#sdg-m-val');
      await page.click('[data-role="ok"]'); await page.waitForTimeout(250);
      res.enregistre = await page.$eval('[data-id="fer5"] .sdg-dist', x => x.textContent);
      res.stockage = await page.evaluate(() => JSON.parse(localStorage.getItem('sdg.sac.v1')).find(c => c.id === 'fer5').distance);
      res.annonce = await page.$eval('.sdg-vh', x => x.textContent);
      res.focusRetour = await page.evaluate(() => document.activeElement && document.activeElement.dataset.id);
      res.alertesApres = await page.$$eval('.sdg-club.is-alerte', l => l.map(b => b.dataset.id));
      /* Effacer la distance du fer 9 : la paire devient inconnue */
      await page.click('[data-id="fer9"]'); await page.click('[data-role="effacer"]'); await page.waitForTimeout(250);
      res.fer9 = await page.$eval('[data-id="fer9"] .sdg-dist', x => x.textContent);
      res.scoreApresEffacer = await page.$eval('.sdg-score b', x => x.textContent);
      await page.screenshot({ path: `${D}/${nom}-apres.png`, fullPage: true });
      /* Saisie d'un club vide : estimation par les voisins */
      await page.click('[data-id="fer9"]'); res.estimation = await page.inputValue('#sdg-m-val');
      await page.fill('#sdg-m-val', '118'); await page.press('#sdg-m-val', 'Enter'); await page.waitForTimeout(250);
      res.fer9b = await page.$eval('[data-id="fer9"] .sdg-dist', x => x.textContent);
      /* Putter : information seule */
      await page.click('[data-id="putter"]'); await page.waitForTimeout(250);
      res.putter = await page.$eval('.sdg-m-info', x => !x.hidden) && await page.$eval('.sdg-m-saisie', x => x.hidden);
      await page.screenshot({ path: `${D}/${nom}-putter.png` });
      await page.click('[data-role="ok"]');
      /* Rechargement : l'état persiste */
      await page.reload(); await page.waitForTimeout(200);
      res.persiste = await page.$eval('[data-id="fer5"] .sdg-dist', x => x.textContent);
      /* Sac parfait via l'API */
      res.parfait = await page.evaluate(() => {
        const l = SacDeGolf.CLUBS_DEFAUT.map((c, i) => Object.assign({}, c, { distance: c.categorie === 'putter' ? null : 230 - i * 12 }));
        const a = SacDeGolf.analyserEtagement(l); return a.ok + '/' + a.total + ' ' + Object.keys(a.alertes).length;
      });
      res.inverse = await page.evaluate(() => {
        const l = SacDeGolf.CLUBS_DEFAUT.map(c => Object.assign({}, c));
        l[6].distance = 155; const a = SacDeGolf.analyserEtagement(l);
        return a.ecarts.filter(e => e.statut !== 'ok').map(e => e.a.id + '-' + e.b.id + ':' + e.statut + ':' + e.ecart).join(' ');
      });
    }
    if (w === 360 && !sombre) {
      res.debord360 = await page.evaluate(() => [...document.querySelectorAll('.sdg-club')].filter(b => { const r = b.getBoundingClientRect(); return r.left < 0 || r.right > innerWidth; }).map(b => b.dataset.id));
      await page.click('[data-id="fer7"]'); await page.waitForTimeout(300);
      await page.screenshot({ path: `${D}/${nom}-modale.png` });
      res.feuille360 = await page.$eval('.sdg-modale', d => { const r = d.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.bottom), Math.round(r.width), innerHeight]; });
    }
    await ctx.close();
  }
  await browser.close();
  console.log(JSON.stringify(res, null, 1)); console.log('ERREURS', errs);
})();
