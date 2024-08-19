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
var history_exports = {};
__export(history_exports, {
  back: () => back,
  block: () => block,
  gHistory: () => gHistory,
  navigate: () => navigate,
  unblock: () => unblock
});
module.exports = __toCommonJS(history_exports);
const createHistory = () => {
  const listeners = {};
  const blockers = [];
  let beforeUnloadListener = null;
  const history = {
    listen: (listener) => {
      const listenerId = "RW_HISTORY_LISTENER_ID_" + Date.now();
      listeners[listenerId] = listener;
      globalThis.addEventListener("popstate", listener);
      return listenerId;
    },
    navigate: (to, options) => {
      const performNavigation = () => {
        const { pathname, search, hash } = new URL(
          globalThis?.location?.origin + to
        );
        if (globalThis?.location?.pathname !== pathname || globalThis?.location?.search !== search || globalThis?.location?.hash !== hash) {
          if (options?.replace) {
            globalThis.history.replaceState({}, "", to);
          } else {
            globalThis.history.pushState({}, "", to);
          }
        }
        for (const listener of Object.values(listeners)) {
          listener();
        }
      };
      if (blockers.length > 0) {
        processBlockers(0, performNavigation);
      } else {
        performNavigation();
      }
    },
    back: () => {
      const performBack = () => {
        globalThis.history.back();
        for (const listener of Object.values(listeners)) {
          listener();
        }
      };
      if (blockers.length > 0) {
        processBlockers(0, performBack);
      } else {
        performBack();
      }
    },
    remove: (listenerId) => {
      if (listeners[listenerId]) {
        const listener = listeners[listenerId];
        globalThis.removeEventListener("popstate", listener);
        delete listeners[listenerId];
      } else {
        console.warn(
          "History Listener with ID: " + listenerId + " does not exist."
        );
      }
    },
    block: (id, callback) => {
      const existingBlockerIndex = blockers.findIndex(
        (blocker) => blocker.id === id
      );
      if (existingBlockerIndex !== -1) {
        blockers[existingBlockerIndex] = { id, callback };
      } else {
        blockers.push({ id, callback });
        if (blockers.length === 1) {
          addBeforeUnloadListener();
        }
      }
    },
    unblock: (id) => {
      const index = blockers.findIndex((blocker) => blocker.id === id);
      if (index !== -1) {
        blockers.splice(index, 1);
        if (blockers.length === 0) {
          removeBeforeUnloadListener();
        }
      }
    }
  };
  const processBlockers = (index, navigate2) => {
    if (index < blockers.length) {
      blockers[index].callback({
        retry: () => processBlockers(index + 1, navigate2)
      });
    } else {
      navigate2();
    }
  };
  const addBeforeUnloadListener = () => {
    if (!beforeUnloadListener) {
      beforeUnloadListener = (event) => {
        if (blockers.length > 0) {
          event.preventDefault();
        }
      };
      globalThis.addEventListener("beforeunload", beforeUnloadListener);
    }
  };
  const removeBeforeUnloadListener = () => {
    if (beforeUnloadListener) {
      globalThis.removeEventListener("beforeunload", beforeUnloadListener);
      beforeUnloadListener = null;
    }
  };
  return history;
};
const gHistory = createHistory();
const { navigate, back, block, unblock } = gHistory;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  back,
  block,
  gHistory,
  navigate,
  unblock
});
