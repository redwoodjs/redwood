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
  // NOTE: So we clear the dist directory on each build so for now I'm just going to
  //       watch the dist directory and when it changes I'll reload the mailer and
  //       mail templates. I would bet this is not ideal in terms of performance.

  const distWatcher = chokidar.watch('**/*.*', {
    cwd: getPaths().api.dist,
    ignoreInitial: true,
    usePolling: true,
    interval: 500,
  })
  process.on('SIGINT', async () => {
    await distWatcher.close()
  })

  // I had to turn on polling to get the watcher to work so now I'm not sure this
  // debounce is necessary - especially since the debounce is shorter than the poll
  // interval. I'm going to leave it for now.
  let debounceTimer: NodeJS.Timeout | undefined = undefined
  const listenOnEventsForDist = ['ready', 'add', 'change']
  for (let i = 0; i < listenOnEventsForDist.length; i++) {
    distWatcher.on(listenOnEventsForDist[i], async () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }
      debounceTimer = setTimeout(async () => {
        await updateMailAnalysis()
      }, 250)
    })
  }
}

async function updateMailAnalysis() {
  console.log('Reanalysing mailer and mail templates...')
  try {
    await updateMailRenderers()
    await updateMailTemplates()
  } catch (error) {
    console.error('Error updating mailer and mail templates:')
    console.error(error)
    console.error(
      'You may need to rebuild your redwood app or restart the studio'
    )
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
  const mailTemplateDistDir = path.join(getPaths().api.dist, 'mail')
  if (!fs.existsSync(mailTemplateDistDir)) {
    return
  }

  const distFiles = getFilesInDir(mailTemplateDistDir).filter((file) =>
    file.endsWith('.js')
  )
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

    const existingTemplate = await db.get(
      `SELECT id FROM mail_template WHERE path = ?;`,
      srcFiles[i]
    )
    if (existingTemplate) {
      // Update the values
      await db.run(
        `UPDATE mail_template SET name = ?, updated_at = ? WHERE id = ?;`,
        [name, Date.now(), existingTemplate.id]
      )
    } else {
      // Insert the values
      await db.run(
        `INSERT INTO mail_template (name, path, updated_at) VALUES (?, ?, ?);`,
        [name, srcFiles[i], Date.now()]
      )
    }

    const templateId =
      existingTemplate?.id ??
      (
        await db.get(
          `SELECT id FROM mail_template WHERE path = ?;`,
          srcFiles[i]
        )
      )?.id

    // Get the components from the AST of the src file
    const components = getMailTemplateComponents(srcFiles[i])

    // Insert the components
    for (let j = 0; j < components.length; j++) {
      const existingComponent = await db.get(
        `SELECT id FROM mail_template_component WHERE mail_template_id = ? AND name = ?;`,
        [templateId, components[j].name]
      )
      if (existingComponent) {
        // Update the values
        await db.run(
          `UPDATE mail_template_component SET props_template = ?, updated_at = ? WHERE id = ?;`,
          [components[j].propsTemplate, Date.now(), existingComponent.id]
        )
      } else {
        // Insert the values
        await db.run(
          `INSERT INTO mail_template_component (mail_template_id, name, props_template, updated_at) VALUES (?, ?, ?, ?);`,
          [
            templateId,
            components[j].name,
            components[j].propsTemplate,
            Date.now(),
          ]
        )
      }
    }

    // Delete any components that are no longer in the src file
    await db.run(
      `DELETE FROM mail_template_component WHERE mail_template_id = ? AND name NOT IN (${components
        .map(() => '?')
        .join(',')});`,
      [templateId, ...components.map((c) => c.name)]
    )
  }
  console.log(` - Analysed ${srcFiles.length} mail templates`)

  // Delete any mail template components that no longer have a corresponding mail template
  await db.run(
    `DELETE FROM mail_template_component WHERE mail_template_id NOT IN (SELECT id FROM mail_template);`
  )
}

function getMailTemplateComponents(templateFilePath: string) {
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
    let propsTemplate = null
    const hasParams = exportedComponents[i].declaration.params.length > 0
    if (hasParams) {
      propsTemplate = 'Provide your props here as JSON'
      try {
        const param = exportedComponents[i].declaration.params[0]
        switch (param.pat.type) {
          case 'ObjectPattern':
            propsTemplate = `{${param.pat.properties
              .map((p: any) => {
                return `\n  "${p.key.value}": ?`
              })
              .join(',')}\n}`
            break
        }
      } catch (_error) {
        // Ignore for now
      }
    }
    components.push({
      name: exportedComponents[i].declaration?.identifier?.value ?? 'Unknown',
      propsTemplate,
    })
  }

  // TODO: Support `const X = () => {}; export default X;`
  // TODO: Support `export default function X () => {}`
  // TODO: Support `export default () => {}`

  return components
}

export async function updateMailRenderers() {
  try {
    const mailerFilePath = path.join(getPaths().api.dist, 'lib', 'mailer.js')
    if (!fs.existsSync(mailerFilePath)) {
      return
    }

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

    for (let i = 0; i < renderers.length; i++) {
      const existingRenderer = await db.get(
        `SELECT id FROM mail_renderer WHERE name = ?;`,
        renderers[i]
      )
      if (existingRenderer) {
        // Update the values
        await db.run(
          `UPDATE mail_renderer SET is_default = ?, updated_at = ? WHERE id = ?;`,
          [
            renderers[i] === defaultRenderer ? 1 : 0,
            Date.now(),
            existingRenderer.id,
          ]
        )
      } else {
        // Insert the values
        await db.run(
          `INSERT INTO mail_renderer (name, is_default, updated_at) VALUES (?, ?, ?);`,
          [renderers[i], renderers[i] === defaultRenderer ? 1 : 0, Date.now()]
        )
      }
    }
  } catch (error) {
    console.error('Error reloading mailer:')
    console.error(error)
  }
}
