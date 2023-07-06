import type { Meta, StoryObj } from '@storybook/react'

import DoublePage from './DoublePage'

const meta: Meta<typeof DoublePage> = {
  component: DoublePage,
}

export default meta

type Story = StoryObj<typeof DoublePage>

export const Primary: Story = {}
