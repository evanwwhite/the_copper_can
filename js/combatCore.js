// The active combat reducer specced in combat.md. No DOM, no localStorage,
// no timers in here — stepCombat takes state and mutates it one tick forward,
// so it can be driven headless and tuned offline.

import { COMBAT_TUNING } from "./data.js";

function randomInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function pick(lines) {
  return lines[Math.floor(Math.random() * lines.length)];
}

export function pushCombatLog(combat, text, kind = "info", cap = COMBAT_TUNING.logCap) {
  combat.log.push({ text, kind });
  if (combat.log.length > cap) {
    combat.log.splice(0, combat.log.length - cap);
  }
  combat.message = text;
}

// Numpad-spatial column: 1/4/7 = left (1), 2/5/8 = center (2), 3/6/9 = right (3).
export function zoneColumn(zone) {
  return ((zone - 1) % 3) + 1;
}

function zoneLookup(enemy, zoneMap, zone) {
  if (!zoneMap) return undefined;
  if (enemy.zoneMode === "thirds") return zoneMap[zoneColumn(zone)];
  return zoneMap[zone];
}

export function isWeakZone(enemy, zone) {
  return zoneLookup(enemy, enemy.weakZones, zone) !== undefined;
}

export function isWeakCreditable(combat, enemy) {
  if (enemy.weakZoneModel === "window") return combat.enemyStagger > 0;
  return combat.weakRevealed;
}

export function zoneMultiplier(combat, enemy, zone) {
  // Center is always safe: never weak, never armored.
  if (enemy.zoneMode === "thirds" ? zoneColumn(zone) === 2 : zone === 5) return 1;

  const weak = zoneLookup(enemy, enemy.weakZones, zone);
  if (weak !== undefined && isWeakCreditable(combat, enemy)) return weak;

  const armor = zoneLookup(enemy, enemy.armorZones, zone);
  if (armor !== undefined) return armor;

  return 1;
}

export function getGap(combat) {
  return Math.max(0, Math.round(combat.enemyX - combat.playerX));
}

export function getRangeBand(combat, enemy, tuning = COMBAT_TUNING) {
  const gap = getGap(combat);
  if (gap <= enemy.reach) return "melee";
  if (gap <= tuning.midBandMax) return "mid";
  return "long";
}

export function weaponBand(weaponKey, enemy, tuning = COMBAT_TUNING) {
  const weapon = tuning.weapons[weaponKey];
  if (weaponKey === "sword") return [0, enemy.reach];
  return weapon.band;
}

export function isWeaponInBand(combat, enemy, weaponKey, tuning = COMBAT_TUNING) {
  const [min, max] = weaponBand(weaponKey, enemy, tuning);
  const gap = getGap(combat);
  return gap >= min && gap <= max;
}

export function canWeaponFire(combat, enemy, weaponKey, tuning = COMBAT_TUNING) {
  const weapon = tuning.weapons[weaponKey];
  if (!weapon) return false;
  if (!isWeaponInBand(combat, enemy, weaponKey, tuning)) return false;
  if (combat.cooldowns[weaponKey] > 0) return false;
  if (weapon.usesAmmo && combat.slingshotAmmo <= 0) return false;
  return true;
}

const VOICE = {
  hit: (label, damage) => [
    `${label} bites it for ${damage}.`,
    `${label} lands for ${damage}. It noticed.`,
    `${label} connects for ${damage} damage.`,
  ],
  sting: (damage) => [
    `Slingshot stings it for ${damage}.`,
    `A rivet finds it for ${damage}. Humiliating for one of us.`,
  ],
  crit: (damage) => [
    `> Right in the soft spot. ${damage} damage. It did not enjoy that.`,
    `> Found the seam for ${damage}. Deeply satisfying.`,
  ],
  armor: (damage) => [
    `Glanced off armor for ${damage}. That was the wrong spot.`,
    `Clank. ${damage} damage. Mostly to your pride.`,
  ],
  ammoDry: [
    "Out of rivets. Typical.",
    "Out of rivets. We do this the hard way now.",
  ],
  knockback: [
    "It reels back across the dirt.",
    "Gave it some room. Room it did not ask for.",
  ],
  block: (damage) => [
    `Took it on the shield. Rang like a bell. ${damage} got through.`,
    `Caught most of it on the shield. ${damage} still stings.`,
  ],
  parry: [
    "Caught it clean. It staggers, side wide open.",
    "Caught it on the shield. We're both surprised. It staggers.",
  ],
  reveal: [
    "> Something about it looks soft there. Or I'm projecting.",
    "> Found the soft spot. It won't like that.",
  ],
  hurt: (damage, hp, maxHp) => [
    `That'll dent. ${damage} damage. ${hp}/${maxHp} left.`,
    `It connects for ${damage}. I'm mostly dents at this point. ${hp}/${maxHp}.`,
  ],
  guardOut: [
    "The shield arm gives out. Guard's spent.",
  ],
  victory: [
    "Still a can. Still standing. Low bar, cleared.",
  ],
};

function playerAttack(combat, enemy, weaponKey, tuning) {
  const weapon = tuning.weapons[weaponKey];
  const multiplier = zoneMultiplier(combat, enemy, combat.targetZone);
  const baseDamage = randomInt(weapon.damage[0], weapon.damage[1]);
  const damage = Math.max(1, Math.round(baseDamage * multiplier));
  const isCrit = multiplier > 1;
  const isArmored = multiplier < 1;

  combat.enemyHp = Math.max(0, combat.enemyHp - damage);
  combat.cooldowns[weaponKey] = weapon.cooldownTicks;

  if (weapon.usesAmmo) {
    combat.slingshotAmmo -= 1;
    if (combat.slingshotAmmo === 0) {
      pushCombatLog(combat, pick(VOICE.ammoDry), "info");
    }
  }

  combat.hitFlash = {
    text: isCrit ? `${damage}!` : `${damage}`,
    over: "enemy",
    ticks: 6,
  };

  if (isCrit) {
    pushCombatLog(combat, pick(VOICE.crit(damage)), "crit");
  } else if (isArmored) {
    pushCombatLog(combat, pick(VOICE.armor(damage)), "hit");
  } else if (weaponKey === "slingshot") {
    pushCombatLog(combat, pick(VOICE.sting(damage)), "hit");
  } else {
    pushCombatLog(combat, pick(VOICE.hit(weapon.label, damage)), "hit");
  }

  // Sword hits and weak-point crits shove the enemy back; lunge re-closes.
  if ((weapon.knockback || isCrit) && combat.enemyHp > 0) {
    const distance = Math.max(
      0,
      tuning.baseKnockback - (enemy.knockbackResist ?? 0) * 2,
    );
    if (distance > 0) {
      const arenaCeiling = combat.enemyHomeX + 8;
      const moved = Math.min(distance, arenaCeiling - combat.enemyX);
      combat.enemyX += moved;
      // Whatever the arena wall eats, push the can back instead so the gap
      // still reopens.
      combat.playerX = Math.max(2, combat.playerX - (distance - moved));
      combat.enemyLungeDelay = 6;
      combat.enemyTelegraph = 0;
      pushCombatLog(combat, pick(VOICE.knockback), "info");
    }
  }
}

function enemyTurn(combat, enemy, playerStats, tuning) {
  // Stagger: the enemy is reeling; it does nothing.
  if (combat.enemyStagger > 0) return;

  // Lunge to re-close on its own timer whenever the can is out of reach —
  // knocked back or not. This is what stops mid-band kiting from being free.
  if (getGap(combat) > enemy.reach) {
    if (combat.enemyLungeDelay > 0) {
      combat.enemyLungeDelay -= 1;
    } else {
      combat.enemyX -= 1;
      combat.enemyLungeDelay = 3; // one step every four ticks
    }
  }

  const gap = getGap(combat);
  if (gap > enemy.reach) {
    // Out of reach: the wind-up pauses (it does NOT reset, or knockback
    // spam would disarm the enemy entirely) and the telegraph hides.
    combat.enemyTelegraph = 0;
    return;
  }

  if (combat.enemyAttackTimer <= 0) {
    combat.enemyAttackTimer = enemy.attack.intervalTicks;
  }

  combat.enemyAttackTimer -= 1;
  combat.enemyTelegraph =
    combat.enemyAttackTimer > 0 &&
    combat.enemyAttackTimer <= enemy.attack.telegraphTicks
      ? combat.enemyAttackTimer
      : 0;

  if (combat.enemyAttackTimer > 0) return;

  // The attack lands.
  combat.enemyTelegraph = 0;
  combat.enemyAttackTimer = enemy.attack.intervalTicks;

  let damage = enemy.attack.damage;
  const blocked = combat.bracing && combat.guard > 0;
  if (blocked) damage *= 1 - tuning.blockReduction;
  damage = Math.max(0, Math.round(damage - playerStats.damageReduction));

  if (damage > 0) {
    combat.hitFlash = { text: `-${damage}`, over: "player", ticks: 6 };
  }

  const playerHp = Math.max(0, playerStats.health - damage);

  if (blocked) {
    pushCombatLog(combat, pick(VOICE.block(damage)), "guard");
  } else {
    pushCombatLog(
      combat,
      pick(VOICE.hurt(damage, playerHp, playerStats.maxHealth)),
      "hurt",
    );
  }

  combat.playerDamageTaken = damage;
}

function resolveParry(combat, enemy) {
  combat.enemyTelegraph = 0;
  combat.enemyStagger = enemy.attack.staggerTicks;
  combat.enemyAttackTimer = enemy.attack.intervalTicks;
  pushCombatLog(combat, pick(VOICE.parry), "guard");

  if (!combat.weakRevealed) {
    combat.weakRevealed = true;
    pushCombatLog(combat, pick(VOICE.reveal), "crit");
  }
}

// Advances combat one tick. Mutates `combat`; returns it. Player health is
// NOT mutated here — the tick reports damage via combat.playerDamageTaken and
// the driver applies it, keeping this reducer free of outside state.
export function stepCombat(combat, enemy, playerStats, tuning = COMBAT_TUNING) {
  combat.ticks += 1;
  combat.playerDamageTaken = 0;

  if (combat.hitFlash && --combat.hitFlash.ticks <= 0) {
    combat.hitFlash = null;
  }

  // 0. Parry check: brace released while the enemy was winding up.
  if (combat.releasedBrace) {
    if (combat.enemyTelegraph > 0) {
      resolveParry(combat, enemy);
    }
    combat.releasedBrace = false;
  }

  // 1. Advance. The can runs right on its own; bracing halves the pace.
  const step = tuning.moveStep * (combat.bracing ? tuning.braceMoveMultiplier : 1);
  combat.playerX = Math.min(combat.playerX + step, combat.enemyX - 1);

  // 2. Regen: ammo trickles back; guard drains while braced, refills otherwise.
  if (combat.slingshotAmmo < tuning.slingshotAmmoMax) {
    combat.ammoRegenCounter += 1;
    if (combat.ammoRegenCounter >= tuning.slingshotRegenTicks) {
      combat.ammoRegenCounter = 0;
      combat.slingshotAmmo += 1;
    }
  }

  if (combat.bracing) {
    combat.guard = Math.max(0, combat.guard - tuning.guardDrainPerTick);
    if (combat.guard === 0) {
      combat.bracing = false;
      pushCombatLog(combat, pick(VOICE.guardOut), "info");
    }
  } else {
    combat.guard = Math.min(tuning.guardMax, combat.guard + tuning.guardRefillPerTick);
  }

  // 3. Player action. Bracing skips the attack; cooldowns pause too.
  if (!combat.bracing) {
    Object.keys(combat.cooldowns).forEach((key) => {
      if (combat.cooldowns[key] > 0) combat.cooldowns[key] -= 1;
    });

    let weaponKey = combat.equippedWeapon;
    const owned = (key) => playerStats.weapons.includes(key);

    if (!owned(weaponKey) || !canWeaponFire(combat, enemy, weaponKey, tuning)) {
      // The idle floor: a dry slingshot auto-swings whatever else reaches.
      const fallback =
        weaponKey === "slingshot" && combat.slingshotAmmo <= 0
          ? ["sword", "spear"].find(
              (key) => owned(key) && canWeaponFire(combat, enemy, key, tuning),
            )
          : null;
      weaponKey = fallback ?? null;
    }

    // Unarmed floor: a can with no weapons still throws bare hands once it's
    // closed to melee, so a weaponless player can never be hard-stuck.
    if (
      !weaponKey &&
      playerStats.weapons.length === 0 &&
      canWeaponFire(combat, enemy, "fists", tuning)
    ) {
      weaponKey = "fists";
    }

    if (weaponKey) {
      playerAttack(combat, enemy, weaponKey, tuning);
    }
  }

  if (combat.enemyHp === 0) {
    combat.phase = "victory";
    pushCombatLog(combat, enemy.victoryText, "result");
    pushCombatLog(combat, pick(VOICE.victory), "result");
    return combat;
  }

  // 4. Enemy behavior on its own timers.
  enemyTurn(combat, enemy, playerStats, tuning);

  if (playerStats.health - combat.playerDamageTaken <= 0) {
    combat.phase = "defeat";
    pushCombatLog(
      combat,
      "You are beaten back. There is no shame in retreat.",
      "result",
    );
    return combat;
  }

  // 5. Decrement enemy windows.
  if (combat.enemyStagger > 0) combat.enemyStagger -= 1;

  return combat;
}
