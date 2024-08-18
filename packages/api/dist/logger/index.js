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
var logger_exports = {};
__export(logger_exports, {
  createLogger: () => createLogger,
  defaultLogLevels: () => defaultLogLevels,
  defaultLoggerOptions: () => defaultLoggerOptions,
  emitLogLevels: () => emitLogLevels,
  handlePrismaLogging: () => handlePrismaLogging,
  isDevelopment: () => isDevelopment,
  isProduction: () => isProduction,
  isTest: () => isTest,
  logLevel: () => logLevel,
  redactionsList: () => redactionsList
});
module.exports = __toCommonJS(logger_exports);
var import_pino = __toESM(require("pino"));
const isDevelopment = process.env.NODE_ENV === "development";
const isTest = process.env.NODE_ENV === "test";
const isProduction = !isDevelopment && !isTest;
const redactionsList = [
  "access_token",
  "data.access_token",
  "data.*.access_token",
  "data.*.accessToken",
  "accessToken",
  "data.accessToken",
  "DATABASE_URL",
  "data.*.email",
  "data.email",
  "email",
  "event.headers.authorization",
  "data.hashedPassword",
  "data.*.hashedPassword",
  "hashedPassword",
  "host",
  "jwt",
  "data.jwt",
  "data.*.jwt",
  "JWT",
  "data.JWT",
  "data.*.JWT",
  "password",
  "data.password",
  "data.*.password",
  "params",
  "data.salt",
  "data.*.salt",
  "salt",
  "secret",
  "data.secret",
  "data.*.secret"
];
const logLevel = (() => {
  if (typeof process.env.LOG_LEVEL !== "undefined") {
    return process.env.LOG_LEVEL;
  } else if (isProduction) {
    return "warn";
  } else if (isTest) {
    return "silent";
  } else {
    return "trace";
  }
})();
const defaultLoggerOptions = {
  level: logLevel,
  redact: redactionsList
};
const createLogger = ({
  options,
  destination,
  showConfig = false
}) => {
  const hasDestination = typeof destination !== "undefined";
  const isFile = hasDestination && typeof destination === "string";
  const isStream = hasDestination && !isFile;
  const stream = destination;
  options = { ...defaultLoggerOptions, ...options };
  if (showConfig) {
    console.log("Logger Configuration");
    console.log(`isProduction: ${isProduction}`);
    console.log(`isDevelopment: ${isDevelopment}`);
    console.log(`isTest: ${isTest}`);
    console.log(`isFile: ${isFile}`);
    console.log(`isStream: ${isStream}`);
    console.log(`logLevel: ${logLevel}`);
    console.log(`options: ${JSON.stringify(options, null, 2)}`);
    console.log(`destination: ${destination}`);
  }
  if (isFile) {
    if (isProduction) {
      console.warn(
        "Please make certain that file system access is available when logging to a file in a production environment."
      );
    }
    return (0, import_pino.default)(options, stream);
  } else {
    if (isStream && isDevelopment && !isTest) {
      console.warn(
        "Logs will be sent to the transport stream in the current development environment."
      );
    }
    return (0, import_pino.default)(options, stream);
  }
};
const DEFAULT_SLOW_QUERY_THRESHOLD = 2e3;
const defaultLogLevels = ["info", "warn", "error"];
const emitLogLevels = (setLogLevels) => {
  return setLogLevels?.map((level) => {
    return { emit: "event", level };
  });
};
const handlePrismaLogging = (config) => {
  const logger = config.logger.child({
    // @TODO Change this once this issue is resolved
    // See https://github.com/prisma/prisma/issues/8290
    prisma: { clientVersion: config.db["_clientVersion"] }
  });
  const slowQueryThreshold = config.slowQueryThreshold ?? DEFAULT_SLOW_QUERY_THRESHOLD;
  config.logLevels?.forEach((level) => {
    if (level === "query") {
      config.db.$on(level, (event) => {
        const queryEvent = event;
        if (queryEvent.duration >= slowQueryThreshold) {
          logger.warn(
            { ...queryEvent },
            `Slow Query performed in ${queryEvent.duration} msec`
          );
        } else {
          logger.debug(
            { ...queryEvent },
            `Query performed in ${queryEvent.duration} msec`
          );
        }
      });
    } else {
      config.db.$on(level, (event) => {
        const logEvent = event;
        switch (level) {
          case "info":
            logger.info({ ...logEvent }, logEvent.message);
            break;
          case "warn":
            logger.warn({ ...logEvent }, logEvent.message);
            break;
          case "error":
            logger.error({ ...logEvent }, logEvent.message);
            break;
          default:
            logger.info({ ...logEvent }, logEvent.message);
        }
      });
    }
  });
  return;
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createLogger,
  defaultLogLevels,
  defaultLoggerOptions,
  emitLogLevels,
  handlePrismaLogging,
  isDevelopment,
  isProduction,
  isTest,
  logLevel,
  redactionsList
});
