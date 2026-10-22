import { fromPhononVis, toPhononVis } from "matsci-parse";

type Vec3 = [number, number, number];

// PhononVis data (as matsci-parse's PhononVisData) plus a display title.
export interface VisualizerProps {
  title: string;
  name: string;
  natoms: number;
  lattice: Vec3[];
  atom_types: string[];
  atom_numbers: number[];
  formula: string;
  qpoints: Vec3[];
  repetitions: number[];
  atom_pos_car: Vec3[];
  atom_pos_red: Vec3[];
  eigenvalues: number[][];
  distances: number[];
  highsym_qpts: [number, string][];
  vectors: number[][][][][];
}

export const DEFAULT_FORMAT = "phononvis";

// matsci-parse ships no type declarations; these mirror its PhononBands
// and toPhononVis options.
type PhononBands = unknown;
interface PhononVisOptions {
  name?: string;
  repetitions?: number[];
}

type Reader = (doc: unknown) => {
  bands: PhononBands;
  opts?: PhononVisOptions;
};

const READERS: Record<string, Reader> = {
  // Lossless round trip (checked on all bundled examples), as long as the
  // display name and default supercell are carried over.
  [DEFAULT_FORMAT]: (doc) => {
    const data = doc as Partial<VisualizerProps> | null;
    return {
      bands: fromPhononVis(data),
      opts: { name: data?.name, repetitions: data?.repetitions },
    };
  },
};

/** PhononVis for the visualizer from matsci-parse PhononBands. */
export function toVisualizerProps(
  bands: PhononBands,
  opts: PhononVisOptions = {},
): VisualizerProps {
  const vis = toPhononVis(bands, opts);
  return { ...vis, title: vis.name };
}

/** Normalise a format name, e.g. "PhononVis" -> "phononvis". */
export const normaliseFormat = (format?: string | null): string =>
  (format || DEFAULT_FORMAT).toLowerCase();

/** Parse a JSON document in `format` with matsci-parse into PhononVis. */
export function readPhonons(doc: unknown, format?: string): VisualizerProps {
  const reader = READERS[normaliseFormat(format)];
  if (!reader) {
    throw new Error(
      `unsupported format '${format}' (supported: ${Object.keys(READERS).join(", ")})`,
    );
  }
  const { bands, opts } = reader(doc);
  return toVisualizerProps(bands, opts);
}

/** The PhononVis JSON written by both Download and Share. */
export const serializePhonons = (data: VisualizerProps): string =>
  JSON.stringify(data);
