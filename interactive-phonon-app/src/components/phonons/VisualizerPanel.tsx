import { Button, Spinner } from "react-bootstrap";

import { VisualizerProps } from "./interfaces";

import PhononVisualizer from "mc-react-phonon-visualizer";

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
      <div className="d-flex align-items-center justify-content-between mb-4 px-3">
        <Button onClick={callback}>
          <i className="bi bi-arrow-left" /> Back
        </Button>

        <h2 className="mb-0 text-center flex-grow-1">
          {props ? (
            <span>Phonon dispersion: {props.title}</span>
          ) : (
            <span>
              Loading <Spinner />
            </span>
          )}
        </h2>

        {/* spacer to keep title centered */}
        <div style={{ width: "90px" }} />
      </div>
      {props && <PhononVisualizer props={props} />}

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <Button
          className="mx-4"
          onClick={() => {
            if (!props) return;
            const blob = new Blob([JSON.stringify(props, null, 2)], {
              type: "application/json",
            });
            const url = URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = url;
            a.download = `interactive_phonon_vis.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            URL.revokeObjectURL(url);
          }}
        >
          <i className="bi bi-download" /> Download JSON
        </Button>
      </div>
    </>
  );
};

export default VisualizerPanel;
