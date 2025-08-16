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

  // general appearance overrides.
  plotlyLayoutFormat?: Partial<Plotly.Layout>;
  plotlyTraceFormat?: Partial<Plotly.Data>[];

  // hovered and selected overrides.
  plotlyHoverTraceFormat?: Partial<Plotly.Data>[];
  plotlySelectedTraceFormat?: Partial<Plotly.Data>[];
}

export interface PlotState {
  data: Partial<Plotly.Data>[];
  layout: Partial<Plotly.Layout>;
  frames: Partial<Plotly.Frame>[];
  config: Partial<Plotly.Config>;
}
