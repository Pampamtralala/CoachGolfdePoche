# Roadmap UX V4 — Réorganisation « Collecter → Comprendre → Agir »

Source : spécification « Roadmap de réorganisation UX/UI » du 27/11/2026 (12 pages), remise par le propriétaire.
Base : branche `app` au commit `bb64f5d` (roadmap V3, UX01 à UX14, entièrement fusionnée).

## Décisions actées (spécification, page 1)

- Supprimer entièrement le sac 3D et les séries de balles au practice : miniatures, saisie balle par balle, accès.
- Réorganiser les cinq espaces sans perdre l'analyse utile : **Accueil · Performance · Jouer · Sac · Activité**.
- Réduire fortement le texte ; chiffres, graphiques et tendances au premier plan (objectif indicatif : −60 % de texte
  sur les écrans de synthèse).
- Refondre Mon sac : onglets **Distances · Performance · Wedges** ; configuration séparée.
- Préserver la saisie golfique réelle, les sauvegardes, le hors-ligne et le GPS approximatif.
- Simplifier l'interface n'est pas supprimer les données : les anciennes données de practice sont archivées et
  restent exportables.

## Suivi des chantiers

| N° | Chantier | Priorité | Dépend de | Statut | Branche · PR |
| --- | --- | --- | --- | --- | --- |
| 01 | Audit de l'existant | P0 | — | **En revue** | `ux4/01-audit` |
| 02 | Retirer le sac 3D | P0 | 01 | À faire | — |
| 03 | Retirer les séries de practice (archivage des données) | P0 | 01, S01 | À faire | — |
| 04 | Unifier les composants visuels (titre / section / KPI / contexte / aide) | P0 | 01 | À faire | — |
| 05 | Arborescence et navigation (Accueil · Performance · Jouer · Sac · Activité) | P0 | 02–04 | À faire | — |
| 06 | Refaire l'accueil | P0 | 04, 05 | À faire | — |
| 07 | Regrouper Performance (5 familles) | P0 | 04, 05 | À faire | — |
| 08 | Simplifier Jouer et le bilan | P1 | 05 | À faire | — |
| 09 | Unifier Activité et le profil (coaching et Mes données dans le profil) | P1 | 05 | À faire | — |
| S01 | Séparer références et observations | P0 | 01 | **En revue** | `ux4/s01-references` |
| S02 | Trois onglets de Mon sac, configuration par une icône | P0 | 02–04 | À faire | — |
| S03 | Graphique d'étagement | P0 | S01, S02 | À faire | — |
| S04 | Fiches clubs individuelles | P0 | S01, S02 | À faire | — |
| S05 | Statistiques clubs centralisées dans le Sac | P0 | S01, 07 | À faire | — |
| S06 | Classements et comparateur | P1 | S04, S05 | À faire | — |
| S07 | Matrice de wedges (cellules, références ≠ observations) | P1 | S01, S02 | À faire | — |
| S08 | Putter et configuration | P1 | S02 | À faire | — |
| S09 | Identité visuelle (clair, sombre, plein soleil) | P2 | tout le reste | À faire | — |

Ordre retenu : 01 → S01 → 02 → 03 → 04 → 05 → 06 → 07 → S02 → S03 → S04 → S05 → 08 → 09 → S06 → S07 → S08 → S09.
S01 passe avant 03 : on ne retire les séries qu'une fois leurs données archivées et les sources distinguées.

## 01 — Inventaire

### Sac 3D (chantier 02)

| Élément | Où |
| --- | --- |
| Moteur de rendu 3D | `src/sac3d.js` (189 lignes), inclus par `ui.js` (`/*INCLURE:sac3d.js*/`) |
| Styles | `src/sac3d.css` (73 lignes), injecté par `build.js` ; règles `.sac-scene`, `.c3d-*` dans `style.css` |
| Scène et miniatures | `ui-sac.js` : `sacScene()` (l. 82), `sacHTML()` (l. 128), sélection d'un club dans la scène |
| Affichage | `ui-carnet.js` : section « Le sac en 3D » de Mon sac |
| Essais | `essai7.js` (scène), `essai-sac3d.js` (fichier autonome, déjà en échec), parties d'`essai33` et `essai39` |

À garder hors 3D : composition du sac (`sacActuel`, `sac-composer`), alertes d'écart entre clubs (`analyseSac`),
fiche club, matrice de wedges.

### Séries de balles au practice (chantier 03)

| Point d'entrée | Où |
| --- | --- |
| Création, saisie balle par balle, ellipse | `src/ui-series.js` (160 lignes), action `serie-ouvrir`, fiche `serie` |
| Mon sac | raccourci « Série de balles », appel `serieAppelHTML()`, boutons du tableau « Mes clubs » et de la fiche club, historique des mesures (`ui-tableau.js` l. 189–209) |
| Mon jeu | étape « Mesurer un club au practice » des Premiers pas, action rapide « Mesurer une série au practice » |
| Programme | raccourci « Série de balles », appel en bas de page (`ui.js` l. 710, 730) |
| Recherche | entrée « Série de balles au practice » (`ui-menu.js` l. 68) |
| Activité | type « Practice » de la chronologie (`ui-chronologie.js`, `engine-chronologie.js`) |
| Stratégie | `ui-strategie.js` l. 10 : la dispersion latérale d'un club lit aussi les séries |
| Mes données | `engine-donnees.js` l. 155 : décompte des séances |
| Enseignements | « Mesure les distances de tes clubs » propose une série |
| Essais | `essai3, 6, 8, 9, 10, 11, 12, 19, 33, 35, 37, 39` y font référence |

Les défis « en série » (putting : réussites consécutives) ne sont pas des séries de practice : ils restent.

### Contrat de données des distances (S01) — état actuel

| Provenance | Stockage actuel | Dans la moyenne observée aujourd'hui ? | Cible (spécification) |
| --- | --- | --- | --- |
| Référence manuelle d'un club | `carnet.clubs[id] = [v]` (saisie dans la fiche) | **Oui** (mêlée) | Non : aide au choix, valeur de secours |
| Balles des séries de practice | `carnet.series` **et** ajoutées à `carnet.clubs[id]` | **Oui** (mêlée) | Archivées, exclues par défaut |
| Distance déclarée d'un coup réel | `partie.coups[].d` | Oui | Oui, selon filtres |
| Distance GPS d'un coup réel | `partie.coups[].d`, `source: "gps"` | Oui (part GPS signalée) | Oui, avec provenance |
| Distance estimée | calculée (`sacEstimation`, moyenne du club) | Non | Non, jamais |
| Inconnue | absente | Non | « — », jamais zéro |

**Point de vigilance confirmé** : `mesuresTout()` (`ui-sac.js` l. 39) fusionne `carnet.clubs` et les coups du parcours ;
dans `carnet.clubs`, on ne peut plus distinguer une référence saisie d'une balle de série. Proposition pour S01 : ces
valeurs deviennent « héritées » (affichées à part, exportables, exclues des moyennes observées), sans modifier le
format de sauvegarde ; les nouvelles références manuelles sont rangées à part.

### Navigation : V3 → V4 (chantiers 05, 07, 09, S05)

| Aujourd'hui (V3) | Demain (V4) |
| --- | --- |
| Mon jeu | **Accueil** : index, 4 indicateurs cliquables, une priorité, dernière partie, une action |
| Analyses › 12 rubriques | **Performance** › 5 familles : Résultats et progression (performance générale) · Secteurs de jeu (mises en jeu, attaque de green, petit jeu, putting) · Erreurs et coups perdus (erreurs, coups perdus estimés) · Parcours et trous · Comprendre mon jeu (questions et enseignements fusionnés) |
| Analyses › Comparaison des clubs | **Sac** › Performance (S05) |
| Analyses › Qualité des données ; Mes données | **Profil** › Mes données |
| Analyses › Programme, Exercices et défis ; badges, cycles | **Profil** › Coaching (liens depuis les constats) |
| Jouer | **Jouer** : nouvelle partie, saisie d'une ancienne partie, parcours et GPS, conditions, mode de saisie |
| Mon sac | **Sac** : Distances (défaut) · Performance · Wedges ; configuration par une icône |
| Journal | **Activité** : chronologie (parties, entraînements), rapports, notes, corrections ; sans séries |

Les alias existants (`#analyses`, `#journal`, `#parties`, `#plan`…) seront redirigés vers leur nouvel emplacement.

### Référence de texte visible (mesurée)

`node mesure-texte.js` : carnet type (12 parties, un parcours, un sac en partie mesuré), téléphone 390 px.
Fichier : `mesures-ux/texte-avant-v4.json`.

| Écran | Caractères | Mots | Hauteur de page (px) | Cible V4 |
| --- | --- | --- | --- | --- |
| Accueil (Mon jeu) | 2 411 | 467 | 3 722 | −60 % (≈ 960 caractères) |
| Performance (Analyses, rubrique par défaut) | 2 245 | 459 | 3 418 | −60 % (≈ 900 caractères) |
| Jouer | 639 | 121 | 1 288 | sans hausse |
| Sac | 1 264 | 265 | 3 029 | baisse attendue (3D et séries retirés) |
| Activité (Journal) | 1 638 | 409 | 2 653 | baisse attendue |

### Tests de référence

- `npm test` : 944 noms, 0 doublon, 0 échec ; `test-startup.js` : OK.
- Essais Playwright 3 à 39 : tous verts sur `app` (`bb64f5d`).
- Les essais qui couvrent le sac 3D et les séries seront retirés ou réécrits avec les chantiers 02 et 03 ; les essais
  de navigation (28, 32) avec 05 et 07.

### Risques identifiés

- **Stratégie** : la dispersion d'un club y lit aussi les séries ; après 03, elle ne repose que sur les coups du
  parcours (moins de données au début) — à dire à l'écran plutôt que de compléter.
- **Moyennes de distance** : exclure les valeurs « héritées » fera baisser le nombre de mesures affiché ; il faut
  l'expliquer une fois (S01), sans perdre les valeurs.
- **Liens profonds** : beaucoup de liens internes visent `bilan`, `practice`, `exercices`, `journal` : redirections à
  tester une par une (05).
- **Volume** : 18 chantiers ; chacun en PR séparée, fusionnée sur accord, pour pouvoir revenir en arrière.

### Points à confirmer avant les suppressions

1. Les valeurs actuelles de `carnet.clubs` (références et balles de séries mêlées) deviennent « héritées » : gardées,
   exportables, affichées à part, exclues des moyennes observées.
2. Les défis « en série » du putting restent (ce ne sont pas des séries de practice).
3. La PR #2 (brouillon « Reprise fiabilisée », du 20/11) peut être fermée : son contenu a été repris depuis.

Confirmés par l'utilisateur le 27/11 (« OK pour les 3 ») ; PR #2 fermée.

## Journal des chantiers V4

### 01 — Audit de l'existant (27/11/2026)

- Objectif : inventorier avant de supprimer quoi que ce soit ; établir les références de texte et de tests.
- Modifications : ce fichier, `mesure-texte.js` (mesure reproductible du texte visible), `mesures-ux/texte-avant-v4.json`,
  statuts d'UX09 à UX14 passés à « Terminé » dans `ROADMAP_UX.md`. Aucun code applicatif modifié.
- Vérifications : aucune branche UX encore en revue (seule la PR #2, ancienne, reste ouverte) ; `npm test` et essais 3
  à 39 verts sur `app`.
- Difficultés : la provenance des distances anciennes (`carnet.clubs`) n'est pas récupérable — d'où le point 1 ci-dessus.

### S01 — Séparer références et observations (27/11/2026)

- Objectif : qu'une distance saisie ne se fasse plus passer pour une distance observée.
- Données : nouveau champ `carnet.references` (une valeur par club, 10 à 400 m), assaini à la lecture. `carnet.clubs`
  n'est ni modifié ni supprimé : ses valeurs deviennent « héritées » (gardées, exportables, retirables une à une dans la
  fiche, plus d'ajout). Format des parties inchangé. Migration non destructive (rien à convertir).
- Moteur : `distancesDecision(observées, références, héritées)` dans `engine-plus.js` choisit, club par club, la valeur
  utilisée pour l'aide au choix de club (stratégie, saisie de coup, étagement) : observées si au moins 3 coups, sinon la
  référence, sinon les héritées, sinon les quelques observées ; la provenance est renvoyée. Testé par
  `test-references.js` (10 vérifications).
- Mon sac : la colonne « Distance » et la plage ne viennent que des coups joués (`mesuresParcours`) ; une référence
  s'affiche « réf. X m », une valeur héritée « X m hérité », l'inconnu « – » (jamais zéro). La colonne « Coups » compte les
  seuls coups observés. La fiche montre trois cases séparées : Distance observée, Référence, Mesures héritées.
- Fiche club : le champ devient « Distance de référence (facultatif) » avec bouton « Effacer la référence » ; la saisie
  balle par balle disparaît. Le loft d'un wedge ajouté déplace aussi sa référence.
- Vérifications : `npm test` (3214 + suites, 949 noms, 0 doublon), `test-startup.js`, essais 3 à 39 verts ; tableau
  sans débordement à 360 et 390 px (vérifié par mesure et capture). Essais adaptés : 3, 6, 7, 9 (saisie par référence),
  33 (nouveau contrat).
- Restent pour 02/03 : sac 3D et graphe de régularité (alimentés par les valeurs de décision), boutons de série.
