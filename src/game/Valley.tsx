import type { Save } from "../services/save";
import { Journal } from "../components/Journal";
import { Spellforge } from "../components/Spellforge";
import { InventoryPanel } from "../components/InventoryPanel";
import type { CombatView } from "./encounters";
import { attributeNames, balance } from "../systems/character";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { startWorld } from "./world";
export default function Valley({
  initial,
  onSave,
  onExit,
}: {
  initial?: Save;
  onSave?: (s: Save) => Promise<void>;
  onExit?: (s: Save) => void;
} = {}) {
  const [saveStatus, setSaveStatus] = useState("");
  const [leaving, setLeaving] = useState(false);
  const saver = useRef(onSave);
  saver.current = onSave;
  async function checkpoint(exit = false) {
    const snapshot = world.current?.combat.snapshot();
    if (!snapshot || !saver.current) return;
    if (exit) setLeaving(true);
    try {
      await saver.current(snapshot);
      setSaveStatus("Character saved");
      if (exit) onExit?.(snapshot);
    } catch (e) {
      setSaveStatus(String(e));
    } finally {
      if (exit) setLeaving(false);
    }
  }
  const canvas = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const [zone, setZone] = useState("Emberfall Village");
  const world = useRef<ReturnType<typeof startWorld> | null>(null);
  const [hud, setHud] = useState<CombatView>();
  const progression = hud
    ? JSON.stringify([hud.bag, hud.book, hud.attributes, hud.xp, hud.journal])
    : null;
  useEffect(() => {
    if (!saver.current || !progression) return;
    const t = window.setTimeout(() => void checkpoint(), 400);
    return () => window.clearTimeout(t);
  }, [progression]);
  const [sheet, setSheet] = useState(false);
  const [journal, setJournal] = useState(false);
  const [talk, setTalk] = useState(false);
  const [forge, setForge] = useState(false);
  const [pack, setPack] = useState(false);
  useEffect(() => {
    const active = startWorld(
      canvas.current!,
      setHud,
      () => {
        setReady(true);
        canvas.current?.focus();
      },
      setZone,
      initial,
    );
    world.current = active;
    const timer = saver.current
      ? window.setInterval(() => {
          void checkpoint();
        }, 10000)
      : undefined;
    const key = (e: KeyboardEvent) => {
      if (/INPUT|TEXTAREA|SELECT/.test((e.target as HTMLElement)?.tagName))
        return;
      if (e.code === "KeyJ" && !e.repeat) setJournal((v) => !v);
      if (e.code === "KeyE" && !e.repeat) setTalk((v) => !v);
      if (e.code === "KeyK" && !e.repeat) setForge((v) => !v);
      if (e.code === "KeyC" && !e.repeat) setSheet((s) => !s);
      if (e.code === "KeyI" && !e.repeat) setPack((v) => !v);
      if (e.key === "Escape") {
        setSheet(false);
        setJournal(false);
        setTalk(false);
        setPack(false);
        setForge(false);
      }
    };
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("keydown", key);
      window.clearInterval(timer);
      world.current = null;
      active.dispose();
    };
  }, [initial]);
  return (
    <section>
      <canvas ref={canvas} aria-label="Emberfall Valley world" tabIndex={0} />
      <header>
        <small>{zone}</small>
        <h2>Emberfall Valley</h2>
        {onSave ? (
          <>
            <button disabled={leaving} onClick={() => void checkpoint(true)}>
              Save and return to camp
            </button>
            <button onClick={() => void checkpoint()}>Save now</button>
            <p role="status">{saveStatus}</p>
          </>
        ) : (
          <Link to="/">Return to camp</Link>
        )}
      </header>
      <div className="controls">
        WASD · Move Shift · Sprint Space · Jump Drag · Orbit Wheel · Zoom
      </div>
      {hud && (
        <aside className="hud">
          <small>
            {initial?.profile.name ?? "TRAVELER"} · LEVEL {hud.level}
          </small>
          {(["health", "mana", "stamina"] as const).map((key) => (
            <label key={key}>
              {key} {hud[key]}/{hud.max[key]}
              <progress value={hud[key]} max={hud.max[key]} />
            </label>
          ))}
          <label>
            Experience {hud.xp}
            <progress
              value={hud.xp}
              max={balance.thresholds[hud.level] ?? hud.xp}
            />
          </label>
          {hud.target !== null && (
            <label>
              {hud.targetName} · {hud.target}/{hud.targetMax}
              <progress value={hud.target} max={hud.targetMax} />
            </label>
          )}
          <p>{hud.message}</p>
          <button onClick={() => world.current?.combat.select()}>
            Target
          </button>{" "}
          <button onClick={() => world.current?.combat.engage()}>
            Attack (F)
          </button>{" "}
          <button onClick={() => setSheet(!sheet)}>Character (C)</button>
          <button onClick={() => setPack(!pack)}>Inventory (I)</button>
          {pack && (
            <InventoryPanel
              bag={hud.bag}
              equip={(id) => world.current?.combat.equipItem(id)}
              remove={(slot) => world.current?.combat.unequip(slot)}
              sort={() => world.current?.combat.sort()}
            />
          )}
          <button onClick={() => setForge(!forge)}>Spellforge (K)</button>
          {forge && world.current && (
            <Spellforge hud={hud} actions={world.current.combat} />
          )}
          <p>{hud.status}</p>
          <div aria-label="Action bar">
            {hud.book.slots.map((id, i) => (
              <button
                key={i}
                disabled={!id || hud.remaining[i] > 0}
                onClick={() => world.current?.combat.cast(i)}
              >
                {i + 1} ·{" "}
                {hud.book.designs.find((d) => d.id === id)?.name ?? "—"}{" "}
                {hud.remaining[i] > 0 ? hud.remaining[i] + "s" : ""}
              </button>
            ))}
          </div>
          <button onClick={() => setJournal(!journal)}>Journal (J)</button>
          {hud.station && (
            <button
              onClick={() => {
                if (hud.station?.id === "forge") setForge(!forge);
                else if (hud.station?.id === "herbs")
                  world.current?.combat.gather();
                else setTalk(!talk);
              }}
            >
              {hud.station.name} · Interact
            </button>
          )}
          {world.current &&
            (journal ||
              (talk &&
                hud.station &&
                (hud.station.id === "warden" ||
                  hud.station.id === "merchant"))) && (
              <Journal
                hud={hud}
                actions={world.current.combat}
                dialog={!!(talk && hud.station)}
              />
            )}
          {hud.health === 0 && (
            <button onClick={() => world.current?.combat.respawn()}>
              Respawn in village
            </button>
          )}
          {sheet && (
            <div>
              <h3>Character sheet</h3>
              <button onClick={() => world.current?.combat.respec()}>
                Refund attributes
              </button>
              <details>
                <summary>Derived statistics</summary>
                {Object.entries(hud.stats).map(([k, v]) => (
                  <div key={k}>
                    {k} · {v.toFixed(2)}
                  </div>
                ))}
              </details>
              <p>{hud.points} points available</p>
              {attributeNames.map((key) => (
                <label key={key}>
                  {key} {hud.attributes[key]}{" "}
                  <button
                    aria-label={"Increase " + key}
                    disabled={!hud.points}
                    onClick={() => world.current?.combat.allocate(key)}
                  >
                    Increase {key}
                  </button>
                </label>
              ))}
            </div>
          )}
        </aside>
      )}
      {!ready && <aside role="status">Lighting the valley…</aside>}
    </section>
  );
}
