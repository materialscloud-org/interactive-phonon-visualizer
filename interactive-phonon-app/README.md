# Interactive phonons visualizer

This repository houses the Materials Cloud interactive phonons visualizer React app.

### Development

- clone this repo
- install `node.js` (includes `npm`) from [official site](https://nodejs.org/)
- install dependencies with `npm install`
- install backend dependencies with `pip install -r requirements.txt`
- launch the backend with `python api/app.py`
- launch the app with `npm start`

### Build the docker image

```
rm -rf  public/data # remove symlinks
cp -r ../data public/data/. #
docker build -t interactive-phonon-app . # build
rm -rf public/data # remove files
ln -s ../../data public/data # re-establish symlinks
```
