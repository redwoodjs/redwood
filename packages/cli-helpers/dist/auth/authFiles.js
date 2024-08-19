import fs from "fs";
import path from "path";
import pascalcase from "pascalcase";
import { transformTSToJS } from "../lib/index.js";
import { getPaths } from "../lib/paths.js";
import { isTypeScriptProject } from "../lib/project.js";
const apiSideFiles = async ({ basedir, webAuthn }) => {
  const apiSrcPath = getPaths().api.src;
  const apiBaseTemplatePath = path.join(basedir, "templates", "api");
  const templateDirectories = fs.readdirSync(apiBaseTemplatePath);
  let filesRecord = {};
  for (const dir of templateDirectories) {
    const templateFiles = fs.readdirSync(path.join(apiBaseTemplatePath, dir));
    const filePaths = templateFiles.filter((fileName) => {
      const fileNameParts = fileName.split(".");
      return fileNameParts.length <= 3 || fileNameParts.at(-3) !== "webAuthn";
    }).map((fileName) => {
      let outputFileName = fileName.replace(/\.template$/, "");
      if (!isTypeScriptProject()) {
        outputFileName = outputFileName.replace(/\.ts(x?)$/, ".js$1");
      }
      if (!webAuthn) {
        return { templateFileName: fileName, outputFileName };
      }
      const webAuthnFileName = fileName.split(".").reverse().map((part, i) => i === 1 ? "webAuthn." + part : part).reverse().join(".");
      if (templateFiles.includes(webAuthnFileName)) {
        return { templateFileName: webAuthnFileName, outputFileName };
      } else {
        return { templateFileName: fileName, outputFileName };
      }
    }).map((f) => {
      const templateFilePath = path.join(
        apiBaseTemplatePath,
        dir,
        f.templateFileName
      );
      const outputFilePath = path.join(apiSrcPath, dir, f.outputFileName);
      return { templateFilePath, outputFilePath };
    });
    for (const paths of filePaths) {
      const content = fs.readFileSync(paths.templateFilePath, "utf8");
      filesRecord = {
        ...filesRecord,
        [paths.outputFilePath]: isTypeScriptProject() ? content : await transformTSToJS(paths.outputFilePath, content)
      };
    }
  }
  return filesRecord;
};
function generateUniqueFileNames(filesRecord, provider) {
  const newFilesRecord = {};
  Object.keys(filesRecord).forEach((fullPath) => {
    let newFullPath = fullPath;
    let i = 1;
    while (fs.existsSync(newFullPath)) {
      const nameParts = path.basename(fullPath).split(".");
      if (nameParts[0] === provider) {
        const newFileName = provider + (i + 1) + "." + nameParts.slice(1).join(".");
        newFullPath = path.join(path.dirname(fullPath), newFileName);
      } else {
        const count = i > 1 ? i : "";
        const newFileName = provider + pascalcase(nameParts[0]) + count + "." + nameParts.slice(1).join(".");
        newFullPath = path.join(path.dirname(fullPath), newFileName);
      }
      i++;
    }
    newFilesRecord[newFullPath] = filesRecord[fullPath];
  });
  return newFilesRecord;
}
export {
  apiSideFiles,
  generateUniqueFileNames
};
