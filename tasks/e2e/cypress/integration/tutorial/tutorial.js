/// <reference types="cypress" />
import path from 'path'

import Step2_1_PagesHome from './codemods/Step2_1_PagesHome'
import Step2_2_PagesAbout from './codemods/Step2_2_PagesAbout'
import Step3_1_LayoutsBlog from './codemods/Step3_1_LayoutsBlog'
import Step3_2_PagesHome from './codemods/Step3_2_PagesHome'
import Step3_3_PagesAbout from './codemods/Step3_3_PagesAbout'
import Step4_1_DbSchema from './codemods/Step4_1_DbSchema'
import Step5_1_ComponentsCellBlogPost from './codemods/Step5_1_ComponentsCellBlogPost'
import Step5_2_PagesHome from './codemods/Step5_2_PagesHome'

// TODO: Break these up so that they can be run individually.
const BASE_DIR = '/tmp/redwood/new-project/'

describe('The Redwood Tutorial - Golden path edition', () => {
  // TODO: https://redwoodjs.com/tutorial/routing-params
  // TODO: https://redwoodjs.com/tutorial/everyone-s-favorite-thing-to-build-forms
  // TODO: https://redwoodjs.com/tutorial/saving-data
  // TODO: https://redwoodjs.com/tutorial/administration

  it('0. Starting Development', () => {
    // https://redwoodjs.com/tutorial/installation-starting-development
    // ** NOTE ** This test can fail if the repo is not in a completely empty state.
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
    cy.get('a').contains('About').click()
    cy.get('h1').should('contain', 'AboutPage')
    cy.writeFile(
      path.join(BASE_DIR, 'web/src/pages/AboutPage/AboutPage.js'),
      Step2_2_PagesAbout
    )
    cy.get('h1').should('contain', 'AboutPage')
    cy.get('a').contains('Return home').click()
  })

  it('3. Layouts', () => {
    cy.exec(`cd ${BASE_DIR}; yarn redwood generate layout blog --force`)
    cy.writeFile(
      path.join(BASE_DIR, 'web/src/layouts/BlogLayout/BlogLayout.js'),
      Step3_1_LayoutsBlog
    )
    cy.writeFile(
      path.join(BASE_DIR, 'web/src/pages/HomePage/HomePage.js'),
      Step3_2_PagesHome
    )
    cy.get('h1 a').contains('Redwood Blog').click()
    cy.get('main').should('contain', 'Home')

    cy.writeFile(
      path.join(BASE_DIR, 'web/src/pages/AboutPage/AboutPage.js'),
      Step3_3_PagesAbout
    )
    cy.get('a').contains('About').click()
    cy.get('p').should(
      'contain',
      'This site was created to demonstrate my mastery of Redwood: Look on my works, ye mighty, and despair!'
    )
  })

  it('4. Getting Dynamic', () => {
    // https://redwoodjs.com/tutorial/getting-dynamic
    cy.writeFile(
      path.join(BASE_DIR, 'api/prisma/schema.prisma'),
      Step4_1_DbSchema
    )
    cy.exec(`rm ${BASE_DIR}/api/prisma/dev.db`, { failOnNonZeroExit: false })
    cy.exec(`cd ${BASE_DIR}; yarn rw db save --name tutorial`, {
      env: {
        DATABASE_URL: 'file:./dev.db',
        BINARY_TARGET: 'native',
      },
    })

    cy.exec(`cd ${BASE_DIR}; yarn rw db up`)
    cy.exec(`cd ${BASE_DIR}; yarn rw g scaffold post`)

    cy.visit('http://localhost:8910/posts')

    cy.get('h1').should('contain', 'Posts')
    cy.get('a').contains(' New Post').click()
    cy.get('h2').should('contain', 'New Post')

    // SAVE
    cy.get('input#title').type('First post')
    cy.get('input#body').type('Hello world!')
    cy.get('button').contains('Save').click()

    cy.get('td').contains('First post')

    // EDIT
    cy.get('a').contains('Edit').click()
    cy.get('input#body').clear().type('No, Margle the World!')
    cy.get('button').contains('Save').click()
    cy.get('td').contains('No, Margle the World!')

    // DELETE
    cy.get('a').contains('Delete').click()

    // No more posts, so it should be in the empty state.
    cy.get('div').contains('Post deleted.')

    cy.get('a').contains('Create one?').click()
    cy.get('input#title').type('Second post')
    cy.get('input#body').type('Hello world!')
    cy.get('button').contains('Save').click()
  })

  it('5. Cells', () => {
    // https://redwoodjs.com/tutorial/cells
    cy.visit('http://localhost:8910/')

    cy.exec(`cd ${BASE_DIR}; yarn rw g cell BlogPosts --force`)
    cy.writeFile(
      path.join(BASE_DIR, 'web/src/components/BlogPostsCell/BlogPostsCell.js'),
      Step5_1_ComponentsCellBlogPost
    )
    cy.writeFile(
      path.join(BASE_DIR, 'web/src/pages/HomePage/HomePage.js'),
      Step5_2_PagesHome
    )
    cy.get('main').should(
      'contain',
      '[{"title":"Second post","body":"Hello world!","__typename":"Post"}]'
    )
  })
})
