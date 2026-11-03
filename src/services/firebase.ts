import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
export function connectFirebase(env: Record<string, string | undefined>) {
  if (env.VITE_USE_EMULATORS === "true" && import.meta.env.DEV) {
    const app = initializeApp(
      {
        projectId: "demo-soulforge",
        apiKey: "demo-only",
        appId: "demo-only",
        authDomain: "localhost",
      },
      "emulator",
    );
    const auth = getAuth(app),
      db = getFirestore(app);
    connectAuthEmulator(auth, "http://127.0.0.1:9099", {
      disableWarnings: true,
    });
    connectFirestoreEmulator(db, "127.0.0.1", 8080);
    return { auth, db, message: "Local Firebase emulators" };
  }
  const config = {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID,
  };
  const missing = Object.entries(config)
    .filter(([, value]) => !value?.trim())
    .map(([key]) => key);
  if (missing.length)
    return {
      message:
        "Local play · Firebase configuration missing: " + missing.join(", "),
    };
  if (config.projectId !== "soulforged-34d3c")
    return { message: "Local play · unexpected Firebase project ID" };
  const app = initializeApp(config);
  return {
    auth: getAuth(app),
    db: getFirestore(app),
    message: "Firebase configured",
  };
}
export const firebase = connectFirebase(import.meta.env);
