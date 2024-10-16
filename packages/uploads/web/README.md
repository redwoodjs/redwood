# Uploads Web

The file upload solution for RedwoodJS.

## Features

RedwoodJS Upload handles the complexities of file uploads by:

- providing a component for file uploads
- provide a useUploadsMutation hook for uploading files with Upload Token validation of file types, sizes, etc.

## Using the RedwoodUploadsComponent

The RedwoodUploadsComponent is a versatile file upload component for RedwoodJS applications. It provides an easy-to-use interface for handling file uploads with customizable options and preview capabilities.

### Basic Usage:

Import the component:

```ts
import { RedwoodUploadsComponent } from '@redwoodjs/uploads-web'
```

Use the component in your JSX:

```tsx
<RedwoodUploadsComponent
  name="myUpload"
  fileConstraints={{
    accept: { 'image/': ['.jpeg', '.jpg', '.png'] },
    maxFiles: 5,
    maxSize: 5 * 1024 * 1024, // 5MB
  }}
  setFiles={(files) => handleFiles(files)}
/>
```

### Configuration Options:

The RedwoodUploadsComponent accepts several props to customize its behavior:

- name: A string to identify the upload field (optional, default: 'uploads')
- className: Custom CSS class for styling
- fileConstraints: An object containing upload constraints:
  - accept: File types to accept (e.g., { 'image/': ['.jpeg', '.jpg', '.png'] })
  - maxFiles: Maximum number of files allowed
  - minSize: Minimum file size in bytes
  - maxSize: Maximum file size in bytes
  - multiple: Allow multiple file uploads
- children: Custom content to render inside the dropzone
- dropzoneContent: Custom content for the dropzone area
- messageContent: Custom message to display in the dropzone
- setFiles: Callback function to handle accepted files
- onResetFiles: Callback to provide a function for resetting files
- allowPaste: Enable pasting files (default: false)

Additional props from react-dropzone can also be passed to further customize the dropzone behavior.

### Using Custom Preview Components:

The RedwoodUploadsComponent allows you to use custom components for previewing accepted files and rejected files. This is done by passing these components as children to the RedwoodUploadsComponent.

1. Import the custom preview components:
   import { PreviewFiles, PreviewFileRejections } from '@redwoodjs/uploads-web'
1. Use them within the RedwoodUploadsComponent:

```tsx
<RedwoodUploadsComponent {...props}>
  <PreviewFiles />
  <PreviewFileRejections />
</RedwoodUploadsComponent>
```

### PreviewFiles Component:

This component displays a list of accepted files, including image previews for image files. It uses the useRedwoodUploadsContext hook to access the list of accepted files.

### PreviewFileRejections Component:

This component shows a list of rejected files along with the reasons for rejection. It also uses the useRedwoodUploadsContext hook to access the list of file rejections.

### Creating Custom Preview Components:

You can create your own custom preview components by using the useRedwoodUploadsContext hook. This hook provides access to the following properties:
acceptedFiles: Array of accepted File objects
fileRejections: Array of FileRejection objects
open: Function to open the file dialog
isDragActive, isDragReject, isFocused, isDragAccept: Dropzone state indicators
Example of a custom preview component:

```tsx
import React from 'react'
import { useRedwoodUploadsContext } from '@redwoodjs/uploads-web'
const MyCustomPreview = () => {
  const { acceptedFiles } = useRedwoodUploadsContext()
  return (
    <div>
      <h3>Accepted Files:</h3>
      <ul>
        {acceptedFiles.map((file) => (
          <li key={file.name}>
            {file.name} - {file.size} bytes
          </li>
        ))}
      </ul>
    </div>
  )
}
```

Then use it within the RedwoodUploadsComponent:

```tsx
<RedwoodUploadsComponent {...props}>
  <MyCustomPreview />
</RedwoodUploadsComponent>
```

By using these components and customization options, you can create a tailored file upload experience in your RedwoodJS application that meets your specific needs.
