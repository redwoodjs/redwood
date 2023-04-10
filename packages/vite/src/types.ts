export interface RWRouteManifestItem {
  matchRegexString: string | null
  routeHooks: string | null
  bundle: string | null
  pathDefinition: PathDefinition
  hasParams: boolean
  name: string
  redirect: { to: string; permanent: boolean } | null
  renderMode: 'html' | 'stream'
}

export type RWRouteManifest = Record<PathDefinition, RWRouteManifestItem>

type PathDefinition = string
