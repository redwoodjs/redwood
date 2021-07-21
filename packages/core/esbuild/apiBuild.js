/* eslint-env node, commonjs */

const path = require('path')

const esbuild = require('esbuild')
const { glob } = require('glob')

const { getPaths } = require('@redwoodjs/internal')

const rwjsPaths = getPaths()

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
    // and mark them as "glob-imports",
    // which means that the default "file-imports" will not touch them.
    build.onResolve({ filter: /^src\/\S+\/\*\*/ }, (args) => {
      return {
        path: args.path,
        namespace: 'glob-imports',
      }
    })

    // Resolve "glob-imports" by replacing them with standard imports.
    build.onLoad(
      { filter: /^src\/\S+\/\*\*/, namespace: 'glob-imports' },
      (args) => {
        const files = glob.sync(args.path, {
          cwd: rwjsPaths.api.base,
          ignore: [
            '**/__fixtures__/**',
            '**/*.test.ts',
            '**/*.test.js',
            '**/*.scenarios.ts',
            '**/*.scenarios.js',
            '**/*.d.ts',
          ],
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
  ignore: ['**/*.test.ts', '**/*.test.js', '**/__fixtures__/**'],
})

const entryPoints = foundFunctions.map((f) => './' + f)
const outdir = path.join(rwjsPaths.api.dist, 'functions')

module.exports.build = (options) =>
  esbuild.build({
    absWorkingDir: rwjsPaths.api.base,
    entryPoints,
    platform: 'node',
    target: process.env.NODE_ENV === 'development' ? 'esnext' : 'node12.21', // AWS Lambdas support NodeJS 12.x, (14.x also supported, but Netlify?)
    format: 'cjs',
    bundle: true, // Create a single file, not ideal, but plugins do not work otherwise.
    outdir,
    sourcemap: 'external',
    plugins: [globImports, makeSrcAliasInternal, makeAllNodeModulesExternal],
    inject: [path.join(__dirname, './apiGlobals.js')],
    ...options,
  })
