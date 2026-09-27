"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { recordToolUse } from "@/lib/tool-activity";

export function useDirectToolRoute(
  categoryId: string,
  toolIds: readonly string[],
  toolAliases: Readonly<Record<string, string>> = {},
) {
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const toolIdsKey = toolIds.join("|");
  const toolAliasesKey = JSON.stringify(toolAliases);
  const initialSyncDone = useRef(false);

  useEffect(() => {
    const allowedToolIds = new Set(toolIdsKey.split("|"));
    const aliases = JSON.parse(toolAliasesKey) as Record<string, string>;
    const resolveToolId = (requestedTool: string | null) => {
      if (!requestedTool) return null;
      const targetTool = aliases[requestedTool] ?? requestedTool;
      return allowedToolIds.has(targetTool) ? targetTool : null;
    };

    const syncFromUrl = (countUsage: boolean) => {
      const requestedTool = new URLSearchParams(window.location.search).get("tool");
      const selectedTool = resolveToolId(requestedTool);
      setActiveTool(selectedTool);
      if (countUsage && selectedTool) recordToolUse(categoryId, selectedTool);
    };

    if (!initialSyncDone.current) {
      syncFromUrl(true);
      initialSyncDone.current = true;
    }
    const handlePopState = () => syncFromUrl(true);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [categoryId, toolIdsKey, toolAliasesKey]);

  const updateToolUrl = (toolId: string | null) => {
    const url = new URL(window.location.href);
    if (toolId) {
      url.searchParams.set("tool", toolId);
    } else {
      url.searchParams.delete("tool");
    }
    window.history.pushState(null, "", `${url.pathname}${url.search}${url.hash}`);
  };

  const openTool = useCallback((toolId: string) => {
    if (!toolIdsKey.split("|").includes(toolId)) return;
    updateToolUrl(toolId);
    recordToolUse(categoryId, toolId);
    setActiveTool(toolId);
  }, [categoryId, toolIdsKey]);

  const closeTool = useCallback(() => {
    updateToolUrl(null);
    setActiveTool(null);
  }, []);

  return { activeTool, setActiveTool, openTool, closeTool };
}
