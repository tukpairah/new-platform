/* Day 7. The Birthday Pass step of this day ("pass") has these fields (all optional, empty = nothing / the drawn default):
     title       the name on the card, e.g. "Boot Sequence"
     message     the letter she reads after opening the step. Separate paragraphs with a blank line (\n\n inside the quotes)
     signature   one line under the letter, centred
     image       an optional photo shown in the letter, e.g. "img/days/day7.jpg"      caption   its small caption
     iconClosed  the picture on the card BEFORE she opens it   iconOpened  the picture AFTER (square PNG with transparency; "" = the drawn default)
   The app loads this file only when day 7 has come. */
R2.register("day", 7, {
	phrase: { fr: "Joyeux anniversaire, mon amour. Je t'aime.", ru: "" },
	facts: [
		{ fr: "Son mentor le soutient toujours et a toujours cru qu'il rencontrerait une fille formidable comme toi. Ton chéri a attendu, et lui a souvent demandé où était sa moitié. Maintenant qu'il l'a trouvée, il ne veut qu'une chose : rendre votre relation plus forte." },
	],
	pass: {
		title: "Joyeux anniversaire, Любимая!",
		message: "J’ai pris énormément de plaisir à créer cette plateforme pour toi, en faisant attention à chaque petit détail. J’espère que tu as apprécié le résultat, que tu as aimé ce design et que tu as pris autant de plaisir à découvrir cette idée que j’en ai eu à la préparer. Merci d’avoir suivi ce parcours jusqu’ici. But that’s not all! D’autres surprises que j’ai préparées pour toi t’attendent encore. J’espère que tu réussiras à toutes les trouver ! Je veux aussi te dire quelque chose d’important. Malgré nos incompréhensions et les difficultés que nous rencontrons parfois, nous arrivons toujours à nous retrouver, à nous comprendre et à trouver des compromis. C’est une qualité précieuse, surtout quand on vient de cultures différentes, avec des mentalités, des habitudes et des façons de voir les choses qui ne sont pas toujours les mêmes. Je sais que tout n’est pas toujours facile, mais je suis heureux que nous continuions à faire des efforts l’un pour l’autre. Je t’aime malgré les difficultés, et même à travers elles. N’oublie jamais que mon amour pour toi ne fait que grandir. ❤️ 5/7",
		signature: "– seniń jigitiń",
		image: "",
		caption: "",
		iconClosed: "./icons/present.png",
		iconOpened: "./icons/present.png",
	},
});
