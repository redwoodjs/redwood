# Update Router paramTypes

- Renames `paramType` expected keys from `transform` to parse and `constraint` to `match`.
- Checks only within Routes.{tsx|js} file.

```diff
  import { Router, Route } from '@redwoodjs/router'

 const Routes = () => {
   return (
     <Router pageLoadingDelay={350} paramTypes={{
       slug: {
-        constraint: /\w+-\w+/,
-        transform: (param) => param.split('-'),
+        match: /\w+-\w+/,
+        parse: (param) => param.split('-'),
       },
     }}>
       <Route notfound page={NotFoundPage} />
     </Router>
   )
 }

 export default Routes
```
