import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { CreateSphere } from "@babylonjs/core/Meshes/Builders/sphereBuilder";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import type { Scene } from "@babylonjs/core/scene";
import type { Design } from "../systems/spells";
const colors = {
  Fire: "#ff862d",
  Frost: "#80e8ff",
  Arcane: "#b792ff",
  Nature: "#87ed90",
};
export function showMagic(
  scene: Scene,
  d: Design,
  from: Vector3,
  to: Vector3,
  attachment?: TransformNode,
  duration = 0.55,
) {
  const orb = CreateSphere(
    "Spell · " + d.name,
    { diameter: 1, segments: 8 },
    scene,
  );
  orb.isPickable = false;
  const mat = new StandardMaterial("Magic glow", scene);
  mat.emissiveColor = Color3.FromHexString(colors[d.element]);
  orb.material = mat;
  mat.wireframe = d.form === "Barrier" || d.form === "Nova";
  if (attachment) orb.parent = attachment;
  let age = 0;
  const start = from.clone(),
    end = to.clone();
  const obs = scene.onBeforeRenderObservable.add(() => {
    age += Math.min(0.05, scene.getEngine().getDeltaTime() / 1000);
    const t = Math.min(1, age / duration);
    if (attachment) orb.position.set(0, d.form === "Barrier" ? 0.95 : 0, 0);
    else Vector3.LerpToRef(start, end, t, orb.position);
    orb.scaling.setAll(
      d.form === "Nova"
        ? 1 + t * 9
        : d.form === "Barrier"
          ? 2.4
          : d.form === "Projectile"
            ? 0.45
            : 0.8,
    );
    mat.alpha = 1 - t * 0.85;
    if (t === 1) {
      scene.onBeforeRenderObservable.remove(obs);
      orb.dispose();
      mat.dispose();
    }
  });
}
