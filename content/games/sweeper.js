/* Heart Sweeper. Fill in (or use the admin):
   levels         3 lines like "8x8:10" (columns x rows : mines)
   loseMessages   friendly lines when the Static gets her      winMessage   shown when a level is cleared
   time3 / time2  total seconds for 3 / 2 stars              retryText    the retry button */
/* howTo = the "COMMENT JOUER" window (French): goal, 2-4 steps (max 12 words), phone, desktop, tip. It opens by itself the first time and with the ? button. */
R2.register("gamecontent", "sweeper", {
  "howTo": {
      "goal": "Découvre toute la grille sans toucher un parasite.",
      "steps": [
          "Un chiffre dit combien de parasites touchent la case.",
          "Marque les parasites avec un drapeau.",
          "Ton premier toucher est toujours sans danger."
      ],
      "phone": "Touche pour ouvrir. Appui long, ou bouton Drapeau, pour marquer.",
      "desktop": "Clic gauche pour ouvrir, clic droit ou F pour marquer.",
      "tip": "Cherche d'abord les cases avec un 1 : elles sont faciles."
  }
});
