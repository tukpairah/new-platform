/* Day 1. The Birthday Pass step of this day ("pass") has these fields (all optional, empty = nothing / the drawn default):
     title       the name on the card, e.g. "Boot Sequence"
     message     the letter she reads after opening the step. Separate paragraphs with a blank line (\n\n inside the quotes)
     signature   one line under the letter, centred
     image       an optional photo shown in the letter, e.g. "img/days/day1.jpg"      caption   its small caption
     iconClosed  the picture on the card BEFORE she opens it   iconOpened  the picture AFTER (square PNG with transparency; "" = the drawn default)
   The app loads this file only when day 1 has come. */
/* The other fields of this file: phrase (the Daily Gift message, fr + ru), facts ({ fr } each, in order), quests. */
R2.register("day", 1, {
	phrase: { fr: "Bonjour, mon cœur. Je pense déjà à toi.", ru: "" },
	facts: [
		{ fr: "Le chanteur préféré de ton chéri, c'est Viktor Tsoï. Quand il était petit, son père lui chantait ses chansons, et elles sont restées en lui pour toujours." },
	],
	quests: [
		{ id: "tap", text: "Tap R2 five times", type: "taps", goal: 5 },
		{ id: "facts", text: "Read today's facts", type: "facts", goal: 1 },
		{ id: "shop", text: "Open the Bazaar", type: "bazaar", goal: 1 },
	],
	pass: {
		title: "Une semaine avant ton jour",
		message:
			"Ma chérie, Dans exactement une semaine, ce sera ton anniversaire. Et en y pensant, je me rends compte une nouvelle fois à quel point je suis reconnaissant de t’avoir dans ma vie. Il y a quelque chose que je veux que tu gardes toujours dans ton cœur : même lorsque la distance nous sépare physiquement, elle ne nous sépare pas vraiment. Tu restes la personne à qui je pense, celle que je choisis, celle dont je me soucie et celle pour qui j’ai envie de faire des efforts chaque jour. Je veux que tu saches que tu n’es jamais seule dans cette relation. Ton amoureux est là. Peut-être pas encore physiquement à côté de toi comme je le voudrais, mais présent dans tes journées, dans tes pensées et dans tout ce que nous construisons ensemble. Je t’écoute, je prends tes sentiments au sérieux, je fais attention à ce que tu me dis et je veux toujours comprendre ce que tu ressens. Je suis fier de toi, pas seulement pour ce que tu accomplis, mais surtout pour la personne que tu es. Pour ta façon de penser, ta curiosité, ta force, ta sensibilité et toutes ces petites choses qui font que tu es toi. Tu es vraiment une femme exceptionnelle à mes yeux, et je ne veux jamais que tu oublies la place que tu occupes dans mon cœur. Et surtout, souviens-toi de quelque chose : tu as un homme qui te choisit. Un homme qui t’aime, qui t’est fidèle, qui veut prendre soin de toi et qui fera toujours de son mieux pour être un endroit où tu peux te sentir en sécurité. Quand tu seras fatiguée, je serai là pour te soutenir. Quand tu auras besoin de parler, je t’écouterai. Quand tu auras froid, je te réchaufferai. Et quand la vie deviendra difficile, je resterai à tes côtés. Je ne sais pas tout ce que les prochains mois nous réservent, mais je sais une chose : je suis heureux que ce soit toi. Merci d’être entrée dans ma vie. Merci pour ton amour, ta présence, tes efforts, tes mots, ta patience et pour toutes les petites choses que tu fais et que je remarque, même si je ne te le dis pas toujours. Je t’aime profondément, Irulan. Et malgré la distance, nous sommes toujours deux personnes qui se choisissent. Ton amoureux est là. Et il te choisit encore.",
		signature: "– your boyfriend",
		image: "",
		iconClosed: "./icons/present.png",
		iconOpened: "./icons/present.png",
	},
});
