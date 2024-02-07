import type { Meta, StoryObj } from '@storybook/react'

import NavigationLayout from './NavigationLayout'

const meta: Meta<typeof NavigationLayout> = {
  component: NavigationLayout,
}

export default meta

type Story = StoryObj<typeof NavigationLayout>

export const Primary: Story = {}
