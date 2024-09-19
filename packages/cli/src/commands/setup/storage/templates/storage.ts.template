// Setup and configuration for storage
// See: https://docs.redwoodjs.com/docs/storage

import path from 'node:path'

import { FileSystemAdapter } from '@redwoodjs/storage-adapter-filesystem'
import { StorageManager, StorageSelfSigner } from '@redwoodjs/storage-core'

const baseUrl = process.env.STORAGE_SIGNING_BASE_URL
export const signer = new StorageSelfSigner({
  secret: process.env.STORAGE_SIGNING_SECRET,
})

export const storage = new StorageManager({
  adapters: {
    local: new FileSystemAdapter({
      root: path.join(__dirname, '..', '..', '.storage'),
      signing: {
        signer,
        baseUrl,
      },
    }),
    special: new FileSystemAdapter({
      root: path.join(__dirname, '..', '..', '.storage-special'),
      signing: {
        signer,
        baseUrl,
      },
    }),
  },

  default: 'local',

  env: {
    development: 'local',
  },
})
