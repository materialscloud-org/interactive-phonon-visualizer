# Phonon web tools

Python tools to convert raw phonon data (from Quantum ESPRESSO) into a web-friendly JSON file that can be visualized with the corresponding frontend.

Used in this repository, but also outside (e.g. in the MC3D data pipeline).

## Install and usage

Install either from pypi or locally for development:

```bash
pip install phonon-web-tools
# or
pip install -e .
```

Use the CLI

```bash
phonon-web-tools --help
phonon-web-tools ../data/graphene
```

Run all examples in `../data/` with `run_examples.py`.
