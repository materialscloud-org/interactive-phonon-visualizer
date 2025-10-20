import { createContext } from "react";

import useParameters from "./useParameters";

const ParametersContext = createContext({} as ReturnType<typeof useParameters>);

export default ParametersContext;
