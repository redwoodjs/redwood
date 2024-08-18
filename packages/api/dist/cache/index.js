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
var cache_exports = {};
__export(cache_exports, {
  InMemoryClient: () => import_InMemoryClient.default,
  MemcachedClient: () => import_MemcachedClient.default,
  RedisClient: () => import_RedisClient.default,
  cacheKeySeparator: () => cacheKeySeparator,
  createCache: () => createCache,
  formatCacheKey: () => formatCacheKey
});
module.exports = __toCommonJS(cache_exports);
var import_errors = require("./errors");
var import_MemcachedClient = __toESM(require("./clients/MemcachedClient"));
var import_RedisClient = __toESM(require("./clients/RedisClient"));
var import_InMemoryClient = __toESM(require("./clients/InMemoryClient"));
const DEFAULT_LATEST_FIELDS = { id: "id", updatedAt: "updatedAt" };
const wait = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
const cacheKeySeparator = "-";
const formatCacheKey = (key, prefix) => {
  let output;
  if (Array.isArray(key)) {
    output = key.join(cacheKeySeparator);
  } else {
    output = key;
  }
  if (prefix && !output.toString().match(new RegExp("^" + prefix + cacheKeySeparator))) {
    output = `${prefix}${cacheKeySeparator}${output}`;
  }
  return output;
};
const serialize = (input) => {
  return JSON.parse(JSON.stringify(input));
};
const createCache = (cacheClient, options) => {
  const client = cacheClient;
  const logger = options?.logger;
  const timeout = options?.timeout || 1e3;
  const prefix = options?.prefix;
  const fields = options?.fields || DEFAULT_LATEST_FIELDS;
  const cache = async (key, input, options2) => {
    const cacheKey = formatCacheKey(key, prefix);
    try {
      const result = await Promise.race([
        client.get(cacheKey),
        wait(timeout).then(() => {
          throw new import_errors.CacheTimeoutError();
        })
      ]);
      if (result) {
        logger?.debug(`[Cache] HIT key '${cacheKey}'`);
        return result;
      }
    } catch (e) {
      logger?.error(`[Cache] Error GET '${cacheKey}': ${e.message}`);
      if (e instanceof import_errors.CacheTimeoutError && client.disconnect) {
        logger?.error(`[Cache] Disconnecting current instance...`);
        await client.disconnect();
      }
      return serialize(await input());
    }
    let data;
    try {
      data = await input();
      await Promise.race([
        client.set(cacheKey, data, options2 || {}),
        wait(timeout).then(() => {
          throw new import_errors.CacheTimeoutError();
        })
      ]);
      logger?.debug(
        `[Cache] MISS '${cacheKey}', SET ${JSON.stringify(data).length} bytes`
      );
      return serialize(data);
    } catch (e) {
      logger?.error(`[Cache] Error SET '${cacheKey}': ${e.message}`);
      return serialize(data || await input());
    }
  };
  const cacheFindMany = async (key, model, options2 = {}) => {
    const { conditions, ...rest } = options2;
    const cacheKey = formatCacheKey(key, prefix);
    let latest, latestCacheKey;
    const { PrismaClientValidationError } = await import("@prisma/client");
    try {
      latest = await model.findFirst({
        ...conditions,
        orderBy: { [fields.updatedAt]: "desc" },
        select: { [fields.id]: true, [fields.updatedAt]: true }
      });
    } catch (e) {
      if (e instanceof PrismaClientValidationError) {
        logger?.error(
          `[Cache] cacheFindMany error: model does not contain \`${fields.id}\` or \`${fields.updatedAt}\` fields`
        );
      } else {
        logger?.error(`[Cache] cacheFindMany error: ${e.message}`);
      }
      return serialize(await model.findMany(conditions));
    }
    if (latest) {
      latestCacheKey = `${cacheKey}${cacheKeySeparator}${latest.id}${cacheKeySeparator}${latest[fields.updatedAt].getTime()}`;
    } else {
      logger?.debug(
        `[Cache] cacheFindMany: No data to cache for key \`${key}\`, skipping`
      );
      return serialize(await model.findMany(conditions));
    }
    return cache(latestCacheKey, () => model.findMany(conditions), rest);
  };
  const deleteCacheKey = async (key) => {
    let result;
    const cacheKey = formatCacheKey(key, prefix);
    try {
      await Promise.race([
        result = client.del(cacheKey),
        wait(timeout).then(() => {
          throw new import_errors.CacheTimeoutError();
        })
      ]);
      logger?.debug(`[Cache] DEL '${cacheKey}'`);
      return result;
    } catch (e) {
      logger?.error(`[Cache] Error DEL '${cacheKey}': ${e.message}`);
      return false;
    }
  };
  return {
    cache,
    cacheFindMany,
    cacheClient: client,
    deleteCacheKey
  };
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  InMemoryClient,
  MemcachedClient,
  RedisClient,
  cacheKeySeparator,
  createCache,
  formatCacheKey
});
