import { Button, Col, Form, Row } from "react-bootstrap";

const ExampleSelector = ({
  formHandler,
}: {
  formHandler: React.FormEventHandler;
}) => {
  const options = [
    { value: "Bi", label: "Bi (2D)" },
    { value: "BN", label: "BN (2D)" },
    { value: "C", label: "C (graphene) (2D)" },
    { value: "PbI2", label: "PbI₂ (2D)" },
    { value: "MoS2-MoS2", label: "MoS₂ (2D)" },
    { value: "PbTe", label: "PbTe (2D)" },
    { value: "AgNO2", label: "AgNO₂ (2D)" },
    { value: "BaTiO3", label: "BaTiO₃ (3D)" },
  ];
  return (
    <Form id="exampleForm" onSubmit={formHandler}>
      <Row>
        <Col>
          <Form.Label htmlFor="exampleSelector">Example</Form.Label>
        </Col>
        <Col md="8">
          <Form.Select id="exampleSelector">
            {options.map((option, index) => (
              <option key={index} value={option.value}>
                {option.label}
              </option>
            ))}
          </Form.Select>
        </Col>
      </Row>

      <Button type="submit" className="mb-2">
        Calculate phonon dispersion
      </Button>
    </Form>
  );
};

export default ExampleSelector;
