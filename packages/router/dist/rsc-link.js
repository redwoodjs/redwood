import React, { forwardRef } from "react";
const Link = forwardRef(({ to, ...rest }, ref) => {
  return /* @__PURE__ */ React.createElement("a", { href: to, ref, ...rest });
});
export {
  Link
};
