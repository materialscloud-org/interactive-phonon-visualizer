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
    atomScale,
    // isAnimated,
  } = useContext(ParametersContext);

  // track initialisation
  const isFirstRender = useRef(true);

  useEffect(() => {
    const [q, e] = mode;
    // Initialize WEAS
    if (!weasRef.current) {
      const weasInstance = new WEAS({
        domElement: viewerRef.current,
        guiConfig: defaultGuiConfig,
        viewerConfig: { backgroundColor: "#0000FF" },
      });
      weasInstance.avr.modelStyle = 1;
      weasInstance.avr.bondedAtoms = true;
      weasInstance.avr.atomScale = atomScale;
      weasInstance.avr.bondManager.hideLongBonds = false;
      weasRef.current = weasInstance;
    }

    const weas: WEAS = weasRef.current;
    // Save camera BEFORE clearing/updating
    let savedCameraPos: any;
    let savedTarget: any;

    if (!isFirstRender.current) {
      savedCameraPos = weas.avr.tjs.camera.position.clone();
      savedTarget = weas.avr.tjs.controls.target.clone();
    }

    const atoms = new Atoms({
      symbols: props.atom_types,
      positions: props.atom_pos_car,
      cell: props.lattice,
    });

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

    if (isPlaying) weas.avr.play();
    else weas.avr.pause();

    weas.avr.frameDuration = 15 / speed;

    // use init state to determine whether to update camera.
    if (isFirstRender.current) {
      weas.avr.tjs.updateCameraAndControls({ direction: cameraDirection });
      isFirstRender.current = false;
    } else if (savedCameraPos && savedTarget) {
      weas.avr.tjs.camera.position.copy(savedCameraPos);
      weas.avr.tjs.controls.target.copy(savedTarget);
      weas.avr.tjs.controls.update();
    }

    weas.avr.showCell = showCell;
    weas.avr.VFManager.show = showVectors;

    weas.avr.atomScale = atomScale;
    // for reasons unknown i have to hook into each entry in _atomScales...
    for (let i = 0; i < weas.avr._atomScales.length; i++) {
      weas.avr._atomScales[i] = atomScale;
    }
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
    atomScale,
  ]);

  // Track last applied camera to avoid unnecessary updates
  const lastCameraDirection = useRef(cameraDirection);

  useEffect(() => {
    if (!weasRef.current) return;

    const cameraChanged =
      cameraDirection[0] !== lastCameraDirection.current[0] ||
      cameraDirection[1] !== lastCameraDirection.current[1] ||
      cameraDirection[2] !== lastCameraDirection.current[2];

    if (cameraChanged) {
      weasRef.current.avr.tjs.updateCameraAndControls({
        direction: cameraDirection,
      });
      lastCameraDirection.current = cameraDirection;
    }
  }, [cameraDirection]);

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
