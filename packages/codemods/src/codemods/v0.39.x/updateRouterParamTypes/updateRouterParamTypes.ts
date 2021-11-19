import type {
  FileInfo,
  API,
  JSXExpressionContainer,
  ObjectExpression,
  Collection,
} from 'jscodeshift'

export default function transform(file: FileInfo, api: API) {
  const newPropertyName = {
    constraint: 'match',
    transform: 'parse',
  }

  const mapToNewSyntax = (
    allParamTypeProperties: Collection<ObjectExpression>
  ) => {
    allParamTypeProperties.forEach((paramTypeProperty) =>
      paramTypeProperty.value.properties.forEach((property: any) => {
        property.key.name =
          newPropertyName[property.key.name as 'constraint' | 'transform']
      })
    )
  }
  const j = api.jscodeshift
  const ast = j(file.source)

  ast
    .find(j.JSXElement, { openingElement: { name: { name: 'Router' } } })
    .forEach((routerElement) => {
      const paramTypeProp = j(routerElement.node.openingElement).find(
        j.JSXAttribute,
        {
          name: { name: 'paramTypes' },
        }
      )
      paramTypeProp.forEach((prop) => {
        const paramTypeValue: any = (
          prop?.value?.value as JSXExpressionContainer
        )?.expression

        switch (
          paramTypeValue?.type // paramTypeValue could be directly embedded as object or referenced as a variable
        ) {
          case 'Identifier': {
            // Search the Routes file for variable declaration
            const variableDefinitions = ast.find(j.VariableDeclarator, {
              id: { name: paramTypeValue.name },
            })
            variableDefinitions.forEach((varDef) => {
              const allParamTypeProperties: any = (varDef?.value?.init as any)
                ?.properties
              mapToNewSyntax(allParamTypeProperties)
            })
            break
          }
          case 'ObjectExpression': // Object is embedded
            mapToNewSyntax(paramTypeValue.properties)
            break
        }
      })
    })

  return ast.toSource()
}
