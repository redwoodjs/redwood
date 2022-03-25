// In this file, all Page components from 'src/pages` are auto-imported. Nested
// directories are supported, and should be uppercase. Each subdirectory will be
// prepended onto the component name.
//
// Examples:
//
// 'src/pages/HomePage/HomePage.js'         -> HomePage
// 'src/pages/Admin/BooksPage/BooksPage.js' -> AdminBooksPage

import { Private, Route, Router, Set } from '@redwoodjs/router'

import AdminLayout from 'src/layouts/AdminLayout/AdminLayout'
import MainLayout from 'src/layouts/MainLayout/MainLayout'
import ShowcaseLayout from 'src/layouts/ShowcaseLayout'

import JobsPage from 'src/pages/Jobs/JobsPage'
import JobPage from 'src/pages/Jobs/JobPage'
import NewJobPage from 'src/pages/Jobs/NewJobPage'
import EditJobPage from 'src/pages/Jobs/EditJobPage'
import JobProfilePage from 'src/pages/Jobs/JobProfilePage'
import NewJobProfilePage from 'src/pages/Jobs/NewJobProfilePage'
import EditJobProfilePage from 'src/pages/Jobs/EditJobProfilePage'
import AllJobsPage from 'src/pages/Jobs/AllJobsPage'
import AllJobProfilesPage from 'src/pages/Jobs/AllJobProfilesPage'

const Routes = () => {
  return (
    <Router>
      <Set wrap={MainLayout}>
        <Route path="/login" page={LoginPage} name="login" />
        <Route path="/signup" page={SignupPage} name="signup" />
        <Route path="/forgot-password" page={ForgotPasswordPage} name="forgotPassword" />
        <Route path="/reset-password" page={ResetPasswordPage} name="resetPassword" />
        <Route path="/examples" page={ExamplesPage} name="examples" />
        <Route path="/jobs/new" page={NewJobPage} name="newJob" />
        <Route path="/jobs/all" page={AllJobsPage} name="allJobs" />
        <Route path="/jobs/{id:Int}" page={JobPage} name="job" />
        <Route path="/jobs/{id:Int}/edit" page={EditJobPage} name="editJob" />
        <Route path="/jobs" page={JobsPage} name="jobs" />
        <Route path="/job-profiles/new" page={NewJobProfilePage} name="newJobProfile" />
        <Route path="/job-profiles/all" page={AllJobProfilesPage} name="allJobProfiles" />
        <Route path="/job-profiles/{id:Int}" page={JobProfilePage} name="jobProfile" />
        <Route path="/job-profiles/{id:Int}/edit" page={EditJobProfilePage} name="editJobProfile" />

        {/* Pre-Rendered Showcase Pages */}
        {/* <Set prerender> */}
        <Route path="/showcase" page={ShowcasePage} name="showcase" />
        <Set wrap={[ShowcaseLayout]}>
          <Route path="/showcase/snaplet" page={ShowcaseSnapletPage} name="showcaseSnaplet" />
        </Set>
        {/* </Set> */}

        <Route path="/" page={HomePage} name="home" />

        <Route notfound page={NotFoundPage} />
      </Set>

      <Private unauthenticated={'home'}>
        <Set wrap={AdminLayout} role={['translator', 'editor', 'admin']}>
          <Route path="/admin/showcase-localizations/new" page={AdminShowcaseLocalizationNewShowcaseLocalizationPage} name="newShowcaseLocalization" />
          <Route path="/admin/showcase-localizations/{id:Int}/edit" page={AdminShowcaseLocalizationEditShowcaseLocalizationPage} name="editShowcaseLocalization" />
          <Route path="/admin/showcase-localizations/{id:Int}" page={AdminShowcaseLocalizationShowcaseLocalizationPage} name="showcaseLocalization" />
          <Route path="/admin/showcase-localizations" page={AdminShowcaseLocalizationShowcaseLocalizationsPage} name="showcaseLocalizations" />
        </Set>
        <Set wrap={[AdminLayout]} role={'admin'}>
          <Route path="/admin/users/new" page={AdminUserNewUserPage} name="newUser" />
          <Route path="/admin/users/{id:Int}/edit" page={AdminUserEditUserPage} name="editUser" />
          <Route path="/admin/users/{id:Int}" page={AdminUserUserPage} name="user" />
          <Route path="/admin/users" page={AdminUserUsersPage} name="users" />
        </Set>
        <Set wrap={[AdminLayout]} role={['editor', 'admin']} private unauthenticated={'home'}>
          <Route path="/admin" page={AdminIndexPage} name="adminIndex" />
          <Route path="/admin/tags/new" page={AdminTagNewTagPage} name="newTag" />
          <Route path="/admin/tags/{id:Int}/edit" page={AdminTagEditTagPage} name="editTag" />
          <Route path="/admin/tags" page={AdminTagTagsPage} name="tags" />
          <Route path="/admin/tags/{id:Int}" page={AdminTagTagPage} name="tag" />
          <Route path="/admin/showcases/new" page={AdminShowcaseNewShowcasePage} name="newShowcase" />
          <Route path="/admin/showcases/{id:Int}/edit" page={AdminShowcaseEditShowcasePage} name="editShowcase" />
          <Route path="/admin/showcases" page={AdminShowcaseShowcasesPage} name="showcases" />
          <Route path="/admin/showcases/{id:Int}" page={AdminShowcaseShowcasePage} name="adminShowcase" />
          <Route path="/admin/authors/new" page={AdminAuthorNewAuthorPage} name="newAuthor" />
          <Route path="/admin/authors/{id:Int}/edit" page={AdminAuthorEditAuthorPage} name="editAuthor" />
          <Route path="/admin/authors/{id:Int}" page={AdminAuthorAuthorPage} name="author" />
          <Route path="/admin/authors" page={AdminAuthorAuthorsPage} name="authors" />
          <Route path="/admin/medias/new" page={AdminMediaNewMediaPage} name="newMedia" />
          <Route path="/admin/medias/{id:Int}/edit" page={AdminMediaEditMediaPage} name="editMedia" />
          <Route path="/admin/medias/{id:Int}" page={AdminMediaMediaPage} name="media" />
          <Route path="/admin/medias" page={AdminMediaMediasPage} name="medias" />
        </Set>
      </Private>
    </Router>
  )
}

export default Routes
