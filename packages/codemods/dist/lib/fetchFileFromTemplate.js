"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js/object/define-property");
_Object$defineProperty(exports, "__esModule", {
  value: true
});
exports.default = fetchFileFromTemplate;
var _fetch = require("@whatwg-node/fetch");
/**
 * @param tag should be something like 'v0.42.1'
 * @param file should be something like 'prettier.config.js', 'api/src/index.ts', 'web/src/index.ts'
 */
async function fetchFileFromTemplate(tag, file) {
  const URL = `https://raw.githubusercontent.com/redwoodjs/redwood/${tag}/packages/create-redwood-app/template/${file}`;
  const res = await (0, _fetch.fetch)(URL);
  return res.text();
}