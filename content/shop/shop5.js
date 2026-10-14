/* The gift of shop5 (type: pdf): YOUR handwritten letter as a PDF she can download and print. Loaded ONLY after she buys it.
   file          the PDF, uploaded to the main folder of the repo: Lettre-pour-Irulan.pdf
   downloadName  the file name she gets when she taps the big button
   preview       optional: a picture of page 1 (img/gifts/lettre.jpg). Left empty, a drawn sheet of paper is shown instead.
   paperTop / paperTitle / paperSign   the words on that drawn sheet     title / caption   heading and a small line     buttonLabel / openLabel   the two buttons */
R2.register("payload", "shop5", {
  "file": "Lettre-pour-Irulan.pdf",
  "preview": "img/gifts/lettre-1.jpg",
  "downloadName": "Lettre-pour-Irulan.pdf",
  "paperTop": "Pour Irulan",
  "paperTitle": "Ma lettre pour toi",
  "paperSign": "Écrite à la main, avec amour",
  "title": "Ma lettre, écrite à la main",
  "caption": "Rien que pour toi. À garder, à relire, à imprimer.",
  "buttonLabel": "Télécharger (PDF)",
  "openLabel": "Ouvrir pour imprimer"
});
