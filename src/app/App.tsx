import { Component, lazy, Suspense, type ReactNode } from "react";
import { BrowserRouter, Link, Routes, Route } from "react-router-dom";
import { firebase } from "../services/firebase";
const Account = lazy(() => import("../components/Account"));
const Valley = lazy(() => import("../game/Valley"));
class Boundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <main role="alert">
        <h1>The valley could not load</h1>
        <p>Check WebGL support in your browser.</p>
        <a href="/">Return to camp</a>
      </main>
    ) : (
      this.props.children
    );
  }
}
export function Menu() {
  return (
    <main className="title">
      <small>THE EMBERFALL CHRONICLES</small>
      <h1>Soulforge</h1>
      <p>Beyond the village fires, the old stones stir.</p>
      <Link className="button" to="/valley">
        Enter Emberfall Valley
      </Link>
      {firebase.auth && (
        <Link className="button" to="/account">
          Account &amp; saved characters
        </Link>
      )}
      <footer>{firebase.message} · Valley preview is session-only</footer>
    </main>
  );
}
export function App() {
  return (
    <BrowserRouter>
      <Boundary>
        <Suspense
          fallback={<main role="status">Opening Emberfall Valley…</main>}
        >
          <Routes>
            <Route path="/" element={<Menu />} />
            <Route path="/account" element={<Account />} />
            <Route path="/valley" element={<Valley />} />
            <Route
              path="*"
              element={
                <main>
                  <h1>Trail lost</h1>
                  <Link to="/">Return to camp</Link>
                </main>
              }
            />
          </Routes>
        </Suspense>
      </Boundary>
    </BrowserRouter>
  );
}
