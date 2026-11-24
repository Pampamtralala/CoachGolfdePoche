/* Le build concatène les moteurs (portée globale) et les fichiers de l'interface (une seule fonction) :
   un même nom déclaré deux fois écrase l'autre sans erreur. Ce test l'interdit. */
const fs = require('fs');
const src = f => fs.readFileSync(__dirname + '/src/' + f, 'utf8');
const build = fs.readFileSync(__dirname + '/build.js', 'utf8');
const moteur = JSON.parse(build.match(/const moteur = (\[[^\]]*\])/)[1].replace(/'/g, '"'));
const strip = s => s.replace(/if \(typeof module !== "undefined"\) \{[\s\S]*?\n\}\n/g, '');
const vus = {}, ko = [];
function note(nom, ou, espace) { const k = espace + ':' + nom; if (vus[k]) ko.push(nom + ' (' + vus[k] + ' et ' + ou + ')'); else vus[k] = ou; }
moteur.forEach(f => { for (const m of strip(src(f)).matchAll(/^(?:function\s+([A-Za-z_$][\w$]*)|(?:var|const|let)\s+([A-Za-z_$][\w$]*))/gm)) note(m[1] || m[2], f, 'g'); });
const ui = ['ui.js'].concat([...src('ui.js').matchAll(/\/\*INCLURE:([a-z0-9-]+\.js)\*\//g)].map(m => m[1]));
ui.forEach(f => { for (const m of src(f).matchAll(/^  function\s+([A-Za-z_$][\w$]*)/gm)) { note(m[1], f, 'ui'); if (vus['g:' + m[1]]) ko.push(m[1] + ' (' + f + ' masque le moteur ' + vus['g:' + m[1]] + ')'); } });
ko.forEach(x => console.log('ÉCHEC : nom déclaré deux fois :', x));
console.log(Object.keys(vus).length + ' noms vérifiés · ' + ko.length + ' doublon' + (ko.length > 1 ? 's' : ''));
process.exit(ko.length ? 1 : 0);
