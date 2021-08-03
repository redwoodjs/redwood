/* eslint-disable no-undef, camelcase */
/// <reference types="cypress" />
import path from 'path'

import Step1_1_Routes from '../01-tutorial/codemods/Step1_1_Routes'
import {
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

import Step0_1_RedwoodToml from './codemods/Step0_1_RedwoodToml'
import Step0_2_GraphQL from './codemods/Step0_2_GraphQL'

const BASE_DIR = Cypress.env('RW_PATH')

describe('The Redwood Tutorial - Golden path Helix/Envelop edition', () => {
  // TODO: https://redwoodjs.com/tutorial/saving-data
  // TODO: https://redwoodjs.com/tutorial/administration
  before(() => {
    cy.exec(`cd ${BASE_DIR}; git restore . && git clean -df`, {
      failOnNonZeroExit: false,
    })
  })

  it('0. Starting Development', () => {
    // reset redwood toml to use envelop
    cy.writeFile(path.join(BASE_DIR, 'redwood.toml'), Step0_1_RedwoodToml)

    // reset graphql function to use envelop
    cy.writeFile(
      path.join(BASE_DIR, 'api/src/functions/graphql.js'),
      Step0_2_GraphQL
    )

    // https://redwoodjs.com/tutorial/installation-starting-development
    cy.writeFile(path.join(BASE_DIR, 'web/src/Routes.js'), Step1_1_Routes)
    cy.visit('http://localhost:8910')
    cy.get('[data-cy="e2e-test-splashpage"]').contains(
      `You're seeing this because you don't have any pages yet.`
    )
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
