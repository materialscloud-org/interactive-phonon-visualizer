import { memo, useEffect, useState, useMemo } from "react";
import { Card } from "react-bootstrap";

import Plotly from "plotly.js-basic-dist-min";
import createPlotlyComponent from "react-plotly.js/factory";

const Plot = createPlotlyComponent(Plotly);

import { PlotDatum, PlotMouseEvent } from "plotly.js-basic-dist-min";
import { mergePlotlyFormats, mergePlotlyLayout } from "./utils.ts";

import { HighSymPoint, PlotState } from "./types.ts";

const BandsView = ({
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
  const [hoveredPoint, setHoveredPoint] = useState<PlotDatum | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<PlotDatum | null>(null);

  // memo the bands for performance.
  const bands = useMemo(() => {
    return eigenvalues[0].map((_, colIndex) =>
      eigenvalues.map((row) => row[colIndex])
    );
  }, [eigenvalues]);

  const [plotState, setPlotState] = useState<PlotState>({
    data: getPlotData(
      bands,
      distances,
      hoveredPoint,
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
  });

  useEffect(() => {
    setPlotState((oldState) => ({
      ...oldState,
      data: getPlotData(
        bands,
        distances,
        hoveredPoint,
        selectedPoint,
        plotlyTraceFormat,
        plotlyHoverTraceFormat,
        plotlySelectedTraceFormat
      ),
      // Important; dont update layout here.
    }));
  }, [
    hoveredPoint,
    selectedPoint,
    plotlyTraceFormat,
    plotlyHoverTraceFormat,
    plotlySelectedTraceFormat,
  ]);

  const handleSelection = (event: PlotMouseEvent) => {
    updateMode(event);
    setSelectedPoint(event.points[0]);
  };

  return (
    <Card>
      <Card.Header>Phonon band structure (select phonon)</Card.Header>
      <Card.Body>
        <Plot
          data={plotState.data}
          layout={plotState.layout}
          config={plotState.config}
          onClick={handleSelection}
          onHover={(event) => {
            setHoveredPoint(event.points[0]);
          }}
          onUnhover={() => {
            setHoveredPoint(null);
          }}
          useResizeHandler={true}
          style={{
            width: "100%",
            height: "100%",
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
    const isHovered = (i: number) =>
      hoveredPoint?.x === distances[i] && hoveredPoint?.y === band[i];
    const isSelected = (i: number) =>
      selectedPoint?.x === distances[i] && selectedPoint?.y === band[i];

    const baseTrace: Partial<Plotly.Data> = {
      x: distances,
      y: band,
      mode: "lines+markers",
      hoverinfo: "none",
      line: {
        color: "#1f77b4",
        width: hoveredPoint?.curveNumber === bandIndex ? 4 : 2,
      },
      marker: {
        size: band.map((_, i) => (isSelected(i) ? 10 : isHovered(i) ? 14 : 0)),
        color: band.map((_, i) =>
          isSelected(i) ? "red" : isHovered(i) ? "blue" : "#1f77b4"
        ),
        line: {
          width: band.map((_, i) => (isSelected(i) ? 1 : isHovered(i) ? 8 : 0)),
          color: band.map((_, i) =>
            isSelected(i) ? "black" : isHovered(i) ? "lightblue" : "transparent"
          ),
        },
      },
    };

    // Only merge formats if at least one format array is provided
    if (traceFormat || hoverFormat || selectedFormat) {
      return mergePlotlyFormats(
        baseTrace,
        bandIndex,
        hoveredPoint,
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
  margin: {
    l: 55,
    r: 10,
    b: 25,
    t: 40,
  },
});

const MemoizedBandsView = memo(BandsView);

export default MemoizedBandsView;
