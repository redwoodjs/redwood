# Update Cell mocks
- Finds all Cell mocks (used in tests and storybook), with the extension Cell.mock.{js,ts}
- Changes the standard export to be a function, if it isn't

```diff
- export const standard = {
-   todosCount: 42,
-}

+ export const standard = () => {
+  return {
+    todosCount: 42
+  }
+}

```
