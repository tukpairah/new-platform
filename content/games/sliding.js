/* Sliding Puzzle. Fill in (or use the admin):
   image     the photo, e.g. "img/games/sliding/photo.jpg" ("" = a drawn pattern with numbers)
   caption   the line shown under the full photo after the last level
   showNumbers  1 = numbers also on the photo tiles      movesThree / movesTwo / timeThree / timeTwo   star limits for levels 1-3 */
/* howTo = the "COMMENT JOUER" window (French): goal, 2-4 steps (max 12 words), phone, desktop, tip. It opens by itself the first time and with the ? button. */
R2.register("gamecontent", "sliding", {
  "howTo": {
      "goal": "Fais glisser les tuiles pour reconstituer la photo.",
      "steps": [
          "Il y a une case vide : pousse les tuiles vers elle.",
          "Remets chaque tuile à sa place.",
          "Le bouton Aperçu te montre la photo complète."
      ],
      "phone": "Touche une tuile, ou fais-la glisser du doigt.",
      "desktop": "Clique sur une tuile, ou utilise les flèches. P montre l'aperçu.",
      "tip": "Commence par la rangée du haut, puis descends."
  },
  "image": "",
  "caption": ""
});
