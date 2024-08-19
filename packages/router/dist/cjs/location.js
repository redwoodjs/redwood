"use strict";
"use client";
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
var location_exports = {};
__export(location_exports, {
  LocationContext: () => LocationContext,
  LocationProvider: () => LocationProvider,
  useLocation: () => useLocation
});
module.exports = __toCommonJS(location_exports);
var import_react = __toESM(require("react"), 1);
var import_createNamedContext = require("./createNamedContext.js");
var import_history = require("./history.js");
const LocationContext = (0, import_createNamedContext.createNamedContext)("Location");
class LocationProvider extends import_react.default.Component {
  // When prerendering, there might be more than one level of location
  // providers. Use the values from the one above.
  // (this is basically the class component version of `useLocation()`)
  static contextType = LocationContext;
  HISTORY_LISTENER_ID = void 0;
  state = {
    context: this.getContext()
  };
  getContext() {
    let windowLocation;
    if (typeof window !== "undefined") {
      const { pathname } = window.location;
      switch (this.props.trailingSlashes) {
        case "never":
          if (pathname.endsWith("/")) {
            window.history.replaceState(
              {},
              "",
              pathname.substr(0, pathname.length - 1)
            );
          }
          break;
        case "always":
          if (!pathname.endsWith("/")) {
            window.history.replaceState({}, "", pathname + "/");
          }
          break;
        default:
          break;
      }
      windowLocation = new URL(window.location.href);
    }
    return this.props.location || this.context || windowLocation;
  }
  // componentDidMount() is not called during server rendering (aka SSR and
  // prerendering)
  componentDidMount() {
    this.HISTORY_LISTENER_ID = import_history.gHistory.listen(() => {
      const context = this.getContext();
      this.setState((lastState) => {
        if (context?.pathname !== lastState?.context?.pathname || context?.search !== lastState?.context?.search) {
          globalThis?.scrollTo(0, 0);
        }
        return { context };
      });
    });
  }
  componentWillUnmount() {
    if (this.HISTORY_LISTENER_ID) {
      import_history.gHistory.remove(this.HISTORY_LISTENER_ID);
    }
  }
  render() {
    return /* @__PURE__ */ import_react.default.createElement(LocationContext.Provider, { value: this.state.context }, this.props.children);
  }
}
const useLocation = () => {
  const location = import_react.default.useContext(LocationContext);
  if (location === void 0) {
    throw new Error("useLocation must be used within a LocationProvider");
  }
  return location;
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  LocationContext,
  LocationProvider,
  useLocation
});
