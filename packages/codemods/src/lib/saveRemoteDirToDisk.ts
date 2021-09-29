/**
 * For the addDirectives codemod.
 * This is still a @todo; this code was just copy-pasted as a start.
 */
import fs from 'fs'
import https from 'https'

interface SaveRemoteDirToDiskOptions {
  overwrite?: boolean
}

export const saveRemoteDirToDisk = (
  url: string,
  localPath: string,
  { overwrite = false }: SaveRemoteDirToDiskOptions
) => {
  if (!overwrite && fs.existsSync(localPath)) {
    throw new Error(`${localPath} already exists.`)
  }

  const downloadPromise = new Promise<void>((resolve, reject) =>
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(fs.createWriteStream(localPath))
        resolve()
      } else {
        reject(
          new Error(`${url} responded with status code ${response.statusCode}`)
        )
      }
    })
  )

  return downloadPromise
}
