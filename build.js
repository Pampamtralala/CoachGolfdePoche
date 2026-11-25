const fs = require('fs'), p = f => fs.readFileSync(__dirname + '/src/' + f, 'utf8');
const strip = s => s.replace(/if \(typeof module !== "undefined"\) \{[\s\S]*?\n\}\n/g, '').replace(/if \(typeof module !== "undefined"\) \{ module\.exports = [^\n]*\n/g, '');
const moteur = ['data-base.js', 'data-symptomes.js', 'data-exercices-1.js', 'data-exercices-2.js', 'engine.js', 'data-plus.js', 'data-strategie.js', 'engine-plus.js', 'engine-strategie.js', 'engine-analyse.js', 'engine-carte.js', 'engine-handicap.js', 'engine-donnees.js', 'engine-stats.js', 'engine-clubs.js', 'engine-parcours.js', 'engine-erreurs.js', 'engine-putting.js', 'engine-estimation.js'];
/* L'interface est une seule fonction : ses morceaux sont insérés à l'endroit des repères INCLURE. */
const ui = p('ui.js').replace(/[ \t]*\/\*INCLURE:([a-z0-9-]+\.js)\*\/\n/g, (m, f) => p(f) + '\n');
if (/INCLURE:/.test(ui)) throw new Error('inclusion non résolue');
const version = new Date().toISOString();
const js = (moteur.map(f => strip(p(f))).join('\n') + '\n' + ui).replace('/*VERSION*/', version);
/* Une erreur de syntaxe ne doit jamais produire une page blanche : le build s'arrête. */
try { new (require('vm').Script)(js, { filename: 'app.js' }); }
catch (e) { console.error('Build arrêté : erreur de syntaxe dans le code assemblé.\n' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 3).join('\n')); process.exit(1); }
if (/<\/script/i.test(js)) throw new Error('balise script dans le JS');
if (/typeof module/.test(js)) throw new Error('reste de module');
/* Chart.js (licence MIT) est intégré à la page : aucune dépendance à un service extérieur. */
const chart = p('vendor/chart.umd.min.js').replace(/\/\/# sourceMappingURL=.*$/m, '');
if (/<\/script/i.test(chart)) throw new Error('balise script dans Chart.js');
const html = p('gabarit.html').replace('/*STYLE*/', () => p('style.css') + '\n' + p('sac3d.css') + '\n' + p('golf.css')).replace('/*CHARTJS*/', () => chart).replace('/*SCRIPT*/', () => js);

/* 1. La page pour claude.ai : un seul fichier. */
fs.mkdirSync(__dirname + '/dist', { recursive: true });
fs.writeFileSync(__dirname + '/dist/index.html', html);

/* 2. La version installable, servie par GitHub Pages depuis docs/ : la même page, avec le manifeste, les icônes
      et le service worker qui la garde disponible sans réseau. */
const pwa = __dirname + '/pwa/', docs = __dirname + '/docs/';
const tete = ['<link rel="manifest" href="manifest.webmanifest">', '<meta name="theme-color" content="#1F4A35">',
  '<link rel="icon" type="image/png" sizes="192x192" href="icon-192.png">', '<link rel="apple-touch-icon" href="apple-touch-icon.png">',
  '<meta name="mobile-web-app-capable" content="yes">', '<meta name="apple-mobile-web-app-capable" content="yes">',
  '<meta name="apple-mobile-web-app-title" content="Coach de poche">'].join('\n');
const enregistrement = '<script>\nif ("serviceWorker" in navigator && window.self === window.top && (location.protocol === "https:" || location.hostname === "localhost")) {\n' +
  '  window.addEventListener("load", function () { navigator.serviceWorker.register("sw.js").catch(function () { /* hors ligne impossible, l\'appli marche quand même */ }); });\n}\n</script>';
const fin = html.lastIndexOf('</body>');
if (fin < 0 || html.indexOf('</title>') < 0) throw new Error('gabarit inattendu');
const page = (html.slice(0, fin) + enregistrement + '\n' + html.slice(fin)).replace('</title>', '</title>\n' + tete);
fs.mkdirSync(docs, { recursive: true });
fs.writeFileSync(docs + 'index.html', page);
fs.writeFileSync(docs + 'sw.js', fs.readFileSync(pwa + 'sw.js', 'utf8').replace('__VERSION__', version.replace(/[^0-9]/g, '').slice(0, 14)));
['manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png'].forEach(f => fs.copyFileSync(pwa + f, docs + f));
fs.writeFileSync(docs + '.nojekyll', '');
console.log('index.html', (html.length / 1024).toFixed(0) + ' Ko · docs/ prêt · version ' + version);
