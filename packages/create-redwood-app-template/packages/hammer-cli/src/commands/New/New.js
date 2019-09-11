import fs from 'fs'
import path from 'path'
import tmp from 'tmp'
import decompress from 'decompress'
import axios from 'axios'

import React, { useState, useRef, useEffect } from 'react'
import { Box, Text } from 'ink'

const downloadFile = async (sourceUrl, targetFile) => {
  const writer = fs.createWriteStream(targetFile)

  const response = await axios.get(sourceUrl, {
    responseType: 'stream',
  })

  response.data.pipe(writer)

  return new Promise((resolve, reject) => {
    writer.on('finish', resolve)
    writer.on('error', reject)
  })
}

const unzip = async (path, targetDir) =>
  await decompress(path, targetDir, { strip: 1 })

const RELEASE_URL =
  'https://github.com/hammerframework/create-hammer-app/archive/v0.0.1-alpha.7.zip'

// TODO: Grab the latest release URL from GitHub
const New = ({ args: [_commandName, targetDir] }) => {
  const [messages, setMessages] = useState([])
  // Swimming against the tide: https://overreacted.io/a-complete-guide-to-useeffect/#swimming-against-the-tide
  const latestMessages = useRef(messages)

  const setNewMessage = (newMessage) => {
    latestMessages.current = [...latestMessages.current, newMessage]
    setMessages(latestMessages.current)
  }

  useEffect(() => {
    const createHammerApp = async () => {
      // Create the project directory
      const newHammerAppDir = path.resolve(process.cwd(), targetDir)
      if (fs.existsSync(newHammerAppDir)) {
        // TODO: Ask the user if they want to proceed, make it look like
        // an error?
        setNewMessage(
          `🖐  We can't continue because "${newHammerAppDir}" already exists`
        )
        return
      } else {
        fs.mkdirSync(newHammerAppDir)
        setNewMessage(`Created ${newHammerAppDir}`)
      }

      // Download the latest release of `create-hammer-app`
      const tmpDownloadPath = tmp.tmpNameSync({
        prefix: 'hammer',
        postfix: '.zip',
      })
      setNewMessage(`Downloading ${RELEASE_URL}...`)
      await downloadFile(RELEASE_URL, tmpDownloadPath)

      setNewMessage(`Extracting ${tmpDownloadPath}...`)
      const files = await unzip(tmpDownloadPath, newHammerAppDir)
      setNewMessage(`Extracted ${files.length} files to ${newHammerAppDir}!`)
    }

    createHammerApp()
  }, [])

  return (
    <Box flexDirection="column">
      {messages.map((message, index) => (
        <Box key={'message' + index}>
          <Text>{message}</Text>
        </Box>
      ))}
    </Box>
  )
}

export const commandProps = {
  name: 'new',
  alias: 'n',
  description: 'Create a new hammer app',
}

export default New
