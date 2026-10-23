import { memo, useContext } from "react";

import Card from "./Card";
import { ResetIcon } from "./Icons";
import ParametersContext from "./ParametersContext";

import "./ControlsPanel.css";

const ControlsPanel = () => {
  const {
    nx,
    setNx,
    ny,
    setNy,
    nz,
    setNz,
    setCameraDirection,
    showCell,
    setShowCell,
    amplitude,
    setAmplitude,
    vectorLength,
    setVectorLength,
    showVectors,
    setShowVectors,
    speed,
    setSpeed,
    atomScale,
    setAtomScale,
  } = useContext(ParametersContext);

  const updateCellRepetitions = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const x = parseInt((event.target as HTMLFormElement).cellRepetitionX.value);
    const y = parseInt((event.target as HTMLFormElement).cellRepetitionY.value);
    const z = parseInt((event.target as HTMLFormElement).cellRepetitionZ.value);
    setNx(x);
    setNy(y);
    setNz(z);
  };

  const updateCamera = (event: React.MouseEvent<HTMLButtonElement>) => {
    const camera = event.currentTarget.value;
    switch (camera) {
      case "x":
        setCameraDirection("top");
        break;
      case "y":
        setCameraDirection("front");
        break;
      case "z":
        setCameraDirection("right");
        break;
      default:
        break;
    }
  };

  const toggleCell = (event: React.ChangeEvent<HTMLInputElement>) => {
    setShowCell(event.target.checked);
  };

  const handleAmplitudeTextInput = (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    const textInput = event.currentTarget.querySelector("#amplitudeText");
    if (!textInput) {
      throw new Error("Text input not found");
    }
    const inputValue = parseFloat((textInput as HTMLInputElement).value);
    updateAmplitude(inputValue);
  };

  const handleAmplitudeSliderInput = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (event.target.value === "" || isNaN(parseFloat(event.target.value))) {
      return;
    }
    const inputValue = parseFloat(event.target.value);
    updateAmplitude(inputValue);
  };

  const updateAmplitude = (inputValue: number) => {
    const value = inputValue < 0 ? 0 : inputValue > 1 ? 1 : inputValue;
    setAmplitude(value);
    const range = document.getElementById("amplitudeRange") as HTMLInputElement;
    const text = document.getElementById("amplitudeText") as HTMLInputElement;
    if (range && text) {
      range.value = String(value);
      text.value = String(value);
    }
  };

  const updateVectors = (event: React.ChangeEvent<HTMLInputElement>) => {
    setVectorLength(parseFloat(event.target.value));
  };

  const toggleVectors = (event: React.ChangeEvent<HTMLInputElement>) => {
    setShowVectors(event.target.checked);
  };

  const updateSpeed = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSpeed(parseFloat(event.target.value));
  };

  const updateAtomScale = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAtomScale(parseFloat(event.target.value));
  };

  return (
    <Card>
      <Card.Header>Settings</Card.Header>
      <Card.Body style={{ padding: "1rem" }}>
        <form onSubmit={updateCellRepetitions}>
          <div className="controls-group">
            <label className="controls-label">Repetitions</label>
            <div className="controls-row">
              <div id="cellRepetitions">
                <input
                  id="cellRepetitionX"
                  className="pv-input"
                  defaultValue={nx}
                  type="number"
                  min="1"
                />
                <input
                  id="cellRepetitionY"
                  className="pv-input"
                  defaultValue={ny}
                  type="number"
                  min="1"
                />
                <input
                  id="cellRepetitionZ"
                  className="pv-input"
                  defaultValue={nz}
                  type="number"
                  min="1"
                />
              </div>
              <button type="submit" className="pv-btn">
                <ResetIcon />
              </button>
            </div>
          </div>
        </form>
        <div id="cameraControls" className="controls-group controls-row">
          <label className="controls-label-inline">Camera</label>
          {["x", "y", "z"].map((axis) => (
            <button
              key={axis}
              type="button"
              className="pv-btn pv-btn-secondary"
              value={axis}
              onClick={updateCamera}
            >
              {axis.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="controls-group controls-row">
          <label className="controls-label-inline">Cell</label>
          <label className="pv-check">
            <input
              type="checkbox"
              defaultChecked={showCell}
              onChange={toggleCell}
            />
            On
          </label>
        </div>
        <form id="amplitudeControls" onSubmit={handleAmplitudeTextInput}>
          <div className="controls-group">
            <label className="controls-label">Amplitude</label>
            <div className="controls-row">
              <input
                id="amplitudeRange"
                className="pv-range controls-slider"
                type="range"
                min="0.01"
                max="1"
                step="0.01"
                defaultValue={amplitude}
                onChange={handleAmplitudeSliderInput}
              />
              <input
                id="amplitudeText"
                className="pv-input"
                type="number"
                min="0.01"
                max="1"
                step="0.001"
                defaultValue={amplitude}
              />
            </div>
          </div>
        </form>
        <div className="controls-group">
          <label className="controls-label">Vector length</label>
          <div className="controls-row">
            <input
              className="pv-range controls-slider"
              type="range"
              min="0.1"
              max="4"
              step="0.1"
              defaultValue={vectorLength}
              onChange={updateVectors}
            />
            <label className="pv-check">
              <input
                type="checkbox"
                defaultChecked={showVectors}
                onChange={toggleVectors}
              />
              On
            </label>
          </div>
        </div>
        <div className="controls-group">
          <label className="controls-label">Speed</label>
          <input
            className="pv-range controls-slider"
            type="range"
            min="0.1"
            max="1"
            step="0.01"
            defaultValue={speed}
            onChange={updateSpeed}
          />
        </div>
        <div className="controls-group">
          <label className="controls-label">Atom scale</label>
          <input
            className="pv-range controls-slider"
            type="range"
            min="0.01"
            max="2"
            step="0.01"
            defaultValue={atomScale}
            onChange={updateAtomScale}
          />
        </div>
      </Card.Body>
    </Card>
  );
};

const MemoizedControlsPanel = memo(ControlsPanel);

export default MemoizedControlsPanel;
