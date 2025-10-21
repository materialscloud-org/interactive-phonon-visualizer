import { useCallback, useState } from "react";

import axios from "axios";

import { VisualizerProps } from "./interfaces";
import SelectPanel from "./select/SelectPanel";
import VisualizerPanel from "./VisualizerPanel";

const API_ROOT = "http://localhost:5000";

async function get_example_data(name: string) {
  // Load example JSON files from the public/data folder.
  try {
    const response = await axios.get(`/data/${name}.json`);
    return response.data;
  } catch (error) {
    console.error("Error fetching data:", error);
    return null;
  }
}

const PhononsPanel = ({
  aboutLinkHandler,
}: {
  aboutLinkHandler: CallableFunction;
}) => {
  const [currentPanel, setCurrentPanel] = useState("select");
  const [visualizerProps, setVisualizerProps] =
    useState<VisualizerProps | null>(null);

  const formHandler = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      const handleExampleForm = async (form: HTMLFormElement) => {
        const example = form.querySelector("select");
        if (!example || !example.value) {
          throw new Error("Example not found");
        }
        setVisualizerProps(null);
        const result = await get_example_data(example.value);
        setVisualizerProps({ title: result.name, ...result });
      };

      const handleFileForm = (form: HTMLFormElement) => {
        const inputFormat = form.querySelector("select")?.value;
        if (inputFormat === "Quantum ESPRESSO") {
          ("");
        } else if (inputFormat === "PhononVis") {
          ("");
        } else {
          throw new Error("Invalid input format");
        }
      };
      event.preventDefault();
      const form = event.currentTarget;
      if (form.id == "exampleForm") {
        handleExampleForm(form);
      } else if (form.id == "fileForm") {
        handleFileForm(form);
      } else {
        throw new Error("Invalid form ID");
      }
      setCurrentPanel("visualizer");
    },
    []
  );

  const switchToSelectPanel = useCallback(() => {
    setCurrentPanel("select");
  }, []);

  return (
    <>
      {currentPanel == "select" ? (
        <SelectPanel
          aboutLinkHandler={aboutLinkHandler}
          formHandler={formHandler}
        />
      ) : (
        <VisualizerPanel
          callback={switchToSelectPanel}
          props={visualizerProps}
        />
      )}
    </>
  );
};

export default PhononsPanel;
