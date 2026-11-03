import { items, type Slot } from "../data/items";
import { derive, type Attributes } from "./character";
export type Entry = { id: string; item: string; count: number };
export type Inventory = {
  entries: Entry[];
  equipment: Partial<Record<Slot, string>>;
  gold: number;
};
export const capacity = 24;
export const freshInventory = (): Inventory => ({
  gold: 8,
  entries: [
    { id: "starter-sword", item: "sword", count: 1 },
    { id: "starter-staff", item: "staff", count: 1 },
  ],
  equipment: { "Main Hand": "starter-sword" },
});
export function eligible(item: string, a: Attributes) {
  return (
    !!items[item] &&
    Object.entries(items[item].requirements).every(
      ([key, min]) => a[key as keyof Attributes] >= min,
    )
  );
}
export function grant(inv: Inventory, item: string) {
  if (!items[item]) return false;
  const stack = !items[item].slot && inv.entries.find((e) => e.item === item);
  if (stack) {
    stack.count++;
    return true;
  }
  if (inv.entries.length >= capacity) return false;
  inv.entries.push({ id: crypto.randomUUID(), item, count: 1 });
  return true;
}
export function equip(inv: Inventory, id: string, a: Attributes) {
  const entry = inv.entries.find((e) => e.id === id);
  if (!entry || !eligible(entry.item, a)) return false;
  const gear = items[entry.item];
  if (!gear.slot) return false;
  const main = inv.entries.find((e) => e.id === inv.equipment["Main Hand"]);
  const twoHands = ["Greatsword", "Bow", "Staff"];
  if (
    gear.slot === "Off Hand" &&
    main &&
    twoHands.includes(items[main.item].family)
  )
    return false;
  if (gear.slot === "Main Hand" && twoHands.includes(gear.family))
    delete inv.equipment["Off Hand"];
  inv.equipment[gear.slot] = id;
  return true;
}
export function gearStats(inv: Inventory, a: Attributes) {
  const stats = derive(a);
  for (const entry of inv.entries) {
    if (!Object.values(inv.equipment).includes(entry.id)) continue;
    for (const [key, value] of Object.entries(items[entry.item].bonus))
      stats[key as keyof typeof stats] += value;
  }
  return stats;
}
export function trade(inv: Inventory, kind: "buy" | "sell", id: string) {
  if (kind === "buy") {
    if (!items[id] || inv.gold < items[id].price || !grant(inv, id))
      return false;
    inv.gold -= items[id].price;
    return true;
  }
  const entry = inv.entries.find((e) => e.id === id);
  if (!entry || Object.values(inv.equipment).includes(id)) return false;
  inv.gold += Math.max(1, Math.floor(items[entry.item].price / 2));
  if (--entry.count === 0) inv.entries = inv.entries.filter((e) => e !== entry);
  return true;
}
export function revalidateGear(inv: Inventory, a: Attributes) {
  for (const entry of inv.entries) {
    const slot = items[entry.item].slot;
    if (slot && inv.equipment[slot] === entry.id && !eligible(entry.item, a))
      delete inv.equipment[slot];
  }
}
export function wolfLoot(roll: number) {
  return roll < 0.6 ? "pelt" : roll < 0.85 ? "gloves" : "greatsword";
}
