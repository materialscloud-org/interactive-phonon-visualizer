import { Card, Table } from "react-bootstrap";

const LatticeParametersView = ({ lattice }: { lattice: number[][] }) => {
  return (
    <Card>
      <Card.Header>Lattice parameters (Å)</Card.Header>
      <Card.Body>
        <Table className="text-center mb-0" striped bordered>
          <tbody>
            {lattice.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  <td key={j}>{cell.toFixed(3)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  );
};

export default LatticeParametersView;
