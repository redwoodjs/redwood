/* eslint-disable no-undef, camelcase */
/// <reference types="cypress" />

const BASE_DIR = Cypress.env('RW_PATH')

describe('Check Redwood cli commands against tutorial', () => {
  before(() => {
    Cypress.config('record', false)
  })

  after(() => {
    Cypress.config('record', true)
  })
  it('Should run api tests successfully', () => {
    cy.exec(`cd ${BASE_DIR}; yarn rw test api --no-watch`, {
      timeout: 60000,
    })
      .its('code')
      .should('eq', 0)
  })

  // @TODO figure out why babel issues happen when linked
  it.skip('Should run web tests successfully', () => {
    cy.exec(`cd ${BASE_DIR}; yarn rw test web --no-watch`, {
      timeout: 60000,
    })
      .its('code')
      .should('eq', 0)
  })

  it('Should run build successfully (no prerender)', () => {
    // Check if webpack build on web, and babel build on api
    // work correctly
    cy.exec(`cd ${BASE_DIR}; yarn rw build --no-prerender`, {
      timeout: 60000,
    })
      .its('code')
      .should('eq', 0)
  })

  it('Should prerender about and homepage', () => {
    // Check if prerender is working
    cy.exec(`cd ${BASE_DIR}; yarn rw prerender`, {
      timeout: 60000,
    })
      .its('code')
      .should('eq', 0)

    const WEB_DIST = `${BASE_DIR}/web/dist`

    // Check prerendered files are generated
    // Prerender prop added to routes in codemods/Step6_1_Routes.js
    cy.readFile(`${WEB_DIST}/index.html`).should('contain', 'Redwood Blog')
    cy.readFile(`${WEB_DIST}/about.html`).should(
      'contain',
      'This site was created to demonstrate my mastery of Redwood'
    )

    // Check 404 existence
    cy.readFile(`${WEB_DIST}/404.html`)
  })
})
