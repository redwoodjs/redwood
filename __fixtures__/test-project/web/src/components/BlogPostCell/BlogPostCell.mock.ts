// Define your own mock data here:
export const standard = (/* vars, { ctx, req } */) => ({
  blogPost: {
    __typename: 'Post' as const,
    id: 42,
    title: 'Mocked title',
    body: 'Mocked body',
    createdAt: '2022-01-17T13:57:51.607Z',
    authorId: 5,

    author: {
      __typename: 'User' as const,
      email: 'five@5.com',
      fullName: 'Five Lastname',
    },
  },
})
