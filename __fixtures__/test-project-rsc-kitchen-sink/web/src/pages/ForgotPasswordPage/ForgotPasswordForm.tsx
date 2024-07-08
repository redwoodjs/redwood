'use client'

import { useEffect, useRef } from 'react'

import { Form, Label, TextField, Submit, FieldError } from '@redwoodjs/forms'
import { navigate, routes } from '@redwoodjs/router'
import { toast } from '@redwoodjs/web/toast'

import { useAuth } from 'src/auth'

export const ForgotPasswordForm = () => {
  const { isAuthenticated, forgotPassword } = useAuth()

  useEffect(() => {
    if (isAuthenticated) {
      navigate(routes.home())
    }
  }, [isAuthenticated])

  const usernameRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    usernameRef?.current?.focus()
  }, [])

  const onSubmit = async (data: { username: string }) => {
    const response = await forgotPassword(data.username)

    if (response.error) {
      toast.error(response.error)
    } else {
      // The function `forgotPassword.handler` in api/src/functions/auth.js has
      // been invoked, let the user know how to get the link to reset their
      // password (sent in email, perhaps?)
      toast.success(
        'A link to reset your password was sent to ' + response.email
      )
      navigate(routes.login())
    }
  }

  return (
    <Form onSubmit={onSubmit} className="rw-form-wrapper">
      <div className="text-left">
        <Label
          name="username"
          className="rw-label"
          errorClassName="rw-label rw-label-error"
        >
          Username
        </Label>
        <TextField
          name="username"
          className="rw-input"
          errorClassName="rw-input rw-input-error"
          ref={usernameRef}
          validation={{
            required: {
              value: true,
              message: 'Username is required',
            },
          }}
        />

        <FieldError name="username" className="rw-field-error" />
      </div>

      <div className="rw-button-group">
        <Submit className="rw-button rw-button-blue">Submit</Submit>
      </div>
    </Form>
  )
}
