import path from 'node:path'

import type { ModuleNode, ViteDevServer } from 'vite'

async function find_deps(
  vite: import('vite').ViteDevServer,
  node: import('vite').ModuleNode,
  deps: Set<import('vite').ModuleNode>
) {
  // since `ssrTransformResult.deps` contains URLs instead of `ModuleNode`s, this process is asynchronous.
  // instead of using `await`, we resolve all branches in parallel.
  const branches: Promise<void>[] = []

  async function add(node: import('vite').ModuleNode) {
    if (!deps.has(node)) {
      deps.add(node)
      await find_deps(vite, node, deps)
    }
  }

  async function add_by_url(url: string) {
    const node = await vite.moduleGraph.getModuleByUrl(url)

    if (node) {
      await add(node)
    }
  }

  if (node.ssrTransformResult) {
    if (node.ssrTransformResult.deps) {
      node.ssrTransformResult.deps.forEach((url) =>
        branches.push(add_by_url(url))
      )
    }

    // if (node.ssrTransformResult.dynamicDeps) {
    //   node.ssrTransformResult.dynamicDeps.forEach(url => branches.push(add_by_url(url)));
    // }
  } else {
    node.importedModules.forEach((node) => branches.push(add(node)))
  }

  await Promise.all(branches)
}

// Vite doesn't expose this so we just copy the list for now
// https://github.com/vitejs/vite/blob/3edd1af56e980aef56641a5a51cf2932bb580d41/packages/vite/src/node/plugins/css.ts#L96
const style_pattern = /\.(css|less|sass|scss|styl|stylus|pcss|postcss)$/
// TODO (RSC) fully-react didn't use this anywhere. But do we need it for module support?
// const module_style_pattern =
//   /\.module\.(css|less|sass|scss|styl|stylus|pcss|postcss)$/

export async function collectStyles(devServer: ViteDevServer, match: string[]) {
  const styles: { [key: string]: string } = {}
  const deps = new Set<ModuleNode>()
  try {
    for (const file of match) {
      const resolvedId = await devServer.pluginContainer.resolveId(file)

      if (!resolvedId) {
        console.log('not found')
        continue
      }

      const id = resolvedId.id

      const normalizedPath = path.resolve(id).replace(/\\/g, '/')
      let node = devServer.moduleGraph.getModuleById(normalizedPath)
      if (!node) {
        const absolutePath = path.resolve(file)
        await devServer.ssrLoadModule(absolutePath)
        node = await devServer.moduleGraph.getModuleByUrl(absolutePath)

        if (!node) {
          console.log('not found')
          return
        }
      }

      await find_deps(devServer, node, deps)
    }
  } catch (e) {
    console.error(e)
  }

  for (const dep of deps) {
    // const parsed = new URL(dep.url, 'http://localhost/')
    // const query = parsed.searchParams

    if (style_pattern.test(dep.file ?? '')) {
      try {
        const mod = await devServer.ssrLoadModule(dep.url)
        // if (module_style_pattern.test(dep.file)) {
        // 	styles[dep.url] = env.cssModules?.[dep.file];
        // } else {
        styles[dep.url] = mod.default
        // }
      } catch {
        // this can happen with dynamically imported modules, I think
        // because the Vite module graph doesn't distinguish between
        // static and dynamic imports? TODO investigate, submit fix
      }
    }
  }
  return styles
}
