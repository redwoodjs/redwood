import execa from "execa";
import { getPaths } from "./paths.js";
const addWebPackages = (webPackages) => ({
  title: "Adding required web packages...",
  task: async () => {
    await execa("yarn", ["add", ...webPackages], { cwd: getPaths().web.base });
  }
});
const addApiPackages = (apiPackages) => ({
  title: "Adding required api packages...",
  task: async () => {
    await execa("yarn", ["add", ...apiPackages], { cwd: getPaths().api.base });
  }
});
const addRootPackages = (packages, devDependency = false) => {
  const addMode = devDependency ? ["add", "-D"] : ["add"];
  return {
    title: "Installing packages...",
    task: async () => {
      await execa("yarn", [...addMode, ...packages], { cwd: getPaths().base });
    }
  };
};
const installPackages = {
  title: "Installing packages...",
  task: async () => {
    await execa("yarn", ["install"], { cwd: getPaths().base });
  }
};
export {
  addApiPackages,
  addRootPackages,
  addWebPackages,
  installPackages
};
