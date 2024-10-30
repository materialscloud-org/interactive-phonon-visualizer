import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { Card } from "react-bootstrap";

import { Atoms, WEAS } from "weas";

import ParametersContext from "./ParametersContext";
import { VisualizerProps } from "./types";

import "./CellView.scss";

const defaultGuiConfig = {
  components: {
    enabled: false,
    atomsControl: true,
    colorControl: true,
    cameraControls: false,
    buttons: true,
  },
  buttons: {
    enabled: true,
    fullscreen: true,
    undo: false,
    redo: false,
    download: true,
    measurement: false,
  },
};

const CellView = ({
  props,
  mode,
}: {
  props: VisualizerProps;
  mode: number[];
}) => {
  const [isInteractive, setIsInteractive] = useState(false);
  const viewerRef = useRef<HTMLDivElement | null>(null);
  const weasRef = useRef<WEAS | null>(null);
  const {
    nx,
    ny,
    nz,
    cameraDirection,
    showCell,
    amplitude,
    vectorLength,
    showVectors,
    speed,
    // isAnimated,
  } = useContext(ParametersContext);

  const toggleOverlay = useCallback(() => {
    setIsInteractive((prevState) => !prevState);
  }, []);

  const Overlay = () => (
    <div className="overlay-div">
      <span>
        Double-click to toggle interactions on and off <br />{" "}
        <small>(This feature is not available on iPad and iPhone)</small>
      </span>
    </div>
  );

  useEffect(() => {
    const [q, e] = mode;

    const atoms = new Atoms({
      symbols: props.atom_types,
      positions: props.atom_pos_car,
      cell: props.lattice,
    });

    if (!weasRef.current) {
      const weas = new WEAS({
        domElement: viewerRef.current,
        guiConfig: defaultGuiConfig,
        viewerConfig: { backgroundColor: "#0000FF" },
      });
      weas.avr.modelStyle = 1;
      weas.avr.bondedAtoms = true;
      weas.avr.atomScale = 0.1;
      weas.avr.bondManager.hideLongBonds = false;
      weasRef.current = weas;
    }

    const weas: WEAS = weasRef.current;

    weas.clear();
    weas.avr.fromPhononMode({
      atoms: atoms,
      eigenvectors: props.vectors[q][e],
      amplitude: amplitude * 5,
      nframes: 20 / speed,
      kpoint: props.qpoints[q],
      repeat: [nx, ny, nz],
    });
    weas.avr.boundary = [
      [-0.01, 1.01],
      [-0.01, 1.01],
      [-0.01, 1.01],
    ];

    if (q == 0 && e == 0) {
      // pause the animation at start as it can be quite demanding
      weas.avr.pause();
    }
    weas.avr.frameDuration = 4 / speed;
    weas.avr.tjs.updateCameraAndControls({ direction: cameraDirection });
    weas.avr.showCell = showCell;
    weas.avr.VFManager.show = showVectors;
    weas.avr.drawModels();
    weas.render();
  }, [
    amplitude,
    mode,
    props,
    speed,
    showCell,
    showVectors,
    cameraDirection,
    nx,
    ny,
    nz,
    vectorLength,
  ]);

  return (
    <Card>
      <Card.Header>Drag to rotate, scroll to zoom</Card.Header>
      <Card.Body onDoubleClick={toggleOverlay} style={{paddingBottom: "40px"}}>
        {!isInteractive && <Overlay />}
        <div ref={viewerRef} style={{ width: "100%", height: "450px" }}></div>
      </Card.Body>
    </Card>
  );
};

export default CellView;
