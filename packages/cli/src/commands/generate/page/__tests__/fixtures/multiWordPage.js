import { Link, routes } from '@redwoodjs/router'

const ContactUsPage = () => {
  return (
    <>
      <h1>ContactUsPage</h1>
      <p>Find me in "./web/src/pages/ContactUsPage/ContactUsPage.js"</p>
      <p>
        My default route is named "contactUs", link to me with `
        <Link to={routes.contactUs()}>ContactUs</Link>`
      </p>
    </>
  )
}

export default ContactUsPage
