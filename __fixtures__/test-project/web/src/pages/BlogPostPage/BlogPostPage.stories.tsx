import type { ComponentMeta, ComponentStory } from '@storybook/react'

import BlogPostPage from './BlogPostPage'

export const generated: ComponentStory<typeof BlogPostPage> = (args) => {
  return <BlogPostPage id={42} {...args} />
}

export default {
  title: 'Pages/BlogPostPage',
  component: BlogPostPage,
} as ComponentMeta<typeof BlogPostPage>
