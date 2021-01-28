import camelcase from 'camelcase'
import pascalcase from 'pascalcase'
import pluralize from 'pluralize'
import terminalLink from 'terminal-link'

import { getSchema } from 'src/lib'

import { transformTSToJS } from '../../../lib'
import { yargsDefaults } from '../../generate'
import {
  templateForComponentFile,
  createYargsForComponentGeneration,
} from '../helpers'

const DEFAULT_SCENARIO_NAMES = ['one', 'two']

// parses the schema into scalar fields, relations and an array of foreign keys
export const parseSchema = async (model) => {
  const schema = await getSchema(model)
  const relations = {}
  let foreignKeys = []

  // aggregate the plain String, Int and DateTime fields
  let scalarFields = schema.fields.filter((field) => {
    if (field.relationFromFields) {
      // only build relations for those that are required
      if (field.isRequired) {
        relations[field.name] = field.relationFromFields
      }
      foreignKeys = foreignKeys.concat(field.relationFromFields)
    }

    return (
      field.isRequired &&
      !field.hasDefaultValue && // don't include fields that the database will default
      !field.relationName // this field isn't a relation (ie. comment.post)
    )
  })

  // remove scalars that are foreign keys
  scalarFields = scalarFields.filter((field) => {
    return !foreignKeys.includes(field.name)
  })

  return { scalarFields, relations }
}

export const scenarioFieldValue = (field) => {
  const rand = parseInt(Math.random() * 10000000)
  switch (field.type) {
    case 'String':
      return field.isUnique ? `String${rand}` : 'String'
    case 'Int':
      return rand
    case 'DateTime':
      return new Date().toISOString().replace(/\.\d{3}/, '')
  }
}

export const fieldsToScenario = async (scalarFields, relations) => {
  const data = {}

  // scalars
  scalarFields.forEach((field) => {
    data[field.name] = scenarioFieldValue(field)
  })

  // relations
  for (const [relation, _foreignKeys] of Object.entries(relations)) {
    const relationModelName = pascalcase(pluralize.singular(relation))
    const {
      scalarFields: relScalarFields,
      relations: relRelations,
    } = await parseSchema(relationModelName)

    data[relation] = {
      create: await fieldsToScenario(relScalarFields, relRelations),
    }
  }

  return data
}

// creates the scenario data based on the data definitions in schema.prisma
export const buildScenario = async (model) => {
  const scenarioModelName = camelcase(model)
  const standardScenario = {
    [scenarioModelName]: {},
  }
  const { scalarFields, relations } = await parseSchema(model)

  // turn scalar fields into actual scenario data
  for (const name of DEFAULT_SCENARIO_NAMES) {
    standardScenario[scenarioModelName][name] = await fieldsToScenario(
      scalarFields,
      relations
    )
  }

  return standardScenario
}

// outputs fields necessary to create an object in the test file
export const fieldsToInput = async (model) => {
  const { scalarFields, _relations } = await parseSchema(model)
  const inputObj = {}

  scalarFields.forEach((field) => {
    inputObj[field.name] = scenarioFieldValue(field)
  })

  return inputObj
}

export const fieldsToUpdate = async (model) => {
  const { scalarFields } = await parseSchema(model)
  const field = scalarFields[0]
  const value = scenarioFieldValue(field)
  let newValue = value

  // depending on the field type, append/update the value to something different
  switch (field.type) {
    case 'String': {
      newValue = newValue + '2'
      break
    }
    case 'Int': {
      newValue = newValue + 1
      break
    }
    case 'DateTime': {
      let date = new Date()
      date.setDate(date.getDate() + 1)
      newValue = date.toISOString().replace(/\.\d{3}/, '')
      break
    }
  }

  return { [field.name]: newValue }
}

export const files = async ({
  name,
  tests = true,
  relations,
  javascript,
  typescript,
  ...rest
}) => {
  const componentName = camelcase(pluralize(name))
  const model = pascalcase(pluralize.singular(name))
  const extension = 'ts'
  const serviceFile = templateForComponentFile({
    name,
    componentName: componentName,
    extension: `.${extension}`,
    apiPathSection: 'services',
    generator: 'service',
    templatePath: `service.${extension}.template`,
    templateVars: { relations: relations || [], ...rest },
  })
  const testFile = templateForComponentFile({
    name,
    componentName: componentName,
    extension: `.test.${extension}`,
    apiPathSection: 'services',
    generator: 'service',
    templatePath: `test.${extension}.template`,
    templateVars: {
      relations: relations || [],
      input: await fieldsToInput(model),
      update: await fieldsToUpdate(model),
      ...rest,
    },
  })
  const scenariosFile = templateForComponentFile({
    name,
    componentName: componentName,
    extension: `.scenarios.${extension}`,
    apiPathSection: 'services',
    generator: 'service',
    templatePath: `scenarios.${extension}.template`,
    templateVars: {
      scenario: await buildScenario(model),
      ...rest,
    },
  })

  const files = [serviceFile]
  if (tests) {
    files.push(testFile)
    files.push(scenariosFile)
  }

  // Returns
  // {
  //    "path/to/fileA": "<<<template>>>",
  //    "path/to/fileB": "<<<template>>>",
  // }
  return files.reduce((acc, [outputPath, content]) => {
    if (javascript && !typescript) {
      content = transformTSToJS(outputPath, content)
      outputPath = outputPath.replace('.ts', '.js')
    }

    return {
      [outputPath]: content,
      ...acc,
    }
  }, {})
}

export const defaults = {
  ...yargsDefaults,
  tests: {
    default: true,
    description: 'Generate test files',
    type: 'boolean',
  },
  crud: {
    default: false,
    description: 'Create CRUD functions',
    type: 'boolean',
  },
}

export const builder = (yargs) => {
  yargs
    .positional('name', {
      description: 'Name of the service',
      type: 'string',
    })
    .epilogue(
      `Also see the ${terminalLink(
        'Redwood CLI Reference',
        'https://redwoodjs.com/reference/command-line-interface#generate-service'
      )}`
    )
  Object.entries(defaults).forEach(([option, config]) => {
    yargs.option(option, config)
  })
}

export const {
  command,
  description,
  handler,
} = createYargsForComponentGeneration({
  componentName: 'service',
  filesFn: files,
})
