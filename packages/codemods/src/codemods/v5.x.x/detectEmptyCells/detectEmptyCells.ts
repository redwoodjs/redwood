import {
  findCells,
  fileToAst,
  getCellGqlQuery,
  parseGqlQueryToAst,
} from '../../../lib/cells'

async function detectEmptyCells() {
  const cellPaths = findCells()

  const susceptibleCells = cellPaths.filter((cellPath) => {
    const fileContents = fileToAst(cellPath)
    const cellQuery = getCellGqlQuery(fileContents)

    if (!cellQuery) {
      return false
    }

    const { fields } = parseGqlQueryToAst(cellQuery)[0]

    return fields.length > 1
  })

  if (susceptibleCells.length > 0) {
    console.log(
      [
        'You have Cells that are susceptible to the new isDataEmpty behavior:',
        '',
        susceptibleCells.map((c) => `• ${c}`).join('\n'),
        '',
        "The new behavior is documented in detail here. It's most likely what you want, but consider whether it affects you.",
        "If you'd like to revert to the old behavior, you can override the `isDataEmpty` function.",
      ].join('\n')
    )
  }
}

export default detectEmptyCells
