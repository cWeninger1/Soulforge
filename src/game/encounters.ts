import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Ray } from "@babylonjs/core/Culling/ray";
import type { Scene } from "@babylonjs/core/scene";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { buildTerrain } from "./terrain";
import {
  availablePoints,
  balance,
  damage,
  derive,
  levelFor,
  newHero,
  type Attribute,
} from "../systems/character";
export function encounters(
  scene: Scene,
  terrain: ReturnType<typeof buildTerrain>,
  body: Mesh,
  notify: (state: CombatView) => void,
) {
  const hero = newHero();
  const enemies = [
    [-2, -9],
    [3, 1],
    [-1, 10],
  ].map(([x, z], index) => {
    const wolf = terrain.box(
      "Forest Wolf",
      x,
      0.67,
      z,
      0.78,
      0.75,
      1.5,
      "#79746b",
    );
    wolf.ellipsoid.set(0.4, 0.5, 0.7);
    const head = terrain.box(
      "Wolf head",
      0,
      0.34,
      0.69,
      0.56,
      0.55,
      0.59,
      "#9b9281",
    );
    head.parent = wolf;
    for (const side of [-1, 1]) {
      const ear = terrain.box(
        "Pointed ear",
        side * 0.18,
        0.68,
        0.61,
        0.16,
        0.28,
        0.19,
        "#48473f",
      );
      ear.parent = wolf;
      for (const end of [-1, 1]) {
        const leg = terrain.box(
          "Paw",
          side * 0.28,
          -0.42,
          end * 0.45,
          0.16,
          0.52,
          0.21,
          "#4d4941",
        );
        leg.parent = wolf;
      }
    }
    return {
      wolf,
      home: wolf.position.clone(),
      hp: 36,
      timer: 0,
      phase: "Patrol",
      index,
      attack: 1,
    };
  });
  let target = -1,
    auto = false,
    nextHit = 0,
    clock = 0,
    publish = 0,
    message = "Follow the road north. Wolves roam the forest edge.";
  let seen = "";
  const alive = () =>
    enemies.filter(
      (e) => e.hp > 0 && Vector3.Distance(body.position, e.wolf.position) < 16,
    );
  function select() {
    const list = alive();
    target = list.length
      ? list[(list.findIndex((e) => e.index === target) + 1) % list.length]
          .index
      : -1;
    message = target < 0 ? "No enemies nearby." : "Forest Wolf targeted.";
    auto = false;
  }
  function sight(wolf: Mesh) {
    const origin = body.position.add(new Vector3(0, 1, 0));
    const dir = wolf.position.subtract(origin);
    const hit = scene.pickWithRay(
      new Ray(origin, dir.normalizeToNew(), dir.length()),
      (m) => m.checkCollisions && m !== body,
    );
    return !hit?.hit;
  }
  function engage() {
    if (hero.health <= 0) return;
    if (target < 0) select();
    auto = target >= 0 && !auto;
    message = auto
      ? "Auto-attack engaged."
      : target < 0
        ? "No enemies nearby."
        : "Attack stopped.";
  }
  function allocate(attribute: Attribute) {
    if (availablePoints(hero.attributes, hero.xp) > 0)
      hero.attributes[attribute]++;
  }
  function respawn() {
    if (hero.health > 0) return;
    Object.assign(hero, resources());
    body.position.set(0, 0.1, -26);
    target = -1;
    auto = false;
    message = "You awaken by the village fires.";
  }
  function resources() {
    const stats = derive(hero.attributes);
    return { health: stats.health, mana: stats.mana, stamina: stats.stamina };
  }
  const onKey = (e: KeyboardEvent) => {
    if (e.repeat) return;
    if (e.code === "Tab" && document.activeElement?.tagName === "CANVAS") {
      e.preventDefault();
      select();
    }
    if (e.code === "KeyF") engage();
  };
  window.addEventListener("keydown", onKey);
  scene.onBeforeRenderObservable.add(() => {
    const dt = Math.min(scene.getEngine().getDeltaTime() / 1000, 0.05);
    clock += dt;
    const stats = derive(hero.attributes);
    let threatened = false;
    for (const e of enemies) {
      const pos = e.wolf.position;
      const distance = Vector3.Distance(body.position, pos);
      if (e.hp <= 0) {
        if (clock >= e.timer) {
          e.hp = 36;
          pos.copyFrom(e.home);
          e.wolf.setEnabled(true);
          e.phase = "Patrol";
        }
        continue;
      }
      const leash = Vector3.Distance(pos, e.home);
      if (e.phase === "Return" && leash < 0.8) e.phase = "Patrol";
      if (leash > 12 || hero.health <= 0) e.phase = "Return";
      if (
        e.phase !== "Return" &&
        distance < 6 &&
        hero.health > 0 &&
        sight(e.wolf)
      ) {
        e.phase =
          distance < 1.9 ? "Attack" : e.phase === "Patrol" ? "Alert" : "Chase";
        threatened = true;
      } else if (
        e.phase === "Chase" ||
        e.phase === "Attack" ||
        e.phase === "Alert"
      )
        e.phase = "Return";
      if (e.phase === "Attack" && clock >= e.attack) {
        hero.health = Math.max(
          0,
          hero.health - damage(8, stats.defense, false),
        );
        e.attack = clock + 1.8;
        message = hero.health ? "Forest Wolf bites." : "You fell in Emberfall.";
      } else if (e.phase !== "Attack") {
        const destination =
          e.phase === "Chase" || e.phase === "Alert"
            ? body.position
            : e.phase === "Return"
              ? e.home
              : e.home.add(
                  new Vector3(Math.sin(clock * 0.5 + e.index) * 1.4, 0, 0),
                );
        const dir = destination.subtract(pos);
        dir.y = 0;
        if (dir.length() > 0.2) {
          dir.normalize();
          e.wolf.rotation.y = Math.atan2(dir.x, dir.z);
          e.wolf.moveWithCollisions(
            dir.scale((e.phase === "Patrol" ? 1 : 3.1) * dt),
          );
        }
      }
      if (target === e.index && auto && hero.health > 0 && clock >= nextHit) {
        if (distance > balance.meleeRange) message = "Move closer to attack.";
        else if (!sight(e.wolf)) message = "Line of sight blocked.";
        else if (hero.stamina >= balance.meleeCost) {
          const hit = damage(stats.physical, 4, Math.random() < stats.crit);
          e.hp = Math.max(0, e.hp - hit);
          hero.stamina -= balance.meleeCost;
          nextHit = clock + 1 / stats.attackSpeed;
          message = "Sword strike · " + hit;
          if (!e.hp) {
            e.wolf.setEnabled(false);
            e.phase = "Dead";
            e.timer = clock + 20;
            hero.xp += 24;
            target = -1;
            auto = false;
            message = "Forest Wolf defeated · +24 XP";
          }
        }
      }
    }
    if (hero.health > 0) {
      hero.stamina = Math.min(stats.stamina, hero.stamina + 5 * dt);
      hero.mana = Math.min(stats.mana, hero.mana + stats.manaRegen * dt);
      if (!threatened)
        hero.health = Math.min(
          stats.health,
          hero.health + stats.healthRegen * dt,
        );
    }
    if ((publish -= dt) <= 0) {
      publish = 0.15;
      const state = {
        health: Math.ceil(hero.health),
        mana: Math.ceil(hero.mana),
        stamina: Math.ceil(hero.stamina),
        max: resources(),
        xp: hero.xp,
        level: levelFor(hero.xp),
        points: availablePoints(hero.attributes, hero.xp),
        attributes: { ...hero.attributes },
        target: target >= 0 ? enemies[target].hp : null,
        message,
      };
      const serialized = JSON.stringify(state);
      if (seen !== serialized) {
        seen = serialized;
        notify(state);
      }
    }
  });
  return {
    select,
    engage,
    respawn,
    allocate,
    alive: () => hero.health > 0,
    dispose: () => window.removeEventListener("keydown", onKey),
  };
}
export type CombatView = {
  health: number;
  mana: number;
  stamina: number;
  max: { health: number; mana: number; stamina: number };
  xp: number;
  level: number;
  points: number;
  attributes: Record<Attribute, number>;
  target: number | null;
  message: string;
};
