/* eslint-disable no-undef, camelcase */
/// <reference types="cypress" />
import path from 'path'

const BASE_DIR = Cypress.env('RW_PATH')

describe('The Redwood Storybook Integration', () => {
  it('0. Run Storybook', () => {
    cy.exec(`cd ${BASE_DIR}; yarn rw storybook --no-open`, {
      timeout: 60000,
    })
      .its('code')
      .should('eq', 0)
  })
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
    cy.writeFile(
      path.join(BASE_DIR, 'web/src/pages/HomePage/HomePage.js'),
      Step3_2_PagesHome
    )
    cy.contains('Redwood Blog').click()
    cy.get('main').should('contain', 'Home')

    cy.writeFile(
      path.join(BASE_DIR, 'web/src/pages/AboutPage/AboutPage.js'),
      Step3_3_PagesAbout
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
    cy.contains(' New Post').click()
    cy.get('h2').should('contain', 'New Post')

    // SAVE
    cy.get('input#title').type('First post')
    cy.get('input#body').type('Hello world!')
    cy.get('button').contains('Save').click()

    cy.contains('Post created')

    cy.contains('Loading...').should('not.exist')

    // EDIT
    cy.contains('Edit').click()
    cy.contains('Loading...').should('not.exist')
    cy.get('h2').contains('Edit Post 1')
    cy.get('input#body').clear().type('No, Margle the World!')
    cy.get('button').contains('Save').click()
    cy.get('td').contains('No, Margle the World!')

    cy.contains('Post updated')

    // DELETE
    cy.contains('Delete').click()

    // No more posts, so it should be in the empty state.
    cy.contains('Post deleted')

    cy.contains('Create one?').click()
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
      path.join(
        BASE_DIR,
        'web/src/components/BlogPostsCell/BlogPostsCell.test.js'
      ),
      Step5_2_ComponentsCellBlogPostTest
    )
    cy.writeFile(
      path.join(BASE_DIR, 'web/src/pages/HomePage/HomePage.js'),
      Step5_3_PagesHome
    )
    cy.get('main').should(
      'contain',
      // [{"title":"Second post","body":"Hello world!","__typename":"Post"}]
      '"body":"Hello world!"'
    )
  })

  it('6. Routing Params', () => {
    // https://redwoodjs.com/tutorial/routing-params
    cy.exec(`cd ${BASE_DIR}; yarn rw g page BlogPost --force`)
    cy.exec(`cd ${BASE_DIR}; yarn rw g cell BlogPost --force`)
    cy.exec(`cd ${BASE_DIR}; yarn rw g component BlogPost --force`)

    cy.writeFile(path.join(BASE_DIR, 'web/src/Routes.js'), Step6_1_Routes)
    cy.writeFile(
      path.join(BASE_DIR, 'web/src/pages/BlogPostPage/BlogPostPage.js'),
      Step6_2_BlogPostPage
    )
    cy.writeFile(
      path.join(BASE_DIR, 'web/src/components/BlogPostCell/BlogPostCell.js'),
      Step6_3_BlogPostCell
    )
    cy.writeFile(
      path.join(
        BASE_DIR,
        'web/src/components/BlogPostCell/BlogPostCell.test.js'
      ),
      Step6_3_BlogPostCellTest
    )
    cy.writeFile(
      path.join(BASE_DIR, 'web/src/components/BlogPost/BlogPost.js'),
      Step6_4_BlogPost
    )
    cy.writeFile(
      path.join(BASE_DIR, 'web/src/components/BlogPost/BlogPost.test.js'),
      Step6_4_BlogPostTest
    )
    cy.writeFile(
      path.join(BASE_DIR, 'web/src/components/BlogPostsCell/BlogPostsCell.js'),
      Step6_5_BlogPostsCell
    )
    cy.writeFile(
      path.join(
        BASE_DIR,
        'web/src/components/BlogPostsCell/BlogPostsCell.mock.js'
      ),
      Step6_5_BlogPostsCellMock
    )

    // New entry
    cy.visit('http://localhost:8910/posts')
    cy.contains(' New Post').click()
    cy.get('input#title').type('Third post')
    cy.get('input#body').type('foo bar')
    cy.get('button').contains('Save').click()

    cy.visit('http://localhost:8910/')

    // Detail Page
    cy.contains('Second post').click()
    cy.get('main').should('contain', 'Hello world!')

    cy.visit('http://localhost:8910/')

    cy.contains('Third post').click()
    cy.get('main').should('contain', 'foo bar')
  })

  it("7. Everyone's Favorite Thing to Build: Forms", () => {
    // https://redwoodjs.com/tutorial/everyone-s-favorite-thing-to-build-forms
    cy.exec(`cd ${BASE_DIR}; yarn rw g page contact --force`)
    cy.writeFile(
      path.join(BASE_DIR, 'web/src/layouts/BlogLayout/BlogLayout.js'),
      Step7_1_BlogLayout
    )
    cy.writeFile(
      path.join(BASE_DIR, 'web/src/pages/ContactPage/ContactPage.js'),
      Step7_2_ContactPage
    )
    cy.writeFile(path.join(BASE_DIR, 'web/src/index.css'), Step7_3_Css)

    cy.contains('Contact').click()
    cy.contains('Save').click()
    cy.get('main').should('contain', 'name is required')
    cy.get('main').should('contain', 'email is required')
    cy.get('main').should('contain', 'message is required')

    cy.get('input#email').type('foo bar')
    cy.contains('Save').click()
    cy.get('main').should('contain', 'Please enter a valid email address')

    cy.get('input#name').type('test name')
    cy.get('input#email').type('foo@bar.com')
    cy.get('textarea#message').type('test message')
    cy.contains('Save').click()
    // console
    // {name: "test name", email: "foo@bar.com", message: "test message"}
  })
})
