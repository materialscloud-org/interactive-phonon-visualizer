import { useContext, useEffect, useRef, useState } from "react";
import { Card, Button } from "react-bootstrap";

import { Atoms, WEAS } from "weas";

import ParametersContext from "./ParametersContext";
import { VisualizerProps } from "./types";

import "./CellView.scss";

const defaultGuiConfig = {
  controls: {
    enabled: false,
    atomsControl: false,
    colorControl: false,
    cameraControls: false,
    buttons: false,
  },
  buttons: {
    enabled: false,
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
  const [isPlaying, setIsPlaying] = useState(false);
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
      factor: vectorLength / (amplitude * 5),
      nframes: 10 / speed,
      kpoint: props.qpoints[q],
      repeat: [nx, ny, nz],
    });
    weas.avr.boundary = [
      [-0.01, 1.01],
      [-0.01, 1.01],
      [-0.01, 1.01],
    ];

    if (q == 0 && e == 0) {
      // pause the animation at start as it can be demanding
      weas.avr.pause();
    }
    setIsPlaying(weas.avr.isPlaying);
    weas.avr.frameDuration = 15 / speed;
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

  const togglePlay = () => {
    if (weasRef.current) {
      if (weasRef.current.avr.isPlaying) {
        weasRef.current.avr.pause();
        setIsPlaying(false);
      } else {
        weasRef.current.avr.play();
        setIsPlaying(true);
      }
    }
  };

  return (
    <Card>
      <Card.Header>Drag to rotate, scroll to zoom</Card.Header>
      <Card.Body className="p-0">
        <InteractionGuard>
          <div
            className="weas-container"
            ref={viewerRef}
            style={{ width: "100%", height: "450px" }}
          ></div>
        </InteractionGuard>
        <Button className="play-button" size="sm" onClick={togglePlay}>
          {isPlaying ? (
            <i className="bi bi-pause-fill"></i>
          ) : (
            <i className="bi bi-play-fill"></i>
          )}
        </Button>
      </Card.Body>
    </Card>
  );
};

const InteractionGuard = ({ children }: { children: React.ReactNode }) => {
  const [isInteractive, setIsInteractive] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  let mouseNoteClass = "mouse-interact-note";
  if (isInteractive) {
    mouseNoteClass += " off";
  }

  let guardClassName = "";
  if (!isInteractive) guardClassName += " disable-mouse";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsInteractive(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div ref={wrapperRef} onClick={() => setIsInteractive(true)}>
      <div className={guardClassName}>{children}</div>
      <div className={mouseNoteClass} onClick={() => setIsInteractive(true)}>
        Click to interact
      </div>
    </div>
  );
};

export default CellView;
