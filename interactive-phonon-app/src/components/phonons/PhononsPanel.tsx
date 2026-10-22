import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { McHistoryList } from "mc-react-library";
import { VisualizerProps } from "./formats";
import { convertQEPhonon } from "./convert";
import {
  buttonClass,
  fileInputClass,
  labelClass,
  selectClass,
} from "../styles";
import {
  HistoryEntry,
  addToHistory,
  clearHistory,
  findBySource,
  loadHistory,
  removeFromHistory,
} from "./history";
import { readPhonons } from "./formats";
import { SharedSource, fetchPhonons, getSharedSource } from "./share";

const Card = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="h-full overflow-hidden rounded border border-slate-200 bg-white shadow-sm">
    <div className="border-b border-slate-200 bg-blue-50 px-4 py-2.5 text-center font-medium text-slate-800">
      {title}
    </div>
    <div className="p-4">{children}</div>
  </div>
);

const FileField = ({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) => (
  <div>
    <label className={labelClass} htmlFor={id}>
      {children}
    </label>
    <input type="file" id={id} className={fileInputClass} />
  </div>
);

const PhononsPanel = ({
  onLoaded,
}: {
  onLoaded: (data: VisualizerProps, source?: SharedSource) => void;
}) => {
  const [inputFormat, setInputFormat] = useState("Quantum ESPRESSO");
  const [history, setHistory] = useState<HistoryEntry[]>(loadHistory);

  const [errorMessage, setErrorMessage] = useState("");
  const [loadingShared, setLoadingShared] = useState(false);

  // Load data from a share link (?<id> or ?fromURL=...). Data already in
  // the history is taken from there instead of fetched again.
  useEffect(() => {
    const source = getSharedSource();
    if (!source) return;

    const existing = findBySource(source);
    if (existing) {
      onLoaded(existing.phonons, source);
      return;
    }

    setLoadingShared(true);
    fetchPhonons(source)
      .then((data) => {
        // StrictMode runs this effect twice in dev; don't record it twice
        if (!findBySource(source))
          setHistory(addToHistory(data, "Shared", source));
        onLoaded(data, source);
      })
      .catch((error: unknown) =>
        setErrorMessage(
          `Loading shared data failed: ${error instanceof Error ? error.message : error}`,
        ),
      )
      .finally(() => setLoadingShared(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // remove error message after some time
  useEffect(() => {
    if (!errorMessage) return;

    const timer = setTimeout(() => {
      setErrorMessage("");
    }, 3000);

    return () => clearTimeout(timer);
  }, [errorMessage]);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const form = event.currentTarget;

      let data: VisualizerProps | null = null;

      try {
        if (form.id === "exampleForm") {
          const select = form.querySelector(
            "#exampleSelector",
          ) as HTMLSelectElement;
          if (!select?.value) return;

          const res = await axios.get(`/data/${select.value}.json`);
          data = readPhonons(res.data);
        } else if (form.id === "fileForm") {
          if (inputFormat === "PhononVis") {
            const file = (
              form.querySelector("#phonon_json_file") as HTMLInputElement
            )?.files?.[0];
            if (!file) {
              throw new Error("Please select a JSON file");
            }

            const text = await file.text();
            data = readPhonons(JSON.parse(text), "phononvis");
            setHistory(addToHistory(data, "PhononVis"));
          } else {
            const [pwInput, pwOutput, matdyn] = [
              "pw_input_file",
              "pw_output_file",
              "matdyn_file",
            ].map(
              (id) =>
                (form.querySelector(`#${id}`) as HTMLInputElement)?.files?.[0],
            );
            if (!pwInput || !matdyn)
              throw new Error(
                "Please select the pw.x input and the matdyn.x modes files",
              );

            data = await convertQEPhonon(
              await pwInput.text(),
              await matdyn.text(),
              await pwOutput?.text(),
            );
            setHistory(addToHistory(data, "QE"));
          }
        }

        if (data) onLoaded(data);
      } catch (error: unknown) {
        console.error("Failed to fetch data:", error);

        setErrorMessage(
          error instanceof Error && error.message
            ? `Parsing of input failed: ${error.message}`
            : "Parsing of input failed. Please check your files or try again.",
        );
      }
    },
    [inputFormat, onLoaded],
  );

  return (
    <>
      {errorMessage && (
        <div className="fixed top-1/2 left-1/2 z-[9999] -translate-x-1/2 translate-y-full animate-[fade-out-late_3s_forwards] rounded border-[1.5px] border-red-600 bg-red-200/75 px-2 py-1 text-center text-2xl text-red-600 shadow-lg">
          {`⚠️ ${errorMessage}`}
        </div>
      )}
      <div className="grid gap-3 md:grid-cols-[2fr_1fr]">
        <Card title="Upload your files">
          <div className="mb-3">
            <label className={labelClass} htmlFor="inputFormat">
              Input format
            </label>
            <select
              id="inputFormat"
              className={selectClass}
              value={inputFormat}
              onChange={(e) => setInputFormat(e.target.value)}
            >
              <option>Quantum ESPRESSO</option>
              <option>PhononVis</option>
            </select>
          </div>
          <form id="fileForm" onSubmit={handleSubmit} className="space-y-3">
            {inputFormat === "Quantum ESPRESSO" ? (
              <>
                <FileField id="pw_input_file">
                  Quantum ESPRESSO <strong>pw.x</strong> input (SCF run)
                </FileField>
                <FileField id="pw_output_file">
                  Quantum ESPRESSO <strong>pw.x</strong> output (SCF run,
                  optional)
                </FileField>
                <FileField id="matdyn_file">
                  Quantum ESPRESSO <strong>matdyn.x</strong> displacement modes
                  output (see <strong>flvec</strong> input flag)
                </FileField>
              </>
            ) : (
              <FileField id="phonon_json_file">
                JSON from phonon-web-tools
              </FileField>
            )}
            <button type="submit" className={buttonClass}>
              Calculate phonon dispersion
            </button>
          </form>
        </Card>

        <Card title="Try an example">
          <form id="exampleForm" onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className={labelClass} htmlFor="exampleSelector">
                Example
              </label>
              <select id="exampleSelector" className={selectClass}>
                <option value="Bi">Bi (2D)</option>
                <option value="BN">BN (2D)</option>
                <option value="graphene">C (graphene) (2D)</option>
                <option value="PbI2">PbI₂ (2D)</option>
                <option value="MoS2">MoS₂ (2D)</option>
                <option value="PbTe">PbTe (2D)</option>
                <option value="AgNO2">AgNO₂ (2D)</option>
                <option value="BaTiO3">BaTiO₃ (3D)</option>
              </select>
            </div>
            <button type="submit" className={buttonClass}>
              Calculate phonon dispersion
            </button>
          </form>
        </Card>
      </div>
      {loadingShared && (
        <p className="m-0 text-center text-sm text-slate-500">
          Loading shared data…
        </p>
      )}
      <McHistoryList
        title="Previously loaded phonons"
        entries={history}
        onLoad={(entry: HistoryEntry) => onLoaded(entry.phonons, entry.source)}
        onDelete={(id: string) => setHistory(removeFromHistory(id))}
        onClear={() => setHistory(clearHistory())}
      />
      <p className="m-0 text-center text-xs text-slate-400">
        By continuing you agree to our <a href="#terms">Terms of service</a>
      </p>
    </>
  );
};

export default PhononsPanel;
