import { getPaths as _getPaths } from "@redwoodjs/project-config";
import { colors } from "./colors.js";
function isErrorWithMessage(e) {
  return !!e.message;
}
function getPaths() {
  try {
    return _getPaths();
  } catch (e) {
    if (isErrorWithMessage(e)) {
      console.error(colors.error(e.message));
    }
    process.exit(1);
  }
}
export {
  getPaths
};
