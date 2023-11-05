import type { ViteDevServer, ModuleNode } from 'vite'

/**
 * Collect SSR CSS for Vite
 */
export const componentsModules = (
  components: string[],
  vite: ViteDevServer
) => {
  const matchedModules: Set<ModuleNode> = new Set()
  components.forEach((component) => {
    const modules = vite.moduleGraph.getModulesByFile(component)
    modules?.forEach((mod) => {
      matchedModules.add(mod)
    })
  })
  return matchedModules
}

export const collectCssPaths = (
  mods: Set<ModuleNode>,
  cssLinks = new Set<string>(),
  checkedComponents = new Set()
) => {
  for (const mod of mods) {
    if (mod.file?.endsWith('.scss') || mod.file?.endsWith('.css')) {
      cssLinks.add(mod.url)
    }
    if (mod.importedModules.size > 0 && !checkedComponents.has(mod.id)) {
      checkedComponents.add(mod.id)
      collectCssPaths(mod.importedModules, cssLinks, checkedComponents)
    }
  }

  return cssLinks
}
