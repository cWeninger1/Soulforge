export const attributeNames = [
  "Strength",
  "Dexterity",
  "Intelligence",
  "Vitality",
  "Endurance",
  "Willpower",
] as const;
export type Attribute = (typeof attributeNames)[number];
export type Attributes = Record<Attribute, number>;
export const balance = {
  base: 5,
  creationPoints: 5,
  levelPoints: 3,
  thresholds: [0, 40, 110, 215, 360, 550, 790, 1090, 1460, 1900],
  meleeCost: 4,
  meleeRange: 2.9,
};
export const initialAttributes = (): Attributes => ({
  Strength: 5,
  Dexterity: 5,
  Intelligence: 5,
  Vitality: 5,
  Endurance: 5,
  Willpower: 5,
});
export function levelFor(xp: number) {
  return Math.max(1, balance.thresholds.filter((value) => value <= xp).length);
}
export function availablePoints(a: Attributes, xp: number) {
  return (
    balance.creationPoints +
    (levelFor(xp) - 1) * balance.levelPoints -
    attributeNames.reduce((total, key) => total + a[key] - balance.base, 0)
  );
}
export function derive(a: Attributes) {
  return {
    health: 60 + 8 * a.Vitality,
    mana: 25 + 5 * a.Willpower,
    stamina: 40 + 6 * a.Endurance,
    physical: 5 + 1.5 * a.Strength,
    magic: 5 + 1.7 * a.Intelligence,
    defense: 2 * a.Endurance,
    resistance: a.Willpower,
    crit: Math.min(0.4, 0.025 + a.Dexterity * 0.005),
    attackSpeed: Math.min(2, 0.75 + a.Dexterity * 0.035),
    speed: 4.8,
    complexity: 4 + Math.floor(a.Intelligence / 2),
    manaRegen: 0.6 + 0.12 * a.Willpower,
    healthRegen: 0.4 + 0.1 * a.Vitality,
  };
}
export type DamageType = "Physical" | "Fire" | "Frost" | "Arcane" | "Nature";
export function damage(power: number, defense: number, crit: boolean) {
  if (!Number.isFinite(power) || !Number.isFinite(defense)) return 0;
  return Math.max(
    0,
    Math.round(
      (Math.max(0, power) * (crit ? 1.5 : 1) * 100) /
        (100 + Math.max(0, defense)),
    ),
  );
}
export function newHero() {
  const attributes = initialAttributes();
  const { health, mana, stamina } = derive(attributes);
  return { attributes, xp: 0, health, mana, stamina };
}
export type Hero = ReturnType<typeof newHero>;
