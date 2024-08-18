"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js/object/define-property");
var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
_Object$defineProperty(exports, "__esModule", {
  value: true
});
exports.checkAndTransformReactRoot = checkAndTransformReactRoot;
exports.checkAndUpdateCustomWebIndex = checkAndUpdateCustomWebIndex;
exports.upgradeReactDepsTo18 = upgradeReactDepsTo18;
require("core-js/modules/esnext.json.parse.js");
var _filter = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/filter"));
var _stringify = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/json/stringify"));
var _find = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/find"));
var _entries = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/object/entries"));
var _fs = _interopRequireDefault(require("fs"));
var _path = _interopRequireDefault(require("path"));
var _cheerio = require("cheerio");
var _execa = _interopRequireDefault(require("execa"));
var _projectConfig = require("@redwoodjs/project-config");
function checkAndTransformReactRoot(taskContext) {
  const indexHTMLFilepath = _path.default.join((0, _projectConfig.getPaths)().web.src, 'index.html');
  const indexHTML = (0, _cheerio.load)(_fs.default.readFileSync(indexHTMLFilepath, 'utf-8'));
  const reactRoot = indexHTML('#redwood-app');
  const reactRootChildren = reactRoot.children();
  if (reactRootChildren.length) {
    var _context;
    let reactRootHTML = reactRoot.html();
    if (!reactRootHTML) {
      throw new Error(`Couldn't get HTML in react root (div with id="redwood-app")`);
    }
    reactRootHTML = (0, _filter.default)(_context = reactRootHTML.replace('<!-- Please keep the line below for prerender support. -->', '').replace('&lt;%= prerenderPlaceholder %&gt;', '').split('\n')).call(_context, line => line.match(/\S/)).join('\n');
    taskContext.setWarning([`The react root (<div id="redwood-app"></div>) in ${indexHTMLFilepath} has children:`, '', reactRootHTML, '', 'React expects to control this DOM node completely. This codemod has moved the children outside the react root,', 'but consider moving them into a layout.'].join('\n'));
  }
  indexHTML('body').append(reactRootChildren);
  reactRoot.text('');
  _fs.default.writeFileSync(indexHTMLFilepath, indexHTML.html());
}
async function upgradeReactDepsTo18() {
  const redwoodProjectPaths = (0, _projectConfig.getPaths)();
  const webPackageJSONPath = _path.default.join(redwoodProjectPaths.web.base, 'package.json');
  const webPackageJSON = JSON.parse(_fs.default.readFileSync(webPackageJSONPath, 'utf-8'));
  const latestReactVersion = '18.2.0';
  for (const requiredReactDep of ['react', 'react-dom']) {
    if (!Object.hasOwn(webPackageJSON.dependencies, requiredReactDep)) {
      throw new Error(`Couldn't find ${requiredReactDep} in web/package.json dependencies`);
    }
    webPackageJSON.dependencies[requiredReactDep] = latestReactVersion;
  }
  _fs.default.writeFileSync(webPackageJSONPath, (0, _stringify.default)(webPackageJSON, null, 2));
  await _execa.default.command('yarn install', {
    cwd: redwoodProjectPaths.base
  });
}
async function checkAndUpdateCustomWebIndex(taskContext) {
  var _context2;
  // First check if the custom web index exists. If it doesn't, this is a no-op.
  const redwoodProjectPaths = (0, _projectConfig.getPaths)();
  const bundlerToCustomWebIndex = {
    vite: _path.default.join(redwoodProjectPaths.web.src, 'entry-client.jsx'),
    webpack: _path.default.join(redwoodProjectPaths.web.src, 'index.js')
  };
  const customWebIndexFound = (0, _find.default)(_context2 = (0, _entries.default)(bundlerToCustomWebIndex)).call(_context2, ([, filepath]) => _fs.default.existsSync(filepath));
  if (!customWebIndexFound) {
    return;
  }
  _fs.default.writeFileSync(customWebIndexFound[1], customWebIndexTemplate);
  taskContext.setWarning([`We updated the custom web index for you at ${customWebIndexFound[1]}.`, "  If you made manual changes to this file, you'll have to copy them over manually from the diff."].join('\n'));
}
const customWebIndexTemplate = `\
import { hydrateRoot, createRoot } from 'react-dom/client'

import App from './App'
/**
 * When \`#redwood-app\` isn't empty then it's very likely that you're using
 * prerendering. So React attaches event listeners to the existing markup
 * rather than replacing it.
 * https://reactjs.org/docs/react-dom-client.html#hydrateroot
 */
const redwoodAppElement = document.getElementById('redwood-app')

if (redwoodAppElement.children?.length > 0) {
  hydrateRoot(redwoodAppElement, <App />)
} else {
  const root = createRoot(redwoodAppElement)
  root.render(<App />)
}
`;