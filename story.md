# The Copper Can — Story Design Doc

*Draft v1 — covers the full island arc from forest wake-up to the mountain summit. Written against the live codebase (`islandWorld`, existing flags, Act 1 complete through the Fox fight and village map reward).*

---

## Premise

You wake up beneath a forest with no memory and no body worth mentioning. Nearby sits a copper can. It is sealed. It is patient. It is, in a way the game never fully explains until the end, *you* — or at least, whatever you were is inside it.

The entire game is one long errand: **find the four parts of a can opener** (handle, cutting wheel, drive wheel, pivot), assemble it, and open the can. The world is full of people who want things, and every one of those wants stands between you and a part.

The narrator maintains the established voice: dry, deadpan, faintly judgmental. The world is sincere; the narration is not.

## The Central Mystery (the "why keep playing" hook)

Three escalating questions drive the story:

1. **Act 1 — What is the can?** (Answered: it's important, it does not like being ignored, and everyone who sees it goes quiet for a second.)
2. **Act 2 — Why does everyone recognize it?** The castle steward, the pirate captain, the hermit in the shore house — older characters flinch when they see the can. Rumors accumulate through Thoughts: the can predates the island. The rubble was a foundry. The mountains are where cans *came from*.
3. **Act 3 — What's inside?** The player assembles the opener at the summit and opens it. The contents are deliberately left undecided for now (candidates at the bottom); all Act 2/3 mystery beats are written to work with any of them.

## Currency = Act Structure

- **Copper (Act 1, done):** forest → village → Fox → map. Copper is peasant money.
- **Silver (Act 2):** unlocked at the **castle**. Silver is the coin of the realm — castle, plains, shore house, desert, pond, rubble, cave, windmill all trade in it. Copper still exists but shops start sneering at it.
- **Gold (Act 3):** unlocked on the **pirate ship**. Pirates only deal in gold; the mountain toll is paid in it. Gold is scarce, plot-gated, and mostly earned rather than idled.
- **Exchange:** the **pond** (center of the map) is the island's only money-changer — copper↔silver↔gold can be converted there, at an unfavorable rate. This keeps no currency ever fully dead: late-game copper trickle can be laundered upward, and a desperate player can break gold downward. Rates should sting enough that earning the native currency is always better.

## The Four Parts — Placement

| Part | Location | Guarded by |
|---|---|---|
| **Handle** | Castle vault | Castle questline (Act 2 opener) |
| **Cutting wheel** | Cave | Gauntlet of enemies (combat showcase) |
| **Drive wheel** | Pirate ship | The captain (Act 3 opener) |
| **Pivot** | Mountains | Final boss / final choice |

The pivot is deliberately last and smallest — a joke the narrator gets to make ("You crossed an ocean of problems for a piece of metal the size of a regret").

---

## Location-by-Location Beats

Ordered along the map path: village → bridge → castle → plains → shore house → desert → pond → rubble → bridge/tree → cave → windmill → pirate ship → mountains.

### 1. Village (done) → Bridge → **Castle** — *Act 2 opens*
The village map reveals the castle — but the bridge is barred by a **Guardian** (the game's first real wall: a fight the player cannot win on arrival). The bridge is a *test*, and the test sends the player outward first:
- **Plains:** the farmers know the Guardian's pattern ("it drops its guard when it rears") — helping with their crop-raider problem earns the tell, and a mid-tier weapon or armor piece.
- **House on the shore:** the hermit has something the Guardian fears or lacks (an old signal lamp? a piece of its missing kit?) — traded for a favor, in keeping with his story-for-favors economy.
- **Back to the village:** the blacksmith can forge/upgrade gear once the player brings materials from the plains; Village Hall has archives on what the Guardian actually is.

None of the three is strictly mandatory alone, but the fight is tuned so an unprepared player loses and each errand meaningfully tilts it. Defeating the Guardian opens the bridge for good.

Across it, the **castle is the game's first true dungeon** — not bureaucratic, but fallen: fight room-by-room through halls, barracks, and up the keep (basic → medium tier enemies, a rest point at the chapel), ending in a vault boss. The **handle** is in the vault, along with the player's first **silver bits**, unlocking the silver currency. One survivor — the steward, hiding in the vault — flinches at the can and won't say why. First Act 2 mystery Thought. His remaining plea seeds the next destination: a caravan carrying castle cargo vanished in the desert (→ desert).

### 2. Plains
Visited *before* the castle as part of the bridge test. Pastoral breather. Farms besieged by something eating the crops at night — combat encounters (crows? a scarecrow that walks?). Clearing it earns the Guardian's tell, blacksmith materials, and copper income; a shop with mid-tier gear. Farmers mention the windmill "hasn't turned in years, but the flour keeps coming." Plant that thread here; pay it off much later. (Re-visit value after the castle: the shop restocks in silver.)

### 3. House on the Shore
Also visited pre-castle: his first favor-trade is the item the Guardian fears or lacks. A hermit ex-lighthouse-keeper who *recognizes the can* and is the game's lore faucet — he trades stories for favors, one per major beat, drip-feeding the mystery across the whole game. He also teaches navigation, which the player needs later to board the pirate ship. Emotional core of the middle game: the one character who is kind without wanting anything.

### 4. Desert
The vanished caravan (the steward's plea). Navigation hazard (thirst as a soft timer? mirage screens that reroute you). The caravan turns out to have been hauling **crates of empty cans** — hundreds of them, all copper, all sealed, all silent. Yours is the only one that hums. Big mystery escalation. Reward: silver, and a strange desert merchant who will later appear again on the pirate ship (recurring NPC).

### 5. Pond — *Pool of Introspection*
No combat, no gear shop — but it is the island's **money-changer**. Something in the water (a very literal-minded spirit? a fish with a ledger?) exchanges copper↔silver↔gold at a bad rate, deadpan about it: "The water takes a cut. The water always takes a cut." Beyond commerce, the player looks in and the game shows... whatever the player currently is (a Thought-driven scene that changes based on flags: items bought, choices made, whether they refused the can way back at 10 bits). Small permanent bonus for visiting between major beats. This is where the game quietly asks whether the player *wants* to know what's in the can.

### 6. Rubble
The ruins of a **foundry** — the place the cans were made. Environmental storytelling: molds, a shipping ledger ("4,000 units. Recall issued. One unit unaccounted for."), a broken stamp bearing the same mark as the player's can. No boss; one tough optional enemy guarding the ledger. This is the biggest lore drop before Act 3.

### 7. Bridge with the Tree (Toll Tree)
The tree talks. It demands a toll but doesn't want money — it wants a *Thought* (the player permanently gives up one unlocked Thought of their choice; mechanically trivial, emotionally weird). It's the world's oldest thing and drops one cryptic line about the mountains: "They opened one up there, once. Only once."

### 8. Cave — **Cutting Wheel**
Combat showcase. A descending gauntlet using the enemy roster (bats/basic → skeletons/medium → complex tier at the bottom) with a rest point midway. Bottom chamber: the **cutting wheel**, embedded in the wall like it was thrown there very hard a long time ago. Boss guarding it. Exiting the cave the first time is the Act 2 midpoint.

### 9. Windmill
Payoff of the plains thread. The windmill grinds on its own — inside, gears turn with no wind, and one gear is conspicuously missing from the mechanism... the same size as a **drive wheel**. The miller (or ghost-miller?) tells the player the pirates took it years ago, "said it belonged to their captain." This is the signpost that sends the player to the ship, and it retroactively explains the pirates: they've been collecting opener parts too.

### 10. Pirate Ship — *Act 3 opens* — **Drive Wheel**
The second major setpiece. The captain **has been hunting can-opener parts her whole life** — she has the drive wheel and knows what the can is, or thinks she does. Her goal was never to open a can; it was to make sure *nobody* opened this one, and she is not negotiating. Boarding the ship kicks off a multi-stage run: fight up through the crew (deckhands → first mate as a mid-boss), then the **captain duel** on the quarterdeck — the hardest fight before the mountains, a full grid-mode enemy with armor zones and a discover-model weak zone (her off hand, the one gripping the drive wheel). Defeating her earns the drive wheel and unlocks **gold bits** (her hoard) plus ship activities for gold income: cards/dice minigames, jobs for the now-captainless crew. Her defeated line points the player at the mountain: "It explains the rest. I wish it didn't." Optional: the crew, freed of her obsession, will sail the player around the island (fast travel unlock).

### 11. Mountains — *Finale* — **Pivot**
Winter Peak. Ascent structured as a gauntlet: hardest enemies, thin checkpoints, the dragon as the summit boss (needs the boss-arena height bump — dragon is 25 lines vs `COMBAT_ARENA_HEIGHT = 16`). At the top: a shrine shaped like a can opener stand, the **pivot** resting on it, and evidence of the "only once" the tree mentioned — a single opened can, ancient, empty.

The player assembles the opener. The game asks, once, plainly, with no narrator jokes: **"Open it?"**

## Ending

**Contents of the can: intentionally undecided.** Everything up to the summit is written so that any reveal (or non-reveal) slots in — the mystery beats (foundry ledger, caravan of silent cans, the tree's "only once," the ancient opened-and-empty can at the shrine) escalate the question without committing to an answer. Decide the contents late, once the tone of the finished Act 2/3 content is clear.

The final beat is fixed regardless: the player assembles the opener and the game asks, once, plainly, with no narrator jokes: **"Open it?"** Saying no gets a single "Are you sure?" confirmation — a beat, not a branch — and then the game waits at the shrine until the player opens it. There is one ending.

## Candidate contents (decide later)
- **Loop: the first copper bit.** Opening the can is what wakes you beneath the forest. Feeds cleanly into NG+.
- **Empty.** Bleak Candy Box shrug. Risk: anticlimax.
- **The narrator.** Opening it silences the narration for the epilogue.
- **You** (memories/body). Most conventional; weakest fit for the deadpan tone.

## Open Questions (for Evan)
1. Where do Squirrel Court, Red Forest, and Valley Wasteland (from earlier location lists) fit — Act 2 optional side areas, or cut?
2. How dark can the lore go? (The foundry recall implies the cans were... something. Do we ever say what?)
3. Does defeating the captain kill her, or leave her alive on her ship as a post-game NPC? (Affects the fast-travel framing.)
4. Should the dragon at the summit guard the pivot, or *be* the "only once" — the thing that came out of the opened can?