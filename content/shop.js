/* Bazaar items: the PUBLIC data of each card. She sees all of these before buying.
   The real gift (the payload) is a separate file, content/shop/<id>.js, fetched ONLY after the purchase is recorded.

   id                 short name, also the payload file name (do not change it after she started playing)
   rarity             common | rare | epic | legendary   (gray / blue / purple / gold frame)
   price              Gems (multiples of 5). Tuned by the economy audit (R2.audit / admin Economy tab / node tests/economy-sim.js): total 545
   name               the title on the card
   teaser             one short line on the card (what it is, without spoiling it)
   icon               picture on the card: square PNG with a transparent background ("" = the drawn gift silhouette)
   iconOwned          optional picture after she bought it ("" = the same icon)
   type               what is inside, decides the gift window:  link | letter | voice | photoVoice
   availableFromDay   optional: e.g. 3 keeps the item shut until Day 3; left out = open from the start
   All the [REPLACE] texts are placeholders for you to write. */
R2.register("shop", {
  "items": [
    { "id": "shop1", "rarity": "common", "price": 40,    "name": "", "teaser": "???", "icon": "./icons/11.png", "iconOwned": "./icons/11.png", "type": "link" },
    { "id": "shop2", "rarity": "rare", "price": 80,      "name": "",           "teaser": "???", "icon": "./icons/22.png", "iconOwned": "./icons/22.png", "type": "letter" },
    { "id": "shop3", "rarity": "epic", "price": 105,      "name": "",    "teaser": "???", "icon": "./icons/55.png", "iconOwned": "./icons/55.png", "type": "voice" },
    { "id": "shop4", "rarity": "epic", "price": 135,      "name": "",    "teaser": "???", "icon": "./icons/44.png", "iconOwned": "./icons/44.png", "type": "photoVoice" },
    { "id": "shop5", "rarity": "legendary", "price": 185, "name": "",     "teaser": "???", "icon": "./icons/66.png", "iconOwned": "./icons/66.png", "type": "link" }
  ]
});
