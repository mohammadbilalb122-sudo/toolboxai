import { useSyncExternalStore } from "react";

const THEME_KEY = "theme";
const THEME_EVENT = "toolboxai-themechange";

/**
 * Subscribes to theme changes from two sources: the in-page toggle (a custom
 * event, since `storage` only fires cross-document) and other tabs.
 */
function subscribe(callback: () => void) {
  window.addEventListener(THEME_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(THEME_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

/**
 * Reads the class that the blocking script in `app/layout.tsx` already applied,
 * so the toggle cannot disagree with the rendered page.
 */
function getSnapshot() {
  return document.documentElement.classList.contains("dark");
}

function getServerSnapshot() {
  return false;
}

export function useIsDarkTheme() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function applyTheme(dark: boolean) {
  document.documentElement.classList.toggle("dark", dark);
  try {
    localStorage.setItem(THEME_KEY, dark ? "dark" : "light");
  } catch {
    // Private mode or blocked storage; the class is still applied.
  }
  window.dispatchEvent(new Event(THEME_EVENT));
}
