import type {
  API,
  FileInfo,
  JSXExpressionContainer,
  ObjectExpression,
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
    ...
        <Router
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
    ...
    */

    // To force the value to be explicit. {{ transform }} -> {{ parse: transform }}
    // paramTypeKey.value = j.identifier.from(paramTypeKey.value)
    if (paramTypeKey.shorthand) {
      paramTypeKey.shorthand = false
    }

    paramTypeKey.key.name =
      newPropertyName[paramTypeKey.key.name as keyof typeof newPropertyName]
  }

  const mapToNewSyntax = (
    allParamTypeProperties: ObjectExpression['properties']
  ) => {
    // allParamTypeProperties here is array of following marked as 👉
    /*
        <Router
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
      // paramTypeProperty.value could be either ObjectExpression, Identifier
      if (
        paramTypeProperty.type === 'SpreadProperty' ||
        paramTypeProperty.type === 'SpreadElement' ||
        paramTypeProperty.type === 'ObjectMethod'
      ) {
        // We don't handle these other types.
        // As they're quite edgecase-ey
        // like paramTypes={{...myParams}} (spreadelement)
        console.warn(
          'Unable to update your custom Route parameters. Please follow manual instructions'
        )
        return
      }

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
            valueDefInit.properties.forEach((valueDefInitProperty) => {
              renameParamTypeKey(valueDefInitProperty)
            })
          })
          break
        }
        case 'ObjectExpression':
          // Value is an object
          paramTypeProperty.value.properties.forEach((property) => {
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
        const paramTypeValue = (prop?.value?.value as JSXExpressionContainer)
          ?.expression // get the value inside the jsx expression

        // paramTypeValue is marked as 👉 . It could be even referenced as variable.
        // <Router paramTypes={👉 {}}

        switch (paramTypeValue?.type) {
          case 'Identifier': {
            // <R paramsTypes={myParamTypes}
            // Search the Routes file for variable declaration
            const variableDefinitions = ast.find(j.VariableDeclarator, {
              id: { name: paramTypeValue.name },
            })
            variableDefinitions.forEach((varDef) => {
              const allParamTypeProperties = (
                varDef?.value?.init as ObjectExpression
              )?.properties // safe to assume that this variable is an object declaration
              mapToNewSyntax(allParamTypeProperties)
            })
            break
          }

          case 'ObjectExpression': // <R paramTypes={{constraint: '', ..}} or paramTypes={{...myParamTypes}}
            mapToNewSyntax(paramTypeValue.properties)
            break
        }
      })
    })

  return ast.toSource()
}
