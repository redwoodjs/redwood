import React from 'react'

import { render } from '@testing-library/react'
import type { RenderResult } from '@testing-library/react'
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

export const customRenderHook = <Result, Props>(
  render: (props: Props) => Result,
  options?: RenderHookOptions<Props>
): RenderHookResult<Result, Props> => {
  return renderHook(render, {
    wrapper: (props) => <MockProviders {...props} />,
    ...options,
  })
}
