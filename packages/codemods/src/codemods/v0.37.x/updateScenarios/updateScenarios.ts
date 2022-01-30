import type { FileInfo, API, ObjectExpression, Property } from 'jscodeshift'

export default function transform(file: FileInfo, api: API) {
  const j = api.jscodeshift

  return j(file.source)
    .find(j.CallExpression, (path) => {
      // After updating jscodeshift to 0.13.1 and @types/jscodeshift to 0.11.3,
      // the property `name` on `path.callee` suddenly became undefined.
      // But it's still there if you `console.log`, so we're typecasting for now.
      return (
        (path.callee as typeof path.callee & { name: string }).name ===
        'defineScenario'
      )
    })
    .forEach((scenarioPath) => {
      // The first argument is the definition.
      const scenarioDefinition = scenarioPath.value
        .arguments[0] as ObjectExpression

      const scenarioModels = scenarioDefinition.properties as Property[] // i.e. "user"

      scenarioModels.forEach((model) => {
        const modelProps = (model.value as ObjectExpression)
          .properties as Property[] // "one", "two"
        // FYI - you can see what the name is in key.name

        modelProps.forEach((modelProp) => {
          const dataDef = modelProp.value // this is {email:}

          modelProp.value = j.objectExpression([
            j.property('init', j.identifier('data'), dataDef),
          ])
        })
      })
    })
    .toSource()
}
