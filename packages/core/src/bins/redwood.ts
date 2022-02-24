#!/usr/bin/env node
/**
 * A proxy for running the `redwood` @redwoodjs/cli bin (`yarn redwood`, or `yarn rw`) from @redwoodjs/core.
 *
 * @remarks
 * `createRequire` is for ES6 modules.
 * Some modules can only be imported via require and not via ES6 import/export syntax.
 * But require doesn't exist in ES6, so you have to create it.
 *
 * But that's not the reason we're using it here.
 * We're using it here to require files from other packages for yarn 3 reasons--
 * something kinda along these lines:
 *
 * > If your package is something that automatically loads plugins (for example eslint),
 * > peer dependencies obviously aren't an option as you can't reasonably list all plugins.
 * > Instead, you should use the createRequire function to load plugins
 * > on behalf of the configuration file that lists the plugins to load
 * > be it the package.json or a custom one like the .eslintrc.js file.
 *
 * @see {@link https://yarnpkg.com/advanced/rulebook#packages-should-only-ever-require-what-they-formally-list-in-their-dependencies}
 * @see {@link https://yarnpkg.com/advanced/rulebook#modules-shouldnt-hardcode-node_modules-paths-to-access-other-modules}
 */
import { createRequire } from 'module'

// You can think about the argument we're passing to createRequire as being kinda like setting the `cwd`.
const requireFromCli = createRequire(
  require.resolve('@redwoodjs/cli/package.json')
)

const bins = requireFromCli('./package.json')['bin']

requireFromCli(bins['redwood'])
