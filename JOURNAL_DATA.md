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
