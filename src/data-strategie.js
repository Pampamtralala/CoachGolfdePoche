/* ============================================================
   RÉGLAGES DE LA STRATÉGIE ET DE L'ANALYSE
   Des ordres de grandeur tirés des règles empiriques courantes : à affiner avec les résultats des joueurs.
   ============================================================ */

/* Étalonnage : un coup plein sous ce pourcentage de la distance habituelle (médiane) est un coup raté. */
const FILTRE_RATE = 0.6;
/* Nombre de coups pour une fourchette fiable ; en dessous, la fourchette est provisoire. */
const FOURCHETTE_MIN = 5;
/* Dispersion estimée tant que la direction des coups n'est pas notée : demi-largeur et demi-profondeur
   qui contiennent 80 % des balles, en part de la distance, selon l'index (0, 10, 20, 36, 54). */
const DISP_INDEX = [0, 10, 20, 36, 54];
const DISP_LARGEUR = [0.05, 0.065, 0.08, 0.10, 0.12];
const DISP_PROFONDEUR = [0.04, 0.05, 0.06, 0.075, 0.09];
/* Écart réduit d'une loi normale qui laisse 10 % de chaque côté : 80 % des balles entre −Z80 et +Z80 écarts-types. */
const Z80 = 1.2816;

/* « Se joue comme » : corrections de la distance brute.
   Vent de face ou de dos, en % de la distance, par force (faible, moyen, fort : environ 10, 20 et 30 km/h).
   Vent de travers : la balle dérive de ce % de la distance, sans changer de longueur.
   Pente : mètres ajoutés par mètre de montée (retirés en descente).
   Température : froid (moins de 10 °C) et chaud (plus de 25 °C), en % de la distance. */
const VENT_FORCES = ["", "Faible", "Moyen", "Fort"];
const VENT_DIRS = [
  { id: "face",    nom: "De face",    pc: [0, 6, 12, 18] },
  { id: "dos",     nom: "De dos",     pc: [0, -3, -6, -9] },
  { id: "gauche",  nom: "De gauche",  pc: [0, 0, 0, 0], derive: [0, 3, 6, 10] },
  { id: "droite",  nom: "De droite",  pc: [0, 0, 0, 0], derive: [0, 3, 6, 10] }
];
const PENTE_PAR_METRE = 1;
const PENTE_MAX = 30;
const TEMPERATURES = [
  { id: "froid",  nom: "Froid",  pc: 2 },
  { id: "normal", nom: "Normal", pc: 0 },
  { id: "chaud",  nom: "Chaud",  pc: -1 }
];

/* Visée anti-pénalité. Taille des greens (profondeur × largeur, en mètres). */
const GREENS = { p: { nom: "Petit", h: 20, w: 16 }, m: { nom: "Moyen", h: 28, w: 22 }, g: { nom: "Grand", h: 36, w: 28 } };
/* Dangers autour du green et coups qu'ils coûtent en plus d'un green manqué sans danger. */
const DANGERS = [
  { id: "bunker", nom: "Bunker",       court: "Bunker",  cout: 0.5 },
  { id: "eau",    nom: "Eau",          court: "Eau",     cout: 1.3 },
  { id: "hl",     nom: "Hors-limites", court: "HL",      cout: 2 }
];
const COTES_GREEN = [
  { id: "g", nom: "à gauche" }, { id: "d", nom: "à droite" }, { id: "c", nom: "court" }, { id: "l", nom: "long" }
];
/* Coups attendus : sur le green, selon la distance au trou ; à côté sans danger, un petit jeu puis deux putts environ. */
const ATTENDU_GREEN = { base: 1.4, parMetre: 0.035 };
const ATTENDU_RATE = 2.4;
/* Position du drapeau sur le green : avant, milieu, fond × gauche, centre, droite, en part de la demi-taille. */
const DRAPEAU_POS = { avant: -0.5, milieu: 0, fond: 0.5, gauche: -0.5, centre: 0, droite: 0.5 };
/* Zone de visée explorée autour du drapeau, en mètres. */
const VISEE_LARGEUR = 25, VISEE_PROFONDEUR = 15;

/* Objectif d'index proposé au joueur. */
const OBJ_INDEX = [0, 5, 8, 10, 12, 15, 18, 20, 24, 28, 30, 36, 45];

/* Repères complémentaires par index (même échelle que SG_INDEX : 0, 5, 10, 15, 20, 25, 30, 36, 45, 54).
   jouable : départs jouables (fairway ou rough d'où l'on peut attaquer), en % des par 4 et par 5
   prox    : longueur moyenne du premier putt sur un green en régulation, en mètres
   sable   : sorties de bunker qui sauvent le par, en %
   double  : doubles approches par partie
   r2, r5  : putts rentrés en un, à moins de 2 m et à moins de 5 m, en % */
const REPERES_PLUS = {
  jouable: [85, 80, 75, 70, 65, 60, 55, 50, 42, 35],
  prox:    [7.5, 8, 8.5, 9, 9.5, 10, 10.5, 11, 12, 13],
  sable:   [40, 32, 25, 20, 15, 12, 9, 6, 4, 2],
  double:  [0.5, 0.9, 1.4, 2, 2.6, 3.2, 3.8, 4.5, 5.5, 6.5],
  r2:      [88, 85, 81, 78, 75, 72, 69, 65, 60, 55],
  r5:      [60, 55, 50, 47, 44, 41, 38, 35, 31, 27]
};
/* Premier putt, nouvelle échelle (trous notés sur 11 cases) : rangs 1 à 5 et longueur retenue pour la proximité. */
const PUTT1B = ["", "< 1 m", "1 à 2 m", "2 à 5 m", "5 à 10 m", "> 10 m"];
const PUTT1B_METRES = [0, 0.5, 1.5, 3.5, 7.5, 13];
/* Putts attendus selon la longueur du premier putt (rangs 1 à 5 de PUTT1B), index 0, 18, 36, 54. */
const SG_PUTT1B = {
  index: [0, 18, 36, 54],
  e: [null, [1.02, 1.05, 1.10, 1.15], [1.30, 1.45, 1.58, 1.70], [1.75, 1.88, 2.02, 2.15], [1.95, 2.08, 2.25, 2.40], [2.15, 2.35, 2.55, 2.72]]
};
/* Secteurs notés sur 100 : mesures retenues et poids. */
const NOTES_SECTEURS = [
  { id: "depart",  nom: "Mise en jeu",       d: "drive" },
  { id: "attaque", nom: "Attaque de green",  d: "fers" },
  { id: "petit",   nom: "Petit jeu",         d: "approche" },
  { id: "putting", nom: "Putting",           d: "putt_court" }
];
/* Les notes demandent au moins ce nombre de trous. */
const NOTES_MIN_TROUS = 27;
/* Erreurs évitables (bits de la case 9 d'un trou). */
const EVIT_DOUBLE = 2, EVIT_PUTT3 = 4;

if (typeof module !== "undefined") {
  module.exports = { FILTRE_RATE, FOURCHETTE_MIN, DISP_INDEX, DISP_LARGEUR, DISP_PROFONDEUR, Z80, VENT_FORCES, VENT_DIRS, PENTE_PAR_METRE, PENTE_MAX, TEMPERATURES,
    GREENS, DANGERS, COTES_GREEN, ATTENDU_GREEN, ATTENDU_RATE, DRAPEAU_POS, VISEE_LARGEUR, VISEE_PROFONDEUR, OBJ_INDEX, REPERES_PLUS, PUTT1B, PUTT1B_METRES, SG_PUTT1B,
    NOTES_SECTEURS, NOTES_MIN_TROUS, EVIT_DOUBLE, EVIT_PUTT3 };
}
