import fs from 'fs'
import path from 'path'

import React, { useState, useRef, useEffect } from 'react'
import tmp from 'tmp'
import decompress from 'decompress'
import axios from 'axios'
import { spawn, hasYarn } from 'yarn-or-npm'
import { Box, Text, Color } from 'ink'

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
  'https://api.github.com/repos/redwoodjs/create-redwood-app/releases'

const latestReleaseZipFile = async () => {
  const response = await axios.get(RELEASE_URL)
  return response.data[0].zipball_url
}

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
        fs.mkdirSync(newHammerAppDir, { recursive: true })
        setNewMessage(
          <Text>
            Created <Color green>{newHammerAppDir}</Color>
          </Text>
        )
      }

      // Download the latest release of `create-hammer-app`
      const tmpDownloadPath = tmp.tmpNameSync({
        prefix: 'redwood',
        postfix: '.zip',
      })

      const realeaseUrl = await latestReleaseZipFile()
      setNewMessage(<Text>Downloading {realeaseUrl}...</Text>)
      await downloadFile(realeaseUrl, tmpDownloadPath)

      setNewMessage(<Text>Extracting...</Text>)
      const files = await unzip(tmpDownloadPath, newHammerAppDir)
      setNewMessage(
        <Text>
          Added {files.length} files in <Color green>{newHammerAppDir}</Color>
        </Text>
      )

      setNewMessage(<Text>Installing packages...</Text>)
      const prefixFlag = hasYarn() ? '--cwd' : '--prefix'
      spawn.sync(['install', prefixFlag, newHammerAppDir], { stdio: 'inherit' })
    }

    if (targetDir) {
      createHammerApp()
    }
  }, [targetDir])

  if (!targetDir) {
    return <Color red>Usage `redwood new ./path/to/new-project`</Color>
  }

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
  description: 'Create a new redwood app',
}

export default New
