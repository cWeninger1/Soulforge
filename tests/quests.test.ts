import { expect, test } from "vitest";
import {
  quests,
  accept,
  credit,
  claim,
  type Journal,
} from "../src/systems/quests";
import { freshInventory } from "../src/systems/inventory";
import { newHero } from "../src/systems/character";
import { freshBook } from "../src/systems/spells";
test("all four quest chains award once after their objectives", () => {
  const j: Journal = {},
    h = newHero(),
    bag = freshInventory(),
    b = freshBook();
  for (const q of quests) {
    accept(j, q.id);
    expect(claim(j, q.id, h, bag, b)).toBe(false);
    for (let i = 0; i < q.count; i++) credit(j, q.enemy);
    expect(claim(j, q.id, h, bag, b)).toBe(true);
    accept(j, q.id);
    expect(claim(j, q.id, h, bag, b)).toBe(false);
  }
  expect(b.unlocks).toEqual(["Empowered", "Chain"]);
  expect(bag.entries.some((e) => e.item === "relic")).toBe(true);
});
