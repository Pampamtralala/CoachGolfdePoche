# Coach de golf de poche

Une appli de golf qui tient dans le téléphone : parties notées à une main, carte GPS des greens (distances à l'entrée,
au milieu et au fond, sur photo aérienne), coups reçus et Stableford selon l'index, sac et distances par club, stratégie,
programme d'entraînement, défis et statistiques.

**L'appli en ligne :** https://pampamtralala.github.io/CoachGolfdePoche/
Sur téléphone, ouvre cette adresse dans Chrome (Android) ou Safari (iPhone), puis « Ajouter à l'écran d'accueil » :
elle s'installe comme une appli et s'ouvre ensuite sans réseau.

## Comment c'est rangé

| Dossier ou fichier | Rôle |
|---|---|
| `src/` | Le code de l'appli. `engine*.js` et `data*.js` : calculs et données (fonctions pures, testées). `ui*.js` : l'interface. `*.css` : le style. |
| `pwa/` | Ce qui rend l'appli installable : manifeste, icônes, service worker (ouverture sans réseau). |
| `docs/` | **Le site publié.** Fabriqué par le build, servi par GitHub Pages. Ne pas modifier à la main. |
| `build.js` | Assemble `src/` en une seule page : `dist/index.html` (version claude.ai) et `docs/` (version installable). |
| `test*.js` | Tests des calculs : `npm test`. |
| `essai*.js` | Parcours de test dans un navigateur piloté (Playwright), avec GPS et réseau simulés. |

## Fabriquer et publier

```
node build.js     # fabrique dist/ et docs/
npm test          # vérifie les calculs
```

GitHub Pages sert le dossier `docs/` de la branche `app` (Settings → Pages → Deploy from a branch → `app` → `/docs`).
Chaque envoi sur cette branche met le site à jour en une minute environ ; le téléphone prend la nouvelle version au
lancement suivant. La date de la version s'affiche en bas du profil.

## Données et licences

- Les données du joueur (parties, sac, cartes) restent dans le navigateur du téléphone : rien n'est envoyé à un serveur.
- Cartes des parcours : © les contributeurs d'[OpenStreetMap](https://www.openstreetmap.org/copyright), licence ODbL,
  téléchargées par l'appli via l'API Overpass.
- [Chart.js](https://www.chartjs.org/) (MIT) et les médias de [NoSleep.js](https://github.com/richtr/NoSleep.js) (MIT) sont inclus dans `src/`.

## Données extérieures

Carte des parcours : © les contributeurs d'OpenStreetMap (ODbL), recherche par Nominatim.
Photos aériennes : © IGN, Géoplateforme (Licence ouverte Etalab 2.0), en France seulement.
