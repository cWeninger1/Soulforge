import { test, expect } from "vitest";
import {
  initialAttributes,
  derive,
  damage,
  availablePoints,
  levelFor,
} from "../src/systems/character";
test("classless traveler earns capped levels and points", () => {
  const a = initialAttributes();
  expect(availablePoints(a, 0)).toBe(5);
  expect(levelFor(39)).toBe(1);
  expect(availablePoints(a, 40)).toBe(8);
  expect(levelFor(999999)).toBe(10);
  a.Strength++;
  expect(availablePoints(a, 40)).toBe(7);
  expect(derive(a).physical).toBe(14);
});
test("armor and criticals scale finite nonnegative damage", () => {
  expect(damage(20, 100, false)).toBe(10);
  expect(damage(20, 100, true)).toBe(15);
  expect(damage(-10, 0, true)).toBe(0);
  expect(damage(Infinity, 0, false)).toBe(0);
});
