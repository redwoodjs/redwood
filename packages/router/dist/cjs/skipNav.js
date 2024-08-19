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
var skipNav_exports = {};
__export(skipNav_exports, {
  SkipNavContent: () => SkipNavContent,
  SkipNavLink: () => SkipNavLink
});
module.exports = __toCommonJS(skipNav_exports);
var React = __toESM(require("react"), 1);
const defaultId = "reach-skip-nav";
const SkipNavLink = React.forwardRef(function SkipNavLink2({ as: Comp = "a", children = "Skip to content", contentId, ...props }, forwardedRef) {
  const id = contentId || defaultId;
  return /* @__PURE__ */ React.createElement(
    Comp,
    {
      ...props,
      ref: forwardedRef,
      href: `#${id}`,
      "data-reach-skip-link": "",
      "data-reach-skip-nav-link": ""
    },
    children
  );
});
SkipNavLink.displayName = "SkipNavLink";
const SkipNavContent = React.forwardRef(function SkipNavContent2({ as: Comp = "div", id: idProp, ...props }, forwardedRef) {
  const id = idProp || defaultId;
  return /* @__PURE__ */ React.createElement(
    Comp,
    {
      ...props,
      ref: forwardedRef,
      id,
      "data-reach-skip-nav-content": ""
    }
  );
});
SkipNavContent.displayName = "SkipNavContent";
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SkipNavContent,
  SkipNavLink
});
