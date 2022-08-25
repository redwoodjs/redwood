// When you've added props to your component,
// pass Storybook's `args` through this story to control it from the addons panel:
//
// ```tsx
// import type { ComponentStory } from '@storybook/react'
//
// export const generated: ComponentStory<typeof BlogPost> = (args) => {
//   return <BlogPost {...args} />
// }
// ```
//
// See https://storybook.js.org/docs/react/writing-stories/args.

import type { ComponentMeta } from '@storybook/react'

import BlogPost from './BlogPost'

export const generated = () => {
  return <BlogPost />
}

export default {
  title: 'Components/BlogPost',
  component: BlogPost,
} as ComponentMeta<typeof BlogPost>
