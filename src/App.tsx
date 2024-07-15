import PhononVisualizer from "./components/PhononVisualizer";

import data from "../data/test.json";

import "./App.scss";

function App() {
  return (
    // @ts-expect-error otherwise, each part of data would need unpacking
    <PhononVisualizer props={{ title: "Demo", ...data }} />
  );
}

export default App;
