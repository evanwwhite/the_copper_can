import { describe, expect, test } from "bun:test";

import {
  createInitialGameState,
  createWalkState,
  SAVE_VERSION,
} from "./gameState.js";
import {
  createSceneEnemy,
  stepSceneCombat,
} from "./sceneCombatCore.js";
import {
  getAvailableSceneWeapons,
  getSceneCombatStances,
  SCENE_ENEMY_TYPES,
  SCENE_WEAPONS,
} from "./sceneCombatData.js";
import { hydrateGameState, serializeGameState } from "./saveSystem.js";

const SCENE = { minX: 0, maxX: 100 };
const LOW_RANDOM = () => 0;

function makeEnemy(type, x, overrides = {}) {
  return {
    ...createSceneEnemy({ id: `${type}-test`, type, x }),
    ...overrides,
  };
}

function makeState(weaponKey, enemy, overrides = {}) {
  return {
    ...createWalkState(),
    active: true,
    phase: "fight",
    playerX: 10,
    facing: 1,
    equippedWeapon: weaponKey,
    enemies: [enemy],
    ...overrides,
  };
}

function makeStats(weapons, damageReduction = 0) {
  return {
    health: 10,
    maxHealth: 10,
    weapons,
    hasShield: true,
    damageReduction,
  };
}

describe("equipment and stance availability", () => {
  test("only owned and equipped weapons enter the combat loadout", () => {
    const inventory = {
      slingshot: true,
      slingshotEquipped: false,
      sword: true,
      swordEquipped: true,
      spear: true,
      spearEquipped: true,
    };

    expect(getAvailableSceneWeapons(inventory)).toEqual([
      "sword",
      "heavySword",
      "spear",
    ]);
    expect(getSceneCombatStances(inventory)).toEqual([
      { key: "q", label: "Long range", weaponKeys: [] },
      { key: "w", label: "One-handed", weaponKeys: ["sword"] },
      {
        key: "e",
        label: "Heavy two-handed",
        weaponKeys: ["heavySword", "spear"],
      },
    ]);
  });

  test("a weaponless loadout always receives fists", () => {
    expect(getAvailableSceneWeapons({})).toEqual(["fists"]);
  });

  test("only the one-handed sword stance leaves the lid hand free", () => {
    expect(SCENE_WEAPONS.sword.canUseShield).toBe(true);
    expect(SCENE_WEAPONS.slingshot.canUseShield).toBe(false);
    expect(SCENE_WEAPONS.heavySword.canUseShield).toBe(false);
    expect(SCENE_WEAPONS.spear.canUseShield).toBe(false);
  });
});

describe("automatic player attacks", () => {
  test("attacks a fox in range and respects cooldown and recovery", () => {
    const enemy = makeEnemy("darkTreeWatcher", 15);
    const state = makeState("sword", enemy);
    const stats = makeStats(["sword"]);

    stepSceneCombat(state, SCENE, stats, LOW_RANDOM);
    expect(enemy.hp).toBe(13);
    expect(state.attackCooldown).toBe(8);
    expect(state.recoveryTimer).toBe(3);

    stepSceneCombat(state, SCENE, stats, LOW_RANDOM);
    expect(enemy.hp).toBe(13);

    for (let tick = 0; tick < 7; tick += 1) {
      stepSceneCombat(state, SCENE, stats, LOW_RANDOM);
    }
    expect(enemy.hp).toBe(8);
  });

  test("holds the weapon ready instead of attacking empty range", () => {
    const enemy = makeEnemy("darkTreeWatcher", 30);
    const state = makeState("sword", enemy);

    stepSceneCombat(state, SCENE, makeStats(["sword"]), LOW_RANDOM);

    expect(enemy.hp).toBe(enemy.maxHp);
    expect(state.attackCooldown).toBe(0);
    expect(state.recoveryTimer).toBe(0);
  });

  test("fists can kill and grant a reward exactly once", () => {
    const enemy = makeEnemy("rustMite", 13, { hp: 1 });
    const state = makeState("fists", enemy);
    const stats = makeStats(["fists"]);

    stepSceneCombat(state, SCENE, stats, LOW_RANDOM);
    expect(enemy.hp).toBe(0);
    expect(state.rewards).toEqual([
      {
        instanceId: "rustMite-test",
        type: "rustMite",
        storyFlag: null,
        copperBits: SCENE_ENEMY_TYPES.rustMite.rewardCopperBits,
      },
    ]);
    expect(state.defeatedSpawnIds["rustMite-test"]).toBe(true);

    stepSceneCombat(state, SCENE, stats, LOW_RANDOM);
    expect(state.rewards).toEqual([]);
    expect(state.encounterComplete).toBe(true);
  });
});

describe("the three encounter mechanics", () => {
  test("fox attacks can be blocked, boots reduce damage, and release parries", () => {
    const attackingFox = (id) => makeEnemy("darkTreeWatcher", 15, {
      instanceId: id,
      state: "attackForward",
      stateTimer: 2,
      attackOriginX: 15,
      attackHitResolved: false,
    });
    const unarmored = makeState("sword", attackingFox("fox-unarmored"), {
      bracing: true,
    });
    const booted = makeState("sword", attackingFox("fox-booted"), {
      bracing: true,
    });

    stepSceneCombat(unarmored, SCENE, makeStats(["sword"], 0), LOW_RANDOM);
    stepSceneCombat(booted, SCENE, makeStats(["sword"], 1), LOW_RANDOM);
    expect(unarmored.playerDamageTaken).toBe(1);
    expect(booted.playerDamageTaken).toBe(0);

    const telegraphingFox = makeEnemy("darkTreeWatcher", 15, {
      state: "telegraph",
      stateTimer: 5,
    });
    const parryState = makeState("sword", telegraphingFox, {
      releasedBrace: true,
    });
    stepSceneCombat(parryState, SCENE, makeStats(["sword"]), LOW_RANDOM);
    expect(telegraphingFox.state).toBe("stagger");
    expect(parryState.playerDamageTaken).toBe(0);
  });

  test("heavy sword beats Iron Shell armor but commits to recovery", () => {
    const swordShell = makeEnemy("ironShell", 15);
    const heavyShell = makeEnemy("ironShell", 15);
    const swordState = makeState("sword", swordShell);
    const heavyState = makeState("heavySword", heavyShell);

    stepSceneCombat(swordState, SCENE, makeStats(["sword"]), LOW_RANDOM);
    stepSceneCombat(
      heavyState,
      SCENE,
      makeStats(["heavySword"]),
      LOW_RANDOM,
    );

    const swordDamage = swordShell.maxHp - swordShell.hp;
    const heavyDamage = heavyShell.maxHp - heavyShell.hp;
    expect(swordDamage).toBe(1);
    expect(heavyDamage).toBe(10);
    expect(heavyDamage).toBeGreaterThan(swordDamage);
    expect(heavyState.recoveryTimer).toBe(11);
    expect(heavyShell.x).toBeGreaterThan(15);
    expect(heavyShell.state).toBe("stagger");
  });

  test("slingshot automatically targets the airborne Wire Magpie lane", () => {
    const magpie = makeEnemy("wireMagpie", 20);
    const state = makeState("slingshot", magpie);
    const stats = makeStats(["slingshot"]);

    stepSceneCombat(state, SCENE, stats, LOW_RANDOM);
    expect(state.slingshotAmmo).toBe(5);
    expect(state.projectiles).toHaveLength(1);
    expect(state.projectiles[0].lane).toBe("highAir");

    stepSceneCombat(state, SCENE, stats, LOW_RANDOM);
    expect(magpie.hp).toBe(8);
    expect(state.projectiles).toHaveLength(0);
  });
});

describe("save and resume", () => {
  test("preserves active combat timing, enemies, projectiles, and loadout", () => {
    const source = createInitialGameState();
    source.inventory.sword = true;
    source.inventory.swordEquipped = true;
    source.inventory.boots = true;
    source.inventory.bootsEquipped = true;
    source.walk = makeState(
      "heavySword",
      makeEnemy("ironShell", 42, { hp: 17, state: "recovery", stateTimer: 6 }),
      {
        attackCooldown: 5,
        recoveryTimer: 4,
        projectiles: [
          {
            id: "saved-shot",
            x: 18,
            originX: 10,
            direction: 1,
            lane: "highAir",
            yOffset: -7,
            speed: 4,
            maxDistance: 80,
            weaponKey: "slingshot",
          },
        ],
      },
    );

    const saved = JSON.parse(JSON.stringify(serializeGameState(source)));
    const resumed = hydrateGameState(saved);

    expect(resumed.saveVersion).toBe(SAVE_VERSION);
    expect(resumed.walk.active).toBe(true);
    expect(resumed.walk.equippedWeapon).toBe("heavySword");
    expect(resumed.walk.attackCooldown).toBe(5);
    expect(resumed.walk.recoveryTimer).toBe(4);
    expect(resumed.walk.enemies[0].hp).toBe(17);
    expect(resumed.walk.enemies[0].stateTimer).toBe(6);
    expect(resumed.walk.projectiles[0].lane).toBe("highAir");
    expect(resumed.inventory.bootsEquipped).toBe(true);
  });
});
