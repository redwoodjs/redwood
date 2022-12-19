---
description: Toast notifications with react-hot-toast
---

# Toast Notifications

Did you know that those little popup notifications that you sometimes see at the top of a page after you've performed an action are affectionately known as "toast" notifications?
Because they pop up like a piece of toast from a toaster!

![Example toast animation](https://user-images.githubusercontent.com/300/110032806-71024680-7ced-11eb-8d69-7f462929815e.gif)

Redwood supports these notifications out of the box thanks to the [react-hot-toast](https://react-hot-toast.com/) package.
We'll refer you to their [docs](https://react-hot-toast.com/docs) since they're very thorough, but here's enough to get you going.

### Add the `Toaster` Component

To render toast notifications, start by adding the `Toaster` component.
It's usually better to add it at the App or Layout-level than the Page:

```jsx title="web/src/layouts/MainLayout/MainLayout.js"
// highlight-next-line
import { Toaster } from '@redwoodjs/web/toast'

const MainLayout = ({ children }) => {
  return (
    <>
      // highlight-next-line
      <Toaster />
      <main>{children}</main>
    </>
  )
}

export default MainLayout
```

### Call the `toast` function

To render a toast notification, call the `toast` function or one of its methods:

```jsx title="web/src/components/PostForm/PostForm.js"
// highlight-next-line
import { toast } from '@redwoodjs/web/toast'

// ...

const PostForm = () => {
  const onSubmit = () => {
    try {
      {/* Code to save a record... */}
      // highlight-next-line
      toast('User created!')
    } catch (e) {
      // There's also methods for default styling:
      // highlight-next-line
      toast.error("Error creating post...")
    }
  }

  return (
    // JSX...
  )
})

export default PostForm
```
