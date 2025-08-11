// src/lib/userProgress.js
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

const db = getFirestore();

export async function getUserProgress(uid) {
  if (!uid) return {};
  const dref = doc(db, "users", uid);
  const snap = await getDoc(dref);
  if (!snap.exists()) return {};
  const data = snap.data() || {};
  return data.videoProgress || {};
}

export async function saveVideoProgress(uid, videoId, pct) {
  if (!uid) throw new Error("No uid for saving progress");
  const dref = doc(db, "users", uid);
  const now = Date.now();
  const completed = pct >= 80;
  // merge ensures we don't overwrite other keys
  await setDoc(
    dref,
    {
      videoProgress: {
        [videoId]: { completed, pct: Math.round(pct), updatedAt: now },
      },
    },
    { merge: true }
  );
}
