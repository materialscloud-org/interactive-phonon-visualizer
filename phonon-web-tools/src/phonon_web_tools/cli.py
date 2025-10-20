#!/usr/bin/env python3
import argparse
from pathlib import Path

from phonon_web_tools import convert_qe_phonon_folder


def main():
    parser = argparse.ArgumentParser(
        description="Convert QE phonon data into a compact JSON format for visualization."
    )

    parser.add_argument(
        "folder",
        help="Folder containing QE input/output files (scf.in, scf.out, matdyn.modes, etc.).",
    )
    parser.add_argument(
        "--fname_scf_in",
        default="scf.in",
        help="Name of the SCF input file (default: scf.in).",
    )
    parser.add_argument(
        "--fname_scf_out",
        default="scf.out",
        help="Name of the SCF output file (default: scf.out).",
    )
    parser.add_argument(
        "--fname_modes",
        default="matdyn.modes",
        help="Name of the phonon modes file (default: matdyn.modes).",
    )
    parser.add_argument(
        "--fname_highsym_qpts",
        default="highsym_qpts.json",
        help="Optional JSON file containing high-symmetry q-points (default: highsym_qpts.json if present).",
    )
    parser.add_argument(
        "--out_file",
        help="Name/Path of the output file (default: phonon_vis.json inside the folder).",
    )

    args = parser.parse_args()

    convert_qe_phonon_folder(
        Path(args.folder),
        args.fname_scf_in,
        args.fname_scf_out,
        args.fname_modes,
        args.fname_highsym_qpts,
        args.out_file,
    )


if __name__ == "__main__":
    main()
