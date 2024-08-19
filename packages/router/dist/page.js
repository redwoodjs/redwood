function isSpec(specOrPage) {
  return specOrPage.LazyComponent !== void 0;
}
function normalizePage(specOrPage) {
  if (isSpec(specOrPage)) {
    return specOrPage;
  }
  return {
    name: specOrPage.name,
    prerenderLoader: () => ({ default: specOrPage }),
    LazyComponent: specOrPage
  };
}
export {
  isSpec,
  normalizePage
};
