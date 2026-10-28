import { useEffect, useRef } from "react";

import { VisualizerProps } from "./formats";

import PhononVisualizer from "mc-react-phonon-visualizer";
import { McShareButton } from "mc-react-library";

import { buttonClass } from "../styles";
import { serializePhonons } from "./formats";
import { SharedSource, kvShareId, kvSource } from "./share";
import { KV_URL } from "../../shareStore";

const VisualizerPanel = ({
  props,
  source,
  onShared,
}: {
  props: VisualizerProps | null;
  source?: SharedSource;
  onShared: (source: SharedSource) => void;
}) => {
  const ref = useRef<HTMLDivElement>(null);

  // results render below the inputs, so bring them into view on load
  useEffect(() => {
    if (props) ref.current?.scrollIntoView({ behavior: "smooth" });
  }, [props]);

  return (
    <div ref={ref}>
      {props && (
        <h2 className="mb-4 text-center text-xl font-normal text-slate-900">
          Phonon dispersion{props.title ? `: ${props.title}` : ""}
        </h2>
      )}
      {props && <PhononVisualizer props={props} />}

      {/* Data opened from one of our share links is shared by that link;
          anything else (files, ?fromURL=) is uploaded to the kv-store. */}
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
        )}
      </McShareButton>
    </div>
  );
};

export default VisualizerPanel;
