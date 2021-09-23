/**
 * The following is a naive implementation:
 * The keys won't be named 'one' and 'two'.
 * But the logic in forEach may be enough.
 */
import type { FileInfo, API, ObjectExpression } from 'jscodeshift'

module.exports = function (file: FileInfo, api: API) {
  const j = api.jscodeshift

  return j(file.source)
    .find(j.CallExpression, (path) => {
      return path.callee.name === 'defineScenario'
    })
    .forEach((scenarioPath) => {
      // First argument is the definition
      // @TODO figure out what types these are, not sure object expression is correct
      const scenarioArgs = scenarioPath.value.arguments[0] as ObjectExpression

      const scenarioModels = scenarioArgs.properties // i.e. "user"

      scenarioModels.forEach((model: any) => {
        const modelProps = model.value.properties // "one", "two"
        // FYI - you can see what the name is in key.name

        modelProps.forEach((modelProp: any) => {
          const dataDef = modelProp.value // this is {email:}

          modelProp.value = j.objectExpression([
            j.property('init', j.identifier('data'), dataDef),
          ])
        })
      })
    })
    .toSource({ trailingComma: true })
}
