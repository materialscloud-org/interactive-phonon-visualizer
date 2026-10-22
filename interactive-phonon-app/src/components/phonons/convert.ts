import {
  connectBands,
  fromQEPhonon,
  labelHighSymmetryPoints,
} from "matsci-parse";

import { toVisualizerProps } from "./formats";
import { VisualizerProps } from "./formats";

/**
 * Convert Quantum ESPRESSO phonon files to visualizer props, in the browser.
 * The pw.x output is optional: if given, alat is read from it and checked
 * against the input; otherwise alat is derived from the input, which is
 * exact for QE >= 5.0.
 */
export async function convertQEPhonon(
  pwInput: string,
  matdynModes: string,
  pwOutput?: string,
): Promise<VisualizerProps> {
  const bands = fromQEPhonon({
    pwInput,
    matdynModes,
    pwOutput,
    connect: false,
  });

  // Labels decide where the path breaks, so name the q-points before
  // connecting bands. If symmetry detection fails, keep the generic labels.

  // TODO: maybe we should just have a singular function in matsci-parse for this...
  let labelled = bands;
  try {
    labelled = await labelHighSymmetryPoints(bands);
  } catch (error) {
    console.warn("High-symmetry labelling failed, using generic labels", error);
  }

  return toVisualizerProps(connectBands(labelled));
}
