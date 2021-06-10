/* eslint-disable no-undef, camelcase */
/// <reference types="cypress" />
import path from 'path'

import { setupLogger } from './codemods/Step0_1_Setup_Logger'
import Step0_1_Setup_Logger from './codemods/Step0_2_Add_Logger_to_Posts'
import Step1_1_Routes from './codemods/Step1_1_Routes'
import Step2_1_DbSchema from './codemods/Step2_1_DbSchema'

const BASE_DIR = Cypress.env('RW_PATH')
const LOG_FILENAME = 'e2e.log'

describe('The Redwood Logger - Basic Scaffold CRUD Logging', () => {
  // TODO: https://redwoodjs.com/tutorial/saving-data
  // TODO: https://redwoodjs.com/tutorial/administration

  it('0. Setup Logging', () => {
    // https://redwoodjs.com/tutorial/installation-starting-development
    cy.writeFile(path.join(BASE_DIR, 'web/src/Routes.js'), Step1_1_Routes)
    cy.writeFile(
      path.join(BASE_DIR, 'api/src/lib/logger.js'),
      setupLogger(BASE_DIR, LOG_FILENAME)
    )

    cy.visit('http://localhost:8910')

    cy.readFile(path.join(BASE_DIR, LOG_FILENAME)).should('exist')
  })

  it('1. Test Logging for CRUD', () => {
    // https://redwoodjs.com/tutorial/getting-dynamic
    cy.writeFile(path.join(BASE_DIR, 'api/db/schema.prisma'), Step2_1_DbSchema)
    cy.exec(`rm ${BASE_DIR}/api/db/dev.db`, { failOnNonZeroExit: false })
    // need to also handle case where Prisma Client be out of sync
    cy.exec(
      `cd ${BASE_DIR}; yarn rimraf ./api/db/migrations && yarn rw prisma migrate reset --skip-seed --force`
    )
    cy.exec(`cd ${BASE_DIR}; yarn rw prisma migrate dev`)

    cy.exec(`cd ${BASE_DIR}; yarn rw g scaffold post --force`)
    cy.writeFile(
      path.join(BASE_DIR, 'api/src/services/posts/posts.js'),
      Step0_1_Setup_Logger
    )

    cy.visit('http://localhost:8910/posts')

    cy.readFile(path.join(BASE_DIR, LOG_FILENAME)).should('contain', 'Starting')

    cy.readFile(path.join(BASE_DIR, LOG_FILENAME)).should(
      'contain',
      '> in posts()'
    )

    cy.get('h1').should('contain', 'Posts')
    cy.get('a.rw-button.rw-button-green').should(
      'have.css',
      'background-color',
      'rgb(72, 187, 120)'
    )
    cy.contains(' New Post').click()
    cy.get('h2').should('contain', 'New Post')

    // CREATE / SAVE
    cy.get('input#title').type('First post')
    cy.get('input#body').type('Hello world!')
    //check scaffold css
    cy.get('button.rw-button.rw-button-blue').should(
      'have.css',
      'background-color',
      'rgb(49, 130, 206)'
    )
    cy.get('button').contains('Save').click()

    cy.contains('Post created')

    cy.readFile(path.join(BASE_DIR, LOG_FILENAME)).should(
      'contain',
      '> in createPost()'
    )

    cy.readFile(path.join(BASE_DIR, LOG_FILENAME)).should(
      'contain',
      'Hello world!'
    )

    // EDIT
    cy.contains('Edit').click()
    cy.contains('Loading...').should('not.exist')
    cy.get('h2').contains('Edit Post 1')
    cy.get('input#body').clear().type('No, Margle the World!')
    cy.get('button').contains('Save').click()
    cy.get('td').contains('No, Margle the World!')
    cy.get('div[role="status"]').contains('Post updated')

    cy.contains('Post updated')

    cy.readFile(path.join(BASE_DIR, LOG_FILENAME)).should(
      'contain',
      '> in updatePost()'
    )

    cy.readFile(path.join(BASE_DIR, LOG_FILENAME)).should(
      'contain',
      'No, Margle the World'
    )

    // DELETE
    cy.contains('Delete').click()

    // No more posts, so it should be in the empty state.
    cy.contains('Post deleted')
    cy.get('div[role="status"]').contains('Post deleted')

    cy.readFile(path.join(BASE_DIR, LOG_FILENAME)).should(
      'contain',
      '> in deletePost()'
    )
  })
})
