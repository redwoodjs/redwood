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
var shared_exports = {};
__export(shared_exports, {
  cookieName: () => cookieName,
  dbAuthSession: () => dbAuthSession,
  decryptSession: () => decryptSession,
  encryptSession: () => encryptSession,
  extractCookie: () => extractCookie,
  extractHashingOptions: () => extractHashingOptions,
  getDbAuthResponseBuilder: () => getDbAuthResponseBuilder,
  getSession: () => getSession,
  hashPassword: () => hashPassword,
  hashToken: () => hashToken,
  isLegacySession: () => isLegacySession,
  legacyHashPassword: () => legacyHashPassword,
  webAuthnSession: () => webAuthnSession
});
module.exports = __toCommonJS(shared_exports);
var import_node_crypto = __toESM(require("node:crypto"));
var import_api = require("@redwoodjs/api");
var import_project_config = require("@redwoodjs/project-config");
var DbAuthError = __toESM(require("./errors"));
const DEFAULT_SCRYPT_OPTIONS = {
  cost: 2 ** 14,
  blockSize: 8,
  parallelization: 1
};
const getPort = () => {
  let configPath;
  try {
    configPath = (0, import_project_config.getConfigPath)();
  } catch {
    return 8911;
  }
  return (0, import_project_config.getConfig)(configPath).api.port;
};
const eventGraphiQLHeadersCookie = (event) => {
  if (process.env.NODE_ENV === "development") {
    const impersationationHeader = (0, import_api.getEventHeader)(
      event,
      "rw-studio-impersonation-cookie"
    );
    if (impersationationHeader) {
      return impersationationHeader;
    }
    try {
      if (!(0, import_api.isFetchApiRequest)(event)) {
        const jsonBody = JSON.parse(event.body ?? "{}");
        return jsonBody?.extensions?.headers?.cookie || jsonBody?.extensions?.headers?.Cookie;
      }
    } catch {
      return;
    }
  }
  return;
};
const legacyDecryptSession = (encryptedText) => {
  const cypher = Buffer.from(encryptedText, "base64");
  const salt = cypher.slice(8, 16);
  const password = Buffer.concat([
    Buffer.from(process.env.SESSION_SECRET, "binary"),
    salt
  ]);
  const md5Hashes = [];
  let digest = password;
  for (let i = 0; i < 3; i++) {
    md5Hashes[i] = import_node_crypto.default.createHash("md5").update(digest).digest();
    digest = Buffer.concat([md5Hashes[i], password]);
  }
  const key = Buffer.concat([md5Hashes[0], md5Hashes[1]]);
  const iv = md5Hashes[2];
  const contents = cypher.slice(16);
  const decipher = import_node_crypto.default.createDecipheriv("aes-256-cbc", key, iv);
  return decipher.update(contents) + decipher.final("utf-8");
};
const extractCookie = (event) => {
  return eventGraphiQLHeadersCookie(event) || (0, import_api.getEventHeader)(event, "Cookie");
};
const isLegacySession = (text) => {
  if (!text) {
    return false;
  }
  const [_encryptedText, iv] = text.split("|");
  return !iv;
};
const decryptSession = (text) => {
  if (!text || text.trim() === "") {
    return [];
  }
  let decoded;
  const [encryptedText, iv] = text.split("|");
  try {
    if (iv) {
      const decipher = import_node_crypto.default.createDecipheriv(
        "aes-256-cbc",
        process.env.SESSION_SECRET.substring(0, 32),
        Buffer.from(iv, "base64")
      );
      decoded = decipher.update(encryptedText, "base64", "utf-8") + decipher.final("utf-8");
    } else {
      decoded = legacyDecryptSession(text);
    }
    const [data, csrf] = decoded.split(";");
    const json = JSON.parse(data);
    return [json, csrf];
  } catch {
    throw new DbAuthError.SessionDecryptionError();
  }
};
const encryptSession = (dataString) => {
  const iv = import_node_crypto.default.randomBytes(16);
  const cipher = import_node_crypto.default.createCipheriv(
    "aes-256-cbc",
    process.env.SESSION_SECRET.substring(0, 32),
    iv
  );
  let encryptedData = cipher.update(dataString, "utf-8", "base64");
  encryptedData += cipher.final("base64");
  return `${encryptedData}|${iv.toString("base64")}`;
};
const getSession = (text, cookieNameOption) => {
  if (typeof text === "undefined" || text === null) {
    return null;
  }
  const cookies = text.split(";");
  const sessionCookie = cookies.find((cookie) => {
    return cookie.split("=")[0].trim() === cookieName(cookieNameOption);
  });
  if (!sessionCookie || sessionCookie === `${cookieName(cookieNameOption)}=`) {
    return null;
  }
  return sessionCookie.replace(`${cookieName(cookieNameOption)}=`, "").trim();
};
const dbAuthSession = (event, cookieNameOption) => {
  const sessionCookie = extractCookie(event);
  if (!sessionCookie) {
    return null;
  }
  const [session, _csrfToken] = decryptSession(
    getSession(sessionCookie, cookieNameOption)
  );
  return session;
};
const webAuthnSession = (event) => {
  const cookieHeader = extractCookie(event);
  if (!cookieHeader) {
    return null;
  }
  const webAuthnCookie = cookieHeader.split(";").find((cook) => {
    return cook.split("=")[0].trim() === "webAuthn";
  });
  if (!webAuthnCookie || webAuthnCookie === "webAuthn=") {
    return null;
  }
  return webAuthnCookie.split("=")[1].trim();
};
const hashToken = (token) => {
  return import_node_crypto.default.createHash("sha256").update(token).digest("hex");
};
const hashPassword = (text, {
  salt = import_node_crypto.default.randomBytes(32).toString("hex"),
  options = DEFAULT_SCRYPT_OPTIONS
} = {}) => {
  const encryptedString = import_node_crypto.default.scryptSync(text.normalize("NFC"), salt, 32, options).toString("hex");
  const optionsToString = [
    options.cost,
    options.blockSize,
    options.parallelization
  ];
  return [`${encryptedString}|${optionsToString.join("|")}`, salt];
};
const legacyHashPassword = (text, salt) => {
  const useSalt = salt || import_node_crypto.default.randomBytes(32).toString("hex");
  return [
    import_node_crypto.default.pbkdf2Sync(text, useSalt, 1, 32, "SHA1").toString("hex"),
    useSalt
  ];
};
const cookieName = (name) => {
  const port = getPort();
  const cookieName2 = name?.replace("%port%", "" + port) ?? "session";
  return cookieName2;
};
function getDbAuthResponseBuilder(event) {
  return (response, corsHeaders) => {
    const headers = {
      ...Object.fromEntries(response.headers?.entries() || []),
      ...corsHeaders
    };
    const dbAuthResponse = {
      ...response,
      headers
    };
    const setCookieHeaders = response.headers?.getSetCookie() || [];
    if (setCookieHeaders.length > 0) {
      if ("multiValueHeaders" in event) {
        dbAuthResponse.multiValueHeaders = {
          "Set-Cookie": setCookieHeaders
        };
        delete headers["set-cookie"];
      } else {
        headers["set-cookie"] = setCookieHeaders;
      }
    }
    return dbAuthResponse;
  };
}
const extractHashingOptions = (text) => {
  const [_hash, ...options] = text.split("|");
  if (options.length === 3) {
    return {
      cost: parseInt(options[0]),
      blockSize: parseInt(options[1]),
      parallelization: parseInt(options[2])
    };
  } else {
    return {};
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  cookieName,
  dbAuthSession,
  decryptSession,
  encryptSession,
  extractCookie,
  extractHashingOptions,
  getDbAuthResponseBuilder,
  getSession,
  hashPassword,
  hashToken,
  isLegacySession,
  legacyHashPassword,
  webAuthnSession
});
