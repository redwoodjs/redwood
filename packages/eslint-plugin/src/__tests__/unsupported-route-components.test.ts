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
      code: 'const Routes = () => <Router></Router>',
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    {
      filename: '/web/src/Routes.jsx',
      code: 'const Routes = () => <Router><Route path="/" page={HomePage} name="home" /></Router>',
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    {
      filename: '/web/src/Routes.js',
      code: 'const Routes = () => <Router><Set><Route path="/contacts" page={ContactsPage} name="contacts" /></Set></Router>',
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
        const Routes = () => {
          return (
            <Router>
              <Set>
                <Route path="/contacts" page={ContactsPage} name="contacts" />
              </Set>
            </Router>
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
      code: 'const Routes = () => <Router><div><Route path="/" page={HomePage} name="home" /></div></Router>',
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: {
          jsx: true,
        },
      },
      errors: [
        {
          message:
            'Unexpected JSX element <div>. Only <Router>, <Route>, or <Set> are allowed in Router files.',
        },
      ],
    },
    {
      filename: '/web/src/Routes.tsx',
      code: `
        const Routes = () => {
          return (
            <Router>
              <Set>
                <CustomElement>
                  <Route path="/contacts" page={ContactsPage} name="contacts" />
                </CustomElement>
              </Set>
            </Router>
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
            'Unexpected JSX element <CustomElement>. Only <Router>, <Route>, or <Set> are allowed in Router files.',
        },
      ],
    },
  ],
})
