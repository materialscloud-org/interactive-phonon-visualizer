import { memo, useContext } from "react";
import { Button, Card, Col, Form, Row } from "react-bootstrap";

import ParametersContext from "./ParametersContext";

const ParameterControls = () => {
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
    setIsAnimated,
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
        setCameraDirection([1, 0, 0]);
        break;
      case "y":
        setCameraDirection([0, 1, 0]);
        break;
      case "z":
        setCameraDirection([0, 0, 1]);
        break;
      default:
        break;
    }
  };

  const toggleCell = (event: React.ChangeEvent<HTMLInputElement>) => {
    setShowCell(event.target.checked);
  };

  const handleAmplitudeTextInput = (
    event: React.FormEvent<HTMLFormElement>
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
    event: React.ChangeEvent<HTMLInputElement>
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

  const toggleAnimation = () => {
    setIsAnimated((prevState) => !prevState);
  };

  return (
    <Card>
      <Card.Header>Settings</Card.Header>
      <Card.Body>
        <Form onSubmit={updateCellRepetitions} className="mb-3">
          <Form.Group as={Row}>
            <Form.Label>Repetitions</Form.Label>
            <Col xs="8" id="cellRepetitions">
              <Form.Control
                id="cellRepetitionX"
                defaultValue={nx}
                type="number"
                min="1"
              />
              <Form.Control
                id="cellRepetitionY"
                defaultValue={ny}
                type="number"
                min="1"
              />
              <Form.Control
                id="cellRepetitionZ"
                defaultValue={nz}
                type="number"
                min="1"
              />
            </Col>
            <Col>
              <Button type="submit">
                <i className="bi bi-repeat" />
              </Button>
            </Col>
          </Form.Group>
        </Form>
        <Form>
          <Form.Group as={Row} id="cameraControls">
            <Col xs="3">
              <Form.Label>Camera</Form.Label>
            </Col>
            <Col>
              <Button variant="secondary" value="x" onClick={updateCamera}>
                X
              </Button>
              <Button variant="secondary" value="y" onClick={updateCamera}>
                Y
              </Button>
              <Button variant="secondary" value="z" onClick={updateCamera}>
                Z
              </Button>
            </Col>
          </Form.Group>
          <Form.Group as={Row}>
            <Col xs="3">
              <Form.Label>Cell</Form.Label>
            </Col>
            <Col xs="1">
              <Form.Check
                label="On"
                defaultChecked={showCell}
                onChange={toggleCell}
              />
            </Col>
          </Form.Group>
        </Form>
        <Form id="amplitudeControls" onSubmit={handleAmplitudeTextInput}>
          <Form.Group as={Row}>
            <Form.Label>Amplitude</Form.Label>
            <Col xs="8">
              <Form.Range
                id="amplitudeRange"
                min="0"
                max="1"
                step="0.01"
                defaultValue={amplitude}
                onChange={handleAmplitudeSliderInput}
              />
            </Col>
            <Col>
              <Form.Control
                id="amplitudeText"
                type="number"
                min="0.01"
                max="1"
                step="0.001"
                defaultValue={amplitude}
              />
            </Col>
          </Form.Group>
        </Form>
        <Form>
          <Form.Group as={Row}>
            <Form.Label>Vectors</Form.Label>
            <Col xs="8">
              <Form.Range
                min="1"
                max="5"
                step="0.1"
                defaultValue={vectorLength}
                onChange={updateVectors}
              />
            </Col>
            <Col>
              <Form.Check
                label="On"
                defaultChecked={showVectors}
                onChange={toggleVectors}
              />
            </Col>
          </Form.Group>
          <Form.Group as={Row}>
            <Form.Label>Speed</Form.Label>
            <Col xs="8">
              <Form.Range
                min="0.1"
                max="1"
                step="0.01"
                defaultValue={speed}
                onChange={updateSpeed}
              />
            </Col>
            <Col>
              <Button onClick={toggleAnimation}>Pause</Button>
            </Col>
          </Form.Group>
        </Form>
      </Card.Body>
    </Card>
  );
};

const MemoizedParameterControls = memo(ParameterControls);

export default MemoizedParameterControls;
