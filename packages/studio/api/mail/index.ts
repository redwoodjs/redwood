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
  // const db = await getDatabase()
  // // Delete any templates that are no longer in the mailer
  // const deleteSql = `
  //     DELETE FROM mail_template WHERE path NOT IN (${templateFilesDist
  //       .map(() => '?')
  //       .join(',')});
  //   `
  // await db.run(deleteSql, templateFilesDist)
  // // Insert any templates that are not already in the mailer
  // const insertSql = `
  //     INSERT OR IGNORE INTO mail_template (name, path, updated_at) VALUES (?, ?, ?);
  //   `
  // for (let i = 0; i < templateFilesDist.length; i++) {
  //   const name = path.basename(templateFilesDist[i], '.js')
  //   console.log(
  //     'x: ',
  //     await db.get(insertSql, [name, templateFilesDist[i], Date.now()])
  //   )
  // }
}

export async function updateMailRenderers(mailerFilePath: string) {
  try {
    // This is not particularly memory efficient, it'll grow each time the mailer is reloaded
    // I do not currently believe there is a way to invalidate the module load cache
    const suffix = `studio_${Date.now()}`
    const importPath = mailerFilePath.replace('.js', `.${suffix}.js`)
    fs.copyFileSync(mailerFilePath, importPath)
    const renderers = (await import(importPath)).mailer.renderers
    fs.removeSync(importPath)
    const rendererNames = Object.keys(renderers)

    const db = await getDatabase()
    // Delete any renderers that are no longer in the mailer
    const deleteSql = `
        DELETE FROM mail_renderer WHERE name NOT IN (${rendererNames
          .map(() => '?')
          .join(',')});
      `
    await db.run(deleteSql, rendererNames)

    // Insert any renderers that are not already in the mailer
    const insertSql = `
        INSERT OR IGNORE INTO mail_renderer (name, updated_at) VALUES (?, ?);
      `
    for (let i = 0; i < rendererNames.length; i++) {
      await db.run(insertSql, [rendererNames[i], Date.now()])
    }
  } catch (error) {
    console.error('Error reloading mailer:')
    console.error(error)
  }
}
