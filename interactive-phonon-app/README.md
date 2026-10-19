# Interactive phonons visualizer

This repository houses the Materials Cloud interactive phonons visualizer React app.

### Development

- clone this repo
- install `node.js` (includes `npm`) from [official site](https://nodejs.org/)
- install dependencies with `npm install`
- launch the app with `npm start`

The app is fully static: Quantum ESPRESSO files are converted in the browser
with [matsci-parse](https://github.com/Bud-Macaulay/matsci-parse), so no
backend is needed. `npm run build` writes the site to `dist/`, which can be
served by any static file host.
