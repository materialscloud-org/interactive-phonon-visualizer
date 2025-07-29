# Copyright (c) 2019-2021, Giovanni Pizzi
# All rights reserved.

""" Read phonon dispersion from quantum espresso """
import io
import re
import numpy as np

from .phononweb import Phonon
from .lattice import car_red, rec_lat
from .units import atomic_numbers, bohr_in_angstrom, chemical_symbols, atoms_num_dict


import ase.io
from ase.data import atomic_numbers
from pymatgen.io.cif import CifParser as PMGCifParser
import qe_tools
import numpy as np


class UnknownFormatError(ValueError):
    pass


def get_atomic_numbers(symbols):
    """
    Given a list of symbols, return the corresponding atomic numbers.

    :raise ValueError: if the symbol is not recognized
    """
    retlist = []
    for s in symbols:
        try:
            retlist.append(atomic_numbers[s])
        except KeyError:
            raise ValueError("Unknown symbol '{}'".format(s))
    return retlist


def tuple_from_ase(asestructure):
    """
    Given a ASE structure, return a structure tuple as expected from seekpath

    :param asestructure: a ASE Atoms object

    :return: a structure tuple (cell, positions, numbers) as accepted
        by seekpath.
    """
    atomic_numbers = get_atomic_numbers(asestructure.get_chemical_symbols())
    structure_tuple = (
        asestructure.cell.tolist(),
        asestructure.get_scaled_positions().tolist(),
        atomic_numbers,
    )
    return structure_tuple


def tuple_from_pymatgen(pmgstructure):
    """
    Given a pymatgen structure, return a structure tuple as expected from seekpath

    :param pmgstructure: a pymatgen Structure object

    :return: a structure tuple (cell, positions, numbers) as accepted
        by seekpath.
    """
    frac_coords = [site.frac_coords.tolist() for site in pmgstructure.sites]
    structure_tuple = (
        pmgstructure.lattice.matrix.tolist(),
        frac_coords,
        pmgstructure.atomic_numbers,
    )
    return structure_tuple


def get_structure_tuple(  # pylint: disable=too-many-locals
    fileobject, fileformat, extra_data=None
):
    """
    Given a file-like object (using StringIO or open()), and a string
    identifying the file format, return a structure tuple as accepted
    by seekpath.

    :param fileobject: a file-like object containing the file content
    :param fileformat: a string with the format to use to parse the data

    :return: a structure tuple (cell, positions, numbers) as accepted
        by seekpath.
    """
    ase_fileformats = {
        "vasp-ase": "vasp",
        "xsf-ase": "xsf",
        "castep-ase": "castep-cell",
        "pdb-ase": "proteindatabank",
        "xyz-ase": "xyz",
        "cif-ase": "cif",  # currently broken in ASE: https://gitlab.com/ase/ase/issues/15
    }
    if fileformat in ase_fileformats.keys():
        asestructure = ase.io.read(fileobject, format=ase_fileformats[fileformat])

        if fileformat == "xyz-ase":
            # XYZ does not contain cell information, add them back from the
            # additional form data (note that at the moment we are not using the
            # extended XYZ format)
            if extra_data is None:
                raise ValueError(
                    "Please pass also the extra_data with the cell information if you want to use the xyz format"
                )
            # avoid generator expressions by explicitly requesting tuple/list
            cell = list(
                tuple(float(extra_data["xyzCellVec" + v + a]) for a in "xyz")
                for v in "ABC"
            )

            asestructure.set_cell(cell)

        return tuple_from_ase(asestructure)
    if fileformat == "cif-pymatgen":
        # Only get the first structure, if more than one
        pmgstructure = PMGCifParser(fileobject).get_structures()[0]
        return tuple_from_pymatgen(pmgstructure)
    if fileformat == "qeinp-qetools":
        fileobject.seek(0)
        pwfile = qe_tools.parsers.PwInputFile(
            fileobject.read(), validate_species_names=True
        )
        pwparsed = pwfile.structure

        cell = pwparsed["cell"]
        rel_position = np.dot(pwparsed["positions"], np.linalg.inv(cell)).tolist()

        species_dict = dict(
            zip(pwparsed["species"]["names"], pwparsed["species"]["pseudo_file_names"])
        )

        numbers = []
        # Heuristics to get the chemical element
        for name in pwparsed["atom_names"]:
            # Take only characters, take only up to two characters
            chemical_name = "".join(char for char in name if char.isalpha())[
                :2
            ].capitalize()
            number_from_name = atoms_num_dict.get(chemical_name, None)
            # Infer chemical element from element
            pseudo_name = species_dict[name]
            name_from_pseudo = pseudo_name
            for sep in ["-", ".", "_"]:
                name_from_pseudo = name_from_pseudo.partition(sep)[0]
            name_from_pseudo = name_from_pseudo.capitalize()
            number_from_pseudo = atoms_num_dict.get(name_from_pseudo, None)

            if number_from_name is None and number_from_pseudo is None:
                raise KeyError(
                    "Unable to parse the chemical element either from the atom name or for the pseudo name"
                )
            # I make number_from_pseudo prioritary if both are parsed,
            # even if they are different
            if number_from_pseudo is not None:
                numbers.append(number_from_pseudo)
                continue

            # If we are here, number_from_pseudo is None and number_from_name is not
            numbers.append(number_from_name)
            continue

        # Old conversion. This does not work for multiple species
        # for the same chemical element, e.g. Si1 and Si2
        # numbers = [atoms_num_dict[sym] for sym in pwparsed['atom_names']]

        structure_tuple = (cell, rel_position, numbers)
        return structure_tuple

    raise UnknownFormatError(fileformat)


class QePhononQetools(Phonon):
    """
    Class to read phonons from Quantum ESPRESSO.

    accepts two modes:
        - "seekpath" uses seekpath to determine highsymmetry labels for xlabelling
        - "collinear" uses a collinear indexing of points to determine highsymmetry labels for xlabelling
    """

    def __init__(  # pylint: disable=too-many-arguments
        self,
        scf_input,
        scf_output,
        matdyn_modes,
        highsym_qpts=None,
        reorder=True,
        name="PW",
        starting_reps=(3, 3, 3),
        mode=None,
    ):
        if mode is None:
            mode = "seekpath"
        super().__init__(mode=mode)


        self.name = name
        self.highsym_qpts = highsym_qpts

        # PBC repetitions used as a starting value in the visualizer
        self.reps = starting_reps

        # read atoms
        self.read_atoms(io.StringIO(scf_input))
        # read output (mostly to get alat, but also some additional checks)
        self.read_alat(io.StringIO(scf_output))
        # read modes
        self.read_modes(io.StringIO(matdyn_modes))
        # reorder eigenvalues
        if reorder:
            self.reorder_eigenvalues()
        self.get_distances_qpts()
        self.labels_qpts = None

    def read_modes(self, fileobject):  # pylint: disable=too-many-locals
        """
        Function to read the eigenvalues and eigenvectors from Quantum ESPRESSO
        """
        file_list = fileobject.readlines()
        file_str = "".join(file_list)

        # determine the numer of atoms
        lines_with_freq = [
            int(x) for x in re.findall(r"(?:freq|omega) \((.+)\)", file_str)
        ]
        if not lines_with_freq:
            raise ValueError(
                "Unable to find the lines with the frequencies in the matdyn.modes file. "
                "Please check that you uploaded the correct file!"
            )
        nphons = max(lines_with_freq)
        atoms = nphons // 3

        # check if the number fo atoms is the same
        if atoms != self.natoms:
            raise ValueError(
                "The number of atoms in the SCF input file ({}) "
                "is not the same as in the matdyn.modes file ({})".format(
                    self.natoms, atoms
                )
            )

        # determine the number of qpoints
        self.nqpoints = len(re.findall("q = ", file_str))
        nqpoints = self.nqpoints

        eig = np.zeros([nqpoints, nphons])
        vec = np.zeros([nqpoints, nphons, atoms, 3], dtype=complex)
        qpt = np.zeros([nqpoints, 3])
        for k in range(nqpoints):
            # iterate over qpoints
            k_idx = 2 + k * ((atoms + 1) * nphons + 5)
            # read qpoint
            qpt[k] = list(map(float, file_list[k_idx].split()[2:]))
            for n in range(nphons):
                # read eigenvalues
                eig_idx = k_idx + 2 + n * (atoms + 1)
                reig = re.findall(
                    r"=\s+([+-]?\d+(?:\.\d+)?(?:[eE][-+]?\d+)?)", file_list[eig_idx]
                )[1]
                eig[k][n] = float(reig)
                for i in range(atoms):
                    # read eigenvectors
                    svec = re.findall(
                        r"([+-]?\d+(?:\.\d+)?(?:[eE][-+]?\d+)?)",
                        file_list[eig_idx + 1 + i],
                    )
                    z = list(map(float, svec))
                    cvec = [
                        complex(z[0], z[1]),
                        complex(z[2], z[3]),
                        complex(z[4], z[5]),
                    ]
                    vec[k][n][i] = np.array(cvec, dtype=complex)

        # the quantum espresso eigenvectors are already scaled with the atomic masses
        # Note that if the file comes from dynmat.eig they are not scaled with the atomic masses
        # here we scale then with sqrt(m) so that we recover the correct scalling on the website
        # we check if the eigenvectors are orthogonal or not
        # for na in xrange(self.natoms):
        #    atomic_specie = self.atypes[na]-1
        #    atomic_number = self.atomic_numbers[atomic_specie]
        #    vectors[:,:,na,:,:] *= sqrt(atomic_mass[atomic_number])

        self.nqpoints = len(qpt)
        self.nphons = nphons
        self.eigenvalues = eig  # *eV/hartree_cm1
        self.eigenvectors = vec.view(dtype=float).reshape(
            [self.nqpoints, nphons, nphons, 2]
        )
        self.qpoints = qpt

        # convert from cartesian coordinates (units of 2pi/alat, alat is the alat of the code)
        # to reduced coordinates
        # First, I need to convert from 2pi/alat units (as written in the matdyn.modes file) to
        # 1/angstrom (as self.rec is)
        self.qpoints = np.array(self.qpoints) * 2 * np.pi / self.alat

        # now that I have self.qpoints in 1/agstrom, I can just use self.rec to convert to reduced
        # coordinates since self.rec is in units of 1/angstrom
        self.qpoints = car_red(self.qpoints, self.rec)
        return self.eigenvalues, self.eigenvectors, self.qpoints

    def read_atoms(self, fileobject):
        """
        read the data from a quantum espresso input file
        """
        fileformat = "qeinp-qetools"
        (cell, rel_positions, numbers) = get_structure_tuple(fileobject, fileformat)

        self.pos = rel_positions  # reduced coords
        self.cell = np.array(cell)
        self.rec = rec_lat(self.cell) * 2 * np.pi

        self.natoms = len(rel_positions)  # number of atoms
        self.atom_numbers = numbers  # atom number for each atom (integer)

        atom_names = []
        for n in numbers:
            for atom_name, atom_number in atomic_numbers.items():
                if atom_number == n:
                    atom_names.append(atom_name)

        self.atom_types = atom_names  # atom type for each atom (string)

        self.chemical_symbols = [chemical_symbols[number] for number in numbers]
        self.chemical_formula = self.get_chemical_formula()

    def read_alat(self, fileobject):
        """
        Read the data from a quantum espresso output file.

        At the moment, it's used only to read `alat` since it's not univocally defined from
        the crystal structure in the input (ibrav=0 uses the length of the first vector, but this behavior
        changes between 5.0 and 6.0 in QE, or it's manually specified).
        Better to parse it from the output.

        Moreover, it will perform some simple checks (number of atoms, etc.).
        Call this *after* read_atoms().
        """
        lines = fileobject.readlines()
        # Get alat
        matching_lines = [
            l for l in lines if "lattice parameter (alat)" in l and "a.u." in l
        ]
        if not matching_lines:
            raise ValueError("No lines with alat found in QE output file")
        if len(matching_lines) > 1:
            raise ValueError(
                "Multiple lines with alat found in QE output file... Maybe this is a vc-relax and not an SCF?"
            )
        alat_line = matching_lines[0]
        alat_bohr = float(alat_line.split()[4])
        # Convert to angstrom from Bohr (a.u.)
        self.alat = alat_bohr * bohr_in_angstrom

        ## Add a few validation tests here. They are not complete, but at least
        ## should cover the most common errors.

        # Validate number of atoms
        matching_lines = [l for l in lines if "number of atoms/cell" in l]
        if not matching_lines:
            raise ValueError(
                "No lines with the number of atoms found in QE output file"
            )
        # Pick the first one
        alat_line = matching_lines[0]
        natoms = int(alat_line.split("=")[1])
        if self.natoms != natoms:
            raise ValueError(
                "The number of atoms in the SCF input file ({}) "
                "is not the same as in the output file ({})".format(self.natoms, natoms)
            )

        lineno = None
        for lineno, line in enumerate(lines):
            if "crystal axes" in line and "units of alat" in line:
                break
        else:
            raise ValueError("Unable to find the crystal cell in the QE output file")
        cell = []
        for line_offset in [1, 2, 3]:
            line = lines[lineno + line_offset]
            if "a({})".format(line_offset) not in line:
                raise ValueError(
                    "string 'a({})' not found when parsing cell from QE output".format(
                        line_offset
                    )
                )
            # Lines have this format
            #    a(1) = (   1.000000   0.000000   0.000000 )
            #    a(2) = (   0.000000  -0.823428   0.000000 )
            #    a(3) = (   0.000000   0.000000  -0.135089 )
            try:
                cell.append(
                    [float(val) for val in line.split("(")[2].split(")")[0].split()]
                )
            except Exception as exc:
                raise ValueError(
                    "Error while parsing cell from QE output: {}".format(exc)
                )
        # Convert from units of alat to angstrom
        cell = np.array(cell) * self.alat

        # Check the cells are the same with some loose threshold
        if not np.allclose(self.cell, cell, rtol=1.0e-4, atol=1.0e-4):
            raise ValueError(
                "The cell in the SCF input file ({}) "
                "is not the same as in the output file ({})".format(
                    self.cell.tolist(), cell.tolist()
                )
            )
