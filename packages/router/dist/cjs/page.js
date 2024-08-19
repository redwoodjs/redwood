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
var page_exports = {};
__export(page_exports, {
  isSpec: () => isSpec,
  normalizePage: () => normalizePage
});
module.exports = __toCommonJS(page_exports);
function isSpec(specOrPage) {
  return specOrPage.LazyComponent !== void 0;
}
function normalizePage(specOrPage) {
  if (isSpec(specOrPage)) {
    return specOrPage;
  }
  return {
    name: specOrPage.name,
    prerenderLoader: () => ({ default: specOrPage }),
    LazyComponent: specOrPage
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  isSpec,
  normalizePage
});
