export interface RWRouteManifestItem {
  matchRegexString: string | null
  routeHooks: string | null
  bundle: string | null
  pathDefinition: PathDefinition
  name: string
  redirect: { to: string; permanent: boolean } | null
}

export type RWRouteManifest = Record<PathDefinition, RWRouteManifestItem>

type PathDefinition = string
