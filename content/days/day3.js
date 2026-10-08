/* Day 3. The Birthday Pass step of this day ("pass") has these fields (all optional, empty = nothing / the drawn default):
     title       the name on the card, e.g. "Boot Sequence"
     message     the letter she reads after opening the step. Separate paragraphs with a blank line (\n\n inside the quotes)
     signature   one line under the letter, centred
     image       an optional photo shown in the letter, e.g. "img/days/day3.jpg"      caption   its small caption
     iconClosed  the picture on the card BEFORE she opens it   iconOpened  the picture AFTER (square PNG with transparency; "" = the drawn default)
   The app loads this file only when day 3 has come. */
R2.register("day", 3, {
	phrase: { fr: "Tu n'es jamais seule. Je suis là.", ru: "" },
	facts: [
		{ fr: "Un mois avant son départ pour la Malaisie, ton chéri devait choisir une nouvelle langue à apprendre : le français, le chinois ou l'espagnol. Il a longuement hésité. Beaucoup lui conseillaient le chinois, puisque son pays borde la Chine. Mais après la Malaisie, la réponse était d'une évidence absolue : le français." },
	],
	pass: {
		title: "Je suis fier de la femme que tu deviens",
		message: "Ma chérie, Aujourd’hui, j’ai envie de te parler d’une chose que je ressens très souvent quand je pense à toi : je suis fier de toi. Et je ne parle pas seulement de tes études, de tes résultats ou de tout ce que tu réussis à accomplir. Je suis surtout fier de la personne que tu es et de la femme que tu deviens. J’aime ta façon de réfléchir, ta curiosité, ton envie de comprendre les choses, ta sensibilité, ta force et même les petites particularités qui font simplement partie de toi. Je sais que tu peux parfois douter de toi, te mettre beaucoup de pression ou avoir l’impression que tu dois toujours faire davantage, mais j’aimerais que tu puisses parfois t’arrêter quelques secondes et regarder tout le chemin que tu as déjà parcouru. Tu as tellement de qualités que tu ne remarques peut-être même pas toi-même. Et moi, de mon côté, je les vois. Je les remarque dans ta façon de parler, dans tes réactions, dans les décisions que tu prends et dans la manière dont tu continues d’avancer même lorsque quelque chose devient difficile. C’est aussi pour cela que je veux toujours être quelqu’un qui te soutient et qui te rappelle ta valeur lorsque tu l’oublies. Je ne veux jamais que tu penses que tu dois être parfaite pour être aimée par moi. Tu n’as pas besoin de réussir quelque chose, d’être productive ou de prouver quoi que ce soit pour mériter mon amour. Je t’aime aussi dans tes journées normales, dans tes moments de fatigue, dans tes doutes, dans tes petites erreurs et dans les moments où tu as simplement besoin de souffler. Et je veux que tu te sentes libre d’être toi-même avec moi. Tu peux me parler de ce qui te rend heureuse, de ce qui t’inquiète, de ce qui te fait peur ou simplement de ce qui te passe par la tête. Je t’écouterai toujours sérieusement, parce que ce que tu ressens compte pour moi. Je suis ton homme, et je veux être celui auprès de qui tu peux déposer tes inquiétudes sans avoir peur d’être jugée. Celui qui te tend la main quand tu en as besoin, qui te protège quand la vie devient trop lourde et qui te rappelle que tu n’as pas besoin de tout porter seule. Je veux te voir grandir, réussir, découvrir de nouvelles choses et devenir exactement la femme que tu souhaites être, mais je veux surtout être là pendant tout ce chemin. Et même si aujourd’hui nous sommes encore séparés par des kilomètres, je suis fier de pouvoir dire que cette femme extraordinaire est ma copine. Je suis fier de t’aimer, fier de te soutenir et fier de pouvoir construire quelque chose avec toi. Alors ne doute jamais de la place que tu occupes dans ma vie. Pour moi, tu n’es pas simplement une personne que j’aime : tu es une femme que j’admire profondément. Et je continuerai à te le rappeler, autant de fois qu’il le faudra.",
		signature: "– Рахат",
		image: "",
		caption: "",
		iconClosed: "./icons/present.png",
		iconOpened: "./icons/present.png",
	},
});
