import type { PluginOption } from 'vite'

type ModulesToExclude = Array<{ id: RegExp }>

/**
 *
 * This is a vite plugin to remove modules from the bundle.
 *
 * Only applies on build, not on dev.
 *
 */
export default function removeFromBundle(
  modulesToExclude: ModulesToExclude
): PluginOption {
  const isMissingIdToExclude = modulesToExclude.some(
    (module) => module.id === undefined
  )

  if (isMissingIdToExclude) {
    throw new Error('You must specify an id to exclude')
  }

  return {
    name: 'remove-from-bundle',
    apply: 'build', // <-- @MARK important
    load: (id) => {
      return excludeOnMatch(modulesToExclude, id)
    },
  }
}

// Currently configured for CJS only.
const EMPTY_MODULE = {
  code: `module.exports = null`,
}

export function excludeOnMatch(modulesToExclude: ModulesToExclude, id: string) {
  if (modulesToExclude.some((module) => module.id.test(id))) {
    // Return an empty module
    return EMPTY_MODULE
  }

  // Fallback to regular loaders
  return null
}
