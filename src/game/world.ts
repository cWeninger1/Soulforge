import { freshSave, type Save } from "../services/save";
import { encounters, type CombatView } from "./encounters";
import { buildTerrain } from "./terrain";
import { createTraveler } from "./controller";
import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Color4 } from "@babylonjs/core/Maths/math.color";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
export function startWorld(
  canvas: HTMLCanvasElement,
  onCombat: (v: CombatView) => void,
  onReady: () => void,
  onZone: (zone: string) => void,
  initial: Save = freshSave(),
) {
  const engine = new Engine(canvas, true);
  const scene = new Scene(engine);
  scene.clearColor = new Color4(0.61, 0.78, 0.8, 1);
  const camera = new ArcRotateCamera(
    "orbit",
    -Math.PI / 2,
    1.1,
    12,
    new Vector3(0, 1, 0),
    scene,
  );
  camera.attachControl(canvas, true);
  new HemisphericLight("sky", new Vector3(0.3, 1, 0.2), scene);
  scene.collisionsEnabled = true;
  camera.checkCollisions = true;
  camera.collisionRadius.set(0.2, 0.2, 0.2);
  camera.lowerBetaLimit = 0.35;
  camera.upperBetaLimit = 1.48;
  camera.lowerRadiusLimit = 3;
  camera.upperRadiusLimit = 14;
  camera.panningSensibility = 0;
  camera.wheelPrecision = 40;
  const terrain = buildTerrain(scene);
  const traveler = createTraveler(
    scene,
    camera,
    terrain,
    () => combat.alive(),
    onZone,
    initial,
  );
  const combat = encounters(
    scene,
    terrain,
    traveler.body,
    onCombat,
    structuredClone(initial),
  );
  scene.onAfterRenderObservable.addOnce(onReady);
  const resize = () => engine.resize();
  window.addEventListener("resize", resize);
  engine.runRenderLoop(() => scene.render());
  return {
    combat,
    dispose: () => {
      window.removeEventListener("resize", resize);
      combat.dispose();
      traveler.dispose();
      scene.dispose();
      engine.dispose();
    },
  };
}
