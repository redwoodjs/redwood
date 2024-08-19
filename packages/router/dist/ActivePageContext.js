import { useContext } from "react";
import { createNamedContext } from "./createNamedContext.js";
const ActivePageContext = createNamedContext("ActivePage");
const ActivePageContextProvider = ActivePageContext.Provider;
const useActivePageContext = () => {
  const activePageContext = useContext(ActivePageContext);
  if (!activePageContext) {
    throw new Error(
      "useActivePageContext must be used within a ActivePageContext provider"
    );
  }
  return activePageContext;
};
export {
  ActivePageContextProvider,
  useActivePageContext
};
