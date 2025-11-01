import PhononVisualizer from "./PhononVisualizer";

import data from "../../data/RhSi2Y2-supercon.json";

import "./App.scss";

function App() {
  return (
    <div>
      {/* Pass as any to avoid ts problems. */}
      <PhononVisualizer
        props={{ title: "Demo", fastMode: false, ...data } as any}
      />

      {/* Pass as any to avoid ts problems. */}
      <PhononVisualizer
        props={{ title: "Demo", fastMode: true, ...data } as any}
      />
    </div>
  );
}

export default App;
