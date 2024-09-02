# Uploads & Storage

Getting started with file uploads can open up a world of possibilities for your application. Whether you're enhancing user profiles with custom avatars, allowing document sharing, or enabling image galleries - Redwood has an integrated way of uploading files and storing them.

There are two parts to this:

1. Setting up the frontend and GraphQL schema to send and receive files - Uploads
2. Manipulate the data inside services, and pass it to Prisma, for persistence - Storage

We can roughly breakdown the flow as follows

![Redwood Uploads Flow Diagram](/img/uploads/uploads-flow.png)

## Uploading Files

### 1. Setting up the File scalar

Before we start sending files via GraphQL we need to tell Redwood how to handle them. Redwood and GraphQL Yoga are pre-configured to handle the `File` scalar.

In your mutations, use the `File` scalar for the fields where you are submitting an upload

```graphql title="api/src/graphql/profiles.sdl.ts"
input UpdateProfileInput {
  id: Int
  firstName: String
  # ...other fields
  // highlight-next-line
  avatar: File
}
```

You're now ready to receive files!

### 2. UI

Let's setup a basic form to add avatar images to your profile.

Assuming you've built a [Form](forms.md) for profile

```tsx title="web/src/components/ProfileForm.tsx"
// highlight-next-line
import { FileField, TextField, FieldError } from '@redwoodjs/forms'

export const ProfileForm = ({ onSubmit }) => {
  return {
    <Form onSubmit={onSubmit}>
      <div>
        <Label name="firstName" /*...*/ >
          First name
        </Label>
        <TextField name="firstName" /*...*/ />
        <FieldError name="firstName"  />
        <Label name="lastName" /*...*/ >
          Last name
        </Label>
        <TextField name="lastName" /*...*/ />
        <FieldError name="lastName"  />
      </div>
      // highlight-next-line
      <FileField name="avatar" /*...*/ />
    </Form>
  }
}
```

A `FileField` is just a standard `<input type="file">` - that's integrated with your Form context - it just makes it easier to extract the data for submission.

Now we need to send the file as a mutation!

```tsx title="web/src/components/EditProfile.tsx"
import { useMutation } from '@redwoodjs/web'

const UPDATE_PROFILE_MUTATION = gql`
  // This is the Input type we setup with File earlier! 
  //  highlight-next-line
  mutation UpdateProfileMutation($input: UpdateProfileInput!) {
    updateProfile(input: $input) {
      firstName
      lastName
      avatar
    }
  }
`

const EditProfile = ({ profile }) => {
  const [updateProfile, { loading, error }] = useMutation(
    UPDATE_PROFILE_MUTATION,
    {
      /*..*/
    }
  )

  const onSave = (formData: UpdateProfileInput) => {
    // We have to extract the first file from the input

    const input = {
      ...formData,
      // highlight-next-line
      avatar: formData.avatar?.[0], // FileField returns an array, we want the first and only file
    }

    updateProfile({ variables: { input } })
  }

  return (
    <ProfileForm
      profile={profile}
      onSave={onSave}
      error={error}
      loading={loading}
    />
  )
}
```

When the form is submitted, we process the data to ensure the avatar field contains a single file instead of an array (because that's how we setup the UpdateProfileInput). The onSave function then calls the updateProfile mutation. The mutation automatically handles the file upload because we've set up the File scalar and configured our backend to process file inputs.

Try uploading your avatar photo now, and if you log the `avatar` field in your service:

```ts title="api/src/services/profile.ts"
export const updateProfile = async ({ id, input }) => {
  console.log(input.avatar)
  // File {
  //   filename: 'profile-picture.jpg',
  //   mimetype: 'image/jpeg',
  //   createReadStream: [Function: createReadStream]
  //  ...
  // }

  // Example without the built-in helpers and processors
  await fs.writeFile('/test/profile.jpg', Buffer.from(await input.avatar.arrayBuffer()))

```

You'll see that you are receiving an instance of [File](https://developer.mozilla.org/en-US/docs/Web/API/File).

That's part 1 done - you can receive uploaded files. In the next steps, we'll talk about some tooling and a Prisma client extension that Redwood gives you, to help you persist and manage your uploads.

<details>
<summary>**What's happening behind the scenes?**</summary>

Once you send the request, and open up your Network Inspect Panel, you'll notice that the graphql request looks slightly different - it has a different Content-Type (instead of the regular `application/json`).

That's because when you send a [File](https://developer.mozilla.org/en-US/docs/Web/API/File) - the Redwood Apollo client will switch the request to a multipart form request, using [GraphQL Multipart Request Spec](https://github.com/jaydenseric/graphql-multipart-request-spec). This is the case whether you send a `File`, `FileList` or `Blob` (which is a less specialised File).

On the backend, GraphQL Yoga is pre-configured to handle multipart form requests, _as long as_ you specify the `File` scalar in your SDL.

</details>

## Storage

### Prisma schema configuration

Great now you can receive Files from GraphQL - but how do you go about saving them, and tracking them in your database?

In your Prisma schema, the `avatar` field should be defined as a string:

```prisma title="api/db/schema.prisma"
model Profile {
  id: Int
  // ... other fields
  // highlight-next-line
  avatar String?
}
```

This is because Prisma doesn't have a native File type. Instead, we store the file path or URL as a string in the database. The actual file processing and storage will be handled in your service layer, and pass the path to Prisma to save.

### Setting up Storage savers and Prisma extension

To make it easier (and more consistent) dealing with file uploads, Redwood gives you a standardized way of saving your uploads (i.e. write to storage) and a prisma extension that will handle deletion and updates automatically for you. The rest of the doc assumes you are running a "Serverful" configuration for your deployments, as it involves the file system.

Let's first run the setup command:

```shell
yarn rw setup uploads
```

In

```ts title="api/src/lib/uploads.ts"
import { UploadsConfig, setupStorage } from '@redwoodjs/storage'
import { FileSystemStorage } from '@redwoodjs/storage/FileSystemStorage'
import { UrlSigner } from '@redwoodjs/storage/signedUrl'

// ⭐ (1)
const uploadConfig: UploadsConfig = {
  profile: {
    fields: ['avatar'], // 👈 the fields that will contain your File
  },
}

// ⭐ (2)
export const fsStorage = new FileSystemStorage({
  baseDir: './uploads',
})

// ⭐ (3) Optional
export const urlSigner = new UrlSigner({
  secret: process.env.UPLOADS_SECRET,
  endpoint: '/signedUrl',
})

// ⭐ (4)
const { saveFiles, storagePrismaExtension } = setupStorage({
  uploadsConfig,
  storageAdapter: fsStorage,
  urlSigner,
})

export { saveFiles, storagePrismaExtension }
```

Let's break down the key components of this configuration:

**1. Upload Configuration**
This is where you configure the fields that will receive uploads. In our case, it's the profile.avatar field.

The shape of `UploadsConfig` looks like this:

```
[prismaModel] : {
   fields: ['modelField1']
 }
```

**2. Storage Adapter**
We create a storage adapter, in this case `FileSystemStorage` - that will save your uploads to the `./uploads` folder.

This just sets the base path, and the actual filenames and folders are determined by processors, but can be overridden!

**3. Url Signer instance**
This is an optional class that will help you generate signed urls for your files, so you can limit access to these files.

**4. Grab your utilities**
Get your utilities, and export them from this file to be used elsewhere.

- `saveFiles` - object containing functions to save File objects to storage, and return a path.
  For example:

```
saveFiles.forProfile(gqlInput)
```

We'll be using these in services.

- `prismaExtension` - The prisma client extension we'll use in `api/src/lib/db.ts` to automatically handle updates, deletion of uploaded files (including when the prisma operation fails). It also configures [Result extensions](https://www.prisma.io/docs/orm/prisma-client/client-extensions/result), to give you utilities like `profile.withSignedUrl()`.

### Attaching the Prisma extension

Now we need to extend our db client in `api/src/lib/db.ts` to use the configured prisma client.

```ts title="api/src/lib/db.ts"
import { PrismaClient } from '@prisma/client'

import { emitLogLevels, handlePrismaLogging } from '@redwoodjs/api/logger'

import { logger } from './logger'
// highlight-next-line
import { storagePrismaExtension } from './uploads'

// 👇 Notice here we create prisma client, and don't export it yet
export const prismaClient = new PrismaClient({
  log: emitLogLevels(['info', 'warn', 'error']),
})

handlePrismaLogging({
  db: prismaClient,
  logger,
  logLevels: ['info', 'warn', 'error'],
})

// 👇 Export db after adding uploads extension
// highlight-next-line
export const db = prismaClient.$extends(storagePrismaExtension)
```

The `$extends` method is used to extend the functionality of your Prisma client by adding -[Query extensions](https://www.prisma.io/docs/orm/prisma-client/client-extensions/query): which will intercept your `create`, `update`, `delete` operations
and

- [Result extension](https://www.prisma.io/docs/orm/prisma-client/client-extensions/result) for uploads - which gives you helper methods on the result of your prisma query

<details>
<summary>
__Why Export This Way__ 
</summary>

The `$extends` method returns a new instance of the Prisma client with the extensions applied. By exporting this new instance as db, you ensure that any additional functionality provided by the uploads extension is available throughout your application, without needing to change where you import. Note one of the [limitations](https://www.prisma.io/docs/orm/prisma-client/client-extensions#limitations) of using extensions is you have to use `$on` on your prisma client (as we do in handlePrismaLogging), it needs to happen before you use `$extends`

</details>

What this configures is:

**A) CRUD operations**
No need to do anything here, but you have to use processors to supply Prisma with data in the correct format.

What this will ensure is:

- when the record is deleted, the associated upload is removed from storage
- when a record is updated, the associated upload file is also replaced

...and negative cases such as:

- saved uploads are removed if creation fails
- saved uploads are removed if update fails (while keeping the original)

**B) Result extensions**

```ts title="api/src/services/profiles/profiles.ts"
export const profile = async ({ id }) => {
  // 👇 await the result from your prisma query
  const profile = await db.profile.findUnique({
    where: { id },
  })

  // Convert the avatar field (which was persisted as a path) to data uri string
  // highlight-next-line
  return profile?.withDataUri()
}
```

:::tip
It's very important to note limitations around what Prisma extensions can do:

**a) The CRUD operations will not run on nested read and write operations** <br/>
For example:

```js
const savedFiles = saveFile.inList(input.files)

db.folder.update({
  data: {
    ...input,
    files: {
      // highlight-start
      createMany: {
        data: savedFiles, // if the createMany fails, the saved files will _not_ be deleted
      },
      // highlight-end
    },
  },
  where: { id },
})
```

**b) Result extensions are not available on relations.**

You can often rewrite the query in a different way though. For example, when looking up files :

```ts
const filesViaRelation = await db.folder
  .findUnique({ where: { id: root?.id } })
  .files()

const filesWhereQuery = await db.file.findMany({
  where: {
    folderId: root?.id,
  },
})

// 🛑 Will not work, because files accessed via relation
// highlight-next-line
return filesViaRelation.map((file) => file.withSignedUrl())

// ✅ OK, because direct lookup
// highlight-next-line
return filesWhereQuery.map((file) => file.withSignedUrl())
```

:::

## Upload savers

You'll also need a way to actually save the incoming `File` object to a file persisted on storage. In your services, you can use the pre-configured "savers" to convert Files to strings for Prisma to save into the database. The savers, and storage adapters configured in `api/src/lib/uploads` determine where the file is saved.

```ts title="api/src/services/profiles/profiles.ts"
// highlight-next-line
import { saveFiles } from 'src/lib/uploads'

export const updateProfile: MutationResolvers['updateProfile'] = async ({
  id,
  input,
}) => {
  // highlight-next-line
  const processedInput = await saveFiles.forProfile(input)

  // input.avatar (File) becomes a string 👇
  // The configuration on where it was saved is passed when we setup uploads in src/lib/uploads.ts
  // processedInput.avatar -> '/mySavePath/profile/avatar/generatedId.jpg'

  return db.profile.update({
    data: processedInput,
    where: { id },
  })
}
```

For each of the models you configure when you setup uploads (in `UploadConfig`) - you have savers for them.

So if you passed:

```ts
const uploadConfig: UploadsConfig = {
  profile: {
    fields: ['avatar'],
  },
  anotherModel: {
    fields: ['document'],
  },
}

const { saveFiles } = setupStorage(uploadConfig)

// Available methods 👇
saveFiles.forProfile(profileGqlInput)
saveFiles.forAnotherModel(anotherModelGqlInput)

// Special case - not mapped to prisma model
saveFiles.inList(arrayOfFiles)
```

:::info
You might have already noticed that the saver functions sort-of tie your GraphQL inputs to your Prisma model.

In essence, these utility functions expect to take an object very similar to the Prisma data argument (the data you're passing to your `create`, `update`), but with File objects at fields `avatar`, and `document` instead of strings.

If your `File` is in a different key (or a key did you did not configure in the upload config), it will be ignored and left as-is.
:::

### Processing File lists

If you would like to upload FileLists (or an arrays of Files), use this special utility to save your Files to storage. This is necessary because String arrays aren't supported on databases - you probably want to save them to a different table, or specific fields.

Let's say you define in your SDL, a way to send an Array of files.

```graphql
input UpdateAlbumInput {
  name: String
  photos: [File]
}
```

You can use the file list processor like this:

```ts title="api/src/services/albums.ts"
export const updateAlbum = async ({
  id,
  input,
}) => {

  // notice we're passing in the file list, and not the input!
  // highlight-next-line
  const processedInput = await saveFiles.inList(input.photos)
  /* Returns an array like this:
  [
    '/baseStoragePath/AG1258019MAFGK.jpg',
    '/baseStoragePath/BG1059149NAKKE.jpg',
  ]
  */

  const mappedPhotos = processedInput.map((path) => ({ path }))
  /* Will make `mappedPhotos` be an array of objects like this:
   [
    { path: '/baseStoragePath/AG1258019MAFGK.jpg' },
    { path: '/baseStoragePath/BG1059149NAKKE.jpg' },
   ]
   */

  return db.album.update({
    data: {
      ...input,
      photo: {
        createMany: {
          data: mappedPhotos,
        },
      },
    },
    where: { id },
  })

```

### Customizing save file name or save path

If you'd like to customize the filename that a saver will write to you can override it when calling it. For example, you could name your files by the User's id

```ts
await saveFiles.forProfile(data, {
  // highlight-next-line
  fileName: 'profilePhoto-' + context.currentUser.id,
})

// Will save files to
// /base_path/profilePhoto-58xx4ruv41f8eit0y25.png
```

If you'd like to customize where files are saved, perhaps you want to put it in a specific folder, so you can make those files [publicly available](#making-a-folder-public), you can override the folder to use too (skipping the base path of your Storage adapter):

```ts
await saveFiles.forProfile(data, {
  fileName: 'profilePhoto-' + context.currentUser.id,
  // highlight-next-line
  path: '/public_avatar',
})

// Will save files to
// /public_avatar/profilePhoto-58xx4ruv41f8eit0y25.png
```

The extension is determined by the name of the uploaded file.

## Storage Prisma Extension

This Prisma extension is designed to handle file uploads and deletions in conjunction with database operations. The goal here is for you as the developer to not have to think too much in terms of files, rather just as Prisma operations. The extension ensures that file uploads are properly managed alongside database operations, preventing orphaned files and maintaining consistency between the database and the storage.

:::note
The extension will _only_ operate on fields and models configured in your `UploadConfig` which you configure in [`api/src/lib/uploads.{js,ts}`](#setting-up-storage-processors-and-prisma-extension).
:::

### `create` & `createMany` operations

If your create operation fails, it removes any uploaded files to avoid orphaned files (so you can retry the request)

### `update` & `updateMany` operations

1. If update operation is successful, removes the old uploaded files
2. If it fails, removes any newly uploaded files (so you can retry the request)

### `delete` operations

Removes any associated uploaded files, once delete operation completes.

### `upsert` operations

Depending on whether it's updating or creating, performs the same actions as create or update.

## Result Extensions

When you add the storage prisma extension, it also configures your prisma objects to have special helper methods.

These will only appear on fields that you configure in your `UploadConfig`.

```typescript
const profile = await db.profile.update(/*...*/)

// The result of your prisma query contains the helpers
profile?.withSignedUrl() // ✅

// Incorrect: you need to await the result of your prisma query first!
db.profile.update(/*...*/).withSignedUrl() // 🛑

// Assuming the comment model does not have an upload field
// the helper won't appear
db.comment.findMany(/*..*/).withSignedUrl() // 🛑
```

### Signed URLs

When you setup uploads, we also generate an API function (an endpoint) for you - by default at `/signedUrl`. You can use this in conjunction with the `.withSignedUrl` helper. For example:

```ts title="api/src/services/profiles.ts"
import { EXPIRES_IN } from '@redwoodjs/storage/UrlSigner'

export const profile = async ({ id }) => {
  const profile = await db.profile.findUnique({
    where: { id },
  })

  // Convert the avatar field to signed URLs
  // highlight-start
  return profile?.withSignedUrl({
    expiresIn: EXPIRES_IN.days(2),
  })
  // highlight-end
}
```

The object being returned will look like:

```ts
{
  id: 125,
  avatar: '/.redwood/functions/signedUrl?s=s1gnatur3&expiry=1725190749613&path=path.png'
}
```

This will generate a URL that will expire in 2 days (from the point of query). Let's breakdown the URL:

| URL Component                   |                                                      |
| ------------------------------- | ---------------------------------------------------- |
| `/.redwood/functions/signedUrl` | Point to the API server, and the endpoint configured |
| `s=s1gnatur3`                   | The signature that we'll validate                    |
| `expiry=1725190749613`          | Time stamp for when it expires                       |
| `path=path.png`                 | The key to look up the file on your storage          |

<details>
<summary>How the signedUrl function validates</summary>

This function is automatically generated for you, but let's take a quick look at how it works:

```ts title="api/src/functions/signedUrl/signedUrl.ts"
import type { SignatureValidationArgs } from '@redwoodjs/storage/UrlSigner'

// The urlSigner and fsStorage instances were configured when we setup uploads
// highlight-next-line
import { urlSigner, fsStorage } from 'src/lib/uploads'

export const handler = async (event) => {
  // Validate the signature using the urlSigner instance
  // highlight-next-line
  const fileToReturn = urlSigner.validateSignature(
    // Pass the params {s, path, expiry}
    // highlight-next-line
    event.queryStringParameters as SignatureValidationArgs
  )

  // Use the returned value to lookup the file in your storage
  // highlight-next-line
  const { contents, type } = await fsStorage.read(fileToReturn)

  return {
    statusCode: 200,
    headers: {
      // You also get the type from the read
      'Content-Type': type,
    },
    // Return the contents of the file
    body: contents,
  }
}
```

</details>

### Data URIs

When you have smaller files, you can choose instead to return a Base64 DataURI string that you can render directly into your html.

```ts title="api/src/services/profiles.ts"
export const profile = async ({ id }) => {
  const profile = await db.profile.findUnique({
    where: { id },
  })

  // highlight-next-line
  return profile?.withDataUri()
}
```

:::tip
The `withDataUri` extension is an `async` function. Remember to await, if you are doing additional manipulation before returning your result object from the service.
:::

## Configuring the server further

Sometimes, you may need more control over how the Redwood API server behaves. This could include customizing the body limit for requests, redirects, or implementing additional logic - that's exactly what the [Server File](server-file.md) is for!

### Making a folder public

While you can always create a function to access certain files publicly, similar to the `/signedUrl` function that gets generated for you - another way could be to configure the API server with the [fastify-static](https://github.com/fastify/fastify-static) plugin to make a specific folder publicly accessible.

```js title="api/server.js"
import path from 'path'
// highlight-next-line
import fastifyStatic from '@fastify/static'

import { createServer } from '@redwoodjs/api-server'
import { logger } from 'src/lib/logger'

async function main() {
  const server = await createServer({
    logger,
  })

  // highlight-start
  server.register(fastifyStatic, {
    root: path.join(process.cwd() + '/uploads/public_profile_photos'),
    prefix: '/public_uploads',
  })
  // highlight-end

  await server.start()
}

main()
```

Based on the above, you'll be able to access your files at:

```
http://localhost:8910/.redwood/functions/public_uploads/01J6AF89Y89WTWZF12DRC72Q2A.jpeg

OR directly

http://localhost:8911/public_uploads/01J6AF89Y89WTWZF12DRC72Q2A.jpeg

```

Where you are only exposing **part** of your uploads directory publicly

### Customizing the body limit for requests

Depending on the sizes of files you're uploading, especially in the case of multiple files, if you receive errors like this:

```json
{
  "code": "FST_ERR_CTP_BODY_TOO_LARGE",
  "error": "Payload Too Large",
  "message": "Request body is too large"
}
```

The default body size limit for the Redwood API server is 100MB (per request).

```js title="api/server.js"
import { createServer } from '@redwoodjs/api-server'

import { logger } from 'src/lib/logger'

async function main() {
  const server = await createServer({
    logger,
    fastifyServerOptions: {
      // highlight-next-line
      bodyLimit: 1024 * 1024 * 500, // 500MB
    },
  })

  await server.start()
}

main()
```
