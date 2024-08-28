# Uploads

Getting started with file uploads can open up a world of possibilities for your application. Whether you're enhancing user profiles with custom avatars, allowing document sharing, or enabling image galleries - Redwood enables an integrated way of managing your uploads.

As with sending and manipulating other types of data, on Redwood this involves configuring and implementing three parts:

1. The frontend to send to the data
2. The GraphQL API to validate and receive the data into services

... and

3. Manipulate the data inside services, and pass it to Prisma, for persistence

Visually we can roughly breakdown the flow as follows

![Redwood Uploads Flow Diagram](/img/uploads/uploads-flow.png)


## Sending Files from the front end

### 1. Setting up the File scalar

Before we start sending files via GraphQL we need to tell Redwood how to handle them.

While Redwood and GraphQL Yoga are pre-configured to handle files, you need to explicitly define the `File` scalar in your SDL (Schema Definition Language) file. Add the following line to your `profiles.sdl.ts` (or any of your sdl files):

```graphql title="api/src/graphql/profiles.sdl.ts"
scalar File
```

When defining fields that will handle file uploads, use the `File` scalar type.

In your mutations, use the `File` scalar type for the fields where you are submitting an upload

```graphql title="api/src/graphql/profiles.sdl.ts"
scalar File

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
      avatar: formData.avatar?.[0], // FileField returns an array, we want the first file
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

That's parts parts 1 & 2 done - you can receive uploaded files. In the next steps, we'll talk about some tooling and a Prisma client extension that Redwood gives you, to help you persist and manage your uploads.

<details>
<summary>**What's happening behind the scenes?**</summary>

Once you send the request, and open up your Network Inspect Panel, you'll notice that the graphql request looks slightly different - it has a different Content-Type (instead of the regular `application/json`).

That's because when you send a [File](https://developer.mozilla.org/en-US/docs/Web/API/File) - the Redwood Apollo client will switch the request to a multipart form request, using [GraphQL Multipart Request Spec](https://github.com/jaydenseric/graphql-multipart-request-spec). This is the case whether you send a `File`, `FileList` or `Blob` (which is a less specialised File).

On the backend, GraphQL Yoga is pre-configured to handle multipart form requests, _as long as_ you specify the `File` scalar in your SDL.

</details>

## Configuring the API side

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

### Setting up Uploads processors and Prisma extension

To make it easier (and more consistent) dealing with file uploads, Redwood gives you a standardized way of "processing" your uploads (i.e. save to storage) and a prisma extension that will handle deletion and updates automatically for you. The rest of the doc assumes you are running a "Serverful" configuration for your deployments, as it involves the file system.

Let's first run the setup command:

```shell
yarn rw setup uploads
```

In

```ts title="api/src/lib/uploads.ts"
import { UploadsConfig, setupUploads } from '@redwoodjs/uploads'
import { FileSystemStorage } from '@redwoodjs/uploads/FileSystemStorage'
import { UrlSigner } from '@redwoodjs/uploads/signedUrl'

// ⭐ (1)
const uploadConfig: UploadsConfig = {
  profile: {
    fields: ['avatar'], // 👈 the fields that will contain your File
  },
}

// ⭐ (2)
export const storage = new FileSystemStorage({
  baseDir: './uploads',
})

// ⭐ (3) Optional
export const urlSigner = new UrlSigner({
  secret: process.env.UPLOADS_SECRET,
  endpoint: '/signedUrl',
})

// ⭐ (4)
const { uploadsProcessors, prismaExtension } = setupUploads(
  uploadConfig,
  storage,
  urlSigner
)

export { uploadsProcessors, prismaExtension }
```

Let's break down the key components of this configuration:

**1. Upload Configuration**
This is where you configure the fields that will receive uploads. In our case, it's the profile.avatar field.

The shape of the object looks like this:

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

- `uploadsProcessors` - object containing functions to convert your GraphQL inputs with Files to path strings, after saving to storage.
  For example:

```
uploadsProcessors.processProfileUploads(gqlInput)
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
import { prismaExtension } from './uploads'

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
export const db = prismaClient.$extends(prismaExtension)
```

The `$extends` method is used to extend the functionality of your Prisma client by adding 
-[Query extensions](https://www.prisma.io/docs/orm/prisma-client/client-extensions/query): which will intercept your `create`, `update`, `delete` operations
and 
- [Result extension]([Link](https://www.prisma.io/docs/orm/prisma-client/client-extensions/query)) for uploads - which gives you helper methods on the result of your prisma query

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
- processed uploads are removed if creation fails
- processed uploads are removed if update fails (while keeping the original)


**B) Result extensions**

```ts title="api/src/services/profiles/profiles.ts"
export const profile: QueryResolvers['profile'] = async ({ id }) => {
  // 👇 await the result from your prisma query
  const profile = await db.profile.findUnique({
    where: { id },
  })

  // Convert the avatar field (which is a path) to data uri string
  // Note that you still need to add a api endpoint to handle these signed urls
  return profile?.withDataUri()
}
```

:::tip
It's important to note limitations around what Prisma extensions can do:

a) The CRUD operations will not run on nested read and write operations <br/>
b) Result extensions are not available on relations

:::

## Upload processors

You'll also need a way to convert the incoming `File` to a path on disk. In your services, you can use the preconfigured "processors" to convert Files to strings for Prisma to save into the database. The processors, and storage adapters configured in `api/src/lib/uploads` determine where the file is saved.

```ts title="api/src/services/profiles/profiles.ts"
// highlight-next-line
import { uploadsProcessors } from 'src/lib/uploads'

export const updateProfile: MutationResolvers['updateProfile'] = async ({
  id,
  input,
}) => {
  // highlight-next-line
  const processedInput = await uploadsProcessors.processProfileUploads(input)

  // input.avatar (File) becomes a string 👇
  // The configuration on where it was saved is passed when we setup uploads in src/lib/uploads.ts
  // processedInput.avatar -> '/mySavePath/profile/avatar/generatedId.jpg'

  return db.profile.update({
    data: processedInput,
    where: { id },
  })
}
```

For each of the models you configure when you setup uploads (in `UploadConfig`) - you have processors for them.

So if you passed:

```ts
const uploadConfig: UploadsConfig = {
  profile: {
    fields: ['avatar'],
  },
  anotherModel: {
    fields: ['signedDocument'],
  },
}

const { uploadProcessors } = setupUploads(uploadConfig)

// Available methods 👇
uploadProcessors.processProfileUploads(profileGqlInput)
uploadProcessors.processAnotherModelUploads(anotherModelGqlInput)

uploadProcessors.processFileList(arrayOfFiles)
```

:::info
You might have already noticed that the processors sort-of tie your GraphQL inputs to your Prisma model.

In essence, these utility functions expect to take an object very similar to the Prisma data argument (the data you're passing to your `create`, `update`), but with File objects at fields `avatar`, and `signedDocument` instead of strings. 

If your `File` is in a different key (or a key did you did not configure in the upload config), it will be ignored and left as is.
:::

### Processing File lists

If you would like to upload FileLists (or an arrays of Files), use this special processor to save your Files to path strings. This is necessary because String arrays aren't supported on databases - you probably want to save them to a different table, or specific fields.

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
  const processedInput = await uploadProcessors.processFileList(input.photos)
  /* Returns an array like this:
  [
  '/baseStoragePath/AG1258019MAFGK.jpg',
  '/baseStoragePath/BG1059149NAKKE.jpg',
  ]
  */

  const mappedPhotos = processedInput.map((path) => ({ path }))

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

### Customizing save file name

If you'd like to customize the filename that a processor will save to you can override it when calling it. For example, you could name your files by the User's id

```ts 
await processors.processProfileUploads(data, {
  fileName: 'profilePhoto-' + context.currentUser.id,
})

// Will save files to
// /base_path/profilePhoto-58xx4ruv41f8eit0y25.png
```

The extension is determined by the name of the uploaded file. 

