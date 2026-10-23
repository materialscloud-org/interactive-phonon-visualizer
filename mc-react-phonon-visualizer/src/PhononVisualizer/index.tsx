import { useCallback, useState, useEffect } from "react";

import { PlotMouseEvent } from "plotly.js";

import ParametersContext from "./ParametersContext";
import { VisualizerProps } from "./types";
import useParameters from "./useParameters";

import MemoizedBandsView from "./BandsView";

import CellView from "./CellView";
import MemoizedControlsPanel from "./ControlsPanel";

import "./PhononVisualizer.css";

const PhononVisualizer = ({ props }: { props: VisualizerProps }) => {
  const parameters = useParameters(props.repetitions);
  const [mode, setMode] = useState<number[]>([0, 0]);
  const { fastMode = true } = props;

  const updateMode = useCallback(
    (event: PlotMouseEvent) => {
      const q = props.distances.indexOf(event.points[0].x as number);
      const e = props.eigenvalues[q].indexOf(event.points[0].y as number);
      setMode([q, e]);
    },
    [props],
  );

  const bandsProps = {
    distances: props.distances,
    highSymPoints: props.highsym_qpts,
    eigenvalues: props.eigenvalues,
    updateMode,
    plotlyLayoutFormat: props.plotlyLayoutFormat,
    plotlyTraceFormat: props.plotlyTraceFormat,
    plotlyHoverTraceFormat: props.plotlyHoverTraceFormat,
    plotlySelectedTraceFormat: props.plotlySelectedTraceFormat,
  };

  return (
    <ParametersContext.Provider value={parameters}>
      <div className="pv-layout">
        <div className="visualizer-panel">
          <MemoizedControlsPanel />
        </div>
        <div className="visualizer-panel">
          <CellView props={props} mode={mode} />
        </div>
        <div className="visualizer-panel">
          {fastMode ? (
            <MemoizedBandsView {...bandsProps} /> // fastmode
          ) : (
            <MemoizedBandsView {...bandsProps} /> // default
          )}
        </div>
      </div>
    </ParametersContext.Provider>
  );
};

export default PhononVisualizer;
