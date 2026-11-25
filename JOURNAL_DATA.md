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

## 24 novembre 2026 (après-midi)

```text
DATE : 24/11/2026
CRÉDITS ALLOUÉS / CONSOMMÉS / RESTANTS : non mesurables (aucun compteur fourni).
FUSION : PR #9 (P06) fusionnée sur `app` à la demande explicite du propriétaire (« fusionne 9 ») ;
  site en ligne vérifié (sw.js 20261123230942) ; appli claude.ai mise à jour.
TÂCHE ACTUELLE : P07 — analyse personnalisée des parcours et des trous (« lance »)
FONCTIONNALITÉS LIVRÉES (branche data/p07-parcours-trous) :
  - engine-parcours.js (fonctions pures) : tracé de chaque partie (18 trous, 9 trous, aller,
    retour, deux tours d'un neuf trous) ; fiche du parcours (parties, scores complets par tracé :
    moyenne, meilleur, dernier, tendance à partir de 4 scores ; évolution chronologique) ;
    passages réels sur un trou physique (trou sans score exclu, mise en jeu seulement renseignée
    et sur par 4/5, distance seulement mesurée) ; bilan d'un trou (moyenne, meilleur, pire,
    putts, doubles bogeys ou pire, trois-putts, pénalités, départs ratés par côté) ;
  - fiche de parcours : « Tes passages » (tableau par tracé et graphique d'évolution),
    « Compare tes passages sur un trou » (grille des trous, détail des passages) ;
    tableau trou par trou : colonne Passages, départs sur les mises en jeu renseignées ;
  - analyseParcours (trous noirs) : une mise en jeu non renseignée ne compte plus comme jouable,
    et la cause « départ » n'est plus tirée d'une mise en jeu inconnue ;
  - test-doublons : le build interdit désormais deux fonctions du même nom (deux collisions
    trouvées dans la branche avant commit ; arrondi1 de engine-stats renommé arrondiStat).
TESTS EXÉCUTÉS ET RÉSULTATS : npm test (parcours : 20 vérifications ; doublons : 0) : 0 échec ;
  test-startup : OK ; essai20 (P07) : OK ; essais 4, 5, 8 à 13, 15 à 19 : OK.
  Restent en échec, comme sur app : essai3 (ancienne sauvegarde normalisée), essai14 (libellé hors réseau).
BRANCHE / COMMIT / LIEN PR : data/p07-parcours-trous · PR #10 (brouillon)
BLOCAGES / RISQUES : une partie sans parcours associé n'entre dans aucune fiche.
PROCHAINE TÂCHE AUTORISÉE : aucune sans accord ; candidat suivant : P08 (putting).
```

## 24 novembre 2026 (soir)

```text
DATE : 24/11/2026
CRÉDITS ALLOUÉS / CONSOMMÉS / RESTANTS : non mesurables (aucun compteur fourni).
FUSION : PR #10 (P07) fusionnée sur `app` à la demande explicite du propriétaire (« Push p07 ») ;
  appli claude.ai mise à jour.
TÂCHE ACTUELLE : P09 — erreurs récurrentes (« fait p09 et p08 »)
FONCTIONNALITÉS LIVRÉES (branche data/p09-erreurs) :
  - engine-erreurs.js (fonctions pures) : six erreurs suivies avec leurs occasions (mises en jeu
    renseignées, coups avec direction, trous, greens manqués) ; fréquence, effectif, fréquence pour
    18 trous ; côté dominant (au moins deux fois l'autre, 8 ratés latéraux) ; clubs et parcours
    associés (5 occasions au moins) ; évolution première moitié / seconde moitié des parties
    (écart de 10 points pour parler de hausse ou de baisse) ; « documentée » = seuil d'occasions
    (20 départs, 20 coups, 36 trous, 20 greens manqués) et 5 occurrences ; trois priorités au plus ;
  - Statistiques : section « Mes erreurs récurrentes » (suit les filtres), cartes Constat / Où et
    avec quoi / Évolution / Piste à vérifier (hypothèse dite), tableau de toutes les erreurs,
    état « Données insuffisantes » avec ce qu'il faut encore noter.
TESTS EXÉCUTÉS ET RÉSULTATS : npm test (erreurs : 19 vérifications) : 0 échec ; test-startup : OK ;
  essai21 (P09) : OK ; essais 12, 18, 19, 20 : OK.
BRANCHE / COMMIT / LIEN PR : data/p09-erreurs · PR #11 (brouillon)
BLOCAGES / RISQUES : greens manqués et doubles approches sont déduits du score (dit à l'écran).
PROCHAINE TÂCHE : P08 (putting), demandée dans le même message.
```

```text
DATE : 24/11/2026 (soir, suite)
TÂCHE ACTUELLE : P08 — analyse du putting (même demande que P09)
FONCTIONNALITÉS LIVRÉES (branche data/p08-putting, partie de data/p09-erreurs) :
  - engine-putting.js (fonctions pures) : base = trous joués ; putts par trou et pour 18 trous ;
    zéro / un / deux / trois-putts et plus (somme = trous) ; selon le green (GIR déduit) ; longueur
    du premier putt regroupée en court / moyen / long (échelle à cinq rangs : < 2 m, 2–5 m, > 5 m ;
    ancienne échelle à quatre rangs : < 3 m, 3–8 m, > 8 m) ; second putt difficile signalé ; par
    parcours ; évolution (deux moitiés, 18 trous minimum chacune) ; série par partie ;
  - saisie Expert : « Second putt difficile, laissé par le premier » à partir de 2 putts ; douzième
    case du trou ajoutée seulement quand elle sert, retirée à moins de 2 putts ; l'assainissement
    accepte 12 cases (les trous existants restent à 11) ;
  - Statistiques : section Putting (suit les filtres).
TESTS EXÉCUTÉS ET RÉSULTATS : npm test (putting : 18 vérifications) : 0 échec ; test-startup : OK ;
  essai22 (P08) : OK ; essais 4, 5, 8 à 13, 15 à 21 : OK (essai18 lit désormais les seuls chiffres
  du tableau de bord, la section Putting ayant ses propres cartes).
BRANCHE / COMMIT / LIEN PR : data/p08-putting · PR #12 (brouillon, à fusionner après #11)
BLOCAGES / RISQUES : le « second putt difficile » n'est qu'un signalement : son absence ne veut pas
  dire « facile », aucun taux n'en est tiré.
PROCHAINE TÂCHE AUTORISÉE : aucune sans accord ; candidat suivant : P04 (mes données, sauvegardes).
```

```text
DATE : 24/11/2026 (soir, retour du propriétaire)
RETOUR : « Je ne vois pas la possibilité de noter mes putts » — le premier putt et le second putt
  difficile n'étaient proposés qu'en Expert, repliés sous « Plus de détails ».
CORRECTION (PR #12) : bloc « Premier putt (facultatif) » et « Second putt difficile » directement
  sous le compteur de putts, en Standard et en Expert ; l'Express reste score, putts, pénalités.
TESTS : npm test 0 échec ; test-startup OK ; essai22 vérifie le bloc en Standard sans ouvrir de
  détails et son absence en Express ; essais 4, 5, 6, 8, 9, 10, 12, 13, 16, 17, 18, 21 : OK.
```

## 25 novembre 2026 (matin)

```text
DATE : 25/11/2026
CRÉDITS ALLOUÉS / CONSOMMÉS / RESTANTS : non mesurables (aucun compteur fourni).
FUSIONS : PR #11 (P09) et #12 (P08) fusionnées sur `app` à la demande explicite du propriétaire
  (« Fusionne 11 et 12 ») ; appli claude.ai mise à jour.
TÂCHE ACTUELLE : P04 puis P02 (« Lance les 2 prochaines feature »)
RÉÉVALUATION DE LA PR #2 : ses trois apports sont déjà sur app (provenance des distances par la
  PR #3, distance GPS totale hors du sac, export JSON avec les cartes GPS). Rien à reprendre ; à fermer.
FONCTIONNALITÉS LIVRÉES (branche data/p04-mes-donnees) :
  - engine-donnees.js : partiesPourCalculs (partie exclue retirée ; coup exclu gardé dans
    l'enchaînement sans distance ni direction ; données d'origine intactes), inventaireDonnees,
    distancesSuspectes (pleins coups mesurés, médiane du club sur 5 mesures au moins) ;
  - une seule source pour les calculs (partiesAnalyse) : statistiques, erreurs, putting, clubs,
    parcours, index estimé, objectifs, priorités, sac ;
  - fiche « Mes données » : inventaire, distances à vérifier, coups exclus, parties (corriger,
    exclure, réintégrer), sauvegarde complète ;
  - sauvegarde : le texte copiable contient aussi les cartes GPS ; restauration par texte qui les
    restaure ; aucun message de réussite si rien n'a pu être écrit (copie locale ni sauvegarde de
    l'appareil) ; bannière persistante « pas enregistrées » ;
  - période des statistiques avec l'année quand elle s'étale sur plusieurs années ;
  - build.js s'arrête sur une erreur de syntaxe du code assemblé.
TESTS EXÉCUTÉS ET RÉSULTATS : npm test (mes données : 17 vérifications) : 0 échec ; test-startup :
  OK ; essai23 (inventaire, exclusions, restauration fichier et texte sur appareil vierge, panne
  d'écriture, 400 parties : statistiques 1,2 s, mes données 1,5 s, 1 Mo) : OK ; tous les essais
  (3 à 23) : OK. essai3 et essai14 réalignés : une ancienne sauvegarde ne perd aucune valeur (plan
  régénérable et réglages par défaut ajoutés mis à part) ; nouveau libellé hors réseau.
BRANCHE / COMMIT / LIEN PR : data/p04-mes-donnees · PR #13 (brouillon)
PROCHAINE TÂCHE : P02 (premier lancement), demandée dans le même message.
```

```text
DATE : 25/11/2026 (matin, suite)
TÂCHE ACTUELLE : P02 — premier lancement centré sur le carnet (même demande que P04)
FONCTIONNALITÉS LIVRÉES (branche data/p02-premier-lancement, partie de data/p04-mes-donnees) :
  - premier écran « Ton carnet de golf, dans la poche » : prénom facultatif, droitier / gaucher,
    index facultatif ou « Je ne connais pas mon index » ; « Ouvrir mon carnet » mène à l'accueil
    « Mon jeu » (nouvelle partie tout de suite) ; restauration d'une sauvegarde et questionnaire
    de programme proposés en liens ;
  - index : indexDeclare() (index réellement déclaré, sinon null) pour tout affichage et calcul ;
    indexNiveau() (déclaré, sinon niveau débutant) seulement pour choisir les exercices ; un nouveau
    profil sans index enregistre index: null ; l'assainissement l'accepte ;
  - programme facultatif : carte « Personnaliser mon programme » dans Progresser, « Créer mon
    programme » dans le Profil (questionnaire ouvert directement, sans avertissement de remise à
    zéro) ; « Modifier mon prénom, ma main ou mon index » sans questionnaire ;
  - anciens profils : lus sans réécriture ; champ questionnaire absent = fait ; un ancien « sans
    index » à 54 est affiché « non renseigné » et n'entre dans aucun calcul d'index.
TESTS EXÉCUTÉS ET RÉSULTATS : essai24 (premier écran, index invalide refusé, profil sans faux
  index ni historique, en-tête, nouvelle partie sans coups reçus ni Stableford, programme en
  option, index ajouté plus tard, questionnaire prérempli puis fait, ancien profil intact) : OK ;
  npm test, test-startup et essais 3 à 23 : OK.
BRANCHE / COMMIT / LIEN PR : data/p02-premier-lancement · PR #14 (brouillon, à fusionner après #13)
PROCHAINE TÂCHE AUTORISÉE : aucune sans accord ; candidats P10 (coups perdus estimés), P11, P12.
```
