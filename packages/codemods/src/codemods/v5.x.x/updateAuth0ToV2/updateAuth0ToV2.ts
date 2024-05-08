import type { FileInfo, API } from 'jscodeshift'

export default function transform(file: FileInfo, api: API) {
  const j = api.jscodeshift
  const ast = j(file.source)

  const paths = ast.find(j.ObjectProperty, (node) => {
    return ['redirect_uri', 'audience'].includes(node.key.name)
  })

  let nodes = paths.nodes()

  nodes = nodes.map((node) => {
    const { comments: _comments, ...rest } = node
    return rest
  })

  paths.remove()

  ast
    .find(j.ObjectProperty, { key: { name: 'client_id' } })
    .insertAfter(
      j.objectProperty(
        j.identifier('authorizationParams'),
        j.objectExpression(nodes),
      ),
    )

  ast.find(j.Identifier, { name: 'client_id' }).replaceWith('clientId')

  return ast.toSource({
    trailingComma: true,
    quote: 'single',
    lineTerminator: '\n',
  })
}
