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
      const coat = s.id === "warden" ? "#456579" : "#a26443";
      terrain.cone(
        s.name,
        s.x,
        0.98,
        s.z,
        0.67,
        0.55,
        0.98,
        coat,
      ).checkCollisions = true;
      for (const side of [-1, 1]) {
        terrain.cone(
          "Boot",
          s.x + side * 0.16,
          0.37,
          s.z,
          0.25,
          0.25,
          0.7,
          "#524337",
        );
        terrain.cone(
          "Arm",
          s.x + side * 0.36,
          1.22,
          s.z,
          0.18,
          0.22,
          0.64,
          coat,
        );
        terrain.cone(
          "Shoulder",
          s.x + side * 0.33,
          1.5,
          s.z,
          0.34,
          0.24,
          0.23,
          "#8e7957",
        );
      }
      terrain.cone("Face", s.x, 1.76, s.z, 0.38, 0.44, 0.46, "#ba906f");
      terrain.cone("Felt hat", s.x, 2.03, s.z, 0.71, 0.32, 0.23, "#695641");
      terrain.cone("Girdle", s.x, 0.9, s.z, 0.66, 0.66, 0.1, "#795b40");
      if (s.id === "warden") {
        terrain.cone("Quest sign", s.x, 2.62, s.z, 0.04, 0.13, 0.38, "#eeb550");
        terrain.cone(
          "Quest glint",
          s.x,
          2.32,
          s.z,
          0.09,
          0.09,
          0.08,
          "#eeb550",
        );
      }
    } else if (s.id === "forge") {
      terrain.cone(
        s.name,
        s.x,
        0.3,
        s.z,
        1.55,
        1.32,
        0.6,
        "#637679",
      ).checkCollisions = true;
      terrain.cone("Forge rim", s.x, 0.67, s.z, 1.35, 1.5, 0.18, "#b69569");
      terrain.cone("Soul crystal", s.x, 1.22, s.z, 0.62, 0, 0.98, "#9177bd", 5);
      for (const dx of [-0.53, 0.53])
        terrain.cone(
          "Star shard",
          s.x + dx,
          0.95,
          s.z,
          0.28,
          0,
          0.69,
          "#84bbbd",
          5,
        );
    } else {
      for (let i = 0; i < 7; i++) {
        const a = i * 2.4;
        terrain.cone(
          "Silverleaf",
          s.x + Math.sin(a) * 0.5,
          0.32,
          s.z + Math.cos(a) * 0.4,
          0.36,
          0,
          0.72,
          "#7caa87",
          5,
        );
      }
    }
  }
}
export function nearStation(pos: Vector3) {
  return stations.find((s) => Math.hypot(pos.x - s.x, pos.z - s.z) < 3.2);
}
