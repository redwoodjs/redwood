#!/usr/bin/env node

// This downloads the latest release of Redwood from https://github.com/redwoodjs/create-redwood-app/
// and extracts it into the supplied directory.
//
// Usage:
// `$ yarn create redwood-app ./path/to/new-project`

import fs from 'fs'
import path from 'path'
import { spawn } from 'child_process'

import React, { useState, useRef, useEffect } from 'react'
import tmp from 'tmp'
import decompress from 'decompress'
import axios from 'axios'
import { render, Box, Text, Color } from 'ink'
import parse from 'yargs-parser'

const RELEASE_URL =
  'https://api.github.com/repos/redwoodjs/create-redwood-app/releases'

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

// Gets the latest releases' zip file from GitHub's API.
const latestReleaseZipFile = async () => {
  const response = await axios.get(RELEASE_URL)
  return response.data[0].zipball_url
}

// turns command line args like:
//
//   generate sdl contact--force
//
// into:
//
//   [['generate', 'sdl', 'contact'], { force: true }]
export const parseArgs = () => {
  const parsed = parse(process.argv.slice(2))
  const { _: positional, ...flags } = parsed

  return [positional, flags]
}

export const CreateNewApp = ({ args }) => {
  const targetDir = args?.[0]?.[0]
  const [messages, setMessages] = useState([])
  // TODO: Rewrite this to just use a component. Testing these hooks are impossible.
  // Swimming against the tide: https://overreacted.io/a-complete-guide-to-useeffect/#swimming-against-the-tide
  const latestMessages = useRef(messages)
  const setNewMessage = (newMessage) => {
    latestMessages.current = [...latestMessages.current, newMessage]
    setMessages(latestMessages.current)
  }

  useEffect(() => {
    const createApp = async () => {
      // Attempt to create the new project directory, but abort if it already exists.
      const newAppDir = path.resolve(process.cwd(), targetDir)
      if (fs.existsSync(newAppDir)) {
        setNewMessage(
          <Color red>
            We can't continue because "{newAppDir}" already exists
          </Color>
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

      // Download the latest release of `create-redwood-app` from GitHub.
      const tmpDownloadPath = tmp.tmpNameSync({
        prefix: 'redwood',
        postfix: '.zip',
      })
      const realeaseUrl = await latestReleaseZipFile()
      setNewMessage(
        <Text>
          Downloading <Color green>{realeaseUrl}</Color>...
        </Text>
      )
      await downloadFile(realeaseUrl, tmpDownloadPath)

      // Extract the contents of the downloaded release into our new project directory.
      setNewMessage(<Text>Extracting...</Text>)
      const files = await unzip(tmpDownloadPath, newAppDir)
      setNewMessage(
        <Text>
          Extracted {files.length} files in <Color green>{newAppDir}</Color>
        </Text>
      )

      // Run `yarn install`
      setNewMessage(<Text>Installing packages...</Text>)
      const child = spawn(`yarn install --cwd ${targetDir}`, {
        shell: true,
      })
      child.stdout.on('data', (data) => {
        setNewMessage(<Text>{data.toString().replace('\n', '')}</Text>)
      })
      child.stderr.on('data', (data) => {
        setNewMessage(<Color red>{data.toString().replace('\n', '')}</Color>)
      })
    }

    if (targetDir) {
      createApp()
    }
  }, [targetDir])

  if (!targetDir) {
    return (
      <Color red>Usage `yarn create redwood-app ./path/to/new-project`</Color>
    )
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

if (process.env.NODE_ENV !== 'test') {
  render(<CreateNewApp args={parseArgs()} />)
}
