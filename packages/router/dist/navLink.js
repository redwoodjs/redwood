"use client";
import React, { forwardRef } from "react";
import { Link } from "./link.js";
import { useMatch } from "./useMatch.js";
import { flattenSearchParams } from "./util.js";
const NavLink = forwardRef(
  ({
    to,
    activeClassName,
    activeMatchParams,
    matchSubPaths,
    className,
    onClick,
    ...rest
  }, ref) => {
    const [pathname, queryString] = to.split("?");
    const searchParams = activeMatchParams || flattenSearchParams(queryString);
    const matchInfo = useMatch(pathname, {
      searchParams,
      matchSubPaths
    });
    return /* @__PURE__ */ React.createElement(
      Link,
      {
        ref,
        to,
        onClick,
        className: matchInfo.match ? activeClassName : className,
        ...rest
      }
    );
  }
);
export {
  NavLink
};
