export const SCENE_TICK_MS = 90;

export const SCENE_COMBAT_TUNING = {
  playerSpeed: 1,
  playerRadius: 2,
  guardMax: 100,
  guardDrainPerTick: 8,
  guardRefillPerTick: 5,
  blockReduction: 0.55,
  parryRangePadding: 3,
  ammoMax: 6,
  ammoRegenTicks: 30,
  effectTicks: 8,
  logCap: 80,
};

// Equipment contract shared by the Pack, save migration, and combat. Ownership
// and loadout are intentionally separate: owning an item puts it in the Pack;
// its *Equipped flag determines whether combat may use its effect or styles.
export const EQUIPMENT_DEFINITIONS = {
  slingshot: { label: "Slingshot", slot: "weapon" },
  sword: { label: "Sword", slot: "weapon" },
  spear: { label: "Spear", slot: "weapon" },
  boots: { label: "Boots", slot: "legs" },
};

export const EQUIPMENT_ITEM_KEYS = Object.freeze(
  Object.keys(EQUIPMENT_DEFINITIONS),
);

export function ownsEquipment(inventory, itemKey) {
  return Boolean(EQUIPMENT_DEFINITIONS[itemKey] && inventory?.[itemKey]);
}

export function isEquipmentEquipped(inventory, itemKey) {
  return Boolean(
    ownsEquipment(inventory, itemKey) && inventory?.[`${itemKey}Equipped`],
  );
}

export function getEquippedItemKeys(inventory, slot = null) {
  return EQUIPMENT_ITEM_KEYS.filter((itemKey) => {
    const definition = EQUIPMENT_DEFINITIONS[itemKey];
    return (
      (!slot || definition.slot === slot) &&
      isEquipmentEquipped(inventory, itemKey)
    );
  });
}

// A heavy sword is a two-handed stance for the regular sword, so buying one
// blade unlocks both the one-handed sword and heavy-sword combat styles.
export const SCENE_WEAPONS = {
  fists: {
    label: "Bare hands",
    ownedBy: null,
    damage: [1, 2],
    minRange: 0,
    maxRange: 3,
    cooldownTicks: 6,
    recoveryTicks: 2,
    canUseShield: false,
    projectile: false,
    knockback: 0,
    armorPiercing: 0,
    tags: ["melee"],
  },
  slingshot: {
    label: "Slingshot",
    ownedBy: "slingshot",
    damage: [1, 2],
    minRange: 2,
    maxRange: 80,
    cooldownTicks: 6,
    recoveryTicks: 2,
    canUseShield: false,
    projectile: true,
    projectileSpeed: 4,
    knockback: 0,
    armorPiercing: 0,
    tags: ["ranged", "antiAir"],
  },
  sword: {
    label: "Sword",
    ownedBy: "sword",
    damage: [4, 6],
    minRange: 0,
    maxRange: 5,
    cooldownTicks: 8,
    recoveryTicks: 3,
    canUseShield: true,
    projectile: false,
    knockback: 0,
    armorPiercing: 0,
    tags: ["melee", "oneHanded"],
  },
  heavySword: {
    label: "Heavy sword",
    ownedBy: "sword",
    damage: [8, 11],
    minRange: 0,
    maxRange: 6,
    cooldownTicks: 17,
    recoveryTicks: 11,
    canUseShield: false,
    projectile: false,
    knockback: 8,
    staggerTicks: 9,
    armorPiercing: 2,
    vulnerableMultiplier: 1.5,
    tags: ["melee", "heavy", "twoHanded"],
  },
  spear: {
    label: "Spear",
    ownedBy: "spear",
    damage: [6, 8],
    minRange: 2,
    maxRange: 10,
    cooldownTicks: 14,
    recoveryTicks: 8,
    canUseShield: false,
    projectile: false,
    knockback: 6,
    staggerTicks: 7,
    armorPiercing: 1,
    vulnerableMultiplier: 1.3,
    tags: ["melee", "reach", "twoHanded"],
  },
};

export const SCENE_ENEMY_TYPES = {
  rustMite: {
    name: "Rust Mite",
    sprite: "rustMite",
    deadSprite: "rustMiteDead",
    maxHealth: 12,
    defense: 0,
    speed: 0.42,
    reach: 3,
    aggroRange: 34,
    contactRadius: 2,
    knockbackResistance: 0,
    lane: "ground",
    weaponModifiers: {
      slingshot: 1,
      sword: 1.2,
      heavySword: 0.9,
      spear: 1,
      fists: 1,
    },
    attack: {
      damage: 1,
      intervalTicks: 24,
      telegraphTicks: 7,
      lungeDistance: 1,
      activeTicks: 2,
      recoveryTicks: 7,
      staggerTicks: 8,
    },
    rewardCopperBits: 2,
  },
  ironShell: {
    name: "Iron Shell",
    sprite: "ironShell",
    deadSprite: "ironShellDead",
    maxHealth: 30,
    defense: 2,
    speed: 0.22,
    reach: 4,
    aggroRange: 30,
    contactRadius: 3,
    knockbackResistance: 3,
    lane: "ground",
    weaponModifiers: {
      slingshot: 0.35,
      sword: 0.8,
      heavySword: 1.3,
      spear: 1.1,
      fists: 0.5,
    },
    attack: {
      damage: 4,
      intervalTicks: 38,
      telegraphTicks: 10,
      lungeDistance: 1,
      activeTicks: 2,
      recoveryTicks: 11,
      staggerTicks: 7,
    },
    rewardCopperBits: 7,
  },
  wireMagpie: {
    name: "Wire Magpie",
    sprite: "wireMagpie",
    deadSprite: "wireMagpieDead",
    maxHealth: 10,
    defense: 0,
    speed: 0.55,
    reach: 5,
    aggroRange: 38,
    contactRadius: 2,
    knockbackResistance: 0,
    lane: "highAir",
    yOffset: -7,
    weaponModifiers: {
      slingshot: 1.8,
      sword: 0.45,
      heavySword: 0.3,
      spear: 1,
      fists: 0.25,
    },
    attack: {
      damage: 2,
      intervalTicks: 28,
      telegraphTicks: 7,
      lungeDistance: 1,
      activeTicks: 2,
      recoveryTicks: 8,
      staggerTicks: 7,
    },
    rewardCopperBits: 4,
  },
  darkTreeWatcher: {
    name: "Fox",
    sprite: "fox",
    deadSprite: "foxDead",
    maxHealth: 18,
    defense: 0,
    speed: 0.5,
    reach: 5,
    aggroRange: 45,
    contactRadius: 3,
    knockbackResistance: 1,
    lane: "ground",
    weaponModifiers: {
      slingshot: 1,
      sword: 1.15,
      heavySword: 1,
      spear: 1,
      fists: 0.8,
    },
    attack: {
      damage: 2,
      intervalTicks: 25,
      telegraphTicks: 7,
      lungeDistance: 1,
      activeTicks: 2,
      recoveryTicks: 7,
      staggerTicks: 9,
    },
    rewardCopperBits: 6,
  },
};

export function getAvailableSceneWeapons(inventory, demo = false) {
  const available = Object.entries(SCENE_WEAPONS)
    .filter(
      ([key, weapon]) =>
        key !== "fists" &&
        (demo || isEquipmentEquipped(inventory, weapon.ownedBy)),
    )
    .map(([key]) => key);

  return available.length > 0 ? available : ["fists"];
}

// Q/W/E are stance controls. A stance may expose more than one prepared style;
// pressing that stance repeatedly cycles its available styles. This lets E
// contain both an equipped heavy sword and spear without adding a fourth key.
export function getSceneCombatStances(inventory, demo = false) {
  const available = new Set(getAvailableSceneWeapons(inventory, demo));
  const makeStance = (key, label, weaponKeys) => ({
    key,
    label,
    weaponKeys: weaponKeys.filter((weaponKey) => available.has(weaponKey)),
  });

  return [
    makeStance("q", "Long range", ["slingshot"]),
    makeStance("w", "One-handed", ["sword"]),
    makeStance("e", "Heavy two-handed", ["heavySword", "spear"]),
  ];
}
