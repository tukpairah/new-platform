/* Day 2. The Birthday Pass step of this day ("pass") has these fields (all optional, empty = nothing / the drawn default):
     title       the name on the card, e.g. "Boot Sequence"
     message     the letter she reads after opening the step. Separate paragraphs with a blank line (\n\n inside the quotes)
     signature   one line under the letter, centred
     image       an optional photo shown in the letter, e.g. "img/days/day2.jpg"      caption   its small caption
     iconClosed  the picture on the card BEFORE she opens it   iconOpened  the picture AFTER (square PNG with transparency; "" = the drawn default)
   The app loads this file only when day 2 has come. */
R2.register("day", 2, {
	phrase: { fr: "Même loin, je suis tout près de toi.", ru: "" },
	facts: [
		{ fr: "Depuis l'âge de 7 ans, quand sa maman l'a inscrit à des cours d'anglais, ton chéri apprend cette langue. Il la perfectionne depuis, même avec quelques pauses. Son rêve d'enfant : enfin réussir l'IELTS avec un excellent score." },
		{ fr: "Ton chéri s'est inspiré du design des jeux mobiles de Supercell, son studio préféré." },
	],
	pass: {
		title: "Je suis fier de la femme que tu deviens",
		message: "Ma chérie, Aujourd’hui, j’ai simplement envie de te dire merci. Merci d’être entrée dans ma vie et d’y avoir laissé une place que personne d’autre ne pourrait prendre. Merci pour tous les moments que tu m’as offerts, pour tes mots, tes messages, tes attentions, tes petits cadeaux, tes surprises et même pour toutes ces petites choses que tu fais parfois sans réaliser à quel point elles peuvent compter pour moi. Je ne veux pas seulement te remercier pour les grands moments. Je veux aussi te remercier pour les choses simples. Pour un message reçu au bon moment. Pour une photo qui me fait sourire. Pour une petite phrase qui reste dans ma tête toute la journée. Pour les moments où tu m’écoutes. Pour les fois où tu essaies de comprendre ma façon de penser, mes objectifs et ce qui est important pour moi. Tout cela a une vraie valeur à mes yeux. Tu as apporté quelque chose de particulier dans ma vie. Quelque chose qui me donne envie d’avancer, de construire, de devenir meilleur et de ne pas abandonner lorsque les choses deviennent difficiles. Et je veux que tu saches que ton soutien n’est jamais invisible pour moi. Je le remarque. Je le ressens. Et je le garde avec moi. Je suis aussi reconnaissant pour la personne que tu me permets d’être à tes côtés. Avec toi, j’ai envie d’aimer sincèrement, de prendre soin de quelqu’un, d’écouter, de comprendre, de protéger et de construire quelque chose de réel. Et si parfois je ne trouve pas les bons mots pour te montrer tout ce que tu représentes pour moi, cela ne signifie jamais que je ressens moins. Au contraire. Il y a des choses que j’ai parfois du mal à mettre en mots parce qu’elles sont beaucoup plus profondes qu’une simple phrase. Tu es ma merveilleuse fille, celle que j’aime, celle dont je suis fier et celle à qui je reste profondément fidèle. Alors aujourd’hui, avant même que ton anniversaire arrive, je veux simplement te rappeler une chose : je suis reconnaissant que ce soit toi. Merci pour ton amour. Merci pour ta confiance. Merci pour ta patience. Merci pour tes efforts. Merci pour ta présence. Et surtout, merci d’être toi. Je t’aime, ma chérie.",
		signature: "Tukpay",
		image: "",
		caption: "",
		iconClosed: "./icons/present.png",
		iconOpened: "./icons/present.png",
	},
});
