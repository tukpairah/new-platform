/* Cipher. Day 7 only. Fill in (or use the admin):
   plaintext   the final message. While it still says [REPLACE...], she plays with sampleText and reads waitText ("The message arrives with the package")
   afterText   a line shown after the message appears         waitText / sampleText   the placeholder texts
   hintsPerGame (3), hints3 / hints2   hints used for 3 / 2 stars */
/* howTo = the "COMMENT JOUER" window (French): goal, 2-4 steps (max 12 words), phone, desktop, tip. It opens by itself the first time and with the ? button. */
R2.register("gamecontent", "cipher", {
  "howTo": {
      "goal": "Déchiffre le message secret de R2.",
      "steps": [
          "Chaque lettre codée cache une autre lettre.",
          "Touche une lettre codée, puis choisis la vraie lettre.",
          "Toutes les lettres identiques se remplissent d'un coup."
      ],
      "phone": "Touche une lettre du message, puis une lettre du clavier.",
      "desktop": "Clique ou tape une lettre. Retour arrière efface, Tab change de lettre.",
      "tip": "Exemple : PIID devient BEEP (les deux I deviennent E). Les 3 indices et « Check » sont gratuits."
  },
  "plaintext": "[REPLACE: final message]",
  "afterText": ""
});
