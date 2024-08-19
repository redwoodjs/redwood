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
var a11yUtils_exports = {};
__export(a11yUtils_exports, {
  getAnnouncement: () => getAnnouncement,
  getFocus: () => getFocus,
  resetFocus: () => resetFocus
});
module.exports = __toCommonJS(a11yUtils_exports);
const getAnnouncement = () => {
  const routeAnnouncement = globalThis?.document.querySelectorAll(
    "[data-redwood-route-announcement]"
  )?.[0];
  if (routeAnnouncement?.textContent) {
    return routeAnnouncement.textContent;
  }
  const pageHeading = globalThis?.document.querySelector(`h1`);
  if (pageHeading?.textContent) {
    return pageHeading.textContent;
  }
  if (globalThis?.document.title) {
    return document.title;
  }
  return `new page at ${globalThis?.location.pathname}`;
};
const getFocus = () => {
  const routeFocus = globalThis?.document.querySelectorAll(
    "[data-redwood-route-focus]"
  )?.[0];
  if (!routeFocus?.children.length || routeFocus.children[0].tabIndex < 0) {
    return null;
  }
  return routeFocus.children[0];
};
const resetFocus = () => {
  globalThis?.document.body.setAttribute("tabindex", "-1");
  globalThis?.document.body.focus();
  globalThis?.document.body.removeAttribute("tabindex");
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  getAnnouncement,
  getFocus,
  resetFocus
});
