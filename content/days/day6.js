/* Day 6. The Birthday Pass step of this day ("pass") has these fields (all optional, empty = nothing / the drawn default):
     title       the name on the card, e.g. "Boot Sequence"
     message     the letter she reads after opening the step. Separate paragraphs with a blank line (\n\n inside the quotes)
     signature   one line under the letter, centred
     image       an optional photo shown in the letter, e.g. "img/days/day6.jpg"      caption   its small caption
     iconClosed  the picture on the card BEFORE she opens it   iconOpened  the picture AFTER (square PNG with transparency; "" = the drawn default)
   The app loads this file only when day 6 has come. */
R2.register("day", 6, {
	phrase: { fr: "Je suis fier de toi, mon amour.", ru: "" },
	facts: [
		{ fr: "Depuis 2023, ton chéri ne dépend plus d'aucun jeu vidéo. Il pense que c'était la bonne décision, même si elle a été dure et a marqué un tournant de son adolescence. En y renonçant, il a commencé à se construire en tant que personne." },
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
