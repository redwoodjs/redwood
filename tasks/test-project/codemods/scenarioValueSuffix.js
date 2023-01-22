export default (file, api) => {
  const j = api.jscodeshift
  const root = j(file.source)

  const endsWith6DigitsRE = /String.*\d{6,}$/

  // Replaces the randomly generated value with consistent ones

  return root
    .find(j.Literal, { type: 'StringLiteral' })
    .forEach((obj) => {
      const stringValue = obj.value.value
      if (endsWith6DigitsRE.test(stringValue)) {
        obj.value.value = `String${obj.value.loc.start.line}`
      }
    })
    .toSource()
}
