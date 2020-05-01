import fs from 'fs'
import path from 'path'

import lodash from 'lodash/string'
import camelcase from 'camelcase'
import pascalcase from 'pascalcase'
import pluralize from 'pluralize'
import decamelize from 'decamelize'
import { paramCase } from 'param-case'
import { getDMMF } from '@prisma/sdk'
import { getPaths as getRedwoodPaths } from '@redwoodjs/internal'
import execa from 'execa'
import Listr from 'listr'
import VerboseRenderer from 'listr-verbose-renderer'
import { format } from 'prettier'

import c from './colors'

export const asyncForEach = async (array, callback) => {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array)
  }
}

/**
 * Returns the database schema for the given `name` database table parsed from
 * the schema.prisma of the target applicaiton. If no `name` is given then the
 * entire schema is returned.
 */
export const getSchema = async (name) => {
  const schema = await getSchemaDefinitions()

  if (name) {
    const model = schema.datamodel.models.find((model) => {
      return model.name === name
    })

    if (model) {
      return model
    } else {
      throw new Error(
        `No schema definition found for \`${name}\` in schema.prisma file`
      )
    }
  }

  return schema.metadata.datamodel
}

/**
 * Returns the enum defined with the given `name` parsed from
 * the schema.prisma of the target applicaiton. If no `name` is given then the
 * all enum definitions are returned
 */
export const getEnum = async (name) => {
  const schema = await getSchemaDefinitions()

  if (name) {
    const model = schema.datamodel.enums.find((model) => {
      return model.name === name
    })

    if (model) {
      return model
    } else {
      throw new Error(
        `No enum schema definition found for \`${name}\` in schema.prisma file`
      )
    }
  }

  return schema.metadata.datamodel.enums
}

/*
 * Returns the DMMF defined by `prisma` resolving the relevant `shema.prisma` path.
 */
export const getSchemaDefinitions = async () => {
  const schemaPath = path.join(getPaths().api.db, 'schema.prisma')
  const metadata = await getDMMF({
    datamodel: readFile(schemaPath.toString()),
  })

  return metadata
}

/**
 * Returns variants of the passed `name` for usage in templates. If the given
 * name was "fooBar" then these would be:

 * pascalName: FooBar
 * singularPascalName: FooBar
 * pluralPascalName: FooBars
 * singularCamelName: fooBar
 * pluralCamelName: fooBars
 * singularParamName: foo-bar
 * pluralParamName: foo-bars
 * singularConstantName: FOO_BAR
 * pluralConstantName: FOO_BARS
*/
export const nameVariants = (name) => {
  const normalizedName = pascalcase(paramCase(pluralize.singular(name)))

  return {
    pascalName: pascalcase(name),
    camelName: camelcase(name),
    singularPascalName: normalizedName,
    pluralPascalName: pluralize(normalizedName),
    singularCamelName: camelcase(normalizedName),
    pluralCamelName: camelcase(pluralize(normalizedName)),
    singularParamName: paramCase(normalizedName),
    pluralParamName: paramCase(pluralize(normalizedName)),
    singularConstantName: decamelize(normalizedName).toUpperCase(),
    pluralConstantName: decamelize(pluralize(normalizedName)).toUpperCase(),
  }
}

export const templateRoot = path.resolve(__dirname, '../commands/generate')

export const generateTemplate = (templateFilename, { name, root, ...rest }) => {
  const templatePath = path.join(root || templateRoot, templateFilename)
  const template = lodash.template(readFile(templatePath).toString())

  const renderedTemplate = template({
    name,
    ...nameVariants(name),
    ...rest,
  })

  // We format .js and .css templates, we need to tell prettier which parser
  // we're using.
  // https://prettier.io/docs/en/options.html#parser
  const parser = {
    '.css': 'css',
    '.js': 'babel',
  }[path.extname(templateFilename)]

  if (typeof parser === 'undefined') {
    return renderedTemplate
  }

  return format(renderedTemplate, {
    ...prettierOptions(),
    parser,
  })
}

export const readFile = (target) => fs.readFileSync(target)

export const writeFile = async (
  target,
  contents,
  { overwriteExisting = false } = {}
) => {
  if (!overwriteExisting && fs.existsSync(target)) {
    throw new Error(`${target} already exists.`)
  }

  const filename = path.basename(target)
  const targetDir = target.replace(filename, '')
  fs.mkdirSync(targetDir, { recursive: true })
  fs.writeFileSync(target, contents)
}

export const bytes = (contents) => Buffer.byteLength(contents, 'utf8')

/**
 * This wraps the core version of getPaths into something that catches the exception
 * and displays a helpful error message.
 */
export const getPaths = () => {
  try {
    return getRedwoodPaths()
  } catch (e) {
    console.error(c.error(e.message))
    process.exit(0)
  }
}

/**
 * This returns the config present in `prettier.config.js` of a Redwood project.
 */
export const prettierOptions = () => {
  try {
    return require(path.join(getPaths().base, 'prettier.config.js'))
  } catch (e) {
    return undefined
  }
}

/**
 * Creates a list of tasks that write files to the disk.
 *
 * @param files - {[filepath]: contents}
 */
export const writeFilesTask = (files, options) => {
  const { base } = getPaths()
  return new Listr(
    Object.keys(files).map((file) => {
      const contents = files[file]
      return {
        title: `Writing \`./${path.relative(base, file)}\`...`,
        task: () => writeFile(file, contents, options),
      }
    })
  )
}

/**
 * Update the project's routes file.
 */
export const addRoutesToRouterTask = (routes) => {
  const redwoodPaths = getPaths()
  const routesContent = readFile(redwoodPaths.web.routes).toString()
  const newRoutesContent = routes.reverse().reduce((content, route) => {
    if (content.includes(route)) {
      return content
    }
    return content.replace(/(\s*)\<Router\>/, `$1<Router>$1  ${route}`)
  }, routesContent)
  writeFile(redwoodPaths.web.routes, newRoutesContent, {
    overwriteExisting: true,
  })
}

export const runCommandTask = async (commands, { verbose }) => {
  const tasks = new Listr(
    commands.map(({ title, cmd, args, opts = {} }) => ({
      title,
      task: async () => {
        return execa(cmd, args, {
          shell: true,
          cwd: `${getPaths().base}/api`,
          stdio: verbose ? 'inherit' : 'pipe',
          extendEnv: true,
          cleanup: true,
          ...opts,
        })
      },
    })),
    {
      renderer: verbose && VerboseRenderer,
      dateFormat: false,
    }
  )

  try {
    await tasks.run()
    return true
  } catch (e) {
    console.log(c.error(e.message))
    return false
  }
}
