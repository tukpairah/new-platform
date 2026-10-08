R2-D2 LOBBY: how to use
=======================
Files
  index.html   the lobby (open this one)
  bazaar.html  the Bazaar (opens in a new tab from the lobby)
  config.js    EVERYTHING you edit: icons, pictures, music, texts, quests, prices, items
  common.js / common.css   shared code (you do not need to edit these)

Folders (put your own files here and write the paths in config.js)
  icons/   your icons          e.g. icons/bazaar.png
  img/     backgrounds, pass picture, item pictures
  audio/   music               e.g. audio/lobby1.mp3, audio/bazaar1.mp3

Opening it
  Keep all files together. Double-click index.html. If the coins do not carry over
  between the lobby and the Bazaar, your browser is blocking shared storage for local
  files; put the folder on GitHub Pages (or run a local server) and it works.

Safety (new)
  lib/core.js   save signing, ledger, clock, game rewards (do not edit)
  tests/        node tests/abuse.test.js   (checks double claims, tampering, clock tricks)
  Her save is one signed entry in the browser plus one automatic backup copy.
  config.js: saveSalt (do not change after she started), legacyCap, devKey (leave "" when you upload).
  Test mode: set devKey to a word, then open index.html?dev=THEWORD&day=3 (uses a separate test save).

Content (edit these, not the code)
  content/settings.js   names, dates, volumes (overrides config.js)
  content/economy.js    all Gem / XP numbers, pass, prices
  content/quiz.js       Love Quiz questions
  content/shop.js       the 5 Bazaar items;  content/shop/shopN.js = the real gift (loaded only after she buys it)
  content/days/dayN.js  gift, facts, quests, pass message of day N (loaded only when day N has come)
  img/days/             the daily gift pictures

R2 and sound (new)
  content/phrases.js   everything R2 says (one phrase per line; language, mood, when). Add or remove lines freely.
  lib/brain.js (moods, when he speaks)  lib/r2.js (his body and eyes)  lib/voice.js + lib/sfx.js (all sounds are made in the browser, no files)
  Menu > four sliders: Master, Music, Effects, R2 voice. Tests: node tests/r2.test.js
