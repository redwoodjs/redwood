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
var useBlocker_exports = {};
__export(useBlocker_exports, {
  useBlocker: () => useBlocker
});
module.exports = __toCommonJS(useBlocker_exports);
var import_react = require("react");
var import_history = require("./history.js");
function useBlocker({ when }) {
  const [blockerState, setBlockerState] = (0, import_react.useState)("IDLE");
  const [pendingNavigation, setPendingNavigation] = (0, import_react.useState)(null);
  const blockerId = (0, import_react.useId)();
  const blocker = (0, import_react.useCallback)(
    ({ retry }) => {
      if (when) {
        setBlockerState("BLOCKED");
        setPendingNavigation(() => retry);
      } else {
        retry();
      }
    },
    [when]
  );
  (0, import_react.useEffect)(() => {
    if (when) {
      (0, import_history.block)(blockerId, blocker);
    } else {
      (0, import_history.unblock)(blockerId);
    }
    return () => (0, import_history.unblock)(blockerId);
  }, [when, blocker, blockerId]);
  const confirm = (0, import_react.useCallback)(() => {
    setBlockerState("IDLE");
    if (pendingNavigation) {
      pendingNavigation();
      setPendingNavigation(null);
    }
  }, [pendingNavigation]);
  const abort = (0, import_react.useCallback)(() => {
    setBlockerState("IDLE");
    setPendingNavigation(null);
  }, []);
  return { state: blockerState, confirm, abort };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  useBlocker
});
