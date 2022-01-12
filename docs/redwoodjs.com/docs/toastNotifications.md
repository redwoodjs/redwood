# Toast Notifications

> Deprecation Warning: In RedwoodJS v0.27, the custom Flash Messaging was replaced with React Hot Toast. Flash, implemented with `import { useFlash } from '@redwoodjs/web'` will be deprecated in Redwood v1. If you are currently using `<Flash />` and `useFlash`, you can update your app [via these instructions](https://community.redwoodjs.com/t/redwood-flash-is-being-replaced-with-react-hot-toast-how-to-update-your-project-v0-27-0/1921).

Did you know that those little popup notifications that you sometimes see at the top of pages after you've performed an action are affectionately known as "toast" notifications? Because they pop up like a piece of toast from a toaster!

![Example Toast Animation](https://user-images.githubusercontent.com/300/110032806-71024680-7ced-11eb-8d69-7f462929815e.gif)

Redwood supports these notifications out of the box thanks to the [react-hot-toast](https://react-hot-toast.com/) package.

## Usage

This doc will not cover everything you can do with toasts, and the [react-hot-toast docs](https://react-hot-toast.com/docs) are very thorough. But here are a couple of common use cases.

### Displaying a Toast

Wherever you want your notifications to be output, include the **&lt;Toaster&gt;** component:

```javsacript
import { Toaster } from '@redwoodjs/web/toast'

const HomePage = () => {
  return (
    <main>
      <Toaster />
      <!-- Remaining homepage content -->
    </main>
  )
}

export default HomePage
```

**&lt;Toaster&gt;** accepts several options, including placement options:

* top-left
* top-center
* top-right
* bottom-left
* bottom-center
* bottom-right

and a delay for how long to show each type of notification:

```javascript
<Toaster
  position="bottom-right"
  toastOptions={{success: { duration: 3000 } }}
/>
```

See the [official Toaster docs](https://react-hot-toast.com/docs/toaster) for more options. There's also a [dedicated doc for styling](https://react-hot-toast.com/docs/styling).

### Triggering a Toast

To show a toast message, just include a call to the `toast` object:

```javascript
import { toast } from '@redwoodjs/web/toast'

const UserForm = () => {
  onSubmit: () => {
    // code to save a record
    toast.success('User created!')
  }

  return (
    // Component JSX
  )
})
```

There are different "types" of toasts, by default each shows a different icon to indicate that type:

* `toast()` - Text only, no icon shown
* `toast.success()` - Checkmark icon with text
* `toast.error()` - X icon with text
* `toast.loading()` - Spinner icon, will show for 30 seconds by default, or until dismissed via `toast.dismiss(toastId)`
* `toast.promise()` - Spinner icon, displays until the Promise resolves

Check out the [full docs on `toast()`](https://react-hot-toast.com/docs/toast) for more options and usage examples.

## Generators

If you generate a scaffold, you will get toast notifications automatically for the following actions:

* Creating a new record
* Editing an existing record
* Deleting a record
