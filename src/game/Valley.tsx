import { defaultSettings } from "./audio";
import type { Save } from "../services/save";
import { SaveConflictError } from "../services/cloud";
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
  onReload,
}: {
  initial?: Save;
  onSave?: (s: Save) => Promise<void>;
  onExit?: (s: Save) => void;
  onReload?: () => void;
} = {}) {
  const [settings, setSettings] = useState(
    initial?.settings ?? defaultSettings,
  );
  const [paused, setPaused] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const [leaving, setLeaving] = useState(false);
  const [conflict, setConflict] = useState(false);
  const conflictRef = useRef(false);
  const saver = useRef(onSave);
  saver.current = onSave;
  async function checkpoint(exit = false) {
    const snapshot = world.current?.combat.snapshot();
    if (!snapshot || !saver.current || conflictRef.current) return;
    if (exit) {
      setLeaving(true);
      world.current?.pause(true);
    }
    try {
      await saver.current(snapshot);
      setSaveStatus("Character saved");
      if (exit) onExit?.(snapshot);
    } catch (e) {
      setSaveStatus(e instanceof Error ? e.message : String(e));
      if (e instanceof SaveConflictError) {
        conflictRef.current = true;
        setConflict(true);
        setPaused(true);
      }
    } finally {
      if (exit) {
        setLeaving(false);
        world.current?.pause(paused || conflictRef.current);
      }
    }
  }
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    world.current?.configure(settings);
  }, [settings]);
  useEffect(() => {
    world.current?.pause(paused || conflict);
  }, [paused, conflict]);
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
  type Panel =
    "Character" | "Inventory" | "Spellforge" | "Journal" | "Dialogue";
  const [panel, setPanel] = useState<Panel | null>(null);
  const panelRef = useRef(panel);
  panelRef.current = panel;
  const toggle = (name: Panel) => setPanel((p) => (p === name ? null : name));
  const interact = () => {
    const s = world.current?.combat.station();
    if (s?.id === "forge") toggle("Spellforge");
    else if (s?.id === "herbs") world.current?.combat.gather();
    else if (s) toggle("Dialogue");
  };
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
      if (conflictRef.current) return;
      if (/INPUT|TEXTAREA|SELECT/.test((e.target as HTMLElement)?.tagName))
        return;
      if (e.repeat) return;
      const hotkeys: Record<string, Panel> = {
        KeyJ: "Journal",
        KeyK: "Spellforge",
        KeyI: "Inventory",
        KeyC: "Character",
      };
      if (hotkeys[e.code]) toggle(hotkeys[e.code]);
      if (e.code === "KeyE") interact();
      if (e.key === "Escape") {
        if (panelRef.current) setPanel(null);
        else setPaused((v) => !v);
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
    <section inert={leaving}>
      <canvas ref={canvas} aria-label="Emberfall Valley world" tabIndex={0} />
      <header>
        <small>{zone}</small>
        <button
          aria-label="Pause and settings"
          className="gear"
          onClick={() => setPaused(!paused)}
        >
          ⚙
        </button>
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
          <p className="combat-log">{hud.message}</p>
          <button onClick={() => world.current?.combat.select()}>
            Target
          </button>{" "}
          <button onClick={() => world.current?.combat.engage()}>
            Attack (F)
          </button>{" "}
          <button onClick={() => toggle("Character")}>Character (C)</button>
          <button onClick={() => toggle("Inventory")}>Inventory (I)</button>
          {panel === "Inventory" && (
            <InventoryPanel
              bag={hud.bag}
              equip={(id) => world.current?.combat.equipItem(id)}
              remove={(slot) => world.current?.combat.unequip(slot)}
              sort={() => world.current?.combat.sort()}
            />
          )}
          <button onClick={() => toggle("Spellforge")}>Spellforge (K)</button>
          {panel === "Spellforge" && world.current && (
            <Spellforge hud={hud} actions={world.current.combat} />
          )}
          <p>{hud.status}</p>
          <div className="actionbar" aria-label="Action bar">
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
          <button onClick={() => toggle("Journal")}>Journal (J)</button>
          {hud.station && (
            <button onClick={interact}>{hud.station.name} · Interact</button>
          )}
          {world.current &&
            (panel === "Journal" ||
              (panel === "Dialogue" &&
                hud.station &&
                (hud.station.id === "warden" ||
                  hud.station.id === "merchant"))) && (
              <Journal
                hud={hud}
                actions={world.current.combat}
                dialog={!!(panel === "Dialogue" && hud.station)}
              />
            )}
          {panel && (
            <button className="close-panel" onClick={() => setPanel(null)}>
              Close {panel}
            </button>
          )}
          {hud.health === 0 && (
            <button onClick={() => world.current?.combat.respawn()}>
              Respawn in village
            </button>
          )}
          {panel === "Character" && (
            <div className="window">
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
      {paused && (
        <div className="veil">
          <div className="settings">
            <small>BY THE CAMPFIRE</small>
            <h2>Paused</h2>
            {conflict && (
              <div role="alert">
                <p>{saveStatus}</p>
                <p>Your local changes will be discarded when you reload.</p>
                <button onClick={onReload}>Reload cloud progress</button>
              </div>
            )}
            {(["master", "music", "effects", "sensitivity"] as const).map(
              (k) => (
                <label key={k}>
                  {k}
                  <input
                    type="range"
                    aria-label={k}
                    min={k === "sensitivity" ? 0.4 : 0}
                    max={k === "sensitivity" ? 2 : 1}
                    step=".05"
                    value={settings[k]}
                    onChange={(e) =>
                      setSettings({ ...settings, [k]: Number(e.target.value) })
                    }
                  />
                </label>
              ),
            )}
            <label>
              Graphics{" "}
              <select
                value={settings.quality}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    quality: e.target.value as "High" | "Low",
                  })
                }
              >
                <option>High</option>
                <option>Low</option>
              </select>
            </label>
            <button disabled={conflict} onClick={() => setPaused(false)}>
              Resume adventure
            </button>
          </div>
        </div>
      )}
      {!ready && <aside role="status">Lighting the valley…</aside>}
    </section>
  );
}
