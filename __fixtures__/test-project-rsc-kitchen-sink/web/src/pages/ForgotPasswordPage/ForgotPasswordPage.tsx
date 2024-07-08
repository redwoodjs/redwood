import { Metadata } from '@redwoodjs/web/dist/components/Metadata'

import { ForgotPasswordForm } from './ForgotPasswordForm'
// import { Toaster } from '@redwoodjs/web/toast'

const ForgotPasswordPage = () => {
  return (
    <>
      <Metadata title="Forgot Password" />

      <main className="rw-main">
        {/* <Toaster toastOptions={{ className: 'rw-toast', duration: 6000 }} /> */}
        <div className="rw-scaffold rw-login-container">
          <div className="rw-segment">
            <header className="rw-segment-header">
              <h2 className="rw-heading rw-heading-secondary">
                Forgot Password
              </h2>
            </header>

            <div className="rw-segment-main">
              <div className="rw-form-wrapper">
                <ForgotPasswordForm />
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}

export default ForgotPasswordPage
