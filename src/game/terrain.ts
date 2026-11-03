import type { Scene } from "@babylonjs/core/scene";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { CreateCylinder } from "@babylonjs/core/Meshes/Builders/cylinderBuilder";
import { CreateSphere } from "@babylonjs/core/Meshes/Builders/sphereBuilder";
export function buildTerrain(scene: Scene) {
  const palette = new Map<string, StandardMaterial>();
  function paint(hex: string) {
    let mat = palette.get(hex);
    if (!mat) {
      mat = new StandardMaterial(hex, scene);
      mat.diffuseColor = Color3.FromHexString(hex);
      mat.specularColor = Color3.Black();
      palette.set(hex, mat);
    }
    return mat;
  }
  function box(
    name: string,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    color: string,
    solid = false,
  ) {
    const m = CreateBox(name, { width: w, height: h, depth: d }, scene);
    m.position.set(x, y, z);
    m.material = paint(color);
    m.checkCollisions = solid;
    return m;
  }
  function cone(
    name: string,
    x: number,
    y: number,
    z: number,
    base: number,
    top: number,
    h: number,
    color: string,
    sides = 7,
  ) {
    const m = CreateCylinder(
      name,
      {
        height: h,
        diameterBottom: base,
        diameterTop: top,
        tessellation: sides,
      },
      scene,
    );
    m.position.set(x, y, z);
    m.material = paint(color);
    return m;
  }
  box("Valley floor", 0, -0.25, 0, 80, 0.5, 80, "#77995d", true);
  box("Trader road", 0, 0.016, 0, 4, 0.03, 78, "#b3a073");
  box("Village green", 0, 0.02, -23, 16, 0.03, 11, "#bfa479");
  for (const [x, z] of [
    [-9, -27],
    [8, -22],
    [-7, -15],
    [10, -32],
  ]) {
    box("Limewashed cottage", x, 1.65, z, 5, 3.3, 4, "#d3b384", true);
    cone("Copper roof", x, 4, z, 7.8, 0.5, 2, "#945944", 4).rotation.y =
      Math.PI / 4;
    box("Oak door", x, 0.95, z + 2.03, 1.2, 1.9, 0.1, "#584130");
    box("Lit window", x + 1.5, 1.7, z + 2.05, 0.8, 0.8, 0.1, "#ffcd78");
    box("Chimney", x + 1.4, 3.8, z, 0.6, 2, 0.6, "#76685a");
  }
  for (let i = 0; i < 64; i++) {
    const side = i % 2 === 0 ? 1 : -1;
    const x = side * (5 + ((i * 13) % 29));
    const z = -9 + ((i * 17) % 39);
    const h = 3 + (i % 4);
    cone("Pine trunk", x, 1, z, 0.65, 0.5, 2, "#664c38").checkCollisions = true;
    cone(
      "Pine boughs",
      x,
      h * 0.53 + 1,
      z,
      3.2,
      0,
      h,
      i % 3 ? "#345f50" : "#4f7960",
    );
    cone("Pine crown", x, h * 0.8 + 1, z, 2.2, 0, h * 0.8, "#497860");
  }
  for (const x of [-6, 6])
    for (const z of [22, 28, 34]) {
      box("Ruined pillar", x, 2, z, 1.5, 4, 1.5, "#809091", true);
      box("Carved capital", x, 4, z, 2, 0.6, 2, "#9fa9a1");
    }
  box("Ruined lintel", 0, 4.4, 34, 13, 0.8, 2, "#94a29d", true);
  cone("Old altar", 0, 0.6, 30, 3, 2.8, 1.2, "#778388").checkCollisions = true;
  for (let i = 0; i < 16; i++) {
    const x = (i % 2 ? 1 : -1) * (4 + ((i * 11) % 25)),
      z = -34 + ((i * 13) % 68);
    const rock = CreateSphere("Granite", { diameter: 1.6, segments: 3 }, scene);
    rock.position.set(x, 0.3, z);
    rock.scaling.set(1.4, 0.7, 1);
    rock.material = paint("#859082");
    rock.checkCollisions = true;
  }
  for (const [x, z, w, d] of [
    [-40, 0, 1, 80],
    [40, 0, 1, 80],
    [0, -40, 80, 1],
    [0, 40, 80, 1],
  ]) {
    const wall = box("Cliff boundary", x, 2, z, w, 6, d, "#80917a", true);
    wall.visibility = 0.9;
  }
  return { box, paint };
}
