// Define your own mock data here:
export const standard = (/* vars, { ctx, req } */) => ({
  blogPosts: [
    {
      id: 42,
      title: 'Mocked title',
      body: 'Mocked body',
      createdAt: '2022-01-17T13:57:51.607Z',
      authorId: 5,

      author: {
        email: 'five@5.com',
        fullName: 'Five Lastname',
      },
    },
    {
      id: 43,
      title: 'Mocked title',
      body: 'Mocked body',
      createdAt: '2022-01-17T13:57:51.607Z',
      authorId: 5,

      author: {
        email: 'five@5.com',
        fullName: 'Five Lastname',
      },
    },
    {
      id: 44,
      title: 'Mocked title',
      body: 'Mocked body',
      createdAt: '2022-01-17T13:57:51.607Z',
      authorId: 5,

      author: {
        email: 'five@5.com',
        fullName: 'Five Lastname',
      },
    },
  ],
})
