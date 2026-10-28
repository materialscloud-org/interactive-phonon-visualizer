import { useState } from "react";

import MaterialsCloudHeader from "mc-react-header";
import { McAppHeader } from "mc-react-library";

import InfoAccordions from "./components/AccordionContent";

import PhononsPanel from "./components/phonons/PhononsPanel";
import TermsModal from "./components/TermsModal";
import VisualizerPanel from "./components/phonons/VisualizerPanel";
import { VisualizerProps } from "./components/phonons/formats";
import { SharedSource, syncAddressBar } from "./components/phonons/share";

function App() {
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

      {/* p-[1rem] etc. rather than p-4: Bootstrap's own p-4/px-4/py-4 are
          !important and would win. */}
      <main className="min-h-screen bg-[aliceblue] pb-10">
        <div className="mx-auto max-w-7xl px-[1rem]">
          <div className="overflow-hidden bg-white p-[1rem] shadow-sm">
            <McAppHeader
              title="Interactive phonon visualizer"
              logo={`${import.meta.env.BASE_URL}interactivephonon.png`}
              logoAlt="Interactive phonon visualizer logo"
            />

            <div className="mx-auto max-w-4xl px-6 py-8 sm:px-10">
              <div className="space-y-3">
                <InfoAccordions />
                <PhononsPanel onLoaded={showPhonons} />
              </div>
            </div>

            {visualizerProps && (
              <div className="mx-auto max-w-6xl px-6 py-[1rem] sm:px-10">
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
