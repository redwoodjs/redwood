import Author from './Author'

const author = {
  email: "story.user@email.com",
  fullName: "Story User"
};

export const generated = () => {
  return <Author author={author} />;
}

export default { title: 'Components/Author' }
