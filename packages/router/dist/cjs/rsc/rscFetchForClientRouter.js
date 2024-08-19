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
var rscFetchForClientRouter_exports = {};
__export(rscFetchForClientRouter_exports, {
  rscFetch: () => rscFetch
});
module.exports = __toCommonJS(rscFetchForClientRouter_exports);
var import_client = require("react-server-dom-webpack/client");
var import_RscCache = require("./RscCache.js");
const BASE_PATH = "/rw-rsc/";
const rscCache = new import_RscCache.RscCache();
function rscFetch(rscId, props) {
  const serializedProps = JSON.stringify(props);
  const cached = rscCache.get(serializedProps);
  if (cached) {
    return cached;
  }
  const searchParams = new URLSearchParams();
  searchParams.set("props", serializedProps);
  const response = fetch(BASE_PATH + rscId + "?" + searchParams, {
    headers: {
      "rw-rsc": "1"
    }
  });
  const options = {
    // React will hold on to `callServer` and use that when it detects a
    // server action is invoked (like `action={onSubmit}` in a <form>
    // element). So for now at least we need to send it with every RSC
    // request, so React knows what `callServer` method to use for server
    // actions inside the RSC.
    callServer: async function(rsfId, args) {
      console.log("ClientRouter.ts :: callServer rsfId", rsfId, "args", args);
      const searchParams2 = new URLSearchParams();
      searchParams2.set("action_id", rsfId);
      const id = "_";
      const response2 = fetch(BASE_PATH + id + "?" + searchParams2, {
        method: "POST",
        body: await (0, import_client.encodeReply)(args),
        headers: {
          "rw-rsc": "1"
        }
      });
      const data = (0, import_client.createFromFetch)(response2, options);
      return data;
    }
  };
  const componentPromise = (0, import_client.createFromFetch)(
    response,
    options
  );
  rscCache.set(serializedProps, componentPromise);
  return componentPromise;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  rscFetch
});
