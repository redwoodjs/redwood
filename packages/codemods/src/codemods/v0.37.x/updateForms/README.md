# Update Forms

- Rename `<Form validation={...}>` to `<Form config={...}>`
- Change a field's `transformValue` prop to...
  - `transformValue="Json"` -> `validation={{ valueAsJSON: true }}`
  - `transformValue"Boolean"` -> `validation={{ valueAsBoolean: true }}`
  - We have to be careful here: if there's validation prop already defined, we append it as a property... otherwise we make the validation prop
