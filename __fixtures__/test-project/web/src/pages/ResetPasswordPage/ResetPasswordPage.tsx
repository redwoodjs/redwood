import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@redwoodjs/auth'
import { navigate, routes } from '@redwoodjs/router'
import { MetaTags } from '@redwoodjs/web'
import { toast, Toaster } from '@redwoodjs/web/toast'
import {
  Form,
  Label,
  PasswordField,
  Submit,
  FieldError,
} from '@redwoodjs/forms'

const ResetPasswordPage = ({ resetToken }) => {
  const { isAuthenticated, reauthenticate, validateResetToken, resetPassword } = useAuth()
  const [enabled, setEnabled] = useState(true)

  useEffect(() => {
    if (isAuthenticated) {
      navigate(routes.home())
    }
  }, [isAuthenticated])

  useEffect(() => {
    const validateToken = async () => {
      const response = await validateResetToken(resetToken)
      if (response.error) {
        setEnabled(false)
        toast.error(response.error)
      } else {
        setEnabled(true)
      }
    }
    validateToken()
  }, [])

  const passwordRef = useRef<HTMLInputElement>()
  useEffect(() => {
    passwordRef.current.focus()
  }, [])

  const onSubmit = async (data) => {
    const response = await resetPassword({
      resetToken,
      password: data.password,
    })

    if (response.error) {
      toast.error(response.error)
    } else {
      toast.success('Password changed!')
      await reauthenticate()
      navigate(routes.login())
    }
  }

  return (
    <>
      <MetaTags title="Reset Password" />

      <main className="rw-main">
        <Toaster toastOptions={{ className: 'rw-toast', duration: 6000 }} />
        <div className="rw-scaffold rw-login-container">
          <div className="rw-segment">
            <header className="rw-segment-header">
              <h2 className="rw-heading rw-heading-secondary">
                Reset Password
              </h2>
            </header>

            <div className="rw-segment-main">
              <div className="rw-form-wrapper">
                <Form onSubmit={onSubmit} className="rw-form-wrapper">
                  <div className="text-left">
                    <Label
                      name="password"
                      className="rw-label"
                      errorClassName="rw-label rw-label-error"
                    >
                      New Password
                    </Label>
                    <PasswordField
                      name="password"
                      autoComplete="new-password"
                      className="rw-input"
                      errorClassName="rw-input rw-input-error"
                      disabled={!enabled}
                      ref={passwordRef}
                      validation={{
                        required: {
                          value: true,
                          message: 'Password is required',
                        },
                      }}
                    />

                    <FieldError name="password" className="rw-field-error" />
                  </div>

                  <div className="rw-button-group">
                    <Submit
                      className="rw-button rw-button-blue"
                      disabled={!enabled}
                    >
                      Submit
                    </Submit>
                  </div>
                </Form>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}

export default ResetPasswordPage
