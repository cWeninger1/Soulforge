import { defaultSettings } from "../game/audio";
import { z } from "zod";
import { attributeNames, availablePoints, newHero } from "../systems/character";
import { items, slots } from "../data/items";
import {
  freshInventory,
  gearStats,
  revalidateGear,
} from "../systems/inventory";
import {
  elements,
  forms,
  modifiers,
  freshBook,
  spellError,
} from "../systems/spells";
import { quests, type Journal } from "../systems/quests";
const id = z.string().min(1).max(80),
  bounded = z.number().finite().min(0).max(1e8);
const attributes = z.record(z.enum(attributeNames), z.int().min(5).max(37));
export const profileSchema = z.object({
  name: z.string().trim().min(2).max(24),
  body: z.enum(["Broad", "Slender"]),
  skin: z.enum(["Umber", "Amber", "Rose"]),
  hair: z.enum(["Cropped", "Long"]),
  color: z.enum(["Chestnut", "Silver", "Black"]),
});
const design = z.object({
  id,
  name: z.string().trim().min(1).max(32),
  version: z.literal(1),
  element: z.enum(elements),
  form: z.enum(forms),
  modifier: z.enum(modifiers),
});
const schema = z.object({
  version: z.literal(1),
  profile: profileSchema,
  hero: z.object({
    xp: z.int().min(0).max(1e8),
    attributes,
    health: bounded,
    mana: bounded,
    stamina: bounded,
  }),
  bag: z.object({
    gold: z.int().min(0).max(1e8),
    entries: z
      .array(
        z.object({
          id,
          item: z.string().refine((k) => Object.hasOwn(items, k)),
          count: z.int().min(1).max(1e6),
        }),
      )
      .max(24),
    equipment: z.partialRecord(z.enum(slots), id),
  }),
  book: z.object({
    slots: z.array(id.nullable()).length(6),
    unlocks: z.array(z.enum(["Chain", "Empowered"])).max(2),
    designs: z.array(design).max(100),
  }),
  journal: z.record(
    z.string(),
    z.object({ count: z.int().min(0).max(2), claimed: z.boolean() }),
  ),
  location: z.tuple([z.number().min(-39).max(39), z.number().min(-39).max(39)]),
  gathered: z.boolean(),
  explored: z.boolean(),
  settings: z
    .object({
      master: z.number().min(0).max(1),
      music: z.number().min(0).max(1),
      effects: z.number().min(0).max(1),
      quality: z.enum(["High", "Low"]),
      sensitivity: z.number().min(0.4).max(2),
    })
    .default(defaultSettings),
});
export type Save = Omit<z.infer<typeof schema>, "book"> & {
  book: ReturnType<typeof freshBook>;
};
export type Profile = z.infer<typeof profileSchema>;
export function freshSave(
  profile: Profile = {
    name: "Traveler",
    body: "Broad",
    skin: "Amber",
    hair: "Cropped",
    color: "Chestnut",
  },
): Save {
  return {
    version: 1,
    profile,
    hero: newHero(),
    bag: freshInventory(),
    book: freshBook(),
    journal: {},
    location: [0, -26],
    gathered: false,
    explored: false,
    settings: { ...defaultSettings },
  };
}
export function parseSave(raw: unknown): Save {
  const s = schema.parse(raw);
  const { bag, book, hero } = s;
  function requireValid(ok: boolean) {
    if (!ok) throw Error("Invalid or inconsistent character save.");
  }
  requireValid(availablePoints(hero.attributes, hero.xp) >= 0);
  requireValid(
    new Set(bag.entries.map((e) => e.id)).size === bag.entries.length,
  );
  for (const e of bag.entries)
    requireValid(!items[e.item].slot || e.count === 1);
  for (const [slot, id] of Object.entries(bag.equipment)) {
    const e = bag.entries.find((e) => e.id === id);
    requireValid(!!e && items[e.item].slot === slot);
  }
  revalidateGear(bag, hero.attributes);
  const main = bag.entries.find((e) => e.id === bag.equipment["Main Hand"]);
  if (main && ["Bow", "Staff", "Greatsword"].includes(items[main.item].family))
    delete bag.equipment["Off Hand"];
  const j: Journal = s.journal;
  for (const [key, p] of Object.entries(j)) {
    const q = quests.find((q) => q.id === key);
    requireValid(
      !!q && p.count <= q.count && (!p.claimed || p.count === q.count),
    );
  }
  book.unlocks = quests
    .filter((q) => q.unlock && j[q.id]?.claimed)
    .map((q) => q.unlock as "Chain" | "Empowered");
  requireValid(
    new Set(book.designs.map((d) => d.id)).size === book.designs.length,
  );
  const stats = gearStats(bag, hero.attributes);
  book.slots = book.slots.map((id) => {
    const d = book.designs.find((d) => d.id === id);
    return d && !spellError(d, book, hero.attributes, stats.complexity, !!main)
      ? id
      : null;
  });
  for (const key of ["health", "mana", "stamina"] as const)
    hero[key] = Math.min(hero[key], stats[key]);
  return s;
}
