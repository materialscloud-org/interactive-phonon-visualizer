import { useCallback, useState } from "react";
import { Col, Container, Row } from "react-bootstrap";

import { PlotMouseEvent } from "plotly.js";

import ParametersContext from "./ParametersContext";
import { VisualizerProps } from "./types";
import useParameters from "./useParameters";

import MemoizedBandsViewFast from "./BandsViewFast";
import MemoizedBandsView from "./BandsView";

import CellView from "./CellView";
import MemoizedControlsPanel from "./ControlsPanel";

import "./PhononVisualizer.scss";

const PhononVisualizer = ({ props }: { props: VisualizerProps }) => {
  const parameters = useParameters(props.repetitions);
  const [mode, setMode] = useState<number[]>([0, 0]);

  const updateMode = useCallback(
    (event: PlotMouseEvent) => {
      const q = props.distances.indexOf(event.points[0].x as number);
      const e = props.eigenvalues[q].indexOf(event.points[0].y as number);
      setMode([q, e]);
    },
    [props]
  );

  const bandsProps = {
    distances: props.distances,
    highSymPoints: props.highsym_qpts,
    eigenvalues: props.eigenvalues,
    updateMode,
    plotlyLayoutFormat: props.plotlyLayoutFormat,
    plotlyTraceFormat: props.plotlyTraceFormat,
    plotlyHoverTraceFormat: props.plotlyHoverTraceFormat,
    plotlySelectedTraceFormat: props.plotlySelectedTraceFormat,
  };

  return (
    <ParametersContext.Provider value={parameters}>
      <Container fluid>
        <Row className="mb-xxl-4 g-2">
          <Col lg="3" className="visualizer-panel">
            <MemoizedControlsPanel />
          </Col>
          <Col lg="4" className="visualizer-panel">
            <CellView props={props} mode={mode} />
          </Col>
          <Col lg="5" className="visualizer-panel">
            {props.fastMode ? (
              <MemoizedBandsViewFast {...bandsProps} /> // fastmode
            ) : (
              <MemoizedBandsView {...bandsProps} /> // default
            )}
          </Col>
        </Row>
      </Container>
    </ParametersContext.Provider>
  );
};

export default PhononVisualizer;
