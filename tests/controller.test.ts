// @vitest-environment jsdom
import { test, expect, vi } from "vitest";
import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import { Scene } from "@babylonjs/core/scene";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { buildTerrain } from "../src/game/terrain";
import { createTraveler } from "../src/game/controller";
import { freshSave } from "../src/services/save";

test("traveler jumps, lands, stops at buildings and respects pause", () => {
  const engine = new NullEngine();
  vi.spyOn(engine, "getDeltaTime").mockReturnValue(1000 / 60);
  const scene = new Scene(engine);
  scene.collisionsEnabled = true;
  const camera = new ArcRotateCamera("camera", 0, 1, 8, Vector3.Zero(), scene);
  let moving = true;
  const traveler = createTraveler(
    scene,
    camera,
    buildTerrain(scene),
    () => moving,
    () => {},
    freshSave(),
  );
  function frames(count: number) {
    for (let i = 0; i < count; i++) {
      scene.incrementRenderId();
      scene.onBeforeRenderObservable.notifyObservers(scene);
      traveler.body.computeWorldMatrix(true);
    }
  }
  const key = (type: string, code: string) =>
    window.dispatchEvent(new KeyboardEvent(type, { code }));
  try {
    frames(60);
    const grounded = traveler.body.position.y;
    key("keydown", "Space");
    frames(18);
    expect(traveler.body.position.y).toBeGreaterThan(grounded + 0.7);
    key("keyup", "Space");
    frames(90);
    expect(traveler.body.position.y).toBeCloseTo(grounded, 1);
    key("keydown", "KeyA");
    frames(200);
    key("keyup", "KeyA");
    expect(traveler.body.position.x).toBeGreaterThan(-6.5);
    expect(traveler.body.position.x).toBeLessThan(-5);
    moving = false;
    const stopped = traveler.body.position.clone();
    key("keydown", "KeyW");
    frames(20);
    expect(traveler.body.position.asArray()).toEqual(stopped.asArray());
    moving = true;
    frames(20);
    expect(traveler.body.position.z).toBeCloseTo(stopped.z, 2);
  } finally {
    traveler.dispose();
    scene.dispose();
    engine.dispose();
    vi.restoreAllMocks();
  }
});
