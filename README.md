# Phonon visualizer React component for the MaterialsCloud

The React component implemented in this repo mimics the features of the [phonon visualizer](https://henriquemiranda.github.io/phononwebsite/) developed by [Henrique Miranda](https://henriquemiranda.github.io/) and used in the MaterialsCloud.

## Dependencies

- `sass`, `bootstrap`, and `bootstrap-icons` for styles
- `react-plotly.js` for the phonon bands view
- `WEAS` for the cell view

## Testing

The app is self-tested via the `App` component against local test data (`/data/test.json`).

## Publishing a new version

To make a new version and publish to npm via GitHub Actions:

```bash
npm version <major/minor/patch>
git push --follow-tags
```
