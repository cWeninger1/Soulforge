import { CreateDisc } from "@babylonjs/core/Meshes/Builders/discBuilder";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { Vector3, Matrix } from "@babylonjs/core/Maths/math.vector";
import type { Scene } from "@babylonjs/core/scene";
import type { buildTerrain } from "./terrain";
export function targetMarker(
  scene: Scene,
  terrain: ReturnType<typeof buildTerrain>,
) {
  const m = CreateDisc(
    "Target sigil",
    { radius: 1.05, tessellation: 12, sideOrientation: Mesh.DOUBLESIDE },
    scene,
  );
  m.rotation.x = Math.PI / 2;
  m.material = terrain.paint("#dbad56");
  m.visibility = 0.6;
  m.isPickable = false;
  m.setEnabled(false);
  return m;
}
export function damageNumber(
  scene: Scene,
  pos: Vector3,
  amount: number,
  friendly = false,
) {
  const canvas = scene.getEngine().getRenderingCanvas();
  if (!canvas?.parentElement || !scene.activeCamera) return;
  const mark = document.createElement("b");
  mark.setAttribute("aria-hidden", "true");
  mark.className = "hit-number" + (friendly ? " hurt" : "");
  mark.textContent = "−" + amount;
  const p = Vector3.Project(
    pos.add(new Vector3(0, 1.2, 0)),
    Matrix.Identity(),
    scene.getTransformMatrix(),
    scene.activeCamera.viewport.toGlobal(
      canvas.clientWidth,
      canvas.clientHeight,
    ),
  );
  mark.style.left = p.x + "px";
  mark.style.top = p.y + "px";
  canvas.parentElement.append(mark);
  mark.addEventListener("animationend", () => mark.remove(), { once: true });
}
