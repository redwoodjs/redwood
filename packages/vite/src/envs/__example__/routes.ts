export async function getPageForRoute(pathname: string) {
  // Pretty sure this can be resolved if I can infer the string...
  if (!routes[pathname]) {
    return
  }

  const module = await routes[pathname]()
  if (!module.default) {
    throw new Error("Imported 'Page' module does not have a 'default' export.")
  }
  return module.default
}

// This "route" map will be generated via Plugin, accessible from virtual module based on the contents of the
// user's Routes.tsx
export const routes: Record<string, () => Promise<any>> = {
  '/': () => import('./pages/Home.jsx'),
  '/test-1': () => import('./pages/Test1.jsx'),
  '/test-2': () => import('./pages/Test2.jsx'),
}
