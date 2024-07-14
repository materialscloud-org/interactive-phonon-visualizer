import { Col, Container, Row } from "react-bootstrap";

import ParametersContext from "./ParametersContext";
import { VisualizerProps } from "./types";
import useParameters from "./useParameters";

import "./Visualizer.css";

const Visualizer = ({ props }: { props: VisualizerProps }) => {
  const parameters = useParameters(props.repetitions);

  return (
    <ParametersContext.Provider value={parameters}>
      <Container fluid>
        <Row className="mb-xxl-4">
          <Col xxl="3" className="visualizer-panel">
            {/* controls panel */}
          </Col>
          <Col xxl="4" className="visualizer-panel">
            {/* cell view */}
          </Col>
          <Col xxl="5" className="visualizer-panel">
            {/* bands view */}
          </Col>
        </Row>
      </Container>
    </ParametersContext.Provider>
  );
};

export default Visualizer;
