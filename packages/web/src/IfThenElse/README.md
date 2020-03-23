# Redwood IfElseThen

Redwood provides helpers to make your life easier when working with if statements by using `If, Then and Else` components take a look at [react-if](https://github.com/romac/react-if)

> WARNING: This software is in alpha and should not be considered suitable for production use. In the "make it work; make it right; make it fast" paradigm, RF is in the later stages of the "make it work" phase.

Redwood currently provides the following components for conditionally render parts of UI:

* `<If>` If condition evaluates to true, renders the `<Then />` block will be rendered, otherwise renders the `<Else />` block. Either block may be omitted.

* `<Else>` Can contain any number of elements inside, which it renders as-is. It can also contain a function. Should not be used outside of an `<If />` block. It will only be displayed, if parent If block's condition is false.

* `<Then>` Can contain any number of elements inside, which it renders as-is. It can also contain a function. Should not be used outside of an `<If />` block. It will only be displayed, if parent If block's condition is true.


```javascript
import { If, Then, Else } from '@redwoodjs/web'

const ContactPage = () => {
  return (
    <nav className="text-right">
      <If condition ={currentUser}>
        <Then>
          <a href="#" onClick={signout} className="text-indigo-500" >Sign Out</a>
        </Then>
        <Else>
            signin()
        </Else>
      </If>
    </nav>
  )
}
```

## `<If>`

| Property      | Type    |
| ------------- | ------- |
| `condition`   | Boolean |

The condition passed as props, evaluate it and render the children of `<Then>` if the result is truthy, otherwise render the children of `<Else>`

```html
<If condition={currentUser}>...</If>

```

### `<If>` Attributes

Besides the attributes listed below, any additional attributes are passed on as props to the underlying `<If>` tag which is rendered.

#### condition

The `condition` prop accepts a condition that will return `true` or `false`.

Example `condition={1 + 1 === 2}`




## `<Then>`

We can pass just `<Then>` to `<If>` when we want to render something only if the condition is truthy so with other words it only gets displayed when the parent `<If>` block's condition is `true`

```html
<If condition={!myCondition}>
  <Then>Not being displayed</Then>
</If>
```

## `<Else>`

<Else> Block is only going to be displayed, if parent `<If>` block's condition is `false`. Can contain any number of elements inside can also contain a function.Should not be used outside of an `<If />` block

```html
 <If condition={props.role === 'admin'}>
   <Then>
      <h1>You can delete users </h1>
      <button onclick={deleteUser}>Delete user<button>
   </Then>
   <Else>
      <h1>Must be admin<h1>
      <button disabled={true}>Delete user<button>
   </Else>
  </If>
```