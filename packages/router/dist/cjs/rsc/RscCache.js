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
var RscCache_exports = {};
__export(RscCache_exports, {
  RscCache: () => RscCache
});
module.exports = __toCommonJS(RscCache_exports);
class RscCache {
  cache = /* @__PURE__ */ new Map();
  socket;
  sendRetries = 0;
  isEnabled = true;
  constructor() {
    this.socket = new WebSocket("ws://localhost:18998");
    this.socket.addEventListener("open", () => {
      console.log("Connected to WebSocket server.");
    });
    this.socket.addEventListener("message", (event) => {
      console.log("Incomming message", event);
      if (event.data.startsWith("{")) {
        const data = JSON.parse(event.data);
        console.log("Incomming message id", data.id);
        console.log("Incomming message key", data.key);
        if (data.id === "rsc-cache-delete") {
          if (!this.cache.has(data.key)) {
            console.error("");
            console.error(
              "RscCache::message::rsc-cache-delete key not found in cache"
            );
            console.error("");
          }
          this.cache.delete(data.key);
          this.sendUpdateToWebSocket();
        } else if (data.id === "rsc-cache-clear") {
          this.cache.clear();
          this.sendToWebSocket("update", { fullCache: {} });
        } else if (data.id === "rsc-cache-enable") {
          console.log("RscCache::message::rsc-cache-enable");
          this.isEnabled = true;
          this.sendUpdateToWebSocket();
        } else if (data.id === "rsc-cache-disable") {
          console.log("RscCache::message::rsc-cache-disable");
          this.isEnabled = false;
        } else if (data.id === "rsc-cache-read") {
          console.log("RscCache::message::rsc-cache-read");
          this.sendUpdateToWebSocket();
        }
      }
    });
  }
  get(key) {
    const value = this.cache.get(key);
    console.log("RscCache.get", key, value);
    return value;
  }
  set(key, value) {
    console.log("RscCache.set", key, value);
    if (!this.isEnabled) {
      this.cache.clear();
    }
    this.cache.set(key, value);
    value.then((resolvedValue) => {
      console.log("RscCache.set key:", key);
      console.log("RscCache.set resolved value:", resolvedValue);
      this.sendToWebSocket("set", {
        updatedKey: key,
        fullCache: Object.fromEntries(
          Array.from(this.cache.entries()).map(
            // @ts-expect-error hack to get the value of a Thenable
            ([location, elementThenable]) => [location, elementThenable.value]
          )
        )
      });
    });
  }
  sendToWebSocket(action, payload) {
    console.log("RscCache::sendToWebSocket action", action, "payload", payload);
    if (this.socket.readyState === WebSocket?.OPEN) {
      this.sendRetries = 0;
      this.socket.send(JSON.stringify({ id: "rsc-cache-" + action, payload }));
    } else if (this.socket.readyState === WebSocket?.CONNECTING && this.sendRetries < 10) {
      const backoff = 300 + this.sendRetries * 100;
      setTimeout(() => {
        this.sendRetries++;
        this.sendToWebSocket(action, payload);
      }, backoff);
    } else if (this.sendRetries >= 10) {
      console.error("Exhausted retries to send message to WebSocket server.");
    } else {
      console.error("WebSocket connection is closed.");
    }
  }
  sendUpdateToWebSocket() {
    this.sendToWebSocket("update", {
      fullCache: Object.fromEntries(
        Array.from(this.cache.entries()).map(([location, elementThenable]) => [
          location,
          // @ts-expect-error hack to get the value of a Thenable
          elementThenable.value
        ])
      )
    });
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  RscCache
});
