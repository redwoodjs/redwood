import fs from 'fs'
import path from 'path'

import { getDMMF } from '@prisma/sdk'

import { getPaths } from '@redwoodjs/internal'

const DATAMODEL_PATH = path.join(getPaths().generated.base, 'datamodel.json')
const MODELS_PATH = path.join(getPaths().api.src, 'models')
const MODELS_INDEX_PATH = path.join(MODELS_PATH, 'index.js')

const indexLines = [
  '// This file is autogenerated by Redwood and will be overwitten periodically',
  '',
  "import { db } from 'src/lib/db'",
  "import datamodel from '../../../.redwood/datamodel.json'",
  "import { RedwoodRecord } from '@redwoodjs/record'",
  '',
  'RedwoodRecord.db = db',
  'RedwoodRecord.schema = datamodel',
  '',
]

const modelImports = []
const modelRequires = {}
let datamodel

// parse datamodel and write out cache
export const parseDatamodel = () => {
  getDMMF({ datamodelPath: getPaths().api.dbSchema }).then((schema) => {
    datamodel = schema.datamodel
    fs.writeFileSync(DATAMODEL_PATH, JSON.stringify(datamodel, null, 2))
    console.info(`\n  Wrote ${DATAMODEL_PATH}`)

    // figure out what model classes are present
    const modelNames = fs
      .readdirSync(MODELS_PATH)
      .map((file) => {
        if (file !== 'index.js') {
          return file.split('.')[0]
        }
      })
      .filter((val) => val)

    modelNames.forEach((modelName) => {
      // which other models this model requires
      const thisModelRequires = []

      // import statements
      modelImports.push(`import ${modelName} from 'src/models/${modelName}'`)

      // requireModel declarations
      const schemaModel = datamodel.models.find(
        (model) => model.name === modelName
      )

      if (schemaModel) {
        schemaModel.fields.forEach((field) => {
          if (field.kind === 'object' && modelNames.includes(field.type)) {
            thisModelRequires.push(field.type)
          }
        })
        modelRequires[modelName] = thisModelRequires
      }
    })

    modelImports.forEach((modelImport) => {
      indexLines.push(modelImport)
    })

    indexLines.push('')

    for (const [name, requires] of Object.entries(modelRequires)) {
      indexLines.push(`${name}.requiredModels = [${requires.join(', ')}]`)
    }

    indexLines.push('')
    indexLines.push(`export { ${modelNames.join(', ')} }`)
    indexLines.push('') // empty newline at end

    fs.writeFileSync(MODELS_INDEX_PATH, indexLines.join('\n'))
    console.info(`  Wrote ${MODELS_INDEX_PATH}\n`)
  })
}
