const fs = require('fs')
const path = require('path')

const { getOptions } = require('loader-utils')

function processDir(dir, prefix = []) {
  const deps = []
  const entries = fs.readdirSync(dir, { withFileTypes: true })

  // Iterate over a dir's entries, recursing as necessary into
  // subdirectories.
  entries.forEach((entry) => {
    if (entry.isDirectory()) {
      // Actual JS files reside in a directory of the same name, so let's
      // construct the filename of the actual Page file.
      const testFile = path.join(dir, entry.name, entry.name + '.js')

      if (fs.existsSync(testFile)) {
        // If the Page exists, then construct the dependency object and push it
        // onto the deps array.
        const basename = path.posix.basename(entry.name, '.js')
        const importName = prefix.join() + basename
        const importFile = path.join('src', 'pages', basename)
        deps.push({
          path: path.join(dir, entry.name),
          importStatement: `import ${importName} from '${importFile}'`,
        })
      } else {
        // If the Page doesn't exist then we are in a directory of Page
        // directories, so let's recurse into it and do the whole thing over
        // again.
        const newPrefix = prefix.concat(entry.name)
        deps.push(processDir(path.join(dir, entry.name), newPrefix))
      }
    }
  })

  // We may have nested arrays because of the recursion, so flatten the deps
  // into a list.
  return [].concat.apply([], deps)
}

function routesAutoLoader(source) {
  // Get the top level directory from the Webpack config options.
  const { dir } = getOptions(this)

  // Process the dir to find all Page dependencies.
  const deps = processDir(dir)

  // Inform Webpack that we're pulling external dependencies so it can do the
  // right thing with watched files, etc.
  deps.forEach((entry) => {
    this.addDependency(entry.path)
  })

  // Grab the import strings from the deps and get them ready to be appended
  // onto the Routes file.
  const importString = deps.map((x) => x.importStatement).join('\n')

  // Give 'em what they want!
  return importString + '\n' + source
}

module.exports = routesAutoLoader
