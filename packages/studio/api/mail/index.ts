import path from 'node:path'

import chokidar from 'chokidar'
import fs from 'fs-extra'
import { simpleParser as simpleMailParser } from 'mailparser'
import { SMTPServer } from 'smtp-server'

import { getPaths } from '@redwoodjs/project-config'

import { getDatabase } from '../database'

const swc = require('@swc/core')

let smtpServer: SMTPServer

async function insertMailIntoDatabase(mail: any, envelope: any) {
  const db = await getDatabase()
  const sql = `
    INSERT INTO mail (data, envelope) VALUES (?, ?);
  `
  await db.run(sql, [JSON.stringify(mail), JSON.stringify(envelope)])
}

export function startServer() {
  smtpServer = new SMTPServer({
    banner: 'RedwoodJS Studio SMTP Server',
    authOptional: true,
    hideSTARTTLS: true,
    onData(stream, session, callback) {
      // NOTE: _session is what contains the envelope
      console.log('Received mail')
      simpleMailParser(stream, {}, async (err, mail) => {
        if (err) {
          console.error('Error parsing mail:')
          console.error(err)
        } else {
          await insertMailIntoDatabase(mail, session.envelope)
        }
        callback()
      })
    },
  })
  smtpServer.listen(4319, undefined, () => {
    console.log('Studio SMTP Server listening on 4319')
  })
}

export async function stopServer() {
  await new Promise((resolve) => {
    smtpServer.close(() => {
      resolve(null)
    })
  })
}

export function registerMailRelatedWatchers() {
  const mailerFilePath = path.join(getPaths().api.dist, 'lib', 'mailer.js')
  const mailerWatcher = chokidar.watch(mailerFilePath, {
    usePolling: true,
    interval: 500,
  })
  process.on('SIGINT', async () => {
    await mailerWatcher.close()
  })

  const listenOnEventsForMailer = ['ready', 'add', 'change']
  for (let i = 0; i < listenOnEventsForMailer.length; i++) {
    mailerWatcher.on(listenOnEventsForMailer[i], async () => {
      await updateMailRenderers(mailerFilePath)
    })
  }

  // FIXME: This fires N times for N files in the mail directory
  const mailTemplateDirPath = path.join(getPaths().api.dist, 'mail')
  const mailTemplatewatcher = chokidar.watch(
    path.join(mailTemplateDirPath, '**/*.js'),
    {
      usePolling: true,
      interval: 500,
    }
  )
  process.on('SIGINT', async () => {
    await mailTemplatewatcher.close()
  })

  const listenOnEventsForMailTemplate = ['ready', 'add', 'change']
  for (let i = 0; i < listenOnEventsForMailTemplate.length; i++) {
    mailTemplatewatcher.on(listenOnEventsForMailTemplate[i], async () => {
      await updateMailTemplates()
    })
  }
}

function getFilesInDir(dir: string) {
  const files: string[] = []
  const dirFiles = fs.readdirSync(dir)
  for (const file of dirFiles) {
    if (fs.statSync(path.join(dir, file)).isDirectory()) {
      files.push(...getFilesInDir(path.join(dir, file)))
    } else {
      files.push(path.join(dir, file))
    }
  }
  return files
}

export async function updateMailTemplates() {
  const distFiles = getFilesInDir(
    path.join(getPaths().api.dist, 'mail')
  ).filter((file) => file.endsWith('.js'))
  const srcFiles = getFilesInDir(path.join(getPaths().api.src, 'mail')).filter(
    // The src file must have a corresponding dist file
    (file) => {
      const correspondingDistEntry =
        file
          .replace('api/src', 'api/dist')
          .substring(0, file.lastIndexOf('.') + 1) + '.js'
      return distFiles.includes(correspondingDistEntry)
    }
  )

  const db = await getDatabase()

  // Clear out any mail template that are no longer in the mailer
  await db.run(
    `DELETE FROM mail_template WHERE path NOT IN (${srcFiles
      .map(() => '?')
      .join(',')});`,
    srcFiles
  )

  // Insert the mail templates
  for (let i = 0; i < srcFiles.length; i++) {
    const nameWithExt = path.basename(srcFiles[i])
    const name = nameWithExt.substring(0, nameWithExt.lastIndexOf('.'))
    await db.get(
      `INSERT OR IGNORE INTO mail_template (name, path, updated_at) VALUES (?, ?, ?);`,
      [name, srcFiles[i], Date.now()]
    )
    const templateId = (
      await db.get(`SELECT id FROM mail_template WHERE path = ?;`, srcFiles[i])
    )['id']

    // Get the components from the AST of the src file
    const components = getMailTemplateComponents(srcFiles[i])

    // Insert the components
    for (let j = 0; j < components.length; j++) {
      await db.run(
        `INSERT OR REPLACE INTO mail_template_component (mail_template_id, name, props_template) VALUES (?, ?, ?);`,
        [templateId, components[j].name, components[j].propsTemplate]
      )
    }

    // Delete any components that are no longer in the src file
    await db.run(
      `DELETE FROM mail_template_component WHERE mail_template_id = ? AND name NOT IN (${components
        .map(() => '?')
        .join(',')});`,
      [templateId, ...components.map((c) => c.name)]
    )
  }

  // Delete any mail template components that no longer have a corresponding mail template
  await db.run(
    `DELETE FROM mail_template_component WHERE mail_template_id NOT IN (SELECT id FROM mail_template);`
  )
}

function getMailTemplateComponents(templateFilePath: string) {
  console.log('getMailTemplateComponents', templateFilePath)
  const ast = swc.parseFileSync(templateFilePath, {
    syntax: templateFilePath.endsWith('.js') ? 'ecmascript' : 'typescript',
    tsx: templateFilePath.endsWith('.tsx') || templateFilePath.endsWith('.jsx'),
  })

  const components = []

  // `export function X(){};`
  const exportedComponents = ast.body.filter((node: any) => {
    return node.type === 'ExportDeclaration'
  })
  for (let i = 0; i < exportedComponents.length; i++) {
    // TODO: Extract the "props_template" from the AST
    components.push({
      name: exportedComponents[i].declaration?.identifier?.value ?? 'Unknown',
      propsTemplate: '{}',
    })
  }

  // TODO: Support `const X = () => {}; export default X;`
  // TODO: Support `export default function X () => {}`
  // TODO: Support `export default () => {}`

  return components
}

export async function updateMailRenderers(mailerFilePath: string) {
  try {
    // This is not particularly memory efficient, it'll grow each time the mailer is reloaded
    // I do not currently believe there is a way to invalidate the module load cache
    const suffix = `studio_${Date.now()}`
    const importPath = mailerFilePath.replace('.js', `.${suffix}.js`)
    fs.copyFileSync(mailerFilePath, importPath)
    const mailer = (await import(importPath)).mailer
    fs.removeSync(importPath)
    const renderers = Object.keys(mailer.renderers)
    const defaultRenderer = mailer.config.rendering.default

    const db = await getDatabase()
    // Delete any renderers that are no longer in the mailer
    const deleteSql = `
        DELETE FROM mail_renderer WHERE name NOT IN (${renderers
          .map(() => '?')
          .join(',')});
      `
    await db.run(deleteSql, renderers)

    // Insert any renderers that are not already in the mailer
    const insertSql = `
        INSERT OR IGNORE INTO mail_renderer (name, is_default, updated_at) VALUES (?, ?, ?);
      `
    for (let i = 0; i < renderers.length; i++) {
      await db.run(insertSql, [
        renderers[i],
        renderers[i] === defaultRenderer ? 1 : 0,
        Date.now(),
      ])
    }
  } catch (error) {
    console.error('Error reloading mailer:')
    console.error(error)
  }
}
