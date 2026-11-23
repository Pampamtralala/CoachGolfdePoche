# Journal des sessions — roadmap DATA

## 23 novembre 2026

```text
DATE : 23/11/2026
CRÉDITS ALLOUÉS / CONSOMMÉS / RESTANTS : non mesurables depuis la session de développement (aucun compteur
  fourni, AI_DAILY_CREDIT_LIMIT non renseigné). Une seule tâche délimitée a été faite, puis arrêt.
TÂCHE ACTUELLE : P01, sous-livrable 1/3 — statuts de distance (GPS / déclarée / estimée / inconnue)
FONCTIONNALITÉS LIVRÉES (branche, non publiées) :
  - Reprise de la PR #2 (brouillon) rebasée sur app : moyenne jamais enregistrée comme mesure, distance GPS
    totale exclue des moyennes de carry, métadonnées préservées à la modification d'un coup, export /
    restauration JSON avec les cartes GPS, test navigateur de démarrage.
  - statutDistance(c) et distanceCoup(c, moyennes) : un seul statut explicite partout.
  - Distance vide = inconnue (null). La moyenne du club s'affiche « ≈ 150 m (moyenne) » comme estimation
    calculée à la volée, jamais enregistrée ni réinjectée dans une moyenne. Pas d'estimation pour un
    demi-swing, un recentrage, un coup de bunker ou des arbres.
  - Les coups éventuellement enregistrés le 23/11 avec la moyenne (marque dm) sont lus comme estimations, sans
    suppression.
  - Observations : distanceStatut et direction gauche / droite ; « Qualité de mon carnet » affiche les
    effectifs par statut.
TESTS EXÉCUTÉS ET RÉSULTATS : npm test (test, test-plus 3214, stratégie 64, carte 110, handicap 23,
  distances 11) : 0 échec ; node build.js : OK ; test-startup (41 parties, IndexedDB, export GPS) : OK ;
  essais navigateur 3, 10, 11, 13, 15, 16 : OK.
BRANCHE / COMMIT / LIEN PR : data/p01-statuts-distance · PR brouillon vers app
BLOCAGES / RISQUES : aucun blocage. Fusion sur app non faite (ALLOW_PRODUCTION_MERGE=false).
  Les identifiants d'observation restent fondés sur la position (p0-t3-c1) : à rendre stables.
PROCHAINE TÂCHE AUTORISÉE : P01 sous-livrable 2/3 — identifiants stables des parties, trous et coups,
  avec migration non destructive et test sur 100+ parties.
```

## 23 novembre 2026 (soir)

```text
DATE : 23/11/2026
CRÉDITS ALLOUÉS / CONSOMMÉS / RESTANTS : non mesurables (aucun compteur fourni). Une tâche, puis arrêt.
TÂCHE ACTUELLE : P01, sous-livrable 2/3 — identifiants stables des parties, coups et séries
FONCTIONNALITÉS LIVRÉES :
  - PR #3 fusionnée sur app sur accord explicite du propriétaire (statuts de distance, reprise de la PR #2,
    panneau d'un coup qui reste sur l'ellipse).
  - Branche data/p01-identifiants-stables : src/engine-donnees.js (attribuerIds, nouvelId, idValide).
    Anciennes données : identifiant calculé à partir du contenu (déterministe, identique à chaque chargement),
    puis enregistré ; identifiant existant jamais modifié ; doublons et formes invalides remplacés.
    Saisie : identifiant aléatoire horodaté pour chaque nouvelle partie, coup et série ; un coup modifié
    garde le sien. Observations : identifiants partie / trou / coup, insensibles à la position.
TESTS EXÉCUTÉS ET RÉSULTATS : npm test (dont test-identifiants : 120 parties, 13 vérifications) : 0 échec ;
  test-startup : 41 parties + identifiants stables après rechargement et après restauration JSON : OK ;
  essais 2, 3, 10, 11, 15, 16 : OK. essai4 échoue aussi sur app avant ce changement (écran de saisie
  refondu le 19/11) : test à mettre à jour, sans lien avec cette PR.
BRANCHE / COMMIT / LIEN PR : data/p01-identifiants-stables · PR #4 (brouillon)
BLOCAGES / RISQUES : la taille des sauvegardes augmente un peu (un identifiant par coup).
PROCHAINE TÂCHE AUTORISÉE : P01 3/3 — croisement des observations par club, trou, parcours et période.
```

## 23 novembre 2026 (nuit)

```text
DATE : 23/11/2026
CRÉDITS ALLOUÉS / CONSOMMÉS / RESTANTS : non mesurables (aucun compteur fourni). Une tâche, puis arrêt.
TÂCHE ACTUELLE : P01, sous-livrable 3/3 — croiser les observations par club, trou, parcours et période
FONCTIONNALITÉS LIVRÉES :
  - PR #4 fusionnée sur app sur accord explicite (identifiants stables).
  - PR #5 ouverte, non fusionnée (fusion refusée sans accord explicite sur les deux changements de
    comportement) : tests navigateur remis à jour après la refonte du 19/11, mode express cohérent
    au premier lancement, accès rapides de l'accueil qui débordaient de l'écran.
  - Branche data/p01-croisements : croiserObservations(obs, axe, filtres) dans engine-donnees.js —
    axes club / trou / parcours / période (mois) / type ; filtres club, parcours, trou, période, type,
    seuil gauche / droite ; distances déclarées seules en moyenne, GPS à part, inconnues comptées,
    directions gauche / centre / droite ; null quand les données manquent.
  - Observations : parcours, jour et trou du parcours (un 9 trous joué deux fois reste 1 à 9).
TESTS EXÉCUTÉS ET RÉSULTATS : npm test (dont test-croisements : 15 vérifications) : 0 échec ;
  test-startup : OK ; essais 3 et 15 : OK.
BRANCHE / COMMIT / LIEN PR : data/p01-croisements · PR #6 (brouillon)
BLOCAGES / RISQUES : une partie terminée avec un trou non saisi au milieu décale la numérotation des
  trous suivants dans les observations (les trous vides sont retirés à l'enregistrement) : à traiter
  avec P07 (analyse par trou).
PROCHAINE TÂCHE AUTORISÉE : P03 — trois niveaux de saisie (Express / Standard / Expert).
```
