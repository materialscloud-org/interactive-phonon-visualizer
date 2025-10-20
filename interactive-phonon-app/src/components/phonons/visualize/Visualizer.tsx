import { useCallback, useState } from "react";
import { Col, Container, Row } from "react-bootstrap";

import { PlotMouseEvent } from "plotly.js";

import { VisualizerProps } from "../interfaces";
import AtomicPositionsView from "./AtomicPositionsView";
import CellView from "./CellView";
import LatticeParametersView from "./LatticeParametersView";
import ParameterControls from "./ParameterControls";
import ParametersContext from "./ParametersContext";
import PhononBandsView from "./PhononBandsView";
import useParameters from "./useParameters";

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
            <ParameterControls />
          </Col>
          <Col xxl="4" className="visualizer-panel">
            <CellView props={props} mode={mode} />
          </Col>
          <Col xxl="5" className="visualizer-panel">
            <PhononBandsView
              distances={props.distances}
              highSymPoints={props.highsym_qpts}
              eigenvalues={props.eigenvalues}
              updateMode={updateMode}
            />
          </Col>
        </Row>
        <Row>
          <Col xxl="6" className="visualizer-panel">
            <LatticeParametersView lattice={props.lattice} />
          </Col>
          <Col xxl="6" className="visualizer-panel">
            <AtomicPositionsView
              types={props.atom_types}
              positions={props.atom_pos_car}
            />
          </Col>
        </Row>
      </Container>
    </ParametersContext.Provider>
  );
};

export default Visualizer;
