import { soundscape, type Settings } from "./audio";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { Color3 } from "@babylonjs/core/Maths/math.color";
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
  initial = structuredClone(initial);
  const audio = soundscape(canvas, initial.settings);
  let paused = false;
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
  const sky = new HemisphericLight("sky", new Vector3(0.3, 1, 0.2), scene);
  sky.intensity = 0.72;
  sky.groundColor = new Color3(0.28, 0.33, 0.28);
  scene.collisionsEnabled = true;
  camera.checkCollisions = true;
  camera.collisionRadius.set(0.2, 0.2, 0.2);
  camera.lowerBetaLimit = 0.35;
  camera.upperBetaLimit = 1.48;
  camera.lowerRadiusLimit = 3;
  camera.upperRadiusLimit = 14;
  camera.panningSensibility = 0;
  camera.wheelPrecision = 40;
  const sunlight = new DirectionalLight(
    "Afternoon sun",
    new Vector3(-0.65, -1, 0.4),
    scene,
  );
  sunlight.intensity = 0.55;
  sunlight.diffuse = new Color3(1, 0.86, 0.62);
  scene.fogMode = Scene.FOGMODE_EXP2;
  scene.fogDensity = 0.012;
  scene.fogColor = new Color3(0.63, 0.74, 0.71);
  function configure(settings: Settings) {
    Object.assign(initial.settings, settings);
    engine.setHardwareScalingLevel(settings.quality === "Low" ? 1.75 : 1);
    camera.angularSensibilityX = 1000 / settings.sensitivity;
    camera.angularSensibilityY = 1000 / settings.sensitivity;
  }
  configure(initial.settings);
  const terrain = buildTerrain(scene);
  const traveler = createTraveler(
    scene,
    camera,
    terrain,
    () => !paused && combat.alive(),
    onZone,
    initial,
  );
  const combat = encounters(
    scene,
    terrain,
    traveler.body,
    onCombat,
    initial,
    audio.cue,
    () => paused,
  );
  scene.onAfterRenderObservable.addOnce(onReady);
  const resize = () => engine.resize();
  window.addEventListener("resize", resize);
  engine.runRenderLoop(() => scene.render());
  return {
    combat,
    configure,
    pause: (value: boolean) => {
      paused = value;
    },
    dispose: () => {
      window.removeEventListener("resize", resize);
      audio.dispose();
      combat.dispose();
      traveler.dispose();
      scene.dispose();
      engine.dispose();
    },
  };
}
