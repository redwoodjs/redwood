import { Link, routes } from '@redwoodjs/router'
import { MetaTags } from '@redwoodjs/web'

const ContactUsPage = () => {
  return (
    <>
      <MetaTags title="ContactUs" description="ContactUs page" />

      <h1>ContactUsPage</h1>
      <p>
        Find me in <code>./web/src/pages/ContactUsPage/ContactUsPage.tsx</code>
      </p>
      <p>
        My default route is named <code>contactUs</code>, link to me with `
        <Link to={routes.contactUs()}>ContactUs</Link>`
      </p>
    </>
  )
}

export default ContactUsPage
