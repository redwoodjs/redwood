const body = `
const { logOut, isAuthenticated } = useAuth()

return (
  <>
    <header className="relative flex justify-between items-center py-4 px-8 bg-blue-700 text-white">
      <h1 className="text-3xl font-semibold tracking-tight">
        <Link
          className="text-blue-400 hover:text-blue-100 transition duration-100"
          to={routes.home()}
        >
          Redwood Blog
        </Link>
      </h1>
      <nav>
        <ul className="relative flex items-center font-light">
          <li>
            <NavLink
              className="py-2 px-4 hover:bg-blue-600 transition duration-100 rounded"
              activeClassName="py-2 px-4 hover:bg-blue-600 transition duration-100 rounded underline underline-offset-4"
              to={routes.about()}
            >
              About
            </NavLink>
          </li>
          <li>
            <NavLink
              className="py-2 px-4 hover:bg-blue-600 transition duration-100 rounded"
              activeClassName="py-2 px-4 hover:bg-blue-600 transition duration-100 rounded underline underline-offset-4"
              to={routes.contactUs()}
            >
              Contact Us
            </NavLink>
          </li>
          <li>
            <NavLink
              className="py-2 px-4 hover:bg-blue-600 transition duration-100 rounded"
              activeClassName="py-2 px-4 hover:bg-blue-600 transition duration-100 rounded underline underline-offset-4"
              to={routes.posts()}
            >
              Admin
            </NavLink>
          </li>
          {isAuthenticated && (
            <li>
              <NavLink
                className="py-2 px-4 hover:bg-blue-600 transition duration-100 rounded"
                activeClassName="py-2 px-4 hover:bg-blue-600 transition duration-100 rounded underline underline-offset-4"
                onClick={logOut}
                to={''}
              >
                Log Out
              </NavLink>
            </li>
          )}
          {!isAuthenticated && (
            <li>
              <NavLink
                className="py-2 px-4 hover:bg-blue-600 transition duration-100 rounded"
                activeClassName="py-2 px-4 hover:bg-blue-600 transition duration-100 rounded underline underline-offset-4"
                to={routes.login()}
              >
                Log In
              </NavLink>
            </li>
          )}
        </ul>
      </nav>
    </header>
    <main className="max-w-4xl mx-auto p-12 bg-white shadow-lg rounded-b mt-3">
      {children}
    </main>
  </>
)
`

export default (file, api) => {
  const j = api.jscodeshift
  const root = j(file.source)

  const routerImport = j.importDeclaration(
    [
      j.importSpecifier(j.identifier('Link'), j.identifier('Link')),
      j.importSpecifier(j.identifier('NavLink'), j.identifier('NavLink')),
      j.importSpecifier(j.identifier('routes'), j.identifier('routes')),
    ],
    j.stringLiteral('@redwoodjs/router'),
  )

  const authImport = j.importDeclaration(
    [j.importSpecifier(j.identifier('useAuth'), j.identifier('useAuth'))],
    j.stringLiteral('src/auth'),
  )

  root.find(j.VariableDeclaration).insertBefore(routerImport)
  root.find(j.VariableDeclaration).insertBefore(authImport)

  return root
    .find(j.VariableDeclarator, {
      id: {
        type: 'Identifier',
        name: 'BlogLayout',
      },
    })
    .replaceWith((nodePath) => {
      const { node } = nodePath
      node.init.body.body[0] = body
      return node
    })
    .toSource()
}
