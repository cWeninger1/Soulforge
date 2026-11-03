import type { Attributes } from "./character";
export const elements = ["Fire", "Frost", "Arcane", "Nature"] as const;
export const forms = ["Projectile", "Nova", "Enchantment", "Barrier"] as const;
export const modifiers = ["None", "Chain", "Lingering", "Empowered"] as const;
export type Design = {
  id: string;
  name: string;
  element: (typeof elements)[number];
  form: (typeof forms)[number];
  modifier: (typeof modifiers)[number];
  version: 1;
};
export type Spellbook = {
  designs: Design[];
  slots: (string | null)[];
  unlocks: string[];
};
export const freshBook = (): Spellbook => ({
  designs: [],
  slots: Array(6).fill(null),
  unlocks: [],
});
const formComplexity = { Projectile: 1, Nova: 3, Enchantment: 2, Barrier: 2 };
const modifierComplexity = { None: 0, Chain: 3, Lingering: 2, Empowered: 3 };
export function preview(d: Design, magic: number) {
  const complexity =
    1 + formComplexity[d.form] + modifierComplexity[d.modifier];
  return {
    complexity,
    mana: 4 + complexity * 2,
    cooldown: 1 + complexity * 0.5,
    power: Math.round(
      (magic + complexity) * (d.modifier === "Empowered" ? 1.6 : 1),
    ),
    duration: d.modifier === "Lingering" ? 9 : 5,
    range: d.form === "Nova" ? 5 : 14,
    intelligence: d.modifier === "Empowered" ? 8 : 5,
    willpower: d.modifier === "Chain" ? 7 : 5,
  };
}
export function spellError(
  d: Design,
  book: Spellbook,
  a: Attributes,
  capacity: number,
  armed: boolean,
) {
  if (
    !elements.includes(d.element) ||
    !forms.includes(d.form) ||
    !modifiers.includes(d.modifier) ||
    d.version !== 1
  )
    return "Unknown spell component.";
  if (!d.name.trim() || d.name.trim().length > 32)
    return "Use a spell name of 1–32 characters.";
  if (
    d.modifier === "Chain" &&
    (d.form !== "Projectile" || d.element === "Nature")
  )
    return "Chain needs an offensive projectile.";
  if (d.modifier === "Chain" && !book.unlocks.includes("Chain"))
    return "Recover Chain from the ruins guardian.";
  if (d.form === "Enchantment" && !armed)
    return "Equip a weapon for an enchantment.";
  if (d.modifier === "Empowered" && !book.unlocks.includes("Empowered"))
    return "Recover essence for Warden Aster.";
  const p = preview(d, 0);
  if (a.Intelligence < p.intelligence || a.Willpower < p.willpower)
    return "Attribute requirement not met.";
  if (capacity < p.complexity) return "Spell exceeds complexity capacity.";
  return "";
}
export function castError(mana: number, cost: number, remaining: number) {
  return remaining > 0
    ? "Spell on cooldown."
    : mana < cost
      ? "Not enough mana."
      : "";
}
