import type { ComponentStory } from '@storybook/react'

import BlogPost from './BlogPost'

export const generated: ComponentStory<typeof BlogPost> = (args) => {
  return <BlogPost {...args} />
}

export default { title: 'Components/BlogPost', component: BlogPost }
