import { useEffect } from "react";

import ScrollToTopButton from "../common/scroll/ScrollToTopButton";

import "./AboutPanel.scss";

const AboutPanel = ({ focusSection }: { focusSection: string | null }) => {
  useEffect(() => {
    const section = document.getElementById(focusSection || "");
    section && section.scrollIntoView({ behavior: "smooth" });
  }, [focusSection]);

  return (
    <>
      <section>
        <h2 id="aboutOverview">Overview</h2>
        <p>
          The phonon visualizer can visualize phonon dispersions computed with
          an external software and display the the normal modes of the lattice
          vibrations, i.e., the eigenstates.
        </p>
        <p>With this tool, you can:</p>
        <ul>
          <li>
            visualize the phonon dispersion along a path in the Brillouin Zone
          </li>
          <li>
            visualize interactively a supercell of the crystal structure, where
            atoms oscillate according to the phonon normal modes of a point
            selected on the phonon dispersion plot
          </li>
          <li>
            show the vectors of oscillation and change oscillation frequency and
            amplitude
          </li>
        </ul>
      </section>
      <hr />
      <section>
        <h2 id="aboutSupported">Supported input files</h2>
        <p>
          The Materials Cloud interactive phonon visualizer supports the
          following input files:
        </p>
        <h3>Quantum ESPRESSO</h3>
        <p>
          This tool requires 2 Quantum ESPRESSO files (.scf and .modes) passed
          as an input to show the phonon dispersions. More information on these
          files is given below.
        </p>
        <ol>
          <li>
            <strong>.scf file</strong>
            <p>The usual input file of the Quantum ESPRESSO PW code.</p>
            <p>Minimal example:</p>
            <pre>
              <code>
                {`
&system
  ibrav = 4,
  celldm(1) = 4.5978084723,
  celldm(3) = 2.6099390769,
  nat = 2,
  ntyp = 1,
  /&end
ATOMIC_SPECIES
  C   12.0107 C.pw-mt_fhi.UPF
  ATOMIC_POSITIONS { crystal }
  C   0.00000000000000 0.00000000000000 0.00000000000000
  C   0.66666666666666 0.33333333333333 0.00000000000000
  `.trim()}
              </code>
            </pre>
          </li>
          <li>
            <strong>SCF pw.x output file</strong>
            <p>
              The output file of pw.x is used to get the value of{" "}
              <code>alat</code>, the lattice parameter, as defined by Quantum
              ESPRESSO. Unfortunately, its value cannot always be obtained from
              the input only (e.g. in the case of <code>ibrav=0</code> it is not
              explicitly specified), and the way it is obtained depends on the
              version of Quantum ESPRESSO (in 6.x versions it is the length of
              the first lattice vector, but it used to be user-defined in
              earlier versions). This is essential to perform the correct unit
              conversions, as the q-points are written in units of{" "}
              <code>2 * pi / alat</code> in the <code>matdyn.modes</code> file
              (see below).
            </p>
          </li>
          <li>
            <strong>matdyn.modes file</strong>
            <p>
              It is one of the files produced by the <strong>matdyn.x</strong>{" "}
              code of Quantum ESPRESSO (its name can be changed using the input
              flag "flvec"). This is obtained at the end of the following
              "workflow": ph.x on a certain grid {"=>"} q2r.x to get force
              constants {"=>"} matdyn.x to get the phonons on arbitrary grid
            </p>
          </li>
        </ol>
        {/* TODO Add link to local data (maybe fetched data?) */}
        <p>
          Download example files for{" "}
          <b>
            cubic BaTiO<sub>3</sub>
          </b>{" "}
          <a href="">here</a>.
        </p>
        <hr />
        <h3>PhononVis JSON</h3>
        <p>
          Internally, the visualizer uses a <code>.json</code> file to show the
          phonon dispersions and animations. Its fields include:
        </p>
        <pre>
          <code>
            {`
name:             name of the material that will be displayed on the website (string)
natoms:           number of atoms (integer)
lattice:          lattice vectors (3x3 float array), in Angstroms
atom_types:       atom type   for each atom in the system (array strings)
atom_numbers:     atom number for each atom in the system (array integers)
formula:          chemical formula (string)
repetitions:      default value for the repetitions of the unit-cell in the visualizer (array 3 integers)
atom_pos_car:     atomic positions in cartesian coordinates (natoms x 3 float array), in , Angstrom
atom_pos_red:     atomic positions in reduced coordinates (natoms x 3 float array)
highsym_qpts:     list of high symmetry qpoints (number of high symmetry q-points x 3 float arraay)
qpoints:          list of q-point in the reciprocal space (Nq x 3 float array). They are in reduced
                  coordinates. (fractions of reciprocal lattice vectors), so are high-symmetry qpoints
distances:        list distances between the qpoints (Nq float array)
eigenvalues:      eigenvalues in units of cm-1 (Nq x Nphonons with Nphonons = natoms x 3).
vectors:          eigenvectors (Nq x Nphonons x Natoms x 3 x 2) They are, more rigorously speaking,
                  normalized phonon displacements i.e. the eigenvectors divided by the square root
                  of the mass, then normalized on the unit-cell.
                  For each q point (Nq), for each phonon (Nphonons), a normalized phonon displacement
                  is a vector containing, for each atom (Natoms), the x, y, and z displacements (x3)
                  which are complex numbers (x2).
  `.trim()}
          </code>
        </pre>
        <p>
          You can provide your own custom file for this purpose. For example:
        </p>
        <pre>
          <code>
            {`
{
  "distances": [0, 0.004591723543957549, ...., 0.25105661898056153],
  "natoms": 2,
  "vectors": [[[[[0.704604, 0.0], [0.059344, 0.0], [-0.003418, 0.0]], [[0.704604, 0.0], [0.059344, 0.0], [-0.003418, 0.0]]] , ..., [[0.298964, 0.0], [-0.640797, 0.0], [0.0, 0.0]]]]],
  "name": "Graphene",
  "eigenvalues": [[-6.2e-05, -4.3e-05, -3e-05, 911.740895, 1604.085116, 1604.085116], ...., [1604.085116, -4.3e-05, 911.740895, -3e-05, -6.2e-05, 1604.085116]],
  "repetitions": [3, 3, 3],
  "qpoints": [[0.0, 0.0, 0.0], ..., [0.0, 0.0, 0.0]],
  "atom_numbers": [6, 6],
  "lattice": [[2.433055638800606, 0.0, 0.0], [-1.216527819400303, 2.1070879920223002, 0.0], [0.0, 0.0, 6.350126987977594]],
  "highsym_qpts": [[0, ""], [20, ""], [30, ""], [50, ""]],
  "atom_pos_car": [[0.0, 0.0, 0.0], [1.2165278194002909, 0.7023626640074263, 0.0]],
  "atom_pos_red": [[0.0, 0.0, 0.0], [0.66666666666666, 0.33333333333333, 0.0]],
  "formula": "C2",
  "atom_types": ["C", "C"]
}
  `.trim()}
          </code>
        </pre>
      </section>
      <hr />
      <section>
        <h2 id="aboutTerms">Terms of use</h2>
        <p>
          Please read these Terms of Service ("Terms", "Terms of Service")
          carefully before using the Interactive phonon visualizer website (the
          "Service"). Your access to and use of the Service is conditioned on
          your acceptance of and compliance with these Terms. These Terms apply
          to all visitors, users and others who access or use the Service. By
          accessing or using the Service you agree to be bound by these Terms.
          If you disagree with any part of the terms then you may not access the
          Service.
        </p>

        <h3>Use of uploaded data</h3>
        <p>
          By using the Service, you agree that any data or files you decide to
          upload to the service may be stored anonymously for debugging
          purposes, statistical purposes and to improve the quality of the
          Service.
        </p>

        <h3>Termination</h3>
        <p>
          We may terminate or suspend access to our Service immediately, without
          prior notice or liability, for any reason whatsoever.
        </p>

        <h3>Links To Other Web Sites</h3>
        <p>
          Our Service may contain links to third­-party web sites or services
          that are not owned or controlled by us. We have no control over, and
          assumes no responsibility for, the content, privacy policies, or
          practices of any third party web sites or services. You further
          acknowledge and agree that we shall not be responsible or liable,
          directly or indirectly, for any damage or loss caused or alleged to be
          caused by or in connection with use of or reliance on any such
          content, goods or services available on or through any such web sites
          or services. We strongly advise you to read the terms and conditions
          and privacy policies of any third-­party web sites or services that
          you visit.
        </p>

        <h3>Changes</h3>
        <p>
          We reserve the right, at our sole discretion, to modify or replace
          these Terms at any time. By continuing to access or use our Service
          after those revisions become effective, you agree to be bound by the
          revised terms. If you do not agree to the new terms, please stop using
          the Service.
        </p>

        <h3>Contact Us</h3>
        <p>If you have any questions about these Terms, please contact us.</p>
      </section>
      <ScrollToTopButton />
    </>
  );
};

export default AboutPanel;
