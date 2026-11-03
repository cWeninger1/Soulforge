import type { CombatView } from "./encounters";
import { attributeNames, balance } from "../systems/character";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { startWorld } from "./world";
export default function Valley() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const [zone, setZone] = useState("Emberfall Village");
  const world = useRef<ReturnType<typeof startWorld> | null>(null);
  const [hud, setHud] = useState<CombatView>();
  const [sheet, setSheet] = useState(false);
  useEffect(() => {
    const active = startWorld(
      canvas.current!,
      setHud,
      () => {
        setReady(true);
        canvas.current?.focus();
      },
      setZone,
    );
    world.current = active;
    const key = (e: KeyboardEvent) => {
      if (e.code === "KeyC" && !e.repeat) setSheet((s) => !s);
      if (e.key === "Escape") setSheet(false);
    };
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("keydown", key);
      world.current = null;
      active.dispose();
    };
  }, []);
  return (
    <section>
      <canvas ref={canvas} aria-label="Emberfall Valley world" tabIndex={0} />
      <header>
        <small>{zone}</small>
        <h2>Emberfall Valley</h2>
        <Link to="/">Return to camp</Link>
      </header>
      <div className="controls">
        WASD · Move Shift · Sprint Space · Jump Drag · Orbit Wheel · Zoom
      </div>
      {hud && (
        <aside className="hud">
          <small>TRAVELER · LEVEL {hud.level}</small>
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
              Forest Wolf · {hud.target}/36
              <progress value={hud.target} max={36} />
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
          {hud.health === 0 && (
            <button onClick={() => world.current?.combat.respawn()}>
              Respawn in village
            </button>
          )}
          {sheet && (
            <div>
              <h3>Character sheet</h3>
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
