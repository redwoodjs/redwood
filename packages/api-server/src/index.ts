#!/usr/bin/env node
import { rmSync } from 'fs'
import path from 'path'

import dotenv from 'dotenv-defaults'
import glob from 'glob'
import nodemon from 'nodemon'
import yargs from 'yargs'

import { getPaths } from '@redwoodjs/internal'

import { server, setLambdaFunctions } from './http'
import { requestHandler } from './requestHandlers/awsLambda'

const { port, watch, socket } = yargs
  .option('port', { default: 8911, type: 'number', alias: 'p' })
  .option('socket', { type: 'string' })
  .option('functions', {
    alias: 'f',
    required: true,
    type: 'string',
    desc: 'The path to your Serverless Functions',
    deprecate: true,
  })
  .option('watch', {
    default: false,
    type: 'boolean',
    alias: 'w',
    description:
      'Watch your serverless functions for changes. Restarting the web-server.',
  }).argv

const rwjsPaths = getPaths()

const serverlessFunctions = glob.sync('src/functions/*.{ts,js}', {
  cwd: rwjsPaths.api.base,
  ignore: ['**/*.test.ts', '**/__fixtures__/**'],
})

const app = server({ requestHandler })
process.on('exit', () => {
  app.close(() => {
    if (socket) {
      rmSync(socket)
    }
  })
})

if (!watch) {
  app.listen(socket || port, () => {
    if (socket) {
      console.log(socket)
    } else {
      console.log(`http://localhost:${port}`)
    }
    setLambdaFunctions(serverlessFunctions)
  })
} else {
  dotenv.config({
    path: rwjsPaths.base,
    defaults: path.join(rwjsPaths.base, '.env.defaults'),
  })

  nodemon({
    verbose: true,
    watch: rwjsPaths.api.base,
    ignore: ['*.test.*', '*.scenarios.*', 'dist'],
    env: process.env,
    cwd: rwjsPaths.api.base,
    ext: 'js ts',
  })
  nodemon
    .on('start', function () {
      app.listen(socket || port, () => {
        if (socket) {
          console.log(socket)
        } else {
          console.log(`http://localhost:${port}`)
        }
        setLambdaFunctions(serverlessFunctions)
      })
    })
    .on('quit', function () {
      console.log('App has quit')
      process.exit()
    })
    .on('restart', function (files) {
      console.log('App restarted due to: ', files)
    })
    .on('stderr', console.error)
    .on('stdout', console.log)
}
