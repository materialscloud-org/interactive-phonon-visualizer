import { useCallback, useState } from "react";
import { Col, Container, Row } from "react-bootstrap";

import { PlotMouseEvent } from "plotly.js";

import ParametersContext from "./ParametersContext";
import { VisualizerProps } from "./types";
import useParameters from "./useParameters";

import CellView from "./CellView";
import MemoizedParameterControls from "./ParameterControls";
import MemoizedPhononBandsView from "./PhononBandsView";

import "./Visualizer.css";

const Visualizer = ({ props }: { props: VisualizerProps }) => {
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
        <Row className="mb-xxl-4">
          <Col xxl="3" className="visualizer-panel">
            <MemoizedParameterControls />
          </Col>
          <Col xxl="4" className="visualizer-panel">
            <CellView props={props} mode={mode} />
          </Col>
          <Col xxl="5" className="visualizer-panel">
            <MemoizedPhononBandsView
              distances={props.distances}
              highSymPoints={props.highsym_qpts}
              eigenvalues={props.eigenvalues}
              updateMode={updateMode}
            />
          </Col>
        </Row>
      </Container>
    </ParametersContext.Provider>
  );
};

export default Visualizer;
