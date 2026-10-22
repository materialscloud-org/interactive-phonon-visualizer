import { useState } from "react";

import MaterialsCloudHeader from "mc-react-header";
import { McInfoAccordion } from "mc-react-library";

import {
  OverviewSection,
  SupportedInputsSection,
  AcknowledgePanel,
} from "./components/AccordionContent";

import PhononsPanel from "./components/phonons/PhononsPanel";
import TermsModal from "./components/TermsModal";
import VisualizerPanel from "./components/phonons/VisualizerPanel";
import { VisualizerProps } from "./components/phonons/formats";
import { SharedSource, syncAddressBar } from "./components/phonons/share";

const ACCORDIONS = [
  { title: "What the phonon visualizer does", content: <OverviewSection /> },
  { title: "Supported input files", content: <SupportedInputsSection /> },
  { title: "Acknowledgements", content: <AcknowledgePanel /> },
];

function App() {
  const [openAccordion, setOpenAccordion] = useState<number | null>(null);
  const [visualizerProps, setVisualizerProps] =
    useState<VisualizerProps | null>(null);
  // where the data on screen is shared from, once it has been shared
  const [source, setSource] = useState<SharedSource | undefined>();

  const showPhonons = (data: VisualizerProps, from?: SharedSource) => {
    setVisualizerProps(data);
    setSource(from);
    syncAddressBar(from);
  };

  const handleShared = (shared: SharedSource) => {
    setSource(shared);
    syncAddressBar(shared);
  };

  return (
    <>
      <MaterialsCloudHeader
        activeSection={"work"}
        breadcrumbsPath={[
          { name: "Work", link: "https://www.materialscloud.org/work" },
          { name: "Tools", link: "https://www.materialscloud.org/work/tools" },
          {
            name: "Interactive phonon visualizer",
            link: null,
          },
        ]}
      />

      <main className="min-h-screen bg-[aliceblue] pb-10">
        <div className="mx-auto max-w-7xl px-4">
          <div className="overflow-hidden bg-white shadow-sm">
            <h1 className="m-0 pt-4 text-center text-2xl font-normal tracking-tight text-slate-900 sm:text-3xl">
              Interactive phonon visualizer
            </h1>

            <div className="mx-auto max-w-6xl space-y-3 px-6 py-8 sm:px-10">
              {ACCORDIONS.map(({ title, content }, idx) => (
                <McInfoAccordion
                  key={title}
                  title={title}
                  open={openAccordion === idx}
                  onToggle={() =>
                    setOpenAccordion(openAccordion === idx ? null : idx)
                  }
                >
                  {content}
                </McInfoAccordion>
              ))}
              <PhononsPanel onLoaded={showPhonons} />
            </div>

            {visualizerProps && (
              <div className="px-6 pt-4 pb-8">
                <VisualizerPanel
                  props={visualizerProps}
                  source={source}
                  onShared={handleShared}
                />
              </div>
            )}
          </div>
        </div>
      </main>

      <TermsModal />
    </>
  );
}

export default App;
