import { lazy, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  onAuthStateChanged,
  signOut,
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider,
  type User,
} from "firebase/auth";
import { deleteDoc } from "firebase/firestore";
import { firebase } from "../services/firebase";
import { loadSlot, writeSlot, slotRef } from "../services/cloud";
import {
  freshSave,
  profileSchema,
  type Profile,
  type Save,
} from "../services/save";
import {
  attributeNames,
  availablePoints,
  derive,
  initialAttributes,
} from "../systems/character";
const Valley = lazy(() => import("../game/Valley"));
export default function Account() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  useEffect(
    () =>
      firebase.auth ? onAuthStateChanged(firebase.auth, setUser) : undefined,
    [],
  );
  if (!firebase.auth || !firebase.db)
    return (
      <main>
        <p>{firebase.message}</p>
        <Link to="/">Camp</Link>
      </main>
    );
  if (user === undefined) return <main>Checking session…</main>;
  return user ? <Roster key={user.uid} user={user} /> : <SignIn />;
}
function SignIn() {
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [status, setStatus] = useState(""),
    [busy, setBusy] = useState(false);
  async function act(mode: "login" | "register" | "reset") {
    setBusy(true);
    try {
      const auth = firebase.auth!;
      if (mode === "reset") {
        await sendPasswordResetEmail(auth, email);
        setStatus("Check your email for reset instructions.");
      } else
        await (
          mode === "login"
            ? signInWithEmailAndPassword
            : createUserWithEmailAndPassword
        )(auth, email, password);
    } catch (e) {
      setStatus(String(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="lobby">
      <small>EMBERFALL REGISTRY</small>
      <h2>Account</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void act("login");
        }}
      >
        <label>
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label>
          Password
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <button disabled={busy}>Sign in</button>{" "}
        <button
          disabled={busy}
          type="button"
          onClick={() => void act("register")}
        >
          Register
        </button>{" "}
        <button disabled={busy} type="button" onClick={() => void act("reset")}>
          Reset password
        </button>
      </form>
      <p role="status">{status}</p>
      <Link to="/">Camp</Link>
    </main>
  );
}
function Roster({ user }: { user: User }) {
  const [slot, setSlot] = useState<Save | null | undefined>(undefined),
    [play, setPlay] = useState(false),
    [error, setError] = useState(""),
    [attempt, retry] = useState(0),
    [busy, setBusy] = useState(false),
    [confirm, setConfirm] = useState(false),
    [password, setPassword] = useState("");
  const revision = useRef(0),
    queue = useRef(Promise.resolve()),
    last = useRef("");
  useEffect(() => {
    let live = true;
    loadSlot(firebase.db!, user.uid)
      .then((row) => {
        if (live) {
          revision.current = row?.revision ?? 0;
          setSlot(row?.save ?? null);
          last.current = JSON.stringify(row?.save);
          setError("");
        }
      })
      .catch((e) => {
        if (live) setError(String(e));
      });
    return () => {
      live = false;
    };
  }, [user.uid, attempt]);
  function save(data: Save) {
    const task = queue.current.then(async () => {
      if (firebase.auth?.currentUser?.uid !== user.uid)
        throw Error("Session changed.");
      const text = JSON.stringify(data);
      if (last.current === text) return;
      revision.current = await writeSlot(
        firebase.db!,
        user.uid,
        revision.current,
        data,
      );
      last.current = text;
    });
    queue.current = task.catch(() => {});
    return task;
  }
  if (play && slot)
    return (
      <Valley
        initial={slot}
        onSave={save}
        onExit={(data) => {
          setSlot(data);
          setPlay(false);
        }}
      />
    );
  async function create(data: Save) {
    setBusy(true);
    try {
      await save(data);
      setSlot(data);
      setError("");
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }
  async function erase() {
    setBusy(true);
    try {
      await reauthenticateWithCredential(
        user,
        EmailAuthProvider.credential(user.email!, password),
      );
      await deleteDoc(slotRef(firebase.db!, user.uid));
      setSlot(null);
      await deleteUser(user);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="lobby">
      <small>EMBERFALL REGISTRY</small>
      <h2>Character selection</h2>
      {slot === undefined ? (
        <p>Loading character…</p>
      ) : slot ? (
        <>
          <h3>{slot.profile.name}</h3>
          <button onClick={() => setPlay(true)}>Continue adventure</button>
        </>
      ) : (
        <Creator create={create} busy={busy} />
      )}
      {error && (
        <p role="alert">
          {error}{" "}
          <button onClick={() => retry((a) => a + 1)}>Retry load</button>
        </p>
      )}
      <div>
        <button
          onClick={() =>
            void signOut(firebase.auth!).catch((e) => setError(String(e)))
          }
        >
          Sign out
        </button>{" "}
        <button onClick={() => setConfirm(!confirm)}>Delete account</button>
      </div>
      {confirm && (
        <div>
          <p>Permanently delete this character and account.</p>
          <label>
            Confirm password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <button disabled={!password || busy} onClick={() => void erase()}>
            Permanently delete
          </button>
        </div>
      )}
      <Link to="/">Camp</Link>
    </main>
  );
}
function Creator({
  create,
  busy,
}: {
  create: (s: Save) => void;
  busy: boolean;
}) {
  const [p, set] = useState<Profile>({ ...freshSave().profile, name: "" });
  const [a, setA] = useState(initialAttributes);
  const left = availablePoints(a, 0);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const data = freshSave(profileSchema.parse(p));
        data.hero.attributes = a;
        const stats = derive(a);
        Object.assign(data.hero, {
          health: stats.health,
          mana: stats.mana,
          stamina: stats.stamina,
        });
        create(data);
      }}
    >
      <h3>Create a traveler</h3>
      <label>
        Character name
        <input
          required
          minLength={2}
          maxLength={24}
          value={p.name}
          onChange={(e) => set({ ...p, name: e.target.value })}
        />
      </label>
      {(["body", "skin", "hair", "color"] as const).map((key) => (
        <label key={key}>
          {key}
          <select
            value={p[key]}
            onChange={(e) => set({ ...p, [key]: e.target.value })}
          >
            {profileSchema.shape[key].options.map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
      ))}
      <p>{left} creation points left</p>
      {attributeNames.map((k) => (
        <button
          type="button"
          key={k}
          disabled={!left}
          onClick={() => setA({ ...a, [k]: a[k] + 1 })}
        >
          {k} {a[k]} +
        </button>
      ))}{" "}
      <button type="button" onClick={() => setA(initialAttributes())}>
        Reset points
      </button>
      <button disabled={busy || left !== 0 || p.name.trim().length < 2}>
        Create character
      </button>
    </form>
  );
}
