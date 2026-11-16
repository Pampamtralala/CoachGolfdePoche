/* ============================================================
   DONNÉES DE BASE : paliers, domaines, lieux, indicateurs, objectifs
   Tout le contenu de l'appli vit dans des données, pas dans le code.
   Jetons de latéralité dans les textes : {gf} {gm} = gauche, {df} {dm} = droite/droit
   (inversés automatiquement pour un joueur gaucher).
   ============================================================ */

const PALIERS = [
  { n: 1, nom: "Lancer le jeu", plage: "Index 54 à 36",
    resume: "À ce stade, un contact régulier fait gagner plus de coups que n'importe quel réglage fin.",
    focus: ["Lever la balle avec un contact régulier", "Mettre la balle en jeu au départ, même sans driver", "Approches roulées simples", "Deux putts par green"],
    plusTard: ["Les effets (draw, fade)", "Les coups levés au sand wedge", "La recherche de distance au driver"] },
  { n: 2, nom: "Gagner en régularité", plage: "Index 36 à 24",
    resume: "Le score se joue sur les coups ratés : moins de grattes, moins de pénalités, moins de 3-putts.",
    focus: ["Un contact balle puis sol répétable avec les fers", "Un club de départ fiable", "Sortir du bunker du premier coup", "Des approches qui finissent sur le green", "Le dosage des putts longs"],
    plusTard: ["Le travail des trajectoires", "Les coups spéciaux autour du green"] },
  { n: 3, nom: "Scorer", plage: "Index 24 à 12",
    resume: "Le contact est là. Les coups se gagnent maintenant à moins de 80 m du trou et dans les choix de jeu.",
    focus: ["Des distances de wedge connues entre 30 et 80 m", "Les putts de 1 à 3 m", "Viser large et éviter les pénalités", "Rentrer en deux coups autour du green", "Réduire la dispersion au départ"],
    plusTard: ["Gagner dix mètres au driver", "Les effets forcés"] },
  { n: 4, nom: "Affiner", plage: "Index inférieur à 12",
    resume: "Chaque coup gagné demande de la précision : trajectoire choisie, dispersion réduite, pars sauvés.",
    focus: ["La maîtrise de la trajectoire de balle", "La dispersion aux fers", "Sauver le par autour du green", "Les putts de 2 à 4 m", "La gestion des trous clés"],
    plusTard: ["Une refonte du swing en pleine saison"] }
];

const DOMAINES = [
  { id: "drive",      nom: "Mise en jeu",          court: "Départ" },
  { id: "fers",       nom: "Jeu de fers",          court: "Fers" },
  { id: "wedge",      nom: "Wedging, 30 à 80 m",   court: "Wedging" },
  { id: "approche",   nom: "Approches",            court: "Approches" },
  { id: "bunker",     nom: "Bunker",               court: "Bunker" },
  { id: "putt_court", nom: "Putting court",        court: "Putts courts" },
  { id: "putt_long",  nom: "Putting long",         court: "Putts longs" },
  { id: "strategie",  nom: "Stratégie et mental",  court: "Stratégie" },
  { id: "physique",   nom: "Physique",             court: "Physique", transversal: true }
];

/* Poids de chaque domaine sur le score, par palier (1 à 3). */
const IMPACT = {
  drive:      [3,   3,   2.5, 2.5],
  fers:       [3,   2.5, 2.5, 3],
  wedge:      [1,   1.5, 2.5, 2.5],
  approche:   [2,   2.5, 2.5, 2.5],
  bunker:     [1,   1.5, 1.5, 1.5],
  putt_court: [1.5, 2,   2.5, 2.5],
  putt_long:  [2,   2,   2,   1.5],
  strategie:  [1,   1.5, 2.5, 2.5]
};

const LIEUX = [
  { id: "practice", nom: "Practice",               aide: "Pour le grand jeu et le wedging." },
  { id: "putting",  nom: "Putting green",          aide: "Pour les putts courts et le dosage." },
  { id: "zone",     nom: "Zone d'approche",        aide: "Un green d'entraînement où l'on peut faire des approches." },
  { id: "sable",    nom: "Bunker d'entraînement",  aide: "Pour les sorties de bunker." },
  { id: "parcours", nom: "Parcours",               aide: "Tu joues au moins une fois de temps en temps." },
  { id: "maison",   nom: "Maison ou jardin",       aide: "Un tapis, une moquette ou un coin d'herbe." }
];

const TYPES = {
  technique: "Technique",
  dosage: "Dosage",
  jeu: "Jeu",
  test: "Test",
  routine: "Routine"
};

/* Indicateurs déclaratifs. rep = repère indicatif pour un joueur de chaque palier.
   sens "haut" : plus c'est élevé, mieux c'est. sens "bas" : l'inverse. */
const INDICATEURS = [
  { id: "drive_jeu", d: "drive", groupe: "coups", max: 10, sens: "haut", rep: [4, 6, 7, 8],
    nom: "Mises en jeu jouables", unite: "sur 10",
    q: "Sur 10 mises en jeu, combien restent jouables, sans pénalité ni coup de recentrage ?",
    aide: "Compte avec le club que tu joues le plus souvent au départ." },
  { id: "fers_contact", d: "fers", groupe: "coups", max: 10, sens: "haut", rep: [4, 6, 7, 8],
    nom: "Contacts propres au fer 7", unite: "sur 10",
    q: "Au practice, sur 10 coups de fer 7, combien sont bien contactés ?",
    aide: "Bien contacté : la balle se lève et parcourt sa distance habituelle." },
  { id: "wedge_green", d: "wedge", groupe: "coups", max: 10, sens: "haut", rep: [2, 4, 6, 8],
    nom: "Coups de 50 m sur le green", unite: "sur 10",
    q: "Sur 10 coups de 50 m environ, combien finissent sur le green ?",
    aide: "" },
  { id: "app_proche", d: "approche", groupe: "coups", max: 10, sens: "haut", rep: [2, 4, 5, 7],
    nom: "Approches à moins de 3 m", unite: "sur 10",
    q: "Sur 10 petites approches en bord de green, combien finissent à moins de 3 m du trou ?",
    aide: "Trois mètres, c'est environ trois grands pas." },
  { id: "bunker_sortie", d: "bunker", groupe: "coups", max: 10, sens: "haut", rep: [2, 4, 6, 8],
    nom: "Sorties de bunker sur le green", unite: "sur 10",
    q: "Sur 10 sorties de bunker de green, combien finissent sur le green ?",
    aide: "" },
  { id: "putt_court", d: "putt_court", groupe: "coups", max: 10, sens: "haut", rep: [4, 5, 6, 7],
    nom: "Putts d'1,5 m rentrés", unite: "sur 10",
    q: "Sur 10 putts d'1,5 m, combien rentrent ?",
    aide: "Un mètre cinquante, c'est à peu près une longueur et demie de putter." },
  { id: "fers_gir", d: "fers", groupe: "parties", max: 18, sens: "haut", rep: [1, 3, 5, 9],
    nom: "Greens en régulation", unite: "sur 18",
    q: "Sur 18 trous, combien de greens touches-tu en régulation ?",
    aide: "En régulation : sur le green en 1 coup sur un par 3, 2 sur un par 4, 3 sur un par 5." },
  { id: "putt_3", d: "putt_long", groupe: "parties", max: 18, sens: "bas", rep: [6, 4, 3, 2],
    nom: "Greens à 3 putts ou plus", unite: "sur 18",
    q: "Sur 18 trous, sur combien de greens fais-tu 3 putts ou plus ?",
    aide: "" },
  { id: "strat_penal", d: "strategie", groupe: "parties", max: 20, sens: "bas", rep: [6, 4, 3, 1],
    nom: "Coups de pénalité", unite: "par partie",
    q: "Sur 18 trous, combien de coups de pénalité prends-tu ?",
    aide: "Balles perdues, hors-limites, obstacles d'eau, balles injouables." },
  { id: "strat_cata", d: "strategie", groupe: "parties", max: 18, sens: "bas", rep: [9, 5, 3, 1],
    nom: "Trous à triple bogey ou pire", unite: "sur 18",
    q: "Sur 18 trous, combien de trous finis-tu en triple bogey ou pire ?",
    aide: "" }
];

const OBJECTIFS = [
  { id: "regularite",  t: "Jouer plus régulièrement",          s: "Moins de trous ratés, plus de plaisir sur le parcours." },
  { id: "score",       t: "Passer un cap de score ou d'index", s: "Le plan suit strictement tes priorités." },
  { id: "defaut",      t: "Corriger un défaut précis",         s: "Le plan donne plus de place aux exercices correctifs." },
  { id: "competition", t: "Préparer une compétition",          s: "Davantage d'exercices notés et de mises en situation." }
];

const THEMES_SEMAINE = ["Bilan et fondamentaux", "Construction", "Transfert vers le jeu", "Performance et bilan"];

/* Missions de parcours proposées par défaut, par palier. */
const MISSIONS_DEFAUT = {
  1: ["st_par_perso", "st_putts_compte", "st_remise", "st_trois_clubs"],
  2: ["st_club_plus", "st_putts_compte", "st_remise", "st_centre_green"],
  3: ["st_centre_green", "st_cible_large", "st_putts_compte", "st_remise"],
  4: ["st_cible_large", "st_centre_green", "st_putts_compte", "st_pire_balle"]
};

/* Mission associée à un domaine prioritaire. */
const MISSION_PAR_DOMAINE = {
  putt_long: "st_putts_compte", putt_court: "st_putts_compte", fers: "st_centre_green",
  drive: "st_cible_large", strategie: "st_remise", wedge: "st_club_plus"
};

if (typeof module !== "undefined") {
  module.exports = { PALIERS, DOMAINES, IMPACT, LIEUX, TYPES, INDICATEURS, OBJECTIFS, THEMES_SEMAINE, MISSIONS_DEFAUT, MISSION_PAR_DOMAINE };
}
