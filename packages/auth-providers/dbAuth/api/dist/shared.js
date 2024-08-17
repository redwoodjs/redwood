"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js/object/define-property");
var _interopRequireWildcard = require("@babel/runtime-corejs3/helpers/interopRequireWildcard").default;
var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
_Object$defineProperty(exports, "__esModule", {
  value: true
});
exports.extractHashingOptions = exports.extractCookie = exports.encryptSession = exports.decryptSession = exports.dbAuthSession = exports.cookieName = void 0;
exports.getDbAuthResponseBuilder = getDbAuthResponseBuilder;
exports.webAuthnSession = exports.legacyHashPassword = exports.isLegacySession = exports.hashToken = exports.hashPassword = exports.getSession = void 0;
var _slice = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/slice"));
var _concat = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/concat"));
var _trim = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/trim"));
var _find = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/find"));
var _fromEntries = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/object/from-entries"));
var _parseInt2 = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/parse-int"));
require("core-js/modules/esnext.json.parse.js");
var _nodeCrypto = _interopRequireDefault(require("node:crypto"));
var _api = require("@redwoodjs/api");
var _projectConfig = require("@redwoodjs/project-config");
var DbAuthError = _interopRequireWildcard(require("./errors"));
const DEFAULT_SCRYPT_OPTIONS = {
  cost: 2 ** 14,
  blockSize: 8,
  parallelization: 1
};
const getPort = () => {
  let configPath;
  try {
    configPath = (0, _projectConfig.getConfigPath)();
  } catch {
    // If this throws, we're in a serverless environment, and the `redwood.toml` file doesn't exist.
    return 8911;
  }
  return (0, _projectConfig.getConfig)(configPath).api.port;
};

// When in development environment, check for auth impersonation cookie
// if user has generated graphiql headers
const eventGraphiQLHeadersCookie = event => {
  if (process.env.NODE_ENV === 'development') {
    const impersationationHeader = (0, _api.getEventHeader)(event, 'rw-studio-impersonation-cookie');
    if (impersationationHeader) {
      return impersationationHeader;
    }

    // TODO: Remove code below when we remove the old way of passing the cookie
    // from Studio, and decide it's OK to break compatibility with older Studio
    // versions
    try {
      if (!(0, _api.isFetchApiRequest)(event)) {
        const jsonBody = JSON.parse(event.body ?? '{}');
        return jsonBody?.extensions?.headers?.cookie || jsonBody?.extensions?.headers?.Cookie;
      }
    } catch {
      // sometimes the event body isn't json
      return;
    }
  }
  return;
};

// decrypts session text using old CryptoJS algorithm (using node:crypto library)
const legacyDecryptSession = encryptedText => {
  const cypher = Buffer.from(encryptedText, 'base64');
  const salt = (0, _slice.default)(cypher).call(cypher, 8, 16);
  const password = (0, _concat.default)(Buffer).call(Buffer, [Buffer.from(process.env.SESSION_SECRET, 'binary'), salt]);
  const md5Hashes = [];
  let digest = password;
  for (let i = 0; i < 3; i++) {
    md5Hashes[i] = _nodeCrypto.default.createHash('md5').update(digest).digest();
    digest = (0, _concat.default)(Buffer).call(Buffer, [md5Hashes[i], password]);
  }
  const key = (0, _concat.default)(Buffer).call(Buffer, [md5Hashes[0], md5Hashes[1]]);
  const iv = md5Hashes[2];
  const contents = (0, _slice.default)(cypher).call(cypher, 16);
  const decipher = _nodeCrypto.default.createDecipheriv('aes-256-cbc', key, iv);
  return decipher.update(contents) + decipher.final('utf-8');
};

// Extracts the session cookie from an event, handling both
// development environment GraphiQL headers and production environment headers.
const extractCookie = event => {
  return eventGraphiQLHeadersCookie(event) || (0, _api.getEventHeader)(event, 'Cookie');
};
// whether this encrypted session was made with the old CryptoJS algorithm
exports.extractCookie = extractCookie;
const isLegacySession = text => {
  if (!text) {
    return false;
  }
  const [_encryptedText, iv] = text.split('|');
  return !iv;
};

// decrypts the session cookie and returns an array: [data, csrf]
exports.isLegacySession = isLegacySession;
const decryptSession = text => {
  if (!text || (0, _trim.default)(text).call(text) === '') {
    return [];
  }
  let decoded;
  // if cookie contains a pipe then it was encrypted using the `node:crypto`
  // algorithm (first element is the encrypted data, second is the initialization vector)
  // otherwise fall back to using the older CryptoJS algorithm
  const [encryptedText, iv] = text.split('|');
  try {
    if (iv) {
      // decrypt using the `node:crypto` algorithm
      const decipher = _nodeCrypto.default.createDecipheriv('aes-256-cbc', process.env.SESSION_SECRET.substring(0, 32), Buffer.from(iv, 'base64'));
      decoded = decipher.update(encryptedText, 'base64', 'utf-8') + decipher.final('utf-8');
    } else {
      decoded = legacyDecryptSession(text);
    }
    const [data, csrf] = decoded.split(';');
    const json = JSON.parse(data);
    return [json, csrf];
  } catch {
    throw new DbAuthError.SessionDecryptionError();
  }
};
exports.decryptSession = decryptSession;
const encryptSession = dataString => {
  const iv = _nodeCrypto.default.randomBytes(16);
  const cipher = _nodeCrypto.default.createCipheriv('aes-256-cbc', process.env.SESSION_SECRET.substring(0, 32), iv);
  let encryptedData = cipher.update(dataString, 'utf-8', 'base64');
  encryptedData += cipher.final('base64');
  return `${encryptedData}|${iv.toString('base64')}`;
};

// returns the actual value of the session cookie
exports.encryptSession = encryptSession;
const getSession = (text, cookieNameOption) => {
  var _context2;
  if (typeof text === 'undefined' || text === null) {
    return null;
  }
  const cookies = text.split(';');
  const sessionCookie = (0, _find.default)(cookies).call(cookies, cookie => {
    var _context;
    return (0, _trim.default)(_context = cookie.split('=')[0]).call(_context) === cookieName(cookieNameOption);
  });
  if (!sessionCookie || sessionCookie === `${cookieName(cookieNameOption)}=`) {
    return null;
  }
  return (0, _trim.default)(_context2 = sessionCookie.replace(`${cookieName(cookieNameOption)}=`, '')).call(_context2);
};

// Convenience function to get session, decrypt, and return session data all
// at once. Accepts the `event` argument from a Lambda function call and the
// name of the dbAuth session cookie
exports.getSession = getSession;
const dbAuthSession = (event, cookieNameOption) => {
  const sessionCookie = extractCookie(event);
  if (!sessionCookie) {
    return null;
  }

  // This is a browser making a request
  const [session, _csrfToken] = decryptSession(getSession(sessionCookie, cookieNameOption));
  return session;
};
exports.dbAuthSession = dbAuthSession;
const webAuthnSession = event => {
  var _context3, _context5;
  const cookieHeader = extractCookie(event);
  if (!cookieHeader) {
    return null;
  }
  const webAuthnCookie = (0, _find.default)(_context3 = cookieHeader.split(';')).call(_context3, cook => {
    var _context4;
    return (0, _trim.default)(_context4 = cook.split('=')[0]).call(_context4) === 'webAuthn';
  });
  if (!webAuthnCookie || webAuthnCookie === 'webAuthn=') {
    return null;
  }
  return (0, _trim.default)(_context5 = webAuthnCookie.split('=')[1]).call(_context5);
};
exports.webAuthnSession = webAuthnSession;
const hashToken = token => {
  return _nodeCrypto.default.createHash('sha256').update(token).digest('hex');
};

// hashes a password using either the given `salt` argument, or creates a new
// salt and hashes using that. Either way, returns an array with [hash, salt]
// normalizes the string in case it contains unicode characters: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/normalize
// TODO: Add validation that the options are valid values for the scrypt algorithm
exports.hashToken = hashToken;
const hashPassword = (text, {
  salt = _nodeCrypto.default.randomBytes(32).toString('hex'),
  options = DEFAULT_SCRYPT_OPTIONS
} = {}) => {
  const encryptedString = _nodeCrypto.default.scryptSync(text.normalize('NFC'), salt, 32, options).toString('hex');
  const optionsToString = [options.cost, options.blockSize, options.parallelization];
  return [`${encryptedString}|${optionsToString.join('|')}`, salt];
};

// uses the old algorithm from CryptoJS:
//   CryptoJS.PBKDF2(password, salt, { keySize: 8 }).toString()
exports.hashPassword = hashPassword;
const legacyHashPassword = (text, salt) => {
  const useSalt = salt || _nodeCrypto.default.randomBytes(32).toString('hex');
  return [_nodeCrypto.default.pbkdf2Sync(text, useSalt, 1, 32, 'SHA1').toString('hex'), useSalt];
};
exports.legacyHashPassword = legacyHashPassword;
const cookieName = name => {
  const port = getPort();
  const cookieName = name?.replace('%port%', '' + port) ?? 'session';
  return cookieName;
};

/**
 * Returns a builder for a lambda response
 *
 * This is used as the final call to return a response from the dbAuth handler
 *
 * Converts "Set-Cookie" headers to an array of strings or a multiValueHeaders
 * object
 */
exports.cookieName = cookieName;
function getDbAuthResponseBuilder(event) {
  return (response, corsHeaders) => {
    const headers = {
      ...(0, _fromEntries.default)(response.headers?.entries() || []),
      ...corsHeaders
    };
    const dbAuthResponse = {
      ...response,
      headers
    };
    const setCookieHeaders = response.headers?.getSetCookie() || [];
    if (setCookieHeaders.length > 0) {
      if ('multiValueHeaders' in event) {
        dbAuthResponse.multiValueHeaders = {
          'Set-Cookie': setCookieHeaders
        };
        delete headers['set-cookie'];
      } else {
        headers['set-cookie'] = setCookieHeaders;
      }
    }
    return dbAuthResponse;
  };
}
const extractHashingOptions = text => {
  const [_hash, ...options] = text.split('|');
  if (options.length === 3) {
    return {
      cost: (0, _parseInt2.default)(options[0]),
      blockSize: (0, _parseInt2.default)(options[1]),
      parallelization: (0, _parseInt2.default)(options[2])
    };
  } else {
    return {};
  }
};
exports.extractHashingOptions = extractHashingOptions;