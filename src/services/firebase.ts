import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
export function connectFirebase(env: Record<string, string | undefined>) {
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
