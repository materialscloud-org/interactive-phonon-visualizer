import React, { useState, useEffect, useCallback } from "react";
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
      if (form.id !== "fileForm") return;

      const files = ["pw_input_file", "pw_output_file", "matdyn_file"].map(
        (id) => (form.querySelector(`#${id}`) as HTMLInputElement)?.files?.[0],
      );

      if (files.some((f) => !f)) throw new Error("All files must be selected");

      const formData = new FormData();
      formData.append("pw_input_file", files[0]!);
      formData.append("pw_output_file", files[1]!);
      formData.append("matdyn_file", files[2]!);

      try {
        const response = await axios.post(
          `${API_ROOT}/convert_phonons`,
          formData,
        );
        const resultId = response.data.result_id;

        // Update URL with the short result ID
        const params = new URLSearchParams(window.location.search);
        params.set("result_id", resultId);
        window.history.replaceState({}, "", `?${params.toString()}`);

        // Load visualizer
        axios
          .get(`${API_ROOT}/results/${resultId}`)
          .then((res) => setVisualizerProps(res.data));
      } catch (err) {
        console.error(err);
      }
    },
    [],
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
        <Card>
          <Card.Header>Upload your files</Card.Header>
          <Card.Body>
            <Form id="fileForm" onSubmit={handleSubmit}>
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
              <Button type="submit">Calculate phonon dispersion</Button>
            </Form>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};

export default PhononsPanel;
