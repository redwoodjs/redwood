'use client'

import { useEffect, useRef } from 'react'

import {
  Form,
  Label,
  TextField,
  PasswordField,
  FieldError,
  Submit,
} from '@redwoodjs/forms'
import { navigate, routes } from '@redwoodjs/router'
import { toast } from '@redwoodjs/web/toast'

import { useAuth } from 'src/auth'

export const SignupForm = () => {
  const { isAuthenticated, signUp } = useAuth()

  useEffect(() => {
    if (isAuthenticated) {
      navigate(routes.home())
    }
  }, [isAuthenticated])

  // focus on username box on page load
  const usernameRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    usernameRef.current?.focus()
  }, [])

  const onSubmit = async (data: Record<string, string>) => {
    const response = await signUp({
      username: data.username,
      password: data.password,
    })

    if (response.message) {
      toast(response.message)
    } else if (response.error) {
      toast.error(response.error)
    } else {
      // user is signed in automatically
      toast.success('Welcome!')
    }
  }

  return (
    <Form onSubmit={onSubmit} className="rw-form-wrapper">
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

      <Label
        name="password"
        className="rw-label"
        errorClassName="rw-label rw-label-error"
      >
        Password
      </Label>
      <PasswordField
        name="password"
        className="rw-input"
        errorClassName="rw-input rw-input-error"
        autoComplete="current-password"
        validation={{
          required: {
            value: true,
            message: 'Password is required',
          },
        }}
      />
      <FieldError name="password" className="rw-field-error" />

      <div className="rw-button-group">
        <Submit className="rw-button rw-button-blue">Sign Up</Submit>
      </div>
    </Form>
  )
}
