// Define your own mock data here:
export const standard = (/* vars, { ctx, req } */) => ({
  author: {
    __typename: 'User' as const,
    id: 42,
    email: 'fortytwo@42.com',
    fullName: 'Forty Two',
  },
})
