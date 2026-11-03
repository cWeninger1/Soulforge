import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import type { Scene } from "@babylonjs/core/scene";
import type { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import type { buildTerrain } from "./terrain";
import "@babylonjs/core/Collisions/collisionCoordinator";
export function createTraveler(
  scene: Scene,
  camera: ArcRotateCamera,
  terrain: ReturnType<typeof buildTerrain>,
  onZone: (zone: string) => void,
) {
  const body = CreateBox("Traveler collider", { size: 1 }, scene);
  body.isVisible = false;
  body.ellipsoid.set(0.38, 0.95, 0.38);
  body.ellipsoidOffset.set(0, 0.95, 0);
  body.position.set(0, 0.03, -26);
  const model = new TransformNode("Traveler", scene);
  model.parent = body;
  const part = (
    name: string,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    color: string,
  ) => {
    const m = terrain.box(name, x, y, z, w, h, d, color);
    m.parent = model;
    return m;
  };
  part("Tunic", 0, 1.14, 0, 0.65, 0.73, 0.44, "#315665");
  part("Belt", 0, 0.85, 0, 0.68, 0.13, 0.46, "#69442d");
  part("Head", 0, 1.77, 0, 0.45, 0.47, 0.42, "#c58c64");
  part("Hair", 0, 1.99, -0.03, 0.47, 0.15, 0.44, "#483128");
  const legs = [-1, 1].map((side) =>
    part("Boot", side * 0.17, 0.43, 0, 0.26, 0.79, 0.29, "#473e39"),
  );
  const arms = [-1, 1].map((side) =>
    part("Sleeve", side * 0.43, 1.15, 0, 0.22, 0.64, 0.26, "#b68b55"),
  );
  const keys = new Set<string>();
  let jumping = false;
  let velocityY = 0;
  let grounded = false;
  let stride = 0;
  let lastZone = "";
  const down = (e: KeyboardEvent) => {
    if (
      ![
        "KeyW",
        "KeyA",
        "KeyS",
        "KeyD",
        "Space",
        "ShiftLeft",
        "ShiftRight",
      ].includes(e.code)
    )
      return;
    e.preventDefault();
    keys.add(e.code);
    if (e.code === "Space" && !e.repeat) jumping = true;
  };
  const up = (e: KeyboardEvent) => keys.delete(e.code);
  const clear = () => {
    keys.clear();
    jumping = false;
  };
  window.addEventListener("keydown", down);
  window.addEventListener("keyup", up);
  window.addEventListener("blur", clear);
  const anchor = body.position.add(new Vector3(0, 1.35, 0));
  camera.setTarget(anchor);
  camera.alpha = -Math.PI / 2;
  camera.beta = 1.12;
  camera.radius = 8;
  scene.onBeforeRenderObservable.add(() => {
    const dt = Math.min(scene.getEngine().getDeltaTime() / 1000, 0.05);
    const forward = Number(keys.has("KeyW")) - Number(keys.has("KeyS"));
    const right = Number(keys.has("KeyD")) - Number(keys.has("KeyA"));
    const angle = camera.alpha;
    const dir = new Vector3(
      -forward * Math.cos(angle) - right * Math.sin(angle),
      0,
      -forward * Math.sin(angle) + right * Math.cos(angle),
    );
    const moving = dir.lengthSquared() > 0;
    const speed = keys.has("ShiftLeft") || keys.has("ShiftRight") ? 8 : 4.8;
    if (moving) {
      dir.normalize();
      model.rotation.y = Math.atan2(dir.x, dir.z);
      stride += speed * dt * 2.5;
    }
    if (grounded && jumping) velocityY = 7;
    jumping = false;
    velocityY -= 18 * dt;
    const before = body.position.y;
    body.moveWithCollisions(
      new Vector3(dir.x * speed * dt, velocityY * dt, dir.z * speed * dt),
    );
    grounded = velocityY < 0 && Math.abs(before - body.position.y) < 0.002;
    if (grounded) velocityY = 0;
    for (let i = 0; i < 2; i++) {
      const swing =
        (i === 0 ? 1 : -1) *
        (grounded ? (moving ? Math.sin(stride) * 0.55 : 0) : 0.35);
      legs[i].rotation.x = swing;
      arms[i].rotation.x = -swing;
    }
    camera.target.copyFrom(body.position);
    camera.target.y += 1.35;
    const zone =
      body.position.z < -11
        ? "Emberfall Village"
        : body.position.z < 20
          ? "Whispering Woods"
          : "Forgotten Ruins";
    if (zone !== lastZone) {
      lastZone = zone;
      onZone(zone);
    }
  });
  return () => {
    window.removeEventListener("keydown", down);
    window.removeEventListener("keyup", up);
    window.removeEventListener("blur", clear);
  };
}
