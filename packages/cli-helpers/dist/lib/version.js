import fs from "fs";
import path from "path";
import semver from "semver";
import { getPaths } from "@redwoodjs/project-config";
function getCorrespondingTag(version, distTags) {
  return Object.entries(distTags).find(([_, v]) => v === version)?.[0];
}
async function getCompatibilityData(packageName, preferredVersionOrTag) {
  const projectPackageJson = JSON.parse(
    fs.readFileSync(path.join(getPaths().base, "package.json"), {
      encoding: "utf8"
    })
  );
  const projectRedwoodVersion = projectPackageJson.devDependencies["@redwoodjs/core"];
  const semverVersion = semver.parse(preferredVersionOrTag);
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
  if (packageRedwoodSpecification !== void 0 && semver.intersects(projectRedwoodVersion, packageRedwoodSpecification)) {
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
  const versions = semver.sort(Object.keys(packument.versions));
  for (let i = versions.length - 1; i >= 0; i--) {
    const redwoodVersionRequired = packument.versions[versions[i]].engines?.redwoodjs;
    if (redwoodVersionRequired === void 0) {
      continue;
    }
    if (semver.intersects(projectRedwoodVersion, redwoodVersionRequired)) {
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
export {
  getCompatibilityData
};
