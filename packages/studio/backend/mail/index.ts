import { simpleParser as simpleMailParser } from 'mailparser'
import { SMTPServer } from 'smtp-server'

import { getDatabase } from '../database'

let smtpServer: SMTPServer

async function insertMailIntoDatabase(mail: any, envelope: any) {
  const db = await getDatabase()
  const sql = `
    INSERT INTO mail (data, envelope) VALUES (?, ?);
  `
  await db.run(sql, [JSON.stringify(mail), JSON.stringify(envelope)])
}

export async function startServer() {
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
