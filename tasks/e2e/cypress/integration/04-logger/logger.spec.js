/* eslint-disable no-undef, camelcase */
/// <reference types="cypress" />
import path from 'path'

import 'cypress-wait-until'

import { waitForApiSide } from '../01-tutorial/sharedTests'

import { setupLogger } from './codemods/Step1_1_Setup_Logger'
import Step1_2_Add_Logger from './codemods/Step1_2_Add_Logger_to_Posts'
import { setupPrismaLogger } from './codemods/Step2_1_Setup_Prisma_Logger'

const BASE_DIR = Cypress.env('RW_PATH')
const LOG_FILENAME = 'e2e.log'

import 'cypress-wait-until'

describe('The Redwood Logger - Basic Scaffold CRUD Logging', () => {
  const LOG_PATH = path.join(BASE_DIR, LOG_FILENAME)

  it('1. Test Logging for CRUD', () => {
    // Empty log file.
    cy.writeFile(LOG_PATH, '')

    cy.writeFile(
      path.join(BASE_DIR, 'api/src/lib/logger.js'),
      setupLogger(BASE_DIR, LOG_FILENAME)
    )
    cy.writeFile(
      path.join(BASE_DIR, 'api/src/services/posts/posts.js'),
      Step1_2_Add_Logger
    )

    waitForApiSide()

    cy.visit('http://localhost:8910/blog-post/3')

    cy.visit('http://localhost:8910/posts')

    cy.contains('Edit')
    cy.contains('Loading...').should('not.exist')

    cy.waitUntil(
      () =>
        cy.readFile(LOG_PATH).then((str) => {
          console.log(str)
          return str.includes('> in posts()')
        }),
      { interval: 2000, timeout: 2000 }
    )

    // CREATE / SAVE
    cy.contains(' New Post').click()
    cy.get('input#title').type('First post')
    cy.get('input#body').type('Hello world!')
    cy.get('button').contains('Save').click()

    cy.waitUntil(() =>
      cy.readFile(LOG_PATH).then((str) => {
        console.log(str)
        return str.includes('> in createPost()')
      })
    )

    // EDIT
    cy.contains('Edit').click()
    cy.get('input#body').clear().type('No, Margle the World!')
    cy.get('button').contains('Save').click()

    cy.waitUntil(() =>
      cy.readFile(LOG_PATH).then((str) => {
        console.log(str)
        return str.includes('> in updatePost()')
      })
    )

    // DELETE
    cy.contains('Delete').click()
    cy.waitUntil(() =>
      cy.readFile(LOG_PATH).then((str) => {
        console.log(str)
        return str.includes('> in deletePost()')
      })
    )
  })

  it('2. Test logging for Prisma', () => {
    // Without slow query logging.
    // Reset log file.
    cy.writeFile(LOG_PATH, '')

    cy.writeFile(
      path.join(BASE_DIR, 'api/src/lib/db.js'),
      setupPrismaLogger({ slowQueryThreshold: 9_999 })
    )

    waitForApiSide()

    cy.visit('http://localhost:8910/posts')

    cy.contains('Edit')
    cy.contains('Loading...').should('not.exist')

    cy.waitUntil(
      () =>
        cy.readFile(LOG_PATH).then((str) => {
          console.log(str)
          return (
            str.includes('Query performed in ') &&
            !str.includes('Slow Query performed in ')
          )
        }),
      { interval: 2000, timeout: 2000 }
    )

    // With slow query logging.
    // Reset log file.
    cy.writeFile(LOG_PATH, '')

    cy.writeFile(
      path.join(BASE_DIR, 'api/src/lib/db.js'),
      setupPrismaLogger({ slowQueryThreshold: 0 })
    )

    waitForApiSide()

    cy.visit('http://localhost:8910/posts')

    cy.contains('Edit')
    cy.contains('Loading...').should('not.exist')

    cy.waitUntil(
      () =>
        cy.readFile(LOG_PATH).then((str) => {
          console.log(str)
          return str.includes('Slow Query performed in ')
        }),
      { interval: 2000, timeout: 2000 }
    )
  })
})
