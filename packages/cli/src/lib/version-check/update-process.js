import { exec } from 'child_process'

import {
  resetHistory,
  setVersions,
  initStorage,
  getVersions,
} from './storage.js'

function indexOfColumn(table, name) {
  return table.data.head.indexOf(name)
}

function tableToVersions(table) {
  const releavntColumns = ['Current', 'Latest']
  const packageName = '@redwoodjs/core'
  const packageColumnName = 'Package'
  const redwoodPackageInfo = table.data.body.find(function (packageArr) {
    return packageName === packageArr[indexOfColumn(table, packageColumnName)]
  })
  return releavntColumns.reduce(function (acc, tableKeyName) {
    acc[tableKeyName.toLowerCase()] =
      redwoodPackageInfo[indexOfColumn(table, tableKeyName)]
    return acc
  }, {})
}

function parseYarnOutdatedResponse(stdout) {
  try {
    // The return string is actually two lines of JSON objects, with the second being the table with the relevant info
    const table = JSON.parse(stdout.split('\n')[1])
    return tableToVersions(table)
  } catch (e) {
    console.log(e)
    return undefined
  }
}

exec('yarn outdated --json', async (err, stdout) => {
  // yarn outdated returning an error means there is at least one outdated package
  if (typeof err === 'object' && typeof stdout === 'string') {
    const versions = parseYarnOutdatedResponse(stdout)
    if (versions) {
      await initStorage()
      const prevVerious = await getVersions()
      // only update when there is a newer version
      if (!prevVerious || prevVerious.latest !== versions.latest) {
        await resetHistory()
        await setVersions(versions)
      }
    }
  }
})
