import Author from './Author'

const author = {
  email: 'story.user@email.com',
  fullName: 'Story User',
}

export const generated = (args) => {
  return <Author {...args} author={author} />
}

export default { title: 'Components/Author' }
