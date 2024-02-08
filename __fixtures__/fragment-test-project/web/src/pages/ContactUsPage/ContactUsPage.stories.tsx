import type { Meta, StoryObj } from '@storybook/react'

import ContactUsPage from './ContactUsPage'

const meta: Meta<typeof ContactUsPage> = {
  component: ContactUsPage,
}

export default meta

type Story = StoryObj<typeof ContactUsPage>

export const Primary: Story = {}
