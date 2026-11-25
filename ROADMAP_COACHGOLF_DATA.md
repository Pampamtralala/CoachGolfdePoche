# CoachGolfdePoche — Roadmap DATA et consignes au développeur IA

**Version :** 23 novembre 2026  
**Statut :** cahier des charges à appliquer progressivement  
**Dépôt :** `Pampamtralala/CoachGolfdePoche`  
**Branche de production :** `app` (GitHub Pages publie `docs/` de cette branche)  
**Objectif :** rendre CoachGolfdePoche très orienté **collecte, fiabilité, analyse et exploitation des données golfiques**, et non principalement planification d'entraînement.

> **Mission du développeur IA :** exécuter progressivement les chantiers de cette roadmap de manière aussi autonome que l'environnement le permet, **sans dépasser le budget de crédits IA disponible chaque jour**, sans mise en production non validée, et sans compromettre les données des joueurs.

---

## 0. Instructions prioritaires — à lire avant tout développement

### A. Contraintes métier non négociables

1. L'unique outil de mesure disponible est **le GPS approximatif du téléphone**. Il n'y a ni radar, ni launch monitor, ni capteur de club, ni montre connectée imposée.
2. Ne **jamais** promettre de distances de carry, de précision GPS centimétrique ou de trajectoires réelles sans données compatibles. Ne pas proposer une dépendance obligatoire à du matériel payant.
3. **Un prompt précédent a déjà été envoyé au codeur** concernant la saisie des coups :
   - le graphique de dispersion est utilisé uniquement pour indiquer **gauche / droite** ;
   - le champ de distance **n'est pas prérempli** ;
   - si aucune distance n'est saisie, une **moyenne historique disponible** peut servir **d'estimation de remplacement pour un calcul ou une suggestion**, sans devenir une nouvelle mesure réelle ;
   - si aucune moyenne fiable n'existe, la distance reste **inconnue**.
   **Vérifier l'état réel de cette fonctionnalité dans le dépôt avant toute modification. Ne pas implémenter une deuxième fois la même fonction, ne pas écraser le travail en cours.**
4. Distinguer dans tout le produit : **observé / déclaré / estimé / inconnu**. Ne pas mélanger les valeurs mesurées, supposées ou déduites.
5. Prioriser les données simples et pertinentes : score, putts, pénalités, club, direction gauche/droite, résultat et contexte du coup.
6. Saisie utilisable sur smartphone, à une main, **hors ligne**, sans imposer les champs facultatifs.
7. Garder le coaching et les exercices disponibles, mais **secondaires** par rapport à la donnée.

### B. Gestion obligatoire des crédits IA journaliers

**Le codeur doit travailler automatiquement par petites sessions quotidiennes, uniquement si son environnement dispose d'un mécanisme de planification/relance autorisé. Ce fichier n'active pas, à lui seul, une exécution en arrière-plan.**

**Paramètres à renseigner dans l'environnement du codeur avant activation de l'automatisation :**

```text
AI_DAILY_CREDIT_LIMIT = [quota journalier réellement alloué / fourni]
AI_DAILY_CREDIT_RESERVE_PERCENT = 20
AI_MAX_CREDITS_PER_TASK = [plafond de crédits par tâche]
AI_DAILY_RESET_TIME = [heure et fuseau du renouvellement du quota]
AI_AUTORUN_ENABLED = false    # passer à true seulement après autorisation explicite
ALLOW_PRODUCTION_MERGE = false
```

**Politique de consommation :**

- **Ne jamais inventer le quota ni les crédits restants.** Lire les valeurs fournies par la plateforme du codeur, un compteur explicite ou une configuration renseignée par le propriétaire.
- **Réserver 20 % du quota journalier** par défaut pour les corrections, tests et imprévus. Le codeur ne doit pas démarrer une tâche si son coût estimé risque de dépasser le crédit restant après cette réserve. Ce seuil peut être ajusté par le propriétaire.
- Si la plateforme ne permet **pas** de connaître ou borner la consommation, **ne pas prétendre garantir le respect du quota** : se limiter au budget de tâches explicitement configuré et **mettre en pause l'exécution automatique** avant tout risque de dépassement, en demandant une configuration humaine.
- **Prioriser le travail utile :** lire uniquement les fichiers concernés, réutiliser les analyses déjà faites, limiter les appels répétitifs, lancer les tests locaux/CI plutôt que solliciter l'IA pour chaque vérification mécanique.
- **Une seule tâche délimitée à la fois.** Ne pas entreprendre de refonte complète en fin de journée. Découper tout chantier trop gros en sous-tâches indépendantes.
- Avant chaque tâche : estimer le coût, le comparer au budget disponible et vérifier la place restante pour les tests. Si insuffisant : **s'arrêter proprement**.
- **Ne jamais tenter de contourner les limites**, répartir artificiellement les appels entre comptes, ou consommer des crédits supplémentaires non autorisés.
- À épuisement du budget autorisé : conserver un état de reprise, un commit sur la branche de travail si le code est cohérent, un rapport des tests, puis **arrêter**. Reprendre uniquement au renouvellement du quota et si une planification autorisée est active.
- Pas de tâches coûteuses lancées « en fond » sans contrôle du quota. Ne jamais annoncer une automatisation ou une relance future si aucun mécanisme ne l'exécute effectivement.

**Compte rendu quotidien attendu :**

```text
DATE :
CRÉDITS ALLOUÉS / CONSOMMÉS / RESTANTS :
TÂCHE ACTUELLE :
FONCTIONNALITÉS LIVRÉES :
TESTS EXÉCUTÉS ET RÉSULTATS :
BRANCHE / COMMIT / LIEN PR :
BLOCAGES / RISQUES :
PROCHAINE TÂCHE AUTORISÉE :
```

### C. Protocole Git et fiabilité (obligatoire)

1. **Lire la réalité du dépôt avant d'agir** : `app` est la production ; `main` peut ne pas contenir l'application. Examiner les pull requests ouvertes et les derniers commits afin de ne pas dupliquer du travail.
2. Vérifier les correctifs éventuellement présents dans la **PR #2**, non fusionnée à la date de référence : distances déclarées/estimées, GPS total versus carry, export/restauration JSON avec cartes. **Réévaluer son état au moment de l'exécution** : ne pas considérer la situation du 23/11/2026 comme éternelle.
3. Créer **une branche dédiée par petit chantier** à partir de la version courante de `app` ; préparer une PR par livraison vérifiable.
4. Ne jamais fusionner directement sur `app` ni déclencher la publication sans validation explicite du propriétaire. `ALLOW_PRODUCTION_MERGE=false` par défaut.
5. Préserver les sauvegardes historiques, maintenir les migrations non destructives, prévoir export/restauration, ne pas supprimer silencieusement de parties ou d'observations.
6. Respecter l'architecture du dépôt (`src/`, `engine*.js`, `ui*.js`, `build.js`, `docs/`). **Ne pas éditer `docs/` manuellement** : le régénérer par `node build.js` sur la branche de revue.
7. Tests requis selon le périmètre : `npm test`, `node build.js`, lancement dans Chromium/Playwright, ouverture avec et sans sauvegarde ancienne, et test du parcours de saisie mobile. Corriger tout écran blanc avant de proposer une fusion.
8. Toute PR comporte : objectif, changements, migration, tests, risques, et critères de validation. Si un test échoue, **ne pas fusionner**.
9. Ne pas exporter ni transmettre des données personnelles ou GPS à des services externes sans consentement explicite.

---

## 1. Vision produit

**Collecter → Comprendre → Progresser**

**Promesse :** « Mieux connaître son jeu pour mieux jouer. »

Les données sont le produit central. L'application doit permettre de répondre à des questions réelles :

- Est-ce que mes scores s'améliorent sur mes 10 dernières parties ?
- Est-ce que mes mises en jeu partent davantage à gauche ou à droite ?
- Quel club donne les résultats les plus réguliers ?
- Sur quels trous est-ce que je perds le plus de coups, selon les données réellement saisies ?
- Mes trois-putts deviennent-ils moins fréquents ?

**Hiérarchie de données :**

- **Fortement fiables et simples à saisir :** score, putts, pénalités, club joué, direction gauche/droite, caractère jouable, parcours et trou.
- **Facultatives/approximatives :** GPS téléphone, distance saisie, lie, type de coup, catégorie de distance du premier putt, conditions et ressenti.
- **Calculées/estimées :** moyennes, tendances, taux, distances de substitution, indicateurs comparatifs. Toujours les présenter avec leur source et leur niveau de fiabilité.

**Navigation souhaitée :** Mon jeu · Jouer · Analyser · Mon sac · Profil. Le programme d'entraînement est accessible mais secondaire.

---

## 2. Roadmap d'implémentation — ordre d'exécution retenu

Les numéros `Pxx` correspondent aux prompts autonomes ci-dessous ; **l'ordre recommandé diffère des numéros** pour maximiser l'utilité et tenir compte du travail déjà accompli.

| Ordre | Prompt | Chantier | Priorité | Dépendances clés |
|---:|---|---|---|---|
| 1 | P01 | **Terminé** — statuts de distance, identifiants stables, croisements | PR #3, #4, #6 fusionnées | npm test, test-startup : verts | Les écrans qui s'en servent viennent avec P05 / P06 / P07 |
| 2 | P03 | **Terminé** — Express / Standard / Expert, mise en jeu en trois états, partie complétée après coup | PR #7 fusionnée (23/11) | npm test, test-startup, essai17 : verts | Dispersion gauche/droite et distance facultative déjà livrées le 23/11 |
| 3 | P05 | **Terminé** — tableau de bord filtrable, effectifs, comparaison de périodes | PR #8 fusionnée (23/11) | npm test (stats : 17 vérifications), test-startup, essai18 : verts | Repose sur P03 (mises en jeu renseignées) |
| 4 | P06 | **Terminé** — profil de chaque club, départs par type de club, comparaison de deux clubs | PR #9 fusionnée (24/11) | npm test (clubs : 20 vérifications), test-startup, essai19 : verts | Se lit sans distance |
| 5 | P07 | **Terminé** — fiche de parcours (passages, scores par tracé, évolution), passages comparés trou par trou | PR #10 fusionnée (24/11) | npm test (parcours : 20 vérifications), test-startup, essai20 : verts | Aller, retour et deux tours d'un neuf trous rapprochés |
| 6 | P09 | **Terminé** — « Mes erreurs récurrentes » : six erreurs suivies, trois priorités documentées, constat et piste séparés | PR #11 fusionnée (25/11) | npm test (erreurs : 19 vérifications), test-startup, essai21 : verts | Jamais converti en coups perdus |
| 7 | P08 | **Terminé** — section Putting : putts par trou, un / deux / trois-putts, évolution, selon le green, longueur du premier putt (court / moyen / long), second putt difficile, par parcours | PR #12 fusionnée (25/11) | npm test (putting : 18 vérifications), test-startup, essai22 : verts | Aucun taux à une distance précise |
| 8 | P04 | **Terminé** — « Mes données » : inventaire et provenance, exclusions réversibles, distances à vérifier, sauvegarde complète, écriture impossible signalée | PR #13 fusionnée (25/11) | npm test (mes données : 17 vérifications), test-startup, essai23, essais 3 et 14 : verts | La PR #2 est entièrement couverte par les PR #3 et suivantes |
| 9 | P02 | **Terminé** — premier lancement « carnet » : prénom et index facultatifs, main de jeu, sans questionnaire ; index jamais inventé ; programme en option | PR #14 fusionnée (25/11) | essai24, tous les essais, npm test, test-startup : verts | Anciens profils intacts |
| 10 | P10 | **Terminé** — estimation par secteur clairement distinguée du Strokes Gained, méthode et limites consultables, départ non inventé, écart au jeu habituel | PR #15 fusionnée (25/11) | npm test (estimation : 17 vérifications), test-startup, essai25, essais : verts | Aucune distance nécessaire |
| 11 | P11 | **Terminé** — bilans (mois, trois mois, saison, période libre), journal, notes de partie, rapport daté et reproductible, import CSV / JSON sans écrasement | PR #16 fusionnée (25/11) | npm test (journal : 21 vérifications), test-startup, essai26, tous les essais : verts | Associations, jamais des causes |
| 12 | P12 | **En revue** — « Comprendre mon jeu » : 12 questions, moteur déterministe, chaque réponse avec chiffres, période, effectif et méthode ; ce qu'il faut saisir quand les données manquent | `data/p12-comprendre` · PR #17 (brouillon) | npm test (analyste : 38 vérifications), test-startup, essai27, tous les essais : verts | Sans IA externe |

**Attention :** P04 est une exigence transversale dès le démarrage ; il est listé en position 8 uniquement pour son interface dédiée. Le contrôle des données, les tests et les sauvegardes ne doivent pas attendre la huitième livraison.

### P01 — Modèle de données golfiques fiable

**Prompt au développeur :**

> Analyse le modèle de données actuel de CoachGolfdePoche et améliore-le sans supprimer les informations existantes. Chaque partie, trou, coup et séance de practice doit disposer de données cohérentes : date, parcours, club, résultat du coup, direction gauche/droite, pénalité éventuelle et distance facultative. Distingue distance GPS approximative, distance déclarée, distance estimée à partir de la moyenne historique et distance inconnue. Une distance estimée ne doit jamais être réintégrée dans le calcul de sa propre moyenne. Conserve les anciennes données grâce à une migration non destructive. Prévois un modèle qui croise les observations par club, trou, parcours et période. Ajoute des tests de migration et de conservation des données. Ne modifie pas directement la branche de production.

**Acceptation :** identifiants stables, origine identifiable, champs inconnus représentés par `null`/statut explicite, anciennes parties intactes, 100+ parties migrées sans perte, statistiques insensibles aux estimations de remplacement.

### P02 — Onboarding centré sur le carnet golfique

**Prompt au développeur :**

> Refonds le premier lancement pour en faire une application de suivi golfique plutôt qu'un programme de coaching. Demande uniquement prénom facultatif, latéralité et index facultatif ; « Je ne connais pas mon index » ne crée pas un faux index. L'utilisateur doit immédiatement pouvoir enregistrer une partie ou consulter le carnet. Le questionnaire et le programme restent accessibles mais facultatifs. L'accueil présente les données déjà collectées et les dernières performances. Préserve intégralement les anciens profils et statistiques.

**Acceptation :** premier parcours sans questionnaire, démarrage sur smartphone, ancien profil compatible, aucune statistique inventée faute d'index.

### P03 — Trois niveaux de saisie sur le parcours

**Prompt au développeur :**

> Améliore la saisie actuelle avec trois modes : **Express** (score, putts, pénalités), **Standard** (score, putts, pénalités, mise en jeu jouable, direction gauche/droite, GIR et club de départ), **Expert** (chaque coup, club, direction, lie, résultat et distance facultative). Permets de changer de mode pendant une partie et de compléter/corriger après la partie, sans écraser les données précédentes. Ne rends jamais une distance obligatoire. Respecte le prompt déjà envoyé sur le graphique latéral gauche/droite et la distance non préremplie. L'interface doit rester rapide et utilisable à une main, même hors ligne.

**Acceptation :** transitions entre trois modes, aucun champ essentiel perdu, reprise d'une partie interrompue, champs vides non confondus avec « non », saisie à une main testée.

### P04 — Qualité, correction et sauvegarde des données

**Prompt au développeur :**

> Crée un espace « Mes données » indiquant le nombre de parties, trous renseignés, coups documentés, directions connues, distances déclarées, estimées et GPS. Permets de corriger une partie, rectifier une direction, signaler une donnée aberrante et exclure une observation d'un calcul sans la supprimer définitivement. Renforce export/restauration de toutes les données, y compris les cartes GPS locales. Réévalue la PR #2 avant de coder une fonctionnalité déjà proposée. La sauvegarde ne doit pas annoncer une réussite si l'écriture a échoué. Ajoute tests de restauration, lancement et historique volumineux.

**Acceptation :** provenance et effectif affichés, exclusion réversible, export/import complet, avertissement de stockage défaillant, anciennes sauvegardes intactes.

### P05 — Tableau de bord statistique avancé

**Prompt au développeur :**

> Transforme l'écran Statistiques en tableau de bord interactif : score moyen et écart au par, putts par trou, trois-putts, pénalités, mises en jeu jouables, GIR, répartition gauche/droite. Ajoute des filtres par parcours, période, 5/10/20 dernières parties et 9/18 trous, ainsi qu'une comparaison entre deux périodes. Utilise des graphiques simples. Indique toujours la taille de l'échantillon ; normalise explicitement les comparaisons 9/18 trous ; n'assimile pas une statistique déduite à une mesure observée. Interface lisible en quelques secondes sur smartphone.

**Acceptation :** filtres cumulables, périodes comparables, effectifs visibles, cas sans données bien géré, tests de calcul.

### P06 — Profil statistique de chaque club

**Prompt au développeur :**

> Crée une fiche par club axée sur la régularité et le résultat du coup : nombre de coups, proportion gauche/droite, fréquence des coups jouables et des pénalités, tendance dans le temps. La distance moyenne est seulement **indicative** si des données exploitables existent ; les distances GPS sont approximatives, les estimations n'alimentent jamais les moyennes de mesures. Affiche un graphique gauche/droite et permets de comparer deux clubs, en signalant les tailles d'échantillons.

**Acceptation :** le dashboard reste utile même sans distances, aucune fausse précision métrique, 2 clubs comparables selon données disponibles.

### P07 — Analyse personnalisée des parcours et des trous

**Prompt au développeur :**

> Développe une fiche par parcours : nombre de passages, score moyen, meilleur score, évolution. Pour chaque trou : score moyen par rapport au par, nombre de passages, putts, pénalités, mises en jeu ratées et erreurs. Identifie les trous les plus difficiles et les plus faciles et permets de comparer plusieurs passages sur le même trou. Ne suppose aucune trajectoire GPS précise sans relevé réel.

**Acceptation :** trous 1–18 correctement rapprochés entre différentes parties, retour 9 trous traité, indicateurs basés sur les passages réels.

### P08 — Analyse du putting

**Prompt au développeur :**

> Crée une section mettant en évidence putts moyens, un-putt, deux-putts, trois-putts et leur évolution. Propose facultativement des catégories de distance du premier putt (**court/moyen/long**) sans exiger de mesure GPS. Permets de signaler un long premier putt qui laisse un second putt difficile. Compare par parcours, période et GIR. N'invente pas de taux de réussite à une distance précise non renseignée.

**Acceptation :** métriques cohérentes avec le nombre de trous, prise en compte des valeurs absentes, affichage d'effectifs.

### P09 — Erreurs récurrentes

**Prompt au développeur :**

> Crée « Mes erreurs récurrentes ». Analyse mises en jeu ratées, directions gauche/droite, pénalités, greens manqués, doubles approches et trois-putts. Pour chaque erreur, indique fréquence, effectif, clubs/parcours associés et évolution. Mets en avant trois problèmes seulement s'ils sont statistiquement documentés. Distingue constat chiffré et hypothèse ; ne transforme pas automatiquement une fréquence en nombre exact de coups perdus.

**Acceptation :** aucune causalité inventée, filtres, effectifs visibles, état « données insuffisantes ».

### P10 — Estimation responsable des coups perdus

**Prompt au développeur :**

> Sépare clairement « estimation sectorielle de coups gagnés/perdus » et véritables **Strokes Gained** coup par coup. À ce stade, privilégie les scores, GIR, pénalités, mises en jeu et putting pour identifier les erreurs évitables et écarts à la performance habituelle. Ne nécessite pas de distances précises. Ne présente jamais un modèle approximatif comme un calcul Strokes Gained exact.

**Acceptation :** libellés explicites, méthode consultable, limites et données manquantes signalées, tests du modèle.

### P11 — Journal de progression et rapports

**Prompt au développeur :**

> Crée un journal des parties, statistiques et tendances. Bilan sur un mois, trois mois, saison ou période libre. Après une partie, ajoute une note facultative : driving, putting, fatigue, météo ou ressenti. Ces associations ne sont pas des causalités automatiques. Crée un rapport exportable avec graphiques et nombre d'observations. Prévois l'import CSV/JSON avec aperçu et anti-doublons, puis préserve l'export de toutes les données.

**Acceptation :** rapports reproductibles et datés, imports contrôlables, pas d'écrasement silencieux.

### P12 — Analyste personnel de jeu

**Prompt au développeur :**

> Crée « Comprendre mon jeu » avec un moteur déterministe qui répond à des questions comme : « Est-ce que je score mieux ? », « Quel club est le plus régulier ? », « Mes départs partent-ils davantage à gauche ? », « Sur quels trous ai-je du mal ? », « Mes trois-putts diminuent-ils ? ». Chaque réponse cite ses chiffres, sa période et le nombre de coups ou de parties étudiés. Si les données sont insuffisantes, explique précisément ce qu'il faudrait saisir. N'intègre une IA externe qu'en option consentie : les réponses ne doivent jamais inventer de données.

**Acceptation :** traçabilité de chaque affirmation, aucune statistique fictive, comportement défini lorsque le carnet est vide.

---

## 3. Méthode d'exécution autonome par budget quotidien

**Boucle d'une session autorisée :**

1. Lire quota, crédits consommés, heure de réinitialisation et réserve ; interrompre si l'information nécessaire manque.
2. Lire l'état des PR, du build et du dernier journal de progression.
3. Choisir **le premier sous-livrable non terminé** dans la roadmap, non redondant avec le code actuel.
4. Estimer coût et tests nécessaires ; réserver suffisamment de crédits pour vérifier la livraison.
5. Créer une branche, coder une sous-tâche, ajouter des tests, exécuter la suite pertinente.
6. Si vert, préparer/mettre à jour une PR en brouillon ; si rouge, diagnostiquer ou laisser la tâche incomplète et non fusionnée.
7. Sauvegarder un état de progression lisible (tâche, résultats, commit, prochaine action) et arrêter selon les limites.
8. Ne reprendre le lendemain **que si une planification a été explicitement activée** et que le nouveau quota autorisé est connu.

**Règle d'arrêt absolue :** en cas de crédits insuffisants, d'incertitude sur le quota, de tests en échec, de risque de perte de données ou de permission manquante, **ne pas lancer la tâche suivante et ne pas déployer**.

### Définition de « terminé » pour un chantier

- Fonctionnalité implémentée sur branche dédiée et démontrable.
- Aucune régression connue dans les cas critiques.
- Tests unitaires et navigateur pertinents réussis.
- Compatibilité avec les données anciennes vérifiée.
- Données estimées clairement séparées des mesures.
- Rapport des crédits et des modifications produit.
- PR prête pour revue humaine ; **fusion uniquement après accord explicite**.

---

## 4. Journal de suivi à remplir au fur et à mesure

| Prompt | Statut initial | Branche / PR | Tests | Notes |
|---|---|---|---|---|
| P01 | **Terminé côté moteur** — 1/3 (PR #3) et 2/3 (PR #4) fusionnés ; 3/3 en revue (croisements) | PR #3, #4 fusionnées · `data/p01-croisements` · PR #6 (brouillon) | npm test (dont croisements 15 vérifications), test-startup : verts | Les écrans qui s'en servent viennent avec P05 / P06 / P07 |
| P03 | **Terminé** — Express / Standard / Expert, mise en jeu en trois états, partie complétée après coup | PR #7 fusionnée | npm test, test-startup, essai17 : verts | Dispersion gauche/droite et distance non préremplie livrées le 23/11 |
| P05 | **Terminé** — filtres cumulables (5/10/20/toutes, 9/18 trous, parcours, période libre), comparaison avec les N parties ou la période précédente, effectif sous chaque chiffre, base 18 trous dite, GIR « déduit », état vide | PR #8 fusionnée | npm test (stats : 17 vérifications), test-startup, essai18 : verts | L'évolution de l'index reste sur l'écran |
| P06 | **Terminé** — section « Profil des clubs » dans Statistiques : gauche / axe / droite, où la balle arrive, mises en jeu au départ, distance indicative arrondie à 5 m, tendance ; départs par type de club ; comparaison de deux clubs avec effectifs ; lien depuis le sac | PR #9 fusionnée | npm test (clubs : 20 vérifications), test-startup, essai19 : verts | Parties terminées seulement |
| P07 | **Terminé** — fiche du parcours : parties, score moyen et meilleur score par tracé (18 trous, aller, retour, neuf trous, deux tours), évolution et tendance ; par trou : passages réels, départs renseignés, greens, putts, pénalités ; comparaison des passages sur un trou (score, départ, putts, pénalités, clubs et distances mesurées seulement) ; mises en jeu non renseignées exclues de l'analyse des trous | PR #10 fusionnée | npm test (parcours : 20 vérifications, doublons : 0), test-startup, essai20 : verts | Aucune trajectoire GPS reconstituée |
| P09 | **Terminé** — section dans Statistiques (suit les filtres) : mises en jeu ratées, coups hors de l'axe, pénalités, greens manqués (déduits), doubles approches (déduites), trois-putts ; pour chacune fréquence, effectif, fréquence pour 18 trous, clubs et parcours associés (5 occasions minimum), évolution entre les deux moitiés des parties ; trois priorités au plus, seulement si documentées (seuil d'occasions et 5 occurrences) ; « Données insuffisantes » avec ce qu'il faut noter ; constat et « piste à vérifier » séparés | PR #11 fusionnée | npm test (erreurs : 19 vérifications), test-startup, essai21 : verts | Classement par fréquence, pas en coups perdus |
| P08 | **Terminé** — section Putting dans Statistiques (suit les filtres) : putts par trou et pour 18 trous, un / deux / trois-putts et plus (effectifs, somme = trous joués), évolution entre les deux moitiés (18 trous minimum chacune), selon le green en régulation (déduit) ou manqué, longueur du premier putt regroupée en court / moyen / long depuis les deux échelles existantes (trous sans longueur exclus et comptés), premier putt et « second putt difficile » saisis sous le compteur de putts en Standard et Expert (douzième case du trou, ajoutée seulement quand elle sert), par parcours | PR #12 fusionnée | npm test (putting : 18 vérifications), test-startup, essai22 : verts | Les anciennes parties restent à 11 cases |
| P04 | **Terminé** — fiche « Mes données » (profil, statistiques) : inventaire avec provenance et effectifs ; exclusion réversible d'une partie (hors de tous les calculs, gardée dans le carnet) ou d'un coup (sans distance ni direction dans les calculs) ; distances inhabituelles à vérifier (moins de 60 % ou plus de 140 % de la médiane du club, 5 mesures minimum) avec « Exclure » / « C'est juste » ; correction via « Compléter ou corriger » ; sauvegarde fichier et texte avec les cartes GPS ; bannière et messages honnêtes quand l'écriture échoue ; build arrêté sur erreur de syntaxe | PR #13 fusionnée | npm test (mes données : 17 vérifications), test-startup, essai23 (dont 400 parties), tous les essais : verts | PR #2 couverte (provenance #3, GPS hors sac, export des cartes) : à fermer |
| P02 | **Terminé** — premier écran « Ton carnet de golf » : prénom (facultatif), droitier / gaucher, index (facultatif) ou « Je ne connais pas mon index » ; carnet ouvert sur l'accueil « Mon jeu » (nouvelle partie tout de suite) ; questionnaire proposé en lien et dans Progresser / Profil (« Créer mon programme ») ; index inconnu enregistré à null : indexDeclare() pour tout affichage et calcul (coups reçus, Stableford, index estimé, en-tête, profil), indexNiveau() seulement pour le niveau des exercices ; anciens profils lus sans réécriture (ancien « sans index » à 54 affiché « non renseigné ») ; modification prénom / main / index sans questionnaire | PR #14 fusionnée | essai24, essais 3 à 23, npm test, test-startup : verts | Les essais historiques passent par le lien « programme d'entraînement » |
| P10 | **Terminé** — libellés « estimation des coups gagnés ou perdus » partout (Statistiques, accueil, menu, bilan de partie) avec la mention « pas du Strokes Gained » ; correction du modèle : seules les mises en jeu renseignées comptent (taux sur les par 4 et 5 connus ramené à 18 trous), départ non estimé et compris dans les attaques sous 6 départs connus ; « Méthode, fiabilité et limites » (données utilisées, référence interne, fiabilité tendance / indicative / établie, données manquantes) ; « Par rapport à ton jeu habituel » : 5 dernières parties contre les 20 d'avant, sans index ni distance, avec périodes et effectifs | PR #15 fusionnée | npm test (estimation : 17 vérifications), test-startup, essai25 : verts | Anciennes parties : calcul inchangé (test-plus) |
| P11 | **Terminé** — fiche « Bilans et rapports » (Statistiques, carnet, recherche) : période un mois / trois mois / saison / libre, six chiffres avec effectifs, graphique, erreurs fréquentes, notes et associations (3 parties minimum de chaque côté, « associations, pas des causes »), journal avec note par partie ; note facultative (driving, putting, forme, ressenti, météo, un mot) depuis le bilan de fin de partie, la carte de partie ou le journal ; rapport HTML autonome daté, imprimable, avec effectifs, graphique et empreinte des données (mêmes parties et période = même empreinte) ; import CSV (une ligne par trou, modèle fourni) ou JSON avec aperçu, lignes refusées signalées, doublons écartés (identifiant ou jour + scores), ajout à la date sans rien remplacer ; bilan de fin de partie : mises en jeu non renseignées plus jamais comptées jouables | PR #16 fusionnée | npm test (journal : 21 vérifications), test-startup, essai26, essais 3 à 26 : verts | L'export complet inclut les notes |
| P12 | **En revue** — fiche « Comprendre mon jeu » (accueil avec 4 raccourcis, Statistiques, recherche) : 12 questions (score, trois-putts, putting, mises en jeu, côtés, pénalités, club régulier, distances, trous difficiles, meilleur parcours, secteur coûteux estimé, forme) ; seuils fixés (1,5 coup, 5 ou 10 points, 0,1 putt par trou, 1 pénalité) sous lesquels la réponse dit « pas de différence nette » ; chaque chiffre vient des moteurs existants (test de traçabilité) ; périodes toutes / trois mois / saison ; recherche par mots-clés avec mots vides ; carnet vide et données insuffisantes définis pour chaque question | `data/p12-comprendre` · PR #17 (brouillon) | npm test (analyste : 38 vérifications), test-startup, essai27, essais 3 à 27 : verts | IA externe : non intégrée (option future, consentie) |

**Note :** ce document est une roadmap et un ensemble de consignes à destination d'un agent développeur. Il ne crée pas de planificateur ni ne connaît le quota réel de la plateforme. Le respect strict des crédits journaliers exige que le codeur puisse consulter un compteur fiable ou qu'un plafond explicite soit configuré.
