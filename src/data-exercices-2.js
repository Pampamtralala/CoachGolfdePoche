/* ============================================================
   BASE D'EXERCICES — partie 2 : approches, bunker, putting, stratégie, physique
   ============================================================ */

const EXERCICES_2 = [

  /* ---------------- APPROCHES ---------------- */
  { id: "ap_roulee", d: "approche", t: "L'approche roulée", type: "technique", niv: [1, 2], lieux: ["zone", "maison"], min: 10,
    but: "Maîtriser le coup le plus sûr autour du green.",
    etapes: [
      "Prends un fer 8 ou 9, les pieds rapprochés, la balle au centre.",
      "Mets 70 % du poids sur le pied avant et les mains légèrement devant la balle.",
      "Fais un geste de putting : les épaules balancent, les poignets restent fermes.",
      "La balle vole peu et roule beaucoup. Joue 15 balles vers un trou à 10 m." ] },

  { id: "ap_manche", d: "approche", t: "Le manche prolongé", type: "technique", niv: [1, 3], lieux: ["zone", "maison"], min: 10,
    mat: "Une baguette d'alignement ou un second club",
    but: "Empêcher les poignets de vouloir lever la balle.",
    etapes: [
      "Tiens une baguette contre le grip, dans le prolongement du manche. Elle dépasse le long de ta hanche avant.",
      "Joue des approches courtes.",
      "Si les poignets cassent à l'impact, la baguette vient toucher ton flanc.",
      "Joue 15 balles sans aucun contact, puis 5 sans la baguette." ] },

  { id: "ap_pied_retrait", d: "approche", t: "L'approche, pied arrière en retrait", type: "technique", niv: [1, 4], lieux: ["zone", "maison"], min: 10,
    but: "Garder le poids devant pour un contact net.",
    etapes: [
      "Recule le pied arrière et pose-le sur la pointe.",
      "Tout le poids repose sur le pied avant et y reste.",
      "Joue des approches roulées : la balle d'abord, le sol ensuite.",
      "Joue 10 balles ainsi, puis 5 en stance normal avec le même appui." ] },

  { id: "ap_amplitude", d: "approche", t: "La traversée égale à la montée", type: "technique", niv: [1, 3], lieux: ["zone", "maison"], min: 10,
    mat: "Deux tees",
    but: "Ne plus freiner le club à l'impact.",
    etapes: [
      "Pose un tee au sol à hauteur de ta montée, et un autre à la même distance côté cible.",
      "La tête du club va jusqu'au premier tee, puis au moins jusqu'au second.",
      "Pour jouer plus court, raccourcis la montée. Ne ralentis jamais.",
      "Joue 15 balles à trois distances différentes." ] },

  { id: "ap_lies", d: "approche", t: "Les lies variés", type: "technique", niv: [3, 4], lieux: ["zone"], min: 15,
    but: "Adapter le coup à la position de la balle.",
    etapes: [
      "Herbe rase : approche roulée, poids devant.",
      "Rough : face légèrement ouverte et geste plus ferme. La balle roulera davantage.",
      "Balle en montée : épaules parallèles à la pente, un club moins ouvert.",
      "Balle en descente : poids côté bas, balle en arrière. Attends une balle basse qui roule.",
      "Joue 3 balles par situation." ] },

  { id: "ap_leve", d: "approche", t: "Le coup levé", type: "technique", niv: [3, 4], lieux: ["zone"], min: 15,
    but: "Passer un obstacle et arrêter la balle rapidement.",
    etapes: [
      "Ouvre la face du sand wedge avant de prendre ton grip.",
      "Place la balle en avant du centre, le poids légèrement devant, les mains au niveau de la balle.",
      "Laisse le club glisser sous la balle en accélérant jusqu'à une finition haute.",
      "Pose ton sac à 3 m devant toi et fais passer 10 balles par-dessus." ] },

  { id: "ap_main_seule", d: "approche", t: "Une seule main", type: "technique", niv: [3, 4], lieux: ["zone", "maison"], min: 10,
    but: "Sentir le poids de la tête de club et le rebond de la semelle.",
    etapes: [
      "Joue des approches courtes avec la main du bas seule.",
      "Laisse la tête du club tomber et glisser, sans la guider.",
      "Joue 10 balles, puis 10 avec les deux mains en gardant la même légèreté." ] },

  { id: "ap_echelle_clubs", d: "approche", t: "L'échelle des clubs", type: "dosage", niv: [1, 3], lieux: ["zone"], min: 15,
    but: "Savoir combien chaque club vole et roule avec le même geste.",
    etapes: [
      "Garde le même petit geste et joue 5 balles au fer 8, 5 au pitching wedge et 5 au sand wedge.",
      "Vise le même point de chute, un mètre à l'intérieur du green.",
      "Observe la roule : longue au fer 8, moyenne au pitching wedge, courte au sand wedge.",
      "Sur le parcours, choisis le club dont la roule correspond à la distance jusqu'au trou." ] },

  { id: "ap_serviette", d: "approche", t: "La serviette", type: "dosage", niv: [1, 4], lieux: ["zone", "maison"], min: 10,
    mat: "Une serviette",
    but: "Choisir un point de chute et y faire tomber la balle.",
    etapes: [
      "Pose une serviette là où la balle doit tomber pour rouler ensuite jusqu'au trou.",
      "Joue 10 balles en regardant la serviette, pas le trou.",
      "Compte les balles qui tombent dessus.",
      "Déplace la serviette et change de club pour la série suivante." ],
    palier: { 1: "Serviette dépliée, à 3 m de toi.", 2: "Serviette dépliée, à 5 m.", 3: "Serviette pliée en deux.", 4: "Serviette pliée en quatre, à une distance différente à chaque série." },
    score: { lib: "Balles sur la serviette sur 10", max: 10, sens: "haut", rep: [3, 4, 5, 6] } },

  { id: "ap_trois_zones", d: "approche", t: "Trois trous, un club", type: "dosage", niv: [2, 4], lieux: ["zone"], min: 15,
    but: "Doser à l'œil, sans balle d'essai.",
    etapes: [
      "Repère un trou court, un moyen et un long depuis la même position.",
      "Avec le même club, joue une balle vers chacun, à tour de rôle.",
      "Ne joue jamais deux fois de suite vers le même trou.",
      "Joue 12 balles et compte celles qui finissent à moins de 2 m." ],
    score: { lib: "Balles à moins de 2 m sur 12", max: 12, sens: "haut", rep: [2, 3, 5, 7] } },

  { id: "ap_putter_bord", d: "approche", t: "Le putter depuis le bord", type: "jeu", niv: [1, 2], lieux: ["zone", "putting"], min: 10,
    but: "Vérifier que le putter est souvent le meilleur choix en dehors du green.",
    etapes: [
      "Pose 5 balles sur le tablier ou sur une herbe rase, à 2 m du green.",
      "Joue-les au putter et retiens la distance moyenne au trou.",
      "Rejoue 5 balles du même endroit au wedge et compare.",
      "Règle à retenir : putter si possible, rouler sinon, lever en dernier recours." ] },

  { id: "ap_21", d: "approche", t: "Le 21", type: "jeu", niv: [1, 4], lieux: ["zone"], min: 15,
    but: "Mettre de l'enjeu dans le petit jeu, à deux ou contre toi-même.",
    etapes: [
      "À deux : chacun joue une approche vers le même trou.",
      "La balle la plus proche marque 1 point, une balle rentrée 3 points.",
      "Le perdant choisit la position suivante. Le premier à 21 gagne.",
      "Seul : joue deux balles par position. La seconde doit battre la première." ] },

  { id: "ap_approche_putt", d: "approche", t: "Approche et putt", type: "jeu", niv: [2, 4], lieux: ["zone"], min: 15,
    mat: "Ton putter",
    but: "Rentrer la balle en deux coups, comme sur le parcours.",
    etapes: [
      "Choisis 9 positions différentes autour du green.",
      "Joue une seule balle par position, puis putte jusqu'au fond du trou.",
      "Compte 1 point chaque fois que tu rentres en deux coups ou moins.",
      "Note ton total sur 9." ],
    score: { lib: "Réussites en deux coups sur 9", max: 9, sens: "haut", rep: [1, 2, 3, 5] } },

  { id: "ap_par18", d: "approche", t: "Le par 18", type: "jeu", niv: [3, 4], lieux: ["zone"], min: 20,
    mat: "Ton putter",
    but: "Mesurer ton petit jeu avec un score.",
    etapes: [
      "Choisis 9 positions : 3 faciles, 3 moyennes et 3 difficiles.",
      "Chaque trou est un par 2 : une approche, un putt.",
      "Joue une balle par trou et additionne tes coups.",
      "Rejoue le même tracé d'une séance à l'autre pour comparer." ],
    score: { lib: "Total des coups sur 9 trous", max: 45, sens: "bas", rep: [30, 27, 24, 21] } },

  { id: "ap_seau", d: "approche", t: "Le seau", type: "jeu", niv: [1, 3], lieux: ["maison"], min: 10,
    mat: "Un seau ou une bassine. À l'intérieur, des balles en mousse",
    but: "Travailler le point de chute sans aller au golf.",
    etapes: [
      "Pose un seau à 3 m, puis à 5 m.",
      "Joue 20 approches en cherchant à faire tomber la balle dedans.",
      "Compte les balles rentrées." ],
    score: { lib: "Balles dans le seau sur 20", max: 20, sens: "haut", rep: [2, 3, 5, 7] } },

  { id: "ap_test10", d: "approche", t: "Test des 10 approches", type: "test", niv: [1, 4], lieux: ["zone"], min: 10,
    but: "Mesurer ta précision autour du green.",
    etapes: [
      "Pose 10 balles en bord de green, à 10 ou 15 m du trou, sur un lie correct.",
      "Joue-les une par une, avec le club de ton choix.",
      "Compte celles qui finissent à moins de 3 m du trou." ],
    palier: { 4: "Change de position à chaque balle." },
    score: { lib: "Balles à moins de 3 m sur 10", max: 10, sens: "haut", rep: [2, 4, 5, 7], ind: "app_proche" } },

  /* ---------------- BUNKER ---------------- */
  { id: "bu_base", d: "bunker", t: "La sortie de base", type: "technique", niv: [1, 2], lieux: ["sable"], min: 15,
    but: "Sortir du bunker du premier coup, à tous les coups.",
    etapes: [
      "Ouvre la face du sand wedge, puis prends ton grip.",
      "Ancre les pieds dans le sable, la balle en face du talon avant, 60 % du poids devant.",
      "Vise un point dans le sable, 5 cm derrière la balle. C'est le sable qui sort la balle.",
      "Swingue franchement et finis le geste, la poitrine vers la cible.",
      "Joue 15 balles sans te soucier de la distance." ] },

  { id: "bu_ligne", d: "bunker", t: "La ligne dans le sable", type: "technique", niv: [1, 4], lieux: ["sable"], min: 10,
    but: "Faire entrer le club dans le sable toujours au même endroit.",
    etapes: [
      "Trace une longue ligne dans le sable, perpendiculaire à la ligne de jeu.",
      "Place-toi avec la ligne en face du talon avant.",
      "Sans balle, avance le long de la ligne en faisant des swings. Le club entre sur la ligne et projette le sable devant.",
      "Pose ensuite des balles 5 cm devant la ligne, côté cible, et refais le même geste." ] },

  { id: "bu_finition", d: "bunker", t: "Finir haut", type: "technique", niv: [1, 3], lieux: ["sable"], min: 10,
    but: "Ne plus ralentir dans le sable.",
    etapes: [
      "Joue 10 sorties en allant jusqu'à une finition complète.",
      "Tiens la finition 3 secondes : boucle de ceinture vers la cible, club derrière l'épaule.",
      "Repère : fais le geste d'un coup trois fois plus long sur herbe.",
      "Compte les balles sorties du bunker." ] },

  { id: "bu_billet", d: "bunker", t: "Le rectangle de sable", type: "technique", niv: [2, 4], lieux: ["sable"], min: 10,
    but: "Sortir une tranche de sable régulière, avec la balle au milieu.",
    etapes: [
      "Dessine autour de la balle un rectangle de la taille d'un billet de banque.",
      "Joue en cherchant à envoyer tout le rectangle sur le green.",
      "Le club entre au début du rectangle et ressort à la fin, à faible profondeur.",
      "Joue 10 balles et observe la forme des traces." ] },

  { id: "bu_lies", d: "bunker", t: "Les lies difficiles", type: "technique", niv: [3, 4], lieux: ["sable"], min: 15,
    but: "Savoir quoi faire quand la balle est mal placée.",
    etapes: [
      "Balle enfoncée : face carrée ou fermée, poids nettement devant, attaque verticale. La balle sort basse et roule.",
      "Balle en montée : épaules parallèles à la pente, swingue le long de la pente. La balle monte et s'arrête vite.",
      "Balle en descente : poids côté bas, le club suit la pente. Prévois de la roule.",
      "Joue 4 balles par situation." ] },

  { id: "bu_distances", d: "bunker", t: "Court, moyen, long", type: "dosage", niv: [3, 4], lieux: ["sable"], min: 15,
    but: "Régler la distance d'une sortie de bunker.",
    etapes: [
      "Choisis trois cibles : 8 m, 15 m et 25 m.",
      "Court : face très ouverte et montée plus courte.",
      "Long : face moins ouverte et traversée plus longue. Au-delà de 20 m, essaie un wedge moins ouvert.",
      "Garde toujours le même point d'entrée dans le sable. Joue 4 balles par cible, puis alterne." ] },

  { id: "bu_test10", d: "bunker", t: "Test des 10 sorties", type: "test", niv: [1, 4], lieux: ["sable"], min: 10,
    but: "Mesurer la fiabilité de tes sorties de bunker.",
    etapes: [
      "Pose 10 balles sur un sable correct, à 10 ou 15 m du drapeau.",
      "Joue-les une par une avec ta routine.",
      "Compte celles qui finissent sur le green." ],
    score: { lib: "Balles sur le green sur 10", max: 10, sens: "haut", rep: [2, 4, 6, 8], ind: "bunker_sortie" } },

  /* ---------------- PUTTING COURT ---------------- */
  { id: "pc_balancier", d: "putt_court", t: "Le balancier", type: "technique", niv: [1, 2], lieux: ["putting", "maison"], min: 10,
    mat: "Une baguette d'alignement ou un club",
    but: "Putter avec les épaules, les poignets fermes.",
    etapes: [
      "Place les yeux au-dessus de la balle ou légèrement à l'intérieur, les bras relâchés.",
      "Coince une baguette sous les deux aisselles, en travers de la poitrine.",
      "Les épaules balancent comme un pendule. Le triangle formé par les bras et les épaules ne se déforme pas.",
      "Joue 20 putts d'un mètre sans regarder le résultat avant la fin du geste." ] },

  { id: "pc_porte", d: "putt_court", t: "La porte de tees", type: "technique", niv: [1, 4], lieux: ["putting", "maison"], min: 10,
    mat: "Deux tees. Sur tapis, deux pièces",
    but: "Faire partir la balle sur la ligne choisie.",
    etapes: [
      "Sur un putt droit d'1,5 m, plante deux tees à 30 cm devant la balle.",
      "Écarte-les d'une largeur de balle et demie.",
      "Joue 20 putts : la balle doit passer la porte sans toucher.",
      "Resserre la porte quand tu en passes 16 sur 20." ],
    palier: { 1: "Porte large de deux balles.", 4: "Porte à peine plus large que la balle, sur un putt de 2,5 m." },
    score: { lib: "Putts passés dans la porte sur 20", max: 20, sens: "haut", rep: [10, 13, 15, 17] } },

  { id: "pc_ecoute", d: "putt_court", t: "Écouter la balle tomber", type: "technique", niv: [1, 4], lieux: ["putting", "maison"], min: 10,
    but: "Garder la tête et le corps immobiles pendant le putt.",
    etapes: [
      "Sur des putts d'1 m à 1,5 m, fixe l'arrière de la balle.",
      "Après l'impact, garde les yeux sur l'endroit où elle se trouvait.",
      "Attends d'entendre la balle tomber avant de relever la tête.",
      "Joue 20 putts ainsi." ] },

  { id: "pc_fond", d: "putt_court", t: "Au fond du trou", type: "technique", niv: [1, 3], lieux: ["putting"], min: 10,
    mat: "Un tee",
    but: "Donner assez de vitesse aux putts courts pour qu'ils tiennent la ligne.",
    etapes: [
      "Plante un tee 40 cm derrière le trou.",
      "Sur des putts d'1 à 2 m, la balle doit rentrer ou finir entre le trou et le tee.",
      "Une balle courte ne compte pas, même sur la ligne.",
      "Joue 20 putts et compte les réussites." ] },

  { id: "pc_regle", d: "putt_court", t: "La règle", type: "technique", niv: [2, 4], lieux: ["putting", "maison"], min: 10,
    mat: "Une règle plate d'un mètre",
    but: "Contrôler l'orientation de la face à l'impact.",
    etapes: [
      "Pose la règle au sol, pointée vers le trou, et la balle sur son extrémité.",
      "Putte : la balle doit rouler sur toute la longueur de la règle sans tomber.",
      "Elle tombe à {gf} : la face est fermée. Elle tombe à {df} : la face est ouverte.",
      "Réussis 10 putts de suite." ] },

  { id: "pc_ligne_balle", d: "putt_court", t: "La ligne sur la balle", type: "technique", niv: [2, 4], lieux: ["putting", "maison"], min: 10,
    mat: "Un feutre",
    but: "Vérifier ton alignement et la qualité de ton roulement.",
    etapes: [
      "Trace une ligne autour de la balle.",
      "Aligne-la sur ta ligne de putt, puis place la face du putter perpendiculairement.",
      "Putte. Si la ligne reste nette et droite pendant que la balle roule, le contact est centré et la face bien orientée.",
      "Si elle vacille, vérifie ta prise et le centrage. Joue 20 putts." ] },

  { id: "pc_une_main", d: "putt_court", t: "Le putt à une main", type: "technique", niv: [3, 4], lieux: ["putting", "maison"], min: 10,
    but: "Trouver la main qui stabilise ta face de putter.",
    etapes: [
      "Joue 10 putts d'un mètre avec la main du haut seule.",
      "Joue 10 putts avec la main du bas seule.",
      "Repère celle qui garde la face la plus stable.",
      "Reprends à deux mains en laissant cette main conduire le geste." ] },

  { id: "pc_routine", d: "putt_court", t: "Ma routine de putting", type: "routine", niv: [1, 4], lieux: ["putting", "maison"], min: 10,
    but: "Répéter les mêmes gestes avant chaque putt, pour décider puis jouer sans hésiter.",
    etapes: [
      "Lis la pente depuis l'arrière de la balle et choisis ta ligne.",
      "Fais un ou deux coups d'essai en regardant le trou, pour sentir la distance.",
      "Aligne la face, puis les pieds.",
      "Un dernier regard vers le trou, puis joue dans les deux secondes.",
      "Applique cette routine sur 10 putts de distances différentes." ] },

  { id: "pc_tapis", d: "putt_court", t: "Trente putts à la maison", type: "routine", niv: [1, 4], lieux: ["maison"], min: 10,
    mat: "Un tapis de putting ou une moquette rase, et un verre couché",
    but: "Entretenir le geste entre deux sorties au golf.",
    etapes: [
      "Vise un verre couché ou une pièce à 1,5 m.",
      "Joue 3 séries de 10 putts avec ta routine.",
      "Note ta meilleure série sur 10.",
      "Cinq minutes par jour valent mieux qu'une heure par mois." ],
    score: { lib: "Meilleure série sur 10", max: 10, sens: "haut", rep: [5, 6, 7, 8] } },

  { id: "pc_cadran", d: "putt_court", t: "Le tour du cadran", type: "jeu", niv: [2, 4], lieux: ["putting"], min: 15,
    but: "Rentrer les putts courts sous pression.",
    etapes: [
      "Pose les balles en cercle autour d'un trou.",
      "Rentre-les toutes à la suite. Un raté : tu recommences à zéro.",
      "Après 3 tentatives, note ta meilleure série.",
      "Cercle réussi : recule de 50 cm." ],
    palier: { 2: "6 balles à 1 m du trou.", 3: "8 balles à 1 m du trou.", 4: "8 balles à 1,5 m du trou." },
    score: { lib: "Meilleure série de putts rentrés", max: 8, sens: "haut", rep: [4, 5, 6, 7] } },

  { id: "pc_serie", d: "putt_court", t: "La série sous pression", type: "jeu", niv: [3, 4], lieux: ["putting"], min: 15,
    but: "Tenir ta routine quand le putt compte.",
    etapes: [
      "Rentre 3 putts de suite à 1 m, puis 3 à 1,5 m, puis 3 à 2 m.",
      "Un raté te renvoie au début de la série.",
      "Tu as 3 tentatives. Note le plus grand nombre de putts rentrés à la suite." ],
    score: { lib: "Putts rentrés à la suite, sur 9", max: 9, sens: "haut", rep: [3, 4, 6, 8] } },

  { id: "pc_test10", d: "putt_court", t: "Test des putts d'1,5 m", type: "test", niv: [1, 4], lieux: ["putting", "maison"], min: 10,
    but: "Mesurer ta réussite sur les putts qui sauvent un score.",
    etapes: [
      "Choisis un trou sur une pente légère.",
      "Joue 10 putts d'1,5 m, en changeant de position autour du trou à chaque fois.",
      "Fais ta routine avant chaque putt et compte les balles rentrées." ],
    score: { lib: "Putts rentrés sur 10", max: 10, sens: "haut", rep: [4, 5, 6, 7], ind: "putt_court" } },

  { id: "pc_zone24", d: "putt_court", t: "La zone des 2 à 4 m", type: "test", niv: [3, 4], lieux: ["putting"], min: 15,
    but: "Rentrer davantage de putts pour le par ou le birdie.",
    etapes: [
      "Joue 5 putts à 2 m, 5 à 3 m et 5 à 4 m, depuis des positions différentes.",
      "Fais ta routine complète avant chaque putt.",
      "Compte les balles rentrées sur 15." ],
    score: { lib: "Putts rentrés sur 15", max: 15, sens: "haut", rep: [2, 2, 3, 5] } },

  /* ---------------- PUTTING LONG : DOSAGE ET LECTURE ---------------- */
  { id: "pl_tempo", d: "putt_long", t: "Le tempo constant", type: "technique", niv: [1, 4], lieux: ["putting", "maison"], min: 10,
    but: "Régler la distance par l'amplitude, avec un rythme toujours identique.",
    etapes: [
      "Compte « un » à la montée et « deux » à l'impact.",
      "Joue des putts de 3, 6 et 9 m sur ce même compte. Seule l'amplitude grandit.",
      "La traversée est aussi longue que la montée.",
      "Si le putter frappe sèchement la balle, ralentis le compte." ] },

  { id: "pl_annonce", d: "putt_long", t: "Annoncer la pente", type: "technique", niv: [1, 3], lieux: ["putting"], min: 10,
    but: "Prendre l'habitude de lire le green avant de jouer.",
    etapes: [
      "Lis chaque putt depuis l'arrière de la balle, puis depuis le côté bas de la pente.",
      "Annonce où tu vises, par exemple : « une balle à gauche du trou ».",
      "Après le putt, note si tu as joué assez de pente ou pas assez.",
      "Dans le doute, ajoute de la pente." ] },

  { id: "pl_cadran_pente", d: "putt_long", t: "Le cadran en pente", type: "technique", niv: [2, 4], lieux: ["putting"], min: 15,
    but: "Lire la pente sous tous les angles autour d'un même trou.",
    etapes: [
      "Choisis un trou sur une pente nette et pose 4 balles à 2 m : au-dessus, en dessous, à gauche et à droite.",
      "Avant chaque putt, annonce de combien la balle va tourner.",
      "Joue, puis compare avec ce qui s'est passé.",
      "Fais deux tours et note si tu lis trop de pente ou pas assez." ] },

  { id: "pl_point_haut", d: "putt_long", t: "La porte au point haut", type: "technique", niv: [3, 4], lieux: ["putting"], min: 15,
    mat: "Deux tees",
    but: "Jouer assez de pente sur les putts qui tournent.",
    etapes: [
      "Sur un putt en pente de 3 à 4 m, repère le point le plus haut de la courbe.",
      "Plante deux tees à cet endroit pour former une porte.",
      "Joue la balle à travers la porte, à une vitesse qui la ferait mourir 30 cm derrière le trou.",
      "Si la balle passe la porte et rate sous le trou, déplace la porte plus haut." ] },

  { id: "pl_echelle", d: "putt_long", t: "L'échelle", type: "dosage", niv: [1, 4], lieux: ["putting"], min: 10,
    mat: "Trois tees",
    but: "Calibrer trois distances de référence.",
    etapes: [
      "Plante trois tees à trois distances d'un même trou.",
      "Joue 3 balles depuis chaque tee, en commençant par le plus proche.",
      "Chaque balle doit finir à moins d'une longueur de putter du trou.",
      "Compte les balles dans la zone sur 9." ],
    palier: { 1: "Tees à 3, 5 et 7 m.", 2: "Tees à 3, 6 et 9 m.", 3: "Tees à 5, 10 et 15 m.", 4: "Tees à 6, 12 et 18 m, sur un green en pente." },
    score: { lib: "Balles dans la zone sur 9", max: 9, sens: "haut", rep: [3, 4, 5, 7] } },

  { id: "pl_frange", d: "putt_long", t: "Jusqu'au bord", type: "dosage", niv: [1, 4], lieux: ["putting"], min: 10,
    but: "Doser sans la tentation du trou.",
    etapes: [
      "Place-toi à une dizaine de mètres du bord du green.",
      "Putte une première balle à mi-chemin.",
      "Chaque balle suivante doit aller plus loin que la précédente, sans sortir du green.",
      "Compte combien de balles tu arrives à placer ainsi." ] },

  { id: "pl_regard", d: "putt_long", t: "Les yeux sur le trou", type: "dosage", niv: [1, 4], lieux: ["putting"], min: 10,
    but: "Laisser le regard régler la distance, comme pour lancer une balle.",
    etapes: [
      "Mets-toi à l'adresse sur un putt de 8 m.",
      "Tourne la tête vers le trou et putte sans regarder la balle.",
      "Joue 10 putts ainsi, à des distances variées.",
      "Reviens à ta façon habituelle, en regardant le trou pendant tes coups d'essai." ] },

  { id: "pl_yeux_fermes", d: "putt_long", t: "Les yeux fermés", type: "dosage", niv: [3, 4], lieux: ["putting"], min: 10,
    but: "Affiner ta perception de la distance.",
    etapes: [
      "Prépare normalement un putt de 6 à 10 m.",
      "Ferme les yeux juste avant de jouer.",
      "Avant de les rouvrir, annonce : court, bon ou long.",
      "Joue 10 putts et compte tes annonces justes." ],
    score: { lib: "Annonces justes sur 10", max: 10, sens: "haut", rep: [4, 5, 6, 8] } },

  { id: "pl_tapis_dosage", d: "putt_long", t: "Le dosage sur tapis", type: "dosage", niv: [1, 4], lieux: ["maison"], min: 10,
    mat: "Un tapis ou une moquette rase, trois pièces",
    but: "Entretenir ton toucher à la maison.",
    etapes: [
      "Pose trois repères à 1, 2 et 3 m.",
      "Fais mourir une balle sur chaque repère, dans l'ordre puis dans le désordre.",
      "Joue 12 balles et compte celles qui s'arrêtent à moins de 20 cm du repère." ],
    score: { lib: "Balles à moins de 20 cm sur 12", max: 12, sens: "haut", rep: [4, 5, 7, 8] } },

  { id: "pl_avant_partie", d: "putt_long", t: "Dix minutes avant le départ", type: "routine", niv: [1, 4], lieux: ["putting"], min: 10,
    but: "Prendre la vitesse des greens du jour.",
    etapes: [
      "Joue 5 putts longs en montée, puis 5 en descente, sans viser de trou précis.",
      "Joue 5 putts de 8 m vers un trou. Tous doivent finir à moins d'une longueur de putter.",
      "Termine par 5 putts d'un mètre rentrés.",
      "Ne corrige pas ton geste : tu règles seulement la vitesse." ] },

  { id: "pl_neuf_trous", d: "putt_long", t: "Neuf trous, une balle", type: "jeu", niv: [1, 4], lieux: ["putting"], min: 15,
    but: "Putter comme sur le parcours : un premier putt, puis on termine.",
    etapes: [
      "Trace un parcours de 9 trous sur le putting green, avec des distances de 4 à 15 m.",
      "Joue une seule balle et rentre-la à chaque trou.",
      "Additionne tes putts. Le par est de 18.",
      "Note aussi ton nombre de 3-putts." ],
    score: { lib: "Total de putts sur 9 trous", max: 40, sens: "bas", rep: [22, 20, 19, 17] } },

  { id: "pl_test_zone", d: "putt_long", t: "Test de la zone de sécurité", type: "test", niv: [1, 4], lieux: ["putting"], min: 10,
    but: "Mesurer ton dosage sur les premiers putts.",
    etapes: [
      "Joue 10 putts longs, en changeant de trou ou de position à chaque fois.",
      "Joue une seule balle par putt, avec ta routine.",
      "Compte les balles qui finissent dans la zone autour du trou." ],
    palier: { 1: "Putts de 6 à 8 m. Zone d'un mètre et demi autour du trou.", 2: "Putts de 8 à 10 m. Zone d'une longueur de putter.", 3: "Putts de 8 à 12 m. Zone d'une longueur de putter.", 4: "Putts de 10 à 15 m. Zone d'une longueur de putter." },
    score: { lib: "Balles dans la zone sur 10", max: 10, sens: "haut", rep: [4, 5, 6, 8] } },

  /* ---------------- STRATÉGIE ET MENTAL ---------------- */
  { id: "st_routine", d: "strategie", t: "Ma routine en trois temps", type: "routine", niv: [1, 4], lieux: ["practice", "parcours"], min: 10,
    but: "Jouer chaque coup de la même façon, à l'entraînement comme en partie.",
    etapes: [
      "Décider : derrière la balle, choisis la cible, le club et la trajectoire.",
      "Répéter : fais un coup d'essai qui ressemble au coup voulu.",
      "Jouer : installe-toi, jette un regard vers la cible, puis déclenche sans attendre.",
      "Applique ces trois temps sur 10 balles au practice, puis sur chaque coup de ta prochaine partie." ] },

  { id: "st_respiration", d: "strategie", t: "Respirer avant de jouer", type: "routine", niv: [1, 4], lieux: ["practice", "parcours", "maison"], min: 10,
    but: "Faire baisser la tension avant un coup important.",
    etapes: [
      "Inspire par le nez sur 4 temps, puis expire par la bouche sur 6 temps.",
      "Fais deux cycles derrière la balle, avant ta routine.",
      "Relâche les épaules et la pression du grip.",
      "Entraîne-toi sur 10 balles au practice, pour que ce soit automatique au départ du 1." ] },

  { id: "st_carte", d: "strategie", t: "Préparer ma carte", type: "routine", niv: [2, 4], lieux: ["maison"], min: 15,
    mat: "La carte de ton parcours",
    but: "Décider à froid de la stratégie de chaque trou.",
    etapes: [
      "Pour chaque trou, note le club de départ, le danger à éviter et le côté où tu peux rater.",
      "Repère les trois trous qui te coûtent le plus cher. Si tu saisis tes parties, la fiche du parcours les désigne dans le carnet : ce sont tes trous noirs.",
      "Choisis pour ces trois trous une option prudente et tiens-t'y.",
      "Relis ta carte au départ de chaque trou." ] },

  { id: "st_bilan", d: "strategie", t: "Le bilan en cinq chiffres", type: "routine", niv: [1, 4], lieux: ["maison", "parcours"], min: 10,
    but: "Savoir où partent tes coups, pour ajuster ton profil.",
    etapes: [
      "Pendant ta partie, saisis chaque trou dans le carnet : mise en jeu, green, putts, pénalités et score. À chaud, les chiffres sont plus justes que de mémoire.",
      "À la fin, l'appli met à jour ton bilan et estime où tu gagnes et où tu perds des coups.",
      "Compare avec ce que tu avais déclaré : l'écart montre où ton impression te trompe." ] },

  { id: "st_echauffement", d: "strategie", t: "L'échauffement d'avant-partie", type: "routine", niv: [1, 4], lieux: ["parcours"], min: 20,
    but: "Arriver au départ du 1 prêt à jouer.",
    etapes: [
      "Deux minutes de mobilité : rotations du buste, des épaules et des hanches.",
      "Dix balles au wedge, dix au fer 7, cinq au club de départ, sans corriger ton swing.",
      "Cinq approches, puis dix minutes de putting pour prendre la vitesse des greens.",
      "Termine par le coup que tu joueras au départ du 1." ] },

  { id: "st_par_perso", d: "strategie", t: "Mon par personnel", type: "jeu", niv: [1, 2], lieux: ["parcours"], min: 0,
    but: "Jouer contre un objectif réaliste, trou après trou.",
    etapes: [
      "Avant de partir, ajoute un coup au par de chaque trou, et deux sur les trous les plus difficiles.",
      "Construis chaque trou pour atteindre ce par, sans coup héroïque.",
      "Compte les trous où tu fais ton par personnel ou mieux." ],
    score: { lib: "Trous joués dans ton par personnel, sur 18", max: 18, sens: "haut", rep: [7, 9, 10, 12] } },

  { id: "st_club_plus", d: "strategie", t: "Un club de plus", type: "jeu", niv: [1, 3], lieux: ["parcours"], min: 0,
    but: "Arrêter de rester court du green.",
    etapes: [
      "Sur chaque attaque de green, prends un club de plus que ton premier réflexe.",
      "Swingue à ton rythme habituel, sans forcer.",
      "Note pour chaque trou : court, à hauteur ou long.",
      "Si tu restes encore plus souvent court que long, revois ton carnet de distances." ] },

  { id: "st_centre_green", d: "strategie", t: "Le centre du green", type: "jeu", niv: [1, 4], lieux: ["parcours"], min: 0,
    but: "Toucher plus de greens en oubliant les drapeaux.",
    etapes: [
      "Sur chaque attaque, vise le centre du green, quelle que soit la position du drapeau.",
      "Choisis ton club pour la distance du centre, pas pour celle du drapeau.",
      "Après la partie, compte tes greens en régulation. Sur 9 trous, double le chiffre." ],
    score: { lib: "Greens en régulation sur 18", max: 18, sens: "haut", rep: [1, 3, 5, 9], ind: "fers_gir" } },

  { id: "st_remise", d: "strategie", t: "La remise en jeu", type: "jeu", niv: [1, 4], lieux: ["parcours"], min: 0,
    but: "Transformer un mauvais coup en bogey, pas en catastrophe.",
    etapes: [
      "Après chaque coup raté, joue le coup le plus simple possible vers le fairway.",
      "Ne tente aucun coup que tu ne réussis pas 7 fois sur 10.",
      "Compte tes trous à triple bogey ou pire. Sur 9 trous, double le chiffre." ],
    score: { lib: "Trous à triple bogey ou pire, sur 18", max: 18, sens: "bas", rep: [9, 5, 3, 1], ind: "strat_cata" } },

  { id: "st_trois_premiers", d: "strategie", t: "Les trois premiers trous", type: "jeu", niv: [1, 4], lieux: ["parcours"], min: 0,
    but: "Entrer dans la partie sans dégât.",
    etapes: [
      "Arrive 20 minutes avant ton départ pour t'échauffer.",
      "Sur les trois premiers trous, joue ton club de sécurité au départ et vise le centre des greens.",
      "Fixe-toi le bogey comme objectif sur ces trois trous.",
      "Note ton score sur ces trois trous par rapport au par." ] },

  { id: "st_dix_pas", d: "strategie", t: "La règle des dix pas", type: "jeu", niv: [1, 4], lieux: ["parcours"], min: 0,
    but: "Empêcher un mauvais coup d'en entraîner un autre.",
    etapes: [
      "Après un coup raté, tu as dix pas pour râler.",
      "Au dixième pas, respire profondément et relève la tête.",
      "Au coup suivant, pose-toi une seule question : quel est le coup le plus simple ?",
      "Après la partie, note combien de fois tu as enchaîné deux mauvais coups." ] },

  { id: "st_putts_compte", d: "strategie", t: "Compter mes putts", type: "jeu", niv: [1, 4], lieux: ["parcours"], min: 0,
    but: "Mesurer ton putting en partie.",
    etapes: [
      "Note ton nombre de putts sur chaque green.",
      "Entoure les greens à 3 putts ou plus.",
      "Pour chacun, note si le premier putt était trop court, trop long ou mal lu.",
      "Sur 9 trous, double le chiffre avant de le noter." ],
    score: { lib: "Greens à 3 putts ou plus, sur 18", max: 18, sens: "bas", rep: [6, 4, 3, 2], ind: "putt_3" } },

  { id: "st_cible_large", d: "strategie", t: "Viser large", type: "jeu", niv: [2, 4], lieux: ["parcours"], min: 0,
    but: "Tenir compte de ta dispersion dans le choix de tes cibles.",
    etapes: [
      "Au départ, vise l'endroit où ton mauvais coup habituel reste jouable.",
      "Avec un danger d'un côté, décale ta cible de l'autre côté d'une demi-largeur de fairway.",
      "Sur les attaques, vise le côté large du green.",
      "Compte tes coups de pénalité sur la partie. Sur 9 trous, double le chiffre." ],
    score: { lib: "Coups de pénalité sur 18 trous", max: 20, sens: "bas", rep: [6, 4, 3, 1], ind: "strat_penal" } },

  { id: "st_trois_clubs", d: "strategie", t: "La partie à trois clubs", type: "jeu", niv: [1, 3], lieux: ["parcours"], min: 0,
    but: "Apprendre à construire un trou plutôt qu'à frapper fort.",
    etapes: [
      "Joue 9 trous avec trois clubs et ton putter, par exemple un hybride, un fer 8 et un sand wedge.",
      "Tu devras varier les amplitudes et choisir tes cibles.",
      "Compare ton score à ton score habituel sur 9 trous." ] },

  { id: "st_pire_balle", d: "strategie", t: "La pire balle", type: "jeu", niv: [3, 4], lieux: ["parcours"], min: 0,
    but: "Renforcer ta régularité sous contrainte.",
    etapes: [
      "Quand le parcours est calme, joue deux balles à chaque coup sur 6 trous.",
      "Continue toujours depuis la plus mauvaise des deux.",
      "Note ton score : il révèle tes coups les plus fragiles." ] },

  /* ---------------- PHYSIQUE ---------------- */
  { id: "ph_mobilite", d: "physique", t: "Huit minutes de mobilité", type: "routine", niv: [1, 4], lieux: ["maison"], min: 10,
    but: "Gagner en amplitude de rotation et préparer le corps au swing.",
    etapes: [
      "Rotations du buste, club sur les épaules : 10 de chaque côté.",
      "Fentes avant avec rotation du buste vers la jambe avant : 6 de chaque côté.",
      "Balancements de jambe d'avant en arrière, en te tenant à un appui : 10 de chaque côté.",
      "Club tenu à deux mains au-dessus de la tête : 5 inclinaisons de chaque côté.",
      "Termine par 10 swings lents sans balle." ] },

  { id: "ph_equilibre", d: "physique", t: "L'équilibre sur un pied", type: "routine", niv: [1, 4], lieux: ["maison"], min: 10,
    but: "Stabiliser tes appuis pour un contact plus régulier.",
    etapes: [
      "Tiens 30 secondes sur un pied, les yeux ouverts. Change de pied.",
      "Recommence les yeux fermés, 15 secondes de chaque côté.",
      "En posture de golf, fais 10 swings lents sans club, en finissant en équilibre sur le pied avant.",
      "Tiens chaque finition 3 secondes." ] }
];

if (typeof module !== "undefined") { module.exports = { EXERCICES_2 }; }
