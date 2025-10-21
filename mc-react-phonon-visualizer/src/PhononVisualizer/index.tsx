import { useCallback, useState } from "react";
import { Col, Container, Row } from "react-bootstrap";

import { PlotMouseEvent } from "plotly.js";

import ParametersContext from "./ParametersContext";
import { VisualizerProps } from "./types";
import useParameters from "./useParameters";

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
            <MemoizedBandsView
              distances={props.distances}
              highSymPoints={props.highsym_qpts}
              eigenvalues={props.eigenvalues}
              updateMode={updateMode}
              plotlyLayoutFormat={props.plotlyLayoutFormat}
              plotlyTraceFormat={props.plotlyTraceFormat}
              plotlyHoverTraceFormat={props.plotlyHoverTraceFormat}
              plotlySelectedTraceFormat={props.plotlySelectedTraceFormat}
            />
          </Col>
        </Row>
      </Container>
    </ParametersContext.Provider>
  );
};

export default PhononVisualizer;
