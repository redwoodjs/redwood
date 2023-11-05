import path from 'node:path'

import fs from 'fs-extra'

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

export async function getRenderedMail(
  _parent: unknown,
  {
    componentId,
    rendererId,
    propsJSON,
  }: { componentId: number; rendererId: number; propsJSON?: string }
) {
  const db = await getDatabase()
  try {
    // Get the component and the component's template
    const component = await db.get(
      `
      SELECT
        name,
        props_template,
        mail_template_id
      FROM
        mail_template_component
      WHERE
        id = ?
      ;
    `,
      componentId
    )
    if (!component) {
      throw new Error(`Component not found`)
    }

    // Get the template
    const template = await db.get(
      `
      SELECT
        path
      FROM
        mail_template
      WHERE
        id = ?
      ;
    `,
      component.mail_template_id
    )
    if (!template) {
      throw new Error(`Template not found`)
    }

    // Get the renderer
    const renderer = await db.get(
      `
      SELECT
        name
      FROM
        mail_renderer
      WHERE
        id = ?
      ;
    `,
      rendererId
    )
    if (!renderer) {
      throw new Error(`Renderer not found`)
    }

    // Import the template component
    const templateComponentDistPath =
      template.path
        .replace('api/src', 'api/dist')
        .substring(0, template.path.lastIndexOf('.') + 1) + '.js'

    const templateImportPath = templateComponentDistPath.replace(
      '.js',
      `.studio_${Date.now()}.js`
    )
    fs.copyFileSync(templateComponentDistPath, templateImportPath)
    const templateComponent = await import(templateImportPath)
    fs.removeSync(templateImportPath)
    const Component = templateComponent[component.name]

    // Import the mailer
    const mailerFilePath = path.join(getPaths().api.dist, 'lib', 'mailer.js')
    const mailerImportPath = mailerFilePath.replace(
      '.js',
      `.studio_${Date.now()}.js`
    )
    fs.copyFileSync(mailerFilePath, mailerImportPath)
    const mailer = (await import(mailerImportPath)).mailer
    fs.removeSync(mailerImportPath)

    // Render the component
    const props = propsJSON ? JSON.parse(propsJSON) : {}
    const renderResult = await mailer.renderers[renderer.name].render(
      Component(props),
      {} // TODO: We need a way for the user to specify the render options
    )

    return {
      html: renderResult.html,
      text: renderResult.text,
    }
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
      is_default,
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
      isDefault: row.is_default === 1,
      updatedAt: row.updated_at,
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
      updatedAt: row.updated_at,
    }
  })
}

export async function getMailComponents() {
  const db = await getDatabase()
  const sql = `
    SELECT
      id,
      mail_template_id,
      name,
      props_template,
      updated_at
    FROM
      mail_template_component
    ORDER BY
      name ASC
    ;
  `
  const rows = await db.all(sql)
  return rows.map((row) => {
    return {
      id: parseInt(row.id),
      mailTemplateId: parseInt(row.mail_template_id),
      name: row.name,
      propsTemplate: row.props_template,
      updatedAt: row.updated_at,
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
