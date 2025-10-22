# Materials Cloud interactive phonon visualization tools

[![PyPI version](https://img.shields.io/pypi/v/phonon-web-tools.svg)](https://pypi.org/project/phonon-web-tools/)

[![npm version](https://img.shields.io/npm/v/mc-react-phonon-visualizer.svg)](https://www.npmjs.com/package/mc-react-phonon-visualizer)

This repository contains

- `./phonon-web-tools` - a Python package that allows to convert raw QE phonon data into a web-friendly json file.
- `./mc-react-phonon-visualizer` - a React component (`PhononVisualizer`) library to visualize the `json` file.
- `./interactive-phonon-app` (**WIP**) - The Materials Cloud tool that uses the React component and the python tools.

## Links

- Old version of the tool: https://github.com/materialscloud-org/tools-phonon-dispersion

## Making new releases

- `phonon-web-tools`:

  - Update version, commit and create a tag starting with `py-v`, push to Github.
    ```bash
    > cd phonon-web-tools
    > uv version --bump [major|minor|patch]
    ... => X.Y.Z
    > git add .; git commit -m "Release py-vX.Y.Z"
    > git tag py-vX.Y.Z -m py-vX.Y.Z
    > git push --follow-tags
    ```
  - A Github action will detect the tag `py-vX.Y.Z` and publish to PYPI.

- `mc-react-phonon-visualizer`:
  - Update version, commit and create a tag starting with `js-v`, push to Github.
    ```bash
    > cd mc-react-phonon-visualizer
    > npm version [major|minor|patch]
    vX.Y.Z
    > git add .; git commit -m "Release js-vX.Y.Z"
    > git tag js-vX.Y.Z -m js-vX.Y.Z
    > git push --follow-tags
    ```
  - A Github action will detect the tag `js-vX.Y.Z` and publish to npm.
