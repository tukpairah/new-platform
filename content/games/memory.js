/* Photo Memory. Fill in (or use the admin):
   photos     6 to 12 picture paths, e.g. "img/games/memory/p1.jpg" (each becomes a pair; if there are fewer than a level needs, drawn R2 icons fill in)
   captions   one per photo, same order; shown when its pair is found ("" = none)
   cardBack   the card back picture ("" = a plain colour, backColor)
   movesThree / movesTwo / timeThree / timeTwo   star limits for level 1, 2, 3 (numbers) */
/* howTo = the "COMMENT JOUER" window (French): goal, 2-4 steps (max 12 words), phone, desktop, tip. It opens by itself the first time and with the ? button. */
R2.register("gamecontent", "memory", {
  "howTo": {
      "goal": "Retrouve toutes les paires de photos.",
      "steps": [
          "Retourne deux cartes.",
          "Si elles sont identiques, elles restent visibles.",
          "Trouve toutes les paires dans les trois niveaux."
      ],
      "phone": "Touche les cartes pour les retourner.",
      "desktop": "Clique sur les cartes, ou utilise les flèches et Entrée.",
      "tip": "Mémorise la place de chaque photo : moins de coups, plus d'étoiles."
  },
  "photos": [],
  "captions": []
});
