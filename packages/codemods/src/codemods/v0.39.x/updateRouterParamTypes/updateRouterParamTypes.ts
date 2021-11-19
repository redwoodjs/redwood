import type {
  FileInfo,
  API,
  JSXExpressionContainer,
  ObjectExpression,
  Collection,
  Identifier,
} from 'jscodeshift'

export default function transform(file: FileInfo, api: API) {
  const newPropertyName = {
    constraint: 'match',
    transform: 'parse',
  }

  const j = api.jscodeshift
  const ast = j(file.source)

  const renameParamTypeKey = (paramTypeKey: any) => {
    // paramTypeKey here could be any one of following marked as 👉
    /*
    const slug = {
      👉 constraint: /\w+-\w+/,
      👉 transform: (param) => param.split('-'),
    }

    const constraint = /\w+-\w+/
    const transform = (param) => param.split('.')

    const Routes = () => {
      return (
        <Router
          pageLoadingDelay={350}
          paramTypes={{
            slug,
            embeddedProperties: { 👉 constraint: constraint, 👉 transform },
            embedded: {
              👉 constraint: /\w+.\w+/,
              👉 transform: (param) => param.split('.'),
            },
          }}
        >
        </Router>
      )
    }
    */

    if (paramTypeKey.value.type === 'Identifier') {
      // To force the value to be explicit. {{ transform }} -> {{ parse: transform }}
      paramTypeKey.value = j.identifier.from(paramTypeKey.value)
    }

    paramTypeKey.key.name =
      newPropertyName[paramTypeKey.key.name as keyof typeof newPropertyName]
  }

  const mapToNewSyntax = (
    allParamTypeProperties: Collection<ObjectExpression | Identifier>
  ) => {
    // allParamTypeProperties here is array of following marked as 👉
    /*
        <Router
          pageLoadingDelay={350}
          paramTypes={{
            👉 slug,
            👉 embeddedProperties: { constraint: constraint, transform },
            👉 embedded: {
                constraint: /\w+.\w+/,
                transform: (param) => param.split('.'),
            },
          }}
        >
    */

    allParamTypeProperties.forEach((paramTypeProperty) => {
      // paramTypeProperty.value could be either ObjectExpression or Identifier
      switch (paramTypeProperty.value.type) {
        // Identifier could be for {{ slug }} in examples above. Or something like {{slug: slug}}
        case 'Identifier': {
          // Even though we have the object but the key is referred as variable
          const paramTypeValueVar = paramTypeProperty.value.name
          const paramTypeValueDef = ast.find(j.VariableDeclarator, {
            id: { name: paramTypeValueVar },
          })

          paramTypeValueDef.forEach((valueDefNode) => {
            if (valueDefNode?.value?.init?.type !== 'ObjectExpression') {
              // Value must be object but doesn't seem to be case here.
              return
            }
            const valueDefInit = valueDefNode.value.init
            valueDefInit.properties.forEach((valueDefInitProperty: any) => {
              renameParamTypeKey(valueDefInitProperty)
            })
          })
          break
        }
        case 'ObjectExpression':
          // Value is an object
          paramTypeProperty.value.properties.forEach((property: any) => {
            renameParamTypeKey(property)
          })
          break
      }
    })
  }

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

        // paramTypeValue is marked as 👉 . It could be even referenced as variable.
        /*
        <Router
          pageLoadingDelay={350}
          paramTypes={👉 {
            slug,
            embeddedProperties: { constraint: constraint, transform },
            embedded: {
              constraint: /\w+.\w+/,
              transform: (param) => param.split('.'),
            },
          }}
        >
        */

        switch (paramTypeValue?.type) {
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
