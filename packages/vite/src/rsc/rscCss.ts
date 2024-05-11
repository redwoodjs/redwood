import fs from 'node:fs'
import path from 'node:path'

import { getPaths } from '@redwoodjs/project-config'

export function getRscStylesheetLinkGenerator(existingLinks?: string[]) {
  const clientBuildManifestPath = path.join(
    getPaths().web.distClient,
    'client-build-manifest.json',
  )
  const clientBuildManifest = JSON.parse(
    fs.readFileSync(clientBuildManifestPath, 'utf-8'),
  )
  const clientCss = extractCssMappingFromManifest(clientBuildManifest)

  const serverBuildManifestPath = path.join(
    getPaths().web.distRsc,
    'server-build-manifest.json',
  )
  const serverBuildManifest = JSON.parse(
    fs.readFileSync(serverBuildManifestPath, 'utf-8'),
  )
  const serverCss = extractCssMappingFromManifest(serverBuildManifest)

  const allCss = new Set<string>()
  for (const cssList of clientCss.values()) {
    for (const css of cssList) {
      allCss.add(css)
    }
  }
  for (const cssList of serverCss.values()) {
    for (const css of cssList) {
      allCss.add(css)
    }
  }

  const cssLinks = Array.from(allCss)
  return () => [...(existingLinks || []), ...cssLinks]
}

function extractCssMappingFromManifest(manifest: Record<string, any>) {
  const manifestCss = new Map<string, string[]>()
  const lookupCssAssets = (id: string): string[] => {
    const assets: string[] = []
    const asset = manifest[id]
    if (!asset) {
      return assets
    }
    if (asset.css) {
      assets.push(...asset.css)
    }
    if (asset.imports) {
      for (const importId of asset.imports) {
        assets.push(...lookupCssAssets(importId))
      }
    }
    return assets
  }
  for (const key of Object.keys(manifest)) {
    manifestCss.set(key, lookupCssAssets(key))
  }
  return manifestCss
}
