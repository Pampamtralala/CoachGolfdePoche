/* ============================================================
   BASE D'EXERCICES — partie 1 : mise en jeu, jeu de fers, wedging
   Champs : id, d (domaine), t (titre), type, niv [palier min, palier max],
   lieux, min (durée), mat (matériel), but, etapes, palier (adaptation par palier),
   score { lib, max, sens, rep [repère par palier], ind (indicateur mis à jour) }
   corr: true = exercice réservé à la correction d'un défaut diagnostiqué
   ============================================================ */

const EXERCICES_1 = [

  /* ---------------- MISE EN JEU ---------------- */
  { id: "dr_reglages", d: "drive", t: "Les réglages du driver", type: "technique", niv: [1, 2], lieux: ["practice"], min: 10,
    but: "Installer les trois réglages qui permettent de frapper la balle en remontant.",
    etapes: [
      "Plante le tee pour que la moitié de la balle dépasse du haut de la tête du driver.",
      "Place la balle en face du talon du pied avant, les pieds un peu plus écartés que les épaules.",
      "Incline légèrement le buste à l'opposé de la cible : l'épaule arrière est plus basse que l'épaule avant.",
      "Joue 15 balles à 70 % de ta vitesse en vérifiant ces trois points avant chaque coup." ] },

  { id: "dr_rythme", d: "drive", t: "Le driver à 70 %", type: "technique", niv: [1, 3], lieux: ["practice"], min: 10,
    but: "Constater qu'un swing plus calme met plus de balles en jeu sans perdre beaucoup de distance.",
    etapes: [
      "Joue 5 balles à 50 % de ta vitesse, en tenant la finition 3 secondes.",
      "Joue 10 balles à 70 %, avec la même finition tenue.",
      "Joue 5 balles à pleine vitesse et compare la dispersion, le contact et la distance.",
      "Retiens la vitesse qui met le plus de balles en jeu : c'est ta vitesse de parcours." ] },

  { id: "dr_porte", corr: true, d: "drive", t: "La porte", type: "technique", niv: [1, 4], lieux: ["practice"], min: 15,
    mat: "Un couvre-club ou une boîte de balles vide",
    but: "Corriger un club qui coupe la balle de l'extérieur vers l'intérieur.",
    etapes: [
      "Pose le couvre-club à l'extérieur de la balle : 5 cm plus loin de toi et légèrement en arrière.",
      "Joue des demi-swings au fer 7 sans toucher le couvre-club.",
      "Cherche la sensation de frapper le quart intérieur de la balle et de l'envoyer légèrement à {df} de la cible.",
      "Passe au swing complet, puis au driver, quand 8 balles sur 10 évitent l'obstacle." ] },

  { id: "dr_pied_recule", corr: true, d: "drive", t: "Le pied arrière reculé", type: "technique", niv: [2, 4], lieux: ["practice"], min: 10,
    but: "Sentir un club qui arrive de l'intérieur, pour réduire le slice.",
    etapes: [
      "À l'adresse, recule le pied arrière d'une vingtaine de centimètres par rapport à la ligne de jeu.",
      "Garde les épaules parallèles à la ligne de jeu.",
      "Joue 10 balles à 70 % : le club a la place d'arriver de l'intérieur.",
      "Reviens à un stance normal et retrouve la même sensation sur 10 balles." ] },

  { id: "dr_balayer", d: "drive", t: "Balayer le tee", type: "technique", niv: [1, 3], lieux: ["practice"], min: 10,
    but: "Supprimer les chandelles en remplaçant l'attaque plongeante par un balayage.",
    etapes: [
      "Vérifie la hauteur du tee : la moitié de la balle au-dessus de la tête du club, pas plus.",
      "Sans balle, fais 5 swings qui effleurent le haut du tee sans le casser ni toucher le sol.",
      "Avec une balle, cherche à laisser le tee planté après la frappe.",
      "Garde la balle en face du talon avant et l'épaule arrière légèrement plus basse." ] },

  { id: "dr_vitesse", d: "drive", t: "Le sifflement", type: "technique", niv: [2, 4], lieux: ["practice", "maison"], min: 10,
    but: "Gagner de la vitesse de club en la libérant au bon moment.",
    etapes: [
      "Tiens le driver à l'envers, par le manche, juste sous la tête.",
      "Dans un espace bien dégagé, fais des swings complets en écoutant le sifflement du grip.",
      "Cherche à le faire siffler après le passage de la balle, côté cible, et non derrière toi.",
      "Enchaîne 3 séries de 5 swings. Au practice, joue ensuite 5 balles avec le même relâchement." ] },

  { id: "dr_club_secu", d: "drive", t: "Le club de sécurité", type: "jeu", niv: [1, 3], lieux: ["practice"], min: 15,
    but: "Trouver le club de départ qui met la balle en jeu 8 fois sur 10.",
    etapes: [
      "Délimite un fairway imaginaire d'environ 35 m de large entre deux repères.",
      "Joue 10 balles au driver et compte celles qui restent dedans.",
      "Recommence avec un bois de parcours ou un hybride, puis avec un fer.",
      "Le club qui obtient le meilleur score devient ton club de départ sur les trous étroits." ] },

  { id: "dr_tee_cote", d: "drive", t: "Se placer sur le départ", type: "jeu", niv: [2, 4], lieux: ["practice"], min: 10,
    but: "Utiliser la largeur du départ pour s'éloigner du danger.",
    etapes: [
      "Imagine un hors-limites à droite : place ta balle du côté droit du départ et vise la moitié gauche du fairway.",
      "Joue 5 balles ainsi et compte celles qui finissent dans la moitié sûre.",
      "Inverse : danger à gauche, balle à gauche du départ, visée à droite.",
      "Retiens la règle : on se place du côté du danger pour jouer en s'en éloignant." ] },

  { id: "dr_neuf_departs", d: "drive", t: "Neuf départs", type: "jeu", niv: [2, 4], lieux: ["practice"], min: 15,
    but: "S'entraîner comme sur le parcours : un seul essai par départ.",
    etapes: [
      "Imagine les 9 premiers départs de ton parcours : largeur du fairway, dangers, club à jouer.",
      "Joue une seule balle par trou, avec ta routine complète.",
      "Compte 1 point par balle en jeu, 0 sinon. Retire 1 point pour une balle qui serait perdue ou hors limites.",
      "Note ton total sur 9." ],
    score: { lib: "Points sur 9", max: 9, sens: "haut", rep: [4, 5, 6, 7] } },

  { id: "dr_formes", d: "drive", t: "Fade et draw à la demande", type: "jeu", niv: [3, 4], lieux: ["practice"], min: 15,
    but: "Choisir la courbe de ta balle au lieu de la subir.",
    etapes: [
      "Fade : aligne les pieds et les épaules légèrement à {gf} de la cible, et oriente la face du club entre cette ligne et la cible. La balle part à {gf} et revient. Joue 5 balles.",
      "Draw : aligne-toi légèrement à {df} de la cible, la face orientée entre ta ligne de pieds et la cible. La balle part à {df} et revient. Joue 5 balles.",
      "Alterne une balle sur deux, puis annonce la courbe avant chaque coup.",
      "Compte les balles qui partent du bon côté et tournent dans le bon sens." ],
    palier: { 3: "Contente-toi d'obtenir le bon sens de courbe, même léger.", 4: "Exige une courbe de moins de 10 m et une arrivée dans un fairway de 25 m." },
    score: { lib: "Courbes réussies sur 10", max: 10, sens: "haut", rep: [5, 5, 5, 7] } },

  { id: "dr_fairway", d: "drive", t: "Le fairway imaginaire", type: "test", niv: [1, 4], lieux: ["practice"], min: 10,
    but: "Mesurer ta mise en jeu dans des conditions proches du parcours.",
    etapes: [
      "Choisis deux repères au fond du practice pour délimiter un fairway.",
      "Joue 10 mises en jeu avec ta routine complète, une balle à la fois.",
      "Compte les balles qui finissent entre les deux repères." ],
    palier: { 1: "Fairway de 40 m de large, avec le club de ton choix.", 2: "Fairway de 35 m de large.", 3: "Fairway de 30 m de large, au driver.", 4: "Fairway de 25 m de large, au driver." },
    score: { lib: "Balles dans le fairway sur 10", max: 10, sens: "haut", rep: [4, 6, 7, 8], ind: "drive_jeu" } },

  { id: "dr_dispersion", d: "drive", t: "Mon cône de dispersion", type: "test", niv: [3, 4], lieux: ["practice"], min: 15,
    but: "Connaître la largeur réelle de tes mises en jeu pour choisir tes cibles.",
    etapes: [
      "Vise un repère précis et joue 10 drives avec ta routine.",
      "Écarte la plus mauvaise des dix, puis repère la balle la plus à gauche et la plus à droite.",
      "Estime la largeur entre les deux à l'aide des repères du practice.",
      "Sur le parcours, vise de façon que toute cette largeur reste jouable." ],
    score: { lib: "Largeur de dispersion, en mètres", max: 150, sens: "bas", rep: [70, 65, 60, 50] } },

  /* ---------------- JEU DE FERS ---------------- */
  { id: "fe_grip", d: "fers", t: "Le contrôle du grip", type: "technique", niv: [1, 4], lieux: ["practice", "maison"], min: 10,
    but: "Prendre le club de la même façon à chaque coup. C'est le grip qui oriente la face.",
    etapes: [
      "Pose la main du haut : le grip traverse la base des doigts, pas la paume.",
      "En regardant vers le bas, tu dois voir 2 à 3 jointures de cette main.",
      "Pose la main du bas : sa paume fait face à la cible et recouvre le pouce de la main du haut.",
      "Les deux V formés par les pouces et les index pointent vers l'épaule arrière.",
      "Répète 20 prises de grip en relâchant tout entre chacune. Pression : 4 sur 10." ] },

  { id: "fe_posture", d: "fers", t: "Posture et position de balle", type: "technique", niv: [1, 2], lieux: ["practice", "maison"], min: 10,
    mat: "Un miroir ou une vitre, si possible",
    but: "Te placer de la même façon devant chaque balle.",
    etapes: [
      "Écarte les pieds de la largeur des épaules, genoux déverrouillés.",
      "Penche-toi depuis les hanches, dos droit, jusqu'à ce que les bras pendent librement.",
      "Répartis le poids au milieu des pieds, ni sur les pointes ni sur les talons.",
      "Place la balle au centre pour les fers courts, une balle plus en avant pour les fers moyens, en face du talon avant pour le driver.",
      "Mets-toi 10 fois en posture en partant debout, puis vérifie dans le miroir." ] },

  { id: "fe_alignement", d: "fers", t: "Le poste d'alignement", type: "technique", niv: [1, 4], lieux: ["practice"], min: 10,
    mat: "Deux baguettes d'alignement ou deux clubs",
    but: "Viser là où tu crois viser.",
    etapes: [
      "Pose une baguette au sol, pointée vers la cible, juste à l'extérieur de la balle.",
      "Pose la seconde parallèle à la première, le long de tes pointes de pieds.",
      "Aligne d'abord la face du club sur la cible, puis les pieds, les hanches et les épaules le long de la baguette.",
      "Joue 15 balles en refaisant l'alignement complet avant chaque coup." ] },

  { id: "fe_brosser", d: "fers", t: "Brosser l'herbe", type: "technique", niv: [1, 2], lieux: ["practice", "maison"], min: 10,
    but: "Apprendre au club à toucher le sol au même endroit à chaque swing.",
    etapes: [
      "Sans balle, fais des demi-swings au fer 9 en brossant le sol.",
      "Repère l'endroit où le club touche : il doit se trouver au centre de ton stance ou légèrement devant.",
      "Fais 10 brossages de suite au même endroit.",
      "Place une balle sur ce point et refais le même geste, sans chercher à la frapper." ] },

  { id: "fe_fer9_tee", d: "fers", t: "Le fer 9 sur tee", type: "technique", niv: [1, 2], lieux: ["practice"], min: 10,
    but: "Laisser le loft du club lever la balle.",
    etapes: [
      "Pose la balle sur un tee très bas et prends un fer 9.",
      "Fais un demi-swing : les mains montent à hauteur de hanches, puis traversent à la même hauteur.",
      "Ne cherche pas à soulever la balle. Frappe vers le bas, le club fait le reste.",
      "Quand 7 balles sur 10 décollent, retire le tee et recommence au sol." ] },

  { id: "fe_demi", d: "fers", t: "Les demi-swings", type: "technique", niv: [1, 4], lieux: ["practice"], min: 10,
    but: "Solidifier le contact avec un geste court avant d'allonger.",
    etapes: [
      "Avec un fer 8, monte jusqu'à ce que le bras avant soit parallèle au sol.",
      "Traverse jusqu'à la position symétrique, le bras arrière parallèle au sol.",
      "Cherche un contact net et une trajectoire droite, à mi-distance.",
      "Joue 15 balles. Si le contact se dégrade en swing complet, reviens à cet exercice." ] },

  { id: "fe_pieds_joints", d: "fers", t: "Pieds joints", type: "technique", niv: [1, 4], lieux: ["practice"], min: 10,
    but: "Améliorer l'équilibre, le rythme et le centrage du contact.",
    etapes: [
      "Joue un fer 8 pieds serrés, la balle au centre.",
      "Swingue aux trois quarts : si tu forces, tu perds l'équilibre.",
      "Tiens la finition 3 secondes après chaque balle.",
      "Joue 10 balles pieds joints, puis 5 en stance normal avec le même rythme." ] },

  { id: "fe_ligne", d: "fers", t: "La ligne au sol", type: "technique", niv: [1, 4], lieux: ["practice"], min: 15,
    mat: "Sur herbe, une ligne tracée avec un tee. Sur tapis, une pièce posée 3 cm derrière la balle",
    but: "Placer le point bas du swing après la balle, pour supprimer grattes et tops.",
    etapes: [
      "Trace une ligne perpendiculaire à la ligne de jeu et place-toi comme si la balle était dessus.",
      "Sans balle, fais 10 swings : le club doit toucher le sol sur la ligne ou du côté de la cible.",
      "Pose des balles sur la ligne et joue-les. Le divot commence sur la ligne ou après.",
      "Sur tapis, joue la balle sans toucher la pièce posée derrière elle." ] },

  { id: "fe_tee_devant", d: "fers", t: "Le tee devant la balle", type: "technique", niv: [1, 3], lieux: ["practice"], min: 10,
    but: "Frapper la balle puis le sol, dans cet ordre.",
    etapes: [
      "Plante un tee à ras du sol, 5 cm devant la balle, côté cible. Sur tapis, pose une pièce à la place.",
      "Joue un fer court en cherchant à arracher le tee après avoir frappé la balle.",
      "Finis en équilibre sur le pied avant, le talon arrière décollé.",
      "Joue 15 balles et compte les tees touchés." ] },

  { id: "fe_pied_pointe", d: "fers", t: "Le pied arrière sur la pointe", type: "technique", niv: [1, 3], lieux: ["practice"], min: 10,
    but: "Garder le poids côté cible pour toucher la balle avant le sol.",
    etapes: [
      "Recule le pied arrière et pose-le sur la pointe : 80 % du poids repose sur le pied avant.",
      "Joue des trois quarts de swing au fer 9, sans transférer de poids vers l'arrière.",
      "Observe le contact : la balle d'abord, le sol ensuite.",
      "Joue 10 balles ainsi, puis 5 en stance normal en finissant sur le pied avant." ] },

  { id: "fe_hybride", d: "fers", t: "Balayer le bois de parcours", type: "technique", niv: [1, 3], lieux: ["practice"], min: 10,
    but: "Jouer les hybrides et les bois au sol sans chercher à lever la balle.",
    etapes: [
      "Place la balle deux largeurs de balle en avant du centre.",
      "Commence sur un tee très bas : balaie la balle sans casser le tee.",
      "Le club rase le sol au passage, sans creuser.",
      "Après 10 bonnes balles, retire le tee et garde le même balayage." ] },

  { id: "fe_pas", d: "fers", t: "Le pas vers la cible", type: "technique", niv: [2, 4], lieux: ["practice"], min: 10,
    but: "Enchaîner le transfert de poids et la rotation dans le bon ordre.",
    etapes: [
      "Place-toi pieds joints, la balle une quinzaine de centimètres devant eux, côté cible.",
      "Monte le club. En fin de montée, fais un pas vers la cible avec le pied avant.",
      "Laisse le swing suivre le pas, sans retenir le corps.",
      "Joue 10 balles à 60 %, puis 5 en stance normal avec la même sensation d'appui." ] },

  { id: "fe_punch", d: "fers", t: "Les coups punchés", type: "technique", niv: [2, 4], lieux: ["practice"], min: 10,
    but: "Arriver à l'impact avec les mains devant la balle.",
    etapes: [
      "Place la balle une largeur de balle en arrière du centre, le poids légèrement sur le pied avant.",
      "Fais trois quarts de montée, puis arrête la traversée à hauteur de poitrine.",
      "À l'impact, les mains sont en avance sur la tête de club.",
      "Joue 10 balles : elles partent bas et droit, avec un divot après la balle." ] },

  { id: "fe_serviette", d: "fers", t: "La serviette sous les bras", type: "technique", niv: [2, 4], lieux: ["practice"], min: 10,
    mat: "Une serviette",
    but: "Faire travailler les bras et le buste ensemble.",
    etapes: [
      "Coince une serviette sous les deux aisselles, en travers de la poitrine.",
      "Joue des demi-swings au fer 9 sans la laisser tomber.",
      "C'est la rotation du buste qui entraîne les bras, pas l'inverse.",
      "Joue 15 balles, puis 5 sans serviette en gardant la sensation." ] },

  { id: "fe_release", corr: true, d: "fers", t: "La poignée de main", type: "technique", niv: [2, 4], lieux: ["practice"], min: 10,
    but: "Refermer la face du club à l'impact, pour une balle qui ne s'échappe plus à {df}.",
    etapes: [
      "Joue des demi-swings au fer 8.",
      "À mi-traversée, club à hauteur de hanches, la pointe du club regarde le ciel.",
      "Sensation : la main du bas vient serrer la main de quelqu'un placé côté cible.",
      "Joue 15 balles en cherchant une légère courbe vers la {gf}." ] },

  { id: "fe_finition", d: "fers", t: "Finir face à la cible", type: "technique", niv: [2, 4], lieux: ["practice"], min: 10,
    but: "Continuer la rotation du corps jusqu'au bout, pour que les mains ne ferment pas la face toutes seules.",
    etapes: [
      "Joue un fer 7 à 70 % de ta vitesse.",
      "À la finition, la boucle de ceinture et la poitrine font face à la cible, le poids sur le pied avant.",
      "Tiens cette position 3 secondes après chaque balle.",
      "Joue 15 balles. Si la finition est déséquilibrée, ralentis." ] },

  { id: "fe_chaise", d: "fers", t: "Garder la posture", type: "technique", niv: [2, 4], lieux: ["practice", "maison"], min: 10,
    mat: "Une chaise ou ton sac de golf",
    but: "Empêcher le bassin d'avancer vers la balle pendant la descente.",
    etapes: [
      "Mets-toi en posture, les fessiers au contact du dossier d'une chaise ou de ton sac.",
      "Fais des swings lents sans balle : le contact se maintient à la montée et passe d'une fesse à l'autre à la descente.",
      "Si tu perds le contact avant l'impact, ton bassin avance : recommence plus lentement.",
      "Au practice, joue ensuite 10 balles à 60 % avec la même sensation." ] },

  { id: "fe_barriere", corr: true, d: "fers", t: "La barrière", type: "technique", niv: [1, 4], lieux: ["practice"], min: 10,
    mat: "Un couvre-club ou une boîte de balles vide",
    but: "Éloigner le contact du talon du club, pour en finir avec les sockets.",
    etapes: [
      "Pose le couvre-club 3 cm à l'extérieur de la pointe du club, parallèle à la ligne de jeu.",
      "Avant chaque coup, vérifie : poids au milieu des pieds, bras pendants, un poing d'écart entre les mains et les cuisses.",
      "Joue des demi-swings au fer 9 sans toucher l'obstacle.",
      "Si tu le touches, adresse la balle vers la pointe du club pendant 5 balles." ] },

  { id: "fe_centrage", d: "fers", t: "Le test du talc", type: "technique", niv: [1, 4], lieux: ["practice"], min: 10,
    mat: "Du talc, un spray pour les pieds ou un feutre effaçable",
    but: "Voir où tu touches la balle sur la face. Le centrage compte plus que la force.",
    etapes: [
      "Poudre ou marque la face du club.",
      "Joue 5 balles et observe les traces d'impact.",
      "Traces vers le talon : éloigne-toi de quelques centimètres et vérifie ton équilibre. Traces vers la pointe : rapproche-toi.",
      "Recommence par séries de 5 jusqu'à regrouper les impacts au centre." ] },

  { id: "fe_rotation", d: "fers", t: "La rotation, club sur les épaules", type: "technique", niv: [1, 4], lieux: ["maison", "practice"], min: 10,
    but: "Obtenir une vraie rotation des épaules, source de la puissance.",
    etapes: [
      "Pose un club en travers des épaules, bras croisés dessus, en posture de golf.",
      "Tourne jusqu'à ce que le bout du club pointe vers l'emplacement de la balle, ou au plus près.",
      "Le poids passe à l'intérieur du pied arrière, sans que le bassin glisse sur le côté.",
      "Tourne ensuite vers la cible jusqu'à la finition. Fais 2 séries de 10." ] },

  { id: "fe_pompe", d: "fers", t: "La pompe", type: "technique", niv: [3, 4], lieux: ["practice"], min: 10,
    but: "Garder l'angle des poignets plus longtemps à la descente, pour comprimer la balle.",
    etapes: [
      "Monte normalement, puis descends lentement jusqu'à ce que les mains arrivent à hauteur de hanches, poignets toujours armés.",
      "Remonte au sommet et refais cette demi-descente une deuxième fois.",
      "À la troisième, va jusqu'au bout et frappe la balle.",
      "Joue 10 balles ainsi au fer 7. La trajectoire doit être plus tendue." ] },

  { id: "fe_porte_int", corr: true, d: "fers", t: "La porte intérieure", type: "technique", niv: [3, 4], lieux: ["practice"], min: 10,
    mat: "Un couvre-club",
    but: "Corriger un chemin trop intérieur, à l'origine des hooks et des balles poussées.",
    etapes: [
      "Pose le couvre-club entre la balle et toi : 5 cm plus près de toi et légèrement en arrière.",
      "Joue des demi-swings sans le toucher : le club arrive davantage de face.",
      "Cherche une balle qui part droit ou légèrement à {gf} de la cible.",
      "Passe au swing complet quand 8 balles sur 10 évitent l'obstacle." ] },

  { id: "fe_distances", d: "fers", t: "Mon carnet de distances", type: "dosage", niv: [2, 4], lieux: ["practice"], min: 20,
    but: "Connaître la distance réelle de chaque club, pas celle de ton meilleur coup.",
    etapes: [
      "Pour chaque club, joue 5 balles vers une cible.",
      "Note la distance de vol de chaque balle, pas la distance après la roule.",
      "Saisis-les dans le carnet de l'appli : à partir de cinq balles, il écarte la plus longue et la plus courte avant de calculer ta moyenne.",
      "Regarde l'écart entre deux clubs voisins : il sert à chaque attaque de green." ],
    palier: { 2: "Commence par trois clubs : fer 9, fer 7 et hybride.", 3: "Étalonne tous tes fers, du pitching wedge au fer 5.", 4: "Étalonne tous tes clubs et note aussi la distance d'un coup à trois quarts." } },

  { id: "fe_aleatoire", d: "fers", t: "Cibles au hasard", type: "jeu", niv: [1, 4], lieux: ["practice"], min: 15,
    but: "S'entraîner comme on joue : jamais deux fois le même coup.",
    etapes: [
      "Change de club et de cible à chaque balle.",
      "Fais ta routine complète avant chaque coup, comme sur le parcours.",
      "Annonce la cible à voix basse, puis juge le résultat : réussi ou non.",
      "Joue 15 balles et note ton nombre de réussites." ],
    score: { lib: "Coups réussis sur 15", max: 15, sens: "haut", rep: [5, 7, 9, 11] } },

  { id: "fe_parcours", d: "fers", t: "Le parcours au practice", type: "jeu", niv: [2, 4], lieux: ["practice"], min: 20,
    but: "Rapprocher le practice des conditions de jeu.",
    etapes: [
      "Joue mentalement les 9 premiers trous de ton parcours.",
      "Pour chaque trou : la mise en jeu, puis le fer que la distance restante imposerait.",
      "Si la mise en jeu est ratée, joue un coup de recentrage avant d'attaquer le green.",
      "Ne joue jamais deux fois de suite le même club." ] },

  { id: "fe_neuf_traj", d: "fers", t: "Neuf trajectoires", type: "jeu", niv: [4, 4], lieux: ["practice"], min: 20,
    but: "Maîtriser la hauteur et la courbe pour s'adapter au vent et aux drapeaux.",
    etapes: [
      "Avec un fer 7, joue trois hauteurs : basse, normale, haute.",
      "Pour chaque hauteur, joue trois courbes : draw, balle droite, fade.",
      "Hauteur : recule la balle d'une largeur pour jouer bas, avance-la pour jouer haut. Courbe : aligne le corps du côté où la balle doit partir, et oriente la face entre cette ligne et la cible.",
      "Une balle par case. Note le nombre de trajectoires réussies sur 9." ],
    score: { lib: "Trajectoires réussies sur 9", max: 9, sens: "haut", rep: [3, 3, 4, 6] } },

  { id: "fe_test_contact", d: "fers", t: "Test de contact au fer 7", type: "test", niv: [1, 4], lieux: ["practice"], min: 10,
    but: "Mesurer la régularité de ton contact.",
    etapes: [
      "Choisis une cible et joue 10 balles au fer 7 avec ta routine.",
      "Compte les contacts propres : balle levée, trajectoire normale, distance habituelle.",
      "Ne compte ni les grattes, ni les tops, ni les balles très décentrées." ],
    score: { lib: "Contacts propres sur 10", max: 10, sens: "haut", rep: [4, 6, 7, 8], ind: "fers_contact" } },

  { id: "fe_dispersion", d: "fers", t: "Test de précision au fer 7", type: "test", niv: [3, 4], lieux: ["practice"], min: 10,
    but: "Mesurer ta dispersion sur une attaque de green.",
    etapes: [
      "Choisis une cible à ta distance de fer 7.",
      "Joue 10 balles avec ta routine.",
      "Compte celles qui finissent dans une largeur de green autour de la cible." ],
    palier: { 3: "Largeur de 20 m.", 4: "Largeur de 15 m." },
    score: { lib: "Balles dans la zone sur 10", max: 10, sens: "haut", rep: [3, 4, 5, 7] } },

  /* ---------------- WEDGING ---------------- */
  { id: "we_pitch_base", d: "wedge", t: "Le pitch de base", type: "technique", niv: [1, 2], lieux: ["practice", "zone"], min: 10,
    but: "Jouer un coup de 30 m simple et répétable.",
    etapes: [
      "Prends un stance étroit, la balle au centre, 60 % du poids sur le pied avant.",
      "Monte jusqu'à ce que les mains soient à hauteur de hanches.",
      "Traverse à la même hauteur en tournant la poitrine vers la cible.",
      "Joue 15 balles au sand wedge ou au pitching wedge vers une cible à 30 m." ] },

  { id: "we_poids_devant", d: "wedge", t: "Le wedge, poids devant", type: "technique", niv: [1, 4], lieux: ["practice", "zone"], min: 10,
    but: "Supprimer les grattes au wedge en gardant l'appui côté cible.",
    etapes: [
      "Pose le pied arrière sur la pointe, en retrait.",
      "Joue des pitchs de 30 à 40 m sans déplacer ton poids.",
      "La poitrine tourne vers la cible et les mains restent devant la tête de club.",
      "Joue 10 balles ainsi, puis 5 en stance normal." ] },

  { id: "we_tempo", d: "wedge", t: "Le même tempo", type: "technique", niv: [1, 3], lieux: ["practice", "zone"], min: 10,
    but: "Régler la distance par l'amplitude, jamais en freinant le club.",
    etapes: [
      "Compte « un » à la montée et « deux » à l'impact, à voix basse.",
      "Joue 5 balles avec une petite amplitude, 5 avec une moyenne et 5 avec une grande, sur le même compte.",
      "La traversée est au moins aussi longue que la montée.",
      "Observe les trois distances obtenues : seul le geste a changé, pas le rythme." ] },

  { id: "we_hauteurs", d: "wedge", t: "Trois hauteurs", type: "technique", niv: [3, 4], lieux: ["practice", "zone"], min: 15,
    but: "Choisir la trajectoire du wedge selon le drapeau et le vent.",
    etapes: [
      "Vise une cible à 40 m.",
      "Balle basse : balle en arrière du centre, mains devant, finition courte.",
      "Balle normale : balle au centre, finition à hauteur d'épaules.",
      "Balle haute : balle en avant du centre, face légèrement ouverte, finition haute.",
      "Joue 5 balles de chaque sorte, puis alterne." ] },

  { id: "we_horloge", d: "wedge", t: "L'horloge", type: "dosage", niv: [2, 4], lieux: ["practice", "zone"], min: 15,
    but: "Obtenir trois distances fiables avec un seul wedge.",
    etapes: [
      "Imagine un cadran d'horloge : ta tête à midi, la balle à 6 h.",
      "Joue 5 balles en arrêtant le bras avant à 7 h 30, 5 à 9 h et 5 à 10 h 30.",
      "Garde le même tempo pour les trois amplitudes, avec une traversée symétrique.",
      "Note la distance de vol moyenne de chaque amplitude." ] },

  { id: "we_point_chute", d: "wedge", t: "Le point de chute au wedge", type: "dosage", niv: [2, 4], lieux: ["practice", "zone"], min: 10,
    mat: "Une serviette ou un cerceau",
    but: "Viser un point de chute, pas le drapeau.",
    etapes: [
      "Pose une serviette à 20 m, puis à 30 m.",
      "Joue 10 balles en cherchant à faire tomber la balle dessus.",
      "Observe la roule après le rebond.",
      "Compte les balles tombées à moins d'un mètre du repère." ],
    score: { lib: "Balles à moins d'un mètre sur 10", max: 10, sens: "haut", rep: [1, 2, 4, 6] } },

  { id: "we_echelle", d: "wedge", t: "L'échelle des distances", type: "dosage", niv: [2, 4], lieux: ["practice", "zone"], min: 15,
    but: "Passer d'une distance à l'autre sans coup d'essai.",
    etapes: [
      "Choisis des cibles à 30, 40, 50, 60 et 70 m.",
      "Joue une balle à 30 m. Si elle finit dans la zone, passe à 40 m. Sinon, recommence.",
      "Monte jusqu'en haut de l'échelle, puis redescends.",
      "Compte le nombre de balles qu'il t'a fallu." ],
    palier: { 2: "Échelle à trois barreaux : 30, 40 et 50 m. Zone de 8 m autour de la cible.", 3: "Zone de 6 m autour de la cible.", 4: "Zone de 4 m autour de la cible." } },

  { id: "we_matrice", d: "wedge", t: "Ma matrice de wedges", type: "dosage", niv: [3, 4], lieux: ["practice"], min: 20,
    but: "Couvrir toutes les distances de 30 à 80 m sans improviser.",
    etapes: [
      "Prends deux ou trois wedges et les trois amplitudes de l'horloge.",
      "Joue 5 balles par combinaison et note la distance de vol moyenne.",
      "Tu obtiens 6 à 9 distances : saisis-les dans la matrice du carnet. Tu peux aussi les écrire sur une étiquette collée au manche.",
      "Le carnet montre les trous de plus de 12 m. Comble-les en descendant les mains de 2 cm sur le grip." ] },

  { id: "we_hasard", d: "wedge", t: "Distances au hasard", type: "jeu", niv: [3, 4], lieux: ["practice", "zone"], min: 15,
    but: "Reproduire la situation du parcours : une distance, une balle.",
    etapes: [
      "Choisis une distance au hasard entre 30 et 80 m, à l'aide des repères du practice.",
      "Fais ta routine et joue une seule balle.",
      "Compte 1 point si la balle finit dans la zone autour de la cible.",
      "Joue 10 balles en changeant de distance à chaque fois." ],
    palier: { 3: "Zone de 6 m autour de la cible.", 4: "Zone de 4 m autour de la cible." },
    score: { lib: "Balles dans la zone sur 10", max: 10, sens: "haut", rep: [2, 3, 5, 7] } },

  { id: "we_test50", d: "wedge", t: "Test des 50 m", type: "test", niv: [1, 4], lieux: ["practice", "zone"], min: 10,
    but: "Mesurer ta précision sur une distance intermédiaire.",
    etapes: [
      "Choisis une cible à 50 m environ et imagine un green de 15 m de diamètre autour.",
      "Joue 10 balles avec ta routine.",
      "Compte celles qui tombent et restent dans cette zone." ],
    palier: { 1: "Si 50 m est trop long pour toi, fais le test à 30 m." },
    score: { lib: "Balles sur le green sur 10", max: 10, sens: "haut", rep: [2, 4, 6, 8], ind: "wedge_green" } }
];

if (typeof module !== "undefined") { module.exports = { EXERCICES_1 }; }
