import { processPagesDir } from '@redwoodjs/internal'

export default function(source) {
  // Process the dir to find all Page dependencies.
  const deps = processPagesDir()

  // Remove any deps that have been explicitly declared in the Routes file. When one
  // is present, the user is requesting that the module be included in the main
  // bundle.
  const filteredDeps = deps.filter((dep) => {
    const re = new RegExp(`^\\s*import\\s+${dep.const}\\s+from`, 'm')
    return !source.match(re)
  })

  // Inform Webpack that we're pulling external dependencies so it can do the
  // right thing with watched files, etc.
  filteredDeps.forEach((entry) => {
    this.addDependency(entry.path)
  })

  // Grab the import strings from the deps and get them ready to be appended
  // onto the Routes file.
  const importString = filteredDeps.map((x) => x.importStatement).join('\n')

  // Give 'em what they want!
  return importString + '\n\n' + source
}
