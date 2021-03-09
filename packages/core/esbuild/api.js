/* eslint-env node, commonjs */

const path = require('path')

const { glob } = require('glob')

const { getPaths } = require('@redwoodjs/internal')

const rwjsPaths = getPaths()

// Hello. Test this like so:
// You're in the root of the RedwoodJS framework directory:
// __REDWOOD__CONFIG_PATH=__fixtures__/example-todo-main node packages/core/esbuild/api.js

/**
 * Converts a files path into a variable name.
 */
const filePathToVarName = (filePath, searchGlob) => {
  return filePath
    .replace(searchGlob, '')
    .replace(/.(js|ts)/, '')
    .replace(/[^a-zA-Z0-9]/g, '_')
}

// Supports "import schemas from 'src/graphql/**/*.{js,ts}'"
const globImports = {
  name: 'glob-imports',
  setup: (build) => {
    // Find all files that match "src/<word characters>/**",
    // and mark them as "glob-imports".
    build.onResolve({ filter: /^src\/\w+\/\*\*/ }, (args) => {
      return {
        path: args.path,
        namespace: 'glob-imports',
      }
    })

    // Resolve "glob-imports" by replacing them with standard imports.
    build.onLoad(
      { filter: /^src\/\w+\/\*\*/, namespace: 'glob-imports' },
      (args) => {
        const files = glob.sync(args.path, {
          cwd: rwjsPaths.api.base,
          ignore: ['**/*.test.ts', '**/__fixtures__/**', '**/*.scenarios.ts'],
        })

        const imports = []
        const exports = []
        for (const f of files) {
          const varname = filePathToVarName(f, args.path)
          imports.push(`import * as ${varname} from './${f}'`)
          exports.push(`${varname}: ${varname}`)
        }

        const contents = `
        ${imports.join('\n')}
        export default {
          ${exports.join(',\n')}
        }`

        return { contents, resolveDir: '.' }
      }
    )
  },
}

// Do not bundle the node_modules.
const makeAllNodeModulesExternal = {
  name: 'external-node-modules',
  setup: (build) => {
    // Relative paths always start with a ".",
    // so things that do not start with "." are marked as external.
    // This breaks our "src" alias, which we fix with "internal-src-alias."
    build.onResolve({ filter: /^[^.]/, namespace: 'file' }, (args) => {
      return { path: args.path, external: true }
    })
  },
}

const makeSrcAliasInternal = {
  name: 'internal-src-alias',
  setup: (build) => {
    build.onResolve({ filter: /^src\// }, () => {
      return {
        external: false,
      }
    })
  },
}

const foundFunctions = glob.sync('src/functions/*.{ts,js}', {
  cwd: rwjsPaths.api.base,
  ignore: ['**/*.test.ts', '**/__fixtures__/**'],
})

const entryPoints = foundFunctions.map((f) => './' + f)
const outdir = path.join(rwjsPaths.api.dist, 'functions')

console.time('ESBuild bundle')

require('esbuild')
  .build({
    absWorkingDir: rwjsPaths.api.base,
    entryPoints,
    platform: 'node',
    target: 'node12.21', // AWS Lambdas support NodeJS 12.x, (14.x also supported, but Netlify?)
    format: 'cjs',
    bundle: true, // Create a single file.
    outdir,
    plugins: [globImports, makeAllNodeModulesExternal, makeSrcAliasInternal],
    inject: [path.join(__dirname, './apiGlobals.js')],
  })
  .then(() => {
    console.log()
    console.timeEnd('ESBuild bundle')
    console.log()
  })
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
