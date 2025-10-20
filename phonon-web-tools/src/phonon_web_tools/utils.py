import json
import math

import numpy as np
from ase.data import chemical_symbols

chem_symbol_to_number = {s: i for i, s in enumerate(chemical_symbols) if s != "X"}


class JsonEncoder(json.JSONEncoder):
    """Custom JSON encoder working correctly also with numpy arrays."""

    def default(self, obj):  # pylint: disable=method-hidden, arguments-differ
        """Default encoder."""
        if isinstance(obj, (np.ndarray, np.number)):
            if np.iscomplexobj(obj):
                return [obj.real, obj.imag]
            return obj.tolist()
        return json.JSONEncoder.default(self, obj)


# helper function to safely reduce file size.
def normalize_numbers(obj, eps=1e-8):
    if isinstance(obj, list):
        return [normalize_numbers(x, eps) for x in obj]
    elif isinstance(obj, dict):
        return {k: normalize_numbers(v, eps) for k, v in obj.items()}
    elif isinstance(obj, float):
        if abs(obj) < eps:
            return 0  # treat tiny floats as zero
        # Convert -0.0 to 0 explicitly
        if obj == 0.0 and math.copysign(1, obj) == -1.0:
            return 0
        if obj.is_integer():
            return int(obj)
        return obj
    else:
        return obj


def get_chemical_formula(atom_numbers):
    """
    from ase https://wiki.fysik.dtu.dk/ase/
    """
    elements = np.unique(atom_numbers)
    symbols = np.array([chemical_symbols[e] for e in elements])
    counts = np.array([(atom_numbers == e).sum() for e in elements])

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
