const createContacts = `
export const createContact = ({ input }) => {
  return db.contact.create({ data: input })
}
`

export default (file, api) => {
  const j = api.jscodeshift
  const root = j(file.source)

  return root
    .find(j.VariableDeclarator, {
      id: {
        type: 'Identifier',
        name: 'contacts',
      },
    })
    .insertAfter(createContacts)
    .toSource()
}
