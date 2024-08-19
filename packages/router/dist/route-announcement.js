import React from "react";
const RouteAnnouncement = ({
  children,
  visuallyHidden = false,
  ...props
}) => {
  const hiddenStyle = {
    position: `absolute`,
    top: `0`,
    width: `1`,
    height: `1`,
    padding: `0`,
    overflow: `hidden`,
    clip: `rect(0, 0, 0, 0)`,
    whiteSpace: `nowrap`,
    border: `0`
  };
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      ...props,
      "data-redwood-route-announcement": true,
      style: visuallyHidden ? hiddenStyle : {}
    },
    children
  );
};
var route_announcement_default = RouteAnnouncement;
export {
  route_announcement_default as default
};
