import { initConfig } from "./config.js";
import { downloadTemplate } from "./download.js";
import { ExitCodeError } from "./error.js";
import { initialCommit } from "./git.js";
import { install } from "./install.js";
import { setInstallationDir } from "./installationDir.js";
import { checkNodeVersion, checkYarnInstallation } from "./prerequisites.js";
import { unzip } from "./zip.js";

console.log(
  "This is a very opinionated CLI tool aimed to get you started as fast as " +
    "possible with a new RedwoodJS RSC project.\n\nRun with `--interactive` " +
    "or `-i` to start in interactive mode where you can answer questions to " +
    "customize the setup.\n",
);

const config = initConfig();

try {
  await checkNodeVersion(config);
  checkYarnInstallation(config);
  await setInstallationDir(config);
  const templateZipPath = await downloadTemplate(config);
  await unzip(config, templateZipPath);
  await install(config);
  await initialCommit(config);

  console.log();
  console.log("🎉 Done!");
  console.log();
  console.log(
    "You can now run the following commands to build and serve the included " +
      "example application",
  );
  console.log();
  console.log("cd " + config.installationDir);
  console.log("yarn rw build -v && yarn rw serve");
} catch (e) {
  // using process.exitCode instead of `process.exit(1) to give Node a chance to properly
  // clean up
  // See https://github.com/eslint-community/eslint-plugin-n/blob/master/docs/rules/no-process-exit.md

  if (e instanceof ExitCodeError) {
    if (e.exitCode === 0) {
      console.log("👋 Exiting");
    } else {
      console.log();
      console.error("🚨 An error occurred:");
      console.error(e.message);
    }

    process.exitCode = e.exitCode;
  } else {
    console.log();
    console.error("🚨 An error occurred:");
    console.error(e);
    process.exitCode = 1;
  }
}
