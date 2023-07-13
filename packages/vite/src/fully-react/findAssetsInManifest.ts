import type { Manifest as BuildManifest } from 'vite'

/**
 * Traverses the module graph and collects assets for a given chunk
 *
 * @param manifest Client manifest
 * @param id Chunk id
 * @returns Array of asset URLs
 */
export const findAssetsInManifest = (
  manifest: BuildManifest,
  id: string
): Array<string> => {
  // TODO (RSC) Can we take assetMap as a parameter to reuse it across calls?
  // It's what the original implementation of this function does. But no
  // callers pass it in where we currently use this function.
  const assetMap: Map<string, Array<string>> = new Map()

  function traverse(id: string): Array<string> {
    const cached = assetMap.get(id)
    if (cached) {
      return cached
    }

    const chunk = manifest[id]
    if (!chunk) {
      return []
    }

    const assets = [
      ...(chunk.assets || []),
      ...(chunk.css || []),
      ...(chunk.imports?.flatMap(traverse) || []),
    ]
    const imports = chunk.imports?.flatMap(traverse) || []
    const all = [...assets, ...imports].filter(
      Boolean as unknown as (a: string | undefined) => a is string
    )

    all.push(chunk.file)
    assetMap.set(id, all)

    return Array.from(new Set(all))
  }

  return traverse(id)
}
