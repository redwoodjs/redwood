import { describe, it } from 'node:test'

import { ESLintUtils } from '@typescript-eslint/utils'

import { unsupportedRouteComponents } from '../unsupported-route-components.js'

ESLintUtils.RuleTester.describe = describe
ESLintUtils.RuleTester.it = it

const ruleTester = new ESLintUtils.RuleTester({
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    ecmaFeatures: {
      jsx: true,
    },
  },
})

ruleTester.run('unsupported-route-components', unsupportedRouteComponents, {
  valid: [
    {
      code: 'const Routes = () => <Router></Router>',
    },
    {
      code: 'const Routes = () => <Router><Route path="/" page={HomePage} name="home" /></Router>',
    },
    {
      code: 'const Routes = () => <Router><Set><Route path="/contacts" page={ContactsPage} name="contacts" /></Set></Router>',
    },
    {
      code: 'const Routes = () => <Router><Private><Route path="/contacts" page={ContactsPage} name="contacts" /></Private></Router>',
    },
    {
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
    },
  ],
  invalid: [
    {
      code: 'const Routes = () => <Router><div><Route path="/" page={HomePage} name="home" /></div></Router>',
      errors: [{ messageId: 'unexpected' }],
    },
    {
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
      errors: [{ messageId: 'unexpected' }],
    },
  ],
})
