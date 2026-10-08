/* Mot. Fill in (or use the admin):
   rounds   6 lines "WORD|hint" (5 letters, accents ignored). The default last word is COEUR. Hints are shown in French.
   winText / failText / retryText   the small messages      avgThree / avgTwo   average attempts for 3 / 2 stars */
/* howTo = the "COMMENT JOUER" window (French): goal, 2-4 steps (max 12 words), phone, desktop, tip. It opens by itself the first time and with the ? button. */
R2.register("gamecontent", "mot", {
  "rounds": [
      "PARIS|La ville où tu vis. Elle est souvent dans mes pensées.",
      "APPEL|On en lance un pour se voir malgré les kilomètres.",
      "BISOU|Petit, doux, inoubliable. Notre premier remonte au 7 mars 2026.",
      "AVION|Il traversera le ciel pour nous rapprocher.",
      "FUTUR|On le construit ensemble, pas dans un jeu vidéo.",
      "COEUR|Il bat un peu plus fort quand je pense à toi."
  ],
  "howTo": {
      "goal": "Devine le mot français de 5 lettres en 6 essais.",
      "steps": [
          "Écris un mot de 5 lettres, puis valide.",
          "Vert : bien placée. Jaune : mal placée. Gris : absente.",
          "Il y a 6 mots à trouver. L'indice est sous le titre."
      ],
      "phone": "Utilise le clavier affiché à l'écran.",
      "desktop": "Tape sur ton clavier : Entrée valide, Retour arrière efface.",
      "tip": "Les accents ne comptent pas. Si tu rates un mot, tu peux le retenter."
  }
});
