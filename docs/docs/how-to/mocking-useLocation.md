# Mocking useLocation

To mock ``useLocation`` for your component tests, wrap the component with ``LocationProvider``.

```jsx
import { LocationProvider } from '@redwoodjs/router'

render(
<LocationProvider location={{ pathname: '', search: '?cancelled=true' }}>
   <Component />
</LocationProvider>
)
```
