# Interactive phonons visualizer

This repository houses the Materials Cloud interactive phonons visualizer React app.

### Development

- clone this repo
- install `node.js` (includes `npm`) from [official site](https://nodejs.org/)
- install dependencies with `npm install`
- launch the app with `npm run dev`

The app is static: Quantum ESPRESSO files are converted in the browser with
[matsci-parse](https://github.com/Bud-Macaulay/matsci-parse), and the build in
`dist/` can be served by any static file host. The only service it talks to
is the **share store**, the key-value store that holds data shared with the
Share button.

### Share links

The Share button (mc-react-library's `McShareButton`) uploads the data on
screen to the Materials Cloud kv-store and gives a `?<id>` link; links expire
after 30 days. The store is `VITE_KV_URL` (`src/shareStore.ts`):
`.env.development` points `npm run dev` at the dev store, and builds use the
production store (`npm run build:dev` builds against the dev store). Links
only resolve against the store they were made in.

Data from other backends opens with
`?fromURL=<url>[&format=<fmt>][&tag=<name>]`, where `tag` names it in the
history; sharing it uploads a copy to the kv-store.
