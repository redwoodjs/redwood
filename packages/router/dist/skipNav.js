import * as React from "react";
const defaultId = "reach-skip-nav";
const SkipNavLink = React.forwardRef(function SkipNavLink2({ as: Comp = "a", children = "Skip to content", contentId, ...props }, forwardedRef) {
  const id = contentId || defaultId;
  return /* @__PURE__ */ React.createElement(
    Comp,
    {
      ...props,
      ref: forwardedRef,
      href: `#${id}`,
      "data-reach-skip-link": "",
      "data-reach-skip-nav-link": ""
    },
    children
  );
});
SkipNavLink.displayName = "SkipNavLink";
const SkipNavContent = React.forwardRef(function SkipNavContent2({ as: Comp = "div", id: idProp, ...props }, forwardedRef) {
  const id = idProp || defaultId;
  return /* @__PURE__ */ React.createElement(
    Comp,
    {
      ...props,
      ref: forwardedRef,
      id,
      "data-reach-skip-nav-content": ""
    }
  );
});
SkipNavContent.displayName = "SkipNavContent";
export {
  SkipNavContent,
  SkipNavLink
};
