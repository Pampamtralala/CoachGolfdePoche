/* Service worker de Coach de golf de poche : l'appli s'ouvre sans réseau, et se met à jour dès que le réseau revient.
   La page est demandée au réseau d'abord (version la plus récente), avec la copie gardée en secours. */
var VERSION = "20261127114336";
var CACHE = "coach-" + VERSION, POLICES = "coach-polices-1", PHOTOS = "coach-photos-1";
var FICHIERS = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png", "icon-maskable-512.png", "apple-touch-icon.png"];

self.addEventListener("install", function (ev) {
  ev.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(FICHIERS); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (ev) {
  ev.waitUntil(caches.keys().then(function (cles) {
    return Promise.all(cles.filter(function (k) { return k !== CACHE && k !== POLICES && k !== PHOTOS; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
function avecDelai(promesse, ms) {
  return new Promise(function (ok, ko) { var t = setTimeout(function () { ko(new Error("délai")); }, ms); promesse.then(function (r) { clearTimeout(t); ok(r); }, function (e) { clearTimeout(t); ko(e); }); });
}
self.addEventListener("fetch", function (ev) {
  var req = ev.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  /* Polices : la copie gardée d'abord, rafraîchie en arrière-plan. */
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    ev.respondWith(caches.open(POLICES).then(function (c) {
      return c.match(req).then(function (garde) {
        var frais = fetch(req).then(function (r) { if (r && (r.ok || r.type === "opaque")) c.put(req, r.clone()); return r; }).catch(function () { return garde; });
        return garde || frais;
      });
    }));
    return;
  }
  /* Photos aériennes de l'IGN : la copie gardée d'abord (jeu sans réseau), sinon le réseau, gardée au passage. */
  if (url.hostname === "data.geopf.fr" && /REQUEST=GetTile/i.test(url.search)) {
    ev.respondWith(caches.open(PHOTOS).then(function (c) {
      return c.match(req.url).then(function (garde) {
        return garde || fetch(req.url, { mode: "cors" }).then(function (r) { if (r && r.ok) c.put(req.url, r.clone()); return r; });
      });
    }));
    return;
  }
  if (url.origin !== self.location.origin) return;   /* cartes OpenStreetMap et autres services : toujours le réseau */
  var page = req.mode === "navigate" || /\/(index\.html)?$/.test(url.pathname);
  if (page) {
    /* La page : le réseau d'abord, quatre secondes au plus, puis la copie gardée. */
    ev.respondWith(avecDelai(fetch(req, { cache: "no-cache" }), 4000).then(function (r) {
      if (r && r.ok) { var copie = r.clone(); caches.open(CACHE).then(function (c) { c.put("index.html", copie); }); }
      return r;
    }).catch(function () {
      return caches.match("index.html").then(function (r) { return r || caches.match("./"); });
    }));
    return;
  }
  ev.respondWith(caches.match(req).then(function (garde) {
    return garde || fetch(req).then(function (r) { if (r && r.ok) { var copie = r.clone(); caches.open(CACHE).then(function (c) { c.put(req, copie); }); } return r; });
  }));
});
