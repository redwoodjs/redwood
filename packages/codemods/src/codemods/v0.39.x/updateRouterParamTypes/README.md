# Update Router paramTypes

- Renames `paramType` expected keys from `transform` to parse and `constraint` to `match`.
- Checks only within Routes.{tsx|js} file.

```diff
 import { Router, Route } from '@redwoodjs/router'

 const slug = {
-  constraint: /\w+-\w+/,
-  transform: (param) => param.split('-'),
+  match: /\w+-\w+/,
+  parse: (param) => param.split('-'),
 }

 const constraint = /\w+-\w+/
 const transform = (param) => param.split('.')

 const Routes = () => {
   return (
     <Router
       pageLoadingDelay={350}
       paramTypes={{
         slug,
-        embeddedProperties: { constraint: constraint, transform: transform },
+        embeddedProperties: { match: constraint, parse: transform },
         embedded: {
-          constraint: /\w+.\w+/,
-          transform: (param) => param.split('.'),
+          match: /\w+.\w+/,
+          parse: (param) => param.split('.'),
         },
       }}
     >
       <Route notfound page={NotFoundPage} />
     </Router>
   )
 }

 export default Routes
```
