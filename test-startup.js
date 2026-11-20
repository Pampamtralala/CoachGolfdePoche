/* Test de démarrage dans un vrai navigateur, avec et sans sauvegarde historique. */
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");

async function main() {
  const root = path.join(__dirname, "docs");
  const server = http.createServer((req, res) => {
    const name = (new URL(req.url, "http://localhost")).pathname;
    const file = path.join(root, name === "/" ? "index.html" : name.replace(/^\//, ""));
    try {
      const data = fs.readFileSync(file);
      res.setHeader("Content-Type", file.endsWith(".html") ? "text/html; charset=utf-8" :
        file.endsWith(".js") ? "application/javascript" : "application/octet-stream");
      res.end(data);
    } catch (e) { res.writeHead(404); res.end("Not found"); }
  });
  await new Promise(ok => server.listen(0, "127.0.0.1", ok));
  const port = server.address().port;
  const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
  const url = "http://127.0.0.1:" + port + "/";
  async function verify(label, saved) {
    const context = await browser.newContext();
    if (saved) await context.addInitScript(data => {
      localStorage.setItem("coachgolf.v1", JSON.stringify(data));
    }, saved);
    const page = await context.newPage();
    const errs = [];
    page.on("pageerror", error => errs.push(error.stack || error.message));
    await page.goto(url, {waitUntil: "domcontentloaded"});
    await page.waitForTimeout(1000);
    const pageState = await page.evaluate(() => ({
      text: (document.querySelector("#app")?.innerText || "").slice(0, 300),
      buttons: document.querySelectorAll("#app button").length
    }));
    console.log(label + " : " + JSON.stringify(pageState));
    if (errs.length) throw new Error(label + " JavaScript error:\n" + errs.join("\n"));
    if (pageState.buttons < 1 || pageState.text.length < 15) throw new Error(label + " : écran vide.");
    await context.close();
  }

  /* Parcours mobile : aucune distance proposée ne doit devenir une mesure,
     et une restauration doit préserver 41+ parties ainsi que les cartes GPS. */
  async function verifyMobile(saved) {
    const context = await browser.newContext({
      viewport: {width: 390, height: 844}, isMobile: true, hasTouch: true,
      deviceScaleFactor: 2, acceptDownloads: true
    });
    await context.addInitScript(data => {
      if (!sessionStorage.getItem("test-seeded")) {
        localStorage.setItem("coachgolf.v1", JSON.stringify(data));
        sessionStorage.setItem("test-seeded", "1");
      }
    }, saved);
    const page = await context.newPage(), errs = [];
    page.on("pageerror", error => errs.push(error.stack || error.message));
    const lire = () => page.evaluate(() => JSON.parse(localStorage.getItem("coachgolf.v1")));
    function exiger(ok, texte) { if (!ok) throw new Error("Parcours Android : " + texte); }
    try {
      await page.goto(url, {waitUntil: "domcontentloaded"});
      await page.locator('#app [data-a="partie-rapide"]').first().click();
      await page.locator('[data-a="pt-nouvelle"]').click();
      await page.locator('#calque-partie [data-a="mode-saisie"][data-v="detail"]').click();
      await page.locator('#calque-partie [data-a="pv-coup"][data-v="-1"]').click();
      await page.locator('#calque-partie [data-a="pv-club"][data-id="f7"]').click();
      exiger(await page.locator("#pv-dist").inputValue() === "", "une moyenne proposée est préremplie comme mesure.");
      await page.locator('#calque-partie [data-a="pv-coup-ok"]').click();
      let etat = await lire();
      exiger(etat.partie.coups[0][0].d === null && etat.partie.coups[0][0].source === "inconnu",
        "la distance non mesurée a été ajoutée au sac.");
      await page.locator('#calque-partie [data-a="pv-coup"][data-v="-1"]').click();
      await page.locator('#calque-partie [data-a="pv-club"][data-id="f7"]').click();
      await page.locator("#pv-dist").fill("145");
      await page.locator('#calque-partie [data-a="pv-coup-ok"]').click();
      etat = await lire();
      exiger(etat.partie.coups[0][1].d === 145 && etat.partie.coups[0][1].source === "manuel" &&
        etat.partie.coups[0][1].distanceType === "carry", "la mesure déclarée n'est pas enregistrée.");
      await page.locator('#calque-partie [data-a="pt-suiv"]').click();
      etat = await lire();
      exiger(etat.partie.i === 1 && etat.partie.validation[0] === "confirme",
        "le score du premier trou n'est pas confirmé.");
      await page.waitForTimeout(1100);
      await page.evaluate(() => localStorage.removeItem("coachgolf.v1"));
      await page.reload({waitUntil: "domcontentloaded"});
      await page.waitForFunction(() => {
        try {
          const e = JSON.parse(localStorage.getItem("coachgolf.v1") || "null");
          return !!e && !!e.partie && e.partie.i === 1;
        } catch (e) { return false; }
      }, {timeout: 8000});
      etat = await lire();
      exiger(etat.parties.length === 41, "le stockage IndexedDB n'a pas restauré les 41 anciennes parties.");
      // Fermeture du pavé puis restauration d'un export JSON incluant une carte.
      if (await page.locator('#calque-partie [data-a="pt-fermer"]').count())
        await page.locator('#calque-partie [data-a="pt-fermer"]').click();
      await page.locator('button.ident[data-v="profil"]').click();
      const carte = {src: "releve", nom: "Parcours GPS de test", o: [46, 2], trous: [], libres: []};
      const archive = Object.assign({}, saved, {cartesGeo: {p1: carte}});
      await page.locator("#importer-fichier").setInputFiles({
        name: "sauvegarde-test.json", mimeType: "application/json",
        buffer: Buffer.from(JSON.stringify(archive))
      });
      await page.locator('#calque-dialogue [data-a="ok-importer-fichier"]').click();
      etat = await lire();
      exiger(etat.parties.length === 41, "la restauration JSON a tronqué l'historique.");
      const geo = await page.evaluate(() => JSON.parse(localStorage.getItem("coachgolf.geo.v1") || "null"));
      exiger(geo && geo.pcs && geo.pcs.p1 && geo.pcs.p1.nom === "Parcours GPS de test",
        "la carte GPS du fichier n'a pas été restaurée.");
      if (!(await page.locator('[data-a="exporter-fichier"]').count()))
        await page.locator('button.ident[data-v="profil"]').click();
      const [download] = await Promise.all([
        page.waitForEvent("download"), page.locator('[data-a="exporter-fichier"]').click()
      ]);
      const exported = JSON.parse(fs.readFileSync(await download.path(), "utf8"));
      exiger(exported.parties.length === 41 && exported.cartesGeo && exported.cartesGeo.p1,
        "l'export JSON n'inclut pas toutes les parties et les cartes.");
      exiger(!errs.length, "erreur JavaScript : " + errs.join("\n"));
      console.log("Parcours mobile + 41 parties + IndexedDB + GPS JSON : OK");
    } finally { await context.close(); }
  }

  try {
    await verify("Premier lancement", null);
    const trous = Array.from({length: 9}, () => [1, 0, 2, 0, 5, 4, 0, 0, 0, 0, 0]);
    const saved = {
      v: 1, profil: {prenom: "Test", index: 22, lateralite: "D", objectif:"score", symptomes:{}, lieux:["maison"], seances:2, duree:60}, plan:null,
      fait:{}, scores:{}, cycle:1, historique:[], maj:Date.now()-2000,
      carnet:{clubs:{f7:[145]}, wedges:{}, sac:null, lofts:{}, wedgesPerso:[], series:[]},
      defis:{}, parcours:[{id:"p1",nom:"Parcours test", pars:Array(18).fill(4)}],
      parties:Array.from({length:41},(_,i)=>({d:new Date(Date.now()-i*86400000).toISOString(),pc:"p1",trous, o:0})),
      partie:null, detail:false, ecranClair:false
    };
    await verify("Sauvegarde v1 de 41 parties", saved);
    await verifyMobile(saved);
  } finally {
    await browser.close(); await new Promise(ok => server.close(ok));
  }
}
main().catch(e => {console.error(e);process.exitCode=1;});
