import {
  freshBook,
  spellError,
  preview,
  castError,
  type Design,
  type Spellbook,
} from "../systems/spells";
import { showMagic } from "./magicEffect";
import { items, type Slot } from "../data/items";
import {
  freshInventory,
  equip,
  gearStats,
  grant,
  wolfLoot,
  revalidateGear,
  type Inventory,
} from "../systems/inventory";
import { initialAttributes } from "../systems/character";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Ray } from "@babylonjs/core/Culling/ray";
import type { Scene } from "@babylonjs/core/scene";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { buildTerrain } from "./terrain";
import {
  availablePoints,
  balance,
  damage,
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
  const book = freshBook();
  const cooldowns = new Map<string, number>();
  let shield = 0,
    shieldUntil = 0,
    enchantment = 0,
    enchantUntil = 0;
  const bag = freshInventory();
  const weapon = terrain.box(
    "Held weapon",
    0.52,
    1.1,
    0.38,
    0.1,
    0.13,
    0.9,
    "#d2d6c4",
  );
  weapon.parent = scene.getTransformNodeByName("Traveler");
  let weaponFamily = "";
  function updateWeapon() {
    const held = bag.entries.find((e) => e.id === bag.equipment["Main Hand"]);
    weaponFamily = held ? items[held.item].family : "";
    weapon.setEnabled(!!held);
    weapon.scaling.set(
      weaponFamily === "Greatsword" ? 2 : 1,
      weaponFamily === "Staff" ? 9 : 1,
      weaponFamily === "Dagger" ? 0.5 : weaponFamily === "Staff" ? 0.15 : 1,
    );
    weapon.material = terrain.paint(
      weaponFamily === "Staff" || weaponFamily === "Bow"
        ? "#785341"
        : "#cbd8cc",
    );
  }
  updateWeapon();
  function equipItem(id: string) {
    message = equip(bag, id, hero.attributes)
      ? "Equipment changed."
      : "Requirements not met.";
    updateWeapon();
  }
  function unequip(slot: Slot) {
    delete bag.equipment[slot];
    updateWeapon();
  }
  function respec() {
    hero.attributes = initialAttributes();
    revalidateGear(bag, hero.attributes);
    updateWeapon();
    book.slots = book.slots.map((id) => {
      const d = book.designs.find((s) => s.id === id);
      return d && !eligibility(d) ? id : null;
    });
    message = "Attribute points refunded.";
  }
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
  type Enemy = (typeof enemies)[number];
  function strike(e: Enemy, hit: number) {
    if (!e.hp) return;
    e.hp = Math.max(0, e.hp - hit);
    if (!e.hp) {
      e.wolf.setEnabled(false);
      e.phase = "Dead";
      e.timer = clock + 20;
      hero.xp += 24;
      bag.gold += 3;
      const drop = wolfLoot(Math.random());
      const received = grant(bag, drop);
      target = -1;
      auto = false;
      message =
        "Forest Wolf defeated · +24 XP · +3 gold · " +
        (received ? items[drop].name : "pack full");
    }
  }
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
    const stats = gearStats(bag, hero.attributes);
    return { health: stats.health, mana: stats.mana, stamina: stats.stamina };
  }
  function eligibility(d: Design) {
    return spellError(
      d,
      book,
      hero.attributes,
      gearStats(bag, hero.attributes).complexity,
      !!weaponFamily,
    );
  }
  function saveSpell(d: Design) {
    const error = eligibility(d);
    if (error) {
      message = error;
      return;
    }
    const design = {
      ...d,
      name: d.name.trim(),
      id: d.id || crypto.randomUUID(),
    };
    const index = book.designs.findIndex((v) => v.id === design.id);
    if (index >= 0) book.designs[index] = design;
    else book.designs.push(design);
    message = "Inscribed " + design.name;
  }
  function removeSpell(id: string) {
    book.designs = book.designs.filter((v) => v.id !== id);
    book.slots = book.slots.map((v) => (v === id ? null : v));
  }
  function slotSpell(index: number, id: string | null) {
    if (index < 0 || index >= 6) return;
    const d = book.designs.find((v) => v.id === id);
    if (id && (!d || eligibility(d))) return;
    book.slots[index] = id;
  }
  const burns: {
    enemy: Enemy;
    remaining: number;
    next: number;
    amount: number;
  }[] = [];
  function cast(slot: number) {
    const d = book.designs.find((v) => v.id === book.slots[slot]);
    if (!d || hero.health <= 0) return;
    const stats = gearStats(bag, hero.attributes);
    const p = preview(d, stats.magic);
    const error =
      eligibility(d) ||
      castError(hero.mana, p.mana, (cooldowns.get(d.id) ?? 0) - clock);
    if (error) {
      message = error;
      return;
    }
    const at = body.position.add(new Vector3(0, 1, 0));
    let to = at;
    let victims: Enemy[] = [];
    const heal = d.element === "Nature" && d.form === "Projectile";
    if (d.form === "Projectile" && !heal) {
      const e = enemies[target];
      if (!e?.hp) {
        message = "Select a living target.";
        return;
      }
      if (Vector3.Distance(at, e.wolf.position) > p.range) {
        message = "Target out of range.";
        return;
      }
      if (!sight(e.wolf)) {
        message = "Line of sight blocked.";
        return;
      }
      to = e.wolf.position;
      victims = [e];
      if (d.modifier === "Chain")
        victims.push(
          ...enemies
            .filter(
              (other) =>
                other !== e &&
                other.hp > 0 &&
                Vector3.Distance(to, other.wolf.position) < 5 &&
                sight(other.wolf),
            )
            .slice(0, 2),
        );
    }
    if (d.form === "Nova")
      victims = enemies.filter(
        (e) =>
          e.hp > 0 &&
          Vector3.Distance(at, e.wolf.position) <= p.range &&
          sight(e.wolf),
      );
    hero.mana -= p.mana;
    cooldowns.set(d.id, clock + p.cooldown);
    message = "Cast " + d.name;
    if (heal) hero.health = Math.min(stats.health, hero.health + p.power);
    if (d.form === "Barrier") {
      shield = p.power;
      shieldUntil = clock + p.duration;
    }
    if (d.form === "Enchantment") {
      enchantment = Math.ceil(p.power * 0.4);
      enchantUntil = clock + p.duration;
    }
    for (const e of victims) {
      strike(e, p.power);
      if (d.modifier === "Lingering" && e.hp)
        burns.push({
          enemy: e,
          remaining: 3,
          next: clock + 1,
          amount: Math.ceil(p.power * 0.2),
        });
    }
    showMagic(scene, d, at, to);
  }
  const onKey = (e: KeyboardEvent) => {
    if (
      e.repeat ||
      /INPUT|SELECT|TEXTAREA/.test((e.target as HTMLElement)?.tagName)
    )
      return;
    if (/^Digit[1-6]$/.test(e.code)) cast(Number(e.code.slice(-1)) - 1);
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
    for (let i = burns.length - 1; i >= 0; i--) {
      const b = burns[i];
      if (!b.enemy.hp) {
        burns.splice(i, 1);
        continue;
      }
      if (clock >= b.next) {
        strike(b.enemy, b.amount);
        b.next = clock + 1;
        if (--b.remaining === 0) burns.splice(i, 1);
      }
    }
    const stats = gearStats(bag, hero.attributes);
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
        const incoming = damage(8, stats.defense, false);
        const absorbed = clock < shieldUntil ? Math.min(incoming, shield) : 0;
        shield -= absorbed;
        hero.health = Math.max(0, hero.health - incoming + absorbed);
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
        if (distance > (weaponFamily === "Bow" ? 12 : balance.meleeRange))
          message = "Move closer to attack.";
        else if (!sight(e.wolf)) message = "Line of sight blocked.";
        else if (hero.stamina >= balance.meleeCost) {
          const hit = damage(stats.physical, 4, Math.random() < stats.crit);

          hero.stamina -= balance.meleeCost;
          nextHit = clock + 1 / stats.attackSpeed;
          message = "Sword strike · " + hit;
          strike(e, hit + (clock < enchantUntil ? enchantment : 0));
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
        book: structuredClone(book),
        remaining: book.slots.map((id) =>
          Math.max(0, Math.ceil((cooldowns.get(id ?? "") ?? 0) - clock)),
        ),
        status: [
          clock < shieldUntil && shield > 0 ? "Barrier " + shield : "",
          clock < enchantUntil ? "Weapon enchanted" : "",
        ]
          .filter(Boolean)
          .join(" · "),
        bag: structuredClone(bag),
        stats,
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
    saveSpell,
    removeSpell,
    slotSpell,
    cast,
    equipItem,
    unequip,
    respec,
    sort: () =>
      bag.entries.sort((a, b) =>
        items[a.item].name.localeCompare(items[b.item].name),
      ),
    select,
    engage,
    respawn,
    allocate,
    alive: () => hero.health > 0,
    dispose: () => window.removeEventListener("keydown", onKey),
  };
}
export type CombatView = {
  book: Spellbook;
  remaining: number[];
  status: string;
  bag: Inventory;
  stats: ReturnType<typeof gearStats>;
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
