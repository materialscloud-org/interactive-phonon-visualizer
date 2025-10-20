"""Generic class to hold and manipulate phonon dispersion data"""

import json

import numpy as np
from ase.data import chemical_symbols

from .lattice import rec_lat, red_car
from .utils import JsonEncoder, get_chemical_formula


def estimate_band_connection(prev_eigvecs, eigvecs, prev_band_order):
    """
    A function to order the phonon eigenvectors taken from phonopy
    """
    metric = np.abs(np.dot(prev_eigvecs.conjugate().T, eigvecs))
    connection_order = []
    indices = list(range(len(metric)))
    indices.reverse()
    for overlaps in metric:
        maxval = 0
        for i in indices:
            val = overlaps[i]
            if i in connection_order:
                continue
            if val > maxval:
                maxval = val
                maxindex = i
        connection_order.append(maxindex)

    band_order = [connection_order[x] for x in prev_band_order]
    return band_order


def get_corner_qpts(qpoints):
    """
    Check from the qpoints path, which points are corners (qpath changes direction).
    These points should be high-symmetry points, but it's not a sufficient set -
    other high-sym. points can be in the middle of a straight segment as well.

    Ends and discontinuous jumps of the Q-path are caught by this.

    Collects equivalent q-points together.
    """

    def collinear(a, b, c):
        """
        Check if three points are collinear.
        """
        d = [[a[0], a[1], 1], [b[0], b[1], 1], [c[0], c[1], 1]]
        return np.isclose(np.linalg.det(d), 0, atol=1e-5)

    def add_index_to_qpt_bin(qpt, index, qpt_bins):
        """
        Add the qpt index to the correct bin or make a new one.
        """
        exists = False
        for bqpt, ind_list in qpt_bins:
            if np.allclose(bqpt, qpt, atol=1e-4):
                ind_list.append(index)
                exists = True
                break
        if not exists:
            qpt_bins.append((qpt, [index]))

    corner_qpts = [(qpoints[0], [0])]
    for k in range(1, len(qpoints) - 1):
        if not collinear(qpoints[k - 1], qpoints[k], qpoints[k + 1]):
            add_index_to_qpt_bin(qpoints[k], k, corner_qpts)
    # add last corner point always:
    add_index_to_qpt_bin(qpoints[-1], len(qpoints) - 1, corner_qpts)
    return corner_qpts


def get_highsym_qpts_from_seekpath(cell, pos, atom_numbers, qpoints, symprec=1e-05):
    """
    Try to get labels for highsym_qpt_coords with seekpath.
    """
    import numpy as np
    import seekpath

    seekpath_data = seekpath.get_path((cell, pos, atom_numbers), symprec=symprec)
    sym_labels, sym_positions = zip(*seekpath_data["point_coords"].items())

    # Go through each Q-point and check if they match with a high-sym one
    tol = 1e-5
    highsym_qpts = {}  # index: label
    for i_qpt, qpt in enumerate(qpoints):
        diffs = np.linalg.norm(np.array(sym_positions) - np.array(qpt), axis=1)
        match_idx = np.where(diffs < tol)[0]
        if match_idx.size > 0:
            highsym_qpts[i_qpt] = sym_labels[match_idx[0]]

    # Make sure each kink/corner point got a label. If not, likely the symmetry
    # detection was not fully correct. Assign a generic "Q_#" in these cases.
    count = 0
    for _, ind_list in get_corner_qpts(qpoints):
        increase_count = False
        for i in ind_list:
            if i not in highsym_qpts:
                highsym_qpts[i] = f"Q_{count + 1}"
                increase_count = True
        if increase_count:
            count += 1
    if count:
        print(f"Warning: Seekpath couldn't detect labels for {count} corner points.")

    return sorted(highsym_qpts.items())  # convert to sorted list: [(index, label)]


def replace_highsym_labels(_highsym_qpts):
    """
    Current frontend prefers G over GAMMA, replace these.
    """
    replace = {"GAMMA": "G"}
    highsym_qpts = []
    for i_qpt, label in _highsym_qpts:
        highsym_qpts.append((i_qpt, replace.get(label, label)))
    return highsym_qpts


def merge_neighboring_highsym_labels(highsym_qpts):
    """
    Merge the high symmetry labels that are neighboring each other,
    as this indicates a discontinuity in the path.
    """
    merged_highsym_qpts = []
    iq = 0
    while iq < len(highsym_qpts) - 1:
        pos, label = highsym_qpts[iq]
        next_pos, next_label = highsym_qpts[iq + 1]

        if next_pos == pos + 1:
            # neighboring points
            if label != next_label:
                # merge only if labels differ
                merged_highsym_qpts.append((pos, f"{label}|{next_label}"))
            else:
                merged_highsym_qpts.append((pos, label))
            # skip next pos:
            iq += 1
        else:
            merged_highsym_qpts.append((pos, label))
        iq += 1
    # Last one needs to be appended manually:
    merged_highsym_qpts.append(highsym_qpts[-1])
    return merged_highsym_qpts


class PhononWebConverter:
    """
    Class to hold and manipulate generic phonon dispersions data
    output .json files to be read by the interactive phonon web apps
    """

    def __init__(
        self,
        cell,
        pos,
        atom_numbers,
        eigenvalues,
        eigenvectors,
        qpoints,
        highsym_qpts=None,
        name=None,
        seekpath_symprec=1e-04,
        reorder_eigenvalues=True,
        starting_supercell=(3, 3, 3),
    ):
        self.cell = cell
        self.pos = pos
        self.atom_numbers = atom_numbers

        self.eigenvalues = eigenvalues
        self.qpoints = qpoints

        self.chemical_formula = get_chemical_formula(self.atom_numbers)
        self.atom_types = [chemical_symbols[n] for n in self.atom_numbers]
        self.n_qpts = len(qpoints)
        self.n_atoms = len(atom_numbers)
        self.n_phonons = len(eigenvalues[0])

        self.eigenvectors = self._reshape_eigenvectors(eigenvectors)

        if highsym_qpts is None:
            highsym_qpts = get_highsym_qpts_from_seekpath(
                self.cell,
                self.pos,
                self.atom_numbers,
                self.qpoints,
                seekpath_symprec,
            )
        highsym_qpts = replace_highsym_labels(highsym_qpts)
        self.highsym_qpts = merge_neighboring_highsym_labels(highsym_qpts)

        self.distances = self._get_qpt_distances()

        if reorder_eigenvalues:
            self._reorder_eigenvalues()

        self.name = name
        if name is None:
            self.name = self.chemical_formula

        self.starting_supercell = starting_supercell

    def _get_qpt_distances(self):
        # calculate reciprocal lattice
        rec = rec_lat(self.cell)
        # calculate qpoints in the reciprocal lattice
        car_qpoints = red_car(self.qpoints, rec)

        distances = []
        distance = 0
        for iq in range(1, self.n_qpts):
            distances.append(distance)
            step = np.linalg.norm(car_qpoints[iq] - car_qpoints[iq - 1])
            distance += step

        # add the last distance
        distances.append(distance)

        # Remove the gap for merged labels
        adjusted_distances = np.copy(distances)
        for i, (pos, label) in enumerate(self.highsym_qpts):
            if "|" in label:  # indicates a merging of labels
                gap = distances[pos + 1] - distances[pos]
                adjusted_distances[pos + 1 :] -= gap

        return adjusted_distances

    def _reshape_eigenvectors(self, eigv):
        """
        The parsed shape is (n_qpts, n_phonons, n_phonons, 2), where
        the last dim (2) gives the real and complex values.
        The final shape should be (n_qpts, n_phonons, n_atoms, 3, 2)
        """
        dim = (self.n_qpts, self.n_phonons, self.n_atoms, 3, 2)
        return eigv.view(float).reshape(dim)

    def _reorder_eigenvalues(self):
        """
        compare the eigenvectors that correspond to the different eigenvalues
        to re-order the eigenvalues and solve the band-crossings
        """
        # vector transformations
        dim = (self.n_qpts, self.n_phonons, self.n_phonons)
        vectors = self.eigenvectors.view(complex).reshape(dim)

        eig = np.zeros([self.n_qpts, self.n_phonons])
        eiv = np.zeros([self.n_qpts, self.n_phonons, self.n_phonons], dtype=complex)
        # set order at gamma
        order = list(range(self.n_phonons))
        eig[0] = self.eigenvalues[0]
        eiv[0] = vectors[0]
        for k in range(1, self.n_qpts):
            order = estimate_band_connection(vectors[k - 1].T, vectors[k].T, order)
            for n, i in enumerate(order):
                eig[k, n] = self.eigenvalues[k, i]
                eiv[k, n] = vectors[k, i]

        # update the eigenvalues with the ordered version
        self.eigenvalues = eig
        self.eigenvectors = self._reshape_eigenvectors(eiv)

    def get_dict(self):
        "Return the data as a python dictionary."
        # Note: we go via the JSON so the numpy arrays are encoded as lists.
        return json.loads(self.get_json())

    def get_json(self):
        "Return json data to be read by javascript, as a string."
        red_pos = red_car(self.pos, self.cell)
        data = {
            "name": self.name,  # name of the material on the website
            "natoms": self.n_atoms,  # number of atoms
            "lattice": self.cell,  # lattice vectors (bohr)
            "atom_types": self.atom_types,  # atom type for each atom (string)
            "atom_numbers": self.atom_numbers,  # atom number for each atom (integer)
            "formula": self.chemical_formula,  # chemical formula
            "repetitions": self.starting_supercell,  # default value for the repetititions
            "atom_pos_car": red_pos,  # atomic positions in cartesian coordinates
            "atom_pos_red": self.pos,  # atomic positions in reduced coordinates
            "highsym_qpts": self.highsym_qpts,  # list of high symmetry qpoints w labels
            "qpoints": self.qpoints,  # list of points in the reciprocal space
            "distances": self.distances,  # list distances between the qpoints
            "eigenvalues": self.eigenvalues,  # eigenvalues (in units of cm-1)
            "vectors": self.eigenvectors,  # eigenvectors
        }

        return json.dumps(data, cls=JsonEncoder, indent=2)

    def __str__(self):
        text = ""
        text += "name: %s\n" % self.name
        text += "cell:\n"
        for i in range(3):
            text += ("%12.8lf " * 3) % tuple(self.cell[i]) + "\n"
        text += "atoms:\n"
        for a in range(self.n_atoms):
            atom_pos_string = "%3s %3d" % (self.atom_types[a], self.atom_numbers[a])
            atom_typ_string = ("%12.8lf " * 3) % tuple(self.pos[a])
            text += atom_pos_string + atom_typ_string + "\n"
        text += "atypes:\n"
        for an in self.atom_numbers:
            text += "%3s %d\n" % (chemical_symbols[an], an)
        text += "chemical formula:\n"
        text += self.chemical_formula + "\n"
        text += "nqpoints:\n"
        text += str(self.n_qpts)
        text += "\n"
        return text
