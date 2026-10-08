/* Pixel Heart (nonogram). The 5 puzzles are built in (star, key, R2, envelope, pixel heart with a small R2). To change them, add
   "puzzles": a "# Name" line then rows of # and . for each puzzle, separated by a line ---  (each must have exactly ONE solution; tests/modes3.test.js checks that).
   colors      the picture colour of each puzzle (hex)      finalText   the message shown after the heart
   hintsPerPuzzle (3)   hints3 / hints2   hints used in total for 3 / 2 stars */
/* howTo = the "COMMENT JOUER" window (French): goal, 2-4 steps (max 12 words), phone, desktop, tip. It opens by itself the first time and with the ? button. */
R2.register("gamecontent", "nonogram", {
  "howTo": {
      "goal": "Remplis la grille pour faire apparaître l'image.",
      "steps": [
          "Les chiffres donnent les cases remplies de la ligne ou colonne.",
          "Touche une case pour la remplir.",
          "Marque d'une croix les cases que tu sais vides."
      ],
      "phone": "Appui long ou bouton X pour marquer une case vide. Glisse pour peindre.",
      "desktop": "Clique pour remplir, X pour marquer, Z pour annuler, H pour un indice.",
      "tip": "Tu as 3 indices par grille. Commence par les plus grands chiffres."
  },
  "finalText": "You found the heart."
});
