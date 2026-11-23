import { VisualizerProps } from "./formats";

import PhononVisualizer from "mc-react-phonon-visualizer";
import { McResults } from "mc-react-library";
// Current policy is no mc-keyvalues-stores allowed in apps
// import { McShareButton } from "mc-react-library";

import { buttonClass } from "../styles";
import { serializePhonons } from "./formats";
// Current policy is no mc-keyvalues-stores allowed in apps
// import { SharedSource, kvShareId, kvSource } from "./share";
// import { KV_URL } from "../../shareStore";

// Current policy is no mc-keyvalues-stores allowed in apps: no source / onShared (the share link of the data shown)
const VisualizerPanel = ({ props }: { props: VisualizerProps | null }) => {
  // results render below the inputs: McResults brings them into view on load
  return (
    <McResults resultKey={props}>
      {props && (
        <h2 className="mb-4 text-center text-xl font-normal text-slate-900">
          Phonon dispersion{props.title ? `: ${props.title}` : ""}
        </h2>
      )}
      {props && <PhononVisualizer props={props} />}

      {/* Current policy is no mc-keyvalues-stores allowed in apps. The Share button
          wrapped the row below:
      <McShareButton
        data={props}
        kvUrl={KV_URL}
        shareId={kvShareId(source)}
        onShared={(id: string) => onShared(kvSource(id))}
      >
        {({ button, error, result }: Record<string, React.ReactNode>) => (
          <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
            {error}
            {result}
            {button}
            <button ... Download JSON
        )}
      </McShareButton>
      (Data opened from one of our share links was shared by that link;
      anything else, files and ?fromURL=, was uploaded to the kv-store.) */}
      <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          className={buttonClass}
          onClick={() => {
            if (!props) return;
            const blob = new Blob([serializePhonons(props)], {
              type: "application/json",
            });
            const url = URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = url;
            a.download = `interactive_phonon_vis.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            URL.revokeObjectURL(url);
          }}
        >
          <i className="bi bi-download" /> Download JSON
        </button>
      </div>
    </McResults>
  );
};

export default VisualizerPanel;
