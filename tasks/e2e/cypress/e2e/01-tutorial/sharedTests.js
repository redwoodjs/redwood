/* eslint-disable no-undef, camelcase */
/// <reference types="cypress" />
import path from 'path'

import 'cypress-wait-until'

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
import Step8_1_ContactPageWithoutJsEmailValidation from './codemods/Step8_1_ContactPageWithoutJsEmailValidation'
import Step8_2_CreateContactServiceValidation from './codemods/Step8_2_CreateContactServiceValidation'
import Step8_3_UpdateContactTest from './codemods/Step8_3_UpdateContactTest'
import Step9_1_RequireAuth from './codemods/Step9_1_RequireAuth'
import Step9_2_PostsRequireAuth from './codemods/Step9_2_PostsRequireAuth'
import Step9_3_DisableAuth from './codemods/Step9_3_DisableAuth'

const BASE_DIR = Cypress.env('RW_PATH')

export function waitForApiSide() {
  // Pause because chokidar `ignoreInitial` and debounce add at least 1000ms delay
  // to restarting the api-server in the e2e environment.
  cy.wait(10_000)
  cy.waitUntil(
    () =>
      cy
        .request({
          method: 'POST',
          url: 'http://localhost:8910/.redwood/functions/graphql',
          headers: {
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            query: 'query Q { redwood { version } }',
          }),
          failOnStatusCode: false,
        })
        .then((r) => {
          return r.status === 200 // The first response could be 504 or 203 (reloading api server)
        }),
    { timeout: 10_000, interval: 2_000 },
  )
}

export const test_first_page = () =>
  it('1. Our First Page', () => {
    //redwoodjs.com/docs/tutorial/chapter1/first-page
    cy.visit('http://localhost:8910')
    cy.exec(`cd ${BASE_DIR}; yarn redwood generate page home / --force`)
    cy.get('h1').should('contain', 'HomePage')
  })

export const test_pages = () =>
  it('2. A Second Page and a Link', () => {
    // https://redwoodjs.com/docs/tutorial/chapter1/second-page
    cy.exec(`cd ${BASE_DIR}; yarn redwood generate page about --force`)
    cy.writeFile(
      path.join(BASE_DIR, 'web/src/pages/HomePage/HomePage.jsx'),
      Step2_1_PagesHome,
    )
    cy.contains('About').click()
    cy.get('h1').should('contain', 'AboutPage')
    cy.writeFile(
      path.join(BASE_DIR, 'web/src/pages/AboutPage/AboutPage.jsx'),
      Step2_2_PagesAbout,
    )
    cy.get('h1').should('contain', 'Redwood Blog')
    cy.contains('Return home').click()
  })

export const test_layouts = () =>
  it('3. Layouts', () => {
    cy.exec(`cd ${BASE_DIR}; yarn redwood generate layout blog --force`)
    cy.writeFile(
      path.join(BASE_DIR, 'web/src/layouts/BlogLayout/BlogLayout.jsx'),
      Step3_1_LayoutsBlog,
    )
    cy.writeFile(path.join(BASE_DIR, 'web/src/Routes.jsx'), Step3_2_Routes)
    cy.writeFile(
      path.join(BASE_DIR, 'web/src/pages/HomePage/HomePage.jsx'),
      Step3_3_PagesHome,
    )
    cy.contains('Redwood Blog').click()
    cy.get('main').should('contain', 'Home')

    cy.writeFile(
      path.join(BASE_DIR, 'web/src/pages/AboutPage/AboutPage.jsx'),
      Step3_4_PagesAbout,
    )
    cy.contains('About').click()
    cy.get('p').should(
      'contain',
      'This site was created to demonstrate my mastery of Redwood: Look on my works, ye mighty, and despair!',
    )
  })

export const test_dynamic = () =>
  it('4. Getting Dynamic', () => {
    // https://redwoodjs.com/docs/tutorial/chapter2/getting-dynamic
    cy.writeFile(path.join(BASE_DIR, 'api/db/schema.prisma'), Step4_1_DbSchema)
    cy.exec(`rm ${BASE_DIR}/api/db/dev.db`, { failOnNonZeroExit: false })
    // need to also handle case where Prisma Client be out of sync
    cy.exec(
      `cd ${BASE_DIR}; yarn dlx rimraf ./api/db/migrations && yarn rw prisma migrate reset --skip-seed --force`,
    )
    cy.exec(`cd ${BASE_DIR}; yarn rw prisma migrate dev --name setup`)
    cy.exec(`cd ${BASE_DIR}; yarn rw g scaffold post --force`)

    // Wait for API server to be available.
    waitForApiSide()
    cy.visit('http://localhost:8910/posts')

    cy.get('h1').should('contain', 'Posts')
    cy.get('a.rw-button.rw-button-green').should(
      'have.css',
      'background-color',
      'rgb(72, 187, 120)',
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
      'rgb(49, 130, 206)',
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
  })

export const test_cells = () =>
  it('5. Cells', () => {
    cy.exec(`cd ${BASE_DIR}; yarn rw g cell BlogPosts --force`)
    cy.writeFile(
      path.join(BASE_DIR, 'web/src/components/BlogPostsCell/BlogPostsCell.jsx'),
      Step5_1_ComponentsCellBlogPost,
    )
    cy.writeFile(
      path.join(
        BASE_DIR,
        'web/src/components/BlogPostsCell/BlogPostsCell.test.jsx',
      ),
      Step5_2_ComponentsCellBlogPostTest,
    )
    cy.writeFile(
      path.join(BASE_DIR, 'web/src/pages/HomePage/HomePage.jsx'),
      Step5_3_PagesHome,
    )

    cy.visit('http://localhost:8910/')

    cy.get('main').should(
      'contain',
      // [{"title":"Second post","body":"Hello world!","__typename":"Post"}]
      '"body":"Hello world!"',
    )
  })

export const test_routing_params = () =>
  it('6. Routing Params', () => {
    // https://redwoodjs.com/docs/tutorial/chapter2/routing-params
    cy.exec(`cd ${BASE_DIR}; yarn rw g page BlogPost --force`)
    cy.exec(`cd ${BASE_DIR}; yarn rw g cell BlogPost --force`)
    cy.exec(`cd ${BASE_DIR}; yarn rw g component BlogPost --force`)

    cy.writeFile(path.join(BASE_DIR, 'web/src/Routes.jsx'), Step6_1_Routes)
    cy.writeFile(
      path.join(BASE_DIR, 'web/src/pages/BlogPostPage/BlogPostPage.jsx'),
      Step6_2_BlogPostPage,
    )
    cy.writeFile(
      path.join(BASE_DIR, 'web/src/components/BlogPostCell/BlogPostCell.jsx'),
      Step6_3_BlogPostCell,
    )
    cy.writeFile(
      path.join(
        BASE_DIR,
        'web/src/components/BlogPostCell/BlogPostCell.test.jsx',
      ),
      Step6_3_BlogPostCellTest,
    )
    cy.writeFile(
      path.join(BASE_DIR, 'web/src/components/BlogPost/BlogPost.jsx'),
      Step6_4_BlogPost,
    )
    cy.writeFile(
      path.join(BASE_DIR, 'web/src/components/BlogPost/BlogPost.test.jsx'),
      Step6_4_BlogPostTest,
    )
    cy.writeFile(
      path.join(BASE_DIR, 'web/src/components/BlogPostsCell/BlogPostsCell.jsx'),
      Step6_5_BlogPostsCell,
    )
    cy.writeFile(
      path.join(
        BASE_DIR,
        'web/src/components/BlogPostsCell/BlogPostsCell.mock.js',
      ),
      Step6_5_BlogPostsCellMock,
    )

    // Wait for API server to be available.
    waitForApiSide()
    cy.visit('http://localhost:8910/posts')

    // New entry
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

export const test_forms = () =>
  it("7. Everyone's Favorite Thing to Build: Forms", () => {
    // https://redwoodjs.com/docs/tutorial/everyone-s-favorite-thing-to-build-forms
    cy.exec(`cd ${BASE_DIR}; yarn rw g page contact --force`)
    cy.writeFile(
      path.join(BASE_DIR, 'web/src/layouts/BlogLayout/BlogLayout.jsx'),
      Step7_1_BlogLayout,
    )
    cy.writeFile(
      path.join(BASE_DIR, 'web/src/pages/ContactPage/ContactPage.jsx'),
      Step7_2_ContactPage,
    )
    cy.writeFile(path.join(BASE_DIR, 'web/src/index.css'), Step7_3_Css)
    cy.writeFile(path.join(BASE_DIR, 'web/src/Routes.jsx'), Step7_4_Routes)

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
    cy.get('#tutorial-form').submit()
    // console
    // {name: "test name", email: "foo@bar.com", message: "test message"}
  })

export const test_saving_data = () =>
  it('8. Saving Data', () => {
    // navigate back out

    // Create a CRUD contacts service
    cy.exec(`cd ${BASE_DIR}; yarn rw g sdl contact --force --crud`)

    cy.writeFile(
      path.join(BASE_DIR, 'web/src/pages/ContactPage/ContactPage.jsx'),
      Step8_1_ContactPageWithoutJsEmailValidation,
    )

    const serviceContactPath = path.join(
      BASE_DIR,
      'api/src/services/contacts/contacts.js',
    )
    cy.writeFile(serviceContactPath, Step8_2_CreateContactServiceValidation)

    cy.writeFile(
      path.join(BASE_DIR, 'api/src/services/contacts/contacts.test.js'),
      Step8_3_UpdateContactTest,
    )

    // Wait for API server to be available.
    waitForApiSide()

    cy.visit('http://localhost:8910/')

    // then get to new contact with api side validation
    cy.contains('Contact').click()

    cy.get('input#name').clear().type('test name')
    cy.get('input#email').clear().type('foo bar com')
    cy.get('textarea#message').clear().type('test message')
    cy.contains('Save').click()
    cy.contains("Can't create new contact")

    // then test saving with a valid email
    cy.get('input#email').clear().type('test@example.com')
    cy.contains('Save').click()
    cy.contains('Thank you for your submission')
  })

export const test_auth_cell_failure = () =>
  it('9. Auth - Render Cell Failure Message', () => {
    // Turn auth on.
    cy.writeFile(
      path.join(BASE_DIR, 'api/src/lib/auth.js'),
      Step9_1_RequireAuth,
    )

    cy.writeFile(
      path.join(BASE_DIR, 'api/src/services/posts/posts.js'),
      Step9_2_PostsRequireAuth,
    )

    // Wait for API server to be available.
    waitForApiSide()
    cy.visit('http://localhost:8910/posts')
    cy.contains("I'm sorry, Dave")

    // disable auth
    cy.writeFile(
      path.join(BASE_DIR, 'api/src/lib/auth.js'),
      Step9_3_DisableAuth,
    )
  })
