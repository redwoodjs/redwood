import fs from 'node:fs'
import path from 'node:path'

import { getPaths } from '@redwoodjs/project-config'

import { getDatabase } from '../database'

const swc = require('@swc/core')

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
      pathRelativeToProjectRoot: filepath.substring(getPaths().base.length),
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
    `${relPathNoExtDist}.js?t=${Date.now()}`
  )
  return Object.keys(importedTemplate)
}

export async function templateComponentProps(
  _parent: unknown,
  { templatePath, exportName }: { templatePath: string; exportName: string }
) {
  const ast = swc.parseFileSync(templatePath, {
    syntax: 'typescript',
    tsx: true,
  })

  const exportedComponent = ast.body.filter((node: any) => {
    return (
      node.type === 'ExportDeclaration' &&
      node.declaration.identifier.value === exportName
    )
  })[0]
  if (exportedComponent === undefined) {
    throw new Error(
      `Could not find export named ${exportName} in ${templatePath}`
    )
  }

  const parameters = exportedComponent.declaration.params[0]
  if (parameters === undefined) {
    return {}
  }

  if (parameters.pat.type === 'ObjectPattern') {
    const args: any = {
      type: parameters.pat.type,
      fields: {},
    }
    for (let i = 0; i < parameters.pat.properties.length; i++) {
      const prop = parameters.pat.properties[i]
      args.fields[prop.key.value] = 'JSON'
    }
    return args
  }
  if (parameters.pat.type === 'Identifier') {
    return {
      type: parameters.pat.type,
    }
  }

  throw new Error(`Unknown parameters type ${parameters.pat}`)
}

export async function renderTemplate(
  _parent: unknown,
  {
    templatePath,
    exportName: _exportName,
    jsonData,
  }: { templatePath: string; exportName: string; jsonData?: string }
) {
  const relPath = path.relative(__dirname, templatePath)
  const relPathNoExt = relPath.substring(0, relPath.lastIndexOf('.'))
  const relPathNoExtDist = relPathNoExt.replace('api/src/mail', 'api/dist/mail')
  // @ts-expect-error - ignore
  const _importedTemplate = await import(
    `${relPathNoExtDist}.js?t=${Date.now()}`
  )
  try {
    // @ts-expect-error - ignore
    const _data = jsonData ? JSON.parse(jsonData) : {}
    return ''
    // return MailRenderer.render(importedTemplate[exportName](data), 'both')
  } catch (error) {
    return {
      error: (error as Error).message,
    }
  }
}

export async function getMailRenderers() {
  const db = await getDatabase()
  const sql = `
    SELECT
      id,
      name,
      updated_at
    FROM
      mail_renderer
    ORDER BY
      name ASC
    ;
  `
  const rows = await db.all(sql)
  return rows.map((row) => {
    return {
      id: parseInt(row.id),
      name: row.name,
      updated_at: row.updated_at,
    }
  })
}

export async function getMailTemplates() {
  const db = await getDatabase()
  const sql = `
    SELECT
      id,
      name,
      path,
      updated_at
    FROM
      mail_template
    ORDER BY
      name ASC
    ;
  `
  const rows = await db.all(sql)
  return rows.map((row) => {
    return {
      id: parseInt(row.id),
      name: row.name,
      path: row.path,
      updated_at: row.updated_at,
    }
  })
}

export async function getMailComponents(
  _parent: unknown,
  { templateId }: { templateId: number }
) {
  const db = await getDatabase()
  const sql = `
    SELECT
      id,
      mail_template_id,
      name,
      propsTemplate,
      updated_at
    FROM
      mail_template_component
    WHERE
      mail_template_id = ?
    ORDER BY
      name ASC
    ;
  `
  const rows = await db.all(sql, templateId)
  return rows.map((row) => {
    return {
      id: parseInt(row.id),
      mail_template_id: parseInt(row.mail_template_id),
      name: row.name,
      propsTemplate: row.propsTemplate,
      updated_at: row.updated_at,
    }
  })
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
