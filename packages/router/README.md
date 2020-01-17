# Redwood Router

## Contraints & Transforms

```js
<Route
  path="/order/{num}"
  page={OrderPage}
  name="order"
  constraints={{ id: /\d+/ }}
  transforms={{ id: parseInt }}
/>

<Route
  path="/order/{num:Int}"
  page={OrderPage}
  name="order"
/>
```
