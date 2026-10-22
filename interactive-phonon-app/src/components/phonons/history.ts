import { createHistoryStore } from "mc-react-library";

import { VisualizerProps } from "./formats";
import type { SharedSource } from "./share";

export interface HistoryEntry {
  id: string;
  fileName: string;
  format: string;
  date: string;
  phonons: VisualizerProps;
  // where the data was loaded from, for data opened via a share link
  source?: SharedSource;
}

const store = createHistoryStore("interactivephonon.phonons");

export const loadHistory = (): HistoryEntry[] => store.load();
export const removeFromHistory = (id: string): HistoryEntry[] =>
  store.remove(id);
export const clearHistory = (): HistoryEntry[] => store.clear();

const entryName = (phonons: VisualizerProps) =>
  phonons.formula || phonons.name || "phonons";

export const findBySource = ({
  url,
  format,
}: SharedSource): HistoryEntry | undefined =>
  loadHistory().find(
    (entry) => entry.source?.url === url && entry.source.format === format,
  );

/**
 * Phonon objects are large (tens to hundreds of kB) and localStorage is
 * limited to ~5 MB, so drop the oldest entries until the new one fits.
 */
export function addToHistory(
  phonons: VisualizerProps,
  format: string,
  source?: SharedSource,
): HistoryEntry[] {
  const now = new Date();
  const entry: HistoryEntry = {
    id: crypto.randomUUID(),
    fileName: entryName(phonons),
    format,
    date: now.toISOString(),
    phonons,
    source,
  };

  const entries = [entry, ...store.load()];
  while (entries.length > 0 && !store.save(entries)) entries.pop();
  // if even the new entry alone does not fit, storage is left unchanged
  return entries.length > 0 ? entries : store.load();
}
