# convert_to_json

A utilty script that converts a folder into a json file (usable by MC frontend component visualisers).

This script is heavily based on the one found in the tools-phonon-dispersion repo, however uses seekpath to attempt to autoassign labels to the total path.

- [tools-phonon-dispersion](https://github.com/materialscloud-org/tools-phonon-dispersion): An web-based interactive visualiser for phonon modes built using tools-barebones.

This direcoty contains only the conversion script (file parsing, additional settings etc.) to save a json from a given directory that contains:

- matdyn.modes
- scf.in
- scf.out

predominantly for usage in contribution pipelines seen on:

[mc3d-data](https://github.com/materialscloud-org/discover-mc3d-data): a data entry pipeline for populating the materials cloud MongoDB

## Usage

The main functionality has been wrapped through argparse to be a command line utility (qe_phonon_to_json.py).

```
pip install -r requirements.txt # install requirements

python3 qe_phonon_to_json.py -f example/  #Calculate on the example dir.
```

It was noted that the old method for determining breaks in the kpath was via calcaultion of linear pathing in the matdyns file, this is insufficent for discontiniuties, however this is availible for legacy usage:

```
python3 qe_phonon_to_json.py -m collinear -f example
```

for all flags:

```
python3 qe_phonon_to_json.py -h
```

## Issues

Discontinuaties still currently draw a sharp line between them. This could be fixed on the data level (by improving the data structure to be based on bandsData), but maybe is more convenient to handle such cases through the visualising widgets?
