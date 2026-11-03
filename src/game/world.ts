import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { CreateGround } from "@babylonjs/core/Meshes/Builders/groundBuilder";
import { CreateCylinder } from "@babylonjs/core/Meshes/Builders/cylinderBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
export function startWorld(canvas: HTMLCanvasElement, onReady: () => void) {
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
  const ground = CreateGround("meadow", { width: 80, height: 80 }, scene);
  const turf = new StandardMaterial("moss", scene);
  turf.diffuseColor = Color3.FromHexString("#769653");
  ground.material = turf;
  const stone = CreateCylinder(
    "waystone",
    { height: 3, diameterTop: 0.5, diameterBottom: 1.2, tessellation: 6 },
    scene,
  );
  stone.position.y = 1.5;
  scene.onAfterRenderObservable.addOnce(onReady);
  const resize = () => engine.resize();
  window.addEventListener("resize", resize);
  engine.runRenderLoop(() => scene.render());
  return () => {
    window.removeEventListener("resize", resize);
    scene.dispose();
    engine.dispose();
  };
}
