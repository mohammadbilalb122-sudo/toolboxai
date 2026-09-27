"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "toolboxai-tool-activity-v1";
const ACTIVITY_EVENT = "toolboxai-tool-activity-change";

export type ToolActivity = {
  favorites: string[];
  recent: string[];
  counts: Record<string, number>;
};

const EMPTY_ACTIVITY: ToolActivity = { favorites: [], recent: [], counts: {} };

export function makeToolKey(categoryId: string, toolId: string): string {
  return `${categoryId}:${toolId}`;
}

function readActivity(): ToolActivity {
  if (typeof window === "undefined") return EMPTY_ACTIVITY;

  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null") as Partial<ToolActivity> | null;
    if (!parsed || typeof parsed !== "object") return EMPTY_ACTIVITY;
    const counts = parsed.counts && typeof parsed.counts === "object" ? parsed.counts : {};
    return {
      favorites: Array.isArray(parsed.favorites) ? parsed.favorites.filter((key): key is string => typeof key === "string") : [],
      recent: Array.isArray(parsed.recent) ? parsed.recent.filter((key): key is string => typeof key === "string") : [],
      counts: Object.fromEntries(
        Object.entries(counts).filter((entry): entry is [string, number] =>
          typeof entry[0] === "string" && typeof entry[1] === "number" && Number.isFinite(entry[1]) && entry[1] >= 0,
        ),
      ),
    };
  } catch {
    return EMPTY_ACTIVITY;
  }
}

function writeActivity(activity: ToolActivity): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(activity));
  } catch {
    // Keep tools usable when local storage is unavailable or full.
  }
  window.dispatchEvent(new Event(ACTIVITY_EVENT));
}

export function recordToolUse(categoryId: string, toolId: string): void {
  if (typeof window === "undefined") return;
  const key = makeToolKey(categoryId, toolId);
  const activity = readActivity();
  activity.counts[key] = (activity.counts[key] ?? 0) + 1;
  activity.recent = [key, ...activity.recent.filter((recentKey) => recentKey !== key)].slice(0, 10);
  writeActivity(activity);
}

export function useToolActivity() {
  const [activity, setActivity] = useState<ToolActivity>(EMPTY_ACTIVITY);

  useEffect(() => {
    const syncActivity = () => setActivity(readActivity());
    syncActivity();
    window.addEventListener(ACTIVITY_EVENT, syncActivity);
    window.addEventListener("storage", syncActivity);
    return () => {
      window.removeEventListener(ACTIVITY_EVENT, syncActivity);
      window.removeEventListener("storage", syncActivity);
    };
  }, []);

  const toggleFavorite = useCallback((key: string) => {
    const current = readActivity();
    const isFavorite = current.favorites.includes(key);
    const next: ToolActivity = {
      ...current,
      favorites: isFavorite
        ? current.favorites.filter((favoriteKey) => favoriteKey !== key)
        : [key, ...current.favorites],
    };
    writeActivity(next);
    setActivity(next);
  }, []);

  return { activity, toggleFavorite };
}
