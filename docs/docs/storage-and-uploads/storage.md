# Storage and Uploads

## Storage

RedwoodJS offers a flexible storage system that's got your back, whether you're working with local files or cloud storage like AWS S3. The best part? Switching between storage options is a breeze, thanks to a consistent API across all adapters.

### Key Features

- **Local filesystem support**: Perfect for development and simple deployments
- **S3-compatible storage**: Seamlessly integrate with popular cloud storage solutions
- **Unified API**: Write your code once, deploy anywhere without changing your storage logic
- **In-memory adapter**: Great for testing and ephemeral storage needs

With RedwoodJS storage, you can focus on building your app while we handle the nitty-gritty of file management. Let's dive in and see how easy it is to get started!

## Setup

To set up storage in your RedwoodJS app, simply run the setup command:

```bash
yarn rw setup storage
```

1.This will install the core storage package and the local filesystem adapter.

```bash
yarn add @redwoodjs/storage-core @redwoodjs/storage-adapter-filesystem
```

2. The `storage.ts` file in your `api/src/lib` directory will be updated with a default configuration using the local filesystem adapter like this:

```ts
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
```

3. Add the following environment variables to your `.env` file:

```
STORAGE_SIGNING_BASE_URL=http://localhost:8911/storage
STORAGE_SIGNING_SECRET=super-secret
```

## Adapters

RedwoodJS storage supports multiple adapters, allowing you to switch between different storage backends easily.

### Local Filesystem

The FileSystemAdapter is perfect for local development and simple deployments. It stores files on your local filesystem.

Usage:

```ts
import { FileSystemAdapter } from '@redwoodjs/storage-adapter-filesystem'
import { StorageSelfSigner } from '@redwoodjs/storage-core'

const yourSigner = new StorageSelfSigner({
  secret: process.env.STORAGE_SIGNING_SECRET,
})

const localAdapter = new FileSystemAdapter({
  root: '/path/to/storage',
  signing: {
    signer: yourSigner,
    baseUrl: 'http://your-base-url',
  },
})
```

This adapter is already configured in the default `storage.ts` file.

You can customize the root directory and signing configuration as needed.

For exmaple, if you want to store files in a location called `.storage-special`, you can do so by adding a new adapter.

### AWS S3 or Tigris

For production environments, you might want to use cloud storage solutions like AWS S3 or Fly Tigris. RedwoodJS provides an S3-compatible adapter.

To use the S3 adapter:

1. Install the required package:

```bash
yarn workspace api add @redwoodjs/storage-adapter-s3
```

2. Update your `storage.ts` file to include the S3 adapter:

```ts
import { S3Adapter } from '@redwoodjs/storage-adapter-s3'

// ... existing code ...

export const storage = new StorageManager({
  adapters: {
    // ... existing adapters ...
    s3: new S3Adapter({
      bucket: process.env.AWS_BUCKET,
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    }),
  },
  // ... rest of the configuration ...
})
```

### The Default Adapter

### Using Different Adapters

### Environment-Specific Adapters

## Retrieving Files

To retrieve files from storage, use the readData, readFile, or readStream methods:

```ts
const buffer = await storage.readData('file-reference')
const file = await storage.readFile('file-reference')
const stream = await storage.readStream('file-reference')
```

### Temporary URLs

You can generate signed URLs for temporary access to files:

```ts
const signedUrl = await storage.getSignedUrl('file-reference')
```

## Deleting Files

To delete a file from storage:

```ts
await storage.delete('file-reference')
```

## Storing Files

To store files, use the writeData, writeFile, or writeStream methods:

```ts
await storage.writeData('file-reference', data)
await storage.writeFile('file-reference', file)
await storage.writeStream('file-reference', stream)
```

When should you use which method?

When in doubt, use `writeFile`. It's the simplest method and works in most cases.

But sometimes you might want to store binary data or you don't have a file instance yet. For that, use `writeData`.

And if you need to stream a file to storage, use `writeStream` but you'll need a stream like `fs.createReadStream` or with a File object like `File.stream()`.

## Streaming Files

You can stream files directly from storage:

```ts
const stream = await storage.stream('file-reference')
```

## Fetching Files in your Pages and Components

```graphql
type Profile {
  id: String!
  createdAt: DateTime!
  updatedAt: DateTime!
  firstName: String!
  lastName: String!
  avatar: String! @withStorage
}
```

### withStorage Directive

```graphql
@withStorage(format: SIGNED_URL | DATA_URI)
@withStorage(adapter: FS | S3)
@withStorage(adapter: FS | S3, format: SIGNED_URL | DATA_URI)
```

- SIGNED_URL
- DATA_URI

### Storage Function

- verifies SignedUrl
