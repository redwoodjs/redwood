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
var telemetry_exports = {};
__export(telemetry_exports, {
  recordTelemetryAttributes: () => recordTelemetryAttributes,
  recordTelemetryError: () => recordTelemetryError
});
module.exports = __toCommonJS(telemetry_exports);
var import_api = __toESM(require("@opentelemetry/api"), 1);
function recordTelemetryAttributes(attributes, span) {
  const spanToRecord = span ?? import_api.default.trace.getActiveSpan();
  if (spanToRecord === void 0) {
    return;
  }
  for (const [key, value] of Object.entries(attributes)) {
    spanToRecord.setAttribute(key, value);
  }
}
function recordTelemetryError(error, span) {
  const spanToRecord = span ?? import_api.default.trace.getActiveSpan();
  if (spanToRecord === void 0) {
    return;
  }
  const message = error?.message ?? error?.toString() ?? "Unknown error";
  const firstLineOfError = message.split("\n")[0];
  spanToRecord.setStatus({
    code: import_api.SpanStatusCode.ERROR,
    message: firstLineOfError
  });
  spanToRecord.recordException(error ?? new Error(firstLineOfError));
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  recordTelemetryAttributes,
  recordTelemetryError
});
