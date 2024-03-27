import type { FunctionComponent } from 'react'

export type GetEntry = (
  rscId: string,
) => Promise<FunctionComponent | { default: FunctionComponent } | null>

/**
 * Used to look up the component to import when calling
 * `renderFromRscServer('MyPage')` in Routes.tsx
 */
export function defineEntries(getEntry: GetEntry) {
  return { getEntry }
}
