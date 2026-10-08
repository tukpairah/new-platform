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
		title: "",
		message: "",
		signature: "",
		image: "",
		caption: "",
		iconClosed: "./icons/present.png",
		iconOpened: "./icons/present.png",
	},
});
