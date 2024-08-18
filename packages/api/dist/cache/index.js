"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js/object/define-property");
var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
_Object$defineProperty(exports, "__esModule", {
  value: true
});
_Object$defineProperty(exports, "InMemoryClient", {
  enumerable: true,
  get: function () {
    return _InMemoryClient.default;
  }
});
_Object$defineProperty(exports, "MemcachedClient", {
  enumerable: true,
  get: function () {
    return _MemcachedClient.default;
  }
});
_Object$defineProperty(exports, "RedisClient", {
  enumerable: true,
  get: function () {
    return _RedisClient.default;
  }
});
exports.formatCacheKey = exports.createCache = exports.cacheKeySeparator = void 0;
require("core-js/modules/esnext.json.parse.js");
var _promise = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/promise"));
var _setTimeout2 = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/set-timeout"));
var _isArray = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/array/is-array"));
var _stringify = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/json/stringify"));
var _errors = require("./errors");
var _MemcachedClient = _interopRequireDefault(require("./clients/MemcachedClient"));
var _RedisClient = _interopRequireDefault(require("./clients/RedisClient"));
var _InMemoryClient = _interopRequireDefault(require("./clients/InMemoryClient"));
const DEFAULT_LATEST_FIELDS = {
  id: 'id',
  updatedAt: 'updatedAt'
};
const wait = ms => {
  return new _promise.default(resolve => (0, _setTimeout2.default)(resolve, ms));
};
const cacheKeySeparator = exports.cacheKeySeparator = '-';
const formatCacheKey = (key, prefix) => {
  let output;
  if ((0, _isArray.default)(key)) {
    output = key.join(cacheKeySeparator);
  } else {
    output = key;
  }

  // don't prefix if already prefixed
  if (prefix && !output.toString().match(new RegExp('^' + prefix + cacheKeySeparator))) {
    output = `${prefix}${cacheKeySeparator}${output}`;
  }
  return output;
};
exports.formatCacheKey = formatCacheKey;
const serialize = input => {
  return JSON.parse((0, _stringify.default)(input));
};
const createCache = (cacheClient, options) => {
  const client = cacheClient;
  const logger = options?.logger;
  const timeout = options?.timeout || 1000;
  const prefix = options?.prefix;
  const fields = options?.fields || DEFAULT_LATEST_FIELDS;
  const cache = async (key, input, options) => {
    const cacheKey = formatCacheKey(key, prefix);
    try {
      // some client lib timeouts are flaky if the server actually goes away
      // (MemJS) so we'll implement our own here just in case
      const result = await _promise.default.race([client.get(cacheKey), wait(timeout).then(() => {
        throw new _errors.CacheTimeoutError();
      })]);
      if (result) {
        logger?.debug(`[Cache] HIT key '${cacheKey}'`);
        return result;
      }
    } catch (e) {
      logger?.error(`[Cache] Error GET '${cacheKey}': ${e.message}`);

      // If client implements a reconnect() function, try it now
      if (e instanceof _errors.CacheTimeoutError && client.disconnect) {
        logger?.error(`[Cache] Disconnecting current instance...`);
        await client.disconnect();
      }
      // stringify and parse to match what happens inside cache clients
      return serialize(await input());
    }

    // data wasn't found, SET it instead
    let data;
    try {
      data = await input();
      await _promise.default.race([client.set(cacheKey, data, options || {}), wait(timeout).then(() => {
        throw new _errors.CacheTimeoutError();
      })]);
      logger?.debug(`[Cache] MISS '${cacheKey}', SET ${(0, _stringify.default)(data).length} bytes`);
      return serialize(data);
    } catch (e) {
      logger?.error(`[Cache] Error SET '${cacheKey}': ${e.message}`);
      return serialize(data || (await input()));
    }
  };
  const cacheFindMany = async (key, model, options = {}) => {
    const {
      conditions,
      ...rest
    } = options;
    const cacheKey = formatCacheKey(key, prefix);
    let latest, latestCacheKey;

    // @ts-expect-error - Error object is not exported until `prisma generate`
    const {
      PrismaClientValidationError
    } = await import('@prisma/client');

    // take the conditions from the query that's going to be cached, and only
    // return the latest record (based on `updatedAt`) from that set of
    // records, using its data as the cache key
    try {
      latest = await model.findFirst({
        ...conditions,
        orderBy: {
          [fields.updatedAt]: 'desc'
        },
        select: {
          [fields.id]: true,
          [fields.updatedAt]: true
        }
      });
    } catch (e) {
      if (e instanceof PrismaClientValidationError) {
        logger?.error(`[Cache] cacheFindMany error: model does not contain \`${fields.id}\` or \`${fields.updatedAt}\` fields`);
      } else {
        logger?.error(`[Cache] cacheFindMany error: ${e.message}`);
      }
      return serialize(await model.findMany(conditions));
    }

    // there may not have been any records returned, in which case we can't
    // create the key so just return the query
    if (latest) {
      latestCacheKey = `${cacheKey}${cacheKeySeparator}${latest.id}${cacheKeySeparator}${latest[fields.updatedAt].getTime()}`;
    } else {
      logger?.debug(`[Cache] cacheFindMany: No data to cache for key \`${key}\`, skipping`);
      return serialize(await model.findMany(conditions));
    }

    // everything looks good, cache() this with the computed key
    return cache(latestCacheKey, () => model.findMany(conditions), rest);
  };
  const deleteCacheKey = async key => {
    let result;
    const cacheKey = formatCacheKey(key, prefix);
    try {
      await _promise.default.race([result = client.del(cacheKey), wait(timeout).then(() => {
        throw new _errors.CacheTimeoutError();
      })]);
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
exports.createCache = createCache;