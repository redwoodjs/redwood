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
var detectEmptyCells_exports = {};
__export(detectEmptyCells_exports, {
  detectEmptyCells: () => detectEmptyCells
});
module.exports = __toCommonJS(detectEmptyCells_exports);
var import_cells = require("../../../lib/cells");
async function detectEmptyCells(taskContext) {
  const warnings = [];
  const cellPaths = (0, import_cells.findCells)();
  const susceptibleCells = cellPaths.filter((cellPath) => {
    const fileContents = (0, import_cells.fileToAst)(cellPath);
    const cellQuery = (0, import_cells.getCellGqlQuery)(fileContents);
    if (!cellQuery) {
      return false;
    }
    let fields;
    try {
      fields = (0, import_cells.parseGqlQueryToAst)(cellQuery)[0].fields;
    } catch {
      warnings.push(cellPath);
      return;
    }
    return fields.length > 1;
  });
  if (susceptibleCells.length === 0 && warnings.length === 0) {
    taskContext.setOutput(
      "None of your project's Cells are susceptible to the new `isDataEmpty` behavior."
    );
    return;
  }
  const message = [];
  if (susceptibleCells.length > 0) {
    message.push(
      [
        "You have Cells that are susceptible to the new `isDataEmpty` behavior:",
        "",
        susceptibleCells.map((c) => `\u2022 ${c}`).join("\n"),
        ""
      ].join("\n")
    );
  }
  if (warnings.length > 0) {
    message.push(
      [
        [
          message.length > 0 && "\u2192",
          `The following Cell(s) could not be parsed:`
        ].filter(Boolean).join(" "),
        "",
        warnings.map((c) => `\u2022 ${c}`).join("\n"),
        "",
        "You'll have to audit them manually.",
        ""
      ].join("\n")
    );
  }
  message.push(
    [
      "The new behavior is documented in detail on the forums: https://community.redwoodjs.com/t/redwood-v5-0-0-rc-is-now-available/4715.",
      "It's most likely what you want, but consider whether it affects you.",
      "If you'd like to revert to the old behavior, you can override the `isDataEmpty` function."
    ].join("\n")
  );
  const taskContextMethod = warnings.length > 0 ? "setWarning" : "setOutput";
  taskContext[taskContextMethod](message.join("\n"));
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  detectEmptyCells
});
