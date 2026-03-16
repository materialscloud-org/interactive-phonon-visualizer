import React, { useState, useEffect, useCallback } from "react";
import { Modal, Form, Row, Col, Button, Card } from "react-bootstrap";
import axios from "axios";
import { VisualizerProps } from "./interfaces";
import VisualizerPanel from "./VisualizerPanel";

// currently in the single docker solution this is on the same path.
const API_ROOT = "";

const PhononsPanel = ({
  aboutLinkHandler,
}: {
  aboutLinkHandler: CallableFunction;
}) => {
  const [visualizerProps, setVisualizerProps] =
    useState<VisualizerProps | null>(null);
  const [inputFormat, setInputFormat] = useState("Quantum ESPRESSO");

  const [errorMessage, setErrorMessage] = useState("");
  const [errorId, setErrorId] = useState(0);

  // Load result from searchParams if present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const resultId = params.get("result_id");
    if (resultId) {
      axios
        .get(`${API_ROOT}/results/${resultId}`)
        .then((res) => setVisualizerProps(res.data))
        .catch((err) => {
          console.error("Failed to load result:", err);
          setErrorMessage("⚠️ Error loading phonon calculation from url");
          setErrorId((prev) => prev + 1); // triggers CSS animation remount
        });
    }
  }, []);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const form = event.currentTarget;

      let data: VisualizerProps | null = null;

      try {
        if (form.id === "exampleForm") {
          const select = form.querySelector(
            "#exampleSelector",
          ) as HTMLSelectElement;
          if (!select?.value) return;

          const res = await axios.get(`/data/${select.value}.json`);
          data = res.data;
        } else if (form.id === "fileForm") {
          if (inputFormat === "PhononVis") {
            const file = (
              form.querySelector("#phonon_json_file") as HTMLInputElement
            )?.files?.[0];
            if (!file) return;

            const text = await file.text();
            data = JSON.parse(text);
          } else {
            const files = [
              "pw_input_file",
              "pw_output_file",
              "matdyn_file",
            ].map(
              (id) =>
                (form.querySelector(`#${id}`) as HTMLInputElement)?.files?.[0],
            );
            if (files.some((f) => !f))
              throw new Error("All files must be selected");

            const formData = new FormData();
            formData.append("pw_input_file", files[0]!);
            formData.append("pw_output_file", files[1]!);
            formData.append("matdyn_file", files[2]!);

            const res = await axios.post(
              `${API_ROOT}/convert_phonons`,
              formData,
            );
            data = res.data;
          }
        }

        if (data) {
          window.history.pushState({}, "", window.location.href); // append to history
          setVisualizerProps(data);
        }
      } catch (error: any) {
        console.error("Failed to fetch data:", error);

        setErrorMessage(
          "Parsing of input failed. Please check your files or try again.",
        );
        setErrorId((prev) => prev + 1);
      }
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
    <>
      {errorMessage && (
        <div
          key={errorId} // ensures remount on repeated errors
          className="fade-error"
        >
          {`⚠️ ${errorMessage}`}
        </div>
      )}
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
                      <Form.Label>
                        Quantum ESPRESSO <strong>pw.x</strong> input (SCF run)
                      </Form.Label>
                      <Form.Control type="file" id="pw_input_file" />
                    </Form.Group>
                    <Form.Group className="mb-2">
                      <Form.Label>
                        Quantum ESPRESSO <strong>pw.x</strong> output(SCF run)
                      </Form.Label>{" "}
                      <Form.Control type="file" id="pw_output_file" />
                    </Form.Group>
                    <Form.Group className="mb-2">
                      <Form.Label>
                        Quantum ESPRESSO <strong>matdyn.x</strong> displacement
                        modes output (see <strong>flvec</strong> input flag)
                      </Form.Label>
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
    </>
  );
};

export default PhononsPanel;
