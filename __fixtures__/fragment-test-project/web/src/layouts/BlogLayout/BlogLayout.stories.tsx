import type { Meta, StoryObj } from '@storybook/react'

import BlogLayout from './BlogLayout'

const meta: Meta<typeof BlogLayout> = {
  component: BlogLayout,
}

export default meta

type Story = StoryObj<typeof BlogLayout>

export const Primary: Story = {}
