import type { ComponentStory } from '@storybook/react'

import Author from './Author'

const author = {
  email: 'story.user@email.com',
  fullName: 'Story User',
}

export const generated: ComponentStory<typeof Author> = (args) => {
  return <Author {...args} author={author} />
}

export default { title: 'Components/Author', component: Author }
