import type { buildTerrain } from "./terrain";
export function spawnEnemies(terrain: ReturnType<typeof buildTerrain>) {
  return [
    [-2, -9],
    [3, 1],
    [-1, 10],
    [3, 8],
    [-3, 16],
    [2, 21],
    [-2, 24],
    [0, 28],
  ].map(([x, z], index) => {
    const name =
      index < 3
        ? "Forest Wolf"
        : index < 5
          ? "Goblin Raider"
          : index < 7
            ? "Corrupted Wisp"
            : "Ruins Guardian";
    const boss = index === 7,
      wisp = index === 5 || index === 6;
    const mesh = terrain.box(
      name,
      x,
      0.67,
      z,
      0.78,
      0.75,
      1.5,
      boss ? "#76898a" : wisp ? "#ad8ee0" : index < 3 ? "#79746b" : "#708752",
    );
    mesh.checkCollisions = true;
    mesh.ellipsoid.set(0.4, 0.5, 0.7);
    if (index < 3) {
      const head = terrain.box(
        "Wolf head",
        0,
        0.34,
        0.69,
        0.56,
        0.55,
        0.59,
        "#9b9281",
      );
      head.parent = mesh;
      for (const side of [-1, 1]) {
        const ear = terrain.box(
          "Pointed ear",
          side * 0.18,
          0.68,
          0.61,
          0.16,
          0.28,
          0.19,
          "#48473f",
        );
        ear.parent = mesh;
        for (const end of [-1, 1]) {
          const leg = terrain.box(
            "Paw",
            side * 0.28,
            -0.42,
            end * 0.45,
            0.16,
            0.52,
            0.21,
            "#4d4941",
          );
          leg.parent = mesh;
        }
      }
    } else if (!wisp) {
      mesh.scaling.set(boss ? 2 : 1, boss ? 3 : 1.5, 1);
      const face = terrain.box(
        "Mask",
        0,
        0.57,
        0,
        0.54,
        0.5,
        0.45,
        boss ? "#a79d75" : "#849660",
      );
      face.parent = mesh;
    } else {
      mesh.scaling.set(0.66, 1, 0.5);
      mesh.position.y = 1.45;
    }
    const max = boss ? 150 : wisp ? 27 : index < 3 ? 36 : 48;
    return {
      name,
      max,
      range: wisp ? 8 : boss ? 3 : 1.9,
      power: boss ? 14 : wisp ? 7 : 8,
      windup: 0,
      mesh,
      home: mesh.position.clone(),
      hp: max,
      timer: 0,
      phase: "Patrol",
      index,
      attack: 1,
    };
  });
}
