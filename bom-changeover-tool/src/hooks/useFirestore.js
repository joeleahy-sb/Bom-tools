/**
 * useFirestore.js
 *
 * Provides subscribe() and save() for persisting changeover state
 * to a single Firestore document: changeovers/current
 *
 * subscribe(onData) — sets up a real-time onSnapshot listener.
 *   Returns an unsubscribe function. All connected clients instantly
 *   receive updates when any user saves.
 *
 * save() is debounced (800 ms) so rapid state changes don't spam Firestore.
 *   Each write is stamped with _savedAt so the local client can ignore the
 *   echo snapshot that Firestore fires after its own write.
 *
 * Future multi-project support: replace DOC_PATH with a dynamic path
 * based on a selected project ID.
 */

import { useState, useCallback, useRef } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

const DOC_PATH  = 'changeovers/current';
const DEBOUNCE_MS = 800;

export function useFirestore() {
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);

  const timerRef      = useRef(null);
  const pendingRef    = useRef(null);
  const lastSavedAt   = useRef(null);   // used to suppress echo snapshots

  /**
   * Subscribe to live Firestore updates.
   * Calls onData(data) whenever any client saves.
   * Skips the echo from our own writes.
   * Returns an unsubscribe function — call it in useEffect cleanup.
   */
  const subscribe = useCallback((onData) => {
    const ref  = doc(db, DOC_PATH);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        setLoading(false);
        if (!snap.exists()) return;
        const data = snap.data();
        // Ignore echoes of our own writes
        if (data._savedAt && data._savedAt === lastSavedAt.current) return;
        onData(data);
      },
      (err) => {
        console.error('[Firestore] snapshot error:', err);
        setLoading(false);
      }
    );
    return unsub;
  }, []);

  /**
   * Persist state to Firestore (debounced).
   * Pass the full state object.
   */
  const save = useCallback((data) => {
    pendingRef.current = data;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      const toSave = pendingRef.current;
      if (!toSave) return;
      pendingRef.current = null;

      const savedAt = Date.now();
      lastSavedAt.current = savedAt;

      setSaving(true);
      try {
        await setDoc(
          doc(db, DOC_PATH),
          { ...toSave, _savedAt: savedAt },
          { merge: true }
        );
      } catch (err) {
        console.error('[Firestore] save error:', err);
      } finally {
        setSaving(false);
      }
    }, DEBOUNCE_MS);
  }, []);

  return { subscribe, save, loading, saving };
}
