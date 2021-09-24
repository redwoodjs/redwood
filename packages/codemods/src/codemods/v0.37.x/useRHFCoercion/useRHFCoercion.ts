import type { FileInfo, API } from 'jscodeshift'

type TransformValue = 'Float' | 'Json' | 'Int' | 'Boolean' | 'DateTime'

export default function transformer(file: FileInfo, api: API) {
  const j = api.jscodeshift

  const mapTransformValueToValidationProperty = (
    transformValue: TransformValue
  ) => {
    const j = api.jscodeshift

    switch (transformValue) {
      case 'Float':
        return j.objectProperty(
          j.identifier('valueAsNumber'),
          j.booleanLiteral(true)
        )
      case 'Json':
      case 'JSON':
        return j.objectProperty(
          j.identifier('valueAsJSON'),
          j.booleanLiteral(true)
        )
      case 'Int':
        return j.objectProperty(
          j.identifier('valueAsNumber'),
          j.booleanLiteral(true)
        )
      case 'Boolean':
        return j.objectProperty(
          j.identifier('valueAsBoolean'),
          j.booleanLiteral(true)
        )
      case 'DateTime':
        return j.objectProperty(
          j.identifier('valueAsDate'),
          j.booleanLiteral(true)
        )
    }
  }

  const outputAst = j(file.source)

  /**
   * 1 - renaming validation to config
   */
  outputAst
    .find(j.JSXOpeningElement, { name: { name: 'Form' } })
    .forEach((p) => {
      const formValidationProp = j(p).find(j.JSXIdentifier, {
        name: 'validation',
      })

      // formValidationProp is an array so we have to iterate over it.
      formValidationProp.forEach((validationProp) => {
        validationProp.value.name = 'config'
      })
    })

  /**
   * 2 - move transformValue to validationProp
   */
  outputAst
    .find(j.JSXAttribute, { name: { name: 'transformValue' } })
    .forEach((transformValueProp) => {
      const field = transformValueProp.parent
      console.log('f', field)
      const transformValue = transformValueProp.node.value?.value
      j(transformValueProp).remove()

      const fieldHasValidation = field.node.attributes.some((attr) => {
        return attr.name.name === 'validation'
      })

      if (fieldHasValidation) {
        // only add a property to the object expression
        const validationAttribute = field.node.attributes.filter((attr) => {
          return attr.name.name === 'validation'
        })
        const validationAttributeObjectProperties =
          validationAttribute[0].value.expression.properties

        validationAttributeObjectProperties.push(
          mapTransformValueToValidationProperty(transformValue)
        )
      } else {
        // add the whole validation attribute
        const prop = j.jsxAttribute(
          j.jsxIdentifier('validation'),
          j.jsxExpressionContainer(
            j.objectExpression([
              // j.property(
              //   'init',
              //   j.identifier('valueAs'),
              //   j.booleanLiteral(true)
              // ),
              mapTransformValueToValidationProperty(transformValue),
            ])
          )
        )

        field.value.attributes.push(prop)
      }
    })

  return outputAst.toSource({ trailingComma: true })
}
