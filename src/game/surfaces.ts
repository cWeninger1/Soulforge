import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import type { Scene } from "@babylonjs/core/scene";
import type { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
export function textureGround(
  scene: Scene,
  material: StandardMaterial,
  stone: boolean,
  u: number,
  v: number,
) {
  if (!scene.getEngine().getRenderingCanvas()) return;
  const size = 128;
  const tex = new DynamicTexture(
    stone ? "Road cobbles" : "Meadow brush",
    { width: size, height: size },
    scene,
    false,
  );
  const ctx = tex.getContext();
  ctx.fillStyle = stone ? "#d4b98b" : "#b0c88c";
  ctx.fillRect(0, 0, size, size);
  let seed = 201;
  const random = () => {
    seed = (1664525 * seed + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  if (stone) {
    for (let row = -1; row < 7; row++)
      for (let col = -1; col < 5; col++) {
        const x = col * 32 + (row % 2) * 16,
          y = row * 22;
        const shade = Math.floor(170 + random() * 40);
        ctx.fillStyle =
          "rgb(" + shade + "," + (shade - 9) + "," + (shade - 30) + ")";
        ctx.beginPath();
        ctx.moveTo(x + 3, y + 2);
        ctx.lineTo(x + 28, y + 1);
        ctx.lineTo(x + 31, y + 8);
        ctx.lineTo(x + 27, y + 19);
        ctx.lineTo(x + 4, y + 20);
        ctx.lineTo(x + 1, y + 14);
        ctx.closePath();
        ctx.fill();
      }
  } else {
    for (let i = 0; i < 460; i++) {
      const x = random() * size,
        y = random() * size;
      ctx.strokeStyle = i % 2 ? "#9ab77f" : "#c0d397";
      ctx.lineWidth = 0.8 + random() * 1.2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 2, y - 2 - random() * 3);
      ctx.stroke();
    }
  }
  tex.update();
  tex.uScale = u;
  tex.vScale = v;
  material.diffuseTexture = tex;
}
