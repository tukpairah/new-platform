/* Beep Echo. Fill in (or use the admin):
   length   rounds to clear (default 12)      lives   (default 3)
   padColors   4 hex colours, one per line     tones   4 frequencies in Hz, one per line
   startInterval / speedUp / minInterval   how fast R2 plays (milliseconds)      introText / listenText / yourTurnText   the small texts */
/* howTo = the "COMMENT JOUER" window (French): goal, 2-4 steps (max 12 words), phone, desktop, tip. It opens by itself the first time and with the ? button. */
R2.register("gamecontent", "echo", {
  "howTo": {
      "goal": "Répète la suite lumineuse de R2.",
      "steps": [
          "Regarde les lumières s'allumer.",
          "Touche les mêmes plots, dans le même ordre.",
          "Chaque manche ajoute un plot. Tu as 3 vies."
      ],
      "phone": "Touche les plots colorés.",
      "desktop": "Clique sur les plots, ou utilise les touches 1, 2, 3 et 4.",
      "tip": "Écoute bien : chaque couleur a sa note."
  }
});
