/* The gift of shop4 (type: photoVoice). Loaded ONLY after she buys it.
   photos    one or several: { "src": "img/gifts/photo1.jpg", "caption": "..." }  (she swipes between them)
   audio     the voice file (MP3 or M4A) in audio/gifts/        title   heading        caption   a small line under the player */
R2.register("payload", "shop4", { "photos": [{ "src": "img/gifts/me.JPG", "caption": "Little me. I had no idea what was coming." }], "audio": "audio/gifts/Childhood.mp3", "title": "Before I knew you", "caption": "Press play." });
