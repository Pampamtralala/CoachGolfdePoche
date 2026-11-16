/* ============================================================
   DONNÉES DES OUTILS : carnet de distances, défis, repères des coups gagnés.
   ============================================================ */

/* Clubs du carnet, du plus long au plus court.
   fam : b = bois et hybrides, f = fers, w = wedges. */
const CLUBS = [
  { id: "dr", nom: "Driver",              court: "Driver", fam: "b" },
  { id: "b3", nom: "Bois 3",              court: "Bois 3", fam: "b" },
  { id: "b5", nom: "Bois 5",              court: "Bois 5", fam: "b" },
  { id: "b7", nom: "Bois 7",              court: "Bois 7", fam: "b" },
  { id: "h3", nom: "Hybride 3",           court: "Hyb. 3", fam: "b" },
  { id: "h4", nom: "Hybride 4",           court: "Hyb. 4", fam: "b" },
  { id: "h5", nom: "Hybride 5",           court: "Hyb. 5", fam: "b" },
  { id: "f3", nom: "Fer 3",               court: "Fer 3",  fam: "f" },
  { id: "f4", nom: "Fer 4",               court: "Fer 4",  fam: "f" },
  { id: "f5", nom: "Fer 5",               court: "Fer 5",  fam: "f" },
  { id: "f6", nom: "Fer 6",               court: "Fer 6",  fam: "f" },
  { id: "f7", nom: "Fer 7",               court: "Fer 7",  fam: "f" },
  { id: "f8", nom: "Fer 8",               court: "Fer 8",  fam: "f" },
  { id: "f9", nom: "Fer 9",               court: "Fer 9",  fam: "f" },
  { id: "pw", nom: "Pitching wedge",      court: "PW",     fam: "w", petit: "pitching" },
  { id: "gw", nom: "Gap wedge, 50 à 52°", court: "GW",     fam: "w", petit: "50 à 52°" },
  { id: "sw", nom: "Sand wedge, 54 à 56°", court: "SW",    fam: "w", petit: "54 à 56°" },
  { id: "lw", nom: "Lob wedge, 58 à 60°", court: "LW",     fam: "w", petit: "58 à 60°" }
];

/* Matrice de wedges : les trois amplitudes de l'exercice de l'horloge. */
const WEDGES = ["pw", "gw", "sw", "lw"];
const AMPLITUDES = [
  { id: "a1", nom: "7 h 30" },
  { id: "a2", nom: "9 h" },
  { id: "a3", nom: "10 h 30" }
];
/* Fenêtre à couvrir et écart au-delà duquel on signale un trou, en mètres. */
const WEDGE_FENETRE = [30, 80];
const WEDGE_TROU = 12;

/* Défis. mode "serie" : réussites consécutives, un raté remet à zéro.
   mode "compte" : n coups, on compte les réussites.
   ex : exercice dont le défi alimente le score (et, à travers lui, le bilan). */
const DEFIS = [
  { id: "onze", d: "putt_court", lieu: "putting", mode: "serie", chrono: true, t: "Onze d'affilée",
    but: "Rentrer onze putts d'1,5 m de suite. Cinq pieds : la distance qui sauve un score.",
    regles: ["Pose-toi à 1,5 m du trou et change de position après chaque putt rentré.",
      "Fais ta routine complète avant chaque putt.",
      "Un raté remet la série à zéro : c'est un nouvel essai."],
    oui: "Rentré", non: "Raté", lib: "putts rentrés de suite", coup: "Putts joués",
    niveaux: [{ cible: 5, nom: "5 de suite" }, { cible: 8, nom: "8 de suite" }, { cible: 11, nom: "11 de suite" }] },
  { id: "cadran", d: "putt_court", lieu: "putting", mode: "serie", ex: "pc_cadran", chrono: true, t: "Le tour du cadran (circle drill)",
    but: "Rentrer toutes les balles posées en cercle autour du trou, sans en rater une.",
    regles: ["Pose les balles en cercle autour d'un trou, à la distance du niveau.",
      "Rentre-les toutes à la suite, dans l'ordre du cadran.",
      "Un raté : tu reposes toutes les balles et tu repars de zéro."],
    oui: "Rentré", non: "Raté", lib: "balles rentrées de suite", coup: "Putts joués",
    niveaux: [{ cible: 6, nom: "6 balles à 1 m" }, { cible: 8, nom: "8 balles à 1 m" }, { cible: 8, nom: "8 balles à 1,5 m" }] },
  { id: "vingt", d: "putt_court", lieu: "putting", mode: "compte", n: 20, chrono: true, t: "Vingt putts d'1 m",
    but: "Vingt putts d'1 m, chronométrés, en changeant de position à chaque fois. Les putts qui sauvent les pars, avec un peu de pression.",
    regles: ["Pose-toi à un mètre du trou, en quatre positions autour : devant, derrière, à gauche, à droite.",
      "Change de position après chaque putt et fais une routine courte.",
      "Le chronomètre part au premier putt : vise la régularité avant la vitesse."],
    oui: "Rentré", non: "Raté", lib: "putts rentrés", coup: "Putts joués",
    niveaux: [{ cible: 14, nom: "14 sur 20" }, { cible: 17, nom: "17 sur 20" }, { cible: 19, nom: "19 sur 20" }] },
  { id: "putts10", d: "putt_court", lieu: "putting", mode: "compte", n: 10, ex: "pc_test10", chrono: true, t: "Dix putts d'1,5 m",
    but: "Dix putts d'1,5 m, un seul essai par position. Ton score met à jour ton bilan.",
    regles: ["Choisis un trou sur une pente légère.",
      "Change de position autour du trou à chaque putt.",
      "Fais ta routine avant chaque putt."],
    oui: "Rentré", non: "Raté", lib: "putts rentrés", coup: "Putts joués",
    niveaux: [{ cible: 5, nom: "5 sur 10" }, { cible: 7, nom: "7 sur 10" }, { cible: 9, nom: "9 sur 10" }] },
  { id: "zone", d: "putt_long", lieu: "putting", mode: "compte", n: 10, ex: "pl_test_zone", t: "La zone de sécurité",
    but: "Dix putts longs à laisser dans la zone autour du trou. Le dosage avant la ligne.",
    regles: ["Joue dix putts longs, en changeant de trou ou de position à chaque fois.",
      "Une seule balle par putt, avec ta routine.",
      "Compte la balle si elle finit dans la zone autour du trou."],
    oui: "Dans la zone", non: "Dehors", lib: "balles dans la zone", coup: "Putts joués",
    niveaux: [{ cible: 5, nom: "5 sur 10" }, { cible: 7, nom: "7 sur 10" }, { cible: 9, nom: "9 sur 10" }] },
  { id: "approches", d: "approche", lieu: "zone", mode: "compte", n: 10, ex: "ap_test10", t: "Dix approches",
    but: "Dix approches en bord de green à poser à moins de 3 m du trou. Ton score met à jour ton bilan.",
    regles: ["Pose dix balles en bord de green, à 10 ou 15 m du trou, sur un lie correct.",
      "Joue-les une par une, avec le club de ton choix.",
      "Trois mètres, c'est environ trois grands pas."],
    oui: "À moins de 3 m", non: "Plus loin", lib: "balles à moins de 3 m", coup: "Approches jouées",
    niveaux: [{ cible: 3, nom: "3 sur 10" }, { cible: 5, nom: "5 sur 10" }, { cible: 7, nom: "7 sur 10" }] },
  { id: "sorties", d: "bunker", lieu: "sable", mode: "compte", n: 10, ex: "bu_test10", t: "Dix sorties de bunker",
    but: "Dix sorties de bunker à poser sur le green. Ton score met à jour ton bilan.",
    regles: ["Pose dix balles sur un sable correct, à 10 ou 15 m du drapeau.",
      "Joue-les une par une avec ta routine.",
      "Compte la balle si elle finit sur le green."],
    oui: "Sur le green", non: "Raté", lib: "balles sur le green", coup: "Sorties jouées",
    niveaux: [{ cible: 3, nom: "3 sur 10" }, { cible: 5, nom: "5 sur 10" }, { cible: 7, nom: "7 sur 10" }] },
  { id: "cinquante", d: "wedge", lieu: "practice", mode: "compte", n: 10, ex: "we_test50", t: "Dix balles à 50 m",
    but: "Dix balles à poser sur un green imaginaire à 50 m. Ton score met à jour ton bilan.",
    regles: ["Choisis une cible à 50 m environ et imagine un green de 15 m de diamètre autour.",
      "Joue dix balles avec ta routine.",
      "Compte la balle si elle tombe et reste dans cette zone."],
    oui: "Sur le green", non: "À côté", lib: "balles sur le green", coup: "Balles jouées",
    niveaux: [{ cible: 3, nom: "3 sur 10" }, { cible: 5, nom: "5 sur 10" }, { cible: 7, nom: "7 sur 10" }] },
  { id: "fairway", d: "drive", lieu: "practice", mode: "compte", n: 10, ex: "dr_fairway", t: "Le fairway imaginaire",
    but: "Dix mises en jeu entre deux repères, avec ta routine complète. Ton score met à jour ton bilan.",
    regles: ["Choisis deux repères au fond du practice pour délimiter un fairway.",
      "Joue dix mises en jeu, une balle à la fois, avec ta routine complète.",
      "Compte la balle si elle finit entre les deux repères."],
    oui: "Dans le fairway", non: "Dehors", lib: "balles dans le fairway", coup: "Mises en jeu",
    niveaux: [{ cible: 5, nom: "5 sur 10" }, { cible: 7, nom: "7 sur 10" }, { cible: 9, nom: "9 sur 10" }] }
];

/* Coups gagnés : repères par index, cohérents avec les repères des paliers.
   u   : mises en jeu ratées qui coûtent le green, sur 18 trous
   gir : greens en régulation, sur 18 trous
   pg  : putts par green touché en régulation
   pm  : putts par green manqué (après l'approche)
   x   : coups de pénalité, sur 18 trous
   Le rattrapage (coups joués en plus pour rejoindre le green) se déduit du score moyen.
   Ce sont des ordres de grandeur, à affiner avec les résultats des joueurs. */
const SG_INDEX = [0, 5, 10, 15, 20, 25, 30, 36, 45, 54];
const SG_REPERES = {
  u:   [2.7, 3.4, 4.2, 5.0, 5.7, 6.5, 7.2, 8.6, 10.8, 12.6],
  gir: [11, 9.3, 7.2, 5.6, 4.6, 3.7, 3.0, 2.0, 1.0, 0.5],
  pg:  [1.95, 2.00, 2.05, 2.10, 2.17, 2.23, 2.30, 2.38, 2.50, 2.60],
  pm:  [1.50, 1.60, 1.70, 1.78, 1.86, 1.94, 2.02, 2.10, 2.20, 2.30],
  x:   [0.6, 0.9, 1.6, 2.5, 3.1, 3.6, 4.0, 4.8, 6.0, 7.0],
  /* Repères ajoutés avec la carte de score.
     s    : score moyen au-dessus du par, sur 18 trous
     p3   : greens à 3 putts ou plus, sur 18 trous
     cata : trous à triple bogey ou pire, sur 18 trous
     sv   : pars sauvés, en % des greens manqués */
  s:    [5, 9.5, 15, 21, 27, 33, 39, 46, 57, 68],
  p3:   [1.5, 2, 2.5, 3, 3.4, 3.8, 4.2, 5, 6, 7],
  cata: [0.4, 0.9, 1.6, 2.4, 3.3, 4.1, 5, 6.5, 9, 11.5],
  sv:   [50, 40, 31, 24, 18, 13, 10, 7, 4, 2]
};
/* Putts attendus selon la longueur du premier putt (rangs 1 à 4 de PUTT1),
   pour des joueurs d'index 0, 18, 36 et 54. */
const SG_PUTT1 = {
  index: [0, 18, 36, 54],
  e: [null, [1.02, 1.05, 1.10, 1.15], [1.47, 1.62, 1.76, 1.88], [1.88, 2.00, 2.15, 2.28], [2.12, 2.30, 2.52, 2.70]]
};
/* Index proposés pour le joueur cible. */
const SG_CIBLES = [0, 5, 10, 15, 20, 25, 30, 36, 45];
/* Coût d'une mise en jeu ratée, en plus du green manqué (coup de recentrage, distance perdue). */
const SG_RECENTRAGE = 0.5;
const SG_SECTEURS = [
  { id: "depart",  nom: "Mise en jeu",       d: "drive" },
  { id: "attaque", nom: "Attaques de green", d: "fers" },
  { id: "petit",   nom: "Petit jeu",         d: "approche" },
  { id: "putting", nom: "Putting",           d: "putt_long" },
  { id: "penal",   nom: "Pénalités",         d: "strategie" },
  { id: "rattrapage", nom: "Rattrapage",     d: "strategie" }
];

/* ---------- Carte de score et saisie détaillée ----------
   Rangs des réponses facultatives d'un trou : 0 = non noté. */
const COTES = ["", "À gauche", "Courte", "À droite"];
const CLUBS_DEPART = ["", "Driver", "Bois", "Hybride", "Fer"];
const PUTT1 = ["", "< 1 m", "1 à 3 m", "3 à 8 m", "> 8 m"];

/* Statistiques suivies face au joueur cible. besoin "score" : demande un score par trou. */
const OBJ_STATS = [
  { id: "score", nom: "Score",                        unite: "au-dessus du par",        sens: "bas",  seuil: 1,   besoin: "score" },
  { id: "jeu",   nom: "Mises en jeu jouables",        unite: "sur 18",                  sens: "haut", seuil: 1 },
  { id: "gir",   nom: "Greens en régulation",         unite: "sur 18",                  sens: "haut", seuil: 0.7 },
  { id: "sv",    nom: "Pars sauvés",                  unite: "en % des greens manqués", sens: "haut", seuil: 7,   besoin: "score", entier: true },
  { id: "putts", nom: "Putts",                        unite: "par partie",              sens: "bas",  seuil: 1 },
  { id: "p3",    nom: "Greens à 3 putts ou plus",     unite: "sur 18",                  sens: "bas",  seuil: 0.5 },
  { id: "pen",   nom: "Coups de pénalité",            unite: "par partie",              sens: "bas",  seuil: 0.5 },
  { id: "cata",  nom: "Trous à triple bogey ou pire", unite: "sur 18",                  sens: "bas",  seuil: 0.5, besoin: "score" }
];
/* Index estimé : nombre de scores retenus et ajustement, selon le nombre de parties
   (barème du World Handicap System pour moins de 20 scores). */
const WHS_BAREME = [null, null, null, [1, -2], [1, -1], [1, 0], [2, -1], [2, 0], [2, 0], [3, 0], [3, 0], [3, 0],
  [4, 0], [4, 0], [4, 0], [5, 0], [5, 0], [6, 0], [6, 0], [7, 0], [8, 0]];
/* Trou noir : au moins ce nombre de passages, et ce surcoût par rapport au trou moyen du joueur. */
const NOIR_PASSAGES = 2;
const NOIR_SURCOUT = 0.5;

if (typeof module !== "undefined") {
  module.exports = { CLUBS, WEDGES, AMPLITUDES, WEDGE_FENETRE, WEDGE_TROU, DEFIS, SG_INDEX, SG_REPERES, SG_PUTT1, SG_CIBLES, SG_RECENTRAGE, SG_SECTEURS, COTES, CLUBS_DEPART, PUTT1, OBJ_STATS, WHS_BAREME, NOIR_PASSAGES, NOIR_SURCOUT };
}
