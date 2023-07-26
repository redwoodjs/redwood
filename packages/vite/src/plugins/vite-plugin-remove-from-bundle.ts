import type { PluginOption } from 'vite'

type ModulesToExclude = Array<{ id: RegExp; parentId?: RegExp }>

/**
 *
 * This is a vite plugin to remove modules from the bundle.
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
    config: () => {
      return {
        build: {
          rollupOptions: {
            external(id, parentId = '') {
              const shouldExcludeModule = modulesToExclude.some((module) => {
                return getShouldExclude({
                  id,
                  parentId,
                  idToExclude: module.id,
                  parentIdToExclude: module.parentId,
                })
              })

              return shouldExcludeModule
            },
          },
        },
      }
    },
  }
}

export function getShouldExclude({
  id,
  idToExclude,
  parentId = '',
  parentIdToExclude,
}: {
  id: string
  idToExclude: RegExp
  parentId?: string
  parentIdToExclude?: RegExp
}) {
  if (parentIdToExclude) {
    return idToExclude.test(id) && parentIdToExclude.test(parentId)
  }

  return idToExclude.test(id)
}
