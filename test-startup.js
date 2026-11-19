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
  } finally {
    await browser.close(); await new Promise(ok => server.close(ok));
  }
}
main().catch(e => {console.error(e);process.exitCode=1;});
