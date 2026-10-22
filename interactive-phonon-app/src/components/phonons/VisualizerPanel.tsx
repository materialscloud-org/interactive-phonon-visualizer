import { useEffect, useRef, useState } from "react";

import { VisualizerProps } from "./formats";

import PhononVisualizer from "mc-react-phonon-visualizer";

import { buttonClass, secondaryButtonClass } from "../styles";
import { serializePhonons } from "./formats";
import { SharedSource, shareLinkFor, uploadPhonons } from "./share";
import { SHARE_STORE_NAME, SHARE_STORE_URL } from "../../shareStore";

type ShareState =
  | { status: "idle" }
  | { status: "uploading" }
  | { status: "done"; link: string; copied: boolean }
  | { status: "error"; message: string };

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
  const [share, setShare] = useState<ShareState>({ status: "idle" });

  useEffect(() => setShare({ status: "idle" }), [props]);

  const copyLink = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      return true;
    } catch {
      return false; // e.g. no clipboard access; the link is still shown
    }
  };

  // Data opened from a link (our kv-store or another backend) is shared by
  // that same link rather than uploaded again.
  const handleShare = async () => {
    if (!props) return;
    setShare({ status: "uploading" });
    try {
      let shared = source;
      if (!shared) {
        shared = await uploadPhonons(props);
        onShared(shared);
      }
      const link = shareLinkFor(shared);
      setShare({ status: "done", link, copied: await copyLink(link) });
    } catch (error) {
      setShare({
        status: "error",
        message: `Sharing failed: ${error instanceof Error ? error.message : error}`,
      });
    }
  };

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

      <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          className={secondaryButtonClass}
          onClick={handleShare}
          disabled={share.status === "uploading"}
        >
          <i className="bi bi-share" />{" "}
          {share.status === "uploading" ? "Sharing…" : "Share"}
        </button>
        {/* Download JSON button */}
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

      {share.status === "error" && (
        <p className="mt-2 mb-0 text-right text-sm text-red-600">
          {share.message}
        </p>
      )}
      {share.status === "done" && (
        <div className="mt-3 ml-auto max-w-2xl rounded border border-slate-200 bg-slate-50 p-3 text-sm">
          <div className="flex gap-2">
            <input
              readOnly
              value={share.link}
              onFocus={(e) => e.target.select()}
              aria-label="Share link"
              className="min-w-0 flex-1 rounded border border-slate-300 bg-white px-2 py-1 font-mono text-xs text-slate-700"
            />
            <button
              type="button"
              className={secondaryButtonClass}
              onClick={async () =>
                setShare({
                  ...share,
                  copied: await copyLink(share.link),
                })
              }
            >
              <i className="bi bi-clipboard" /> Copy
            </button>
          </div>
          <p className="mt-2 mb-0 text-xs text-slate-500">
            {share.copied && "Link copied to clipboard. "}
            Anyone with this link can view the data. It is stored on{" "}
            {new URL(SHARE_STORE_URL).host}
            {SHARE_STORE_NAME === "dev" && " (development store)"} and expires
            after 30 days.
          </p>
        </div>
      )}
    </div>
  );
};

export default VisualizerPanel;
