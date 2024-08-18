"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js/object/define-property");
var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
_Object$defineProperty(exports, "__esModule", {
  value: true
});
exports.updateDevFatalErrorPage = void 0;
var _fs = _interopRequireDefault(require("fs"));
var _path = _interopRequireDefault(require("path"));
var _fetch = require("@whatwg-node/fetch");
var _projectConfig = require("@redwoodjs/project-config");
/**
 * Fetches the FatalErrorPage from the create-redwood-app template and replaces
 * the current one in the project
 */
const updateDevFatalErrorPage = async () => {
  const rwPaths = (0, _projectConfig.getPaths)();
  const webFatalErrorPagesDir = _path.default.join(rwPaths.web.pages, 'FatalErrorPage');
  const filename = _path.default.join(webFatalErrorPagesDir, 'FatalErrorPage');
  const url = 'https://raw.githubusercontent.com/redwoodjs/redwood/29138f59dc5abe7b3d3c2a11c6e6f5fee32580c5/packages/create-redwood-app/templates/ts/web/src/pages/FatalErrorPage/FatalErrorPage.tsx';
  const isTsxPage = _fs.default.existsSync(_path.default.join(webFatalErrorPagesDir, 'FatalErrorPage.tsx'));
  const isJsxPage = _fs.default.existsSync(_path.default.join(webFatalErrorPagesDir, 'FatalErrorPage.jsx'));
  const ext = isTsxPage ? 'tsx' : isJsxPage ? 'jsx' : 'js';
  const res = await (0, _fetch.fetch)(url);
  const text = await res.text();
  const newFatalErrorPage = `${filename}.${ext}`;
  _fs.default.writeFileSync(newFatalErrorPage, text);
};
exports.updateDevFatalErrorPage = updateDevFatalErrorPage;