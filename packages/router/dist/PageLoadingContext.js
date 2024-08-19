import React, { useContext, useState } from "react";
import { createNamedContext } from "./createNamedContext.js";
const PageLoadingContext = createNamedContext("PageLoading");
const PageLoadingContextProvider = ({
  children,
  delay = 1e3
}) => {
  const [loading, setPageLoadingContext] = useState(false);
  return /* @__PURE__ */ React.createElement(
    PageLoadingContext.Provider,
    {
      value: { loading, setPageLoadingContext, delay }
    },
    children
  );
};
const usePageLoadingContext = () => {
  const pageLoadingContext = useContext(PageLoadingContext);
  if (!pageLoadingContext) {
    throw new Error(
      "usePageLoadingContext must be used within a PageLoadingContext provider"
    );
  }
  return pageLoadingContext;
};
export {
  PageLoadingContextProvider,
  usePageLoadingContext
};
