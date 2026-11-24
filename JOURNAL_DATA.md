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

## 23 novembre 2026 (fin de soirée)

```text
DATE : 23/11/2026
CRÉDITS ALLOUÉS / CONSOMMÉS / RESTANTS : non mesurables (aucun compteur fourni).
TÂCHE ACTUELLE : P03 — trois niveaux de saisie (demandé avec P05 par le propriétaire)
FONCTIONNALITÉS LIVRÉES :
  - PR #5 et #6 fusionnées sur accord explicite.
  - Branche data/p03-trois-niveaux :
    · niveaux Express (score, putts, pénalités), Standard (+ mise en jeu, côté, club de départ, GIR
      déduit), Expert (+ coups, erreurs évitables, premier putt, stratégie) ; « detail » des anciennes
      sauvegardes = Expert ; changement de niveau en cours de partie sans perte ;
    · mise en jeu en trois états : non renseignée (rien d'enfoncé), jouable, ratée ; un second appui
      revient à « non renseignée » ; tableau renseigne par trou (bits : mise en jeu, club, premier putt) ;
      un trou noté en express a sa mise en jeu inconnue, jamais comptée « jouable » ;
    · misesEnJeu(trous, renseigne) : jouables parmi les par 4 et 5 renseignés ; la carte de partie
      montre « ? » pour une mise en jeu non renseignée et « – » pour un par 3 ;
    · « Compléter ou corriger cette partie » : copie dans le pavé, remplace l'originale (même
      identifiant, même place) seulement à la fin ; « Fermer » garde l'originale intacte.
TESTS EXÉCUTÉS ET RÉSULTATS : npm test (identifiants : 15 vérifications) : 0 échec ; test-startup : OK ;
  essai17 (P03) : OK ; essais 1 à 16 : OK.
BRANCHE / COMMIT / LIEN PR : data/p03-trois-niveaux · PR #7 (brouillon)
BLOCAGES / RISQUES : les parties anciennes (sans tableau renseigne) comptent comme renseignées, comme
  avant ; leurs mises en jeu pré-cochées « jouable » restent dans les statistiques.
PROCHAINE TÂCHE AUTORISÉE : P05 — tableau de bord statistique (demandé dans la même session).
```

## 23 novembre 2026 (nuit)

```text
DATE : 23/11/2026
CRÉDITS ALLOUÉS / CONSOMMÉS / RESTANTS : non mesurables (aucun compteur fourni).
TÂCHE ACTUELLE : P05 — tableau de bord statistique (demandé avec P03 par le propriétaire)
FONCTIONNALITÉS LIVRÉES (branche data/p05-tableau-de-bord, partie de data/p03-trois-niveaux) :
  - moteur engine-stats.js (fonctions pures) : sélection par parcours, format 9/18, période,
    N dernières parties ; période précédente de même durée ; tableau de chiffres avec effectifs ;
    comparaison de deux sélections ;
  - écran Statistiques : filtres cumulables, six chiffres (score, putts, trois-putts, pénalités,
    mises en jeu, GIR) avec effectif et tendance, graphique de l'écart au par par partie,
    répartition des mises en jeu (gauche / jouables / courtes / droite) et direction des coups notés ;
  - parties de 9 et 18 trous ramenées à 18 trous, et dit en clair ; GIR marqué « déduit, pas observé » ;
    mises en jeu non renseignées (saisie express) exclues et comptées à part ;
  - courbe d'évolution de l'index gardée sur l'écran ; carte « Mises en jeu » de l'accueil alignée sur P03.
TESTS EXÉCUTÉS ET RÉSULTATS : npm test (stats : 17 vérifications) : 0 échec ; test-startup : OK ;
  essai18 (P05) : OK ; essais 4, 5, 8, 9, 11, 12, 13, 15, 16, 17 : OK.
  Échecs déjà présents sur app (a298e0a), non liés à P03/P05 : essai3 (une ancienne sauvegarde est
  normalisée au chargement), essai10 (une distance GPS est « totale » et n'entre plus dans le sac
  depuis la PR #3), essai14 (libellé du message hors réseau). La vérification « partie enregistrée »
  d'essai3 a été alignée sur P03 (mise en jeu non renseignée en express).
BRANCHE / COMMIT / LIEN PR : data/p05-tableau-de-bord · PR #8 (brouillon)
BLOCAGES / RISQUES : PR à fusionner après la #7 (elle en contient les commits).
PROCHAINE TÂCHE AUTORISÉE : aucune sans accord ; candidats P06 (clubs) ou P07 (parcours).
```

## 24 novembre 2026 (nuit)

```text
DATE : 24/11/2026
CRÉDITS ALLOUÉS / CONSOMMÉS / RESTANTS : non mesurables (aucun compteur fourni).
FUSIONS : PR #7 (P03) et #8 (P05) fusionnées sur `app` à la demande explicite du propriétaire
  (« fusionne 7 et 8 ») ; site en ligne vérifié (sw.js 20261123224236) ; appli claude.ai mise à jour.
TÂCHE ACTUELLE : P06 — profil statistique de chaque club (« continue la prochaine »)
FONCTIONNALITÉS LIVRÉES (branche data/p06-profil-clubs) :
  - engine-clubs.js (fonctions pures) : coups d'un club avec leur résultat ; direction (au-delà de
    5 m : gauche ou droite) ; arrivée d'après la position du coup suivant (en jeu, rough, bunker ou
    arbres ; green seulement si le compte du trou le confirme) ; mises en jeu quand le club prend le
    départ d'un par 4 ou 5 (non renseignées exclues) ; trous avec pénalité ; distance indicative
    (pleins coups mesurés, au moins 3, arrondie à 5 m, estimations exclues, GPS compté à part) ;
    tendance (moitié ancienne contre moitié récente, à partir de 10 coups) ; départs par type de
    club depuis la saisie Standard ; comparaison de deux clubs avec effectifs ;
  - Statistiques : section « Profil des clubs » qui suit les filtres du tableau de bord ;
  - fiche d'un club du sac : lien « Voir le profil de ce club ».
TESTS EXÉCUTÉS ET RÉSULTATS : npm test (clubs : 20 vérifications) : 0 échec ; test-startup : OK ;
  essai19 (P06) : OK ; essais 4, 5, 8, 9, 10, 11, 12, 13, 15, 16, 17, 18 : OK.
  essai10 aligné sur la règle de la PR #3 (distance GPS totale hors du sac). Restent en échec,
  comme sur app : essai3 (ancienne sauvegarde normalisée), essai14 (libellé hors réseau).
BRANCHE / COMMIT / LIEN PR : data/p06-profil-clubs · PR #9 (brouillon)
BLOCAGES / RISQUES : le profil ne compte que les parties terminées ; une distance GPS (roulé
  compris) et une distance déclarée (vol) sont réunies dans la distance indicative, et l'écran le dit.
PROCHAINE TÂCHE AUTORISÉE : aucune sans accord ; candidat suivant : P07 (parcours et trous).
```
