import React, { useContext } from "react";
import { createNamedContext } from "./createNamedContext.js";
const ParamsContext = createNamedContext("Params");
const ParamsProvider = ({ allParams, children }) => {
  return /* @__PURE__ */ React.createElement(
    ParamsContext.Provider,
    {
      value: {
        params: {
          ...allParams
        }
      }
    },
    children
  );
};
const useParams = () => {
  const paramsContext = useContext(ParamsContext);
  if (paramsContext === void 0) {
    throw new Error("useParams must be used within a ParamsProvider");
  }
  return paramsContext.params;
};
export {
  ParamsContext,
  ParamsProvider,
  useParams
};
