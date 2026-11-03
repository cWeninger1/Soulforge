import { expect, test } from "vitest";
import {
  castError,
  freshBook,
  preview,
  spellError,
  type Design,
} from "../src/systems/spells";
import { initialAttributes } from "../src/systems/character";
test("trusted component values determine costs and reject incompatible builds", () => {
  const d: Design = {
    id: "a",
    name: "Flare",
    element: "Fire",
    form: "Projectile",
    modifier: "None",
    version: 1,
  };
  const a = initialAttributes(),
    b = freshBook();
  expect(preview(d, 10)).toMatchObject({
    complexity: 2,
    mana: 8,
    cooldown: 2,
    power: 12,
  });
  expect(spellError(d, b, a, 6, true)).toBe("");
  d.modifier = "Chain";
  expect(spellError(d, b, a, 6, true)).toContain("Recover");
  b.unlocks.push("Chain");
  a.Willpower = 7;
  expect(spellError(d, b, a, 6, true)).toBe("");
  d.form = "Nova";
  expect(spellError(d, b, a, 6, true)).toContain("projectile");
  expect(castError(0, 8, 0)).toContain("mana");
  expect(castError(20, 8, 1)).toContain("cooldown");
});
