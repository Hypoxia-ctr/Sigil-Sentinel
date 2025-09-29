import type { AuditQueueItem } from "../types";

const KEY = "sigil-audit-queue";

export function loadAuditQueue(): AuditQueueItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as AuditQueueItem[];
    // Sort by timestamp descending to show newest first
    if (Array.isArray(arr)) {
        return arr.sort((a, b) => b.timestamp - a.timestamp);
    }
    return [];
  } catch {
    return [];
  }
}

export function saveAuditQueue(items: AuditQueueItem[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch (e) {
    console.error("Failed to save audit queue to localStorage", e);
  }
}

export function addToAuditQueue(item: AuditQueueItem): AuditQueueItem[] {
  const existing = loadAuditQueue();
  // Prevent duplicates based on ID
  const filtered = existing.filter(i => i.id !== item.id);
  const updated = [item, ...filtered];
  saveAuditQueue(updated);
  return updated;
}

export function removeFromAuditQueue(predicate: (x: AuditQueueItem) => boolean): AuditQueueItem[] {
  const existing = loadAuditQueue();
  const updated = existing.filter((x) => !predicate(x));
  saveAuditQueue(updated);
  return updated;
}

export function updateInAuditQueue(timestamp: number, updates: Partial<Omit<AuditQueueItem, 'timestamp' | 'id'>>): AuditQueueItem[] {
  const existing = loadAuditQueue();
  const updated = existing.map(item =>
    item.timestamp === timestamp ? { ...item, ...updates } : item
  );
  saveAuditQueue(updated);
  return updated;
}


export function clearAuditQueue(): void {
  saveAuditQueue([]);
}