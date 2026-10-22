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

### Share store

`VITE_SHARE_STORE` selects the share store at dev/build time (see
`src/shareStore.ts`):

| `VITE_SHARE_STORE` | Store                                     |
| ------------------ | ----------------------------------------- |
| `dev` (default)    | `https://kv-store.dev.materialscloud.org` |
| `production`       | `https://kv-store.materialscloud.org`     |

| Script                | Share store |
| --------------------- | ----------- |
| `npm run dev`         | dev         |
| `npm run dev:be-prod` | production  |
| `npm run build:dev`   | dev         |
| `npm run build:prod`  | production  |

Share links (`?<id>`) only resolve against the store they were created in,
so links made on a dev deployment do not open on production. Data loaded
from other backends uses `?fromURL=<url>[&format=<fmt>]`.
