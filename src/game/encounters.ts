import type { Save } from "../services/save";
import { spawnEnemies } from "./enemies";
import { nearStation, buildStations } from "./villagers";
import { quests, accept, claim, credit, type Journal } from "../systems/quests";
import { trade } from "../systems/inventory";
import {
  spellError,
  preview,
  castError,
  type Design,
  type Spellbook,
} from "../systems/spells";
import { showMagic } from "./magicEffect";
import { items, type Slot } from "../data/items";
import {
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
  type Attribute,
} from "../systems/character";
export function encounters(
  scene: Scene,
  terrain: ReturnType<typeof buildTerrain>,
  body: Mesh,
  notify: (state: CombatView) => void,
  initial: Save,
) {
  const journal = initial.journal;
  let gathered = initial.gathered,
    explored = initial.explored;
  buildStations(terrain);
  const hero = initial.hero;
  const book = initial.book;
  const cooldowns = new Map<string, number>();
  let shield = 0,
    shieldUntil = 0,
    enchantment = 0,
    enchantUntil = 0;
  const bag = initial.bag;
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
  const enemies = spawnEnemies(terrain);
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
      credit(journal, e.name);
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
        e.name +
        " defeated · +24 XP · +3 gold · " +
        (received ? items[drop].name : "pack full");
    }
  }
  function select() {
    const list = alive();
    target = list.length
      ? list[(list.findIndex((e) => e.index === target) + 1) % list.length]
          .index
      : -1;
    message =
      target < 0 ? "No enemies nearby." : enemies[target].name + " targeted.";
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
    if (!explored && body.position.z > 20) {
      explored = true;
      hero.xp += 15;
      message = "Forgotten Ruins discovered · +15 XP";
    }
    for (const e of enemies) {
      if (
        e.windup &&
        clock >= e.windup &&
        Vector3.Distance(body.position, e.wolf.position) > e.range
      ) {
        e.windup = 0;
        e.attack = clock + 3;
        e.wolf.scaling.y = 3;
        message = "Shockwave evaded.";
      }
    }
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
          e.hp = e.max;
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
        distance < Math.max(6, e.range + 1) &&
        hero.health > 0 &&
        sight(e.wolf)
      ) {
        e.phase =
          distance < e.range
            ? "Attack"
            : e.phase === "Patrol"
              ? "Alert"
              : "Chase";
        threatened = true;
      } else if (
        e.phase === "Chase" ||
        e.phase === "Attack" ||
        e.phase === "Alert"
      )
        e.phase = "Return";
      if (e.phase === "Attack" && clock >= e.attack) {
        if (e.name === "Ruins Guardian" && !e.windup) {
          e.windup = clock + 1.5;
          e.attack = e.windup;
          message = "Guardian raises its fists · leave the shockwave radius!";
          e.wolf.scaling.y = 3.6;
          continue;
        }
        const slam = e.windup > 0;
        e.windup = 0;
        if (slam) e.wolf.scaling.y = 3;
        if (e.name === "Corrupted Wisp")
          showMagic(
            scene,
            {
              id: "wisp",
              name: "Wisp bolt",
              version: 1,
              element: "Arcane",
              form: "Projectile",
              modifier: "None",
            },
            pos,
            body.position,
          );
        const incoming = damage(
          e.power * (slam ? 2 : 1),
          e.name === "Corrupted Wisp" ? stats.resistance : stats.defense,
          false,
        );
        const absorbed = clock < shieldUntil ? Math.min(incoming, shield) : 0;
        shield -= absorbed;
        hero.health = Math.max(0, hero.health - incoming + absorbed);
        e.attack = clock + 1.8;
        message = hero.health ? e.name + " hits." : "You fell in Emberfall.";
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
        journal: structuredClone(journal),
        station: nearStation(body.position),
        targetName: enemies[target]?.name,
        targetMax: enemies[target]?.max,
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
    snapshot: (): Save =>
      structuredClone({
        ...initial,
        hero,
        bag,
        book,
        journal,
        gathered,
        explored,
        location: [body.position.x, body.position.z],
      }),
    quest: (id: string) => {
      if (
        nearStation(body.position)?.id !== "warden" ||
        !quests.some((q) => q.id === id)
      )
        return;
      if (!journal[id]) accept(journal, id);
      else
        message = claim(journal, id, hero, bag, book)
          ? "Quest reward received."
          : "Check objectives and pack space.";
    },
    shop: (kind: "buy" | "sell", id: string) => {
      if (nearStation(body.position)?.id === "merchant")
        message = trade(bag, kind, id)
          ? "Trade complete."
          : "Cannot trade · check gold, equipment and pack space.";
    },
    gather: () => {
      if (nearStation(body.position)?.id === "herbs" && !gathered) {
        hero.mana = resources().mana;
        gathered = true;
        hero.xp += 5;
        message = "Silverleaf collected · mana restored.";
      }
    },
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
  journal: Journal;
  station: ReturnType<typeof nearStation>;
  targetName?: string;
  targetMax?: number;
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
