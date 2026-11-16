/* Version installable (docs/) : servie en http local comme sur GitHub Pages, sous un sous-dossier.
   Manifeste, icônes, service worker, ouverture sans réseau, version affichée, GPS autorisé. */
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
const BASE = '/CoachGolfdePoche/';

(async () => {
  const serveur = http.createServer((req, res) => {
    let u = decodeURIComponent(req.url.split('?')[0]);
    if (!u.startsWith(BASE)) { res.writeHead(404); res.end(); return; }
    u = u.slice(BASE.length) || 'index.html';
    const f = path.join(__dirname, 'docs', path.normalize(u).replace(/^(\.\.[/\\])+/, ''));
    fs.readFile(f, (e, data) => { if (e) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'max-age=600' }); res.end(data); });
  });
  await new Promise(ok => serveur.listen(0, '127.0.0.1', ok));
  const url = 'http://localhost:' + serveur.address().port + BASE;
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const res = {}, ko = [], errs = [];
  const verifie = (c, m) => { if (!c) ko.push(m); };
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, reducedMotion: 'reduce', permissions: ['geolocation'], geolocation: { latitude: 46.19, longitude: 2.24, accuracy: 5 } });
  const page = await ctx.newPage();
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  await page.goto(url);
  res.titre = await page.title();
  res.manifeste = await page.$eval('link[rel="manifest"]', l => l.getAttribute('href'));
  const m = await page.evaluate(async () => { const r = await fetch('manifest.webmanifest'); return r.json(); });
  res.nom = m.name + ' · ' + m.display + ' · ' + m.start_url + ' · ' + m.icons.map(i => i.sizes + (i.purpose === 'maskable' ? ' masquable' : '')).join(', ');
  verifie(m.display === 'standalone' && m.start_url === './' && m.icons.length === 3, 'manifeste : ' + res.nom);
  res.icones = await page.evaluate(async l => Promise.all(l.map(async f => { const r = await fetch(f); return f + ' ' + r.status + ' ' + r.headers.get('content-type'); })), m.icons.map(i => i.src).concat(['apple-touch-icon.png']));
  verifie(res.icones.every(x => / 200 image\/png$/.test(x)), 'icônes servies : ' + res.icones.join(' | '));
  /* Service worker actif, la page est sous son contrôle */
  res.sw = await page.evaluate(async () => { const r = await navigator.serviceWorker.ready; return r.active.state + ' · portée ' + new URL(r.scope).pathname; });
  await page.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 15000 });
  verifie(/portée \/CoachGolfdePoche\/$/.test(res.sw), 'service worker : ' + res.sw);
  res.caches = await page.evaluate(async () => { const k = await caches.keys(); const c = await caches.open(k.filter(x => /^coach-\d/.test(x))[0]); return (await c.keys()).length + ' fichiers gardés'; });
  /* Profil créé, puis ouverture sans réseau */
  await page.click('[data-a="commencer"]'); await page.fill('#q-prenom', 'Benjamin'); await page.fill('#q-index', '14'); await page.click('[data-a="q-suite"]');
  await page.click('[data-k="objectif"][data-v="score"]'); await page.click('[data-a="q-suite"]'); await page.click('[data-a="lieu"][data-v="practice"]');
  for (let i = 0; i < 8 && await page.locator('[data-a="q-suite"]').count(); i++) await page.click('[data-a="q-suite"]');
  await page.waitForSelector('.tete');
  await ctx.setOffline(true);
  await page.reload();
  await page.waitForSelector('.tete', { timeout: 20000 });
  res.horsLigne = await page.textContent('.gf-bonjour, h1');
  verifie(/Benjamin/.test(res.horsLigne), 'ouverture sans réseau : ' + res.horsLigne);
  await page.click('.tete .ident');
  res.version = await page.textContent('.version');
  verifie(/Version du \d+ \S+ \d{4} à \d{2}:\d{2}/.test(res.version.replace(/[  ]/g, ' ')), 'version affichée : ' + res.version);
  /* La recherche de carte est proposée ici (pas dans un cadre), GPS compris ; sans réseau, elle échoue proprement */
  await page.click('.tete [data-a="recherche"]'); await page.click('#recherche-l [data-a="fonction"][data-v="carte-nouveau"]'); await page.waitForSelector('#carte-q');
  res.recherche = (await page.locator('.carte-form').count()) + ' formulaire · ' + (await page.locator('[data-a="carte-autour"]').count()) + ' bouton autour de moi';
  await page.fill('#carte-q', 'Jonchère'); await page.click('.carte-form button[type="submit"]');
  await page.waitForSelector('#feuille .erreur', { timeout: 20000 });
  res.erreurHorsLigne = await page.textContent('#feuille .erreur');
  verifie(/échoué/.test(res.erreurHorsLigne), 'sans réseau, la recherche le dit : ' + res.erreurHorsLigne);
  await page.screenshot({ path: 'shots13/pwa-recherche-hors-ligne.png' });
  await ctx.setOffline(false);
  console.log(JSON.stringify({ res, ko, errs }, null, 1));
  await browser.close(); serveur.close();
})().catch(e => { console.error('ECHEC', String(e.stack || e.message).split('\n').slice(0, 10).join('\n')); process.exit(1); });
