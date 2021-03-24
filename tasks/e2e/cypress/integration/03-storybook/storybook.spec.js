/* eslint-disable no-undef, camelcase */
/// <reference types="cypress" />

const BASE_DIR = Cypress.env('RW_PATH')

describe('Redwood Storybook Integration', () => {
  it('0.1 Build Storybook Static Files', () => {
    cy.exec(`cd ${BASE_DIR}; yarn rw storybook --build`, {
      timeout: 50000,
    })
      .its('code')
      .should('eq', 0)
  })
  // TO DO fix Storybook build command to output to public/
  it('0.2 Serve Storybook Static Files with Dev Server', () => {
    cy.exec(
      `cd ${BASE_DIR}; mv web/storybook-static web/public/storybook-static`
    )
      .its('code')
      .should('eq', 0)
  })

  it('1. BlogPost Component', () => {
    cy.visit(
      `http://localhost:8910/storybook-static/iframe.html?id=components-blogpost--generated&viewMode=story`
    )
    // TO DO: code mode to update mock
    cy.get('#error-message').should('contain.text', 'Cannot read property')
  })

  it('2. BlogPostCell', () => {
    cy.visit(
      `http://localhost:8910/storybook-static/iframe.html?id=cells-blogpostcell--loading&viewMode=story`
    )
    cy.get('#root div').should('contain.text', 'Loading')
    cy.visit(
      `http://localhost:8910/storybook-static/iframe.html?id=cells-blogpostcell--empty&viewMode=story`
    )
    cy.get('#root div').should('contain.text', 'Empty')
    cy.visit(
      `http://localhost:8910/storybook-static/iframe.html?id=cells-blogpostcell--failure&viewMode=story`
    )
    cy.get('#root div').should('contain.text', 'Error')
    cy.visit(
      `http://localhost:8910/storybook-static/iframe.html?id=cells-blogpostcell--success&viewMode=story`
    )
    // TO DO: code mode to update mock
    cy.get('#error-message').should('contain.text', 'Cannot read property')
  })
})
