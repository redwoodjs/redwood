/* eslint-disable no-undef, camelcase */
/// <reference types="cypress" />

const BASE_DIR = Cypress.env('RW_PATH')

describe('Redwood Storybook Integration', () => {
  it('0. Build Storybook Static Files', () => {
    cy.exec(`cd ${BASE_DIR}; yarn rw storybook --build`, {
      timeout: 50000,
    })
      .its('code')
      .should('eq', 0)
  })

  it('1. BlogPost Component', { baseUrl: null }, () => {
    cy.visit(
      `/${BASE_DIR}/web/storybook-static/iframe.html?id=components-blogpost--generated&viewMode=story`
    )
    // TO DO: code mode to update mock
    cy.get('#error-message').should('contain.text', 'Cannot read property')
  })

  // it('2. BlogPostCell', () => {
  //   cy.visit(
  //     `${BASE_DIR}/web/storybook-static/iframe.html?id=cells-blogpostcell--loading&viewMode=story`
  //   )
  //   cy.get('#root div').should('contain.text', 'Loading')
  //   cy.visit(
  //     `${BASE_DIR}/web/storybook-static/iframe.html?id=cells-blogpostcell--empty&viewMode=story`
  //   )
  //   cy.get('#root div').should('contain.text', 'Empty')
  //   cy.visit(
  //     `${BASE_DIR}/web/storybook-static/iframe.html?id=cells-blogpostcell--failure&viewMode=story`
  //   )
  //   cy.get('#root div').should('contain.text', 'Error')
  //   cy.visit(
  //     `${BASE_DIR}/web/storybook-static/iframe.html?id=cells-blogpostcell--success&viewMode=story`
  //   )
  //   // TO DO: code mode to update mock
  //   cy.get('#error-message').should('contain.text', 'Cannot read property')
  // })
})
