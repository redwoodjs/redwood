const profilePageBody = `{ const { currentUser, isAuthenticated, hasRole, loading } = useAuth()

if (loading) {
  return <p>Loading...</p>
}

return (
  <>
    <Metadata title="Profile" description="Profile page" og />

    <h1 className="text-2xl">Profile</h1>

    <table className="rw-table">
      <thead>
        <tr>
          <th>Key</th>
          <th>Value</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>ID</td>
          <td>{currentUser.id}</td>
        </tr>
        <tr>
          <td>ROLES</td>
          <td>{currentUser.roles}</td>
        </tr>
        <tr>
          <td>EMAIL</td>
          <td>{currentUser.email}</td>
        </tr>

        <tr key="isAuthenticated">
          <td>isAuthenticated</td>
          <td>{JSON.stringify(isAuthenticated)}</td>
        </tr>

        <tr key="hasRole">
          <td>Is Admin</td>
          <td>{JSON.stringify(hasRole('ADMIN'))}</td>
        </tr>
      </tbody>
    </table>
  </>
)
      }`

export default (file, api) => {
  const j = api.jscodeshift
  const root = j(file.source)

  // Remove the `{ Link, routes }` imports that are generated and unused
  root
    .find(j.ImportDeclaration, {
      source: {
        type: 'StringLiteral',
        value: '@redwoodjs/router',
      },
    })
    .remove()

  const useAuthImport = j.importDeclaration(
    [j.importSpecifier(j.identifier('useAuth'))],
    j.stringLiteral('src/auth'),
  )

  root.find(j.ImportDeclaration).at(0).insertBefore(useAuthImport)

  return root
    .find(j.VariableDeclarator, {
      id: {
        type: 'Identifier',
        name: 'ProfilePage',
      },
    })
    .replaceWith((nodePath) => {
      const { node } = nodePath
      node.init.body = profilePageBody
      return node
    })
    .toSource()
}
