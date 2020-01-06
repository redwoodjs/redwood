// The `redwood new` command creates a new Redwood application. It downloads the
// latest release at https://github.com/redwoodjs/create-redwood-app/ and extracts
// it into the specified directory.
//
// Usage:
// $ redwood new ./path/to/new-project

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

const New = ({ args: [_commandName, targetDir] }) => {
  const [messages, setMessages] = useState([])
  // Swimming against the tide: https://overreacted.io/a-complete-guide-to-useeffect/#swimming-against-the-tide
  const latestMessages = useRef(messages)

  const setNewMessage = (newMessage) => {
    latestMessages.current = [...latestMessages.current, newMessage]
    setMessages(latestMessages.current)
  }

  useEffect(() => {
    const createApp = async () => {
      // First check and create the new project directory
      const newAppDir = path.resolve(process.cwd(), targetDir)
      if (fs.existsSync(newAppDir)) {
        setNewMessage(
          `🖐  We can't continue because "${newAppDir}" already exists`
        )
        return
      } else {
        fs.mkdirSync(newAppDir, { recursive: true })
        setNewMessage(
          <Text>
            Created <Color green>{newAppDir}</Color>
          </Text>
        )
      }

      // Then download the latest release of `create-redwood-app` and extract
      // it to the user's desired location
      const tmpDownloadPath = tmp.tmpNameSync({
        prefix: 'redwood',
        postfix: '.zip',
      })

      const realeaseUrl = await latestReleaseZipFile()
      setNewMessage(<Text>Downloading {realeaseUrl}...</Text>)
      await downloadFile(realeaseUrl, tmpDownloadPath)

      setNewMessage(<Text>Extracting...</Text>)
      const files = await unzip(tmpDownloadPath, newAppDir)
      setNewMessage(
        <Text>
          Added {files.length} files in <Color green>{newAppDir}</Color>
        </Text>
      )

      // TODO: Remove this since we only use `yarn`
      setNewMessage(<Text>Installing packages...</Text>)
      const prefixFlag = hasYarn() ? '--cwd' : '--prefix'
      spawn.sync(['install', prefixFlag, newAppDir], { stdio: 'inherit' })
    }

    if (targetDir) {
      createApp()
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
