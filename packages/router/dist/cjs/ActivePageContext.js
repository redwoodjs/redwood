"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var ActivePageContext_exports = {};
__export(ActivePageContext_exports, {
  ActivePageContextProvider: () => ActivePageContextProvider,
  useActivePageContext: () => useActivePageContext
});
module.exports = __toCommonJS(ActivePageContext_exports);
var import_react = require("react");
var import_createNamedContext = require("./createNamedContext.js");
const ActivePageContext = (0, import_createNamedContext.createNamedContext)("ActivePage");
const ActivePageContextProvider = ActivePageContext.Provider;
const useActivePageContext = () => {
  const activePageContext = (0, import_react.useContext)(ActivePageContext);
  if (!activePageContext) {
    throw new Error(
      "useActivePageContext must be used within a ActivePageContext provider"
    );
  }
  return activePageContext;
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ActivePageContextProvider,
  useActivePageContext
});
