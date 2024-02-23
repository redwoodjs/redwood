import type { FunctionComponent } from 'react'

export type GetEntry = (
  rscId: string
) => Promise<FunctionComponent | { default: FunctionComponent } | null>

export type GetBuilder = (
  // FIXME (from original waku code) can we somehow avoid leaking internal
  // implementation?
  unstable_decodeId: (encodedId: string) => [id: string, name: string]
) => Promise<{
  [pathStr: string]: {
    elements?: Iterable<
      readonly [rscId: string, props: unknown, skipPrefetch?: boolean]
    >
    customCode?: string // optional code to inject
  }
}>

/**
 * Used to look up the component to import when calling
 * `renderFromRscServer('MyPage')` in Routes.tsx
 */
export function defineEntries(getEntry: GetEntry, getBuilder?: GetBuilder) {
  return { getEntry, getBuilder }
}
