import type { ListrTaskWrapper } from 'listr2'

const fs = require('fs')

/**
 * TODO: finish implementing this and actually use it.
 * The main challenge, I think, will be that an import name isn't necessarily the same as the package name: eg, `import tailwindDefaults from 'tailwindcss/defaultConfig' is importing from the package `tailwindcss`, not `tailwindcss/defaultConfig`.
 * Maybe the move is to go the other way around — get a list of possible packages to install, and *then* look in the import statements?
 * Basically, we want to replace all (or most?) of the calls to `fs.writeFileSync()` with this function.
 *
 * Rather than blindly adding packages to the project,
 * we'll do it as we add the files that require them.
 *
 * Additionally, this will:
 * - Overwrite the file if it already exists
 * - Install the version of the package that is in the RedwoodUI package.json, regardless of whether it's already installed (or a newer version) in the project.
 *
 * @param rwuiPackageJson Content of the RedwoodUI package.json — this is where we get the package versions. Getting it requires a network call, so requiring it as a parameter such that it can be retrieved only once.
 * @param fileBeingAdded Content of the file being added to the project
 * @param filePath Path of the file being added — this is where it will be written out to
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function addFileAndInstallPackages(
  task: ListrTaskWrapper<any, any>,
  /**
   * The parsed content of the RedwoodUI package.json
   */
  rwuiPackageJson: any,
  fileBeingAdded: string,
  filePath: string,
) {
  const dependencies = Object.keys(rwuiPackageJson.dependencies)
  const devDependencies = Object.keys(rwuiPackageJson.devDependencies)

  const packagesInFile = extractPackageNames(fileBeingAdded)

  const depsToInstall: string[] = []
  const devDepsToInstall: string[] = []

  // Check which packages need to be installed
  packagesInFile.forEach((pkg) => {
    // Check if the package is listed in dependencies
    if (dependencies[pkg]) {
      depsToInstall.push(`${pkg}@${dependencies[pkg]}`)
      // Check if the package is listed in devDependencies
    } else if (devDependencies[pkg]) {
      devDepsToInstall.push(`${pkg}@${devDependencies[pkg]}`)
    }
  })

  // Install the dependencies
  if (depsToInstall.length > 0) {
    execSync(`npm install ${depsToInstall.join(' ')}`, { stdio: 'inherit' })
  }

  // Install the devDependencies
  if (devDepsToInstall.length > 0) {
    execSync(`npm install -D ${devDepsToInstall.join(' ')}`, {
      stdio: 'inherit',
    })
  }

  // Write the file to the specified path
  fs.writeFileSync(filePath, fileBeingAdded)

  // get the list of dependencies from the file
  // filter out the ones that are already in the project
  // install the remaining ones in the same way we do in the "Install all necessary packages" task
  // write the file with fs.writeFileSync()
}

// Helper function to extract package names from import statements
function extractPackageNames(fileContent: string): string[] {
  // Regular expression to match import statements and capture the package name
  const importRegex = /import\s.*?from\s['"](.*?)['"]/g
  const packages = new Set<string>()
  let match

  // Iterate over all matches in the file content
  while ((match = importRegex.exec(fileContent)) !== null) {
    // Extract the package name
    const pkg = match[1]
    // Only add non-local imports
    if (!pkg.startsWith('./') && !pkg.startsWith('src/')) {
      packages.add(pkg)
    }
  }

  // Convert the set of packages to an array and return it
  return Array.from(packages)
}
