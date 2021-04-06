/* eslint-disable no-undef, camelcase */
/// <reference types="cypress" />
import path from 'path'

import Step1_1_Routes from './codemods/Step1_1_Routes'
import Step2_1_PagesHome from './codemods/Step2_1_PagesHome'
import Step2_2_PagesAbout from './codemods/Step2_2_PagesAbout'
import Step3_1_LayoutsBlog from './codemods/Step3_1_LayoutsBlog'
import Step3_2_Routes from './codemods/Step3_2_Routes'
import Step3_3_PagesHome from './codemods/Step3_3_PagesHome'
import Step3_4_PagesAbout from './codemods/Step3_4_PagesAbout'
import Step4_1_DbSchema from './codemods/Step4_1_DbSchema'
import Step5_1_ComponentsCellBlogPost from './codemods/Step5_1_ComponentsCellBlogPost'
import Step5_2_ComponentsCellBlogPostTest from './codemods/Step5_2_ComponentsCellBlogPostTest'
import Step5_3_PagesHome from './codemods/Step5_3_PagesHome'
import Step6_1_Routes from './codemods/Step6_1_Routes'
import Step6_2_BlogPostPage from './codemods/Step6_2_BlogPostPage'
import Step6_3_BlogPostCell from './codemods/Step6_3_BlogPostCell'
import Step6_3_BlogPostCellTest from './codemods/Step6_3_BlogPostCellTest'
import Step6_4_BlogPost from './codemods/Step6_4_BlogPost'
import Step6_4_BlogPostTest from './codemods/Step6_4_BlogPostTest'
import Step6_5_BlogPostsCell from './codemods/Step6_5_BlogPostsCell'
import Step6_5_BlogPostsCellMock from './codemods/Step6_5_BlogPostsCellMock'
import Step7_1_BlogLayout from './codemods/Step7_1_BlogLayout'
import Step7_2_ContactPage from './codemods/Step7_2_ContactPage'
import Step7_3_Css from './codemods/Step7_3_Css'
import Step7_4_Routes from './codemods/Step7_4_Routes'

const BASE_DIR = Cypress.env('RW_PATH')

describe('The Redwood Tutorial - Golden path edition', () => {
  // TODO: https://redwoodjs.com/tutorial/saving-data
  // TODO: https://redwoodjs.com/tutorial/administration

  it('0. Starting Development', () => {
    // https://redwoodjs.com/tutorial/installation-starting-development
    cy.writeFile(path.join(BASE_DIR, 'web/src/Routes.js'), Step1_1_Routes)
    cy.visit('http://localhost:8910')
    cy.get('h1 > span').contains('Welcome to RedwoodJS!')
  })

  it('1. Our First Page', () => {
    //redwoodjs.com/tutorial/our-first-page
    cy.visit('http://localhost:8910')
    cy.exec(`cd ${BASE_DIR}; yarn redwood generate page home / --force`)
    cy.get('h1').should('contain', 'HomePage')
  })

  it('2. A Second Page and a Link', () => {
    // https://redwoodjs.com/tutorial/a-second-page-and-a-link
    cy.exec(`cd ${BASE_DIR}; yarn redwood generate page about --force`)
    cy.writeFile(
      path.join(BASE_DIR, 'web/src/pages/HomePage/HomePage.js'),
      Step2_1_PagesHome
    )
    cy.contains('About').click()
    cy.get('h1').should('contain', 'AboutPage')
    cy.writeFile(
      path.join(BASE_DIR, 'web/src/pages/AboutPage/AboutPage.js'),
      Step2_2_PagesAbout
    )
    cy.get('h1').should('contain', 'AboutPage')
    cy.contains('Return home').click()
  })

  it('3. Layouts', () => {
    cy.exec(`cd ${BASE_DIR}; yarn redwood generate layout blog --force`)
    cy.writeFile(
      path.join(BASE_DIR, 'web/src/layouts/BlogLayout/BlogLayout.js'),
      Step3_1_LayoutsBlog
    )
    cy.writeFile(path.join(BASE_DIR, 'web/src/Routes.js'), Step3_2_Routes)
    cy.writeFile(
      path.join(BASE_DIR, 'web/src/pages/HomePage/HomePage.js'),
      Step3_3_PagesHome
    )
    cy.contains('Redwood Blog').click()
    cy.get('main').should('contain', 'Home')

    cy.writeFile(
      path.join(BASE_DIR, 'web/src/pages/AboutPage/AboutPage.js'),
      Step3_4_PagesAbout
    )
    cy.contains('About').click()
    cy.get('p').should(
      'contain',
      'This site was created to demonstrate my mastery of Redwood: Look on my works, ye mighty, and despair!'
    )
  })

  it('4. Getting Dynamic', () => {
    // https://redwoodjs.com/tutorial/getting-dynamic
    cy.writeFile(path.join(BASE_DIR, 'api/db/schema.prisma'), Step4_1_DbSchema)
    cy.exec(`rm ${BASE_DIR}/api/db/dev.db`, { failOnNonZeroExit: false })
    // need to also handle case where Prisma Client be out of sync
    cy.exec(
      `cd ${BASE_DIR}; yarn rimraf ./api/db/migrations && yarn rw prisma migrate reset --skip-seed --force`
    )
    cy.exec(`cd ${BASE_DIR}; yarn rw prisma migrate dev`)

    cy.exec(`cd ${BASE_DIR}; yarn rw g scaffold post --force`)

    cy.visit('http://localhost:8910/posts')

    cy.get('h1').should('contain', 'Posts')
    cy.get('a.rw-button.rw-button-green').should(
      'have.css',
      'background-color',
      'rgb(72, 187, 120)'
    )
    cy.contains(' New Post').click()
    cy.get('h2').should('contain', 'New Post')

    // SAVE
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

    cy.contains('Loading...').should('not.exist')
    //checks Toast messages
    cy.get('div[role="status"]').contains('Post created')

    // EDIT
    cy.contains('Edit').click()
    cy.contains('Loading...').should('not.exist')
    cy.get('h2').contains('Edit Post 1')
    cy.get('input#body').clear().type('No, Margle the World!')
    cy.get('button').contains('Save').click()
    cy.get('td').contains('No, Margle the World!')
    cy.get('div[role="status"]').contains('Post updated')

    cy.contains('Post updated')

    // DELETE
    cy.contains('Delete').click()

    // No more posts, so it should be in the empty state.
    cy.contains('Post deleted')
    cy.get('div[role="status"]').contains('Post deleted')

    cy.contains('Create one?').click()
    cy.get('input#title').type('Second post')
    cy.get('input#body').type('Hello world!')
    cy.get('button').contains('Save').click()

    cy.visit('http://localhost:8910/')
  })
})
