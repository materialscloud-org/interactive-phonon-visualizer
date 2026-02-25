import React, { useState, useEffect, useCallback } from "react";
import { Form, Row, Col, Button, Card } from "react-bootstrap";
import axios from "axios";
import { VisualizerProps } from "./interfaces";
import VisualizerPanel from "./VisualizerPanel";

// Move to env variable.
const API_ROOT = "http://localhost:8000";

const PhononsPanel = ({
  aboutLinkHandler,
}: {
  aboutLinkHandler: CallableFunction;
}) => {
  const [visualizerProps, setVisualizerProps] =
    useState<VisualizerProps | null>(null);
  const [inputFormat, setInputFormat] = useState("Quantum ESPRESSO");

  // Load result from searchParams if present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const resultId = params.get("result_id");
    if (resultId) {
      axios
        .get(`${API_ROOT}/results/${resultId}`)
        .then((res) => setVisualizerProps(res.data))
        .catch((err) => console.error("Failed to load result:", err));
    }
  }, []);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const form = event.currentTarget;

      let data: VisualizerProps | null = null;

      // example
      if (form.id === "exampleForm") {
        const select = form.querySelector(
          "#exampleSelector",
        ) as HTMLSelectElement;
        if (!select?.value) return;
        const res = await axios.get(`/data/${select.value}.json`);
        data = res.data;
      } else if (form.id === "fileForm") {
        // phonon Visualiser form
        if (inputFormat === "PhononVis") {
          const file = (
            form.querySelector("#phonon_json_file") as HTMLInputElement
          )?.files?.[0];
          if (!file) return;
          const text = await file.text();
          data = JSON.parse(text);
        } else {
          // Q.E input file format.
          const files = ["pw_input_file", "pw_output_file", "matdyn_file"].map(
            (id) =>
              (form.querySelector(`#${id}`) as HTMLInputElement)?.files?.[0],
          );
          if (files.some((f) => !f))
            throw new Error("All files must be selected");

          const formData = new FormData();
          formData.append("pw_input_file", files[0]!);
          formData.append("pw_output_file", files[1]!);
          formData.append("matdyn_file", files[2]!);

          const res = await axios.post(`${API_ROOT}/convert_phonons`, formData);
          const resultId = res.data.result_id;

          // Update URL
          const params = new URLSearchParams(window.location.search);
          params.set("result_id", resultId);
          window.history.replaceState({}, "", `?${params.toString()}`);

          // Load data from server
          const fetchRes = await axios.get(`${API_ROOT}/results/${resultId}`);
          data = fetchRes.data;
        }
      }

      if (data) setVisualizerProps(data);
    },
    [inputFormat],
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
      <Col xxl={6}>
        {/* Upload Card */}
        <Card>
          <Card.Header>Upload your files</Card.Header>
          <Card.Body>
            <Form.Group className="mb-3">
              {/* QE vs Phonon vis form */}
              <Form.Label>Input format</Form.Label>
              <Form.Select
                value={inputFormat}
                onChange={(e) => setInputFormat(e.target.value)}
              >
                <option>Quantum ESPRESSO</option>
                <option>PhononVis</option>
              </Form.Select>
            </Form.Group>
            {/* QE form */}
            <Form id="fileForm" onSubmit={handleSubmit}>
              {inputFormat === "Quantum ESPRESSO" ? (
                <>
                  <Form.Group className="mb-2">
                    <Form.Label>SCF pw.x input</Form.Label>
                    <Form.Control type="file" id="pw_input_file" />
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Label>SCF pw.x output</Form.Label>
                    <Form.Control type="file" id="pw_output_file" />
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Label>matdyn.modes</Form.Label>
                    <Form.Control type="file" id="matdyn_file" />
                  </Form.Group>
                </>
              ) : (
                // Json file form
                <Form.Group className="mb-2">
                  <Form.Label>JSON from phonon-web-tools</Form.Label>
                  <Form.Control type="file" id="phonon_json_file" />
                </Form.Group>
              )}
              <Button type="submit">Calculate phonon dispersion</Button>
            </Form>
          </Card.Body>
        </Card>
      </Col>

      {/* Example Card */}
      <Col xxl={6}>
        <Card>
          <Card.Header>Try an example</Card.Header>
          <Card.Body>
            <Form id="exampleForm" onSubmit={handleSubmit}>
              <Form.Group className="mb-2">
                <Form.Label>Example</Form.Label>
                <Form.Select id="exampleSelector">
                  <option value="Bi">Bi (2D)</option>
                  <option value="BN">BN (2D)</option>
                  <option value="graphene">C (graphene) (2D)</option>
                  <option value="PbI2">PbI₂ (2D)</option>
                  <option value="MoS2">MoS₂ (2D)</option>
                  <option value="PbTe">PbTe (2D)</option>
                  <option value="AgNO2">AgNO₂ (2D)</option>
                  <option value="BaTiO3">BaTiO₃ (3D)</option>
                </Form.Select>
              </Form.Group>

              <Button type="submit">Calculate phonon dispersion</Button>
            </Form>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};

export default PhononsPanel;
