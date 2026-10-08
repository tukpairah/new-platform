/* All numbers for Gems and XP. Strict JSON inside the call. This is the ONLY place for them.
   dailyGift        what the Daily Gift pays                    dailyQuest   what EACH of the 3 daily quests pays
   modeDailyBudget  the budget of the day a mode unlocks. It is split among the modes that unlock that day by modeWeights
                    (rounded to multiples of 5, one mode adjusted so the day's total is exact). Nothing is set per mode.
   modeRepeat       a later clear of a mode: gems each, once a day per mode, all repeats of one day together capped by dailyCap
   pass             gems of each of the 7 steps; step N needs day N or later AND xpPerStep x N XP
   Per day at most: 100 Gems and 100 XP (+10 Gems from repeats). */
R2.register("economy", {
  "dailyGift": { "gems": 10, "xp": 40 },
  "dailyQuest": { "gems": 5, "xp": 10 },
  "modeDailyBudget": { "gems": 55, "xp": 30 },
  "modeWeights": { "easy": 1, "medium": 1.5, "hard": 2 },
  "modeRepeat": { "gems": 5, "xp": 0, "oncePerDayPerMode": true, "dailyCap": 10 },
  "pass": { "xpPerStep": 60, "gems": [20, 20, 20, 20, 20, 20, 20] },
  "basePrice": 40,
  "rarityMultiplier": { "common": 1, "rare": 2, "epic": 2.75, "legendary": 4.75 }
});
