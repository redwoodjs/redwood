import React, { Suspense } from "react";
const ServerRouteLoader = ({ spec, params }) => {
  const LazyRouteComponent = spec.LazyComponent;
  if (params) {
    delete params["ref"];
    delete params["key"];
  }
  return /* @__PURE__ */ React.createElement(Suspense, { fallback: /* @__PURE__ */ React.createElement("div", null, "Loading...") }, /* @__PURE__ */ React.createElement(LazyRouteComponent, { ...params }), /* @__PURE__ */ React.createElement(
    "div",
    {
      id: "redwood-announcer",
      style: {
        position: "absolute",
        top: 0,
        width: 1,
        height: 1,
        padding: 0,
        overflow: "hidden",
        clip: "rect(0, 0, 0, 0)",
        whiteSpace: "nowrap",
        border: 0
      },
      role: "alert",
      "aria-live": "assertive",
      "aria-atomic": "true"
    }
  ));
};
export {
  ServerRouteLoader
};
