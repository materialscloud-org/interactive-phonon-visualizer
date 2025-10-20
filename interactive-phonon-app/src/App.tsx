import { useEffect, useState } from "react";
import { Tab, Tabs } from "react-bootstrap";

import AboutPanel from "./components/about/AboutPanel";
import AcknowledgePanel from "./components/acknowledge/AcknowledgePanel";
import PhononsPanel from "./components/phonons/PhononsPanel";

import "./App.scss";

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
  );
}

export default App;
