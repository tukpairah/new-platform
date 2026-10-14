/* The gift of shop5 (type: pdf): the long letter as a printable PDF. Loaded ONLY after she buys it.
   file          the PDF in docs/ (A4, made to be printed)          preview   a picture of its first page
   downloadName  the file name she gets when she taps the big button
   title / caption   heading and a small line         buttonLabel / openLabel   the two button texts */
R2.register("payload", "shop5", {
  "file": "docs/Lettre-pour-Irulan.pdf",
  "preview": "img/gifts/lettre-cover.jpg",
  "downloadName": "Lettre-pour-Irulan.pdf",
  "title": "Ma lettre pour toi",
  "caption": "À garder, à relire, à imprimer. Pour tes vingt ans.",
  "buttonLabel": "Télécharger (PDF)",
  "openLabel": "Ouvrir pour imprimer"
});
