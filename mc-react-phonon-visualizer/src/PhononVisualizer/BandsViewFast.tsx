import { memo, useMemo, useRef, useState } from "react";
import { Card } from "react-bootstrap";

import Plotly, { PlotDatum, PlotMouseEvent } from "plotly.js-basic-dist-min";
import createPlotlyComponent from "react-plotly.js/factory";
const Plot = createPlotlyComponent(Plotly);

import { mergePlotlyFormats, mergePlotlyLayout } from "./utils.ts";
import { HighSymPoint, PlotState } from "./types.ts";

const plotMargin = {
  l: 55,
  r: 10,
  b: 25,
  t: 40,
};

const HOV_MARKER_STYLE = {
  size: 6,
  color: "blue",
  shadow: "0px 0px 0px 8px rgba(173,216,230,0.5)",
  borderRadius: "50%",
};

// Plotly data coordinates -> pixel coords
function plotlyDataToPixel(pt: PlotDatum, plotDiv: any) {
  if (!plotDiv?._fullLayout?._size) return null;
  const full = plotDiv._fullLayout;

  const bbox = plotDiv.getBoundingClientRect();
  const plotLeft = full.margin.l;
  const plotTop = full.margin.t;
  const plotWidth = bbox.width - full.margin.l - full.margin.r;
  const plotHeight = bbox.height - full.margin.t - full.margin.b;

  const xAxis = pt.xaxis || full.xaxis;
  const yAxis = pt.yaxis || full.yaxis;

  if (!xAxis?.range || !yAxis?.range) return null;

  // normalise values.
  const nx = (pt.x - xAxis.range[0]) / (xAxis.range[1] - xAxis.range[0]);
  const ny = (pt.y - yAxis.range[0]) / (yAxis.range[1] - yAxis.range[0]);

  const px = plotLeft + nx * plotWidth;
  // add the y margins as an offset again for some reason...
  const py = plotTop - ny * plotHeight - plotMargin.b - plotMargin.t;

  return { px, py };
}

// Utility: show/hide marker div
function showMarkerAt(
  marker: HTMLDivElement | null,
  coords: { px: number; py: number } | null
) {
  if (!marker) return;
  if (!coords) {
    marker.style.display = "none";
    return;
  }

  const { size, color, shadow, borderRadius } = HOV_MARKER_STYLE;

  marker.style.display = "block";
  marker.style.width = `${size}px`;
  marker.style.height = `${size}px`;
  marker.style.borderRadius = borderRadius;
  marker.style.background = color;
  marker.style.boxShadow = shadow;
  marker.style.transform = `translate(${coords.px - size / 2}px, ${
    coords.py - size / 2
  }px)`;
}

const BandsViewFast = ({
  distances,
  highSymPoints,
  eigenvalues,
  updateMode,
  plotlyLayoutFormat,
  plotlyTraceFormat,
  plotlyHoverTraceFormat,
  plotlySelectedTraceFormat,
}: {
  distances: number[];
  highSymPoints: HighSymPoint[];
  eigenvalues: number[][];
  updateMode: (event: PlotMouseEvent) => void;
  plotlyLayoutFormat?: Partial<Plotly.Layout>;
  plotlyTraceFormat?: Partial<Plotly.Data>[];
  plotlyHoverTraceFormat?: Partial<Plotly.Data>[];
  plotlySelectedTraceFormat?: Partial<Plotly.Data>[];
}) => {
  const [selectedPoint, setSelectedPoint] = useState<PlotDatum | null>(null);

  const plotRef = useRef<any>(null);
  const markerRef = useRef<HTMLDivElement>(null);

  const bands = useMemo(() => {
    return eigenvalues[0].map((_, colIndex) =>
      eigenvalues.map((row) => row[colIndex])
    );
  }, [eigenvalues]);

  const plotState: PlotState = useMemo(
    () => ({
      data: getPlotData(
        bands,
        distances,
        null,
        selectedPoint,
        plotlyTraceFormat,
        plotlyHoverTraceFormat,
        plotlySelectedTraceFormat
      ),
      layout: mergePlotlyLayout(
        getLayout(highSymPoints, distances, eigenvalues),
        plotlyLayoutFormat
      ),
      frames: [],
      config: {
        scrollZoom: false,
        displayModeBar: true,
        displaylogo: false,
        modeBarButtons: [["toImage", "resetScale2d"]],
      },
    }),
    [
      bands,
      distances,
      selectedPoint,
      plotlyTraceFormat,
      plotlyHoverTraceFormat,
      plotlySelectedTraceFormat,
      plotlyLayoutFormat,
    ]
  );

  // selection is managed by the plotly selection event below (rebuild the whole plot)
  const handleSelection = (event: PlotMouseEvent) => {
    updateMode(event);
    setSelectedPoint(event.points[0]);
  };

  // hover and unhover controlled by the overlayed div...
  const handleHover = (event: any) => {
    const pt = event.points?.[0]; // nearest point...
    if (!pt || !plotRef.current || !markerRef.current) return;
    const coords = plotlyDataToPixel(pt, plotRef.current);
    if (!coords) return;
    showMarkerAt(markerRef.current, coords);
  };

  const handleUnhover = () => {
    showMarkerAt(markerRef.current, null);
  };

  return (
    <Card>
      <Card.Header>Phonon band structure (select phonon)</Card.Header>
      <Card.Body style={{ position: "relative", height: "420px" }}>
        {/* plotly plot. */}
        <Plot
          data={plotState.data}
          layout={plotState.layout}
          config={plotState.config}
          onClick={handleSelection}
          onHover={handleHover}
          onUnhover={handleUnhover}
          onInitialized={(figure, plotDiv) => {
            plotRef.current = plotDiv;
          }}
          useResizeHandler
          style={{ width: "100%", height: "100%" }}
        />
        {/* render the hover - marker ontop the plotly plot */}
        <div
          ref={markerRef}
          style={{
            position: "absolute",
            pointerEvents: "none",
            willChange: "transform",
            display: "none",
          }}
        />
      </Card.Body>
    </Card>
  );
};

const getPlotData = (
  bands: number[][],
  distances: number[],
  hoveredPoint: PlotDatum | null,
  selectedPoint: PlotDatum | null,
  traceFormat?: Partial<Plotly.Data>[],
  hoverFormat?: Partial<Plotly.Data>[],
  selectedFormat?: Partial<Plotly.Data>[]
) => {
  return bands.map((band, bandIndex) => {
    const isSelected = (i: number) =>
      selectedPoint?.x === distances[i] && selectedPoint?.y === band[i];

    const baseTrace: Partial<Plotly.Data> = {
      x: distances,
      y: band,
      mode: "lines+markers",
      hoverinfo: "none",
      line: { color: "#1f77b4", width: 2 },
      marker: {
        size: band.map((_, i) => (isSelected(i) ? 10 : 0)),
        color: band.map((_, i) => (isSelected(i) ? "red" : "#1f77b4")),
        line: {
          width: band.map((_, i) => (isSelected(i) ? 1 : 0)),
          color: band.map((_, i) => (isSelected(i) ? "black" : "transparent")),
        },
      },
    };

    if (traceFormat || hoverFormat || selectedFormat) {
      return mergePlotlyFormats(
        baseTrace,
        bandIndex,
        null, // null on hoverSettings.
        selectedPoint,
        traceFormat,
        hoverFormat,
        selectedFormat
      );
    }

    return baseTrace;
  });
};

const getLayout = (
  highSymPoints: HighSymPoint[],
  distances: number[],
  eigenvalues: number[][]
): Partial<Plotly.Layout> => ({
  showlegend: false,
  hovermode: "closest",
  xaxis: {
    linewidth: 0,
    linecolor: "transparent",
    tickvals: highSymPoints.map(([index]) => distances[index]),
    ticktext: highSymPoints.map(([, label]) => label),
    range: [Math.min(...distances.flat()), Math.max(...distances.flat())],
  },
  yaxis: {
    title: "Frequency (cm-1)",
    linewidth: 0,
    linecolor: "transparent",
    ticklen: 5,
    range: [Math.min(...eigenvalues.flat()), Math.max(...eigenvalues.flat())],
  },
  // vertical lines at high-symmetry points
  shapes: highSymPoints.map(([index]) => ({
    type: "line",
    yref: "paper",
    x0: distances[index],
    y0: 0,
    x1: distances[index],
    y1: 1,
    line: {
      width: 0.5,
    },
  })),
  dragmode: "zoom",
  autosize: true,
  margin: plotMargin,
});

const MemoizedBandsViewFast = memo(BandsViewFast);
export default MemoizedBandsViewFast;
