import { Ray } from "@babylonjs/core/Culling/ray";
import type { Save } from "../services/save";
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
  canMove: () => boolean,
  onZone: (zone: string) => void,
  initial: Save,
) {
  const body = CreateBox("Traveler collider", { size: 1 }, scene);
  body.isVisible = false;
  body.ellipsoid.set(0.38, 0.95, 0.38);
  body.ellipsoidOffset.set(0, 0.95, 0);
  body.position.set(initial.location[0], 0.03, initial.location[1]);
  const model = new TransformNode("Traveler", scene);
  model.parent = body;
  model.scaling.x = initial.profile.body === "Broad" ? 1.1 : 0.86;
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
    const m = terrain.cone(
      name,
      x,
      y,
      z,
      w,
      w * (name === "Boot" ? 0.75 : name === "Tunic" ? 1.25 : 0.88),
      h,
      color,
      8,
    );
    m.scaling.z = d / w;
    m.parent = model;
    return m;
  };
  part("Tunic", 0, 1.14, 0, 0.65, 0.73, 0.44, "#315665");
  part("Belt", 0, 0.85, 0, 0.68, 0.13, 0.46, "#69442d");
  part(
    "Head",
    0,
    1.77,
    0,
    0.45,
    0.47,
    0.42,
    { Amber: "#c58c64", Umber: "#845941", Rose: "#dcad91" }[
      initial.profile.skin
    ],
  );
  part(
    "Hair",
    0,
    1.99,
    -0.03,
    0.47,
    initial.profile.hair === "Long" ? 0.37 : 0.15,
    0.44,
    { Chestnut: "#483128", Silver: "#bbbeb8", Black: "#252629" }[
      initial.profile.color
    ],
  );
  const cloak = part(
    "Split cloak",
    0,
    1.03,
    -0.22,
    0.79,
    0.85,
    0.16,
    "#31574c",
  );
  cloak.rotation.x = -0.15;
  part("Hood collar", 0, 1.48, -0.07, 0.66, 0.19, 0.48, "#ad915c");
  part("Travel pouch", -0.3, 0.82, 0.06, 0.24, 0.23, 0.23, "#906b4d");
  part("Bronze clasp", 0, 1.42, 0.26, 0.1, 0.12, 0.06, "#ddb867");
  for (const side of [-1, 1]) {
    part("Mantle", side * 0.39, 1.42, 0, 0.32, 0.2, 0.4, "#8b7958");
    part("Gauntlet", side * 0.44, 0.97, 0, 0.23, 0.24, 0.24, "#766151");
    part("Leather cuff", side * 0.17, 0.6, 0, 0.28, 0.12, 0.3, "#a1845e");
  }
  const legs = [-1, 1].map((side) =>
    part("Boot", side * 0.17, 0.43, 0, 0.26, 0.79, 0.29, "#473e39"),
  );
  const arms = [-1, 1].map((side) =>
    part("Sleeve", side * 0.43, 1.15, 0, 0.22, 0.64, 0.26, "#b68b55"),
  );
  const shadow = terrain.cone(
    "Traveler shadow",
    0,
    0.048,
    0,
    1.05,
    1.05,
    0.012,
    "#49483d",
    14,
  );
  shadow.isPickable = false;
  shadow.visibility = 0.3;
  const keys = new Set<string>();
  let jumping = false;
  let velocityY = 0;
  let grounded = false;
  let stride = 0;
  let lastZone = "";
  const down = (e: KeyboardEvent) => {
    if (/INPUT|TEXTAREA|SELECT/.test((e.target as HTMLElement)?.tagName))
      return;
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
  camera.beta = 1.33;
  camera.radius = 9;
  scene.onBeforeRenderObservable.add(() => {
    const dt = Math.min(scene.getEngine().getDeltaTime() / 1000, 0.05);
    if (!canMove()) {
      clear();
      return;
    }
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
    grounded =
      velocityY <= 0 &&
      !!scene.pickWithRay(
        new Ray(
          body.position.add(new Vector3(0, 0.1, 0)),
          Vector3.Down(),
          0.15,
        ),
        (mesh) => mesh.checkCollisions && mesh !== body,
      )?.hit;
    if (grounded && jumping) velocityY = 7;
    jumping = false;
    velocityY -= 18 * dt;

    body.moveWithCollisions(
      new Vector3(dir.x * speed * dt, velocityY * dt, dir.z * speed * dt),
    );
    grounded =
      velocityY <= 0 &&
      !!scene.pickWithRay(
        new Ray(
          body.position.add(new Vector3(0, 0.1, 0)),
          Vector3.Down(),
          0.15,
        ),
        (mesh) => mesh.checkCollisions && mesh !== body,
      )?.hit;
    if (grounded) velocityY = 0;
    for (let i = 0; i < 2; i++) {
      const swing =
        (i === 0 ? 1 : -1) *
        (grounded ? (moving ? Math.sin(stride) * 0.55 : 0) : 0.35);
      legs[i].rotation.x = swing;
      arms[i].rotation.x = -swing;
    }
    shadow.position.x = body.position.x;
    shadow.position.z = body.position.z;
    shadow.scaling.setAll(Math.max(0.55, 1 - body.position.y * 0.18));
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
  return {
    body,
    dispose: () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", clear);
    },
  };
}
