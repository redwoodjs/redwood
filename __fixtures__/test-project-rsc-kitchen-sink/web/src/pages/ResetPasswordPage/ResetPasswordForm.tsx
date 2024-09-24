'use client'

import { useEffect, useRef, useState } from 'react'

import {
  Form,
  Label,
  PasswordField,
  Submit,
  FieldError,
} from '@redwoodjs/forms'
import { navigate, routes } from '@redwoodjs/router'
import { toast } from '@redwoodjs/web/toast'

import { useAuth } from 'src/auth'

export const ResetPasswordForm = ({ resetToken }: { resetToken: string }) => {
  const { isAuthenticated, reauthenticate, validateResetToken, resetPassword } =
    useAuth()
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
  }, [resetToken, validateResetToken])

  const passwordRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    passwordRef.current?.focus()
  }, [])

  const onSubmit = async (data: Record<string, string>) => {
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
              message: 'New Password is required',
            },
          }}
        />

        <FieldError name="password" className="rw-field-error" />
      </div>

      <div className="rw-button-group">
        <Submit className="rw-button rw-button-blue" disabled={!enabled}>
          Submit
        </Submit>
      </div>
    </Form>
  )
}
