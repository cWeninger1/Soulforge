import { useState } from "react";
import {
  elements,
  forms,
  modifiers,
  preview,
  spellError,
  type Design,
} from "../systems/spells";
import type { CombatView, encounters } from "../game/encounters";
const blank = (): Design => ({
  id: "",
  name: "",
  element: "Fire",
  form: "Projectile",
  modifier: "None",
  version: 1,
});
export function Spellforge({
  hud,
  actions,
}: {
  hud: CombatView;
  actions: ReturnType<typeof encounters>;
}) {
  const [draft, set] = useState<Design>(blank);
  const p = preview(draft, hud.stats.magic);
  const effect =
    draft.form === "Barrier"
      ? `Absorbs ${p.power} damage for ${p.duration} seconds.`
      : draft.form === "Enchantment"
        ? `Adds ${Math.ceil(p.power * 0.4)} damage to weapon hits for ${p.duration} seconds.`
        : draft.element === "Nature" && draft.form === "Projectile"
          ? `Restores ${p.power} health to you.`
          : `Deals up to ${p.power} ${draft.element.toLowerCase()} damage before resistance.`;
  const error = spellError(
    draft,
    hud.book,
    hud.attributes,
    hud.stats.complexity,
    !!hud.bag.equipment["Main Hand"],
  );
  return (
    <div className="window forge">
      <small>ARCANE WORKSHOP</small>
      <h3>Spellforge</h3>
      <p>{effect}</p>
      <label>
        Spell name
        <input
          value={draft.name}
          maxLength={32}
          onChange={(e) => set({ ...draft, name: e.target.value })}
        />
      </label>
      {(["element", "form", "modifier"] as const).map((key, i) => (
        <label key={key}>
          {key}
          <select
            value={draft[key]}
            onChange={(e) => set({ ...draft, [key]: e.target.value })}
          >
            {[elements, forms, modifiers][i].map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </label>
      ))}
      <p>
        Power {p.power} · {p.mana} mana · {p.cooldown}s cooldown · Complexity{" "}
        {p.complexity}/{hud.stats.complexity} · INT {p.intelligence} / WILL{" "}
        {p.willpower}
      </p>
      {error && <p>{error}</p>}
      <button
        disabled={!!error}
        onClick={() => {
          actions.saveSpell(draft);
          set(blank());
        }}
      >
        Save spell
      </button>{" "}
      <button onClick={() => set(blank())}>New design</button>
      <h4>Spellbook</h4>
      {hud.book.designs.map((d) => (
        <div key={d.id}>
          <strong>{d.name}</strong>{" "}
          <button onClick={() => set({ ...d })}>Edit</button>{" "}
          <button onClick={() => actions.removeSpell(d.id)}>Delete</button>
        </div>
      ))}
      <h4>Action bar</h4>
      {hud.book.slots.map((id, i) => (
        <label key={i}>
          Slot {i + 1}
          <select
            aria-label={"Slot " + (i + 1)}
            value={id ?? ""}
            onChange={(e) => actions.slotSpell(i, e.target.value || null)}
          >
            <option value="">Empty</option>
            {hud.book.designs.map((d) => (
              <option value={d.id} key={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </label>
      ))}
    </div>
  );
}
