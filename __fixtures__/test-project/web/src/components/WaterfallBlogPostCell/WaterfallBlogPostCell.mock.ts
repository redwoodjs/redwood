// Define your own mock data here:
export const standard = (/* vars, { ctx, req } */) => ({
  waterfallBlogPost: {
    __typename: 'Post' as const,
    id: 42,
    title: 'Mocked title',
    body: 'Mocked body',
    createdAt: '2022-01-17T13:57:51.607Z',
    authorId: 7,

    author: {
      __typename: 'User' as const,
      email: 'se7en@7.com',
      fullName: 'Se7en Lastname',
    },
  },
})
