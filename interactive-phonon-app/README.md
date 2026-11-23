# Interactive phonons visualizer

This repository houses the Materials Cloud interactive phonons visualizer React app.

### Development

- clone this repo
- install `node.js` (includes `npm`) from [official site](https://nodejs.org/)
- install dependencies with `npm install`
- launch the app with `npm run dev`

The app is static: Quantum ESPRESSO files are converted in the browser with
[matsci-parse](https://github.com/Bud-Macaulay/matsci-parse), and the build in
`dist/` can be served by any static file host. There is no Share button:
current policy is no Materials Cloud key-value stores in apps.

Data from other backends opens with
`?fromURL=<url>[&format=<fmt>][&tag=<name>]`, where `tag` names it in the
history.
