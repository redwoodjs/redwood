import type { Meta, StoryObj } from '@storybook/react'

import WaterfallPage from './WaterfallPage'

const meta: Meta<typeof WaterfallPage> = {
  component: WaterfallPage,
}

export default meta

type Story = StoryObj<typeof WaterfallPage>

export const Primary: Story = {
  render: (args) => <WaterfallPage id={42} {...args} />,
}
