import React from 'react'

import { render } from '@testing-library/react'
import type { RenderResult } from '@testing-library/react'
// the @testing-library/react-hooks library is being depreciated as the
// functionality is moving into version 13 of the @testing-library / react
// However, version 13 of @testing-library/react depreciates support of
// React 17.  Thus, we can remove the @testing-library / react-hooks after
// moving Redwood to React 18
import { renderHook } from '@testing-library/react-hooks'
import type {
  RenderHookOptions,
  RenderHookResult,
} from '@testing-library/react-hooks'

import { MockProviders } from './MockProviders'

export const customRender = (
  ui: React.ReactElement,
  options = {}
): RenderResult => {
  return render(ui, {
    wrapper: (props) => <MockProviders {...props} />,
    ...options,
  })
}

export const customRenderHook = <Props, Result>(
  render: (props: Props) => Result,
  options?: RenderHookOptions<Props>
): RenderHookResult<Props, Result> => {
  return renderHook(render, {
    wrapper: (props: any) => <MockProviders {...props} />,
    ...options,
  })
}
