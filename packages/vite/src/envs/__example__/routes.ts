import path from 'node:path'

import type { ModuleRunner } from 'vite/module-runner'

export async function getPageForRoute(
  pathname: string,
  { viteEnvRunner }: { viteEnvRunner: ModuleRunner },
) {
  let p = routes[pathname]
  if (!p) {
    return
  }
  p = path.join(import.meta.dirname, p)
  const module = await viteEnvRunner.import(p)
  if (!module.default) {
    throw new Error('Imported "Page" module does not have a "default" export.')
  }
  return module.default
}

// This "route" map will be generated via Plugin, accessible from virtual module based on the contents of the
// user's Routes.tsx
export const routes: Record<string, string> = {
  '/': './pages/Home',
  '/test-1': './pages/Test1',
  '/test-2': './pages/Test2',
}
