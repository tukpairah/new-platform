/* The registry of game modes. One object per mode, strict JSON, one per line.
   id            short name (also the file names: games/<id>.js and content/games/<id>.js; do not change it after she started)
   name          shown to her once the mode is open          difficulty  easy | medium | hard (decides the first-clear reward, see content/economy.js)
   unlockDay     the Birthday Pass day it opens (1-7). Its files are fetched only from that day on
   file / contentFile   the mode's code and its content ("" = none)    minSeconds   the shortest run that can pay a reward
   icon          optional picture for the card and top bar: "img/games/quiz.png" (square PNG, transparent, 256x256). "" = the drawn icon
   iconLocked    optional picture for the locked card ("" = the same icon dimmed with a lock)
   winSound / loseSound   this mode's own result clips, e.g. ["audio/results/quiz-win.mp3"]. Empty = the shared lists in config.js (results)
   music         this mode's own music, e.g. ["audio/games/memory/a.mp3"]. Empty = defaultMusic, then the lobby music keeps playing
   rewards       optional override, e.g. { "first": { "gems": 45, "xp": 25 }, "repeat": { "gems": 5, "xp": 0, "oncePerDay": true } }
   Add a mode = one more line here + its two files. */
R2.register("games", {
  "defaultMusic": [],
  "list": [
    {"id": "quiz", "name": "Love Quiz", "difficulty": "easy", "unlockDay": 1, "file": "games/quiz.js", "contentFile": "content/games/quiz.js", "minSeconds": 8, "winSound": [], "loseSound": [], "icon": "./icons/11.png", "iconLocked": "", "music": ["./audio/111.mp3", "./audio/222.mp3", "./audio/333.mp3", "./audio/444.mp3", "./audio/555.mp3"]},
    {"id": "dodge", "name": "Message Through", "difficulty": "hard", "unlockDay": 1, "file": "games/dodge.js", "contentFile": "content/games/dodge.js", "minSeconds": 60, "winSound": [], "loseSound": [], "icon": "./icons/33.png", "iconLocked": "", "music": ["./audio/111.mp3", "./audio/222.mp3", "./audio/333.mp3", "./audio/444.mp3", "./audio/555.mp3"]},
    {"id": "memory", "name": "Photo Memory", "difficulty": "easy", "unlockDay": 2, "file": "games/memory.js", "contentFile": "content/games/memory.js", "minSeconds": 30, "winSound": [], "loseSound": [], "icon": "./icons/44.png", "iconLocked": "", "music": ["./audio/111.mp3", "./audio/222.mp3", "./audio/333.mp3", "./audio/444.mp3", "./audio/555.mp3"]},
    {"id": "mot", "name": "Mot", "difficulty": "medium", "unlockDay": 3, "file": "games/mot.js", "contentFile": "content/games/mot.js", "minSeconds": 30, "winSound": [], "loseSound": [], "icon": "./icons/22.png", "iconLocked": "", "music": ["./audio/111.mp3", "./audio/222.mp3", "./audio/333.mp3", "./audio/444.mp3", "./audio/555.mp3"]},
    {"id": "sliding", "name": "Sliding Puzzle", "difficulty": "easy", "unlockDay": 4, "file": "games/sliding.js", "contentFile": "content/games/sliding.js", "minSeconds": 30, "winSound": [], "loseSound": [], "icon": "./icons/55.png", "iconLocked": "", "music": ["./audio/111.mp3", "./audio/222.mp3", "./audio/333.mp3", "./audio/444.mp3", "./audio/555.mp3"]},
    {"id": "sweeper", "name": "Heart Sweeper", "difficulty": "medium", "unlockDay": 4, "file": "games/sweeper.js", "contentFile": "content/games/sweeper.js", "minSeconds": 30, "winSound": [], "loseSound": [], "icon": "./icons/33.png", "iconLocked": "", "music": ["./audio/111.mp3", "./audio/222.mp3", "./audio/333.mp3", "./audio/444.mp3", "./audio/555.mp3"]},
    {"id": "nonogram", "name": "Pixel Heart", "difficulty": "hard", "unlockDay": 5, "file": "games/nonogram.js", "contentFile": "content/games/nonogram.js", "minSeconds": 60, "winSound": [], "loseSound": [], "icon": "./icons/44.png", "iconLocked": "", "music": ["./audio/111.mp3", "./audio/222.mp3", "./audio/333.mp3", "./audio/444.mp3", "./audio/555.mp3"]},
    {"id": "tower", "name": "Droid Tower", "difficulty": "hard", "unlockDay": 6, "file": "games/tower.js", "contentFile": "content/games/tower.js", "minSeconds": 60, "winSound": [], "loseSound": [], "icon": "./icons/11.png", "iconLocked": "", "music": ["./audio/111.mp3", "./audio/222.mp3", "./audio/333.mp3", "./audio/444.mp3", "./audio/555.mp3"]},
    {"id": "echo", "name": "Beep Echo", "difficulty": "medium", "unlockDay": 6, "file": "games/echo.js", "contentFile": "content/games/echo.js", "minSeconds": 30, "winSound": [], "loseSound": [], "icon": "./icons/44.png", "iconLocked": "", "music": ["./audio/111.mp3", "./audio/222.mp3", "./audio/333.mp3", "./audio/444.mp3", "./audio/555.mp3"]},
    {"id": "cipher", "name": "Cipher", "difficulty": "hard", "unlockDay": 7, "file": "games/cipher.js", "contentFile": "content/games/cipher.js", "minSeconds": 60, "winSound": [], "loseSound": [], "icon": "./icons/22.png", "iconLocked": "", "music": ["./audio/111.mp3", "./audio/222.mp3", "./audio/333.mp3", "./audio/444.mp3", "./audio/555.mp3"]}
  ]
});
