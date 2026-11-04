import type { Item } from "../data/items";

const shapes: Record<string, string> = {
  Sword: "M13 2 17 3 8 17 5 15Z M3 13 10 18 M5 17 2 22",
  Greatsword: "M13 1 18 4 9 18 4 14Z M2 12 12 19 M6 17 3 23",
  Dagger: "M14 3 18 6 10 14 7 11Z M5 10 12 16 M8 14 3 20",
  Staff: "M13 8 6 22 M13 2 17 5 14 10 10 7Z",
  Bow: "M6 2 Q23 12 6 22 L11 12Z M3 12H21 M18 9 21 12 18 15",
  Shield: "M3 4 12 2 21 4 19 16 12 22 5 16Z M12 5V18",
  Cloth: "M8 3 3 7 6 12 8 10 6 21H18L16 10 18 12 21 7 16 3 12 6Z",
  Leather: "M8 3 3 7 6 12 8 10 8 21H16V10L18 12 21 7 16 3 12 6Z M8 16H16",
  Plate: "M8 3 2 6 4 12 8 10 7 21H17L16 10 20 12 22 6 16 3 12 6Z M12 7V20",
  Ring: "M6 9 Q0 18 12 22 Q24 18 18 9 M7 8 12 2 17 8 12 12Z",
  Charm: "M4 2 Q4 13 12 13 Q20 13 20 2 M12 13 17 18 12 23 7 18Z",
  Material: "M7 2 12 4 17 2 18 7 21 13 17 15 18 21 12 19 6 21 7 15 3 13 6 7Z",
};

export function ItemGlyph({ item }: { item: Item }) {
  return (
    <svg aria-hidden="true" className="item-glyph" viewBox="0 0 24 24">
      <path
        d={shapes[item.family] ?? shapes.Charm}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
