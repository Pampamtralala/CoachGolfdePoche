# Roadmap UX — Golf Performance & Data First

Suivi de la refonte UI/UX (roadmap V3). Cycle visé : collecter → analyser → comprendre → agir → mesurer sa progression.
Aucune fonctionnalité n'est supprimée ; les moteurs statistiques, le format de sauvegarde, le suivi GPS et le
fonctionnement hors ligne restent inchangés sauf justification écrite dans la PR.

## Suivi des chantiers

| Ordre | Chantier | Priorité | Statut | Branche · PR |
| --- | --- | --- | --- | --- |
| 1 | UX01 Audit et cartographie | P0 | **Terminé** | `ux/ux01-audit` · PR #18 (fusionnée) |
| 2 | UX03 Navigation à 5 entrées | P0 | **Terminé** | `ux/ux03-navigation` · PR #19 (fusionnée) |
| 3 | UX05 Enseignements personnalisés | P0 | **Terminé** | `ux/ux05-enseignements` · PR #20 (fusionnée) |
| 4 | UX07 Filtres et visualisations (fonctionnel : filtres communs, types de graphiques) | P1 | **Terminé** | `ux/ux07-filtres` · PR #21 (fusionnée) |
| 5 | UX04 Tableau de bord « Mon jeu » | P0 | **Terminé** | `ux/ux04-mon-jeu` · PR #22 (fusionnée) |
| 6 | UX06 Espace Analyses | P0 | **Terminé** | `ux/ux06-analyses` · PR #23 (fusionnée) |
| 7 | UX08 Mon sac | P1 | **Terminé** | `ux/ux08-mon-sac` · PR #24 (fusionnée) |
| 8 | UX09 Saisie sur le parcours | P1 | **En revue** | `ux/ux09-saisie` |
| 9 | UX10 Journal chronologique | P1 | **En revue** | `ux/ux10-chronologie` (après #25) |
| 10 | UX11 Après partie | P1 | **En revue** | `ux/ux11-apres-partie` (après #26) |
| 11 | UX12 Premier lancement et états vides | P1 | **En revue** | `ux/ux12-premiers-pas` (après #27) |
| 12 | UX13 Repositionnement du coaching | P2 | **En revue** | `ux/ux13-coaching` (après #28) |
| 13 | UX14 Accessibilité (partie fonctionnelle : clavier, lecteur d'écran, zones tactiles) | P2 | **En revue** | `ux/ux14-accessibilite` (après #29) |
| — | UX15 Tests et non-régression | P0 | Après chaque chantier | — |
| Reporté | UX02 Identité visuelle et design system ; finitions visuelles d'UX14 | — | Reporté à la demande du propriétaire (25/11) | — |

**Recentrage du 25/11 :** la refonte graphique est reportée. Les chantiers UX gardent le style actuel (jetons existants
de `style.css`) ; la section 4 reste la référence pour plus tard. Les décisions 1, 2, 3 et 6 (typographie, couleurs,
outil de graphiques, thème plein soleil) sont reportées avec elle. UX05 et UX07 passent avant UX04 et UX06, qui
utilisent les enseignements et la barre de période (décision 4).

## 1. Inventaire de l'existant (état `app` 2528a5c)

### Écrans

| Rubrique | Page | Contenu |
| --- | --- | --- |
| Accueil | `accueil` | Raccourcis « Mon jeu », dernière partie, « Comprendre mon jeu » (4 raccourcis), « Mes tendances », qualité des données, « À découvrir » |
| Accueil | `profil` | Identité, index visé, cycles de coaching, données du profil, à propos, version |
| Jouer | `parcours` | Accès carte GPS, modes de saisie (Express, Standard, Expert), parcours, parties |
| Progresser | `practice` | Programme : progression, séance, avancement, badges, défis, historique, série de practice |
| Progresser | `exercices` | Défis et bibliothèque d'exercices |
| Statistiques | `bilan` | Tableau de bord, erreurs, putting, clubs, qualité, bilan à la une ; volets priorités, carte, notes, coups gagnés, évitables, relevés, défauts, palier |
| Mon sac | `sac` | Sac, distances, wedges, historique des mesures |

Alias d'URL à conserver : `jour`, `distances`, `parties`, `carnet`, `plan`, `entrainement`.

### Fiches, calques et parcours

- 14 fiches : partie, parcours, defaut, conditions, defi, donnees (Mes données), journal, analyste (Comprendre),
  sac, sacComposer, serie, recherche, carte, exercice. Mes données, Journal et Analyste ne sont accessibles
  que par un bouton ou la recherche.
- Calque de partie : pavé à 3 niveaux, coups, carte GPS, stratégie, bilan de fin, carte de score, marqueur.
- Premier lancement : formulaire de carnet, puis questionnaire de coaching en 8 étapes (facultatif).
- Recherche : catalogue en 5 groupes (Jouer, Progresser, Statistiques, Mon sac, Moi).

### Composants

| Composant | Occurrences | Technique |
| --- | --- | --- |
| Carte de score | 19 | HTML |
| Carte de tableau de bord | 12 | HTML, non cliquable |
| Constats | 10 | HTML |
| Volet repliable | 9 | HTML |
| État vide | 8 | HTML |
| Barre de répartition | 6 | CSS |
| Sélecteur de fenêtre 5/10/20 | 6 | HTML |
| Graphiques | 5 | Chart.js (courbes, distances, coups gagnés, trous, wedges) |
| KPI | 4 | HTML |
| Courbe des scores | 1 | SVG fait main |
| Dialogues | 14 | HTML |

Style : `style.css` 1 661 lignes (≈ 1 190 règles), `golf.css` 131, `sac3d.css` 73 ; jetons clair et sombre ;
polices Barlow Condensed, Atkinson Hyperlegible, Caveat.

## 2. Constats

| # | Constat | Impact |
| --- | --- | --- |
| 1 | Statistiques empile 6 blocs et 8 volets sur une seule page | Fort |
| 2 | Les cartes KPI et tableau de bord ne mènent nulle part | Fort |
| 3 | Cinq réglages de période différents (stats, fenêtre, journal, analyste, coups gagnés) | Fort |
| 4 | Provenance (mesuré / estimé / déclaré / inconnu) affichée de façons différentes | Fort |
| 5 | Mes données, Journal, Analyste, fiche parcours peu visibles | Moyen |
| 6 | Coaching et données au même niveau de navigation | Moyen |
| 7 | Trois techniques de graphiques | Moyen |
| 8 | Accueil en doublon avec Statistiques (tendances, qualité) | Faible |
| 9 | Profil mélangeant identité, données et coaching | Faible |

## 3. Architecture cible

Barre du bas : **Mon jeu · Analyses · Jouer · Mon sac · Journal**. En-tête : profil, recherche, sauvegardes.
Trois niveaux de lecture : synthèse (Mon jeu) → rubrique (Analyses) → détail (fiche partie, trou, club, coups, parcours).

- **Mon jeu** : performance générale (index déclaré, index estimé seulement s'il est calculable), 4 à 6 cartes
  cliquables, 3 enseignements au plus, dernière partie, actions rapides.
- **Analyses** : barre de période commune ; 12 rubriques (Performance générale, Mises en jeu, Attaque de green,
  Petit jeu, Putting, Erreurs récurrentes, Coups perdus estimés, Analyse des parcours, Analyse des trous,
  Comparaison des clubs, Qualité des données, Comprendre mon jeu) + Coaching (programme, exercices, défis).
- **Jouer** (action principale) : nouvelle partie, reprise, carte GPS, parcours ; calque de partie inchangé.
- **Mon sac** : distances et fourchettes, écarts entre clubs, matrice de wedges, dispersion, séries de practice,
  historique des mesures, composition, sac 3D en vue alternative.
- **Journal** : chronologie unifiée calculée depuis les sources existantes, notes, rapports, import et export.

### Correspondance ancien → nouveau

| Fonction actuelle | Aujourd'hui | Demain |
| --- | --- | --- |
| Raccourcis « Mon jeu » | Accueil | Mon jeu (actions rapides), Jouer |
| Dernière partie | Accueil | Mon jeu |
| Mes tendances | Accueil | Mon jeu, cartes indicateurs |
| Comprendre mon jeu | Accueil, fiche | Analyses › Comprendre mon jeu |
| Qualité des données | Accueil, Statistiques | Pastille Mon jeu ; Analyses › Qualité des données |
| À découvrir | Accueil | Bas de Mon jeu, repliable |
| Identité, index visé, à propos, version | Profil | Profil (en-tête) |
| Cycles de coaching | Profil | Analyses › Coaching |
| Carte GPS, modes, parcours | Jouer | Jouer |
| Liste des parties | Jouer | Journal (lien depuis Jouer) |
| Programme, séance, avancement, badges, défis, historique | Progresser | Analyses › Coaching |
| Série de practice | Progresser | Mon sac (lien depuis Coaching) |
| Exercices | Progresser | Analyses › Coaching › Exercices |
| Tableau de bord | Statistiques | Mon jeu ; Analyses › Performance générale |
| Bilan à la une, priorités | Statistiques | Mon jeu, enseignements |
| Erreurs, évitables, défauts | Statistiques | Analyses › Erreurs récurrentes |
| Putting | Statistiques | Analyses › Putting |
| Clubs | Statistiques | Analyses › Comparaison des clubs ; Mon sac |
| Carte des coups | Statistiques | Analyses › Attaque de green |
| Coups gagnés | Statistiques | Analyses › Coups perdus estimés |
| Relevés | Statistiques | Analyses › Performance générale |
| Notes | Statistiques | Journal |
| Palier | Statistiques | Analyses › Coaching |
| Fiche parcours, passages par trou | Fiche | Analyses › Analyse des parcours / des trous ; Jouer |
| Journal, rapports, import | Fiche | Journal |
| Mes données | Fiche | Analyses › Qualité des données ; sauvegarde dans le profil |
| Sac, distances, wedges, mesures, composition | Mon sac | Mon sac |
| Recherche | Fiche | En-tête |

Les anciens noms de pages et les 6 alias sont redirigés vers leur équivalent.

## 4. Design system « Golf Performance » (reporté)

Contrastes calculés (WCAG 2.1 : 4,5:1 texte courant, 3:1 gros texte et icônes).

| Jeton (clair) | Couleur | Usage | Contraste |
| --- | --- | --- | --- |
| vert-foret | #123D30 | Navigation, en-têtes, bouton principal | 12,1:1 avec texte blanc |
| vert-perf | #39845C | Graphiques, icônes, gros chiffres | 4,1:1 sur fond : gros texte seulement |
| vert-perf-texte | #2F6E4C | Petit texte positif, liens | 6,1:1 sur blanc |
| vert-accent | #BDEB9D | Pastille active, bouton Jouer, sur vert forêt uniquement | 9,0:1 sur vert forêt ; 1,4:1 sur blanc (interdit) |
| fond / carte | #F1F4F2 / #FFFFFF | Fonds | — |
| texte / texte-2 | #182720 / #5A6A62 | Texte, légendes | 14,1:1 / 5,2:1 sur fond |
| vigilance | #C99550 | Icônes et pastilles seulement | 2,7:1 (jamais en texte) |
| vigilance-texte | #8A5A1C | Texte de vigilance | 5,9:1 |
| erreur | #B3261E | Erreurs | 6,5:1 |

Sombre (sur carte #16241D, fond #0E1A15) : texte #E3E9E5 (13,1:1), texte-2 #A9B6AF (7,7:1), vert-perf #6FBF8E (7,3:1),
accent #BDEB9D (11,9:1), vigilance #E0B074 (8,2:1), erreur #F2827A (6,3:1). Thème plein soleil : noir sur blanc (21:1).

Graphiques (validateur de palette : 5 contrôles réussis, daltonisme compris) :

| Série | Clair | Sombre |
| --- | --- | --- |
| Gauche | #3E6FB0 | #5B8BCB |
| Centre | #2E9460 | #3FA872 |
| Courtes | #9467BD | #A07CC8 |
| Droite | #C2703D | #C27A45 |

Règles : une évolution s'affiche avec flèche + signe + mot (la couleur suit « meilleur / moins bon », pas le signe :
un score qui baisse est un progrès) ; les couleurs de statut ne servent jamais à une série.

Typographie : Inter hébergée localement et mise en cache, chiffres tabulaires ; échelle 40/28/20/16/15/13, rien sous 12 ;
Caveat retirée progressivement. Espacements en multiples de 4 ; rayons 12 / 8 / pastille ; zones tactiles ≥ 48 px ;
pas d'ombre.

Composants standard : carte statistique (valeur, évolution, périmètre, provenance, lien), carte de tendance,
carte d'enseignement (catégorie, titre, constat chiffré, période, effectif, fiabilité, lien, action), badge de
provenance (Mesuré plein, Estimé « ≈ » pointillé, Déclaré contour, Inconnu « — » gris), badge de fiabilité
(Solide / Indicatif / Insuffisant selon les seuils), barre de période (5, 10, 20 parties, Saison, Tout, Perso + filtres
parcours, 9/18, club, type de coup, practice/parcours, provenance), kit de graphiques (courbe, histogramme, barres
horizontales, dispersion, tableau, toujours une vue tableau), état vide utile, boutons, onglets, formulaires,
fenêtres, confirmations, barre de navigation.

## 5. Décisions à valider

Encore utiles pour les chantiers UX : 4, 5, 7 et 8 — appliquées telles que proposées depuis le 25/11 (demande de poursuivre les chantiers), à revoir si besoin. Reportées avec la refonte graphique : 1, 2, 3 et 6.

| # | Question | Proposition |
| --- | --- | --- |
| 1 | Typographie | Inter partout, chiffres tabulaires ; Barlow Condensed et Caveat retirés à UX14 |
| 2 | Variantes texte de la palette | Ajouter #2F6E4C et #8A5A1C |
| 3 | Outil de graphiques unique | Chart.js (déjà embarqué) ; SVG et barres CSS migrés |
| 4 | Ordre des chantiers | UX05 et UX07 avant UX04 et UX06 |
| 5 | Séries de practice | Vers Mon sac, lien depuis Coaching |
| 6 | Thème plein soleil | Ajouté comme 3e thème |
| 7 | Index estimé | Affiché seulement si le moteur de handicap le calcule, avec son effectif ; sinon « inconnu » |
| 8 | « Saison actuelle » | Année civile en cours |

## 6. Règles communes (UX15)

- Tests : `npm test`, `test-startup.js`, essais Playwright 3 à 27, plus les nouveaux tests de chaque chantier.
- Build : `node build.js`, contrôle de `docs/` (jamais modifié à la main), aucune page blanche.
- Sauvegardes anciennes restaurées à l'identique ; identifiants stables, exclusions, dénominateurs vérifiés.
- Une branche et une PR en brouillon par chantier ; fusion sur `app` seulement sur accord explicite.
- Crédits IA : non mesurables (aucun compteur) ; travail par lots autonomes, arrêt propre en fin de lot.

## Journal des chantiers UX

### UX01 — Audit et cartographie (25/11/2026)

- Objectif : inventaire complet, constats, architecture cible, design system, plan, avant toute modification d'écran.
- Modifications : ce fichier ; mise à jour de la feuille de route DATA (P12 terminé). Aucun code applicatif modifié.
- Vérifications : contrastes de la palette calculés ; palette des graphiques passée au validateur (clair et sombre).
- Difficultés : 3 couleurs de la palette V3 ne peuvent pas servir de texte sur fond clair (vert accent, vigilance,
  vert performance en petit corps) → variantes texte proposées (décision 2). L'index estimé de la roadmap n'est
  affichable que si un moteur le calcule déjà (décision 7).

### UX03 — Navigation à cinq entrées (25/11/2026)

- Objectif : barre Mon jeu · Analyses · Jouer · Mon sac · Journal, profil et recherche dans l'en-tête, coaching rangé
  dans Analyses, sans retirer de fonction ni changer le style.
- Modifications :
  - `ui-menu.js` : nouvelles entrées (Jouer au centre, marqué comme action principale), sous-navigation commune des
    pages d'Analyses (Statistiques, Comprendre mon jeu, Programme, Exercices et défis), catalogue de recherche regroupé
    (Mon jeu, Analyses, Coaching, Jouer, Mon sac, Journal, Profil) ; le profil n'a plus d'entrée marquée dans la barre.
  - `ui.js` : page `journal` ; alias conservés (`parties` mène désormais au Journal) et nouveaux noms (`analyses`,
    `statistiques`, `jouer`, `progresser`, `coaching`, `monjeu`…) ; en-têtes « Analyses » et « Analyses · Coaching ».
  - `ui-partie.js` : `partiesHTML` séparé en partie en direct (Jouer) et tableau de toutes les parties (Journal,
    avec état vide utile) ; fin de partie « voir la carte » mène au Journal.
  - `ui-journal.js` : page Journal (parties, bilans, import, Mes données). `ui-carnet.js` : la série de practice est
    aussi proposée dans Mon sac. `ui-front.js` : « Mes parties » mène au Journal.
  - `style.css` : deux règles (pastille de Jouer, marge de la sous-navigation), avec les jetons existants.
- Tests : `npm test` (883 noms, 0 doublon), `test-startup.js`, essais Playwright 3 à 27 verts, nouvel `essai28.js`
  (ordre de la barre, chaque entrée, 19 anciens noms et alias, profil, sous-navigation, Journal vide et rempli,
  touche retour, 29 fonctions de la recherche sans échec, aucun débordement à 360, 390, 412 et 1 280 px).
- Difficultés : 5 essais supposaient l'ancienne barre (Progresser, liste des parties dans Jouer) : adaptés, avec le
  helper commun `nav-essai.js`. Placer l'appel « série » en haut de Mon sac décalait la scène du sac 3D (essai 7) :
  il est placé après la matrice de wedges. Le bouton « Comprendre mon jeu » du tableau de bord, en double avec la
  sous-navigation, est retiré de cet endroit (la fonction reste dans la sous-navigation, l'accueil et la recherche).

### UX05 — Enseignements personnalisés (25/11/2026)

- Objectif : dire au joueur ce que révèlent ses données sans qu'il ait à chercher, par des règles déterministes.
- Modifications :
  - `src/engine-enseignements.js` (nouveau) : `enseignements(parties, ctx)` lit les réponses de « Comprendre mon jeu »
    (`repondre`), les erreurs récurrentes et le tableau des statistiques ; aucun calcul statistique nouveau. Sept
    catégories : record personnel, point de vigilance, erreur récurrente, opportunité de progression, progression,
    point fort, données à enrichir. Chaque enseignement : titre court, constat chiffré (mot pour mot la réponse de
    l'analyste pour les évolutions), période, effectif, fiabilité expliquée (solide au double du minimum, indicatif
    au-dessus, toujours indicatif pour une estimation, insuffisant pour les données à enrichir), provenance (observé,
    estimé, déduit, déclaré), lien vers le détail, action éventuelle. `choisirEnseignements` : trois au plus, une
    catégorie chacun, les plus importants d'abord, rotation quotidienne des ex aequo.
  - `src/ui-enseignements.js` (nouveau) : bloc « Ce que disent tes données » sur Mon jeu, fiche « Enseignements »
    regroupée par catégorie, liens vers la question de Comprendre mon jeu ou vers les erreurs des statistiques,
    passerelle vers la bibliothèque d'exercices filtrée sur le domaine (marquée « d'après tes données »).
  - Accès : sous-navigation d'Analyses, recherche. `style.css` : cartes avec les jetons existants.
- Seuils : ceux de Comprendre mon jeu (`SEUILS_ANALYSTE`, `MIN_ANALYSTE`) et des erreurs récurrentes ; en plus, record
  sur au moins 5 parties complètes, trou cité à partir d'un coup au-dessus du par en moyenne, secteur estimé à partir
  d'un demi-coup perdu par partie.
- Tests : `test-enseignements.js` (87 vérifications : rien sous les seuils, traçabilité, champs obligatoires,
  fiabilité, dégradation avec passerelle, record, rotation), ajouté à `npm test` (901 noms, 0 doublon) ; essais 3
  à 28 verts ; nouvel `essai29.js` (carnet vide, deux parties, douze parties, fiche, détail, exercices filtrés,
  erreurs, recherche, 360 et 390 px).
- Difficultés : deux enseignements pouvaient porter sur le même sujet (côté des ratés et erreur la plus fréquente) ;
  la règle « une catégorie par carte » sur Mon jeu évite le doublon, la fiche les garde tous. La fiabilité des
  évolutions s'appuie sur le nombre de parties, celle des côtés sur le nombre de ratés latéraux.

### UX07 — Filtre commun et version texte des graphiques (25/11/2026)

- Objectif : une seule période pour toutes les analyses, conservée d'un écran à l'autre, avec le périmètre toujours dit.
- Modifications :
  - `ui-stats.js` : le filtre des Statistiques devient le filtre commun (`ui.stats`) ; pastilles 5, 10, 20 parties,
    **Saison** (année civile en cours, décision 8) et Toutes ; format, parcours et période libre inchangés ; une période
    sans date de fin court jusqu'à aujourd'hui (la saison se compare donc à la période de même durée juste avant) ;
    `perimetreTexte`, `partiesFiltrees`, `fenetreCommune`.
  - Objectifs d'index (`ui-objectifs.js`) et tendances de Mon jeu (`ui-tableau.js`) : leurs boutons 5/10/20 pilotent le
    filtre commun (l'ancienne action `fenetre` reste acceptée).
  - Comprendre mon jeu (`ui-analyste.js`) : ses périodes propres (toutes, trois mois, saison) sont remplacées par le
    filtre commun, avec le périmètre affiché ; un enseignement ouvert en détail remet le filtre sur « Toutes ».
  - Graphiques Chart.js : une version texte dépliable sous chaque graphique (`ui-graphes.js`).
  - `style.css` : les cinq pastilles passent à la ligne plutôt que de couper leur texte.
- Non modifié, volontairement : les périodes du Journal (mois, trimestre, saison, libre) sont des périodes de rapport,
  pas un filtre d'analyse ; l'objectif d'index des coups gagnés n'est pas une période. Les filtres club, type de coup,
  practice ou parcours et provenance n'ont de sens que pour les coups et les clubs : ils viendront avec UX06 et UX08.
  La technique des graphiques (Chart.js, SVG, barres) reste en l'état avec la refonte graphique reportée (décision 3).
- Tests : `npm test` (908 noms, 0 doublon), `test-startup.js`, essais 3 à 29 verts (essais 4 et 27 adaptés : les
  objectifs et Comprendre mon jeu suivent le filtre commun, 10 parties par défaut), nouvel `essai30.js` (pastilles,
  saison sur l'année civile et comparable, même période dans Statistiques, objectifs, Mon jeu et Comprendre mon jeu,
  changement fait dans Comprendre repris partout, version texte de chaque graphique, 360 et 390 px).
- Difficultés : Comprendre mon jeu partait de toutes les parties ; il part désormais du filtre commun (10 parties par
  défaut), ce qui peut donner « pas assez de parties » là où toutes les parties suffisaient : le périmètre affiché et
  la pastille « Toutes » le rendent explicite. La saison n'avait pas de date de fin : la comparaison la borne à aujourd'hui.

### UX04 — Tableau de bord « Mon jeu » (25/11/2026)

- Objectif : comprendre l'état de son jeu en quelques secondes, résultats d'abord, sans chiffre fictif.
- Modifications (`ui-front.js`, nouvel accueil en cinq blocs) :
  1. **Performance générale** : index déclaré et son évolution (historique saisi), index estimé à part (barème WHS,
     nombre de parties, « pas ton index officiel » ; « inconnu » avec ce qu'il manque, décision 7), objectif, courbe.
     Sans index ni objectif choisi, l'objectif s'affiche « – À définir » au lieu d'une cible calculée sur un index inconnu.
  2. **Indicateurs clés** : six cartes cliquables (score, mises en jeu jouables, greens en régulation déduits, putts,
     trois-putts, pénalités) calculées par `tableauStats` sur le filtre commun (UX07), avec l'évolution par rapport à la
     période comparable (`comparerStats`), le périmètre, l'effectif, la provenance ; chaque carte ouvre l'analyse
     correspondante (Analyses, putting ou erreurs). Lien vers la qualité des données.
  3. **Enseignements** (UX05).
  4. **Dernière partie** : date, parcours, score, GIR, putts, pénalités, faits marquants (meilleur et plus coûteux trou,
     écart à la moyenne ramenée à 18 trous).
  5. **Actions rapides** : nouvelle partie ou reprise, série au practice, statistiques, mes parties ; lien vers le
     coaching (facultatif). Une partie en cours fait apparaître « Reprendre ma partie au trou N » en tête.
  Les raccourcis « Comprendre mon jeu » restent en bas.
- Déplacé, pas supprimé : les anciennes « Mes tendances » (petit jeu, coups gagnés estimés, conseils face à l'objectif)
  passent dans Analyses, pli « Repères face à ton objectif » ; la qualité du carnet est dans Analyses (lien depuis
  Mon jeu) ; « À découvrir » est remplacé par les actions rapides et le lien vers le coaching.
- Non affiché faute de donnée calculée par les moteurs : doubles bogeys ou pire (pas dans `tableauStats`) ; « fairways »
  est présenté comme « mises en jeu jouables », ce que mesure réellement la saisie.
- Tests : `npm test` (911 noms, 0 doublon), `test-startup.js`, essais 3 à 30 verts (essais 12 et 18 adaptés : nouvel
  accueil, pli des repères), nouvel `essai31.js` (carnet vide sans chiffre fictif, ordre des blocs, index déclaré et
  estimé, évolution et périmètre, faits marquants, actions, clic vers l'analyse, retour, reprise de partie, 360 et 390 px).
- Difficultés : les cartes d'index étaient trop étroites à 390 px (trois colonnes) : deux colonnes sous 520 px,
  l'objectif sur toute la largeur. Les repères de l'ancien accueil comportaient leurs propres pastilles de période :
  sous le filtre commun d'Analyses, elles sont retirées.

### UX06 — Analyses en douze rubriques (25/11/2026)

- Objectif : remplacer la longue page de statistiques par des rubriques à structure commune, avec navigation en profondeur.
- Modifications :
  - `src/ui-rubriques.js` (nouveau) : douze rubriques (Performance générale, Mises en jeu, Attaque de green, Petit jeu,
    Putting, Erreurs récurrentes, Coups perdus estimés, Analyse des parcours, Analyse des trous, Comparaison des clubs,
    Qualité des données, Comprendre mon jeu) choisies par des pastilles défilantes. Chaque rubrique : titre, résumé d'une
    ligne, enseignements liés (UX05), chiffres et graphiques (blocs existants), détail, actions (exercices du domaine).
    Les blocs existants sont répartis sans changement de calcul : tableau de bord, palier, priorités, carte, jeu sur 100
    et repères → Performance ; répartitions et réponses mises en jeu / côtés → Mises en jeu ; putting et relevés →
    Putting ; erreurs, erreurs évitables, défauts → Erreurs ; objectif d'index → Coups perdus estimés ; parcours, trous,
    clubs, qualité : leurs blocs. Attaque de green et Petit jeu : erreurs suivies (green manqué, double approche) et
    secteur estimé, marqué « Estimé ». Comprendre : les douze questions.
  - `ui-stats.js` : `tableauStatsHTML("filtres" | "contenu")`, `repartitionsStatsHTML` ; format, parcours, période libre
    et comparaison repliés sous « Plus de filtres » (ouverts dès qu'un réglage diffère du défaut, ouverture mémorisée).
  - Navigation en profondeur : `allerA` (et le sommaire, la fin de partie « voir les coups gagnés », les liens des
    enseignements) ouvre la rubrique qui contient la section demandée ; les cartes de Mon jeu mènent à leur rubrique
    (score → Performance, mises en jeu → Mises en jeu, GIR → Attaque de green, putts → Putting, pénalités → Erreurs).
    La rubrique choisie est conservée quand on revient dans Analyses.
  - Sans partie dans la période, les blocs issus du profil déclaré (palier, carte, défauts, objectif) restent affichés.
- Tests : `npm test` (922 noms, 0 doublon), `test-startup.js`, essais 3 à 31 verts (essais 3, 4, 5, 6, 11, 18, 19, 21,
  22, 23, 25, 31 adaptés : ouvrir la rubrique avant de lire un bloc), nouvel `essai32.js` (ordre, chaque rubrique vide et
  remplie, filtre, contenus, conservation, liens depuis Mon jeu et la recherche, 360 et 390 px).
- Difficultés : le filtre complet occupait tout le premier écran sur téléphone (repli de « Plus de filtres », bouton
  des bilans déplacé en bas de Performance). Trois chemins menaient à une section sans passer par `allerA` (sommaire,
  fin de partie, liens des enseignements) : corrigés. Pas de nouvel indicateur pour Attaque de green et Petit jeu :
  seulement ce que les moteurs calculent déjà.

### UX08 — Mon sac côté données (25/11/2026)

- Objectif : donner la priorité aux chiffres des clubs, garder le sac 3D comme vue alternative.
- Modifications :
  - `src/ui-monsac.js` (nouveau) : tableau « Mes clubs » en tête de Mon sac (distance typique observée, fourchette,
    nombre de mesures au practice et sur le parcours ; note courte pour un écart anormal avec un club voisin ou un club
    peu documenté, moins de 3 mesures). Aucune distance estimée n'y entre : un club sans mesure affiche « – À mesurer ».
    Boutons « Mesurer une série » et « Composer mon sac ».
  - Fiche d'un club (`ui-sac.js`) : en tête, ses chiffres (distance typique et fourchette, mesures practice / parcours,
    distance mesurée sur le parcours avec la part GPS, direction gauche / axe / droite), l'évolution de ses dernières
    séries datées, l'enseignement qui le concerne, et la série de balles en un toucher (le bouton existant, remonté).
  - Le sac 3D, l'écart entre clubs voisins, la régularité, la matrice de wedges, l'appel aux séries et l'historique
    restent, sous le tableau. Le profil détaillé et la comparaison des clubs restent dans Analyses › Clubs.
- Non fait : aucun nouveau système de mesure GPS (consigne). L'évolution des distances se lit par les séries datées :
  les saisies du carnet n'ont pas de date.
- Tests : `npm test` (926 noms, 0 doublon), `test-startup.js`, essais 3 à 32 verts, nouvel `essai33.js` (tableau,
  club sans mesure sans estimation, écart anormal, résumé, 3D conservé, fiche du fer 7 et ses séries, série en un
  toucher, 360 et 390 px). `essai-sac3d.js` (fichier autonome absent du dépôt) échouait déjà avant ce chantier.
- Difficultés : une colonne « À noter » rendait le tableau trop large sur téléphone ; la note passe sous le nom du club,
  en version courte (la phrase complète reste dans la fiche).

### UX09 — Saisie d'un coup sur le parcours (25/11/2026)

- Objectif : noter un coup vite, à une main, sans rien inventer.
- Modifications (`ui-jeu.js`, panneau d'un coup en saisie Expert) : nouvel ordre — **club**, **direction** (gauche ou
  droite sur l'ellipse), **distance mesurée** (vide par défaut) ; position de la balle, type de coup, amplitude des
  wedges et marquage GPS sont repliés sous « Plus de détails », avec leur valeur visible dans le titre (« Balle :
  départ », « Balle : non notée »…). Le repli s'ouvre de lui-même quand un détail a déjà été noté (type de coup,
  amplitude, position d'un coup existant). Un coup se note en trois interactions après l'ouverture : club, direction,
  Enregistrer. Les trois niveaux de saisie, les validations, la correction et la sauvegarde sont inchangés.
- Garanties vérifiées : la distance reste vide (la moyenne du club n'apparaît qu'en indication) ; une direction ne
  remplit pas la distance ; la position n'est jamais choisie à la place du joueur (départ pour le premier coup, sinon
  carte GPS ou rien) ; corriger un coup ne crée pas de second coup ; zones tactiles d'au moins 44 px.
- Tests : `npm test` (926 noms), `test-startup.js`, essais 3 à 33 verts (essais 10 et 16 adaptés : ouvrir « Plus de
  détails » avant la position, le type, l'amplitude ou le GPS), nouvel `essai34.js`.
- Difficultés : aucune sur la logique ; seul l'ordre d'affichage change.

### UX10 — Journal chronologique (25/11/2026)

- Objectif : une seule chronologie de toutes les activités, construite à partir des sources existantes.
- Modifications :
  - `src/engine-chronologie.js` (nouveau) : `chronologie(sources)` réunit parties (avec leur note), séries de practice,
    mises à jour d'index, cycles de coaching et défis, du plus récent au plus ancien ; faits marquants : record de score
    (écart au par ramené à 18 trous, au moins 3 parties complètes avant) et meilleur index déclaré ;
    `filtrerChronologie` par type (parties, practice, index, entraînement, notes), période et parcours. Calcul à
    l'affichage : rien n'est ajouté à la sauvegarde.
  - `src/ui-chronologie.js` (nouveau) : section « Chronologie » en tête du Journal (faits marquants, filtres, regroupement
    par mois, note visible, « afficher plus ») ; chaque événement ouvre son détail (carte de score, fiche du club, profil,
    défis, programme). Le tableau des parties, les bilans, l'import et Mes données restent.
- Tests : `test-chronologie.js` (15 vérifications) ajouté à `npm test` (937 noms, 0 doublon) ; essais concernés verts ;
  nouvel `essai35.js` (vide, rempli, ordre, mois, faits marquants, filtres, note, détails, sauvegarde inchangée, 360 et 390 px).
- Difficultés : la classe `.chrono` existait déjà (chronomètre des défis) et faisait sortir la liste de l'écran ;
  renommée `.chrono-liste`. L'export final du moteur doit garder la forme en bloc attendue par le build.

### UX11 — Après la partie (25/11/2026)

- Objectif : faire du bilan de fin de partie un moment qui dit ce qui a changé, à partir des seules données saisies.
- Modifications (`ui-apres.js`, utilisées par le bilan express et le bilan en chiffres de `ui-partie.js`) :
  - **Par rapport à tes habitudes** : score, putts, greens en régulation et pénalités de la partie, ramenés à 18 trous,
    contre la moyenne des 10 parties précédentes (dès 3 parties ; sinon, on le dit), avec flèche, signe et mot ; synthèse
    d'une phrase (« Partie meilleure que d'habitude de 6,0 coups, surtout grâce au putting »), le facteur cité étant
    l'écart le plus net dans le même sens que le score.
  - **Ce qui a changé** : score moyen et putts des 10 dernières parties, avant → avec cette partie.
  - **Meilleur et plus coûteux trou**, **clubs utilisés** (coups notés, sinon familles de départ).
  - **Voir l'analyse** : Performance, Putting, Mises en jeu, Erreurs, directement dans la bonne rubrique.
  Le reste est conservé : chiffres, Stableford, record, coups gagnés estimés, erreurs, note, carte de score, partage en image.
- Tests : `npm test`, `test-doublons` (941 noms), essais liés à la partie verts, nouvel `essai36.js` (express et chiffres,
  comparaison, synthèse, évolution, trous, carte de score, accès à Putting, sans historique).
- Difficultés : comparer une partie de 9 trous à des parties de 18 demande de tout ramener à 18 trous, comme partout ailleurs.

### UX12 — Premier lancement et états vides (25/11/2026)

- Objectif : un carnet vide reste compréhensible et donne envie, sans rien de fictif.
- Modifications :
  - Premier lancement (`ui.js`) : les quatre bénéfices (enregistrer tes parties, connaître tes clubs, comprendre tes
    erreurs, mesurer ta progression), sans exemple chiffré ni graphique ; le formulaire court et le questionnaire
    facultatif sont inchangés.
  - Mon jeu (`ui-front.js`) : carte « Premiers pas » en tête — noter une partie, mesurer un club, trois parties complètes
    pour les tendances (compteur 1/3), indiquer son index (facultatif). Chaque étape a son bouton ; une étape cochée dit ce
    qu'elle débloque ; la carte s'efface dès trois parties complètes (mesures et index restent proposés dans Mon sac et
    le profil).
  - États vides vérifiés : Mon jeu (indicateurs : quoi faire), Mon sac (« À mesurer », série), Journal, rubriques
    d'Analyses (« Pas encore de partie »), aucune courbe ni chiffre d'exemple.
- Tests : `test-doublons` (942 noms), essais liés verts (essai 31 adapté : « Premiers pas » en tête d'un carnet vide),
  nouvel `essai37.js`.

### UX13 — Coaching repositionné (25/11/2026)

- Objectif : garder tout le coaching, mais à partir des résultats, et dire d'où vient chaque recommandation.
- Modifications (`src/ui-coaching.js`, nouveau ; `ui.js`, `ui-enseignements.js`) :
  - Programme : mention « D'après ton questionnaire » (réponses déclarées) quand il a été construit par le questionnaire ;
    rien de tel pour un carnet sans questionnaire (le programme reste proposé en option).
  - Bloc « D'après tes données » dans le programme : jusqu'à trois exercices issus des enseignements (constat chiffré
    cité), présentés comme recommandations observées qui ne remplacent pas le programme ; sans partie, la bibliothèque
    reste ouverte.
  - Bibliothèque : quand elle est filtrée depuis un constat, bandeau « D'après tes données » et retour à toute la
    bibliothèque ; un choix manuel efface le bandeau.
  - Priorités (Analyses › Performance) : origine dite (« D'après ton profil » : déclaré, remplacé par les tests et les
    parties quand ils existent).
  - Rien retiré : exercices, programmes, diagnostics, défis, badges, cycles.
- Tests : `test-doublons` (944 noms), essais liés verts, nouvel `essai38.js`.

### UX14 — Accessibilité, partie fonctionnelle (25/11/2026)

- Objectif : vérifier et corriger l'accessibilité des écrans principaux, sans la refonte graphique (reportée).
- Audit automatique (`essai39.js`) de Mon jeu, Analyses, Jouer, Mon sac et Journal à 360 px (clair), 768 px (sombre) et
  1 280 px : nom accessible de chaque bouton et champ, zones tactiles ≥ 44 px (liens dans le texte exceptés ; la scène du
  sac 3D aussi, chaque club étant accessible par le tableau), texte ≥ 12 px, focus visible au clavier, évolution jamais
  signalée par la couleur seule, aucun débordement.
- Corrections : chaque flèche d'évolution porte son sens en mots (« mieux » / « moins bien », lisible par les lecteurs
  d'écran et au survol) dans les statistiques, les tendances et l'après-partie ; badges de provenance à 12 px ; textes
  des jauges du jeu sur 100 à 12 px.
- Reporté avec la refonte graphique : thème plein soleil, cohérence des icônes, transitions, finitions visuelles.
- Tests : `npm test` (944 noms, 0 doublon), `test-startup.js`, **essais 3 à 39 tous verts** sur la branche qui empile
  UX09 à UX14.
