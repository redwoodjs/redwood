const getAnnouncement = () => {
  const routeAnnouncement = globalThis?.document.querySelectorAll(
    "[data-redwood-route-announcement]"
  )?.[0];
  if (routeAnnouncement?.textContent) {
    return routeAnnouncement.textContent;
  }
  const pageHeading = globalThis?.document.querySelector(`h1`);
  if (pageHeading?.textContent) {
    return pageHeading.textContent;
  }
  if (globalThis?.document.title) {
    return document.title;
  }
  return `new page at ${globalThis?.location.pathname}`;
};
const getFocus = () => {
  const routeFocus = globalThis?.document.querySelectorAll(
    "[data-redwood-route-focus]"
  )?.[0];
  if (!routeFocus?.children.length || routeFocus.children[0].tabIndex < 0) {
    return null;
  }
  return routeFocus.children[0];
};
const resetFocus = () => {
  globalThis?.document.body.setAttribute("tabindex", "-1");
  globalThis?.document.body.focus();
  globalThis?.document.body.removeAttribute("tabindex");
};
export {
  getAnnouncement,
  getFocus,
  resetFocus
};
