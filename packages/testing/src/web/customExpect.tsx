import React from 'react'

import { RenderOptions, screen } from '@testing-library/react'

import { customRender } from './customRender'

export async function expectToRender(
  ui: React.ReactElement,
  options: RenderOptions = {}
) {
  customRender(ui, options)

  await expect((await screen.findAllByText(/./))[0]).toBeInTheDocument()
}
