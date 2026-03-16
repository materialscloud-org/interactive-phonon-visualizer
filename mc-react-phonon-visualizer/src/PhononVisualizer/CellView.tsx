import { useContext, useEffect, useRef, useState } from "react";
import { Card, Button } from "react-bootstrap";

import * as THREE from "three";
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

// function to determine the zoom scale and centering of a set of atoms such that they fit nicely in the pane
function calculateCenteringAndZoom(
  nx: number,
  ny: number,
  nz: number,
  lattice: number[][],
  zoomRatio: number = 15,
): { center: THREE.Vector3; zoom: number } {
  // Convert lattice vectors to THREE.Vector3
  const a = new THREE.Vector3(...lattice[0]).multiplyScalar(nx);
  const b = new THREE.Vector3(...lattice[1]).multiplyScalar(ny);
  const c = new THREE.Vector3(...lattice[2]).multiplyScalar(nz);

  // Supercell corners are all combinations of 0/1 scaling of each vector
  const corners = [
    new THREE.Vector3(0, 0, 0),
    a.clone(),
    b.clone(),
    c.clone(),
    a.clone().add(b),
    a.clone().add(c),
    b.clone().add(c),
    a.clone().add(b).add(c),
  ];

  // Find bounding box
  const bbox = new THREE.Box3().setFromPoints(corners);

  // Center is the midpoint
  const center = new THREE.Vector3();
  bbox.getCenter(center);

  // Zoom factor: take the max length of the box along any axis
  const size = new THREE.Vector3();
  bbox.getSize(size);
  const maxDim = Math.max(size.x, size.y, size.z);

  const zoom = zoomRatio / maxDim;

  return { center, zoom };
}

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
        keybindConfig: {},
      });
      weasInstance.avr.modelStyle = 1;
      // weasInstance.avr.bondedAtoms = true;
      weasInstance.avr.atomScale = atomScale;
      // weasInstance.avr.bondManager.hideLongBonds = false;
      weasRef.current = weasInstance;
      window.weas = weasInstance;
    }

    const weas: WEAS = weasRef.current;
    // Save camera BEFORE clearing/updating
    let savedCameraPos: any;
    let savedTarget: any;

    // Hide all HTML panels
    const hud = weas.tjs.hud;
    hud.htmlElements.forEach((panel, key) => {
      hud.setHTMLPanelVisible(key, false);
    });

    // make the coords smallers
    const coordBox = hud.miniScenes.get("coord");
    if (coordBox) {
      coordBox.width = 100;
      coordBox.height = 100;
      coordBox.canvas.width = coordBox.width;
      coordBox.canvas.height = coordBox.height;
      coordBox.visible = true;
    }

    let savedState;
    if (!isFirstRender.current) {
      savedState = weas.tjs.cameraController.exportState();
    }

    if (savedState) {
      weas.tjs.cameraController.importState(savedState);
    }

    const atoms = new Atoms({
      symbols: props.atom_types,
      positions: props.atom_pos_car,
      cell: props.lattice,
    });

    weas.clear();
    // Really bad hack to clear phonons.
    // Related to issue #112 in weas
    // https://github.com/superstar54/weas/issues/112
    weas.clear(weas.tjs.scene.children.at(-1).uuid);

    // rerender
    weas.avr.fromPhononMode({
      atoms: atoms,
      eigenvectors: props.vectors[q][e],
      amplitude: amplitude * 5,
      factor: vectorLength / (amplitude * 5),
      nframes: 10 / speed,
      kpoint: props.qpoints[q],
      repeat: [nx, ny, nz],
    });
    // use a large boundary padding
    // hanging atoms are better than hanging bonds
    weas.avr.boundary = [
      [-0.05, 1.05],
      [-0.05, 1.05],
      [-0.05, 1.05],
    ];

    if (isPlaying) weas.avr.play();
    else weas.avr.pause();

    weas.avr.frameDuration = 15 / speed;
    weas.avr.modelStyle = 1;

    // use init state to determine whether to update camera.
    const { center, zoom } = calculateCenteringAndZoom(
      nx,
      ny,
      nz,
      props.lattice,
    );

    if (isFirstRender.current) {
      weas.avr.tjs.updateCameraAndControls({
        lookAt: center,
        zoom: zoom,
      });
      isFirstRender.current = false;
    } else if (savedCameraPos && savedTarget) {
      weas.avr.tjs.camera.position.copy(savedCameraPos);
      weas.avr.tjs.controls.target.copy(savedTarget);
      weas.avr.tjs.controls.update();
    }

    weas.avr.cellManager._showCell = showCell;
    weas.avr.cellManager._showAxes = false;
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

  // Center and position the camera relative to the scene
  useEffect(() => {
    if (!weasRef.current) return;
    const weas = weasRef.current;

    const { center, zoom } = calculateCenteringAndZoom(
      nx,
      ny,
      nz,
      props.lattice,
    );

    // look down x,y,z
    weas.tjs.cameraController.view(cameraDirection);

    // center and zoom the camera in the supercell
    const cam = weas.tjs.cameraController.object;
    const offset = cam.position.clone().sub(weas.tjs.cameraController.target);
    cam.position.copy(center.clone().add(offset));
    weas.tjs.cameraController.target.copy(center);
    weas.tjs.cameraController.object.zoom = zoom;

    weas.tjs.render();
  }, [cameraDirection, nx, ny, nz, props.lattice]);

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
