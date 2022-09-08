// @ts-check
const fs = require('fs')
const path = require('path')

const { getConfig: getPrismaConfig, getDMMF } = require('@prisma/internals')

const {
  getApiSideDefaultBabelConfig,
  registerApiSideBabelHook,
} = require('@redwoodjs/internal/dist/build/babel/api')
const { getPaths } = require('@redwoodjs/internal/dist/paths')
const { defineScenario } = require('@redwoodjs/testing/dist/api/scenario')

const rwjsPaths = getPaths()
const NODE_MODULES_PATH = path.join(rwjsPaths.base, 'node_modules')
const { babelrc } = getApiSideDefaultBabelConfig()

// We need this to (a) load the user's prisma client in src/lib/db.ts
// (b) load the scenario files in buildScenario
registerApiSideBabelHook()

if (process.env.SKIP_DB_PUSH !== '1') {
  const process = require('process')
  // Load dotenvs
  require('dotenv-defaults/config')

  const cacheDirDb = `file:${path.join(__dirname, '.redwood', 'test.db')}`
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || cacheDirDb

  const command =
    process.env.TEST_DATABASE_STRATEGY === 'reset'
      ? ['prisma', 'migrate', 'reset', '--force', '--skip-seed']
      : ['prisma', 'db', 'push', '--force-reset', '--accept-data-loss']

  const execa = require('execa')
  execa.sync(`yarn rw`, command, {
    cwd: rwjsPaths.api.base,
    stdio: 'inherit',
    shell: true,
    env: {
      DATABASE_URL: process.env.DATABASE_URL,
    },
  })

  // If its been reset once, we don't need to re-run it for every test
  process.env.SKIP_DB_PUSH = '1'
}

// Error codes thrown by [MySQL, SQLite, Postgres] when foreign key constraint
// fails on DELETE
const FOREIGN_KEY_ERRORS = [1451, 1811, 23503]
const TEARDOWN_CACHE_PATH = path.join(
  rwjsPaths.generated.base,
  'scenarioTeardown.json'
)
const DEFAULT_SCENARIO = 'standard'
let teardownOrder = []
let originalTeardownOrder = []

const deepCopy = (obj) => {
  return JSON.parse(JSON.stringify(obj))
}

const isIdenticalArray = (a, b) => {
  return JSON.stringify(a) === JSON.stringify(b)
}

const configureTeardown = async () => {
  // @NOTE prisma utils are available in cli lib/schemaHelpers
  // But avoid importing them, to prevent memory leaks in jest
  const schema = await getDMMF({ datamodelPath: rwjsPaths.api.dbSchema })
  const schemaModels = schema.datamodel.models.map((m) => m.dbName || m.name)

  // check if pre-defined delete order already exists and if so, use it to start
  if (fs.existsSync(TEARDOWN_CACHE_PATH)) {
    teardownOrder = JSON.parse(fs.readFileSync(TEARDOWN_CACHE_PATH).toString())
  }

  // check the number of models in case we've added/removed since cache was built
  if (teardownOrder.length !== schemaModels.length) {
    teardownOrder = schemaModels
  }

  // keep a copy of the original order to compare against
  originalTeardownOrder = deepCopy(teardownOrder)
}

// Lazy load the project db
let projectDb
const getProjectDb = () => {
  if (!projectDb) {
    // So that we can load the user's prisma client
    // The file itself maybe TS/ES6 - and may have middlewares configured
    const { db } = require(path.join(rwjsPaths.api.lib, 'db'))

    projectDb = db
  }

  return projectDb
}

let quoteStyle
// determine what kind of quotes are needed around table names in raw SQL
const getQuoteStyle = async () => {
  if (!quoteStyle) {
    const config = await getPrismaConfig({
      datamodel: fs.readFileSync(rwjsPaths.api.dbSchema).toString(),
    })

    switch (config.datasources?.[0]?.provider) {
      case 'mysql':
        quoteStyle = '`'
        break
      default:
        quoteStyle = '"'
    }
  }

  return quoteStyle
}

// Build scenario is the function that actually loads *.scenario.ts,js files
// global.defineScenario has to be defined in THIS file because it's the context where the scenario is loaded
// Functions only used in tests, are defined in the jest.setup.js file
global.defineScenario = defineScenario

const buildScenario =
  (it, testPath) =>
  (...args) => {
    let scenarioName, testName, testFunc

    if (args.length === 3) {
      ;[scenarioName, testName, testFunc] = args
    } else if (args.length === 2) {
      scenarioName = DEFAULT_SCENARIO
      ;[testName, testFunc] = args
    } else {
      throw new Error('scenario() requires 2 or 3 arguments')
    }

    return it(testName, async () => {
      const testFileDir = path.parse(testPath)
      // e.g. ['comments', 'test'] or ['signup', 'state', 'machine', 'test']
      const testFileNameParts = testFileDir.name.split('.')
      const testFilePath = `${testFileDir.dir}/${testFileNameParts
        .slice(0, testFileNameParts.length - 1)
        .join('.')}.scenarios`
      let allScenarios, scenario, result

      try {
        allScenarios = require(testFilePath)
      } catch (e) {
        // ignore error if scenario file not found, otherwise re-throw
        if (e.code !== 'MODULE_NOT_FOUND') {
          throw e
        }
      }

      if (allScenarios) {
        if (allScenarios[scenarioName]) {
          scenario = allScenarios[scenarioName]
        } else {
          throw new Error(
            `UndefinedScenario: There is no scenario named "${scenarioName}" in ${testFilePath}.{js,ts}`
          )
        }
      }

      const scenarioData = await seedScenario(scenario)
      result = await testFunc(scenarioData)

      return result
    })
  }

const teardown = async () => {
  const quoteStyle = await getQuoteStyle()

  for (const modelName of teardownOrder) {
    try {
      await getProjectDb().$executeRawUnsafe(
        `DELETE FROM ${quoteStyle}${modelName}${quoteStyle}`
      )
    } catch (e) {
      const match = e.message.match(/Code: `(\d+)`/)
      if (match && FOREIGN_KEY_ERRORS.includes(parseInt(match[1]))) {
        const index = teardownOrder.indexOf(modelName)
        teardownOrder[index] = null
        teardownOrder.push(modelName)
      } else {
        throw e
      }
    }
  }

  // remove nulls
  teardownOrder = teardownOrder.filter((val) => val)

  // if the order of delete changed, write out the cached file again
  if (!isIdenticalArray(teardownOrder, originalTeardownOrder)) {
    originalTeardownOrder = deepCopy(teardownOrder)
    fs.writeFileSync(TEARDOWN_CACHE_PATH, JSON.stringify(teardownOrder))
  }
}

const seedScenario = async (scenario) => {
  if (scenario) {
    const scenarios = {}
    for (const [model, namedFixtures] of Object.entries(scenario)) {
      scenarios[model] = {}
      for (const [name, createArgs] of Object.entries(namedFixtures)) {
        if (typeof createArgs === 'function') {
          scenarios[model][name] = await getProjectDb()[model].create(
            createArgs(scenarios)
          )
        } else {
          scenarios[model][name] = await getProjectDb()[model].create(
            createArgs
          )
        }
      }
    }
    return scenarios
  } else {
    return {}
  }
}

/** @type {import('jest').Config} */
module.exports = {
  // To make sure other config option which depends on rootDir use
  // correct path, for example, coverageDirectory
  rootDir: rwjsPaths.base,
  roots: [path.join(rwjsPaths.api.src)],
  runner: path.join(__dirname, '../jest-serial-runner.js'),
  testEnvironment: path.join(__dirname, './RedwoodApiJestEnv.js'),
  globals: {
    __RWJS__TEST_IMPORTS: {
      configureTeardown,
      teardown,
      buildScenario,
      apiSrcPath: rwjsPaths.api.src,
    },
  },
  sandboxInjectedGlobals: ['__RWJS__TEST_IMPORTS'],
  displayName: {
    color: 'redBright',
    name: 'api',
  },
  collectCoverageFrom: [
    '**/*.{js,jsx,ts,tsx}',
    '!**/node_modules/**',
    '!**/dist/**',
  ],
  coverageDirectory: path.join(rwjsPaths.base, 'coverage'),
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
  ],
  // Note this setup runs for each test file!
  setupFilesAfterEnv: [path.join(__dirname, './jest.setup.js')],
  moduleNameMapper: {
    // @NOTE: Import @redwoodjs/testing in api tests, and it automatically remaps to the api side only
    // This is to prevent web stuff leaking into api, and vice versa
    '^@redwoodjs/testing$': path.join(
      NODE_MODULES_PATH,
      '@redwoodjs/testing/api'
    ),
  },
  transform: {
    '\\.[jt]sx?$': [
      'babel-jest',
      // When jest runs tests in parallel, it serializes the config before passing down options to babel
      // that's why these must be serializable. So ideally, we should just pass reference to a
      // configFile or "extends" a config. But we need a few other option only at root level, so we'll pass
      //  here and remove those keys inside "extend"ed config.
      {
        babelrc, // babelrc can not reside inside "extend"ed config, that's why we have it here
        configFile: path.resolve(__dirname, './apiBabelConfig.js'),
      },
    ],
  },
}
