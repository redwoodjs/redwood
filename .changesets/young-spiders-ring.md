- PR title (#PR number) by @PR author

fix: Fixes Unknown Fragment issues due to GraphQL Tag type mismatch in web (#10357) by @dthyresson

  Users reported in #10322 an incompatibility with fragments and when using gql from global web. The TS errors were caused by the global web gql type not being compatible with the standard graphql-tag type.
