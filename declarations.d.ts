declare module "weas" {
  export class Atoms {
    constructor(props: {
      symbols: string[];
      positions: number[][];
      cell: number[][];
    });
  }

  export class VFManager {
    addSetting(props: {
      origins: string;
      vectors: string;
      color: string;
      radius: number;
    }): void;
    show: boolean;
  }

  export class AtomsViewer {
    modelStyle: number;
    bondedAtoms: boolean;
    atomScale: number;
    bondManager: {
      hideLongBonds: boolean;
    };
    boundary: number[][];
    frameDuration: number;
    VFManager: VFManager;
    showCell: boolean;
    isPlaying: boolean;
    drawModels(): void;
    fromPhononMode(props: {
      atoms: Atoms;
      eigenvectors: number[][][];
      amplitude: number;
      factor: number;
      nframes: number;
      kpoint: number[];
      repeat: number[];
    }): void;
    tjs: {
      updateCameraAndControls(props: { direction: number[] }): void;
    };
    pause(): void;
    play(): void;
  }

  export class WEAS {
    constructor(props: {
      domElement: HTMLDivElement | null;
      guiConfig: object;
      viewerConfig: object;
    });
    avr: AtomsViewer;
    clear(): void;
    render(): void;
  }
}
