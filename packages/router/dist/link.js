"use client";
import React, { forwardRef } from "react";
import { navigate } from "./history.js";
const Link = forwardRef(({ to, onClick, options, ...rest }, ref) => /* @__PURE__ */ React.createElement(
  "a",
  {
    href: to,
    ref,
    ...rest,
    onClick: (event) => {
      if (event.button !== 0 || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
        return;
      }
      event.preventDefault();
      if (onClick) {
        const result = onClick(event);
        if (typeof result !== "boolean" || result) {
          navigate(to, options);
        }
      } else {
        navigate(to, options);
      }
    }
  }
));
export {
  Link
};
