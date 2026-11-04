import { items, slots, type Slot } from "../data/items";
import type { Inventory } from "../systems/inventory";
import { ItemGlyph } from "./ItemGlyph";
export function InventoryPanel({
  bag,
  equip,
  remove,
  sort,
}: {
  bag: Inventory;
  equip: (id: string) => void;
  remove: (slot: Slot) => void;
  sort: () => void;
}) {
  return (
    <div className="window">
      <small>TRAVELER'S PACK</small>
      <h3>Inventory</h3>
      <p>
        {bag.gold} gold · {bag.entries.length}/24 slots
      </p>
      <button onClick={sort}>Sort pack</button>
      <div className="grid">
        {Array.from({ length: 24 }, (_, i) => {
          const entry = bag.entries[i];
          if (!entry)
            return (
              <span key={i} className="empty" aria-hidden="true">
                ·
              </span>
            );
          const item = items[entry.item];
          const current = Object.values(bag.equipment).includes(entry.id);
          const worn = bag.entries.find(
            (e) => item.slot && bag.equipment[item.slot] === e.id,
          );
          const comparison = worn
            ? "Currently wearing " +
              items[worn.item].name +
              " " +
              JSON.stringify(items[worn.item].bonus)
            : "Slot empty";
          const details = Object.entries(item.bonus)
            .map(([k, v]) => k + " +" + v)
            .join(", ");
          return (
            <button
              data-rarity={item.rarity}
              title={[
                item.rarity,
                item.family,
                comparison,
                details,
                JSON.stringify(item.requirements),
              ].join(" · ")}
              disabled={!item.slot || current}
              key={entry.id}
              onClick={() => equip(entry.id)}
            >
              <ItemGlyph item={item} />
              {current ? "◆ " : ""}
              {item.name}
              {entry.count > 1 ? " ×" + entry.count : ""}
            </button>
          );
        })}
      </div>
      <h4>Equipment</h4>
      {slots.map((slot) => {
        const entry = bag.entries.find((e) => e.id === bag.equipment[slot]);
        return (
          <div key={slot}>
            {slot} ·{" "}
            {entry ? (
              <button onClick={() => remove(slot)}>
                Remove {items[entry.item].name}
              </button>
            ) : (
              "Empty"
            )}
          </div>
        );
      })}
    </div>
  );
}
