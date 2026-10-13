/* Message (Day 7; the id stays "cipher"). Fill in (or use the admin):
   lines       the message in pieces, ONE sentence per line (about 5 lines, 4 to 12 words each). The words are scattered; she puts them back in order. The last line is the finale.
   afterText   a line shown under the finished message          hintsPerGame (3), errors3 / errors2   mistakes + hints allowed for 3 / 2 stars */
/* howTo = the "COMMENT JOUER" window (French): goal, 2-4 steps (max 12 words), phone, desktop, tip. It opens by itself the first time and with the ? button. */
R2.register("gamecontent", "cipher", {
  "howTo": {
      "goal": "R2 apporte un message en morceaux : remets les mots dans l'ordre.",
      "steps": [
          "Touche les mots l'un après l'autre pour refaire la phrase.",
          "Touche un mot placé pour le remettre en bas.",
          "Le bouton Indice place le prochain bon mot."
      ],
      "phone": "Touche les mots pour les placer sur la ligne du haut.",
      "desktop": "Clique sur les mots pour les placer, ou pour les retirer.",
      "tip": "Cherche d'abord le début de la phrase : la majuscule t'aide."
  },
  "lines": "Je ne savais pas que cette personne serait toi.\nTu n’as pas besoin d’être parfaite pour être précieuse à mes yeux.\nJe veux construire une vie avec la personne que j’aime.\nJe suis tellement heureux que nos chemins se soient croisés.\nJoyeux anniversaire, mon amour.",
  "afterText": ""
});
