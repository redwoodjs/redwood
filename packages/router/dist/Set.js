import React from "react";
function Set(props) {
  return /* @__PURE__ */ React.createElement(React.Fragment, null, props.children);
}
function Private(props) {
  return /* @__PURE__ */ React.createElement(React.Fragment, null, props.children);
}
function PrivateSet(props) {
  return /* @__PURE__ */ React.createElement(React.Fragment, null, props.children);
}
const isSetNode = (node) => {
  return React.isValidElement(node) && (node.type === Set || node.type === PrivateSet || node.type === Private) && // Don't even bother including Sets without children. They're useless.
  node.props.children;
};
const isPrivateSetNode = (node) => {
  return React.isValidElement(node) && node.type === PrivateSet;
};
const isPrivateNode = (node) => {
  return React.isValidElement(node) && node.type === Private;
};
export {
  Private,
  PrivateSet,
  Set,
  isPrivateNode,
  isPrivateSetNode,
  isSetNode
};
