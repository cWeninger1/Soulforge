import {
  doc,
  getDocFromServer,
  runTransaction,
  type Firestore,
} from "firebase/firestore";
import { parseSave, type Save } from "./save";
export const slotRef = (db: Firestore, uid: string) =>
  doc(db, "users", uid, "characters", "first");
export async function loadSlot(db: Firestore, uid: string) {
  const result = await getDocFromServer(slotRef(db, uid));
  if (!result.exists()) return null;
  const row = result.data();
  if (row.version !== 1 || !Number.isSafeInteger(row.revision))
    throw Error("Unsupported save version or revision.");
  return {
    revision: row.revision as number,
    save: parseSave(JSON.parse(row.payload)),
  };
}
export async function writeSlot(
  db: Firestore,
  uid: string,
  revision: number,
  save: Save,
) {
  const ref = slotRef(db, uid);
  const payload = JSON.stringify(parseSave(save));
  return runTransaction(db, async (tx) => {
    const old = await tx.get(ref);
    if ((old.exists() ? old.get("revision") : 0) !== revision)
      throw Error("A newer cloud save exists. Return to camp and reload it.");
    tx.set(ref, { version: 1, revision: revision + 1, payload });
    return revision + 1;
  });
}
