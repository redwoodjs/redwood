// Define your own mock data here:
export const standard = (/* vars, { ctx, req } */) => ({
  author: {
    __typename: 'author' as const,
    id: 42,
    email: 'fortytwo@42.com',
    fullName: 'Forty Two',
  },
})
