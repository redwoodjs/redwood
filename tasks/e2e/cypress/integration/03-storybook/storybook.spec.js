/* eslint-disable no-undef, camelcase */
/// <reference types="cypress" />
import path from 'path'

import Step1_1_BlogPostStory from './codemods/Step1_1_BlogPostStory'
import Step2_1_BlogPostCellMock from './codemods/Step2_1_BlogPostCellMock'
import Step2_2_BlogPostsCellMock from './codemods/Step2_2_BlogPostsCellMock'

const BASE_DIR = Cypress.env('RW_PATH')

describe(
  'Redwood Storybook Integration',
  { baseUrl: 'http://localhost:8910' },
  () => {
    // 0. Build Storybook Static Files
    before(() => {
      cy.writeFile(
        path.join(BASE_DIR, 'web/src/components/BlogPost/BlogPost.stories.js'),
        Step1_1_BlogPostStory
      )
      cy.writeFile(
        path.join(
          BASE_DIR,
          'web/src/components/BlogPostCell/BlogPostCell.mock.js'
        ),
        Step2_1_BlogPostCellMock
      )
      cy.writeFile(
        path.join(
          BASE_DIR,
          'web/src/components/BlogPostsCell/BlogPostsCell.mock.js'
        ),
        Step2_2_BlogPostsCellMock
      )

      // Slow!
      cy.exec(`cd ${BASE_DIR} || exit; yarn rw storybook --build`, {
        timeout: 300_0000,
      })
        .its('stderr')
        .should('not.contain', 'ERR!')
    })

    it('1. Component: BlogPost', () => {
      cy.visit(
        `/storybook/iframe.html?id=components-blogpost--generated&viewMode=story`
      )
      cy.get('h2 a').should('contain.text', 'First Post')
    })

    it('2. Cells: BlogPostCell and BlogPostsCell', () => {
      // BlogPostCell: Loading, Empty, Failure
      cy.visit(
        `/storybook/iframe.html?id=cells-blogpostcell--loading&viewMode=story`
      )
      cy.get('#root div').should('contain.text', 'Loading')
      cy.visit(
        `/storybook/iframe.html?id=cells-blogpostcell--empty&viewMode=story`
      )
      cy.get('#root div').should('contain.text', 'Empty')
      cy.visit(
        `/storybook/iframe.html?id=cells-blogpostcell--failure&viewMode=story`
      )
      cy.get('#root div').should('contain.text', 'Error')
      // BlogPostsCell: Success
      cy.visit(
        `/storybook/iframe.html?id=cells-blogpostscell--success&viewMode=story`
      )
      cy.get('a').eq(1).should('contain.text', 'Second Post')
    })

    it('3. Layouts: BlogLayout', () => {
      cy.visit(
        `/storybook/iframe.html?id=layouts-bloglayout--generated&viewMode=story`
      )
      cy.get('h1 a').should('contain.text', 'Redwood Blog')
      cy.get('li a').eq(1).should('contain.text', 'Contact')
    })

    it('4. Pages: AboutPage, ContactPage, and HomePage', () => {
      // About
      cy.visit(
        '/storybook/iframe.html?id=pages-aboutpage--generated&args=&viewMode=story'
      )
      cy.get('p').should('contain.text', 'This site was created')
      // Contact
      cy.visit(
        `/storybook/iframe.html?id=pages-contactpage--generated&args=&viewMode=story`
      )
      cy.get('label').eq(0).should('contain.text', 'Name')
      cy.get('button').should('contain.text', 'Save')
      // Home
      cy.visit(
        `/storybook/iframe.html?id=pages-homepage--generated&args=&viewMode=story`
      )
      cy.get('article div').eq(0).should('contain.text', 'Hello world!')
      cy.get('header h2').eq(1).should('contain.text', 'Third post')
    })
  }
)
