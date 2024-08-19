/* eslint-env node */
// @ts-check

/**
 * @typedef {import('@yarnpkg/types').Yarn.Constraints.Context} Context
 * @typedef {import('@yarnpkg/types').Yarn.Constraints.Workspace} Workspace
 */

/** @type {import('@yarnpkg/types')} */
const { defineConfig } = require(`@yarnpkg/types`)

/**
 * This rule will enforce that a workspace MUST depend on the same version of a
 * dependency as the one used by the other workspaces.
 *
 * @param {Context} context
 */
function enforceConsistentDependenciesAcrossTheProject({ Yarn }) {
  for (const dependency of Yarn.dependencies()) {
    if (dependency.type === `peerDependencies`) {
      continue
    }

    for (const otherDependency of Yarn.dependencies({
      ident: dependency.ident,
    })) {
      if (otherDependency.type === `peerDependencies`) {
        continue
      }

      if (
        (dependency.type === `devDependencies` ||
          otherDependency.type === `devDependencies`) &&
        Yarn.workspace({ ident: otherDependency.ident })
      ) {
        continue
      }

      dependency.update(otherDependency.range)
    }
  }
}

/**
 * This rule will enforce that a workspace MUST depend on the same version of a
 * dependency as the one used by the other workspaces.
 *
 * @param {Context} context
 */
function enforceWorkspaceDependenciesWhenPossible({ Yarn }) {
  for (const dependency of Yarn.dependencies()) {
    if (!Yarn.workspace({ ident: dependency.ident })) {
      continue
    }

    dependency.update(`workspace:*`)
  }
}

/**
 * This rule will enforce that a dependency doesn't appear in both `dependencies`
 * and `devDependencies`.
 *
 * @param {Context} context
 */
function enforceNotProdAndDevDependencies({ Yarn }) {
  for (const workspace of Yarn.workspaces()) {
    const dependencies = Yarn.dependencies({ workspace, type: 'dependencies' })
    const devDependencies = Yarn.dependencies({
      workspace,
      type: 'devDependencies',
    })
    for (const dependency of dependencies) {
      if (
        devDependencies.find(
          (devDependency) => devDependency.ident === dependency.ident,
        )
      ) {
        dependency.error(
          `The dependency '${dependency.ident}' should not appear in both dependencies and devDependencies`,
        )
      }
    }
  }
}

/**
 * This rule will enforce that any package built with babel (identified by the
 * presence of a 'build:js' script in its `package.json`) must depend on the
 * '@babel/runtime-corejs3' and 'core-js' packages.
 *
 * @param {Context} context
 */
function enforceBabelDependencies({ Yarn }) {
  for (const workspace of Yarn.workspaces()) {
    const packageJson = workspace.manifest
    if (!packageJson.scripts?.[`build:js`]) {
      continue
    }

    const dependencies = Yarn.dependencies({
      workspace,
      type: 'dependencies',
    })
    const requiredDependencies = [`@babel/runtime-corejs3`, `core-js`]
    for (const dependency of requiredDependencies) {
      if (!dependencies.find((dep) => dep.ident === dependency)) {
        workspace.error(
          `The package '${workspace.cwd}' must depend on '${dependency}' to build with babel`,
        )
      }
    }
  }
}

/**
 * This rule will enforce that the specified fields are present in the
 * `package.json` of all workspaces.
 *
 * @param {Context} context
 * @param {string[]} fields
 */
function enforceFieldsOnAllWorkspaces({ Yarn }, fields) {
  for (const workspace of Yarn.workspaces()) {
    // Skip the root workspace
    if (workspace.cwd === '.') {
      continue
    }

    for (const field of fields) {
      if (!workspace.manifest[field]) {
        workspace.error(
          `The field '${field}' is required in the package.json of '${workspace.cwd}'`,
        )
      }
    }
  }
}

/**
 * This rule will enforce that the specified fields are present in the
 * `package.json` of all workspaces and that they have the expected value.
 *
 * @param {Context} context
 * @param {Record<string, ((workspace: Workspace) => any) | string>} fields
 */
function enforceFieldsWithValuesOnAllWorkspaces({ Yarn }, fields) {
  for (const workspace of Yarn.workspaces()) {
    // Skip the root workspace
    if (workspace.cwd === '.') {
      continue
    }

    for (const [field, value] of Object.entries(fields)) {
      workspace.set(
        field,
        typeof value === `function` ? value(workspace) : value,
      )
    }
  }
}

module.exports = defineConfig({
  constraints: async (ctx) => {
    enforceConsistentDependenciesAcrossTheProject(ctx)
    enforceWorkspaceDependenciesWhenPossible(ctx)
    enforceNotProdAndDevDependencies(ctx)
    enforceBabelDependencies(ctx)
    enforceFieldsOnAllWorkspaces(ctx, [
      'name',
      'version',
      // 'description', // TODO(jgmw): Add description to all packages and uncomment this line
    ])
    enforceFieldsWithValuesOnAllWorkspaces(ctx, {
      license: 'MIT',
      ['repository.type']: 'git',
      ['repository.url']: 'git+https://github.com/redwoodjs/redwood.git',
      ['repository.directory']: (workspace) => workspace.cwd,
    })
  },
})
