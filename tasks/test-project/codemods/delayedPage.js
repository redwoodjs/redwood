// @ts-check

const delayedComponents = `
function DelayedComponent({
  time,
  delays,
}: {
  time: number
  delays: Map<number, Promise<void>>
}) {
  const logged = useRef(false)
  if (typeof window === 'undefined') {
    const delay =
      delays.get(time) ??
      new Promise<void>((resolve) => setTimeout(resolve, time * 1000))
    delays.set(time, delay)
    use(delay)

    // eslint-disable-next-line react-hooks/rules-of-hooks
    useServerInsertedHTML(() => {
      if (!logged.current) {
        logged.current = true
        return (
          <script
            dangerouslySetInnerHTML={{
              __html: \`console.log("delayed by \${time} seconds")\`,
            }}
          />
        )
      }
      return <></>
    })
  }
  return <p data-test-id={\`delayed-text-\${time}\`}>Delayed by {time} seconds</p>
}

function DelayedStuff() {
  const [delays] = useState(new Map<number, Promise<void>>())
  return (
    <>
      <Suspense>
        <DelayedComponent time={1} delays={delays} />
        <br />
      </Suspense>
      <Suspense>
        <DelayedComponent time={2} delays={delays} />
        <br />
      </Suspense>
      <Suspense>
        <DelayedComponent time={3} delays={delays} />
        <br />
      </Suspense>
      <Suspense>
        <DelayedComponent time={4} delays={delays} />
        <br />
      </Suspense>
    </>
  )
}
`

const body = `
{
 return (
  <>
  <Metadata title="Delayed" description="Delayed page" />

  <h1>DelayedPage</h1>
  <p>The following component will render over 4 seconds...</p>
  <p>
    Injecting to HTML and logging to console, once each second during
    streaming-ssr
  </p>
  <DelayedStuff />
 </>
)
}
`

export default (file, api) => {
  const j = api.jscodeshift
  const root = j(file.source)

  const serverInjectImport = j.importDeclaration(
    [j.importSpecifier(j.identifier('useServerInsertedHTML'))],
    j.stringLiteral('@redwoodjs/web'),
  )

  const reactImports = j.importDeclaration(
    ['Suspense', 'useState', 'use', 'useRef'].map((importName) =>
      j.importSpecifier(j.identifier(importName)),
    ),
    j.stringLiteral('react'),
  )

  root
    .find(j.ImportDeclaration, {
      source: {
        type: 'Literal',
        value: '@redwoodjs/router',
      },
    })
    .remove()

  root.find(j.VariableDeclaration).insertBefore(serverInjectImport)
  root.find(j.VariableDeclaration).insertBefore(reactImports)
  root.find(j.VariableDeclaration).insertBefore(delayedComponents)

  return root
    .find(j.VariableDeclarator, {
      id: {
        type: 'Identifier',
        name: 'DelayedPage',
      },
    })
    .replaceWith((nodePath) => {
      const { node } = nodePath
      node.init.body = body
      return node
    })
    .toSource()
}
