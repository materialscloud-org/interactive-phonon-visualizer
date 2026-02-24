import React, { useState, useCallback } from "react";
import { Form, Row, Col, Button, Card } from "react-bootstrap";
import axios from "axios";
import { VisualizerProps } from "./interfaces";
import VisualizerPanel from "./VisualizerPanel";

const API_ROOT = "http://localhost:8000";

const PhononsPanel = ({
  aboutLinkHandler,
}: {
  aboutLinkHandler: CallableFunction;
}) => {
  const [visualizerProps, setVisualizerProps] =
    useState<VisualizerProps | null>(null);
  const [inputFormat, setInputFormat] = useState("Quantum ESPRESSO");
  const [fileLabels, setFileLabels] = useState([
    { id: "scfInput", text: "SCF pw.x input" },
    { id: "scfOutput", text: "SCF pw.x output" },
    { id: "matdynModes", text: "matdyn.modes" },
  ]);

  const handleFormatChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const format = event.target.value;
    setInputFormat(format);
    if (format === "Quantum ESPRESSO") {
      setFileLabels([
        { id: "scfInput", text: "SCF pw.x input" },
        { id: "scfOutput", text: "SCF pw.x output" },
        { id: "matdynModes", text: "matdyn.modes" },
      ]);
    } else {
      setFileLabels([{ id: "phononVisJson", text: "Visualizer JSON" }]);
    }
  };

  const getExampleData = async (name: string) => {
    try {
      const response = await axios.get(`/data/${name}.json`);
      return response.data;
    } catch (err) {
      console.error("Failed to fetch example:", err);
      return null;
    }
  };

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const form = event.currentTarget;

      // Example selection
      if (form.id === "exampleForm") {
        const select = form.querySelector("select");
        if (!select?.value) return;
        const result = await getExampleData(select.value);
        setVisualizerProps(result);
        return;
      }

      // File upload
      if (form.id === "fileForm") {
        if (inputFormat === "Quantum ESPRESSO") {
          const files = fileLabels.map(
            (label) =>
              (form.querySelector(`#${label.id}`) as HTMLInputElement)
                ?.files?.[0],
          );
          if (files.some((f) => !f))
            throw new Error("All files must be selected");

          const formData = new FormData();
          formData.append("pw_input_file", files[0]!);
          formData.append("pw_output_file", files[1]!);
          formData.append("matdyn_file", files[2]!);

          try {
            const response = await axios.post(
              `${API_ROOT}/convert_phonons`,
              formData,
            );
            setVisualizerProps(response.data);
          } catch (err) {
            console.error(err);
          }
        } else if (inputFormat === "PhononVis") {
          const fileInput = form.querySelector(
            `#${fileLabels[0].id}`,
          ) as HTMLInputElement;
          if (!fileInput?.files?.[0]) return;
          const text = await fileInput.files[0].text();
          setVisualizerProps(JSON.parse(text));
        }
      }
    },
    [inputFormat, fileLabels],
  );

  if (visualizerProps) {
    return (
      <VisualizerPanel
        callback={() => setVisualizerProps(null)}
        props={visualizerProps}
      />
    );
  }

  return (
    <Row className="g-4">
      {/* File Upload Card */}
      <Col xxl={6}>
        <Card>
          <Card.Header>Upload your files</Card.Header>
          <Card.Body>
            <Form id="fileForm" onSubmit={handleSubmit}>
              <Form.Label>Input format</Form.Label>
              <Form.Select
                onChange={handleFormatChange}
                value={inputFormat}
                className="mb-3"
              >
                <option>Quantum ESPRESSO</option>
                <option>PhononVis</option>
              </Form.Select>

              {fileLabels.map((label) => (
                <Form.Group key={label.id} className="mb-2">
                  <Form.Label>{label.text}</Form.Label>
                  <Form.Control type="file" id={label.id} />
                </Form.Group>
              ))}

              <Button type="submit">Calculate phonon dispersion</Button>
            </Form>
          </Card.Body>
        </Card>
      </Col>

      {/* Example Card */}
      <Col xxl={6}>
        <Card>
          <Card.Header>Pick an example</Card.Header>
          <Card.Body>
            <Form id="exampleForm" onSubmit={handleSubmit}>
              <Row className="align-items-end">
                <Col md="8">
                  <Form.Select id="exampleSelector">
                    <option value="">-- Select an example --</option>
                    <option value="Bi">Bi (2D)</option>
                    <option value="BN">BN (2D)</option>
                    <option value="graphene">C (graphene) (2D)</option>
                    <option value="PbI2">PbI₂ (2D)</option>
                    <option value="MoS2">MoS₂ (2D)</option>
                    <option value="PbTe">PbTe (2D)</option>
                    <option value="AgNO2">AgNO₂ (2D)</option>
                    <option value="BaTiO3">BaTiO₃ (3D)</option>
                  </Form.Select>
                </Col>
                <Col md="4">
                  <Button type="submit">Calculate</Button>
                </Col>
              </Row>
            </Form>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};

export default PhononsPanel;
