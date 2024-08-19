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
var version_exports = {};
__export(version_exports, {
  getCompatibilityData: () => getCompatibilityData
});
module.exports = __toCommonJS(version_exports);
var import_fs = __toESM(require("fs"), 1);
var import_path = __toESM(require("path"), 1);
var import_semver = __toESM(require("semver"), 1);
var import_project_config = require("@redwoodjs/project-config");
function getCorrespondingTag(version, distTags) {
  return Object.entries(distTags).find(([_, v]) => v === version)?.[0];
}
async function getCompatibilityData(packageName, preferredVersionOrTag) {
  const projectPackageJson = JSON.parse(
    import_fs.default.readFileSync(import_path.default.join((0, import_project_config.getPaths)().base, "package.json"), {
      encoding: "utf8"
    })
  );
  const projectRedwoodVersion = projectPackageJson.devDependencies["@redwoodjs/core"];
  const semverVersion = import_semver.default.parse(preferredVersionOrTag);
  const isUsingTag = semverVersion === null;
  const res = await fetch(`https://registry.npmjs.org/${packageName}`);
  const packument = await res.json();
  if (packument.error !== void 0) {
    throw new Error(packument.error);
  }
  if (isUsingTag) {
    if (packument["dist-tags"][preferredVersionOrTag] === void 0) {
      throw new Error(
        `The package '${packageName}' does not have a tag '${preferredVersionOrTag}'`
      );
    }
  } else {
    if (packument.versions[preferredVersionOrTag] === void 0) {
      throw new Error(
        `The package '${packageName}' does not have a version '${preferredVersionOrTag}'`
      );
    }
  }
  const preferredVersion = isUsingTag ? packument["dist-tags"][preferredVersionOrTag] : preferredVersionOrTag;
  const packageRedwoodSpecification = packument.versions[preferredVersion].engines?.redwoodjs;
  if (packageRedwoodSpecification !== void 0 && import_semver.default.intersects(projectRedwoodVersion, packageRedwoodSpecification)) {
    const tag = getCorrespondingTag(preferredVersion, packument["dist-tags"]);
    return {
      preferred: {
        tag,
        version: preferredVersion
      },
      compatible: {
        tag,
        version: preferredVersion
      }
    };
  }
  const versions = import_semver.default.sort(Object.keys(packument.versions));
  for (let i = versions.length - 1; i >= 0; i--) {
    const redwoodVersionRequired = packument.versions[versions[i]].engines?.redwoodjs;
    if (redwoodVersionRequired === void 0) {
      continue;
    }
    if (import_semver.default.intersects(projectRedwoodVersion, redwoodVersionRequired)) {
      return {
        preferred: {
          tag: getCorrespondingTag(preferredVersion, packument["dist-tags"]),
          version: preferredVersion
        },
        compatible: {
          tag: getCorrespondingTag(versions[i], packument["dist-tags"]),
          version: versions[i]
        }
      };
    }
  }
  throw new Error(`No compatible version of '${packageName}' was found`);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  getCompatibilityData
});
