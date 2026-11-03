import { test, expect } from "vitest";
import {
  freshInventory,
  grant,
  equip,
  gearStats,
  revalidateGear,
  trade,
} from "../src/systems/inventory";
import { initialAttributes } from "../src/systems/character";
test("respec preserves ownership and removes invalid bonuses", () => {
  const inv = freshInventory(),
    a = initialAttributes();
  grant(inv, "greatsword");
  const id = inv.entries.at(-1)!.id;
  expect(equip(inv, id, a)).toBe(false);
  a.Strength = 9;
  expect(equip(inv, id, a)).toBe(true);
  expect(gearStats(inv, a).physical).toBe(27.5);
  revalidateGear(inv, initialAttributes());
  expect(inv.equipment["Main Hand"]).toBeUndefined();
  expect(inv.entries).toHaveLength(3);
});
test("capacity and funds are atomic and materials stack", () => {
  const inv = freshInventory();
  expect(trade(inv, "buy", "relic")).toBe(false);
  grant(inv, "pelt");
  while (inv.entries.length < 24) expect(grant(inv, "dagger")).toBe(true);
  expect(inv.entries).toHaveLength(24);
  expect(grant(inv, "pelt")).toBe(true);
  expect(trade(inv, "buy", "cap")).toBe(false);
  expect(inv.gold).toBe(8);
  expect(trade(inv, "sell", "starter-sword")).toBe(false);
  expect(trade(inv, "sell", "starter-staff")).toBe(true);
  expect(inv.gold).toBe(12);
});
