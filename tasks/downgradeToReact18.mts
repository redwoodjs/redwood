// Run this file with `yarn tsx downgradeToReact18`

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import type { PackageJson } from 'type-fest'

// tsx unfortunately doesn't support import.meta.dirname yet
// See https://github.com/evanw/esbuild/issues/1492#issuecomment-2061825201
const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function findPackageJsonFiles(directory: string) {
  const files: string[] = []

  const entries = await fs.readdir(directory, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name)

    if (entry.isDirectory()) {
      const nestedFiles = await findPackageJsonFiles(fullPath)
      files.push(...nestedFiles)
    } else if (entry.isFile() && entry.name === 'package.json') {
      files.push(fullPath)
    }
  }

  return files
}

async function parsePackageJsonFiles(packageJsonFilePaths: string[]) {
  const packageJsonMap: Record<string, PackageJson> = {}

  for (const packageJsonFile of packageJsonFilePaths) {
    const packageJson = JSON.parse(
      await fs.readFile(packageJsonFile, { encoding: 'utf-8' }),
    )

    packageJsonMap[packageJsonFile] = packageJson
  }

  return packageJsonMap
}

async function downgradeReactVersion(packageJsonArray: PackageJson[]) {
  const targetReactVersion = '18.3.1'
  for (const packageJson of packageJsonArray) {
    if (packageJson.dependencies?.react?.startsWith('19.')) {
      packageJson.dependencies.react = targetReactVersion
    }

    if (packageJson.devDependencies?.react?.startsWith('19.')) {
      packageJson.devDependencies.react = targetReactVersion
    }

    if (packageJson.peerDependencies?.react?.startsWith('19.')) {
      packageJson.peerDependencies.react = targetReactVersion
    }

    if (packageJson.dependencies?.['react-dom']?.startsWith('19.')) {
      packageJson.dependencies['react-dom'] = targetReactVersion
    }

    if (packageJson.devDependencies?.['react-dom']?.startsWith('19.')) {
      packageJson.devDependencies['react-dom'] = targetReactVersion
    }

    if (packageJson.peerDependencies?.['react-dom']?.startsWith('19.')) {
      packageJson.peerDependencies['react-dom'] = targetReactVersion
    }
  }
}

async function removeReactIsResolution(packageJsonArray: PackageJson[]) {
  for (const packageJson of packageJsonArray) {
    if (packageJson.resolutions?.['react-is']) {
      delete packageJson.resolutions['react-is']
    }
  }
}

async function writePackageJsonFiles(
  packageJsonMap: Record<string, PackageJson>,
) {
  for (const [packageJsonFile, packageJson] of Object.entries(packageJsonMap)) {
    await fs.writeFile(
      packageJsonFile,
      JSON.stringify(packageJson, null, 2) + '\n',
    )
  }
}

const fixturesPath = path.join(__dirname, '../__fixtures__/')
const packagesPath = path.join(__dirname, '../packages/')
const packageJsonFilePaths = [
  ...(await findPackageJsonFiles(fixturesPath)),
  ...(await findPackageJsonFiles(packagesPath)),
]

const packageJsonMap = await parsePackageJsonFiles(packageJsonFilePaths)
const packageJsonArray = Object.values(packageJsonMap)

await downgradeReactVersion(packageJsonArray)
await removeReactIsResolution(packageJsonArray)

await writePackageJsonFiles(packageJsonMap)
