import { useEffect, useRef } from "react";

/**
 * usePreserveScroll
 *
 * Save/restore scroll position for a container element (by id) or the window.
 * - key: localStorage key
 * - containerId: element id (without '#') or "window"
 * - opts.debounceMs: debounce time for saves
 */
type Options = { debounceMs?: number };

export function usePreserveScroll(
  key = "sigil:scroll:main",
  containerId = "main",
  opts: Options = {}
) {
  const timerRef = useRef<number | null>(null);
  const lastSavedRef = useRef<number | null>(null);
  const debounceMs = opts.debounceMs ?? 120;

  function getTarget() {
    if (typeof window === "undefined") return null;
    if (!containerId || containerId === "window") return window;
    const el = document.getElementById(containerId);
    return el ?? window;
  }

  function readPos(): number {
    const t = getTarget();
    if (!t) return 0;
    if (t === window) return window.scrollY || window.pageYOffset || 0;
    return (t as HTMLElement).scrollTop;
  }

  function writePos(v: number) {
    const t = getTarget();
    if (!t) return;
    if (t === window) window.scrollTo({ top: v });
    else (t as HTMLElement).scrollTop = v;
  }

  function scheduleSave() {
    const pos = readPos();
    lastSavedRef.current = pos;
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      try {
        localStorage.setItem(key, String(lastSavedRef.current ?? 0));
      } catch (e) {
        /* ignore */
      } finally {
        timerRef.current = null;
      }
    }, debounceMs);
  }

  function flushSave() {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    try {
      localStorage.setItem(key, String(readPos()));
    } catch (e) {
      /* ignore */
    }
  }

  useEffect(() => {
    // Restore
    try {
      const raw = localStorage.getItem(key);
      if (raw != null) {
        const val = Number(raw);
        if (!Number.isNaN(val)) {
          requestAnimationFrame(() => writePos(val));
        }
      }
    } catch (e) {
      /* ignore */
    }

    const tgt = getTarget();

    function handleScroll() {
      scheduleSave();
    }

    function handlePopState() {
      try {
        const raw = localStorage.getItem(key);
        if (raw != null) {
          const val = Number(raw);
          if (!Number.isNaN(val)) requestAnimationFrame(() => writePos(val));
        }
      } catch {}
    }

    function handleBeforeUnload() {
      flushSave();
    }

    if (tgt === window) window.addEventListener("scroll", handleScroll, { passive: true });
    else if (tgt instanceof HTMLElement) tgt.addEventListener("scroll", handleScroll, { passive: true });

    window.addEventListener("popstate", handlePopState);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      flushSave();
      if (tgt === window) window.removeEventListener("scroll", handleScroll);
      else if (tgt instanceof HTMLElement) tgt.removeEventListener("scroll", handleScroll);
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, containerId, debounceMs]);
}