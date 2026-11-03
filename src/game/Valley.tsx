import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { startWorld } from "./world";
export default function Valley() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const [zone, setZone] = useState("Emberfall Village");
  useEffect(
    () => startWorld(canvas.current!, () => setReady(true), setZone),
    [],
  );
  return (
    <section>
      <canvas ref={canvas} aria-label="Emberfall Valley world" tabIndex={0} />
      <header>
        <small>{zone}</small>
        <h2>Emberfall Valley</h2>
        <Link to="/">Return to camp</Link>
      </header>
      <div className="controls">
        WASD · Move  Shift · Sprint  Space · Jump  Drag · Orbit  Wheel ·
        Zoom
      </div>
      {!ready && <aside role="status">Lighting the valley…</aside>}
    </section>
  );
}

