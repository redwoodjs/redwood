---
sidebar_label: Cognito
---

# Cognito

## Installation

The following CLI command will install required packages and generate boilerplate code and files for Redwood Projects:

```bash
yarn rw setup auth cognito
```

## Setup

Update your .env file with the following setting which can be found on your Cognito user pool's dashboard.

- `COGNITO_REGION` with the AWS region of your User pool.
- `COGNITO_USERPOOL_ID` with the User pool ID. It can be found on the main dashboard of the User pool
- `COGNITO_CLIENT_ID` with the Client ID that you have created for your Redwood app. If you don't have one you can create a new Client ID in the App Integration > App client list section.

## Usage

Cognito supports the following methods:

- email/password
- username/password

If you want to support more advanced features such as MFA, you can implement it manually by grabbing the client from the `useAuth()` hook :

```js
  const { client } = useAuth()
```
