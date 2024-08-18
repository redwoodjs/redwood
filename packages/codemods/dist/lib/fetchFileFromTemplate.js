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
var fetchFileFromTemplate_exports = {};
__export(fetchFileFromTemplate_exports, {
  default: () => fetchFileFromTemplate
});
module.exports = __toCommonJS(fetchFileFromTemplate_exports);
var import_fetch = require("@whatwg-node/fetch");
async function fetchFileFromTemplate(tag, file) {
  const URL = `https://raw.githubusercontent.com/redwoodjs/redwood/${tag}/packages/create-redwood-app/template/${file}`;
  const res = await (0, import_fetch.fetch)(URL);
  return res.text();
}
