import { Button, Spinner } from "react-bootstrap";

import { VisualizerProps } from "../interfaces";
import Visualizer from "./Visualizer";

import "./VisualizerPanel.scss";

const VisualizerPanel = ({
  callback,
  props,
}: {
  callback: () => void;
  props: VisualizerProps | null;
}) => {
  return (
    <>
      <Button onClick={callback}>
        <i className="bi bi-arrow-left" /> Back
      </Button>
      <h1 className="text-center mb-4 mt-3">
        {props ? (
          <span>Phonon dispersion: {props.title}</span>
        ) : (
          <span>
            Loading <Spinner />
          </span>
        )}
      </h1>
      {props && <Visualizer props={props} />}
    </>
  );
};

export default VisualizerPanel;
