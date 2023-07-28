import fs from 'node:fs'
import path from 'node:path'

import { getPaths } from '@redwoodjs/project-config'

import { getDatabase } from '../database'

export async function mails() {
  const db = await getDatabase()
  const sql = `
    SELECT
      id,
      data,
      envelope,
      created_at
    FROM
      mail
    ORDER BY
      created_at DESC
    ;
  `
  const rows = await db.all(sql)
  return rows.map((row) => {
    return {
      id: row.id,
      data: JSON.parse(row.data),
      envelope: JSON.parse(row.envelope),
      created_at: row.created_at,
    }
  })
}

export async function templateFiles() {
  const getMailTemplateFiles = (dir: string) => {
    const files: string[] = []
    const dirFiles = fs.readdirSync(dir)
    for (const file of dirFiles) {
      if (fs.statSync(path.join(dir, file)).isDirectory()) {
        files.push(...getMailTemplateFiles(path.join(dir, file)))
      } else {
        files.push(path.join(dir, file))
      }
    }
    return files
  }

  const mailDir = getPaths().api.mail
  const filepaths = getMailTemplateFiles(mailDir)
  return filepaths.map((filepath) => {
    return {
      name: filepath.substring(mailDir.length + 1).split('.')[0],
      path: filepath,
    }
  })
}

export async function templateFileExports(
  _parent: unknown,
  { templatePath }: { templatePath: string }
) {
  const relPath = path.relative(__dirname, templatePath)
  const relPathNoExt = relPath.substring(0, relPath.lastIndexOf('.'))
  const relPathNoExtDist = relPathNoExt.replace('api/src/mail', 'api/dist/mail')
  const importedTemplate = await import(
    `${relPathNoExtDist}.js?update=${Date.now()}&max-age=1`
  )
  console.dir(
    {
      path: `${relPathNoExtDist}.js?update=${Date.now()}`,
      importedTemplate,
    },
    { depth: null }
  )
  return Object.keys(importedTemplate)
}

export async function truncate() {
  const db = await getDatabase()
  const sql = `
    DELETE FROM mail;
  `
  try {
    await db.exec(sql)
  } catch (error) {
    console.error(error)
    return false
  }
  return true
}
