#!/usr/bin/env python
import argparse
import json
import os
import sys
from compute.phononweb.qephonon_qetools import QePhononQetools

import math

## -- File size reduction methods -- ##
# In case you want to round values we call this method ()
def nested_round(obj, decimals=4):
    if isinstance(obj, list):
        return [nested_round(x, decimals) for x in obj]
    elif isinstance(obj, dict):
        return {k: nested_round(v, decimals) for k, v in obj.items()}
    elif isinstance(obj, float):
        return round(obj, decimals)
    else:
        # int, str, None, bool, etc remain untouched
        return obj


# helper function to reduce file size safely reduce file size.
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


## -- main handler -- ##
def phononfolder_to_json(folder_name, mode="seekpath", round_vals=3):
    system_name = os.path.basename(os.path.realpath(folder_name))

    # Load required files
    try:
        with open(os.path.join(folder_name, "scf.in")) as f:
            scf_input = f.read()
        with open(os.path.join(folder_name, "scf.out")) as f:
            scf_output = f.read()
        with open(os.path.join(folder_name, "matdyn.modes")) as f:
            matdyn_modes = f.read()
    except FileNotFoundError as e:
        print(f"Missing file: {e.filename}")
        sys.exit(1)


    # Calculate High sym path from seekpath and matdyn.


    # Supercell repetitions
    starting_reps_default = (3, 3, 3)

    print(f"Processing system: {system_name}")

    phonons = QePhononQetools(
        scf_input=scf_input,
        scf_output=scf_output,
        matdyn_modes=matdyn_modes,
        starting_reps=starting_reps_default,
        reorder=True,
        mode=mode
    )

    
    data = phonons.get_dict()
    data.pop("alat", None)

    # free filesize reduction
    data = normalize_numbers(data)

    # user defined rounding of vals
    if round_vals:
        data = nested_round(data, round_vals)



    output_filename = f"{system_name}.json"
    with open('example.json', 'w') as f:
        json.dump(data, f, separators=(',', ':')) # seperators that reduce filesize.

    print(f"JSON file written: {output_filename}")


## -- argparse wrapper -- ##
if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Convert Quantum ESPRESSO phonon calculation outputs to JSON format.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter
    )
    parser.add_argument(
        "-f", "--folder",
        default="/",
        help="Folder containing scf.in, scf.out, matdyn.modes"
    )

    parser.add_argument("-m", "--mode", default="seekpath", help="mode to use when determining kpath labels")

    parser.add_argument("-r", "--round", type=int, default=None, help="sig figs to round output floats")
    args = parser.parse_args()
    phononfolder_to_json(args.folder, mode=args.mode, round_vals=args.round)
