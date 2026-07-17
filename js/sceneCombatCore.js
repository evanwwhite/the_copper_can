import {
  SCENE_COMBAT_TUNING,
  SCENE_ENEMY_TYPES,
  SCENE_WEAPONS,
} from "./sceneCombatData.js";

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

function directionToward(targetX, sourceX) {
  return targetX < sourceX ? -1 : 1;
}

function randomInt(minimum, maximum, random = Math.random) {
  return minimum + Math.floor(random() * (maximum - minimum + 1));
}

function distanceBetween(a, b) {
  const leftX = a.x ?? a.playerX;
  const rightX = b.x ?? b.playerX;
  return Math.abs(leftX - rightX);
}

function isInFront(player, x) {
  const difference = x - (player.x ?? player.playerX);
  return difference === 0 || Math.sign(difference) === player.facing;
}

export function pushSceneLog(
  sceneState,
  text,
  kind = "info",
  cap = SCENE_COMBAT_TUNING.logCap,
) {
  sceneState.log.push({ text, kind });
  if (sceneState.log.length > cap) {
    sceneState.log.splice(0, sceneState.log.length - cap);
  }
  sceneState.message = text;
}

export function createSceneEnemy(spawn) {
  const definition = SCENE_ENEMY_TYPES[spawn.type];
  if (!definition) return null;

  return {
    instanceId: spawn.id,
    type: spawn.type,
    x: spawn.x,
    spawnX: spawn.x,
    lane: spawn.lane ?? definition.lane ?? "ground",
    yOffset: spawn.yOffset ?? definition.yOffset ?? 0,
    facing: spawn.facing ?? -1,
    hp: definition.maxHealth,
    maxHp: definition.maxHealth,
    state: "idle",
    stateTimer: 0,
    attackTimer: definition.attack.intervalTicks,
    attackOriginX: spawn.x,
    attackHitResolved: false,
    moveRemainder: 0,
    rewardGranted: false,
    storyFlag: spawn.storyFlag ?? null,
  };
}

export function createSceneEnemies(spawns = [], defeatedSpawnIds = {}) {
  return spawns
    .filter((spawn) => !defeatedSpawnIds[spawn.id])
    .map(createSceneEnemy)
    .filter(Boolean);
}

export function isSceneInCombat(sceneState) {
  return sceneState.enemies.some((enemy) => {
    if (enemy.hp <= 0) return false;
    const definition = SCENE_ENEMY_TYPES[enemy.type];
    return (
      enemy.state !== "idle" ||
      distanceBetween(sceneState, enemy) <= definition.aggroRange
    );
  });
}

function addEffect(sceneState, x, text, kind = "hit", yOffset = -3) {
  sceneState.effects.push({
    id: `${sceneState.ticks}-${sceneState.nextEffectId++}`,
    x,
    yOffset,
    text,
    kind,
    ticks: SCENE_COMBAT_TUNING.effectTicks,
  });
}

function markEnemyDead(sceneState, enemy, definition) {
  if (enemy.hp > 0 || enemy.rewardGranted) return;

  enemy.state = "dead";
  enemy.stateTimer = 0;
  enemy.rewardGranted = true;
  sceneState.defeatedSpawnIds[enemy.instanceId] = true;
  sceneState.rewards.push({
    instanceId: enemy.instanceId,
    type: enemy.type,
    storyFlag: enemy.storyFlag,
    copperBits: definition.rewardCopperBits ?? 0,
  });
  pushSceneLog(
    sceneState,
    `${definition.name} goes still. ${definition.rewardCopperBits ?? 0} copper bits scatter free.`,
    "reward",
  );
}

function calculateDamage(weaponKey, enemy, random) {
  const weapon = SCENE_WEAPONS[weaponKey];
  const definition = SCENE_ENEMY_TYPES[enemy.type];
  const rawDamage = randomInt(weapon.damage[0], weapon.damage[1], random);
  const multiplier = definition.weaponModifiers[weaponKey] ?? 1;
  const effectiveDefense = Math.max(
    0,
    definition.defense - (weapon.armorPiercing ?? 0),
  );

  return Math.max(1, Math.round(rawDamage * multiplier - effectiveDefense));
}

function damageEnemy(sceneState, enemy, weaponKey, random) {
  const definition = SCENE_ENEMY_TYPES[enemy.type];
  const weapon = SCENE_WEAPONS[weaponKey];
  const damage = calculateDamage(weaponKey, enemy, random);

  enemy.hp = Math.max(0, enemy.hp - damage);
  addEffect(sceneState, enemy.x, `${damage}`, "hit", enemy.yOffset - 3);
  pushSceneLog(
    sceneState,
    `${weapon.label} hits ${definition.name} for ${damage}.`,
    "hit",
  );

  if (enemy.hp <= 0) {
    markEnemyDead(sceneState, enemy, definition);
    return;
  }

  if (weapon.knockback > 0) {
    const direction = directionToward(enemy.x, sceneState.playerX);
    const knockback = Math.max(
      1,
      weapon.knockback - definition.knockbackResistance * 2,
    );
    enemy.x = clamp(
      enemy.x + direction * knockback,
      sceneState.bounds.minX,
      sceneState.bounds.maxX,
    );
    enemy.state = "stagger";
    enemy.stateTimer = weapon.staggerTicks ?? 4;
    enemy.attackHitResolved = false;
    pushSceneLog(
      sceneState,
      `${definition.name} is knocked back, but it is already recovering.`,
      "guard",
    );
  }
}

function findAttackTarget(sceneState, weapon) {
  return sceneState.enemies
    .filter((enemy) => enemy.hp > 0)
    .filter((enemy) => isInFront(sceneState, enemy.x))
    .filter((enemy) => {
      const distance = distanceBetween(sceneState, enemy);
      return distance >= weapon.minRange && distance <= weapon.maxRange;
    })
    .sort((left, right) => {
      return distanceBetween(sceneState, left) - distanceBetween(sceneState, right);
    })[0] ?? null;
}

function startPlayerAttack(sceneState, playerStats, random) {
  if (!sceneState.attackRequested) return;
  sceneState.attackRequested = false;

  if (
    sceneState.phase === "defeat" ||
    sceneState.bracing ||
    sceneState.attackCooldown > 0 ||
    sceneState.recoveryTimer > 0 ||
    sceneState.hurtTimer > 0
  ) {
    return;
  }

  const weaponKey = playerStats.weapons.includes(sceneState.equippedWeapon)
    ? sceneState.equippedWeapon
    : playerStats.weapons[0];
  const weapon = SCENE_WEAPONS[weaponKey];
  if (!weapon) return;

  if (weapon.projectile && sceneState.slingshotAmmo <= 0) {
    pushSceneLog(sceneState, "The slingshot is out of rivets.", "info");
    return;
  }

  sceneState.equippedWeapon = weaponKey;
  sceneState.attackCooldown = weapon.cooldownTicks;
  sceneState.recoveryTimer = weapon.recoveryTicks;
  sceneState.attackFrame = Math.max(2, Math.ceil(weapon.recoveryTicks / 2));

  const target = findAttackTarget(sceneState, weapon);

  if (weapon.projectile) {
    sceneState.slingshotAmmo -= 1;
    sceneState.ammoRegenCounter = 0;
    sceneState.projectiles.push({
      id: `shot-${sceneState.ticks}-${sceneState.nextProjectileId++}`,
      x: sceneState.playerX + sceneState.facing * 3,
      originX: sceneState.playerX,
      direction: sceneState.facing,
      lane: target?.lane ?? "ground",
      yOffset: target?.yOffset ?? 0,
      speed: weapon.projectileSpeed,
      maxDistance: weapon.maxRange,
      weaponKey,
    });
    pushSceneLog(sceneState, "A rivet snaps away from the slingshot.", "info");
    return;
  }

  if (!target) {
    pushSceneLog(sceneState, `${weapon.label} cuts through empty air.`, "info");
    return;
  }

  damageEnemy(sceneState, target, weaponKey, random);
}

function updateProjectiles(sceneState, random) {
  const remaining = [];

  sceneState.projectiles.forEach((projectile) => {
    const previousX = projectile.x;
    const nextX = projectile.x + projectile.direction * projectile.speed;
    const crossed = sceneState.enemies
      .filter((enemy) => enemy.hp > 0 && enemy.lane === projectile.lane)
      .filter((enemy) => {
        if (projectile.direction > 0) {
          return enemy.x >= previousX && enemy.x <= nextX;
        }
        return enemy.x <= previousX && enemy.x >= nextX;
      })
      .sort((left, right) => {
        return Math.abs(previousX - left.x) - Math.abs(previousX - right.x);
      })[0];

    if (crossed) {
      damageEnemy(sceneState, crossed, projectile.weaponKey, random);
      return;
    }

    projectile.x = nextX;
    const travelled = Math.abs(projectile.x - projectile.originX);
    if (
      travelled <= projectile.maxDistance &&
      projectile.x >= sceneState.bounds.minX &&
      projectile.x <= sceneState.bounds.maxX
    ) {
      remaining.push(projectile);
    }
  });

  sceneState.projectiles = remaining;
}

function canShield(sceneState, playerStats) {
  const weapon = SCENE_WEAPONS[sceneState.equippedWeapon];
  return Boolean(
    playerStats.hasShield &&
    weapon?.canUseShield &&
    sceneState.recoveryTimer <= 0 &&
    sceneState.hurtTimer <= 0 &&
    sceneState.guard > 0,
  );
}

function resolveParries(sceneState, playerStats) {
  if (!sceneState.releasedBrace) return;
  sceneState.releasedBrace = false;
  if (!playerStats.hasShield) return;

  let parried = 0;
  sceneState.enemies.forEach((enemy) => {
    if (enemy.hp <= 0 || enemy.state !== "telegraph") return;
    const definition = SCENE_ENEMY_TYPES[enemy.type];
    const closeEnough =
      distanceBetween(sceneState, enemy) <=
      definition.reach + SCENE_COMBAT_TUNING.parryRangePadding;
    if (!closeEnough || !isInFront(sceneState, enemy.x)) return;

    enemy.state = "stagger";
    enemy.stateTimer = definition.attack.staggerTicks;
    enemy.attackTimer = definition.attack.intervalTicks;
    enemy.attackHitResolved = false;
    parried += 1;
    addEffect(sceneState, enemy.x, "PARRY", "guard", enemy.yOffset - 4);
  });

  if (parried > 0) {
    pushSceneLog(
      sceneState,
      parried > 1
        ? `The shield catches ${parried} attacks cleanly.`
        : "The shield catches the attack cleanly.",
      "guard",
    );
  }
}

function moveEnemyTowardPlayer(sceneState, enemy, definition) {
  enemy.moveRemainder += definition.speed;
  if (enemy.moveRemainder < 1) return;

  const step = Math.floor(enemy.moveRemainder);
  enemy.moveRemainder -= step;
  const direction = directionToward(sceneState.playerX, enemy.x);
  const minimumGap = SCENE_COMBAT_TUNING.playerRadius + definition.contactRadius;
  const targetX = enemy.x + direction * step;

  if (Math.abs(targetX - sceneState.playerX) < minimumGap) {
    enemy.x = sceneState.playerX - direction * minimumGap;
  } else {
    enemy.x = targetX;
  }
  enemy.x = clamp(enemy.x, sceneState.bounds.minX, sceneState.bounds.maxX);
  enemy.facing = direction;
}

function resolveEnemyHit(sceneState, enemy, definition, playerStats) {
  if (enemy.attackHitResolved) return;
  enemy.attackHitResolved = true;

  const inReach =
    distanceBetween(sceneState, enemy) <=
    definition.reach + definition.attack.lungeDistance + 1;
  if (!inReach) return;

  const shieldFacingEnemy = isInFront(sceneState, enemy.x);
  const blocked =
    sceneState.bracing &&
    shieldFacingEnemy &&
    canShield(sceneState, playerStats);
  const weapon = SCENE_WEAPONS[sceneState.equippedWeapon];
  const vulnerable =
    sceneState.recoveryTimer > 0 ? weapon?.vulnerableMultiplier ?? 1 : 1;

  let damage = definition.attack.damage * vulnerable;
  if (blocked) damage *= 1 - SCENE_COMBAT_TUNING.blockReduction;
  damage = Math.max(0, Math.round(damage - playerStats.damageReduction));

  sceneState.playerDamageTaken += damage;
  sceneState.hurtTimer = damage > 0 ? 4 : sceneState.hurtTimer;
  addEffect(
    sceneState,
    sceneState.playerX,
    damage > 0 ? `-${damage}` : "BLOCK",
    blocked ? "guard" : "hurt",
    -4,
  );
  pushSceneLog(
    sceneState,
    blocked
      ? `${definition.name}'s blow rings off the shield. ${damage} gets through.`
      : `${definition.name} hits for ${damage}.`,
    blocked ? "guard" : "hurt",
  );
}

function updateEnemy(sceneState, enemy, playerStats) {
  if (enemy.hp <= 0 || enemy.state === "dead") return;
  const definition = SCENE_ENEMY_TYPES[enemy.type];
  const distance = distanceBetween(sceneState, enemy);

  switch (enemy.state) {
    case "idle":
      if (distance <= definition.aggroRange) {
        enemy.state = "approach";
        pushSceneLog(sceneState, `${definition.name} notices you.`, "info");
      }
      break;

    case "approach":
      enemy.facing = directionToward(sceneState.playerX, enemy.x);
      if (distance > definition.reach) {
        moveEnemyTowardPlayer(sceneState, enemy, definition);
        break;
      }

      enemy.attackTimer -= 1;
      if (enemy.attackTimer <= definition.attack.telegraphTicks) {
        enemy.state = "telegraph";
        enemy.stateTimer = definition.attack.telegraphTicks;
      }
      break;

    case "telegraph":
      enemy.facing = directionToward(sceneState.playerX, enemy.x);
      enemy.stateTimer -= 1;
      if (enemy.stateTimer <= 0) {
        enemy.state = "attackForward";
        enemy.stateTimer = definition.attack.activeTicks;
        enemy.attackOriginX = enemy.x;
        enemy.attackHitResolved = false;
      }
      break;

    case "attackForward":
      if (!enemy.attackHitResolved) {
        enemy.facing = directionToward(sceneState.playerX, enemy.x);
        enemy.x = clamp(
          enemy.attackOriginX + enemy.facing * definition.attack.lungeDistance,
          sceneState.bounds.minX,
          sceneState.bounds.maxX,
        );
        resolveEnemyHit(sceneState, enemy, definition, playerStats);
      }
      enemy.stateTimer -= 1;
      if (enemy.stateTimer <= 0) enemy.state = "attackReturn";
      break;

    case "attackReturn":
      enemy.x = enemy.attackOriginX;
      enemy.state = "recovery";
      enemy.stateTimer = definition.attack.recoveryTicks;
      break;

    case "recovery":
      enemy.stateTimer -= 1;
      if (enemy.stateTimer <= 0) {
        enemy.state = "approach";
        enemy.attackTimer = definition.attack.intervalTicks;
      }
      break;

    case "stagger":
      enemy.stateTimer -= 1;
      if (enemy.stateTimer <= 0) {
        enemy.state = "approach";
        enemy.attackTimer = Math.max(
          definition.attack.telegraphTicks + 1,
          enemy.attackTimer,
        );
      }
      break;
  }
}

function updatePlayerMovement(sceneState, playerStats) {
  if (
    sceneState.heldDir === 0 ||
    sceneState.recoveryTimer > 0 ||
    sceneState.hurtTimer > 0 ||
    sceneState.phase === "defeat"
  ) {
    return;
  }

  const movementMultiplier = sceneState.bracing ? 0.5 : 1;
  const direction = sceneState.heldDir;
  let nextX = clamp(
    sceneState.playerX +
      direction * SCENE_COMBAT_TUNING.playerSpeed * movementMultiplier,
    sceneState.bounds.minX,
    sceneState.bounds.maxX,
  );

  sceneState.enemies
    .filter((enemy) => enemy.hp > 0 && enemy.lane === "ground")
    .filter((enemy) => Math.sign(enemy.x - sceneState.playerX) === direction)
    .forEach((enemy) => {
      const definition = SCENE_ENEMY_TYPES[enemy.type];
      const minimumGap = SCENE_COMBAT_TUNING.playerRadius + definition.contactRadius;
      if (Math.abs(nextX - enemy.x) < minimumGap) {
        nextX = enemy.x - direction * minimumGap;
      }
    });

  sceneState.playerX = clamp(
    nextX,
    sceneState.bounds.minX,
    sceneState.bounds.maxX,
  );
  sceneState.facing = direction;
  sceneState.stepFrame += 1;
}

function updateResourcesAndTimers(sceneState, playerStats) {
  if (sceneState.attackCooldown > 0) sceneState.attackCooldown -= 1;
  if (sceneState.recoveryTimer > 0) sceneState.recoveryTimer -= 1;
  if (sceneState.attackFrame > 0) sceneState.attackFrame -= 1;
  if (sceneState.hurtTimer > 0) sceneState.hurtTimer -= 1;

  if (sceneState.slingshotAmmo < SCENE_COMBAT_TUNING.ammoMax) {
    sceneState.ammoRegenCounter += 1;
    if (sceneState.ammoRegenCounter >= SCENE_COMBAT_TUNING.ammoRegenTicks) {
      sceneState.ammoRegenCounter = 0;
      sceneState.slingshotAmmo += 1;
    }
  }

  if (sceneState.bracing && canShield(sceneState, playerStats)) {
    sceneState.guard = Math.max(
      0,
      sceneState.guard - SCENE_COMBAT_TUNING.guardDrainPerTick,
    );
    if (sceneState.guard === 0) {
      sceneState.bracing = false;
      pushSceneLog(sceneState, "Your shield arm gives out.", "info");
    }
  } else {
    sceneState.bracing = false;
    sceneState.guard = Math.min(
      SCENE_COMBAT_TUNING.guardMax,
      sceneState.guard + SCENE_COMBAT_TUNING.guardRefillPerTick,
    );
  }
}

export function stepSceneCombat(
  sceneState,
  sceneDefinition,
  playerStats,
  random = Math.random,
) {
  sceneState.ticks += 1;
  sceneState.playerDamageTaken = 0;
  sceneState.rewards = [];
  sceneState.bounds = {
    minX: sceneDefinition.minX,
    maxX: sceneDefinition.maxX,
  };

  sceneState.effects = sceneState.effects
    .map((effect) => ({ ...effect, ticks: effect.ticks - 1 }))
    .filter((effect) => effect.ticks > 0);

  updateResourcesAndTimers(sceneState, playerStats);
  resolveParries(sceneState, playerStats);
  updatePlayerMovement(sceneState, playerStats);
  startPlayerAttack(sceneState, playerStats, random);
  updateProjectiles(sceneState, random);
  sceneState.enemies.forEach((enemy) => updateEnemy(sceneState, enemy, playerStats));

  sceneState.inCombat = isSceneInCombat(sceneState);
  if (sceneState.enemies.length > 0 && sceneState.enemies.every((enemy) => enemy.hp <= 0)) {
    sceneState.encounterComplete = true;
  }

  return sceneState;
}
