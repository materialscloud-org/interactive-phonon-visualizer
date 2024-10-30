import { useState } from "react";

const useParameters = (repetitions: number[]) => {
  const [Nx, Ny, Nz] = repetitions;
  const [nx, setNx] = useState(Nx);
  const [ny, setNy] = useState(Ny);
  const [nz, setNz] = useState(Nz);
  const [cameraDirection, setCameraDirection] = useState([0, 0, 1]);
  const [showCell, setShowCell] = useState(true);
  const [amplitude, setAmplitude] = useState(0.30);
  const [vectorLength, setVectorLength] = useState(3.5);
  const [showVectors, setShowVectors] = useState(true);
  const [speed, setSpeed] = useState(0.25);

  return {
    nx,
    setNx,
    ny,
    setNy,
    nz,
    setNz,
    cameraDirection,
    setCameraDirection,
    showCell,
    setShowCell,
    amplitude,
    setAmplitude,
    vectorLength,
    setVectorLength,
    showVectors,
    setShowVectors,
    speed,
    setSpeed,
  };
};

export default useParameters;
