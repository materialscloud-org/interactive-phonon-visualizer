export type LatticeVector = [number, number, number];
export type Vector = [number, number, number];
export type HighSymPoint = [number, string];

export interface VisualizerProps {
  title: string;
  name: string;
  natoms: number;
  lattice: LatticeVector[];
  atom_types: string[];
  atom_numbers: number[];
  formula: string;
  qpoints: Vector[];
  repetitions: number[];
  atom_pos_car: Vector[];
  atom_pos_red: Vector[];
  eigenvalues: number[][];
  distances: number[];
  highsym_qpts: HighSymPoint[];
  vectors: number[][][][][];
}
