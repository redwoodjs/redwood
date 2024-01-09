import path from 'path'

import { updateRedwoodToml } from '../features/trusted-documents'
describe('Trusted documents setup tests', () => {
  describe('Project toml configuration updates', () => {
    describe('default toml where no graphql or trusted documents is setup', () => {
      it('updates the toml file with graphql and trusted documents enabled', () => {
        const redwoodTomlPath = path.join(
          __dirname,
          '../',
          '__fixtures__',
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
          'trusted_docs_and_fragments_already_setup.toml'
        )
        const result = updateRedwoodToml(redwoodTomlPath)
        expect(result).toMatchSnapshot()
      })
    })
  })
})
