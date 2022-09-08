import type { API, FileInfo, TSTypeAnnotation } from 'jscodeshift'
import { Identifier, TSTypeReference } from 'jscodeshift'

const isTypeReference = (
  typeAnnotation: TSTypeAnnotation['typeAnnotation']
): typeAnnotation is TSTypeReference => TSTypeReference.check(typeAnnotation)

const getTypeName = (node: TSTypeReference) => {
  return Identifier.check(node.typeName) ? node.typeName.name : null
}

const isWrappedInPartial = (node: TSTypeAnnotation) => {
  const typeAnnotation = node.typeAnnotation

  return (
    isTypeReference(typeAnnotation) && getTypeName(typeAnnotation) === 'Partial'
  )
}

export default function transform(file: FileInfo, api: API) {
  const j = api.jscodeshift
  const ast = j(file.source)

  ast.find(j.TSTypeAnnotation).forEach((path) => {
    const typeAnnotationNode = path.node

    if (
      // If it's a MutationResolvers['x'] or QueryResolvers['x']
      j.TSIndexedAccessType.check(typeAnnotationNode.typeAnnotation)
    ) {
      return
    }

    if (
      !isWrappedInPartial(typeAnnotationNode) &&
      isTypeReference(typeAnnotationNode.typeAnnotation)
    ) {
      const originalTypeName = getTypeName(typeAnnotationNode.typeAnnotation)

      if (!originalTypeName || !originalTypeName.includes('Resolvers')) {
        // Skip other type annotations!
        return
      }

      console.log(`Wrapping ${originalTypeName} in Partial....`)

      path.replace(
        j.tsTypeAnnotation(
          j.tsTypeReference(
            j.identifier('Partial'),
            j.tsTypeParameterInstantiation([
              j.tsTypeReference(j.identifier(originalTypeName)),
            ])
          )
        )
      )
    }
  })

  return ast.toSource()
}
