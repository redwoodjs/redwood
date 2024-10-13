# Storage and Uploads

## Uploads

In web applications, one of the most common use-cases for storing files is storing user uploaded files such as photos and documents. RedwoodJS makes it very easy to handle file uploads and then store them using `storage` and the `writeFile` or `writeData` methods of one of its adapters.

While there are multiple ways to handle uploads, RedwoodJS comes with a built-in `File` scalar type for GraphQL that makes it easy to work with file uploads.

Because RedwoodJS uses [GraphQL Yoga File Uploads](https://the-guild.dev/graphql/yoga-server/docs/features/file-uploads), you can upload files and consume the binary data inside your services easily.

For example, an input type for creating a profile might look like this:

```graphql
input CreateProfileInput {
  firstName: String!
  lastName: String!
  avatar: [File!]!
}
```

In your service, you can access the uploaded files like this:

```tsx
export const createProfile: MutationResolvers['createProfile'] = async ({
  input,
}) => {
  const { avatar, ...rest } = input

  // note that web browsers send arrays for a file field
  // so you'll need to access the first element
  const file = avatar[0]

  // now you can use the file to get metadata
  const { name, size, type } = file

  // or store it using RedwoodJS storage
  await storage.writeFile(file)
}
```

## Setup

If just want to upload files, RedwoodJS doesn't require any special setup aside from adding the `File` scalar to your GraphQL schema as GraphQL Yoga will handle the rest.

However, if you want to store the files, you'll need to configure the `storage` manager as documented in the [Storage](/docs/storage-and-uploads/storage) page.

But before you do that, there are a few things you should consider -- namely, having some rules for who can upload what to your server.

In that case you will want to run:

```bash
yarn rw setup uploads
```

This will add a few new files to your project to let you configure upload validation.

## Considerations

- public vs private
- permissions
- validation
