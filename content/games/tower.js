/* Droid Tower. Fill in (or use the admin):
   goalHeight   blocks to clear (default 30)           blockImage   optional picture for the blocks ("" = drawn droid panels)
   introText    the text on the title screen          colorBody / colorBand   panel colours
   speedBase / speedStep / tolerance / grow / star3 / star2   the difficulty knobs (see the admin form) */
/* howTo = the "COMMENT JOUER" window (French): goal, 2-4 steps (max 12 words), phone, desktop, tip. It opens by itself the first time and with the ? button. */
R2.register("gamecontent", "tower", {
  "howTo": {
      "goal": "Empile les blocs le plus haut possible.",
      "steps": [
          "Touche pour lâcher le bloc.",
          "Ce qui dépasse tombe : le bloc se réduit.",
          "Pose-le parfaitement pour garder toute sa largeur."
      ],
      "phone": "Touche l'écran au bon moment.",
      "desktop": "Appuie sur Espace, ou clique.",
      "tip": "Active l'Assist sur l'écran de départ pour ralentir la grue."
  }
});
