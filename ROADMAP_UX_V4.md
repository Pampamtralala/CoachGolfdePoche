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
| 01 | Audit de l'existant | P0 | — | Terminé | `ux4/01-audit` · #31 |
| 02 | Retirer le sac 3D | P0 | 01 | Terminé | `ux4/02-sac3d` · #33 |
| 03 | Retirer les séries de practice (archivage des données) | P0 | 01, S01 | Terminé | `ux4/03-series` · #34 |
| 04 | Unifier les composants visuels (titre / section / KPI / contexte / aide) | P0 | 01 | Terminé | `ux4/04-composants` · #35 |
| 05 | Arborescence et navigation (Accueil · Performance · Jouer · Sac · Activité) | P0 | 02–04 | Terminé | `ux4/05-navigation` · #36 |
| 06 | Refaire l'accueil | P0 | 04, 05 | Terminé | `ux4/06-accueil` · #37 |
| 07 | Regrouper Performance (5 familles) | P0 | 04, 05 | Terminé | `ux4/07-performance` · #38 |
| 08 | Simplifier Jouer et le bilan | P1 | 05 | Terminé | `ux4/08-jouer` · #43 |
| 09 | Unifier Activité et le profil (coaching et Mes données dans le profil) | P1 | 05 | **En revue** | `ux4/09-activite-profil` |
| S01 | Séparer références et observations | P0 | 01 | Terminé | `ux4/s01-references` · #32 |
| S02 | Trois onglets de Mon sac, configuration par une icône | P0 | 02–04 | Terminé | `ux4/s02-onglets-sac` · #39 |
| S03 | Graphique d'étagement | P0 | S01, S02 | Terminé | `ux4/s03-etagement` · #40 |
| S04 | Fiches clubs individuelles | P0 | S01, S02 | Terminé | `ux4/s04-fiches-clubs` · #41 |
| S05 | Statistiques clubs centralisées dans le Sac | P0 | S01, 07 | Terminé | `ux4/s05-stats-clubs` · #42 |
| S06 | Classements et comparateur | P1 | S04, S05 | En revue | ux4/s06-classements |
| S07 | Matrice de wedges (cellules, références ≠ observations) | P1 | S01, S02 | En revue | ux4/s07-wedges |
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

### 02 — Retirer le sac 3D (27/11/2026)

- Objectif : supprimer la représentation 3D du sac et ses miniatures, sans toucher aux données ni aux analyses.
- Supprimé : `src/sac3d.js`, `src/sac3d.css` (et leur inclusion dans `build.js` / `ui.js`), la scène et la carte
  « club sorti » de Mon sac (`clubsScene`, `sacScene`, `sacInfoHTML`, `sacMiniHTML`, `majSacDirect`, actions `sac-vide`
  et `sac-modifier`), la miniature de la stratégie « se joue comme » (`.sjc-sac`), celle du paysage d'accueil (code mort),
  les règles CSS associées, et `essai-sac3d.js` (déjà en échec, fichier autonome disparu).
- Conservé : composition du sac, tableau « Mes clubs », alertes d'écart (`analyseSac`), bilan des écarts et graphe de
  régularité (section renommée « Étagement », ancre `#c-distances` inchangée), fiches clubs, matrice de wedges.
  L'action `sac-club` ouvre désormais directement la fiche (anciens liens).
- Vérifications : `npm test`, `test-startup.js`, essais 3 à 39 verts. Essais adaptés : 3, 6, 7, 8, 9, 10, 11, 19, 33, 39
  (accès aux fiches par le tableau ; les infos de la bulle 3D sont vérifiées dans la fiche : fourchette, « fiable à 90 % »).
- Poids : `index.html` passe de 1354 à 1328 Ko.

### 03 — Retirer les séries de practice (27/11/2026)

- Objectif : plus aucune saisie ni analyse de séries, sans perdre une seule donnée.
- Supprimé : `src/ui-series.js` (fiche de série, actions `serie-*`) et tous ses accès : raccourcis de Mon sac et du
  programme, bouton du tableau et de la fiche club, « Évolution de tes séries », appel en bas du programme, action rapide
  et étape « Mesurer un club au practice » de Mon jeu, entrée de la recherche, action de l'enseignement « distances »
  (devenu « Note la distance de tes coups pleins en partie », sans bouton), filtre « Practice » de la chronologie.
- Archivage : `carnet.series` reste dans la sauvegarde et l'export, assaini comme avant. Il n'alimente plus ni
  l'ellipse et la direction (`pointsClub` : coups du parcours seulement), ni la qualité des observations, ni la
  chronologie, ni l'historique du coaching. Mon sac affiche un bloc replié « Séries de practice archivées (n) » (ancre
  `#c-historique` conservée, aussi trouvable par la recherche) ; Mes données parle de « Séries de practice archivées ».
- Conservé : le nuage de dispersion (déplacé dans `ui-sac.js`, il sert à la fiche quand l'ellipse manque), les défis de
  putting « en série », le moteur `chronologie` / `observationsGolf` (testés avec des séries en entrée).
- Vérifications : `npm test` (933 noms, 0 doublon), `test-startup.js`, essais 3 à 39 verts. Essais adaptés : 10
  (mesures héritées + série archivée injectées), 11 (onze coups de partie avec direction ; une série archivée ne compte
  plus), 31, 33, 35, 37. `essai10` signale désormais ses échecs par son code de sortie.
- Note de méthode : le script de lots lit maintenant la liste `ko` de chaque essai (et pas seulement le code de
  sortie, que plusieurs essais ne positionnent pas) ; c'est ce qui a révélé l'essai 3 à corriger depuis S01.
- Poids : `index.html` passe de 1328 à 1314 Ko.

_01, S01, 02 et 03 fusionnés dans `app` le 27/11 (PR #31 à #34), déploiement Pages vérifié._

### 04 — Unifier les composants visuels (27/11/2026)

- Objectif : une seule hiérarchie page › section › donnée principale › contexte › aide à la demande, avant de refaire
  les écrans (06, 07, S02…).
- Nouveau `src/ui-composants.js` : `pageTeteHTML`, `sectionTeteHTML` (titre + « Détail › » + aide repliée),
  `kpiHTML` / `kpisHTML` (titre, provenance, valeur — « – » si inconnue —, tendance, unité, contexte, constat, effectif ;
  carte entière cliquable vers le détail, ou aide repliée « ⓘ » si la carte n'est pas un lien), `aideHTML` (pli signalé
  par « i » ; `comment()` en devient un alias), `etatVideHTML` (déplacé depuis `ui-tableau.js`).
- Adoption : les six cartes KPI réécrites à la main (Mon jeu, tableau de bord, repères, putting, rapport du journal,
  fiche club) passent par `kpiHTML` ; toutes les aides « Comment ça marche » prennent le style commun ; le pli
  d'import de la carte aussi. Les explications des KPI du tableau de bord et des repères sont repliées (« Détail »,
  « Comment lire ») ; Mon sac remplace son paragraphe d'explication par une aide repliée et une ligne d'état.
- Styles : `.kpi` unique (plus de variante bouton/article), `.aide-pli`, `.section-tete`, `.page-tete`.
- Audit texte (`mesure-texte.js`, élargi à trois rubriques d'analyse ; `mesures-ux/texte-avant-04.json` →
  `texte-apres-04.json`) : Performance −7 %, Mon sac −17 % (−47 % depuis la référence V4), autres écrans inchangés —
  la réduction forte viendra de la refonte des écrans (06, 07), qui s'appuiera sur ces briques.
- Vérifications : `npm test`, `test-startup.js`, essais 3 à 39 verts (essais 5, 13, 18, 33 adaptés au nouveau balisage).

### 05 — Arborescence et navigation (27/11/2026)

- Barre : **Accueil · Performance · Jouer · Sac · Activité** (Jouer reste l'action principale, au centre). Les
  identifiants internes des pages ne changent pas (`accueil`, `bilan`, `parcours`, `sac`, `journal`) : aucun lien
  interne ni aucune sauvegarde n'est touché.
- Coaching (programme, exercices et défis, badges) rangé dans le **profil** : section « Coaching » du profil,
  sous-navigation « ‹ Profil · Programme · Exercices et défis » ; le bouton du profil (en-tête) est marqué sur ces pages.
  La sous-navigation de Performance ne garde que Statistiques, Enseignements, Comprendre mon jeu (leur fusion : 07).
- Adresses : publiques `#performance`, `#activite`, `#jouer` ; tous les anciens noms restent des alias (`#bilan`,
  `#analyses`, `#journal`, `#parties`, `#plan`, `#distances`…), plus `#perf`, `#activité`, `#defis`.
- Routes de fonctions supprimées redirigées explicitement, avec un message : `#series`, `#serie`,
  `#historique-mesures` → Sac, séries archivées ; `#sac3d`, `#sac-3d` → Sac, tableau des clubs.
- Titres de page courts : « Performance », « Sac », « Activité ». Recherche regroupée selon la nouvelle arborescence ;
  l'entrée « Composer mon sac » de la recherche, cassée depuis longtemps (`sac-modifier`), ouvre bien la composition.
- Vérifications : `npm test`, `test-startup.js`, essais 3 à 39 verts. `nav-essai.js` passe par le profil pour le
  coaching ; essais 12, 24, 28 (barre, alias, adresses publiques, routes retirées), 31, 38 adaptés.

### 06 — Refaire l'accueil (27/11/2026)

- Accueil « cockpit », dans cet ordre : titre ; **index** (déclaré en grand avec son évolution ; l'estimé n'apparaît
  que s'il n'y a pas d'index déclaré, marqué « pas ton index officiel » ; objectif ; historique d'index s'il existe) ;
  **4 KPI cliquables** sur les 10 dernières parties, comparés aux 10 précédentes (score, départs jouables, greens en
  régulation — déduit —, putts), chacun ouvre sa rubrique ; **une priorité** (premier point de vigilance, erreur ou
  opportunité du moteur d'enseignements, sinon « données à enrichir ») ; **dernière partie** (parcours, score, GIR,
  putts, pénalités, comparaison à la moyenne) ; **une action dominante** (« Nouvelle partie », ou « Reprendre » en
  tête quand une partie est en cours).
- Retiré de l'accueil : catalogue d'actions rapides, raccourcis « Comprendre mon jeu », lien coaching, six KPI avec
  filtre de période, trois cartes d'enseignements, lien « Qualité de mes données » (tout reste dans Performance,
  Activité et le profil). L'accueil n'a plus de filtre : fenêtre fixe de 10 parties, annoncée dans l'en-tête de section.
- Carnet vide : seulement les premiers pas (partie, trois parties, index facultatif) ; plus de cartes vides en double.
- Texte visible (référence V4 → maintenant) : accueil 2411 → 480 caractères (**−80 %**), Sac 1264 → 645 (−49 %)
  (`mesures-ux/texte-apres-06.json`). Performance attend le chantier 07.
- Vérifications : `npm test`, `test-startup.js`, essais 3 à 39 verts ; essais 12, 27, 29, 30, 31, 32, 37 adaptés.
  Capture 390 px vérifiée (carnet vide et rempli).

_04, 05 et 06 fusionnés dans `app` le 27/11 (PR #35 à #37), déploiement Pages vérifié._

### 07 — Regrouper Performance (27/11/2026)

- Cinq familles en pastilles (sur deux lignes au besoin, toutes visibles) : **Résultats** (score, index, régularité,
  repères), **Secteurs** (Départs · Attaque · Petit jeu · Putting, en seconde rangée), **Erreurs** (Erreurs · Coups
  perdus), **Parcours** (Parcours · Trous), **Comprendre**. Les douze rubriques restent les unités de contenu : liens
  profonds, recherche et KPI de l'accueil inchangés ; chaque famille retient la dernière rubrique ouverte.
- Fusion Enseignements / Comprendre : la sous-navigation disparaît ; « Comprendre mon jeu » montre les enseignements
  (cinq en une ligne chacun, « Tous les enseignements (n) ») puis les douze questions, avec une aide repliée sur leur
  provenance. Dans les autres rubriques, les enseignements liés tiennent aussi en une ligne (détail au clic).
- Résultats : chiffres et graphique d'abord ; le palier (déclaré) devient un pli comme les priorités, la carte, les
  repères ; « Tes trois priorités » n'est plus ouvert d'office. En bas : Bilans et rapports, **Statistiques par club**
  (déménagent dans Sac en S05) et **Qualité de mes données** (profil en 09), hors familles d'ici là.
- Filtre commun inchangé, en tête de toutes les familles sauf Comprendre (les questions ont leur propre sélecteur,
  synchronisé).
- Texte visible de Performance (référence V4 → maintenant) : 2245 → 1217 caractères (**−46 %**)
  (`mesures-ux/texte-apres-07.json`).
- Vérifications : `npm test`, `test-startup.js`, essais 3 à 39 verts. `nav-essai.js` gagne `allerRubrique` (famille
  puis rubrique) ; essais 21, 22, 23, 25, 27, 28, 29, 30, 31, 32, 38 adaptés. Captures 390 px vérifiées.
- **Retour utilisateur (28/11)** : la fiche « Comprendre mon jeu » s'ouvrait par-dessus l'écran (« une surcouche qui
  n'a rien à faire avec le reste de l'appli »). Corrigé : plus aucune fiche pour l'analyse. Les questions s'ouvrent en
  accordéon, en place, sous le filtre commun (désormais affiché aussi pour Comprendre) ; les enseignements aussi (une
  ligne → la carte complète), avec « Tous les enseignements (n) » en place. Les accès venus d'ailleurs (accueil,
  recherche, « Voir le détail ») mènent à Performance › Comprendre, question ouverte et amenée à l'écran. Supprimés :
  `analysteHTML`, `ensHTML` et leurs branches de `rendreFeuille`. Essais 27, 28, 29, 30, 32 réécrits pour ce modèle ;
  essais 3 à 39 verts.

_07 (et le correctif « Comprendre en place ») fusionné dans `app` le 28/11 (PR #38), déploiement Pages vérifié._

### S02 — Trois onglets dans Sac (28/11/2026)

- En-tête : « Sac » et une icône de **configuration** (réglages) qui ouvre la composition du sac, rebaptisée
  « Configuration du sac » (composition, lofts, wedges perso) ; le bouton « Composer mon sac » du tableau disparaît.
- Onglets **Distances** (par défaut) · **Performance** · **Wedges**, en pastilles pleine largeur.
  - Distances : trois chiffres (clubs n/14 putter compris, documentés — au moins 3 coups joués —, à vérifier — écarts
    anormaux) ; tableau « Mes clubs » ; étagement (écarts entre voisins, régularité) ; séries archivées repliées.
    La ligne d'état sous le titre, redondante avec les chiffres, est retirée.
  - Performance : profil des clubs (même calcul que Performance › clubs, `clubsStatsHTML`, sur la période du filtre
    commun, rappelée en tête) — S05 le retirera de Performance.
  - Wedges : la matrice.
- Liens profonds : `#c-wedges` ouvre l'onglet Wedges, `#st-clubs` l'onglet Performance, `#c-synthese`, `#c-distances`,
  `#c-historique` l'onglet Distances (`allerA`).
- Texte visible de Sac (onglet par défaut) : 1264 → 491 caractères (**−61 %** depuis la référence V4).
- Vérifications : `npm test`, `test-startup.js`, essais 3 à 39 verts ; essais 3, 6, 9 (matrice dans l'onglet Wedges),
  28, 33 (onglets, chiffres, lien profond, icône) adaptés. Captures 390 px vérifiées.

_S02 fusionné dans `app` le 28/11 (PR #39)._

### S03 — Graphique d'étagement (28/11/2026)

- Onglet Distances : le tableau « Mes clubs » devient le graphique **Étalonnage** — une ligne par club (le putter est
  hors étagement), sur une échelle commune en mètres (graduations de 50 m) :
  - ● distance typique et ━ fourchette habituelle des **coups joués** (fourchette seulement à partir de 3 coups) ;
  - ○ un ou deux coups seulement (« Peu de coups (n/3) ») ; ◇ distance de **référence** ; ◌ valeur **héritée** ;
  - « — » et aucun point quand rien n'est connu (jamais d'estimation dessinée) ;
  - écart anormal : point et note en couleur d'alerte (« Trou de 16 m avec le fer 9 »).
  Chaque ligne est un bouton vers la fiche du club, avec une étiquette complète pour les lecteurs d'écran (distance,
  fourchette, nombre de coups, alerte). Légende sous le graphique ; explication repliée (« Lire ce graphique »).
- **Points de vigilance** : seulement les écarts anormaux (trou, redondance, ordre inversé), chacun vers la fiche, puis
  le putter (« Voir sa fiche ») ; la liste de tous les écarts (zone idéale) reste consultable, repliée.
- **Jamais d'alerte sur des données trop rares** : un club connu seulement par un ou deux coups joués (sans référence
  ni valeur héritée) n'entre plus dans l'analyse des écarts (`clubsVus` s'appuie sur la provenance de
  `distancesDecision`).
- Retiré : le graphique « Régularité par club » (canvas de l'ère practice) ; la fourchette observée le remplace.
- Vérifications : `npm test`, `test-startup.js`, essais 3 à 39 verts ; essais 33 (lignes, marqueurs, inconnu,
  alerte, vigilance, ouverture de fiche) et 37 (état vide sans point inventé) adaptés. Captures 390 px vérifiées.

_S03 fusionné dans `app` le 28/11 (PR #40)._

### S04 — Fiches individuelles des clubs (28/11/2026)

- La fiche d'un club n'est plus une fiche par-dessus l'écran : c'est une **page de Sac** (`ui.sacClub`), ouverte
  depuis le graphique d'étagement, les points de vigilance ou les anciens liens (`sac-club`). « ‹ Sac » ramène à la
  liste (club remis à l'écran) ; toucher Sac dans la barre aussi. Navigation « ‹ club précédent · club suivant › »
  dans l'ordre du sac, putter compris.
- Consultation, sur toutes les parties : nom, coups enregistrés et parties ; **distance observée** en grand (fourchette,
  nombre de mesures, GPS) — sinon « – » avec la référence ou l'héritée en petit ; **direction en trois catégories**
  (gauche · axe · droite, effectif, coups sans direction) ; **arrivées en jeu** (arrivées connues), **utilisation**
  (coups par partie où il sert), départs jouables s'il prend des départs ; **évolution** (tendance du moteur) ;
  plis **Dispersion**, **Historique des coups** (30 plus récents : date, trou, distance et provenance — GPS, estimée —,
  direction), **Comparer un club** (onglet Performance de Sac, club présélectionné, toutes les parties), **Données et
  mesures** (observées, référence, héritées, estimations jamais comptées).
- **Jamais de dispersion inventée** : l'ellipse n'apparaît que si des écarts latéraux ont vraiment été notés et que
  les distances sont observées (≥ 3) — plus de largeur estimée d'après l'index sur la page ; à défaut, le nuage des
  distances observées ; sinon rien.
- **Réglages séparés** (icône) : la fiche ne garde que loft, distance de référence (écarts avec les voisins),
  mesures héritées, effacer la référence, retirer du sac. Retirer du sac ramène à la liste.
- **Putter** : page dédiée reliée au putting (putts et trois-putts par 18 trous, « Voir mon putting ») ; aucune
  statistique attribuée au club lui-même.
- Vérifications : `npm test`, `test-startup.js`, essais 3 à 39 verts. `nav-essai.js` gagne `listeSac`, `pageClub`,
  `reglagesClub` ; essais 3, 6, 7, 8, 9, 10, 11, 19, 33 adaptés (dont : héritées seules → aucune dispersion ;
  provenance ; navigation entre clubs ; réglages sans chiffres). Captures 390 px vérifiées.

_S04 fusionné dans `app` le 28/11 (PR #41)._

### S05 — Centraliser les statistiques des clubs dans Sac (28/11/2026)

- La rubrique « Comparaison des clubs » quitte Performance : le profil des clubs, les départs par type de club et le
  comparateur ne vivent plus que dans **Sac › Performance** (`clubsStatsHTML`, un seul calcul).
- Filtre conservé sans duplication : l'onglet porte les mêmes pastilles de période que Performance, sur le même état
  (`filtresStats`) ; changer la période ici la change aussi là-bas, et inversement.
- Liens contextuels : « Statistiques par club (dans Sac) » en bas de Résultats ; `allerA("bilan", "st-clubs")` (anciens
  liens) et `st-voir-club` mènent à Sac › Performance ; nouvelle entrée de recherche « Statistiques et comparaison des
  clubs » ; la page d'un club garde « Comparer un club ».
- Vérifications : `npm test`, `test-startup.js`, essais 3 à 39 verts ; essais 19 (profil des clubs depuis Sac,
  filtres partagés) et 32 (onze rubriques, lien vers Sac) adaptés. Capture 390 px vérifiée.

### 08 — Simplifier Jouer et le bilan (28/11/2026)

- **Jouer = collecte** : titre « Jouer », une action principale (« Nouvelle partie · Score et coups sur le parcours »,
  ou la partie en direct avec « Reprendre » quand une partie est en cours), puis trois accès : **Saisir une ancienne
  partie** (compléter son historique), **Mes parcours et GPS**, **Conditions de jeu** (vent et température du jour,
  résumé si déjà notées) ; enfin le **niveau de saisie** au lancement (Express · Standard · Expert, modifiable en
  partie ; la distance reste facultative, sans préremplissage). « Mes parties » quitte Jouer : l'historique est dans
  Activité.
- **Ancienne partie** : le même départ, avec la **date** en premier et des libellés au passé (« Tu as joué ») ; la
  partie est datée de ce jour-là (à midi) ; une date future est refusée. Pour une partie du jour, la date est en
  dernier, déjà remplie.
- **Bilan express court** : score, trois points à retenir (constat et poids en coups) ; les boutons d'exercices et de
  défis en sortent (coaching rangé dans le profil) ; habitudes, trous marquants, clubs et erreurs sont repliés dans
  « Plus de détails sur cette partie » ; « Voir la partie en chiffres » et « Voir l'analyse complète » restent.
- Texte : Jouer 639 → 713 caractères (+12 %, trois accès nouveaux à la place d'un long paragraphe d'aide et du lien
  vers les parties) ; textes de la carte GPS raccourcis.
- Vérifications : `npm test`, `test-startup.js`, essais 3 à 40 verts ; **nouvel `essai40.js`** (accès de Jouer,
  ancienne partie : date d'abord, libellés, futur refusé, partie datée) ; essai 28 adapté.

_S05 et 08 fusionnés dans `app` le 28/11 (PR #42, #43)._

### 09 — Unifier Activité et le profil (28/11/2026)

- **Activité = l'historique** : « Mon activité », la chronologie (pastilles **Tout · Parties · Entraînement** ;
  index et notes restent dans « Tout » ; période et parcours repliés, ouverts dès qu'on s'en sert ; faits marquants ;
  regroupement par mois ; chaque événement ouvre son détail), puis **Bilans et rapports** (mois, trimestre, saison,
  notes et import) et **Mes données et sauvegardes** (lien vers le profil) ; le tableau des parties (carte de score,
  notes, corrections) est replié. Retirés : le paragraphe d'introduction (qui parlait encore de séries de practice) et
  la rangée de boutons. Aucun filtre « practice ».
- **Profil** : **Mes données** passe avant le coaching — état d'enregistrement, **Qualité de mon carnet** (mesuré,
  estimé, déclaré) repliée, Voir et corriger, sauvegarder / restaurer (fichier ou texte), Tout effacer. Le
  **coaching** est en second (« Facultatif : programme, exercices, défis et badges »).
- **Performance** perd la rubrique « Qualité des données » : le lien de fin de Résultats et les anciens liens
  (`#qualite-donnees`) ouvrent le profil, pli de qualité ouvert. Il reste dix rubriques dans cinq familles.
- Texte visible d'Activité (référence V4 → maintenant) : 1638 → 931 caractères (**−43 %**).
- Vérifications : `npm test`, `test-startup.js`, essais 3 à 40 verts ; essais 23 (Mes données), 28 (Activité), 32
  (dix rubriques, lien qualité → profil), 35 (types, note visible, filtres repliés) adaptés.

_09 fusionné dans `app` le 28/11 (PR #44)._

### S06 — Classements et comparateur (28/11/2026)

- **Classements** dans Sac › Performance (bloc « Profil des clubs ») : un seul critère à la fois — **Précision**
  (part dans l'axe), **Utilisation** (coups par partie), **En jeu** (arrivées en jeu), **Départs** (départs
  jouables). Chaque ligne : rang, club, **effectif** (« 56 coups », « 12 départs »…), barre relative au premier,
  valeur ; elle ouvre la fiche du club. **Aucune note globale.**
- Un club n'est classé qu'à partir de **5 observations** pour le critère ; en dessous, il est listé à part, sans rang,
  dans un pli « Peu de données, non classés » (valeur ou « — »). Un club sans départ n'apparaît pas au classement des
  départs.
- **Comparateur** : le tableau côte à côte reste (chaque pourcentage avec son n, « – » si rien) ; il précise qu'il
  porte sur les mêmes parties et la même période (filtre commun avec Performance). Les deux profils détaillés passent
  dans un pli « Détail des deux profils ».
- Vérifications : `npm test`, `test-startup.js`, essais 3 à 40 verts ; essai 19 étendu (quatre classements triés,
  effectifs visibles, pas de score global).

### S07 — Matrice de wedges (28/11/2026)

- **Tableau compact** loft × amplitude : **¼ (7 h 30) · ½ (9 h) · ¾ (10 h 30) · Plein**. Chaque case sépare la
  **référence** (ce que tu déclares, chiffre en gras) de l'**observé** (moyenne des coups joués sur le parcours, en
  pastille, avec le nombre de coups : « 42 3× »). Sans l'un ni l'autre : « — ». Rien n'est déduit d'un autre club ou
  d'une autre amplitude. En Plein, une ancienne valeur du carnet (origine non précisée) apparaît en italique « ≈ ».
- **Case cliquable** : le détail s'ouvre sous le tableau — saisie de la référence (¼ ½ ¾), ou lien vers les réglages du
  club (Plein, où la référence est celle du club) ; coups observés (moyenne, effectif, de … à …) ou « Aucun coup noté
  à cette amplitude » ; l'écart référence / observé est signalé à partir de 8 m, avec la réserve d'effectif.
- Les saisies en ligne dans le tableau disparaissent ; le graphique et les constats de trous restent sous la matrice ;
  l'explication passe dans un pli « Lire la matrice ».
- Vérifications : `npm test`, `test-startup.js`, essais 3 à 41 verts ; **nouvel `essai41.js`** (colonnes, référence ≠
  observé, inconnu « — », détail, modification sans toucher aux observations) ; essais 3, 6 et 9 adaptés (saisie par
  la case).
