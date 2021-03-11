import React from 'react'

import { render } from '@testing-library/react'

import { MockProviders } from './MockProviders'

type RenderParams = Parameters<typeof render>
/**
 * Wraps testing library's `render` function with our own MockProviders.
 */
export const customRender = (ui: RenderParams[0], options: RenderParams[1]) => {
  return render(ui, {
    wrapper: (props) => <MockProviders {...props} />,
    ...options,
  })
}
