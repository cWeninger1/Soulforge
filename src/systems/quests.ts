import { grant, type Inventory } from "./inventory";
import type { Spellbook } from "./spells";
import type { Hero } from "./character";
export const quests = [
  {
    id: "wolves",
    name: "Trouble in the Woods",
    task: "Defeat two forest wolves.",
    enemy: "Forest Wolf",
    count: 2,
    xp: 36,
    gold: 12,
  },
  {
    id: "supplies",
    name: "Missing Supplies",
    task: "Recover two supply bundles from goblin raiders.",
    enemy: "Goblin Raider",
    count: 2,
    xp: 48,
    gold: 4,
    item: "coat",
  },
  {
    id: "essence",
    name: "Corrupted Magic",
    task: "Collect two motes from corrupted wisps.",
    enemy: "Corrupted Wisp",
    count: 2,
    xp: 68,
    gold: 8,
    unlock: "Empowered",
  },
  {
    id: "guardian",
    name: "The Forgotten Guardian",
    task: "Explore the ruins and defeat the Ruins Guardian.",
    enemy: "Ruins Guardian",
    count: 1,
    xp: 125,
    gold: 30,
    item: "relic",
    unlock: "Chain",
  },
];
export type Journal = Record<string, { count: number; claimed: boolean }>;
export function accept(j: Journal, id: string) {
  if (quests.some((q) => q.id === id) && !j[id])
    j[id] = { count: 0, claimed: false };
}
export function credit(j: Journal, enemy: string) {
  for (const q of quests) {
    const p = j[q.id];
    if (p && !p.claimed && q.enemy === enemy)
      p.count = Math.min(q.count, p.count + 1);
  }
}
export function claim(
  j: Journal,
  id: string,
  hero: Hero,
  bag: Inventory,
  book: Spellbook,
) {
  const q = quests.find((q) => q.id === id),
    p = j[id];
  if (!q || !p || p.claimed || p.count < q.count) return false;
  if (q.item && !grant(bag, q.item)) return false;
  p.claimed = true;
  hero.xp += q.xp;
  bag.gold += q.gold;
  if (q.unlock && !book.unlocks.includes(q.unlock)) book.unlocks.push(q.unlock);
  return true;
}
