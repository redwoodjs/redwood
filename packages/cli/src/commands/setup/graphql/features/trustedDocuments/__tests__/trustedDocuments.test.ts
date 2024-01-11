import path from 'path'

import {
  updateGraphQLHandler,
  updateRedwoodToml,
} from '../trustedDocumentsHandler'

// Silence console.info
console.info = jest.fn()

describe('Trusted documents setup tests', () => {
  describe('Project toml configuration updates', () => {
    describe('default toml where no graphql or trusted documents is setup', () => {
      it('updates the toml file with graphql and trusted documents enabled', () => {
        const redwoodTomlPath = path.join(
          __dirname,
          '../',
          '__fixtures__',
          'toml',
          'default.toml'
        )
        const result = updateRedwoodToml(redwoodTomlPath)
        expect(result).toMatchSnapshot()
      })
    })
    describe('default toml where graphql fragments are already setup', () => {
      it('updates the toml file with graphql and trusted documents enabled and keeps fragments', () => {
        const redwoodTomlPath = path.join(
          __dirname,
          '../',
          '__fixtures__',
          'toml',
          'fragments.toml'
        )
        const result = updateRedwoodToml(redwoodTomlPath)
        expect(result).toMatchSnapshot()
      })
    })
    describe('default toml where graphql fragments are already setup using no spaces', () => {
      it('updates the toml file with graphql and trusted documents enabled and keeps fragments', () => {
        const redwoodTomlPath = path.join(
          __dirname,
          '../',
          '__fixtures__',
          'toml',
          'fragments_no_space_equals.toml'
        )
        const result = updateRedwoodToml(redwoodTomlPath)
        expect(result).toMatchSnapshot()
      })
    })
    describe('default toml where graphql trusted documents are already setup', () => {
      it('makes no changes as trusted documents are already setup', () => {
        const redwoodTomlPath = path.join(
          __dirname,
          '../',
          '__fixtures__',
          'toml',
          'trusted_docs_already_setup.toml'
        )
        const result = updateRedwoodToml(redwoodTomlPath)
        expect(result).toMatchSnapshot()
      })
    })
    describe('default toml where graphql trusted documents are already setup using no spaces', () => {
      it('makes no changes as trusted documents are already setup', () => {
        const redwoodTomlPath = path.join(
          __dirname,
          '../',
          '__fixtures__',
          'toml',
          'trusted_docs_already_setup_no_space_equals.toml'
        )
        const result = updateRedwoodToml(redwoodTomlPath)
        expect(result).toMatchSnapshot()
      })
    })
    describe('default toml where graphql trusted documents and fragments are already setup', () => {
      it('makes no changes as trusted documents are already setup', () => {
        const redwoodTomlPath = path.join(
          __dirname,
          '../',
          '__fixtures__',
          'toml',
          'trusted_docs_and_fragments_already_setup.toml'
        )
        const result = updateRedwoodToml(redwoodTomlPath)
        expect(result).toMatchSnapshot()
      })
    })
    describe('toml where graphql section is commented out', () => {
      it('adds a new section with `trustedDocuments = true`', () => {
        const redwoodTomlPath = path.join(
          __dirname,
          '../',
          '__fixtures__',
          'toml',
          'trusted_docs_commented_graphql.toml'
        )
        const result = updateRedwoodToml(redwoodTomlPath)
        expect(result).toMatchSnapshot()
      })
    })
  })
  describe('GraphQL Handler updates', () => {
    describe('default handler where the trusted document store is not configured', () => {
      it('updates the handler with the trusted document store', async () => {
        const handlerPath = path.join(
          __dirname,
          '../',
          '__fixtures__',
          'graphQLHandler',
          'trustedDocumentSetupHandler.js'
        )
        const updateResult = updateGraphQLHandler(handlerPath)
        expect(updateResult?.graphQlSourceFileChanged).toBe(false)
        expect(updateResult?.graphQlSourceFile.getFullText()).toMatchSnapshot()
      })
    })
  })
})
