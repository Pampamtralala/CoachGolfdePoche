/* (La scène du sac 3D est une vue alternative : chaque club y est aussi accessible par le tableau « Mes clubs ».)
   UX14 : audit d'accessibilité fonctionnelle des écrans principaux (360, 768, 1280 px, clair et sombre) :
   nom accessible de chaque bouton et champ, zones tactiles ≥ 44 px (liens dans le texte exceptés), taille de texte
   ≥ 12 px, focus visible au clavier, évolution jamais signalée par la couleur seule, aucun débordement. */
const { chromium } = require('playwright');
const CLE = 'coachgolf.v1';
const PARS = [4, 4, 3, 5, 4, 4, 3, 5, 4];
(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const res = {}, errs = [], ko = [];
  const verifie = (c, m) => { if (!c) ko.push(m); };
  const partie = (i, mauvais) => ({ id: 'p_ac' + (800 + i), d: new Date(Date.now() - (120 - i * 9) * 864e5).toISOString(), o: 0, pc: 'p1', renseigne: PARS.map(() => 7),
    trous: PARS.map((p, k) => { const t = [1, 1, 2, 0, p, p, 0, 0, 0, 0, 0]; if (k === 1) { t[0] = 0; t[1] = 0; t[6] = 3; t[4] += 1; } if (mauvais && k === 2) { t[2] = 3; t[4] += 1; } return t; }) });
  for (const [w, h, sombre] of [[360, 760, false], [768, 1024, true], [1280, 800, false]]) {
    const nom = w + (sombre ? 's' : ''), r = res[nom] = {};
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: w < 1000, colorScheme: sombre ? 'dark' : 'light', reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    page.on('pageerror', e => errs.push(nom + ' ' + e.message));
    await page.goto('file://' + __dirname + '/dist/index.html');
    await page.click('[data-a="ac-sans-index"]'); await page.click('.carnet-form button[type="submit"]');
    await page.waitForSelector('.tete');
    const e = await page.evaluate(k => JSON.parse(localStorage.getItem(k)), CLE);
    e.parcours = [{ id: 'p1', nom: 'Golf des Essais', pars: PARS }]; e.parties = Array.from({ length: 12 }, (_, i) => partie(i, i >= 6));
    e.carnet = e.carnet || {}; e.carnet.sac = ['dr', 'f7', 'pw']; e.carnet.clubs = { dr: [220, 225, 230], f7: [140, 142, 138] }; e.maj = Date.now();
    await page.evaluate(([k, v]) => localStorage.setItem(k, JSON.stringify(v)), [CLE, e]);
    await page.reload(); await page.waitForSelector('.tete');
    for (const v of ['accueil', 'bilan', 'parcours', 'sac', 'journal']) {
      await page.click(`#barre [data-v="${v}"]`); await page.waitForTimeout(60);
      const a = await page.evaluate(() => {
        const vue = document.querySelector('#app'), out = { sansNom: [], petits: [], texte: [], couleur: [] };
        const nomDe = el => (el.getAttribute('aria-label') || el.textContent || el.getAttribute('title') || '').trim();
        vue.querySelectorAll('button, [role="button"], a[href]').forEach(b => {
          const r = b.getBoundingClientRect(); if (!r.width || !r.height || getComputedStyle(b).visibility === 'hidden') return;
          if (!nomDe(b)) out.sansNom.push(b.outerHTML.slice(0, 80));
          const dansTexte = b.classList.contains('lien') || b.closest('p, li small, small');
          if (!dansTexte && r.height < 43.5 && !b.closest('.voile') && !b.classList.contains('voile')) out.petits.push((b.className || b.tagName) + ' ' + Math.round(r.height) + ' « ' + nomDe(b).slice(0, 24) + ' »');
        });
        vue.querySelectorAll('input, select, textarea').forEach(i => {
          if (i.type === 'hidden' || !i.getBoundingClientRect().width) return;
          const lab = i.id && document.querySelector('label[for="' + i.id + '"]'), nom = i.getAttribute('aria-label') || (lab && lab.textContent) || (i.closest('label') && i.closest('label').textContent);
          if (!(nom || '').trim()) out.sansNom.push('champ ' + (i.id || i.name || i.type));
        });
        const walker = document.createTreeWalker(vue, NodeFilter.SHOW_TEXT);
        while (walker.nextNode()) {
          const n = walker.currentNode, p = n.parentElement; if (!n.textContent.trim() || !p) continue;
          const st = getComputedStyle(p), r = p.getBoundingClientRect();
          if (!r.width || st.visibility === 'hidden' || p.closest('.vh, svg, [aria-hidden="true"]')) continue;
          if (parseFloat(st.fontSize) < 12) out.texte.push(p.tagName + '.' + p.className + ' ' + st.fontSize + ' « ' + n.textContent.trim().slice(0, 20) + ' »');
        }
        vue.querySelectorAll('.tend.mieux, .tend.moins').forEach(t => { if (!/mieux|moins bien|moins/.test(t.textContent + (t.getAttribute('aria-label') || '') + (t.getAttribute('title') || ''))) out.couleur.push(t.textContent.trim()); });
        return out;
      });
      r[v] = { sansNom: a.sansNom.length, petits: a.petits.length, texte: a.texte.length, couleur: a.couleur.length };
      verifie(!a.sansNom.length, nom + ' ' + v + ' : éléments sans nom accessible : ' + a.sansNom.slice(0, 4).join(' | '));
      verifie(!a.petits.length, nom + ' ' + v + ' : zones tactiles < 44 px : ' + [...new Set(a.petits)].slice(0, 6).join(' | '));
      verifie(!a.texte.length, nom + ' ' + v + ' : texte < 12 px : ' + [...new Set(a.texte)].slice(0, 5).join(' | '));
      verifie(!a.couleur.length, nom + ' ' + v + ' : évolution signalée par la couleur seule : ' + a.couleur.slice(0, 4).join(' | '));
      verifie(await page.evaluate(() => document.documentElement.scrollWidth) <= w, nom + ' ' + v + ' sans débordement');
    }
    /* Focus visible au clavier */
    await page.click('#barre [data-v="accueil"]'); await page.keyboard.press('Tab'); await page.keyboard.press('Tab');
    r.focus = await page.evaluate(() => { const a = document.activeElement, s = getComputedStyle(a); return a.tagName + ' ' + s.outlineStyle + ' ' + s.outlineWidth + ' ' + s.boxShadow.slice(0, 30); });
    verifie(!/none 0px none/.test(r.focus) && !/ none (0px)? *$/.test(r.focus), nom + ' focus visible : ' + r.focus);
    await ctx.close();
  }
  await browser.close();
  console.log(JSON.stringify({ res, ko, errs }, null, 1));
  process.exit(ko.length || errs.length ? 1 : 0);
})().catch(e => { console.log('ECHEC', e.message); process.exit(1); });
