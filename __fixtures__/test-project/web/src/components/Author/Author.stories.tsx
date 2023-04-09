// When you've added props to your component,
// pass Storybook's `args` through this story to control it from the addons panel:
//
// ```tsx
// import type { ComponentStory } from '@storybook/react'
//
// export const generated: ComponentStory<typeof Author> = (args) => {
//   return <Author {...args} />
// }
// ```
//
// See https://storybook.js.org/docs/react/writing-stories/args.

import type { ComponentMeta } from '@storybook/react'

import Author from './Author'

const author = {
  email: 'story.user@email.com',
  fullName: 'Story User',
}

export const generated = () => {
  return <Author author={author} />
}

export default {
  title: 'Components/Author',
  component: Author,
} as ComponentMeta<typeof Author>
