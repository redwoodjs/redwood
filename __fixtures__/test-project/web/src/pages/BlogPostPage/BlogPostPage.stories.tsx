import type { Meta, StoryObj } from '@storybook/react'

import BlogPostPage from './BlogPostPage'

const meta: Meta<typeof BlogPostPage> = {
  component: BlogPostPage,
}

export default meta

type Story = StoryObj<typeof BlogPostPage>

export const Primary: Story = {
  render: (args) => {
    return <BlogPostPage id={42} {...args} />
  }
}
