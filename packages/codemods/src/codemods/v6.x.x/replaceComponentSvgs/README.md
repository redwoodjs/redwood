# Replace Component Svgs

This codemod will find all the cases where SVGs are imported as used as components, and then:
1. Generates a react component with SVGR
2. Replaces the import to the svg file with an import to the new React component

e.g.

```diff
- import Bazinga from '../bazinga.svg'
+ import bazinga from '../BazingaSVG.js'

const myComponent = () => {
  // ...
  <Bazinga/>
```
