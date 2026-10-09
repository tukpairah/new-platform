/* ==========================================================================
   CONFIG: the ONE file you edit. Both pages (index.html and bazaar.html)
   read it. Set a path between the quotes and save; that is all.
   Keep your files in the folders next to this file:
       icons/   your icons          img/   backgrounds and pictures
       audio/   your music
   ========================================================================== */
const CONFIG = {
	/* ---------------- 1. GENERAL ---------------- */
	herName: "Irulan",
	birthday: "2026-10-14T00:00:00+02:00", // Paris time (UTC+2 until 25 Oct)
	startDate: "2026-10-08T00:00:00+02:00", // Day 1 of the Birthday Pass
	// SAVE AND SAFETY (change the salt once, before she receives the final version; any text is fine)
	saveSalt: "r2-8f31c2d7a9", // signs her save and backup codes. Do NOT change it after she started playing.
	legacyCap: null, // her progress from the first version is kept as it is. A number = the most Gems that old balance may count for.
	devKey: "test", // "" = developer tools OFF (leave it empty when you upload). To test: set a word here, open index.html?dev=THEWORD&day=3
	lobbyPage: "index.html",
	bazaarPage: "bazaar.html", // opens in a NEW tab

	/* ---------------- 2. LOBBY: images, icons, music ---------------- */
	backgroundDesktop: [
		"./img/1.png",
		"./img/2.png",
		"./img/3.png",
		"./img/4.jpeg",
	], // e.g. "img/bg-desktop.jpg"
	backgroundPhone: "", // e.g. "img/bg-phone.jpg"
	passImage: "./icons/pass.png", // the picture that opens the progress window, e.g. "img/pass.png"
	avatarImage: "./icons/spike.png", // её картинка профиля
	r2Image: "", // optional: your own R2 picture (a PNG render looks best)

	// R2's EMOTIONS (26). Each one is only data. Everything blends smoothly; the Calm / Normal / Lively menu setting scales the posture.
	//   color     lens colour                     ls / lsy   lens width / height (pupil shape: lsy small = narrowed or winking eye, large = wide)
	//   dome      dome tilt in degrees            domeY      dome up (-) or down (+) in px     lean   body lean in degrees     body  1.03 = puffed up, 0.98 = drooping
	//   gaze      "up", "down" or "" (where the eye prefers to look)
	//   fx        small effect that floats up: heart spark sweat q bang spiral tear blush zzz steam note cloud ("" = none)   fxEvery  seconds between effects
	//   blend     seconds to blend into this mood (0.3 to 0.6)     ms  how long it normally lasts (0 = until something changes it)
	//   voice     which voice style speaks it (see lib/voice.js)    prio  3 = scared/angry win over everything, 2 = excited, 1 = the rest
	r2Emotions: {
		neutral: {
			color: "#E63946",
			ls: 1,
			lsy: 1,
			dome: 0,
			domeY: 0,
			lean: 0,
			body: 1,
			gaze: "",
			fx: "",
			fxEvery: 0,
			blend: 0.45,
			ms: 0,
			voice: "neutral",
			prio: 1,
		},
		happy: {
			color: "#FF4B5C",
			ls: 1.12,
			lsy: 1.12,
			dome: 0,
			domeY: -1,
			lean: 0,
			body: 1.01,
			gaze: "",
			fx: "",
			fxEvery: 0,
			blend: 0.4,
			ms: 2500,
			voice: "happy",
			prio: 1,
		},
		love: {
			color: "#FF6FA8",
			ls: 1.12,
			lsy: 1.12,
			dome: 3,
			domeY: 0,
			lean: 0,
			body: 1,
			gaze: "",
			fx: "heart",
			fxEvery: 0.7,
			blend: 0.45,
			ms: 5000,
			voice: "love",
			prio: 1,
		},
		curious: {
			color: "#E63946",
			ls: 1.08,
			lsy: 1.08,
			dome: -10,
			domeY: 0,
			lean: -3,
			body: 1,
			gaze: "up",
			fx: "q",
			fxEvery: 2.4,
			blend: 0.4,
			ms: 3500,
			voice: "curious",
			prio: 1,
		},
		surprised: {
			color: "#FF8A8A",
			ls: 1.4,
			lsy: 1.4,
			dome: 0,
			domeY: -3,
			lean: 0,
			body: 1.02,
			gaze: "",
			fx: "bang",
			fxEvery: 1.8,
			blend: 0.3,
			ms: 1500,
			voice: "surprised",
			prio: 1,
		},
		shy: {
			color: "#FF9AB5",
			ls: 0.85,
			lsy: 0.85,
			dome: 8,
			domeY: 1,
			lean: 2,
			body: 1,
			gaze: "down",
			fx: "blush",
			fxEvery: 1.8,
			blend: 0.5,
			ms: 3000,
			voice: "shy",
			prio: 1,
		},
		sleepy: {
			color: "#6B1E2A",
			ls: 0.7,
			lsy: 0.22,
			dome: 9,
			domeY: 3,
			lean: 0,
			body: 0.99,
			gaze: "down",
			fx: "zzz",
			fxEvery: 1.9,
			blend: 0.6,
			ms: 0,
			voice: "sleepy",
			prio: 1,
		},
		proud: {
			color: "#FFC93C",
			ls: 1.05,
			lsy: 1.05,
			dome: -5,
			domeY: -2,
			lean: 0,
			body: 1.035,
			gaze: "",
			fx: "spark",
			fxEvery: 2,
			blend: 0.45,
			ms: 4500,
			voice: "proud",
			prio: 1,
		},
		laughing: {
			color: "#FF6A4D",
			ls: 1,
			lsy: 0.7,
			dome: 0,
			domeY: 0,
			lean: 0,
			body: 1,
			gaze: "",
			fx: "note",
			fxEvery: 1.2,
			blend: 0.35,
			ms: 2200,
			voice: "laughing",
			prio: 1,
		},
		sad: {
			color: "#5B7FD6",
			ls: 0.8,
			lsy: 0.8,
			dome: 11,
			domeY: 4,
			lean: 2.5,
			body: 0.985,
			gaze: "down",
			fx: "tear",
			fxEvery: 1.6,
			blend: 0.6,
			ms: 0,
			voice: "sad",
			prio: 1,
		},
		annoyed: {
			color: "#FF8A1F",
			ls: 1,
			lsy: 0.55,
			dome: 3,
			domeY: 0,
			lean: 0,
			body: 1,
			gaze: "",
			fx: "cloud",
			fxEvery: 1.6,
			blend: 0.4,
			ms: 4000,
			voice: "annoyed",
			prio: 1,
		},
		angry: {
			color: "#FF1A1A",
			ls: 1.15,
			lsy: 0.8,
			dome: -4,
			domeY: -1,
			lean: 0,
			body: 1.01,
			gaze: "",
			fx: "steam",
			fxEvery: 0.5,
			blend: 0.35,
			ms: 5000,
			voice: "angry",
			prio: 3,
		},
		excited: {
			color: "#FFB400",
			ls: 1.25,
			lsy: 1.25,
			dome: -4,
			domeY: -3,
			lean: 0,
			body: 1.03,
			gaze: "",
			fx: "spark",
			fxEvery: 0.9,
			blend: 0.35,
			ms: 4000,
			voice: "excited",
			prio: 2,
		},
		dreamy: {
			color: "#B58CFF",
			ls: 0.9,
			lsy: 0.7,
			dome: 6,
			domeY: 0,
			lean: 2,
			body: 1,
			gaze: "up",
			fx: "note",
			fxEvery: 1.6,
			blend: 0.6,
			ms: 4000,
			voice: "dreamy",
			prio: 1,
		},
		mischievous: {
			color: "#FF3D6E",
			ls: 1,
			lsy: 0.55,
			dome: 4,
			domeY: 0,
			lean: -3,
			body: 1,
			gaze: "",
			fx: "",
			fxEvery: 0,
			blend: 0.4,
			ms: 3500,
			voice: "mischievous",
			prio: 1,
		},
		confused: {
			color: "#6FD0FF",
			ls: 1.05,
			lsy: 1.05,
			dome: -13,
			domeY: 0,
			lean: -4,
			body: 1,
			gaze: "",
			fx: "q",
			fxEvery: 1.3,
			blend: 0.4,
			ms: 2500,
			voice: "confused",
			prio: 1,
		},
		worried: {
			color: "#7FA6FF",
			ls: 0.9,
			lsy: 1.1,
			dome: 5,
			domeY: 1,
			lean: 1.5,
			body: 0.99,
			gaze: "",
			fx: "sweat",
			fxEvery: 1.4,
			blend: 0.5,
			ms: 3500,
			voice: "worried",
			prio: 1,
		},
		grateful: {
			color: "#7CE0A0",
			ls: 1.08,
			lsy: 1.08,
			dome: 5,
			domeY: 0,
			lean: 0,
			body: 1,
			gaze: "down",
			fx: "tear",
			fxEvery: 1.5,
			blend: 0.5,
			ms: 4500,
			voice: "grateful",
			prio: 1,
		},
		bored: {
			color: "#B0525C",
			ls: 0.9,
			lsy: 0.5,
			dome: 3,
			domeY: 1.5,
			lean: 1,
			body: 0.99,
			gaze: "",
			fx: "",
			fxEvery: 0,
			blend: 0.5,
			ms: 16000,
			voice: "bored",
			prio: 1,
		},
		playful: {
			color: "#FF7BC8",
			ls: 1.1,
			lsy: 1.1,
			dome: -6,
			domeY: -1,
			lean: 3,
			body: 1.01,
			gaze: "",
			fx: "note",
			fxEvery: 0.9,
			blend: 0.35,
			ms: 3500,
			voice: "playful",
			prio: 1,
		},
		determined: {
			color: "#FF3B30",
			ls: 1,
			lsy: 0.75,
			dome: -3,
			domeY: 0,
			lean: 0,
			body: 1.025,
			gaze: "",
			fx: "",
			fxEvery: 0,
			blend: 0.4,
			ms: 3000,
			voice: "determined",
			prio: 1,
		},
		jealous: {
			color: "#6FBF4A",
			ls: 0.95,
			lsy: 0.7,
			dome: 6,
			domeY: 0,
			lean: -2,
			body: 1,
			gaze: "",
			fx: "cloud",
			fxEvery: 1.5,
			blend: 0.5,
			ms: 5000,
			voice: "jealous",
			prio: 1,
		},
		embarrassed: {
			color: "#FF7FA0",
			ls: 0.9,
			lsy: 0.9,
			dome: 8,
			domeY: 1,
			lean: 2,
			body: 1,
			gaze: "down",
			fx: "blush",
			fxEvery: 1.2,
			blend: 0.5,
			ms: 3000,
			voice: "embarrassed",
			prio: 1,
		},
		scared: {
			color: "#CFE6FF",
			ls: 1.3,
			lsy: 1.3,
			dome: 2,
			domeY: 2,
			lean: 0,
			body: 0.98,
			gaze: "",
			fx: "sweat",
			fxEvery: 0.9,
			blend: 0.3,
			ms: 2500,
			voice: "scared",
			prio: 3,
		},
		dizzy: {
			color: "#C79BFF",
			ls: 1.1,
			lsy: 0.9,
			dome: -8,
			domeY: 0,
			lean: 3,
			body: 1,
			gaze: "",
			fx: "spiral",
			fxEvery: 0.8,
			blend: 0.35,
			ms: 3500,
			voice: "dizzy",
			prio: 1,
		},
		flirty: {
			color: "#FF5FA8",
			ls: 1,
			lsy: 0.45,
			dome: -5,
			domeY: 0,
			lean: 3,
			body: 1.01,
			gaze: "up",
			fx: "heart",
			fxEvery: 1.1,
			blend: 0.4,
			ms: 4000,
			voice: "flirty",
			prio: 1,
		},
	},

	// R2's MOTION. Every number that makes him move is here. Calm / Normal / Lively in the Menu multiplies the amplitudes.
	r2Motion: {
		level: "normal", // what she gets before she chooses: "calm" | "normal" | "lively"
		levels: { calm: 0.6, normal: 1, lively: 1.4 }, // amplitude multiplier per level (reduced-motion halves it again)
		follow: {
			settle: 0.3,
			domeMax: 14,
			lensMax: 4.5,
			deadzone: 3,
			updateMs: 60,
		}, // eye: seconds to settle, max dome angle (deg), max lens shift, ignore moves under N px, update at most every N ms
		bob: { amp: 3, hz: 0.5 }, // idle float: pixels and cycles per second
		fidget: { minGap: 3.5, maxGap: 7, rot: 7, move: 11, hop: 14 }, // seconds between fidgets; tilt (deg), roll (px), hop height (px). Each lasts 0.9-1.6 s
		mood: { blend: 0.4 }, // seconds a mood takes to blend in (colour and posture)
		shake: { amp: 2, cycles: 3.5, dur: 0.7 }, // angry shake: max pixels (never above 2), wiggles, seconds. One burst, then calm
		speak: { pulse: 0.07, hz: 2 }, // slow lens swell while he talks
	},

	// Birthday Pass step pictures: icons.passClosed / icons.passOpened replace the drawn defaults for ALL days; a day file's pass.iconClosed / iconOpened beats them.
	icons: {
		// e.g. bazaar: "icons/bazaar.png"   (png / svg / webp)
		bazaar: "./icons/icon_shop.png",
		quests: "./icons/quest.png",
		gift: "./icons/present.png",
		platform: "./icons/66.png",
		passClosed: "",
		passOpened: "",
		facts: "./icons/star.png",
		soon: "./icons/time.png",
		sound: "",
		menu: "",
		lobby: "",
		cup: "",
		gem: "./icons/gems.png", // the currency icon (Gems), used in both pages
		bag: "", // "My items" button in the Bazaar
		back: "", // back arrow in the Bazaar
	},
	// EXTERNAL LINK BUTTON (lobby, bottom of the right column; last tab on the phone).
	//   url    the page it opens in a NEW tab. Leave "" and the button shows a "Coming soon" message instead.
	//   label  the small text under the icon (when showLabels is true) and the screen-reader name
	//   icon   its picture, e.g. "icons/platform.png" ("" = use icons.platform, or the drawn default)
	links: {
		platform: { url: "https://tukpairah.github.io/for-my-love/", label: "Platform", icon: "", newTab: null }, // newTab: null = automatic (external https:// link -> new tab, a relative page like "other.html" -> same tab); true / false forces it. Empty url = "Coming soon". External links never get her save, the dev key or a query string added.
	},
	showLabels: false, // true = small text under the icons (desktop buttons)
	// PHONE (portrait): the bottom tab bar, R2's motion. Desktop is not affected.
	mobile: {
		showLabels: true, // small text under the icons of the bottom tab bar
		motion: "calm", // R2's motion level on a phone until she chooses one in the menu: "calm" | "normal" | "lively"
	},
	// The WELCOME screen of the lobby (her tap on ENTER lets the music start). enabled: false = no screen, the lobby opens directly.
	startScreen: {
		enabled: true,
		title: "WELCOME",
		button: "ENTER",
		showName: false,
	}, // showName: true also shows her name under the title

	// BUTTON SOUNDS (every button, everywhere: lobby, Bazaar, windows, pass, games). "" = the built-in synthesized sound; a path replaces it.
	//   click   normal buttons          back    back / close / X          denied   disabled or locked buttons          open   buttons that open a window (data-sfx="open")
	// Put the files in audio/sfx/ (short, under 0.3 s, MP3 or WAV, Latin filename), e.g. click: "audio/sfx/click.mp3".
	// An element can opt out with data-sfx="none". The volume follows the Effects slider and the mute button.
	sfx: { click: "./audio/sfx/click.mp3", back: "./audio/sfx/click.mp3", denied: "./audio/sfx/click.mp3", open: "./audio/sfx/click.mp3" },

	// MUSIC for the lobby AND the Birthday Pass window (the Pass opens on top of the lobby,
	// so the same music keeps playing). Add your tracks here.
	// Every visit starts on a random track (never the one she heard last), then the
	// tracks take turns: when one ends, the next one starts.
	music: ["./audio/2.mp3", "./audio/3.mp3", "./audio/4.mp3", "./audio/5.mp3"], // e.g. ["audio/lobby1.mp3", "audio/lobby2.mp3", "audio/lobby3.mp3"]
	musicRotate: true, // true = tracks take turns, false = one random track on repeat
	musicVolume: 0.7, // 0 to 1

	/* ---------------- RESULT SOUNDS (win / lose) ----------------
	   Played when a game's result screen opens (every mode, Dodge and the Love Quiz included).
	   win / lose = LISTS of clips (MP3, M4A or WAV, put them in audio/results/), e.g. ["audio/results/win1.mp3", "audio/results/win2.mp3"].
	   One is picked at random each time, never the same twice in a row. Empty list = the built-in fanfare (win) / soft "aww" jingle (lose).
	   maxSeconds = a clip is cut after this long (0.5 s fade out). volume = 0 to 1 (also follows the effects slider and the mute button).
	   A single mode can have its own clips: "winSound" / "loseSound" in content/games.js. */
	// RESULTS-BEGIN
	results: { win: ["./audio/777.mp3"], lose: ["./audio/888.mp3"], maxSeconds: 8, volume: 0.8 },
	// RESULTS-END

	/* ---------------- 3. LOBBY: text ---------------- */
	phrases: [
		// keep them short: small bubble next to R2
		"Bweep! A message for you.",
		"Beep-boop! He misses you.",
		"Boop. Distance is only a number.",
	],
	facts: ["He loves u"],

	/* ---------------- 4. CURRENCY ---------------- */
	// The currency is saved in her browser, so her Gems are still there next time she opens the page.
	// (Different phone or browser = a different save. The Menu has a backup code to move it.)
	currency: {
		name: "Gems", // shown in messages
		start: 0, // Gems she has on the very first visit
	},
	// Rewards for game modes (the Love Quiz and the Dodge fight). A first clear pays modeFirstClear once;
	// later clears pay modeRepeat, at most once a day. the shortest run (seconds) that can pay is minSeconds in content/games.js. A first clear pays by the mode's difficulty.
	economy: {
		// Defaults only: the real numbers are in content/economy.js
		dailyGift: { gems: 10, xp: 40 },
		dailyQuest: { gems: 5, xp: 10 },
		modeDailyBudget: { gems: 55, xp: 30 },
		modeWeights: { easy: 1, medium: 1.5, hard: 2 },
		modeRepeat: { gems: 5, xp: 0, oncePerDayPerMode: true, dailyCap: 10 },
		pass: { xpPerStep: 60, gems: [20, 20, 20, 20, 20, 20, 20] },
		basePrice: 40,
		rarityMultiplier: { common: 1, rare: 2, epic: 2.75, legendary: 4.75 },
	},
	// The game modes in the PLAY window, in this order. A new mode = one id here + its block in "games".
	modeOrder: ["quiz", "dodge"],

	// QUESTS. She earns coins by completing them. Each quest:
	//   id      unique short name (do not change it after she started playing)
	//   text    what she sees
	//   type    "taps"   = she taps R2        "facts"  = she opens Facts
	//           "bazaar" = she visits the Bazaar   "game" = she finishes the Love Quiz
	//           "manual" = a real-life task: she taps "I did it" herself
	//   goal    how many times (1 for most)
	//   reward  Gems she gets when she presses "Claim"
	//   xp      XP she also gets (XP fills the Birthday Pass path)
	//   daily   true = resets every day, false = only once
	quests: [
		{
			id: "tap",
			text: "Tap R2 five times",
			type: "taps",
			goal: 5,
			reward: 10,
			xp: 20,
			daily: true,
		},
		{
			id: "facts",
			text: "Read the facts about him",
			type: "facts",
			goal: 1,
			reward: 15,
			xp: 20,
			daily: false,
		},
		{
			id: "shop",
			text: "Visit the Bazaar",
			type: "bazaar",
			goal: 1,
			reward: 10,
			xp: 10,
			daily: true,
		},
		{
			id: "quiz",
			text: "Finish the Love Quiz",
			type: "game",
			goal: 1,
			reward: 15,
			xp: 20,
			daily: true,
		},
		{
			id: "real1",
			text: "Send him that you love him",
			type: "manual",
			goal: 1,
			reward: 25,
			xp: 30,
			daily: false,
		},
	],

	/* ---------------- 4b. BIRTHDAY PASS (the path) ---------------- */
	// The path has one step per day. A step opens when BOTH are true:
	//   1) the day has come (see startDate above), and
	//   2) she has collected enough XP (xp = the TOTAL XP needed to reach that step).
	// Each step has two cards:
	//   top card (surprise) : top = name, text = what she reads when she opens it, image = picture
	//   bottom card (reward): reward = Gems she can claim, rewardImage = picture ("" = Gem icon)
	pass: {
		title: "Birthday Pass",
		featured: {
			// the big card on the left (the final gift)
			title: "The final gift",
			text: "Open the last step on the day of your birthday.",
			image: "", // e.g. "img/final.png"
		},
		tiers: [
			{
				xp: 20,
				reward: 10,
				top: "The message",
				text: "?",
				image: "",
				rewardImage: "",
			},
			{
				xp: 60,
				reward: 10,
				top: "Day 2 surprise",
				text: "Write what happens on day 2.",
				image: "",
				rewardImage: "",
			},
			{
				xp: 110,
				reward: 15,
				top: "Day 3 surprise",
				text: "Write what happens on day 3.",
				image: "",
				rewardImage: "",
			},
			{
				xp: 160,
				reward: 15,
				top: "Day 4 surprise",
				text: "Write what happens on day 4.",
				image: "",
				rewardImage: "",
			},
			{
				xp: 210,
				reward: 20,
				top: "Day 5 surprise",
				text: "Write what happens on day 5.",
				image: "",
				rewardImage: "",
			},
			{
				xp: 260,
				reward: 20,
				top: "Day 6 surprise",
				text: "Write what happens on day 6.",
				image: "",
				rewardImage: "",
			},
			{
				xp: 320,
				reward: 50,
				top: "Birthday!",
				text: "The final day.",
				image: "",
				rewardImage: "",
			},
		],
	},

	/* ---------------- 4c. GAME MODES (the PLAY button) ---------------- */
	// Love Quiz: pick the right answer. A wrong answer is greyed out and she tries again.
	//   correct = the position of the right option in "options" (0 = the first one)
	//   right / wrong = what she sees after answering
	// Finishing the quiz completes the quest of type "game" (she claims it in Quests).
	games: {
		quiz: {
			title: "Love Quiz",
			unlockDay: 1,
			desc: "Pick the right answer.",
			questions: [
				{
					q: "When is your boyfriend's birthday?",
					options: ["14.10", "02.11", "25.12", "01.01"],
					correct: 1,
					right: "Yes! 02.11. Remember it.",
					wrong: "Not quite. Try again!",
				},
				{
					q: "Who does your boyfriend love?",
					options: ["R2-D2", "Pizza", "You", "Sleeping"],
					correct: 2,
					right: "Correct! Obviously.",
					wrong: "Hmm, think harder!",
				},
			],
			finish: "Quiz complete! Open Quests to claim your reward.",
		},

		/* ---------- DODGE FIGHT: "Message Through" ----------
       A bullet-hell fight. She plays a small heart and survives until R2's message gets through.
       Everything for this mode is here. "" (empty) for any image = use the drawn default. */
		dodge: {
			title: "Message Through",
			desc: "Survive The Static.",
			unlockDay: 1, // the Birthday Pass day when it opens (1 to 7). Change it to hide it until later.
			music: [], // e.g. ["audio/dodge1.mp3"]. Empty = the lobby music keeps playing.
			musicRotate: true,
			musicVolume: 0.5,

			// ---- ART (your own pictures) ----
			// Best: square PNG with a transparent background. See img/dodge/README.txt for sizes.
			// Any image that fails to load is skipped (the drawn default is used) and a warning is printed in the console.
			art: {
				player: {
					image: "", // her icon (replaces the heart)
					imageHurt: "", // optional: shown while she is invincible after a hit
					imageDash: "", // optional: shown while she dashes
					size: 30, // display size in arena units (the arena is 400 wide). Aspect ratio is kept.
					hitRadius: 5, // the REAL hitbox, independent of the picture. Smaller = more forgiving.
					grazeRadius: 20, // how close a bullet must pass to count as a graze
					showHitbox: true, // shows a small dot where she can really be hit
				},
				boss: {
					image: "", // The Static's icon
					phaseImages: [], // optional: one image per phase, e.g. ["img/dodge/b1.png", "img/dodge/b2.png", "", ""] ("" = boss.image)
					imageHurt: "", // optional: flashes when a phase ends
					imageWin: "", // optional: shown on the "try again" screen
					size: 120, // display size in arena units
				},
				bullets: {
					// optional image per bullet type ("" = drawn shape)
					orb: "",
					shard: "",
					laser: "",
					homing: "",
				},
				bulletHit: {
					// hit radius of each bullet type (arena units); the picture is just decoration
					orb: 6,
					shard: 4,
					homing: 7,
				},
				bulletSize: {
					// drawn size of each bullet picture (arena units)
					orb: 20,
					shard: 26,
					homing: 24,
					laser: 20,
				},
				laserWidth: 16, // how thick a laser is when it is deadly
				portrait: "", // small picture next to the boss lines ("" = the boss icon)
				arena: { background: "" }, // optional picture inside the arena box
			},

			// ---- TEXTS (replace me) ----
			texts: {
				intro:
					"R2 is trying to deliver a message from your boyfriend. The Static is jamming it. Dodge until it gets through!",
				controls:
					"Move: WASD / arrows or drag. Dash: Space or the DASH button. Pause: Esc.",
				play: "PLAY",
				retry: "TRY AGAIN",
				assist: "Assist mode (more hearts, slower bullets)",
				back: "Back to lobby",
				loading: "Loading...",
				locked: "Opens on day",
			},

			// ---- STORY (replace me) ----
			// One entry per phase. name = shown at the start, line = what The Static says when the phase ends,
			// fragment = the piece of the message she collects.
			phases: [
				{
					name: "Phase 1: Crackle",
					duration: 40,
					line: "Bzzt... you can't read this, can you?",
					fragment: "Dear",
				},
				{
					name: "Phase 2: Noise",
					duration: 40,
					line: "Kkkk... turn back, little heart.",
					fragment: "Irulan,",
				},
				{
					name: "Phase 3: Static",
					duration: 40,
					line: "Sssss... so stubborn.",
					fragment: "I love",
				},
				{
					name: "Phase 4: Silence",
					duration: 40,
					line: "...fine. One last try.",
					fragment: "you",
				},
			],
			finale: {
				duration: 15,
				line: "The Static fades away...",
				fragment: "so much.",
			},
			finalMessage:
				"Dear Irulan, I love you so much.",

			// ---- RULES ----
			rules: {
				hp: 5, // hearts
				assistHp: 8, // hearts in Assist mode
				assistBulletSpeed: 0.7, // bullets are this fast in Assist mode (1 = normal)
				invincibility: 1.0, // seconds of safety after a hit
				speed: 190, // her walking speed (arena units per second)
				dragGain: 1.4, // phone: how far she moves per finger movement
				dash: { duration: 0.18, speed: 520, cooldown: 1.6 }, // seconds / units per second / seconds
				grazeDash: 0.12, // each graze fills this part (0 to 1) of the dash meter
				grazeScore: 10, // points per graze (times the combo multiplier)
				comboStep: 5, // every this many grazes the multiplier goes up by 0.5
				comboMax: 4, // maximum multiplier
				difficulty: 1, // 1 = normal. 0.8 = easier, 1.2 = harder (bullet speed / density)
				maxBullets: 300,
			},
		},
	},

	/* ---------------- 5. BAZAAR ---------------- */
	bazaar: {
		title: "Tukpay's Bazaar",
		backgroundDesktop: "", // e.g. "img/bazaar-bg.jpg"
		backgroundPhone: "",
		hint: "",                // a line under the Bazaar title ("" = no line, no gap)

		startScreen: true,
		welcomeTitle: "Welcome to the Tukpay's Bazaar",
		welcomeText: "", // "" = no line under the title (no empty gap)
		welcomeButton: "ENTER",
		// COMING SOON switch: true = every card says COMING SOON, the names stay hidden and
		// nothing can be bought. Set it to false when the shop is ready.
		comingSoon: false,
		comingSoonHint: "",

		// Bazaar music: plays ONLY in the Bazaar (the lobby music pauses while it is open).
		// Random start every visit, then the tracks take turns.
		music: ["./audio/1.mp3"], // e.g. ["audio/bazaar1.mp3", "audio/bazaar2.mp3"]
		musicRotate: true, // true = tracks take turns, false = one random track on repeat
		musicVolume: 0.4,

		// ITEMS. One card per item. Each item:
		//   id        unique short name (do not change it after she started playing)
		//   top       small title on the card strip, e.g. "SPECIAL OFFER"
		//   name      the item name
		//   desc      one short line under the picture
		//   image     the picture, e.g. "img/item1.png" ("" = placeholder)
		//   price     cost in coins
		//   oldPrice  optional crossed-out price (0 = none)
		//   tag       optional red label, e.g. "NEW" ("" = none)
		//   ribbon    optional purple badge, e.g. "34% EXTRA" ("" = none)
		//   soon      optional: true = THIS card shows COMING SOON (use it to open the gifts one by one)
		//   limit     how many times she can buy it (0 = unlimited)
		//   message   what she sees right after buying it
		items: [
			{
				id: "voice",
				top: "SPECIAL OFFER",
				name: "Voice message",
				desc: "?",
				image: "",
				price: 30,
				oldPrice: 40,
				tag: "NEW",
				ribbon: "",
				limit: 1,
				message: "???",
			},
			{
				id: "song",
				top: "SPECIAL OFFER",
				name: "Song for you",
				desc: "?",
				image: "",
				price: 50,
				oldPrice: 0,
				tag: "NEW",
				ribbon: "",
				limit: 1,
				message: "???",
			},
			{
				id: "movie",
				top: "TOP UP",
				name: "Movie night",
				desc: "?",
				image: "",
				price: 80,
				oldPrice: 0,
				tag: "",
				ribbon: "",
				limit: 1,
				message: "?",
			},
			{
				id: "mystery",
				top: "SPECIAL OFFER",
				name: "Mystery box",
				desc: "Nobody knows what is inside.",
				image: "",
				price: 120,
				oldPrice: 160,
				tag: "",
				ribbon: "25% EXTRA",
				limit: 1,
				message: "?",
			},
		],
	},
};
