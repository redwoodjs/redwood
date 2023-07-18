// Pass props to your component by passing an `args` object to your story
//
// ```jsx
// export const Primary: Story = {
//  args: {
//    propName: propValue
//  }
// }
// ```
//
// See https://storybook.js.org/docs/react/writing-stories/args.

import type { Meta, StoryObj } from '@storybook/react'

import Author from './Author'

const meta: Meta<typeof Author> = {
  component: Author,
}

export default meta

type Story = StoryObj<typeof Author>

const author = {
  email: 'story.user@email.com',
  fullName: 'Story User',
}

export const Primary: Story = {
  render: () => {
    return <Author author={author} />
  }
}
