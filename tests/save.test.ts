import { expect, test } from "vitest";
import { freshSave, parseSave } from "../src/services/save";
test("versioned round-trip rejects impossible progress and missing references", () => {
  const s = freshSave();
  expect(parseSave(JSON.parse(JSON.stringify(s)))).toEqual(s);
  s.hero.attributes.Strength = 20;
  expect(() => parseSave(s)).toThrow();
  s.hero.attributes.Strength = 5;
  s.bag.equipment.Head = "missing";
  expect(() => parseSave(s)).toThrow();
});
