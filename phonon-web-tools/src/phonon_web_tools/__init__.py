import json
from pathlib import Path

from .phonon_web import PhononWebConverter
from .qe_phonon_tools import convert_qe_phonon_data
from .utils import normalize_numbers

__all__ = ["PhononWebConverter", "convert_qe_phonon_data"]


def convert_qe_phonon_folder(
    folder: Path,
    fname_scf_in="scf.in",
    fname_scf_out="scf.out",
    fname_modes="matdyn.modes",
    fname_highsym_qpts="highsym_qpts.json",
    out_file: Path | None = None,
    **kwargs,
):
    """
    Load QE phonon data from a folder and convert to the JSON file
    """

    highsym_qpts = None
    highsym_qpts_file = folder / fname_highsym_qpts
    if highsym_qpts_file.exists():
        highsym_qpts = json.loads(highsym_qpts_file.read_text())

    with (
        open(folder / fname_scf_in) as f1,
        open(folder / fname_scf_out) as f2,
        open(folder / fname_modes) as f3,
    ):
        pwc = convert_qe_phonon_data(
            f1,
            f2,
            f3,
            highsym_qpts=highsym_qpts,
            **kwargs,
        )

    if not out_file:
        out_file = folder / "phonon_vis.json"

    # free filesize reduction
    phonon_data = normalize_numbers(pwc.get_dict())

    with open(out_file, "w") as f:
        json.dump(phonon_data, f, separators=(",", ":"))

    print(f"Saved {out_file}")
