# Copyright (c) 2019-2021, Giovanni Pizzi
# All rights reserved.

"""Read phonon dispersion from quantum espresso"""

import re

import ase.io
import numpy as np
import qe_tools
from pymatgen.io.cif import CifParser as PMGCifParser

from .lattice import car_red, rec_lat
from .phonon_web import PhononWebConverter
from .utils import chem_symbol_to_number

# Value from qe_tools
bohr_in_angstrom = 0.52917720859


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
            retlist.append(chem_symbol_to_number[s])
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
            number_from_name = chem_symbol_to_number.get(chemical_name, None)
            # Infer chemical element from element
            pseudo_name = species_dict[name]
            name_from_pseudo = pseudo_name
            for sep in ["-", ".", "_"]:
                name_from_pseudo = name_from_pseudo.partition(sep)[0]
            name_from_pseudo = name_from_pseudo.capitalize()
            number_from_pseudo = chem_symbol_to_number.get(name_from_pseudo, None)

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


def read_and_process_matdyn(file_obj, natoms, alat, rec):
    """
    Function to read the eigenvalues and eigenvectors from Quantum ESPRESSO
    """
    file_list = file_obj.readlines()
    file_str = "".join(file_list)

    # determine the numer of atoms
    lines_with_freq = [int(x) for x in re.findall(r"(?:freq|omega) \((.+)\)", file_str)]
    if not lines_with_freq:
        raise ValueError(
            "Unable to find the lines with the frequencies in the matdyn.modes file. "
            "Please check that you uploaded the correct file!"
        )
    nphons = max(lines_with_freq)
    atoms = nphons // 3

    # check if the number fo atoms is the same
    if atoms != natoms:
        raise ValueError(
            "The number of atoms in the SCF input file ({}) "
            "is not the same as in the matdyn.modes file ({})".format(natoms, atoms)
        )

    # determine the number of qpoints
    nqpoints = len(re.findall("q = ", file_str))

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
    # here we scale then with sqrt(m) so that we recover the correct scaling on the website
    # we check if the eigenvectors are orthogonal or not
    # for na in xrange(self.natoms):
    #    atomic_specie = self.atypes[na]-1
    #    atomic_number = self.atomic_numbers[atomic_specie]
    #    vectors[:,:,na,:,:] *= sqrt(atomic_mass[atomic_number])

    nqpoints = len(qpt)
    eigenvalues = eig  # *eV/hartree_cm1
    eigenvectors = vec.view(dtype=float).reshape([nqpoints, nphons, nphons, 2])
    qpoints = qpt

    # convert from cartesian coordinates (units of 2pi/alat, alat is the alat of the code)
    # to reduced coordinates
    # First, I need to convert from 2pi/alat units (as written in the matdyn.modes file) to
    # 1/angstrom (as rec is)
    qpoints = np.array(qpoints) * 2 * np.pi / alat

    # now that I have self.qpoints in 1/angstrom, I can just use rec to convert to reduced
    # coordinates since rec is in units of 1/angstrom
    qpoints = car_red(qpoints, rec)

    return {
        "eigenvalues": eigenvalues,
        "eigenvectors": eigenvectors,
        "qpoints": qpoints,
    }


def read_and_process_scf_in(file_obj):
    """
    Read the data from a quantum espresso input file
    """
    fileformat = "qeinp-qetools"
    (cell, rel_positions, numbers) = get_structure_tuple(file_obj, fileformat)

    pos = rel_positions  # reduced coords
    cell = np.array(cell)
    rec = rec_lat(cell) * 2 * np.pi

    return {
        "pos": pos,
        "cell": cell,
        "atom_numbers": numbers,
        "rec": rec,
    }


def read_and_process_scf_out(file_obj, scf_in_data):
    """
    Read the data from a quantum espresso output file.

    At the moment, it's used only to read `alat` since it's not univocally defined from
    the crystal structure in the input (ibrav=0 uses the length of the first vector, but this behavior
    changes between 5.0 and 6.0 in QE, or it's manually specified).
    Better to parse it from the output.

    Moreover, it will perform some simple checks (number of atoms, etc.).
    Call this *after* read_atoms().
    """
    lines = file_obj.readlines()
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
    alat = alat_bohr * bohr_in_angstrom

    ## Add a few validation tests here. They are not complete, but at least
    ## should cover the most common errors.

    # Validate number of atoms
    matching_lines = [l for l in lines if "number of atoms/cell" in l]
    if not matching_lines:
        raise ValueError("No lines with the number of atoms found in QE output file")
    # Pick the first one
    alat_line = matching_lines[0]
    natoms = int(alat_line.split("=")[1])
    natoms_in = len(scf_in_data["atom_numbers"])
    if natoms_in != natoms:
        raise ValueError(
            "The number of atoms in the SCF input file ({}) "
            "is not the same as in the output file ({})".format(natoms_in, natoms)
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
            raise ValueError("Error while parsing cell from QE output: {}".format(exc))
    # Convert from units of alat to angstrom
    cell = np.array(cell) * alat

    # Check the cells are the same with some loose threshold
    cell_in = scf_in_data["cell"]
    if not np.allclose(cell_in, cell, rtol=1.0e-4, atol=1.0e-4):
        raise ValueError(
            "The cell in the SCF input file ({}) "
            "is not the same as in the output file ({})".format(
                cell_in.tolist(), cell.tolist()
            )
        )

    return {"alat": alat}


def convert_qe_phonon_data(
    scf_in_file, scf_out_file, matdyn_file, highsym_qpts=None, **kwargs
):
    """
    Load and process all data from QE phonon calculation files

    kwargs are passed to PhononWebConverter, and allow to set the name, symprec, etc...
    """
    scf_in_data = read_and_process_scf_in(scf_in_file)
    scf_out_data = read_and_process_scf_out(scf_out_file, scf_in_data)
    matdyn_data = read_and_process_matdyn(
        matdyn_file,
        natoms=len(scf_in_data["atom_numbers"]),
        alat=scf_out_data["alat"],
        rec=scf_in_data["rec"],
    )

    phonon_web_converter = PhononWebConverter(
        cell=scf_in_data["cell"],
        pos=scf_in_data["pos"],
        atom_numbers=scf_in_data["atom_numbers"],
        eigenvalues=matdyn_data["eigenvalues"],
        eigenvectors=matdyn_data["eigenvectors"],
        qpoints=matdyn_data["qpoints"],
        highsym_qpts=highsym_qpts,
        **kwargs,
    )

    return phonon_web_converter
