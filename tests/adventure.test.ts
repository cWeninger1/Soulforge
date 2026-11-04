// @vitest-environment jsdom
import { test, expect, vi } from "vitest";
import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import { Scene } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import "@babylonjs/core/Collisions/collisionCoordinator";
import { buildTerrain } from "../src/game/terrain";
import { encounters, type CombatView } from "../src/game/encounters";
import { freshSave, parseSave } from "../src/services/save";
import { quests } from "../src/systems/quests";
test("a traveler fights every quest enemy, claims rewards, resumes progress and respawns", () => {
  const engine = new NullEngine();
  vi.spyOn(engine, "getDeltaTime").mockReturnValue(50);
  const scene = new Scene(engine);
  scene.collisionsEnabled = true;
  new ArcRotateCamera("camera", 0, 1, 8, Vector3.Zero(), scene);
  const terrain = buildTerrain(scene);
  const body = terrain.box("traveler", 0, 0, -26, 0.7, 1.8, 0.7, "#ddddee");
  const data = freshSave();
  let view: CombatView;
  const game = encounters(
    scene,
    terrain,
    body,
    (v) => {
      view = v;
    },
    data,
    () => {},
    () => false,
  );
  function frames(n: number) {
    for (let i = 0; i < n; i++) {
      scene.incrementRenderId();
      for (const m of scene.meshes)
        if (!m.isWorldMatrixFrozen) m.computeWorldMatrix(true);
      scene.onBeforeRenderObservable.notifyObservers(scene);
    }
  }
  try {
    for (const q of quests) game.quest(q.id);
    for (let i = 0; i < 5; i++) game.allocate("Strength");
    game.saveSpell({
      id: "flare",
      version: 1,
      name: "Flare",
      element: "Fire",
      form: "Projectile",
      modifier: "None",
    });
    game.slotSpell(0, "flare");
    for (const q of quests) {
      for (let kill = 0; kill < q.count; kill++) {
        const enemy = scene.meshes.find(
          (m) => m.name === q.enemy && m.isEnabled(),
        )!;
        expect(enemy).toBeTruthy();
        body.position.copyFrom(enemy.position);
        body.position.x += 1;
        body.position.y = 0.05;
        frames(4);
        for (let i = 0; i < 12 && view!.targetName !== q.enemy; i++) {
          game.select();
          frames(4);
        }
        expect(view!.targetName).toBe(q.enemy);
        game.engage();
        for (
          let i = 0;
          i < 140 && game.snapshot().journal[q.id].count === kill;
          i++
        ) {
          game.cast(0);
          frames(4);
          if (!game.alive()) break;
        }
        expect(
          game.snapshot().journal[q.id].count,
          q.name +
            " " +
            JSON.stringify([
              view!.message,
              view!.health,
              view!.target,
              view!.mana,
            ]),
        ).toBe(kill + 1);
        body.position.set(0, 0.05, -26);
        frames(2200);
        while (view!.points > 0) {
          game.allocate("Vitality");
          frames(4);
        }
      }
      game.quest(q.id);
      expect(game.snapshot().journal[q.id].claimed).toBe(true);
    }
    const saved = parseSave(game.snapshot());
    expect(saved.book.unlocks).toContain("Chain");
    expect(saved.bag.entries.some((e) => e.item === "relic")).toBe(true);
    expect(saved.explored).toBe(true);
    const wolf = scene.meshes.find(
      (m) => m.name === "Forest Wolf" && m.isEnabled(),
    )!;
    body.position.copyFrom(wolf.position);
    body.position.x += 1;
    body.position.y = 0.05;
    frames(1300);
    expect(
      game.alive(),
      JSON.stringify([
        view!.message,
        view!.health,
        body.position.asArray(),
        wolf.position.asArray(),
      ]),
    ).toBe(false);
    game.respawn();
    expect(game.alive()).toBe(true);
    expect(body.position.z).toBe(-26);
  } finally {
    game.dispose();
    scene.dispose();
    engine.dispose();
    vi.restoreAllMocks();
  }
}, 30000);
