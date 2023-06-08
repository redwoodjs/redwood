# Replace Component Svgs

This codemod will find all the cases where SVGs are imported as used as components, and repalce them with img tags.

e.g.

```diff
- import Bazinga from '../bazinga.svg'
+ import bazinga from '../bazinga.svg'

const myComponent = () => {
  // ...
- <Bazinga/>
+ <img src={bazinga}>
```
