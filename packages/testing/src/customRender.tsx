import React from 'react'

import { render } from '@testing-library/react'

import { MockProviders } from './MockProviders'

import type { RenderResult } from '@testing-library/react'

export const customRender = (
  ui: React.ReactElement,
  options = {}
): RenderResult => {
  return render(ui, {
    wrapper: (props) => <MockProviders {...props} />,
    ...options,
  })
}
