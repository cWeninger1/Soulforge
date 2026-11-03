import type { Attributes, derive } from "../systems/character";
export const slots = [
  "Head",
  "Chest",
  "Hands",
  "Legs",
  "Feet",
  "Main Hand",
  "Off Hand",
  "Necklace",
  "Ring 1",
  "Ring 2",
] as const;
export type Slot = (typeof slots)[number];
type Bonus = Partial<ReturnType<typeof derive>>;
export type Item = {
  name: string;
  slot?: Slot;
  family: string;
  rarity: "Common" | "Uncommon" | "Rare" | "Epic";
  price: number;
  bonus: Bonus;
  requirements: Partial<Attributes>;
};
function item(
  name: string,
  slot: Slot,
  family: string,
  price: number,
  bonus: Bonus,
  requirements: Partial<Attributes> = {},
  rarity: Item["rarity"] = "Common",
): Item {
  return { name, slot, family, price, bonus, requirements, rarity };
}
export const items: Record<string, Item> = {
  sword: item("Hearthblade", "Main Hand", "Sword", 8, { physical: 2 }),
  dagger: item("Briar Knife", "Main Hand", "Dagger", 8, {
    physical: 1,
    attackSpeed: 0.18,
  }),
  staff: item("Willow Crook", "Main Hand", "Staff", 8, { magic: 4 }),
  bow: item("Hunter’s Bow", "Main Hand", "Bow", 12, { physical: 3 }),
  greatsword: item(
    "Quarry Cleaver",
    "Main Hand",
    "Greatsword",
    24,
    { physical: 9 },
    { Strength: 9 },
    "Uncommon",
  ),
  cap: item("Trail Hood", "Head", "Cloth", 5, { mana: 4 }),
  helm: item(
    "Quarry Helm",
    "Head",
    "Plate",
    20,
    { defense: 6 },
    { Endurance: 7 },
    "Uncommon",
  ),
  coat: item("Wayfarer Coat", "Chest", "Leather", 10, { defense: 3 }),
  plate: item(
    "Ironroot Cuirass",
    "Chest",
    "Plate",
    32,
    { defense: 12 },
    { Strength: 8, Endurance: 7 },
    "Rare",
  ),
  robe: item("Mistweave Robe", "Chest", "Cloth", 18, { magic: 2, mana: 4 }),
  gloves: item("Tracker Wraps", "Hands", "Leather", 6, { crit: 0.01 }),
  legs: item("Reed Trousers", "Legs", "Cloth", 6, { stamina: 4 }),
  boots: item("Bramble Boots", "Feet", "Leather", 8, { defense: 2 }),
  shield: item("Rowan Buckler", "Off Hand", "Shield", 10, { defense: 5 }),
  charm: item("Riverstone", "Necklace", "Charm", 15, { resistance: 4 }),
  ring: item("Cinder Band", "Ring 1", "Ring", 14, { magic: 2 }),
  seal: item(
    "Warden Seal",
    "Ring 2",
    "Ring",
    25,
    { health: 8 },
    { Vitality: 7 },
    "Rare",
  ),
  wand: item(
    "Glassroot Staff",
    "Main Hand",
    "Staff",
    35,
    { magic: 9 },
    { Intelligence: 9 },
    "Rare",
  ),
  longbow: item(
    "Thornstring",
    "Main Hand",
    "Bow",
    34,
    { physical: 8 },
    { Dexterity: 9 },
    "Rare",
  ),
  relic: item(
    "Guardian Brand",
    "Main Hand",
    "Sword",
    70,
    { physical: 11, magic: 4 },
    { Strength: 8 },
    "Epic",
  ),
  pelt: {
    name: "Wolf Pelt",
    family: "Material",
    rarity: "Common",
    price: 4,
    bonus: {},
    requirements: {},
  },
};
