"use client";

import { useSyncExternalStore } from "react";
import { emptyLearnerState, normalizeLearnerState, LEARNER_STATE_VERSION } from "@/lib/learning/state";

// A guest's learner state, kept in this browser (localStorage) so it survives a reload
// or reopening the browser on the same device. It is never sent to the server and is
// never account progress: every score in it came from the server's grading, but the
// server doesn't trust or read any of it. Clearing site data (or "Clear" on /account)
// removes it. The key carries the state version; another version starts empty.

export const GUEST_STATE_KEY = `lga:guest:v${LEARNER_STATE_VERSION}`;

let cache; // parsed state, or undefined before the first read
const listeners = new Set();

function read() {
  try {
    const raw = window.localStorage.getItem(GUEST_STATE_KEY);
    cache = normalizeLearnerState(raw ? JSON.parse(raw) : null);
  } catch {
    // Storage unavailable (private mode, blocked) or unreadable: start empty, in memory.
    cache = emptyLearnerState();
  }
  return cache;
}

export function getGuestState() {
  return cache === undefined ? read() : cache;
}

function emit() {
  for (const l of listeners) l();
}

// Applies one of the reducers in lib/learning/state.js and stores the result.
export function updateGuestState(fn) {
  cache = fn(getGuestState());
  try {
    window.localStorage.setItem(GUEST_STATE_KEY, JSON.stringify(cache));
  } catch {
    // Quota or storage blocked: the state still works for this page view.
  }
  emit();
  return cache;
}

export function clearGuestState() {
  try {
    window.localStorage.removeItem(GUEST_STATE_KEY);
  } catch {
    // ignore
  }
  cache = emptyLearnerState();
  emit();
}

function subscribe(listener) {
  listeners.add(listener);
  // Another tab changed the guest state.
  const onStorage = (e) => {
    if (e.key === GUEST_STATE_KEY || e.key === null) {
      read();
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

// null during server rendering and hydration (the server can't know the guest's state),
// then the stored state.
export function useGuestState() {
  return useSyncExternalStore(subscribe, getGuestState, () => null);
}

export function hasGuestProgress(state) {
  return Boolean(state && (Object.keys(state.lessons).length || Object.keys(state.vocab).length || Object.keys(state.exams).length));
}
