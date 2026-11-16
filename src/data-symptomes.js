/* ============================================================
   CATALOGUE DES SYMPTÔMES
   Chaque symptôme : questions de précision, causes pondérées par palier (p),
   auto-vérification, conseil, exercices correctifs.
   Dans les réponses, e = points ajoutés à chaque cause.
   base: true = réglage de base (grip, visée, placement), corrigé avant le geste.
   Vocabulaire neutre : pied avant = le plus proche de la cible ;
   main du haut = celle qui tient le haut du grip.
   ============================================================ */

const SYMPTOMES = [

  /* ---------- GRAND JEU ---------- */
  { id: "slice", d: "drive", famille: "Grand jeu", niv: [1, 4],
    t: "Slice",
    desc: "La balle tourne fortement vers la {df} pendant son vol.",
    note: { 4: "À ton niveau, un fade maîtrisé est une trajectoire fiable. Le but est de réduire la courbe, pas forcément de la supprimer." },
    questions: [
      { id: "depart", q: "Où part la balle avant de tourner ?", o: [
        { l: "À {gf} de la cible, puis elle revient vers la {df}", e: { chemin: 3, alignement: 1 } },
        { l: "Droit sur la cible, puis elle tourne", e: { face: 2, grip: 1 } },
        { l: "À {df} de la cible, et elle s'en éloigne encore", e: { face: 3, grip: 2 } },
        { l: "Je ne sais pas", e: {} } ] },
      { id: "clubs", q: "Avec quels clubs ?", o: [
        { l: "Surtout le driver", e: { chemin: 1, alignement: 1 } },
        { l: "Tous les clubs", e: { grip: 2, face: 1 } } ] }
    ],
    causes: [
      { id: "grip", base: true, t: "Grip trop faible", p: [3, 3, 2, 1],
        pourquoi: "Les mains sont trop tournées vers la cible sur le grip. La face revient ouverte à l'impact et la balle prend un effet vers la {df}.",
        verif: "À l'adresse, regarde ta main du haut. Si tu vois moins de deux jointures, le grip est trop faible.",
        conseil: "Tourne les deux mains vers l'épaule arrière jusqu'à voir 2 à 3 jointures de la main du haut.",
        exos: ["fe_grip", "fe_release"] },
      { id: "alignement", base: true, t: "Alignement ouvert", p: [3, 3, 2, 1.5],
        pourquoi: "Pour éviter la {df}, tu vises de plus en plus à {gf}. Les épaules ouvertes accentuent le chemin qui coupe la balle, et le slice s'aggrave.",
        verif: "Pose un club le long de tes pointes de pieds, puis recule derrière la balle. Il doit être parallèle à la ligne de jeu. Vérifie aussi la ligne des épaules.",
        conseil: "Aligne d'abord la face du club sur la cible, puis les pieds et les épaules parallèles à la ligne de jeu.",
        exos: ["fe_alignement", "fe_posture"] },
      { id: "chemin", t: "Chemin de club de l'extérieur vers l'intérieur", p: [2, 3, 3, 2.5],
        pourquoi: "Les épaules lancent la descente. Le club arrive de l'extérieur et coupe la balle.",
        verif: "La balle part à {gf} de la cible avant de tourner, et tes divots pointent à {gf}.",
        conseil: "Démarre la descente par le bas du corps et cherche à frapper le quart intérieur de la balle.",
        exos: ["dr_porte", "dr_pied_recule", "fe_pas"] },
      { id: "face", t: "Face qui reste ouverte à l'impact", p: [1.5, 2, 2.5, 3],
        pourquoi: "Les avant-bras ne tournent pas dans la zone d'impact, souvent par crispation. La face ne se referme pas.",
        verif: "La balle part droit ou à {df}, puis tourne encore. Ta finition est courte, bras bloqués.",
        conseil: "Relâche la pression du grip et laisse les avant-bras tourner après l'impact.",
        exos: ["fe_release", "fe_demi", "dr_vitesse"] }
    ] },

  { id: "hook", d: "drive", famille: "Grand jeu", niv: [2, 4],
    t: "Hook",
    desc: "La balle tourne fortement vers la {gf} pendant son vol.",
    questions: [
      { id: "depart", q: "Où part la balle avant de tourner ?", o: [
        { l: "À {df} de la cible, puis elle revient fort vers la {gf}", e: { chemin_int: 3, grip_fort: 1 } },
        { l: "Droit sur la cible, puis elle tourne", e: { grip_fort: 2, mains: 2 } },
        { l: "À {gf} de la cible, et elle tourne encore", e: { mains: 3, grip_fort: 2 } },
        { l: "Je ne sais pas", e: {} } ] }
    ],
    causes: [
      { id: "grip_fort", base: true, t: "Grip trop fort", p: [2, 3, 3, 2.5],
        pourquoi: "Les mains sont trop tournées vers l'épaule arrière. La face se referme avant l'impact.",
        verif: "À l'adresse, tu vois quatre jointures de la main du haut, et la main du bas passe sous le grip.",
        conseil: "Ramène les mains vers une position neutre : 2 à 3 jointures visibles, paume de la main du bas face à la cible.",
        exos: ["fe_grip"] },
      { id: "mains", t: "Le corps s'arrête, les mains passent", p: [2, 2.5, 3, 3],
        pourquoi: "La rotation du corps ralentit avant l'impact. Les mains prennent le relais et ferment la face.",
        verif: "Ta finition est en arrière ou déséquilibrée, et la boucle de ta ceinture ne fait pas face à la cible.",
        conseil: "Continue de tourner le bassin et la poitrine jusqu'à la finition.",
        exos: ["fe_finition", "fe_serviette", "fe_punch"] },
      { id: "chemin_int", base: true, t: "Chemin de club trop intérieur", p: [1, 2, 2.5, 3],
        pourquoi: "Le club arrive très de l'intérieur, souvent avec une balle trop en arrière ou un alignement fermé. La balle part à {df} et tourne beaucoup.",
        verif: "Tes pieds visent à {df} de la cible, ou la balle est placée en arrière du centre.",
        conseil: "Recale ton alignement et avance la balle d'une largeur de balle.",
        exos: ["fe_alignement", "fe_porte_int"] }
    ] },

  { id: "top", d: "fers", famille: "Grand jeu", niv: [1, 3],
    t: "Tops",
    desc: "Le club frappe le haut de la balle. Elle part au ras du sol, sans monter.",
    questions: [
      { id: "forme", q: "Qu'est-ce qui ressemble le plus à ce qui t'arrive ?", o: [
        { l: "Des balles rasantes, sans toucher le sol", e: { lever: 2, redresse: 2 } },
        { l: "Une alternance de tops et de grattes", e: { lever: 3 } },
        { l: "Surtout avec les bois et les hybrides au sol", e: { lever: 2, position: 2 } },
        { l: "Surtout quand je veux frapper fort", e: { redresse: 2, bras: 2 } } ] }
    ],
    causes: [
      { id: "lever", t: "Tu cherches à lever la balle", p: [3, 3, 2, 1],
        pourquoi: "En voulant aider la balle à monter, le poids reste en arrière et le club remonte avant de l'atteindre. C'est le loft du club qui lève la balle, à condition de frapper vers le bas.",
        verif: "Regarde ta finition. Si ton poids est resté sur le pied arrière, c'est cette cause.",
        conseil: "Frappe la balle puis le sol, et finis en équilibre sur le pied avant.",
        exos: ["fe_fer9_tee", "fe_ligne", "fe_tee_devant", "fe_pied_pointe"] },
      { id: "redresse", t: "Tu te redresses pendant le swing", p: [2, 2.5, 3, 2.5],
        pourquoi: "Le buste remonte avant l'impact et le club passe trop haut.",
        verif: "Demande à un partenaire de regarder ta tête de profil, ou filme-toi. Elle monte avant l'impact.",
        conseil: "Garde l'inclinaison du buste jusqu'après l'impact, le regard sur l'emplacement de la balle.",
        exos: ["fe_chaise", "fe_demi", "fe_pieds_joints"] },
      { id: "bras", t: "Bras crispés qui se plient", p: [2, 2, 2, 1.5],
        pourquoi: "Trop de tension raccourcit les bras à l'impact.",
        verif: "Tes avant-bras sont durs à l'adresse, et ta traversée est courte, coudes écartés.",
        conseil: "Tiens le club avec une pression de 4 sur 10 et allonge les bras après l'impact.",
        exos: ["fe_serviette", "fe_demi", "fe_grip"] },
      { id: "position", base: true, t: "Balle mal placée", p: [2, 2, 1.5, 1],
        pourquoi: "Une balle trop en avant est touchée quand le club remonte déjà.",
        verif: "Pose un club au sol entre tes pieds, pointé vers la balle. Elle doit être au centre pour un fer court, deux largeurs de balle plus en avant pour un hybride.",
        conseil: "Recale la position de balle avant chaque coup.",
        exos: ["fe_posture", "fe_hybride", "fe_brosser"] }
    ] },

  { id: "gratte", d: "fers", famille: "Grand jeu", niv: [1, 4],
    t: "Grattes",
    desc: "Le club touche le sol avant la balle. Elle part courte, avec une grosse motte.",
    questions: [
      { id: "finition", q: "Où se trouve ton poids à la fin du swing ?", o: [
        { l: "Plutôt sur le pied arrière", e: { transfert: 3 } },
        { l: "Sur le pied avant, en équilibre", e: { relache: 2, balancement: 1 } },
        { l: "Je ne sais pas", e: {} } ] },
      { id: "quand", q: "Quand cela arrive-t-il le plus ?", o: [
        { l: "Sur herbe, alors que tout va bien sur tapis", e: { relache: 1, transfert: 1 } },
        { l: "Avec les wedges et les petits coups", e: { transfert: 2, relache: 1 } },
        { l: "Avec tous les fers", e: { balancement: 1, position_g: 1 } } ] }
    ],
    causes: [
      { id: "transfert", t: "Le poids reste sur le pied arrière", p: [3, 3, 2.5, 2],
        pourquoi: "Sans transfert vers la cible, le point bas du swing se trouve derrière la balle.",
        verif: "Tiens ta finition. Le talon arrière doit être décollé et le poids sur le pied avant.",
        conseil: "Finis chaque swing en équilibre sur le pied avant, face à la cible.",
        exos: ["fe_pied_pointe", "fe_ligne", "fe_pas", "fe_tee_devant"] },
      { id: "relache", t: "Les poignets se relâchent trop tôt", p: [1.5, 2, 3, 3],
        pourquoi: "La tête de club dépasse les mains avant l'impact et touche le sol en premier.",
        verif: "À l'impact, tes mains doivent être en avance sur la balle. Vérifie-le sur une vidéo prise de face.",
        conseil: "Arrive à l'impact les mains devant, comme pour un coup punché.",
        exos: ["fe_punch", "fe_pompe", "fe_ligne"] },
      { id: "balancement", t: "Le corps se déplace sur le côté à la montée", p: [2, 2.5, 2, 1.5],
        pourquoi: "La tête et le bassin glissent vers l'arrière au lieu de tourner. Revenir sur la balle devient aléatoire.",
        verif: "Fais des swings avec le soleil dans le dos. L'ombre de ta tête ne doit presque pas bouger.",
        conseil: "Tourne autour de ta colonne, le poids à l'intérieur du pied arrière.",
        exos: ["fe_pieds_joints", "fe_rotation", "fe_demi"] },
      { id: "position_g", base: true, t: "Balle trop en avant ou posture affaissée", p: [2, 1.5, 1, 1],
        pourquoi: "Le club atteint le sol avant d'arriver à la balle.",
        verif: "Contrôle la position de balle avec un club posé au sol, et ta posture dans un miroir.",
        conseil: "Balle au centre pour les fers courts, dos droit, bras pendants.",
        exos: ["fe_posture", "fe_brosser", "fe_ligne"] }
    ] },

  { id: "socket", d: "fers", famille: "Grand jeu", niv: [1, 4],
    t: "Sockets",
    desc: "La balle est touchée par le talon du club et part presque à angle droit vers la {df}.",
    questions: [
      { id: "coups", q: "Sur quels coups ?", o: [
        { l: "Surtout les approches et les petits wedges", e: { interieur: 3, tension: 1 } },
        { l: "Surtout les pleins coups de fer", e: { pointes: 3, mains_loin: 2 } },
        { l: "Un peu partout, par séries", e: { tension: 2, pointes: 1 } } ] }
    ],
    causes: [
      { id: "pointes", base: true, t: "Trop près de la balle, poids vers les pointes", p: [3, 3, 2.5, 2.5],
        pourquoi: "Pendant la descente, le poids part vers les pointes de pieds et le club s'avance. C'est le talon du club qui arrive sur la balle.",
        verif: "À l'adresse, lâche la main du bas. Le bras doit pendre librement, avec un poing d'écart entre les mains et les cuisses. Tu dois pouvoir remuer les orteils.",
        conseil: "Répartis le poids au milieu des pieds et garde cette répartition jusqu'à l'impact.",
        exos: ["fe_barriere", "fe_posture", "fe_chaise"] },
      { id: "mains_loin", t: "Les mains s'éloignent du corps à la descente", p: [2, 2.5, 2.5, 2.5],
        pourquoi: "Les épaules lancent la descente et poussent les mains vers l'extérieur.",
        verif: "Tes divots pointent à {gf} de la cible, et tu fais aussi des slices.",
        conseil: "Garde les bras près du buste pendant la descente.",
        exos: ["fe_barriere", "fe_serviette", "dr_porte"] },
      { id: "interieur", t: "Club trop à l'intérieur, face ouverte", p: [1.5, 2, 2.5, 3],
        pourquoi: "Au démarrage, le club part derrière toi avec la face ouverte. Il revient vers la balle par le talon.",
        verif: "Arrête la montée quand le club est à l'horizontale, à hauteur de hanches. Le manche doit être parallèle à ta ligne de pieds et la pointe du club tournée vers le ciel.",
        conseil: "Démarre le club le long de la ligne de jeu, en gardant la face tournée vers la balle plus longtemps.",
        exos: ["fe_demi", "fe_barriere"] },
      { id: "tension", t: "Crispation après un premier socket", p: [1.5, 1.5, 2, 2],
        pourquoi: "La peur du socket raidit les bras et rapproche le talon du club de la balle.",
        verif: "Les sockets arrivent par séries, puis disparaissent.",
        conseil: "Reviens à des demi-coups, pieds joints, jusqu'à retrouver trois contacts centrés de suite.",
        exos: ["fe_pieds_joints", "fe_demi", "fe_centrage"] }
    ] },

  { id: "direction", d: "fers", famille: "Grand jeu", niv: [1, 4],
    t: "Balles droites, mais à côté",
    desc: "La balle vole sans courbe, mais part à {gf} ou à {df} de la cible.",
    questions: [
      { id: "cote", q: "De quel côté ?", o: [
        { l: "À {gf} de la cible", e: { align: 2, balle_avant: 2, chemin_ext: 2 } },
        { l: "À {df} de la cible", e: { align: 2, balle_arriere: 2, glisse: 2 } },
        { l: "Des deux côtés", e: { align: 3 } } ] }
    ],
    causes: [
      { id: "align", base: true, t: "Alignement approximatif", p: [3, 3, 3, 2.5],
        pourquoi: "La plupart des balles droites mais décalées viennent d'une visée fausse. La balle va là où le corps est aligné.",
        verif: "Mets-toi à l'adresse, pose le club le long de tes pieds et recule derrière la balle pour voir où il pointe.",
        conseil: "Adopte une routine : choisis un repère à un mètre devant la balle, aligne la face dessus, puis les pieds.",
        exos: ["fe_alignement", "st_routine"] },
      { id: "balle_avant", base: true, t: "Balle trop en avant", p: [2, 2, 2, 1.5],
        pourquoi: "Le club touche la balle quand il revient déjà vers l'intérieur. Elle part à {gf}.",
        verif: "Vérifie la position de balle avec un club posé au sol entre tes pieds.",
        conseil: "Recule la balle d'une largeur de balle.",
        exos: ["fe_posture", "fe_alignement"] },
      { id: "balle_arriere", base: true, t: "Balle trop en arrière", p: [2, 2, 2, 1.5],
        pourquoi: "Le club touche la balle avant d'être revenu de face. Elle part à {df}.",
        verif: "Vérifie la position de balle avec un club posé au sol entre tes pieds.",
        conseil: "Avance la balle d'une largeur de balle.",
        exos: ["fe_posture", "fe_alignement"] },
      { id: "chemin_ext", t: "Chemin de club de l'extérieur vers l'intérieur", p: [1.5, 2, 2.5, 2.5],
        pourquoi: "Le club coupe la ligne de jeu, avec une face alignée sur ce chemin. La balle part droit à {gf}.",
        verif: "Tes divots pointent à {gf} de la cible.",
        conseil: "Démarre la descente par le bas du corps.",
        exos: ["dr_porte", "fe_pas"] },
      { id: "glisse", t: "Le bassin glisse vers la cible", p: [1.5, 2, 2.5, 2.5],
        pourquoi: "Le corps avance au lieu de tourner. La face n'a pas le temps de revenir et la balle part à {df}.",
        verif: "À la finition, ton bassin est en avance, mais ta poitrine ne fait pas face à la cible.",
        conseil: "Tourne le bassin au lieu de le pousser vers la cible.",
        exos: ["fe_finition", "fe_pieds_joints"] }
    ] },

  { id: "chandelle", d: "drive", famille: "Grand jeu", niv: [1, 3],
    t: "Chandelles au driver",
    desc: "La balle monte très haut et retombe court. Le dessus du driver porte des traces.",
    questions: [],
    causes: [
      { id: "plonge", t: "Attaque trop plongeante", p: [3, 3, 3, 3],
        pourquoi: "Le poids part vers la cible à la descente et le club arrive de haut, comme avec un fer.",
        verif: "Ta balle est placée au centre du stance, ou tes épaules sont à plat à l'adresse.",
        conseil: "Place la balle en face du talon avant, l'épaule arrière plus basse, et balaie.",
        exos: ["dr_balayer", "dr_reglages", "dr_rythme"] },
      { id: "tee", base: true, t: "Tee trop haut", p: [2.5, 2.5, 2, 2],
        pourquoi: "Le club passe sous la balle.",
        verif: "À l'adresse, plus de la moitié de la balle dépasse du haut de la tête du driver.",
        conseil: "Baisse le tee jusqu'à ce que la moitié de la balle dépasse de la tête du club.",
        exos: ["dr_reglages", "dr_balayer"] }
    ] },

  { id: "distance", d: "drive", famille: "Grand jeu", niv: [1, 4],
    t: "Manque de distance",
    desc: "La balle part droit mais ne va pas loin, au driver comme aux fers.",
    questions: [
      { id: "contact", q: "Comment est ton contact ?", o: [
        { l: "Souvent décentré", e: { centrage: 3 } },
        { l: "Centré, mais la balle ne part pas", e: { rotation: 2, relache_d: 2 } },
        { l: "La balle monte trop et retombe", e: { relache_d: 3 } },
        { l: "Je ne sais pas", e: { centrage: 1 } } ] }
    ],
    causes: [
      { id: "centrage", t: "Contact décentré", p: [3, 3, 3, 2],
        pourquoi: "Un impact décentré de deux centimètres coûte nettement plus de distance qu'un swing un peu plus lent.",
        verif: "Fais le test du talc : poudre la face du club et regarde où sont les traces d'impact.",
        conseil: "Cherche d'abord le centre de la face, à vitesse modérée.",
        exos: ["fe_centrage", "fe_pieds_joints", "dr_rythme"] },
      { id: "rotation", t: "Swing tout en bras", p: [2.5, 2.5, 2.5, 2],
        pourquoi: "Sans rotation des épaules ni appui au sol, la vitesse ne vient que des bras.",
        verif: "En haut de la montée, l'épaule avant doit arriver sous le menton et ton dos faire face à la cible.",
        conseil: "Tourne les épaules à la montée et pousse sur le pied avant à la descente.",
        exos: ["fe_rotation", "fe_pas", "ph_mobilite"] },
      { id: "relache_d", t: "Vitesse libérée trop tôt", p: [1.5, 2, 2.5, 3],
        pourquoi: "Les poignets se relâchent dès le début de la descente. La tête de club ralentit avant d'arriver sur la balle.",
        verif: "Fais l'exercice du sifflement. Si le sifflement se produit derrière toi, c'est cette cause.",
        conseil: "Garde les poignets armés plus longtemps et accélère après la balle.",
        exos: ["dr_vitesse", "fe_pompe", "fe_punch", "fe_tee_devant"] }
    ] },

  { id: "lever", d: "fers", famille: "Grand jeu", niv: [1, 2],
    t: "Je n'arrive pas à lever la balle",
    desc: "La plupart des balles restent au ras du sol.",
    questions: [
      { id: "club", q: "Avec quels clubs ?", o: [
        { l: "Tous, même les fers courts", e: { aider: 3, bases: 2 } },
        { l: "Surtout les fers longs et les bois", e: { club: 3 } },
        { l: "Surtout quand je force", e: { force: 3 } } ] }
    ],
    causes: [
      { id: "aider", t: "Tu cherches à soulever la balle", p: [3, 3, 2, 2],
        pourquoi: "Le réflexe de passer sous la balle fait remonter le club trop tôt. Pour qu'elle monte, il faut frapper vers le bas : le loft fait le reste.",
        verif: "Après tes coups, il n'y a aucune trace au sol devant l'emplacement de la balle.",
        conseil: "Brosse le sol à l'endroit de la balle et laisse le club travailler.",
        exos: ["fe_fer9_tee", "fe_brosser", "fe_tee_devant"] },
      { id: "bases", base: true, t: "Grip et posture à installer", p: [3, 2.5, 2, 2],
        pourquoi: "Sans une prise et une posture stables, le club ne revient pas deux fois au même endroit.",
        verif: "Tu ne prends pas ton grip de la même façon à chaque coup, ou tu te tiens très droit.",
        conseil: "Consacre cinq minutes au grip et à la posture au début de chaque séance.",
        exos: ["fe_grip", "fe_posture"] },
      { id: "club", base: true, t: "Clubs trop difficiles pour l'instant", p: [2, 2, 1, 1],
        pourquoi: "Les fers longs ont peu de loft et demandent de la vitesse.",
        verif: "Tu lèves la balle au fer 9 mais pas au fer 5.",
        conseil: "Remplace les fers 4 et 5 par un hybride, et préfère un bois 5 à un bois 3 au sol.",
        exos: ["fe_hybride", "fe_fer9_tee"] },
      { id: "force", t: "Trop de force", p: [2, 2, 1.5, 1.5],
        pourquoi: "En forçant, le corps se redresse et les bras se crispent.",
        verif: "Tes meilleurs contacts arrivent quand tu swingues tranquillement.",
        conseil: "Joue à 70 % de ta vitesse et tiens ta finition.",
        exos: ["fe_demi", "fe_pieds_joints", "dr_rythme"] }
    ] },

  /* ---------- PETIT JEU ---------- */
  { id: "wedge_dosage", d: "wedge", famille: "Petit jeu", niv: [1, 4],
    t: "Distances de wedge mal maîtrisées",
    desc: "Entre 30 et 80 m, la balle finit rarement à la bonne distance.",
    questions: [
      { id: "methode", q: "Comment règles-tu la distance ?", o: [
        { l: "Je fais un plein swing en retenant le coup", e: { retient: 3 } },
        { l: "Je change l'amplitude, au jugé", e: { reperes: 3 } },
        { l: "Je ne sais pas vraiment", e: { reperes: 2, retient: 1 } } ] }
    ],
    causes: [
      { id: "retient", t: "Swing retenu au lieu d'un geste plus court", p: [3, 3, 2.5, 2],
        pourquoi: "Freiner un plein swing donne des contacts et des distances imprévisibles.",
        verif: "Ta traversée est plus courte que ta montée.",
        conseil: "Raccourcis la montée et garde le même tempo jusqu'au bout.",
        exos: ["we_tempo", "we_pitch_base", "we_horloge"] },
      { id: "reperes", t: "Pas de repères d'amplitude", p: [2, 3, 3, 3],
        pourquoi: "Sans amplitudes de référence, chaque coup est une improvisation.",
        verif: "Tu ne connais pas la distance de ton sand wedge à mi-swing.",
        conseil: "Construis trois amplitudes et note la distance de chacune.",
        exos: ["we_horloge", "we_matrice", "we_echelle", "we_hasard", "we_tempo"] },
      { id: "contact_w", t: "Contact irrégulier", p: [2.5, 2, 1.5, 1.5],
        pourquoi: "Une gratte ou un contact trop fin change la distance de plusieurs mètres.",
        verif: "Tes divots au wedge sont de tailles très différentes.",
        conseil: "Garde le poids devant et tourne la poitrine vers la cible.",
        exos: ["we_poids_devant", "we_pitch_base", "fe_punch"] }
    ] },

  { id: "app_contact", d: "approche", famille: "Petit jeu", niv: [1, 4],
    t: "Approches grattées ou topées",
    desc: "Autour du green, la balle reste à tes pieds ou traverse le green au ras du sol.",
    questions: [
      { id: "club", q: "Quel club joues-tu le plus souvent autour du green ?", o: [
        { l: "Le sand wedge ou un wedge très ouvert", e: { choix: 2, poignets: 1 } },
        { l: "Un fer 8 ou 9, ou le pitching wedge", e: { poignets: 2, poids: 1 } },
        { l: "Cela dépend", e: {} } ] },
      { id: "geste", q: "Que ressens-tu pendant le geste ?", o: [
        { l: "Je freine avant la balle", e: { freine: 3 } },
        { l: "Je donne un coup de poignets", e: { poignets: 3 } },
        { l: "Rien de particulier", e: { poids: 1 } } ] }
    ],
    causes: [
      { id: "poignets", t: "Les poignets cherchent à lever la balle", p: [3, 3, 2.5, 2],
        pourquoi: "Le poids part en arrière et les poignets cassent. Le club touche le sol trop tôt ou remonte sur la balle.",
        verif: "À la fin du geste, la tête du club a dépassé tes mains.",
        conseil: "Poids sur le pied avant, mains devant la balle, et un geste de balancier sans poignets.",
        exos: ["ap_manche", "ap_pied_retrait", "ap_roulee", "ap_main_seule"] },
      { id: "poids", base: true, t: "Poids en arrière", p: [2.5, 2.5, 2, 1.5],
        pourquoi: "Avec le poids sur le pied arrière, le point bas du geste se trouve avant la balle.",
        verif: "Après le coup, tu peux soulever le pied avant sans perdre l'équilibre.",
        conseil: "Mets 70 % du poids sur le pied avant et n'en bouge plus.",
        exos: ["ap_pied_retrait", "ap_roulee", "ap_lies"] },
      { id: "freine", t: "Le club ralentit avant l'impact", p: [2, 2.5, 2.5, 2.5],
        pourquoi: "La montée est trop longue pour la distance, et tu freines pour ne pas dépasser le trou.",
        verif: "Ta traversée est plus courte que ta montée.",
        conseil: "Raccourcis la montée et traverse au moins aussi loin.",
        exos: ["ap_amplitude", "ap_serviette", "ap_trois_zones"] },
      { id: "choix", base: true, t: "Coup trop difficile pour la situation", p: [2.5, 2.5, 2, 1.5],
        pourquoi: "Le coup levé au sand wedge laisse très peu de marge. Une approche roulée pardonne beaucoup plus.",
        verif: "Tu prends le sand wedge par habitude, même quand rien ne t'oblige à lever la balle.",
        conseil: "Putter si possible, rouler sinon, lever en dernier recours.",
        exos: ["ap_putter_bord", "ap_echelle_clubs", "ap_roulee", "ap_lies"] }
    ] },

  { id: "app_dosage", d: "approche", famille: "Petit jeu", niv: [1, 4],
    t: "Approches mal dosées",
    desc: "Le contact est correct, mais la balle finit trop courte ou trop longue.",
    questions: [
      { id: "sens", q: "Dans quel sens ?", o: [
        { l: "Le plus souvent trop court", e: { chute: 2, freine_d: 2 } },
        { l: "Le plus souvent trop long", e: { roule: 3 } },
        { l: "Les deux", e: { chute: 2, amplitude: 2 } } ] }
    ],
    causes: [
      { id: "chute", t: "Pas de point de chute choisi", p: [3, 3, 3, 2.5],
        pourquoi: "En regardant le trou, tu doses la distance totale sans décider où la balle doit tomber.",
        verif: "Repense à ta dernière approche : savais-tu précisément où la balle devait toucher le green ?",
        conseil: "Choisis un point de chute sur le green et regarde-le pendant ton coup d'essai.",
        exos: ["ap_serviette", "ap_trois_zones", "ap_seau"] },
      { id: "roule", t: "Roule mal estimée", p: [3, 3, 2.5, 2],
        pourquoi: "Chaque club roule différemment après le rebond.",
        verif: "Tu ne sais pas dire combien roule ton fer 8 par rapport à ton sand wedge.",
        conseil: "Étalonne trois clubs avec le même geste.",
        exos: ["ap_echelle_clubs", "ap_lies"] },
      { id: "amplitude", t: "Amplitude irrégulière", p: [2, 2.5, 2.5, 2.5],
        pourquoi: "D'un coup à l'autre, la même distance est jouée avec des gestes différents.",
        verif: "Sur cinq balles jouées vers le même trou, l'écart entre la plus courte et la plus longue dépasse 3 m.",
        conseil: "Associe une amplitude à chaque distance et répète-la.",
        exos: ["ap_amplitude", "ap_trois_zones", "ap_approche_putt"] },
      { id: "freine_d", t: "Le club ralentit à l'impact", p: [2, 2, 2, 1.5],
        pourquoi: "Une balle jouée en freinant part moins loin que prévu.",
        verif: "Ta traversée est plus courte que ta montée.",
        conseil: "Raccourcis la montée et accélère jusqu'à la finition.",
        exos: ["ap_amplitude", "ap_trois_zones"] }
    ] },

  { id: "bunker_s", d: "bunker", famille: "Petit jeu", niv: [1, 4],
    t: "Sorties de bunker ratées",
    desc: "La balle reste dans le sable, ou part au ras du sol et traverse le green.",
    questions: [
      { id: "forme", q: "Que se passe-t-il le plus souvent ?", o: [
        { l: "La balle reste dans le bunker", e: { ralentit: 3, creuse: 2 } },
        { l: "La balle part trop fort, sans sable", e: { cueille: 3, entree: 2 } },
        { l: "Les deux", e: { entree: 3 } } ] }
    ],
    causes: [
      { id: "ralentit", t: "Le club ralentit dans le sable", p: [3, 3, 2.5, 2],
        pourquoi: "Le sable freine beaucoup le club. Sans vitesse, la balle ne sort pas.",
        verif: "Ta finition est courte, le club s'arrête juste après le sable.",
        conseil: "Fais le geste d'un coup trois fois plus long et va jusqu'à la finition.",
        exos: ["bu_finition", "bu_base", "bu_billet"] },
      { id: "creuse", base: true, t: "Le club s'enfonce au lieu de glisser", p: [2.5, 2.5, 2.5, 2],
        pourquoi: "Avec une face fermée ou carrée, le bord d'attaque plante dans le sable.",
        verif: "Tes traces dans le sable sont profondes et courtes.",
        conseil: "Ouvre la face avant de prendre ton grip, pour que la semelle rebondisse.",
        exos: ["bu_base", "bu_billet"] },
      { id: "entree", t: "Point d'entrée irrégulier", p: [2, 2.5, 3, 3],
        pourquoi: "Le club entre tantôt trop loin derrière la balle, tantôt sur la balle.",
        verif: "Trace une ligne dans le sable et fais cinq swings. Les traces ne commencent pas au même endroit.",
        conseil: "Vise un point précis dans le sable, 5 cm derrière la balle.",
        exos: ["bu_ligne", "bu_billet"] },
      { id: "cueille", t: "Tu cherches à cueillir la balle", p: [2.5, 2.5, 2, 1.5],
        pourquoi: "Le poids part en arrière et le club touche la balle avant le sable.",
        verif: "Tu finis sur le pied arrière.",
        conseil: "Garde 60 % du poids devant du début à la fin, et frappe le sable.",
        exos: ["bu_base", "bu_ligne", "bu_finition"] }
    ] },

  /* ---------- PUTTING ---------- */
  { id: "putt_court_s", d: "putt_court", famille: "Putting", niv: [1, 4],
    t: "Putts courts ratés",
    desc: "Tu manques trop de putts à moins de 2 m.",
    questions: [
      { id: "cote", q: "Où passent les putts ratés ?", o: [
        { l: "Toujours du même côté", e: { visee: 3 } },
        { l: "D'un côté, puis de l'autre", e: { face_p: 3, tete: 1 } },
        { l: "Ils restent courts ou meurent avant le trou", e: { vitesse: 3 } },
        { l: "Je ne sais pas", e: {} } ] },
      { id: "quand", q: "Est-ce pire en partie qu'à l'entraînement ?", o: [
        { l: "Oui, nettement", e: { pression: 3 } },
        { l: "Non, c'est pareil", e: { visee: 1, face_p: 1 } } ] }
    ],
    causes: [
      { id: "visee", base: true, t: "Face mal orientée à l'adresse", p: [3, 3, 3, 3],
        pourquoi: "Sur un putt court, la balle part presque exactement là où regarde la face. Deux degrés d'erreur suffisent à manquer le trou à 2 m.",
        verif: "Fais l'exercice de la porte. Si la balle touche toujours le même tee, ta visée est décalée.",
        conseil: "Aligne la face en premier, sur un repère proche de la balle.",
        exos: ["pc_porte", "pc_ligne_balle", "pc_regle"] },
      { id: "face_p", t: "Face instable pendant le geste", p: [2.5, 2.5, 2.5, 2.5],
        pourquoi: "Les poignets ou les mains interviennent et font tourner la face.",
        verif: "Trace une ligne autour de la balle et aligne-la sur ton putt. Elle vacille pendant que la balle roule, au lieu de rester nette.",
        conseil: "Putte avec les épaules, en gardant une pression de grip constante.",
        exos: ["pc_balancier", "pc_regle", "pc_une_main"] },
      { id: "tete", t: "Tu regardes trop tôt", p: [2, 2, 1.5, 1.5],
        pourquoi: "En suivant la balle des yeux, les épaules s'ouvrent et la face avec elles.",
        verif: "Tu sais où va la balle avant même qu'elle ait parcouru 30 cm.",
        conseil: "Garde les yeux sur l'emplacement de la balle jusqu'à ce qu'elle tombe.",
        exos: ["pc_ecoute"] },
      { id: "vitesse", t: "Pas assez de vitesse", p: [2, 2, 2, 1.5],
        pourquoi: "Une balle qui meurt devant le trou subit toute la pente et les irrégularités du green.",
        verif: "Tes putts ratés s'arrêtent avant le trou ou juste à côté.",
        conseil: "Joue pour que la balle finisse 30 à 40 cm derrière le trou si elle ne rentre pas.",
        exos: ["pc_fond", "pc_routine"] },
      { id: "pression", t: "Routine qui change sous pression", p: [1.5, 2, 2.5, 3],
        pourquoi: "En partie, tu prends plus de temps, tu doutes, et le geste se raccourcit.",
        verif: "Tu rentres ces putts à l'entraînement et tu les manques quand ils comptent.",
        conseil: "Fixe une routine courte et joue-la à l'identique, y compris à l'entraînement.",
        exos: ["pc_routine", "pc_cadran", "pc_serie"] }
    ] },

  { id: "putt_dosage_s", d: "putt_long", famille: "Putting", niv: [1, 4],
    t: "Putts longs mal dosés",
    desc: "Le premier putt finit loin du trou et les 3-putts s'accumulent.",
    questions: [
      { id: "sens", q: "Tes premiers putts sont plutôt…", o: [
        { l: "Trop courts", e: { frappe: 2, regard: 2 } },
        { l: "Trop longs", e: { frappe: 3 } },
        { l: "Tantôt courts, tantôt longs", e: { regard: 2, vitesse_jour: 2, frappe: 1 } } ] }
    ],
    causes: [
      { id: "frappe", t: "Tu frappes la balle au lieu de la faire rouler", p: [3, 3, 2.5, 2],
        pourquoi: "Une petite montée suivie d'un coup sec donne une vitesse impossible à régler.",
        verif: "Ta traversée est plus courte que ta montée, ou ton rythme change selon la distance.",
        conseil: "Garde le même tempo pour tous les putts. C'est l'amplitude qui règle la distance.",
        exos: ["pl_tempo", "pl_echelle", "pl_tapis_dosage"] },
      { id: "regard", t: "Tu ne regardes pas assez la cible", p: [2.5, 2.5, 2.5, 2.5],
        pourquoi: "La distance se règle à l'œil, comme pour lancer une balle à quelqu'un. Les yeux fixés sur la balle, tu joues à l'aveugle.",
        verif: "Tu fais tes coups d'essai en regardant la balle ou le putter.",
        conseil: "Fais tes coups d'essai en regardant le trou.",
        exos: ["pl_regard", "pl_frange", "pl_yeux_fermes"] },
      { id: "vitesse_jour", t: "Vitesse des greens non prise avant la partie", p: [2, 2.5, 2.5, 2.5],
        pourquoi: "La vitesse des greens change d'un jour et d'un parcours à l'autre.",
        verif: "Tes 3-putts se concentrent sur les premiers trous.",
        conseil: "Passe dix minutes sur le putting green avant chaque départ.",
        exos: ["pl_avant_partie", "pl_echelle"] },
      { id: "ambition", t: "Tu vises le trou au lieu d'une zone", p: [2, 2, 2, 2],
        pourquoi: "Au-delà de 8 m, chercher à rentrer la balle fait souvent dépasser le trou de loin.",
        verif: "Tes putts longs ratés finissent souvent à plus de 2 m du trou.",
        conseil: "Vise un cercle d'un mètre autour du trou.",
        exos: ["pl_test_zone", "pl_neuf_trous"] }
    ] },

  { id: "putt_lecture", d: "putt_long", famille: "Putting", niv: [2, 4],
    t: "Pentes mal lues",
    desc: "La balle part où tu vises, mais passe à côté du trou.",
    questions: [
      { id: "cote", q: "Où passent tes putts en pente ?", o: [
        { l: "Sous le trou, côté bas", e: { sous_lit: 3 } },
        { l: "Au-dessus du trou, côté haut", e: { vitesse_l: 3 } },
        { l: "Cela dépend", e: { methode: 2 } } ] }
    ],
    causes: [
      { id: "sous_lit", t: "Tu ne joues pas assez de pente", p: [3, 3, 3, 3],
        pourquoi: "C'est l'erreur la plus répandue : la plupart des amateurs sous-estiment nettement la pente.",
        verif: "Tes putts en pente ratent presque toujours du côté bas.",
        conseil: "Ajoute de la pente à ta lecture dès que tu hésites.",
        exos: ["pl_point_haut", "pl_cadran_pente", "pl_annonce"] },
      { id: "methode", t: "Lecture incomplète", p: [2.5, 2.5, 2, 2],
        pourquoi: "Lire seulement depuis l'arrière de la balle fait manquer la pente générale.",
        verif: "Tu ne regardes jamais ton putt depuis le côté bas.",
        conseil: "Lis depuis l'arrière de la balle, puis depuis le côté bas, à mi-distance.",
        exos: ["pl_annonce", "pl_cadran_pente", "pc_routine"] },
      { id: "vitesse_l", t: "Ligne et vitesse qui ne vont pas ensemble", p: [2, 2, 2.5, 2.5],
        pourquoi: "Un putt joué fort tourne moins. Si tu lis pour une balle qui meurt au trou et que tu joues ferme, elle passe au-dessus.",
        verif: "Tes putts ratés côté haut finissent loin derrière le trou.",
        conseil: "Décide d'abord de la vitesse, ensuite de la ligne.",
        exos: ["pl_point_haut", "pl_tempo"] }
    ] },

  /* ---------- SUR LE PARCOURS ---------- */
  { id: "debut", d: "strategie", famille: "Sur le parcours", niv: [1, 4],
    t: "Mauvais débuts de partie",
    desc: "Les trois ou quatre premiers trous te coûtent cher, puis le jeu se met en place.",
    questions: [
      { id: "avant", q: "Que fais-tu avant le départ ?", o: [
        { l: "J'arrive juste à l'heure", e: { froid: 3 } },
        { l: "Quelques balles ou quelques putts", e: { froid: 1, plan: 2 } },
        { l: "Un vrai échauffement", e: { tension_d: 2, plan: 2 } } ] }
    ],
    causes: [
      { id: "froid", t: "Pas d'échauffement", p: [3, 3, 3, 3],
        pourquoi: "Le corps et le rythme ne sont pas prêts. Les premiers trous servent d'échauffement.",
        verif: "Ton score sur les trois premiers trous est nettement moins bon que sur les suivants.",
        conseil: "Arrive 20 minutes avant ton départ et suis toujours le même échauffement.",
        exos: ["st_echauffement", "pl_avant_partie", "ph_mobilite"] },
      { id: "plan", t: "Pas de plan pour les premiers trous", p: [2.5, 2.5, 2.5, 2.5],
        pourquoi: "Attaquer d'entrée avec le driver et viser les drapeaux expose aux gros scores avant d'avoir trouvé son rythme.",
        verif: "Tes premiers trous comportent souvent une pénalité.",
        conseil: "Joue prudent sur les trois premiers trous : club de sécurité et centre des greens.",
        exos: ["st_trois_premiers", "st_carte"] },
      { id: "tension_d", t: "Tension au départ du 1", p: [2, 2, 2.5, 2.5],
        pourquoi: "Le regard des autres et l'envie de bien commencer crispent le premier swing.",
        verif: "Ton premier départ est plus mauvais que les suivants, même échauffé.",
        conseil: "Respire, puis déroule ta routine sans rien y ajouter.",
        exos: ["st_respiration", "st_routine"] }
    ] },

  { id: "cata", d: "strategie", famille: "Sur le parcours", niv: [1, 4],
    t: "Trous catastrophes",
    desc: "Un mauvais coup en entraîne d'autres et le trou s'envole.",
    questions: [
      { id: "apres", q: "Après un coup raté, que fais-tu le plus souvent ?", o: [
        { l: "Je tente de rattraper le coup perdu", e: { heros: 3 } },
        { l: "Je m'énerve et je joue vite", e: { emotion: 3 } },
        { l: "Je remets en jeu, mais je rate encore", e: { distances: 2, heros: 1 } } ] }
    ],
    causes: [
      { id: "heros", t: "Coups de récupération trop ambitieux", p: [3, 3, 3, 2.5],
        pourquoi: "Le coup difficile tenté pour effacer l'erreur échoue le plus souvent et double la perte.",
        verif: "Tes gros scores comportent presque toujours deux mauvais coups de suite.",
        conseil: "Après un coup raté, joue le coup le plus simple pour revenir sur le fairway.",
        exos: ["st_remise", "st_par_perso", "st_cible_large"] },
      { id: "emotion", t: "Enchaînement émotionnel", p: [2.5, 2.5, 2.5, 2.5],
        pourquoi: "L'agacement accélère le rythme et supprime la routine.",
        verif: "Après une erreur, tu joues le coup suivant plus vite que d'habitude.",
        conseil: "Donne-toi dix pas pour évacuer, puis reviens à ta routine.",
        exos: ["st_dix_pas", "st_respiration", "st_routine"] },
      { id: "distances", t: "Distances de clubs surestimées", p: [2, 2.5, 2, 1.5],
        pourquoi: "Tu choisis le club d'après ton meilleur coup. La balle reste courte, souvent dans un obstacle.",
        verif: "Tes attaques de green ratées finissent plus souvent courtes que longues.",
        conseil: "Choisis le club d'après ta distance moyenne.",
        exos: ["fe_distances", "st_club_plus"] }
    ] },

  { id: "transfert_s", d: "strategie", famille: "Sur le parcours", niv: [1, 4],
    t: "Bon au practice, moins bon sur le parcours",
    desc: "Les coups réussis à l'entraînement ne sortent pas en partie.",
    questions: [
      { id: "practice", q: "Comment t'entraînes-tu au practice ?", o: [
        { l: "Beaucoup de balles avec le même club", e: { bloc: 3 } },
        { l: "Je change de club, mais sans routine", e: { routine_s: 3 } },
        { l: "Je varie et je fais ma routine", e: { enjeu: 3 } } ] }
    ],
    causes: [
      { id: "bloc", t: "Entraînement trop répétitif", p: [3, 3, 3, 3],
        pourquoi: "Enchaîner trente balles avec le même club crée un rythme qui n'existe pas sur le parcours, où chaque coup est unique.",
        verif: "Ta première balle avec un club est souvent ratée, les suivantes sont bonnes.",
        conseil: "Change de club et de cible à chaque balle pendant la moitié de ta séance.",
        exos: ["fe_aleatoire", "fe_parcours", "dr_neuf_departs", "we_hasard"] },
      { id: "routine_s", t: "Pas de routine commune", p: [2.5, 2.5, 2.5, 2.5],
        pourquoi: "Si tu ne te prépares pas de la même façon au practice et sur le parcours, tu entraînes un autre geste.",
        verif: "Au practice, tu enchaînes les balles sans te replacer derrière la balle.",
        conseil: "Fais ta routine complète sur une balle sur trois au practice.",
        exos: ["st_routine", "fe_aleatoire", "pc_routine"] },
      { id: "enjeu", t: "Aucun enjeu à l'entraînement", p: [2, 2, 2.5, 2.5],
        pourquoi: "Un coup raté au practice ne coûte rien. Sur le parcours, chaque balle compte.",
        verif: "Tu ne notes jamais de score à l'entraînement.",
        conseil: "Termine chaque séance par un exercice noté.",
        exos: ["dr_fairway", "ap_approche_putt", "pc_cadran", "pl_neuf_trous"] }
    ] },

  { id: "penalites", d: "strategie", famille: "Sur le parcours", niv: [1, 4],
    t: "Trop de pénalités",
    desc: "Balles perdues, hors-limites, obstacles d'eau : plusieurs coups par partie.",
    questions: [
      { id: "ou", q: "D'où viennent-elles surtout ?", o: [
        { l: "Des mises en jeu", e: { club_dep: 3, cible: 2 } },
        { l: "Des attaques de green", e: { drapeau: 3 } },
        { l: "Des coups de récupération", e: { recup: 3 } } ] }
    ],
    causes: [
      { id: "club_dep", t: "Driver joué par habitude", p: [3, 3, 2.5, 2],
        pourquoi: "Le driver est le club le plus long et le plus dispersé. Sur un trou étroit, il coûte plus qu'il ne rapporte.",
        verif: "Tu sors le driver sur tous les par 4 et par 5, sans te poser la question.",
        conseil: "Sur les trous étroits, joue le club qui met la balle en jeu 8 fois sur 10.",
        exos: ["dr_club_secu", "st_carte", "dr_fairway"] },
      { id: "cible", t: "Cibles trop étroites", p: [2.5, 2.5, 3, 3],
        pourquoi: "Tu vises comme si ta balle allait partir droit. Ton mauvais coup habituel finit dans l'obstacle.",
        verif: "Tes pénalités arrivent presque toujours du même côté.",
        conseil: "Décale ta cible pour que ton mauvais coup reste jouable.",
        exos: ["st_cible_large", "dr_tee_cote", "dr_dispersion", "dr_club_secu", "st_par_perso"] },
      { id: "drapeau", t: "Tu vises les drapeaux", p: [2, 2.5, 2.5, 2.5],
        pourquoi: "Un drapeau placé près d'un bord laisse très peu de marge. Rater du mauvais côté coûte une pénalité ou un bunker.",
        verif: "Tes attaques ratées finissent souvent du côté du drapeau, hors du green.",
        conseil: "Vise le centre du green, quelle que soit la position du drapeau.",
        exos: ["st_centre_green", "st_club_plus"] },
      { id: "recup", t: "Récupérations risquées", p: [2, 2, 2, 2],
        pourquoi: "Depuis les arbres ou le rough épais, le coup vers le green réussit rarement.",
        verif: "Tes pénalités suivent souvent un premier coup déjà raté.",
        conseil: "Remets la balle sur le fairway par le chemin le plus court.",
        exos: ["st_remise", "st_dix_pas"] }
    ] }
];

if (typeof module !== "undefined") { module.exports = { SYMPTOMES }; }
