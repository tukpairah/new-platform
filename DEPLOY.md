# Uploading the site (GitHub Pages or any static host)

Run the release check first:  `node tools/admin.js --check`  (or open the admin Dashboard). It must show no ERROR lines.

## Checklist
- `config.js`: `devKey: ""` (empty), and `saveSalt` changed ONCE before she gets the final version (never change it after she started playing).
- No `[REPLACE ...]` placeholder left in `content/` (day packs, shop items, games, quiz).
- Every picture and sound named in `content/` exists (the check lists missing ones).
- Day packs `content/days/day1.js` ... `day7.js` are uploaded; each is only read by the app when that day has come.

## DO NOT UPLOAD (admin and working files)
- `tools/`            the admin server
- `admin.html`        the admin page
- `tests/`            the test scripts
- `.admin-backups/`   copies of files the admin overwrote
- `.backup-lobby*/`, `.backup-modes*/`   safety copies made while working
- `DEPLOY.md`         this file

Everything else (index.html, bazaar.html, config.js, common.js, common.css, lib/, games/, content/, img/, audio/, icons/) is the website.

## Using the admin (on your computer only)
`node tools/admin.js` then open http://127.0.0.1:8787/admin.html . Every mode has a Preview button (a separate test save, every day open).
