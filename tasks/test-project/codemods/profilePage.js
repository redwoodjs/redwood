const profilePageBody = `const { currentUser, isAuthenticated, hasRole } = useAuth()
return (
  <>
    <MetaTags title="Profile" description="Profile page" />

    <h1 className="text-2xl">Profile</h1>

    <table className="rw-table">
      <thead>
        <tr>
          <th>Key</th>
          <th>Value</th>
        </tr>
      </thead>
      <tbody>
        {Object.keys(currentUser).map((key) => {
          return (
            <tr key={key}>
              <td>{key.toUpperCase()}</td>
              <td>{currentUser[key]}</td>
            </tr>
          )
        })}

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
)`

export default (file, api) => {
  const j = api.jscodeshift
  const root = j(file.source)

  const useAuthImport = j.importDeclaration(
    [j.importDefaultSpecifier(j.identifier('useAuth'))],
    j.stringLiteral('@redwoodjs/auth')
  )

  root.find(j.ExportNamedDeclaration).at(0).insertBefore(useAuthImport)

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
