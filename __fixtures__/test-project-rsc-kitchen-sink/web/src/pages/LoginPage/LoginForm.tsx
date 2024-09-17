'use client'

import { useEffect, useRef } from 'react'

import {
  Form,
  Label,
  TextField,
  PasswordField,
  Submit,
  FieldError,
} from '@redwoodjs/forms'
import { Link, navigate, routes } from '@redwoodjs/router'
import { toast } from '@redwoodjs/web/toast'

import { useAuth } from 'src/auth'

export const LoginForm = () => {
  const { isAuthenticated, logIn } = useAuth()

  useEffect(() => {
    if (isAuthenticated) {
      navigate(routes.profile())
    }
  }, [isAuthenticated])

  const usernameRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    usernameRef.current?.focus()
  }, [])

  const onSubmit = async (data: Record<string, string>) => {
    const response = await logIn({
      username: data.username,
      password: data.password,
    })

    if (response.message) {
      toast(response.message)
    } else if (response.error) {
      toast.error(response.error)
    } else {
      toast.success('Welcome back!')
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

      <div className="rw-forgot-link">
        <Link to={routes.forgotPassword()} className="rw-forgot-link">
          Forgot Password?
        </Link>
      </div>

      <FieldError name="password" className="rw-field-error" />

      <div className="rw-button-group">
        <Submit className="rw-button rw-button-blue">Login</Submit>
      </div>
    </Form>
  )
}
