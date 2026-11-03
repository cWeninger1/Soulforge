import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { startWorld } from "./world";
export default function Valley() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => startWorld(canvas.current!, () => setReady(true)), []);
  return (
    <section>
      <canvas ref={canvas} aria-label="Emberfall Valley world" tabIndex={0} />
      <header>
        <small>STARTER REGION</small>
        <h2>Emberfall Valley</h2>
        <Link to="/">Return to camp</Link>
      </header>
      {!ready && <aside role="status">Lighting the valley…</aside>}
    </section>
  );
}
