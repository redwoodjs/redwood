# Flash

Pass temporary [`message`](#messages) objects between components.

[FlashContext](#flashcontext) was created with post-action messaging in mind. Flash is particularly useful, for instance, when we want to alert the user that something they tried was successful or erroneous.

Flash makes use of [React's Context API](https://reactjs.org/docs/context.html) to make it easy to pass message objects between components, even deeply nested ones.

[The Flash component](#flash-the-component) provides a typical message display unit for rendering the messages provided to FlashContext.

## FlashContext

FlashContext is the headquarters for Redwood's Flash system. Its provider component is packaged with the `<RedwoodProvider />` component which makes it ready to use out of the box. Your components can pass (think, "send and recieve") message objects by subscribing to it via the provided [useFlash](#useflash) hook.

FlashContext provides update functions which allow subscribed components to send and manipulate message objects. Subscribers can [consume](#consume-messages), [add](#add-a-message), [dismiss](#dismiss-a-message), and [cycle messages](#cycle-a-message).

### Consume messages

Of course, we'll want a way to display messages to the user. That's easy:

```js
import { useFlash } from '@redwoodjs/web'

const MyFlashComponent = () => {
  // messages, an array of message objects
  const { messages } = useFlash()

  // if the messages array is empty
  // return nothing
  if (!messages.length) {
    return null
  }

  return (
    <>
      {messages.map((msg) => (
        <div key={msg.id} className={msg.classes}>
          {msg.text}
        </div>
      ))}
    </>
  )
}

```

### Add a message

...but there aren't any messages to display yet. Let's add one:

```js
import { useFlash } from '@redwoodjs/web'

const MyMessageButton = () => {
  // addMessage(text, options)
  const { addMessage } = useFlash()

  const sayHello = () => {
    addMessage("Hello world!", {
      classes: "success-style"
    })
  }

  return (
    <>
      <button onClick={() => sayHello()}>
    </>
  )
}

```

[`addMessage()`](#addmessage) takes two parameters; `text` (string) and `options` (object)

The `options` object has the following structure:

```js
{
  text: "It is your birthday period", // overwrites the text param passed to addMessage()
  classes: "bold red text", // css classes
  persist: true, // true will persist the message through each cycle until it is dismissed manually
  viewed: false, // once true, the message will be dismissed on the next cycle
}
```

### Dismiss a message

We want to allow our user to dismiss the message manually.

```js
import { useFlash } from '@redwoodjs/web'

const Message = ({ message }) => {
  const { dismissMessage } = useFlash()

  return (
    <div className={message.classes}>
      {message.text}
      <button onclick={() => dismissMessage(message.id)}>Dismiss</button>
    </div>
  )

}
```

### Cycle a message

It is up to the consumer component—and thusly, the developer—to dictate when and how a message should be dismissed. However, in most cases, a message's life cycle will include the following states: Not viewed (initial state), viewed, and dismissed. Typically the message moves on to the next phase as an effect of another action, say for instance, a route change. With this in mind, the `cycleMessage()` function makes it easy to cycle messages through these states without requiring direct user interaction.

#### Example: Show and dismiss after three seconds

```js
import { useFlash } from '@redwoodjs/web'

const Message = ({ message }) => {
  const { cycleMessage } = useFlash()

  React.useEffect(() => {
    // the message mounted so mark it as viewed
    cycleMessage(message.id)
    // after three seconds dismiss it
    setTimeout(() => {
      cycleMessage(message.id)
    }, 3000)
  }, [])

  return (
    <div className={message.classes}>
      {message.text}
    </div>
  )

}
```

#### Example: Show and dismiss after the route changes

```js
import { useFlash } from '@redwoodjs/web'

const Message = ({ message }) => {
  const { cycleMessage } = useFlash()
  const { path } = useLocation()

  React.useEffect(() => {
    // the message mounted so mark it as viewed
    cycleMessage(message.id)
    // cycle again (re-run useEffect) if path changes
  }, [path])

  return (
    <div className={message.classes}>
      {message.text}
    </div>
  )

}
```

## useFlash

`useFlash` is an abridgment of `React.useContext(FlashContext)`. It allows you to subscribe to FlashContext's properties and functions from within any component nested within `<RedwoodProvider />`.

```js
  import { useFlash } from '@redwoodjs/web'

  const {
    messages,
    addMessage,
    dismissMessage,
    cycleMessage
  } = useFlash()
```

### `messages`
```js
messages = [
  {
    id: 0, // integer
    text: "Success!", // string
    classes: "green italic", // string
    persist: false, // boolean
    viewed: false, // boolean
  },
  {
    id: 0, // integer
    ...
  }
]
```

### `addMessage`
```js
let text = "Success!" // string
let options = {
  classes: "green italic", // string
  persist: false, // boolean
  viewed: false
}
addMessage(text, options)
```

### `dismissMessage`
```js
dismissMessage(id) // integer
```

### `CycleMessage`
```js
cycleMessage(id) // integer
```

## Flash (the component)

`<Flash />` is a canonical implementation of a message display component. It is included in the templates generated by scaffold where it is used to display messages upon successful create, update, and delete actions.

By default, each message is marked as viewed once it is initially rendered and then dismissed on any subsequent render, typically induced by a route change.

### timeout

```js
<Flash timeout={3000} />
```
The component accepts a `timeout` prop; an integer interpreted as milliseconds. If a value is provided, the message will be dismissed (thusly, removed from the dom) after this time has lapsed.

Note: In the future, `<Flash />` will recieve a cycleDependency prop with which a cycle is triggered on a falsy comparison.