import { useEffect, useState } from "react";
import { Container, Tab, Tabs } from "react-bootstrap";

import AboutPanel from "./components/about/AboutPanel";
import AcknowledgePanel from "./components/acknowledge/AcknowledgePanel";
import PhononsPanel from "./components/phonons/PhononsPanel";

import MaterialsCloudHeader from "mc-react-header";

import "./App.scss";
import { Header } from "./components/header";

function App() {
  const [currentTab, setCurrentTab] = useState("phonons");
  const [focusSection, setFocusSection] = useState<string | null>(null);

  const showAboutSection = (section: string) => {
    setCurrentTab("about");
    setFocusSection(section);
  };

  useEffect(() => {
    currentTab != "about" && setFocusSection(null);
  }, [currentTab]);

  return (
    <div style={{ padding: "0px" }}>
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
      <div style={{ maxWidth: "1350px", margin: "0 auto" }}>
        <Header
          title={"Interactive phonon visualizer"}
          subtitle={
            "A tool for the interactive visualization and inspection of lattice vibrations."
          }
          doi_ids={[]}
          logo={"./interactivephonon.png"}
        />

        <Container
          fluid="xxl"
          style={{ padding: "0px 0px 25px 0px", maxWidth: "1350px" }}
        >
          <Tabs
            activeKey={currentTab}
            onSelect={(key) => {
              setCurrentTab(key || "phonons");
              setFocusSection(null);
            }}
          >
            <Tab eventKey="phonons" title="Phonons">
              <PhononsPanel aboutLinkHandler={showAboutSection} />
            </Tab>
            <Tab eventKey="about" title="About">
              <AboutPanel focusSection={focusSection} />
            </Tab>
            <Tab eventKey="acknowledge" title="Acknowledgements">
              <AcknowledgePanel />
            </Tab>
          </Tabs>
        </Container>
      </div>
    </div>
  );
}

export default App;
