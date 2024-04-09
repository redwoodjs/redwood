/* eslint-disable no-undef, camelcase */
/// <reference types="cypress" />
// import path from 'path'

import 'cypress-wait-until'

import {
  waitForApiSide,
  test_first_page,
  test_pages,
  test_layouts,
  test_dynamic,
  test_cells,
  test_routing_params,
  test_forms,
  test_saving_data,
  // test_auth_cell_failure,
} from '../01-tutorial/sharedTests'

// import Step0_1_RedwoodToml from './codemods/Step0_1_RedwoodToml'
// import Step0_2_GraphQL from './codemods/Step0_2_GraphQL'
// import Step1_1_Routes from './codemods/Step1_1_Routes'
// import Step9_3_DisableAuth from './codemods/Step9_3_DisableAuth'

const BASE_DIR = Cypress.env('RW_PATH')

describe('The Redwood Tutorial - Golden path edition', () => {
  // TODO: https://redwoodjs.com/docs/tutorial/chapter3/saving-data
  // TODO: https://redwoodjs.com/docs/tutorial/chapter4/administration
  after(() => {
    cy.exec(
      `cd ${BASE_DIR}; git add . && git commit -a --message=01-tutorial`,
      {
        failOnNonZeroExit: true,
      },
    )
  })
  it('0. Starting Development', () => {
    // disable auth
    // cy.writeFile(
    //   path.join(BASE_DIR, 'api/src/lib/auth.js'),
    //   Step9_3_DisableAuth
    // )

    // reset redwood toml to use standard apollo server aka not envelop
    // cy.writeFile(path.join(BASE_DIR, 'redwood.toml'), Step0_1_RedwoodToml)

    // needed because can run integration tests out of order and the GraphQL Yoga + envelop tests will overwrite the graphql function
    // cy.writeFile(
    //   path.join(BASE_DIR, 'api/src/functions/graphql.js'),
    //   Step0_2_GraphQL
    // )

    // https://redwoodjs.com/docs/tutorial/chapter1/installation

    waitForApiSide()

    cy.visit('http://localhost:8910')

    // cy.get('h1').should().contains('FOO!')
    cy.get('h1', { timeout: 10000 }).should('contain', 'Welcome to')
  })

  test_first_page()
  test_pages()
  test_layouts()
  test_dynamic()
  test_cells()
  test_routing_params()
  test_forms()
  test_saving_data()
  // test_auth_cell_failure()
})
