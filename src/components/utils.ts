import merge from "lodash.merge";
import { PlotDatum } from "plotly.js";

// merging utils for passed Formats
export function mergePlotlyFormats(
  baseTrace: Partial<Plotly.Data>,
  bandIndex: number,
  hoveredPoint: PlotDatum | null,
  selectedPoint: PlotDatum | null,
  traceFormat: Partial<Plotly.Data>[] = [],
  hoverFormat: Partial<Plotly.Data>[] = [],
  selectedFormat: Partial<Plotly.Data>[] = []
) {
  // Merge normal formatting
  const merged = merge({}, baseTrace, traceFormat[bandIndex]);

  // Merge hover formatting
  if (hoveredPoint?.curveNumber === bandIndex) {
    merge(merged, hoverFormat[bandIndex]);
  }

  // Merge selected formatting
  if (selectedPoint?.curveNumber === bandIndex) {
    merge(merged, selectedFormat[bandIndex]);
  }

  return merged;
}

export function mergePlotlyLayout(
  baseLayout: Partial<Plotly.Layout>,
  layoutOverrides?: Partial<Plotly.Layout>
): Partial<Plotly.Layout> {
  return merge({}, baseLayout, layoutOverrides ?? {});
}
