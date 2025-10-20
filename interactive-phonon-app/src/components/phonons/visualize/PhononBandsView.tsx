import { memo, useState } from "react";
import { Card } from "react-bootstrap";
import Plot from "react-plotly.js";

import { PlotDatum, PlotMouseEvent } from "plotly.js";

import { HighSymPoint } from "../interfaces";

const PhononBandsView = ({
  distances,
  highSymPoints,
  eigenvalues,
  updateMode,
}: {
  distances: number[];
  highSymPoints: HighSymPoint[];
  eigenvalues: number[][];
  updateMode: (event: PlotMouseEvent) => void;
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<PlotDatum | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<PlotDatum | null>(null);

  const bands = eigenvalues[0].map((_, colIndex) =>
    eigenvalues.map((row) => row[colIndex])
  );

  const handleSelection = (event: PlotMouseEvent) => {
    updateMode(event);
    setSelectedPoint(event.points[0]);
  };

  return (
    <Card>
      <Card.Header>Phonon band structure (select phonon)</Card.Header>
      <Card.Body>
        <Plot
          data={bands.map((band, index) => ({
            x: distances,
            y: band,
            mode: "lines+markers",
            hoverinfo: "none",
            line: {
              color: "#1f77b4",
              width: hoveredPoint?.curveNumber === index ? 4 : 2,
            },
            marker: {
              // size should be 2 if hovered on, 4 if selected, 0 otherwise; hover/selection is determined by both x and y, no border
              size: band.map((_, index) =>
                selectedPoint?.x === distances[index] &&
                selectedPoint?.y === band[index]
                  ? 10
                  : hoveredPoint?.x === distances[index] &&
                    hoveredPoint?.y === band[index]
                  ? 14
                  : 0
              ),
              color: band.map((_, index) =>
                selectedPoint?.x === distances[index] &&
                selectedPoint?.y === band[index]
                  ? "red"
                  : hoveredPoint?.x === distances[index] &&
                    hoveredPoint?.y === band[index]
                  ? "blue"
                  : "#1f77b4"
              ),
              // add opaque border around marker of width 1 (black) if selected, width 10 (lightblue) if hovered on
              line: {
                width: band.map((_, index) =>
                  selectedPoint?.x === distances[index] &&
                  selectedPoint?.y === band[index]
                    ? 1
                    : hoveredPoint?.x === distances[index] &&
                      hoveredPoint?.y === band[index]
                    ? 8
                    : 0
                ),
                color: band.map((_, index) =>
                  selectedPoint?.x === distances[index] &&
                  selectedPoint?.y === band[index]
                    ? "black"
                    : hoveredPoint?.x === distances[index] &&
                      hoveredPoint?.y === band[index]
                    ? "lightblue"
                    : "transparent"
                ),
              },
              opacity: 1,
            },
          }))}
          layout={{
            showlegend: false,
            hovermode: "closest",
            xaxis: {
              linewidth: 0,
              linecolor: "transparent",
              tickvals: highSymPoints.map(([index]) => distances[index]),
              ticktext: highSymPoints.map(([, label]) => label),
              range: [
                Math.min(...distances.flat()),
                Math.max(...distances.flat()),
              ],
            },
            yaxis: {
              title: "Frequency (cm-1)",
              linewidth: 0,
              linecolor: "transparent",
              ticklen: 5,
              range: [
                Math.min(...eigenvalues.flat()),
                Math.max(...eigenvalues.flat()),
              ],
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
          }}
          onClick={handleSelection}
          onHover={(event) => {
            setHoveredPoint(event.points[0]);
          }}
          onUnhover={() => {
            setHoveredPoint(null);
          }}
          config={{
            scrollZoom: false,
            displayModeBar: true,
            displaylogo: false,
            modeBarButtons: [["toImage", "resetScale2d"]],
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

const MemoizedPhononBandsView = memo(PhononBandsView);

export default MemoizedPhononBandsView;
