import { useCallback, useState } from "react";

import axios from "axios";

import { VisualizerProps } from "./interfaces";
import SelectPanel from "./select/SelectPanel";
import VisualizerPanel from "./visualize/VisualizerPanel";

const API_ROOT = "http://localhost:5000";

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
        const result = await axios.post(`${API_ROOT}/process_example`, {
          example: example.value,
        });
        setVisualizerProps({ title: result.data.title, ...result.data });
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
