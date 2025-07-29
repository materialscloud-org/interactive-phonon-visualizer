# Copyright (c) 2017, Henrique Miranda
# All rights reserved.
#
# This file is part of the phononwebsite project
#
""" Generic class to hold and manipulate phonon dispersion data """
import json
import numpy as np
from .units import chemical_symbols
from .lattice import rec_lat, red_car
from .jsonencoder import JsonEncoder
import seekpath
import numpy as np


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


class Phonon:
    """
    Class to hold and manipulate generic phonon dispersions data
    output .json files to be read by the phononwebsite
    """

    def __init__(self, mode="seekpath"):
        """Set to None all variables that need to be set by some of the methods or in a subclass."""
        self.natoms = None
        self.mode = mode
        self.atom_numbers = []
        self.atom_types = []
        self.chemical_formula = None
        self.cell = []
        self.nphons = None
        self.nqpoints = None
        self.labels_qpts = None
        self.qpoints = []
        self.pos = []
        self.eigenvalues = None
        self.eigenvectors = None
        self.name = None
        self.chemical_symbols = None
        self.reps = None


    def reorder_eigenvalues(self):
        """
        compare the eigenvectors that correspond to the different eigenvalues
        to re-order the eigenvalues and solve the band-crossings
        """
        # vector transformations
        dim = (self.nqpoints, self.nphons, self.nphons)
        vectors = self.eigenvectors.view(complex).reshape(dim)

        eig = np.zeros([self.nqpoints, self.nphons])
        eiv = np.zeros([self.nqpoints, self.nphons, self.nphons], dtype=complex)
        # set order at gamma
        order = list(range(self.nphons))
        eig[0] = self.eigenvalues[0]
        eiv[0] = vectors[0]
        for k in range(1, self.nqpoints):
            order = estimate_band_connection(vectors[k - 1].T, vectors[k].T, order)
            for n, i in enumerate(order):
                eig[k, n] = self.eigenvalues[k, i]
                eiv[k, n] = vectors[k, i]

        # update teh eigenvales with the ordered version
        self.eigenvalues = eig
        dim = (self.nqpoints, self.nphons, self.natoms, 3, 2)
        self.eigenvectors = eiv.view(float).reshape(dim)

    def get_chemical_formula(self):
        """
        from ase https://wiki.fysik.dtu.dk/ase/
        """
        numbers = self.atom_numbers
        elements = np.unique(numbers)
        symbols = np.array([chemical_symbols[e] for e in elements])
        counts = np.array([(numbers == e).sum() for e in elements])

        ind = symbols.argsort()
        symbols = symbols[ind]
        counts = counts[ind]

        if "H" in symbols:
            i = np.arange(len(symbols))[symbols == "H"]
            symbols = np.insert(np.delete(symbols, i), 0, symbols[i])
            counts = np.insert(np.delete(counts, i), 0, counts[i])
        if "C" in symbols:
            i = np.arange(len(symbols))[symbols == "C"]
            symbols = np.insert(np.delete(symbols, i), 0, symbols[i])
            counts = np.insert(np.delete(counts, i), 0, counts[i])

        formula = ""
        for s, c in zip(symbols, counts):
            formula += s
            if c > 1:
                formula += str(c)

        return formula
        # end from ase

    def get_seekpath(self):
        self.seekpath_data = seekpath.get_path((self.cell, self.pos, self.atom_numbers))

    def get_distances_qpts(self):

        # calculate reciprocal lattice
        rec = rec_lat(self.cell)
        # calculate qpoints in the reciprocal lattice
        car_qpoints = red_car(self.qpoints, rec)

        self.distances = []
        distance = 0
        # iterate over qpoints
        for k in range(1, self.nqpoints):
            self.distances.append(distance)

            # calculate distances
            step = np.linalg.norm(car_qpoints[k] - car_qpoints[k - 1])
            distance += step

        # add the last distances
        self.distances.append(distance)

    def get_highsym_from_seekpath(self):
        """
        Sometimes the user will not define qlabels or their data has discontinuity across a common kvector
        Such cases are poorly handled by the default get_highsym_qpts method.

        This method aims to handle these by simply using the array of qpts and compare them to those found in seekpath.
        """

        def get_qp_label(qpoint, sym_pos, sym_labels, tol=1e-5):
            """
            Find whether `qpoint` exists (within tolerance) in `sym_pos` and return the corresponding label from `sym_labels`.
            """

            # convert Gamma to G because it might be wanted to be G
            sym_labs = [label.replace('GAMMA', 'G') for label in sym_labels]         

            diffs = np.linalg.norm(np.array(sym_pos) - np.array(qpoint), axis=1)
            match_idx = np.where(diffs < tol)[0]

            if match_idx.size > 0:
                return sym_labs[match_idx[0]]
            else:
                return False

        self.seekpath_data = seekpath.get_path((self.cell, self.pos, self.atom_numbers))
        sym_labels, sym_pos = zip(*self.seekpath_data["point_coords"].items())

        # use seekpath to autodetermine labels.
        high_sym_pos = []
        high_sym_labels = []

        qpoints = self.qpoints
        for k in range(0, self.nqpoints):
            res = get_qp_label(qpoints[k], sym_pos, sym_labels)
            if res:
                high_sym_pos.append(k)
                high_sym_labels.append(res)

        # handle merging of discontious label entries.  
        merged_pos = []
        merged_labels = []
        shift_array = []
        shift_val = 0
        modified_distances = np.copy(self.distances)
        i = 0
        while i < len(high_sym_pos):
            # Check if next exists
            if i+1 < len(high_sym_pos):
                # If they are directly adjacent indices (i.e., next index is i+1)
                if high_sym_pos[i+1] == high_sym_pos[i]+1:
                    # Merge labels if they differ
                    if high_sym_labels[i] != high_sym_labels[i+1]:
                        merged_labels.append(f"{high_sym_labels[i]}|{high_sym_labels[i+1]}")
                        merged_pos.append(min(high_sym_pos[i], high_sym_pos[i+1]))
                        i += 2  # skip next, it was merged
                        continue
            # Otherwise keep current
            merged_labels.append(high_sym_labels[i])
            merged_pos.append(high_sym_pos[i])
            i += 1

        self.highsym_qpts = list(zip(merged_pos, merged_labels))
        print("Merged:", self.highsym_qpts)        

        # squeeze the distance array to account for label merges.
        adjusted_distances = np.copy(self.distances)
        for i, (pos, label) in enumerate(self.highsym_qpts):
            if "|" in label: # indicates a merging of labels
                second_pos = pos+1

                # calculate how much gap was removed by merging
                gap = self.distances[second_pos] - self.distances[pos]

                print(f"Merged '{label}' at positions {pos} and {second_pos}; shifting by {-gap}")

                # shift all points after second_pos
                adjusted_distances[second_pos:] -= gap

        self.distances = adjusted_distances
        new_distance_array = np.copy(self.distances)

        # Now create final zipped list
        self.highsym_qpts = list(zip(merged_pos, merged_labels))

    def get_highsym_qpts(self):
        """
        Iterate over all the qpoints and obtain the high symmetry points
        as well as the distances between them
        """

        def collinear(a, b, c):
            """
            Check if three points are collinear.
            """
            d = [[a[0], a[1], 1], [b[0], b[1], 1], [c[0], c[1], 1]]
            return np.isclose(np.linalg.det(d), 0, atol=1e-5)

        # iterate over qpoints
        qpoints = self.qpoints
        self.highsym_qpts = [[0, ""]]
        for k in range(1, self.nqpoints - 1):
            # detect high symmetry qpoints
            if not collinear(qpoints[k - 1], qpoints[k], qpoints[k + 1]):
                self.highsym_qpts.append((k, ""))
        # add final k-point
        self.highsym_qpts.append((self.nqpoints - 1, ""))

        # if the labels are defined, assign them to the detected kpoints
        if self.labels_qpts:
            nhiqpts = len(self.highsym_qpts)
            nlabels = len(self.labels_qpts)
            if nlabels == nhiqpts:
                # fill in the symbols
                self.highsym_qpts = [
                    (q, s) for (q, l), s in zip(self.highsym_qpts, self.labels_qpts)
                ]
            else:
                raise ValueError(
                    "Wrong number of q-points specified. "
                    "Found %d high symmetry qpoints but %d labels" % (nhiqpts, nlabels)
                )
        else:
            print(
                "The labels of the high symmetry k-points are not known. "
                "They can be changed in the .json file manually."
            )
        return self.highsym_qpts

        
    def get_dict(self):
        "Return the data as a python dictionary."
        # Note: we go via the JSON so the numpy arrays are encoded as lists.
        return json.loads(self.get_json())

    def get_json(self):
        "Return json data to be read by javascript, as a string."
        if self.highsym_qpts is None:
            print(self.mode)
            if self.mode.startswith("c"):
                print("Using collinear determination for strings")
                self.get_highsym_qpts()
            elif self.mode.startswith("s"):
                self.get_highsym_from_seekpath()

        red_pos = red_car(self.pos, self.cell)
        # create the datastructure to be put on the json file

        
        data = {
            "name": self.name,  # name of the material on the website
            "natoms": self.natoms,  # number of atoms
            "lattice": self.cell,  # lattice vectors (bohr)
            "atom_types": self.atom_types,  # atom type for each atom (string)
            "atom_numbers": self.atom_numbers,  # atom number for each atom (integer)
            "formula": self.chemical_formula,  # chemical formula
            "qpoints": self.qpoints,  # list of point in the reciprocal space
            "repetitions": self.reps,  # default value for the repetititions
            "atom_pos_car": red_pos,  # atomic positions in cartesian coordinates
            "atom_pos_red": self.pos,  # atomic positions in reduced coordinates
            "eigenvalues": self.eigenvalues,  # eigenvalues (in units of cm-1)
            "distances": self.distances,  # list distances between the qpoints
            "highsym_qpts": self.highsym_qpts,  # list of high symmetry qpoints
            "vectors": self.eigenvectors,  # eigenvectors
            "alat": getattr(self, "alat", None),
            "seekpath_data": getattr(self, "seekpath_data", None)
        }  # alat in angstrom

        return json.dumps(data, cls=JsonEncoder, indent=1)

    def __str__(self):
        text = ""
        text += "name: %s\n" % self.name
        text += "cell:\n"
        for i in range(3):
            text += ("%12.8lf " * 3) % tuple(self.cell[i]) + "\n"
        text += "atoms:\n"
        for a in range(self.natoms):
            atom_pos_string = "%3s %3d" % (self.atom_types[a], self.atom_numbers[a])
            atom_typ_string = ("%12.8lf " * 3) % tuple(self.pos[a])
            text += atom_pos_string + atom_typ_string + "\n"
        text += "atypes:\n"
        for cs, an in zip(self.chemical_symbols, self.atom_numbers):
            text += "%3s %d\n" % (cs, an)
        text += "chemical formula:\n"
        text += self.chemical_formula + "\n"
        text += "nqpoints:\n"
        text += str(self.nqpoints)
        text += "\n"
        return text
