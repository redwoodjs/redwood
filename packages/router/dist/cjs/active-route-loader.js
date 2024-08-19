"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var active_route_loader_exports = {};
__export(active_route_loader_exports, {
  ActiveRouteLoader: () => ActiveRouteLoader
});
module.exports = __toCommonJS(active_route_loader_exports);
var import_react = __toESM(require("react"), 1);
var import_a11yUtils = require("./a11yUtils.js");
var import_PageLoadingContext = require("./PageLoadingContext.js");
var import_util = require("./util.js");
let isPrerendered = false;
if (typeof window !== "undefined") {
  const redwoodAppElement = document.getElementById("redwood-app");
  if (redwoodAppElement && redwoodAppElement.children.length > 0) {
    isPrerendered = true;
  }
}
let firstLoad = true;
const Fallback = ({ children }) => {
  const { loading, setPageLoadingContext, delay } = (0, import_PageLoadingContext.usePageLoadingContext)();
  (0, import_react.useEffect)(() => {
    const timer = setTimeout(() => {
      setPageLoadingContext(true);
    }, delay);
    return () => {
      clearTimeout(timer);
      setPageLoadingContext(false);
    };
  }, [delay, setPageLoadingContext]);
  return /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, loading ? children : null);
};
const ActiveRouteLoader = ({
  spec,
  params,
  whileLoadingPage
}) => {
  const announcementRef = (0, import_react.useRef)(null);
  const usePrerenderLoader = (
    // Prerendering doesn't work with Streaming/SSR yet. So we disable it.
    !globalThis.RWJS_EXP_STREAMING_SSR && (globalThis.__REDWOOD__PRERENDERING || isPrerendered && firstLoad)
  );
  const LazyRouteComponent = usePrerenderLoader ? spec.prerenderLoader(spec.name).default : spec.LazyComponent;
  if (firstLoad) {
    firstLoad = false;
  }
  (0, import_react.useEffect)(() => {
    if ((0, import_util.inIframe)()) {
      return;
    }
    if (announcementRef.current) {
      announcementRef.current.innerText = (0, import_a11yUtils.getAnnouncement)();
    }
    const routeFocus = (0, import_a11yUtils.getFocus)();
    if (!routeFocus) {
      (0, import_a11yUtils.resetFocus)();
    } else {
      routeFocus.focus();
    }
  }, [spec, params]);
  if (params) {
    delete params["ref"];
    delete params["key"];
  }
  return /* @__PURE__ */ import_react.default.createElement(import_react.Suspense, { fallback: /* @__PURE__ */ import_react.default.createElement(Fallback, null, whileLoadingPage?.()) }, /* @__PURE__ */ import_react.default.createElement(LazyRouteComponent, { ...params }), /* @__PURE__ */ import_react.default.createElement(
    "div",
    {
      id: "redwood-announcer",
      style: {
        position: "absolute",
        top: 0,
        width: 1,
        height: 1,
        padding: 0,
        overflow: "hidden",
        clip: "rect(0, 0, 0, 0)",
        whiteSpace: "nowrap",
        border: 0
      },
      role: "alert",
      "aria-live": "assertive",
      "aria-atomic": "true",
      ref: announcementRef
    }
  ));
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ActiveRouteLoader
});
