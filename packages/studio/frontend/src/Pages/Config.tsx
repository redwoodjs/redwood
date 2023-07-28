import React from 'react'

import { useQuery, gql, useMutation } from '@apollo/client'
import { ExclamationTriangleIcon } from '@heroicons/react/20/solid'
import {
  Bold,
  Button,
  Callout,
  Card,
  Divider,
  Flex,
  Italic,
  List,
  ListItem,
  Text,
  Title,
} from '@tremor/react'
import { toast } from 'react-toastify'

import LoadingSpinner from '../Components/LoadingSpinner'
import { ITEM_POLLING_INTERVAL } from '../util/polling'

const QUERY_GET_CONFIG = gql`
  query GetConfig {
    studioConfig {
      graphiql {
        endpoint
        authImpersonation {
          authProvider
          userId
          email
          roles
          jwtSecret
        }
      }
    }
  }
`

const MUTATION_RETYPE_SPANS = gql`
  mutation retypeSpans {
    retypeSpans
  }
`

const MUTATION_TRUNCATE_SPANS = gql`
  mutation truncateSpans {
    truncateSpans
  }
`

const MUTATION_TRUNCATE_MAILS = gql`
  mutation truncateMails {
    truncateMails
  }
`

function Config() {
  const getConfigQuery = useQuery(QUERY_GET_CONFIG, {
    pollInterval: ITEM_POLLING_INTERVAL,
  })

  const [executeRetypeSpansMutation, retypeSpansMutation] = useMutation(
    MUTATION_RETYPE_SPANS
  )
  async function handleRetypeSpans() {
    try {
      const success = await executeRetypeSpansMutation()
      if (success) {
        toast.success('Successfully retyped spans.')
      } else {
        toast.error('Failed to retyped spans!')
      }
    } catch (error) {
      toast.error('Failed to retyped spans!')
      console.error(error)
    }
  }

  const [executeTruncateSpansMutation, truncateSpansMutation] = useMutation(
    MUTATION_TRUNCATE_SPANS
  )
  async function handleTruncateSpans() {
    if (!confirm("This action can't be undone! Are you sure?")) {
      return
    }
    try {
      const success = await executeTruncateSpansMutation()
      if (success) {
        toast.success('Successfully truncated spans.')
      } else {
        toast.error('Failed to truncate spans!')
      }
    } catch (error) {
      toast.error('Failed to truncate spans!')
      console.error(error)
    }
  }

  const [executeTruncateMailsMutation, truncateMailsMutation] = useMutation(
    MUTATION_TRUNCATE_MAILS
  )
  async function handleTruncateMails() {
    if (!confirm("This action can't be undone! Are you sure?")) {
      return
    }
    try {
      const success = await executeTruncateMailsMutation()
      if (success) {
        toast.success('Successfully truncated mails.')
      } else {
        toast.error('Failed to truncate mails!')
      }
    } catch (error) {
      toast.error('Failed to truncate mails!')
      console.error(error)
    }
  }

  return (
    <div className="mx-auto py-6 px-4 max-w-[97.5%] md:max-w-[90%] sm:px-6 lg:px-8 flex flex-col gap-4">
      <Card className="w-full">
        <Title>Studio Configuration Settings</Title>
        <Text>
          These are the various config options the studio is currently using.
          You can update some of these values from within your `redwood.toml`
          file under the `studio` section and others you can update directly
          within the various studio webpages.
        </Text>
        <Divider />
        {getConfigQuery.error ? (
          <Callout
            className="h-12 mt-4"
            title="An Error Occurred"
            icon={ExclamationTriangleIcon}
            color="rose"
          >
            <p>{JSON.stringify(getConfigQuery.error, undefined, 2)}</p>
          </Callout>
        ) : getConfigQuery.loading ? (
          <LoadingSpinner />
        ) : (
          <List>
            <ListItem>
              <span>Auth Provider</span>
              <span>
                {getConfigQuery.data.graphiql?.authImpersonation
                  ?.authProvider ?? <Italic>Not set...</Italic>}
              </span>
            </ListItem>
            <ListItem>
              <span>Impersonated User ID</span>
              <span>
                {getConfigQuery.data.studioConfig?.graphiql?.authImpersonation
                  ?.userId ?? <Italic>Not set...</Italic>}
              </span>
            </ListItem>
            <ListItem>
              <span>Impersonated Email</span>
              <span>
                {getConfigQuery.data.studioConfig?.graphiql?.authImpersonation
                  ?.email ?? <Italic>Not set...</Italic>}
              </span>
            </ListItem>
            <ListItem>
              <span>Impersonated Roles</span>
              <span>
                {getConfigQuery.data.studioConfig?.graphiql?.authImpersonation
                  ?.roles ?? <Italic>Not set...</Italic>}
              </span>
            </ListItem>
          </List>
        )}
      </Card>
      <Card className="w-full">
        <Title>Actions</Title>
        <Text>
          These actions are available to you to trigger some backend studio
          events
        </Text>
        <Divider />
        <Flex>
          <Text>Retype Spans</Text>
          <Button
            loading={retypeSpansMutation.loading}
            loadingText="Running..."
            onClick={() => {
              handleRetypeSpans()
            }}
          >
            Execute
          </Button>
        </Flex>
        <Flex className="mt-4">
          <Text>
            Truncate Spans <Bold>[Irreversible action!]</Bold>
          </Text>
          <Button
            loading={truncateSpansMutation.loading}
            loadingText="Running..."
            onClick={() => {
              handleTruncateSpans()
            }}
            color="red"
          >
            Execute
          </Button>
        </Flex>
        <Divider />
        <Flex className="mt-4">
          <Text>
            Truncate Mails <Bold>[Irreversible action!]</Bold>
          </Text>
          <Button
            loading={truncateMailsMutation.loading}
            loadingText="Running..."
            onClick={() => {
              handleTruncateMails()
            }}
            color="red"
          >
            Execute
          </Button>
        </Flex>
      </Card>
    </div>
  )
}

export default Config
