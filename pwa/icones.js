/* Fabrique les icônes PNG à partir de icone.svg (à relancer seulement si le dessin change). */
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const svg = fs.readFileSync(__dirname + '/icone.svg', 'utf8');
  const arrondi = svg.replace('<rect id="fond" width="512" height="512" fill="#1F4A35"/>', '<rect id="fond" width="512" height="512" rx="112" fill="#1F4A35"/>');
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  for (const [nom, taille, source] of [['icon-192.png', 192, arrondi], ['icon-512.png', 512, arrondi], ['icon-maskable-512.png', 512, svg], ['apple-touch-icon.png', 180, svg]]) {
    const page = await browser.newPage({ viewport: { width: taille, height: taille } });
    await page.setContent('<style>html,body{margin:0;background:transparent}svg{display:block;width:' + taille + 'px;height:' + taille + 'px}</style>' + source);
    await page.screenshot({ path: __dirname + '/' + nom, omitBackground: true });
    await page.close();
  }
  await browser.close();
  console.log('icônes faites');
})();
