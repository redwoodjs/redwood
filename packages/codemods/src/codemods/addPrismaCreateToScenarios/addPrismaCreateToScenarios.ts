/**
 * The following is a naive implementation:
 * The keys won't be named 'one' and 'two'.
 * But the logic in forEach may be enough.
 */
import type { FileInfo, API } from 'jscodeshift'

module.exports = function (file: FileInfo, api: API) {
  const j = api.jscodeshift

  return j(file.source)
    .find(j.CallExpression, (path) => {
      return path.callee.name === 'defineScenario'
    })
    .forEach((scenarioPath) => {
      // First argument is the definition
      const scenarioArgs = scenarioPath.value.arguments[0]

      const scenarioModels = scenarioArgs.properties // i.e. "user"

      scenarioModels.forEach((model) => {
        const modelProps = model.value.properties // "one", "two"
        // FYI - you can see what the name is in key.name

        modelProps.forEach((modelProp) => {
          const dataDef = modelProp.value // this is {email:}

          modelProp.value = j.objectExpression([
            j.property('init', j.identifier('data'), dataDef),
          ])
        })
      })
    })
    .toSource({ trailingComma: true })
}
