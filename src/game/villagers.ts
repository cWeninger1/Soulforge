import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { buildTerrain } from "./terrain";
export const stations = [
  { id: "warden", name: "Warden Aster", x: -2, z: -26 },
  { id: "merchant", name: "Tamsin · Merchant", x: 4, z: -21 },
  { id: "forge", name: "Village Spellforge", x: -3, z: -18 },
  { id: "herbs", name: "Silverleaf Grove", x: 4, z: 5 },
] as const;
export function buildStations(terrain: ReturnType<typeof buildTerrain>) {
  for (const s of stations) {
    if (s.id === "warden" || s.id === "merchant") {
      terrain.box(
        s.name,
        s.x,
        0.8,
        s.z,
        0.68,
        1.6,
        0.55,
        s.id === "warden" ? "#31597a" : "#af764c",
        true,
      );
      terrain.box("Head", s.x, 1.8, s.z, 0.43, 0.45, 0.44, "#b78058");
    } else
      terrain.box(
        s.name,
        s.x,
        0.6,
        s.z,
        1.1,
        1.2,
        1.1,
        s.id === "forge" ? "#9c73c9" : "#799848",
        true,
      );
  }
}
export function nearStation(pos: Vector3) {
  return stations.find((s) => Math.hypot(pos.x - s.x, pos.z - s.z) < 3.2);
}
