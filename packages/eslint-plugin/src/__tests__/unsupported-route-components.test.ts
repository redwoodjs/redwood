import { describe, it } from 'node:test'

import { RuleTester } from 'eslint'

import { unsupportedRouteComponents } from '../unsupported-route-components.js'

// @ts-expect-error - Types are wrong
RuleTester.describe = describe
// @ts-expect-error - Types are wrong
RuleTester.it = it

const ruleTester = new RuleTester()

// @ts-expect-error - unsupportedRouteComponents is typed by @typescript-eslint, but it still works
ruleTester.run('unsupported-route-components', unsupportedRouteComponents, {
  valid: [
    {
      filename: '/web/src/Routes.tsx',
      code: 'const routes = () => <Routes></Routes>',
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    {
      filename: '/web/src/Routes.jsx',
      code: 'const routes = () => <Routes><Route path="/" page={HomePage} name="home" /></Routes>',
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    {
      filename: '/web/src/Routes.js',
      code: 'const routes = () => <Routes><Set><Route path="/contacts" page={ContactsPage} name="contacts" /></Set></Routes>',
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    {
      filename: '/web/src/Routes.tsx',
      code: `
        const routes = () => {
          return (
            <Routes>
              <Set>
                <Route path="/contacts" page={ContactsPage} name="contacts" />
              </Set>
            </Routes>
          )
        }`.replace(/ +/g, ' '),
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
  ],
  invalid: [
    {
      filename: '/web/src/Routes.tsx',
      code: 'const routes = () => <Routes><div><Route path="/" page={HomePage} name="home" /></div></Routes>',
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: {
          jsx: true,
        },
      },
      errors: [
        {
          message:
            'Unexpected JSX element <{{name}}>. Only <Router>, <Route>, or <Set> are allowed in Router files.',
        },
      ],
    },
    {
      filename: '/web/src/Routes.tsx',
      code: `
        const routes = () => {
          return (
            <Routes>
              <Set>
                <CustomElement>
                  <Route path="/contacts" page={ContactsPage} name="contacts" />
                </CustomElement>
              </Set>
            </Routes>
          )
        }`.replace(/ +/g, ' '),
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: {
          jsx: true,
        },
      },
      errors: [
        {
          message:
            'Unexpected JSX element <{{name}}>. Only <Router>, <Route>, or <Set> are allowed in Router files.',
        },
      ],
    },
  ],
})
