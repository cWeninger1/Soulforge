import assert from "node:assert/strict";
import { initializeApp, deleteApp } from "firebase/app";
import { getAuth, connectAuthEmulator, signInAnonymously } from "firebase/auth";
import {
  getFirestore,
  connectFirestoreEmulator,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  getDocs,
  collection,
  terminate,
} from "firebase/firestore";
if (
  process.env.FIRESTORE_EMULATOR_HOST !== "127.0.0.1:8080" ||
  process.env.FIREBASE_AUTH_EMULATOR_HOST !== "127.0.0.1:9099"
)
  throw Error("Run this test with the local emulator command.");
const apps = [];
async function client(label) {
  const app = initializeApp(
    { projectId: "demo-soulforge", apiKey: "demo-only" },
    label,
  );
  const auth = getAuth(app);
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  const db = getFirestore(app);
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
  apps.push({ app, db });
  return { auth, db };
}
const denied = (promise) =>
  assert.rejects(promise, (e) => e.code === "permission-denied");
try {
  const a = await client("owner"),
    b = await client("visitor");
  const uid = (await signInAnonymously(a.auth)).user.uid;
  const path = ["users", uid, "characters", "first"];
  const own = doc(a.db, ...path),
    other = doc(b.db, ...path);
  const data = { revision: 1, version: 1, payload: "{}" };
  await setDoc(own, data);
  await denied(getDoc(other));
  await signInAnonymously(b.auth);
  await denied(getDoc(other));
  await denied(setDoc(other, { ...data, revision: 2 }));
  await denied(deleteDoc(other));
  await denied(getDocs(collection(b.db, "users", uid, "characters")));
  await denied(setDoc(own, data));
  await denied(setDoc(own, { ...data, revision: 2, admin: true }));
  await denied(setDoc(own, { version: 1, revision: 2 }));
  await denied(setDoc(own, { ...data, revision: 2, payload: 42 }));
  await denied(setDoc(own, { ...data, revision: -1 }));
  await denied(
    setDoc(own, { ...data, revision: 2, payload: "x".repeat(96001) }),
  );
  await setDoc(own, { ...data, revision: 2 });
  assert.equal((await getDoc(own)).get("revision"), 2);
  await deleteDoc(own);
  console.log(
    "Emulator ownership, schema, revision and deletion checks passed.",
  );
} finally {
  for (const { app, db } of apps) {
    await terminate(db);
    await deleteApp(app);
  }
}
