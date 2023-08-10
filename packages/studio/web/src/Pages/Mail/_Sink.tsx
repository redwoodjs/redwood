import { Buffer } from 'buffer'

import React, { useEffect, useState } from 'react'

import { useQuery, gql } from '@apollo/client'
import {
  CodeBracketIcon,
  DocumentChartBarIcon,
  DocumentTextIcon,
  PaperClipIcon,
  TableCellsIcon,
} from '@heroicons/react/24/outline'
import {
  Card,
  Title,
  Text,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Tab,
  TabGroup,
  TabList,
  TabPanel,
  TabPanels,
  Flex,
  Divider,
  Button,
} from '@tremor/react'

import LoadingSpinner from '../../Components/LoadingSpinner'
import ErrorPanel from '../../Components/Panels/ErrorPanel'
import { LIST_POLLING_INTERVAL } from '../../util/polling'

const QUERY_GET_MAILS = gql`
  query GetMails {
    mails {
      id
      data
      envelope
      created_at
    }
  }
`

function updateIframeHeights() {
  let iframe = document.getElementById('iframe-html') as HTMLIFrameElement
  if (iframe) {
    iframe.height = `${
      (iframe.contentWindow?.document.body.scrollHeight ?? 0) + 96
    }px`
  }
  iframe = document.getElementById('iframe-text') as HTMLIFrameElement
  if (iframe) {
    iframe.height = `${
      (iframe.contentWindow?.document.body.scrollHeight ?? 0) + 96
    }px`
  }
}

function downloadAttachment(attachment: any) {
  if (attachment.content?.type !== 'Buffer') {
    prompt('Attachment content is not a buffer, cannot download')
    return
  }

  const base64Content = Buffer.from(attachment.content.data).toString('base64')
  const link = document.createElement('a')
  link.href = `data:${attachment.contentType};base64,${base64Content}`
  link.download = attachment.filename
  link.click()
}

function MailSink() {
  // state for which email id is selected
  const [selectedMail, setSelectedMail] = useState<any | undefined>()
  const [selectedTabIndex, setSelectedTabIndex] = useState<number | undefined>()

  const changeSelectedMail = (mail: any) => {
    setSelectedMail(mail)
  }

  // Update the iframe heights
  useEffect(() => {
    updateIframeHeights()
  }, [selectedMail, selectedTabIndex])

  const { loading, error, data } = useQuery(QUERY_GET_MAILS, {
    pollInterval: LIST_POLLING_INTERVAL,
  })

  if (error) {
    return <ErrorPanel error={error} />
  }

  if (loading) {
    return (
      <div className="mx-auto py-6 px-4 max-w-[97.5%] md:max-w-[90%] sm:px-6 lg:px-8 flex justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="p-6 h-full">
      <Title>Mail Sink</Title>
      <Text>
        RedwoodJS Studio serves a local SMTP server which you can use to capture
        all outgoing emails during development. You can read more about this
        feature <Button variant="light">here</Button>.
      </Text>

      {/* Inbox */}
      <Card className="mt-6 max-h-[33vh] overflow-y-auto">
        {/* TODO: Add some filtering ability */}
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Timestamp</TableHeaderCell>
              <TableHeaderCell>To</TableHeaderCell>
              <TableHeaderCell>From</TableHeaderCell>
              <TableHeaderCell className="flex-grow">Subject</TableHeaderCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {data?.mails?.map((mail: any) => (
              <TableRow
                key={mail.created_at}
                className={`${
                  selectedMail?.id === mail.id ? 'bg-gray-200' : ''
                } cursor-pointer`}
                onClick={() => changeSelectedMail(mail)}
              >
                <TableCell>
                  {new Date(mail.created_at * 1000).toLocaleString()}
                </TableCell>
                <TableCell>{mail.envelope?.rcptTo[0]?.address}</TableCell>
                <TableCell>{mail.envelope?.mailFrom?.address}</TableCell>
                <TableCell>{mail.data?.subject}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {data?.mails?.length === 0 && (
          <Text className="text-center pt-3">
            No mail have been received yet...
          </Text>
        )}
      </Card>

      {/* Mail Content */}
      {selectedMail === undefined ? (
        <Card className="mt-6 text-center">
          <Text>
            Select an email above to inspect it&apos;s contents and metadata
          </Text>
        </Card>
      ) : (
        <Card className="mt-6">
          <TabGroup onIndexChange={setSelectedTabIndex}>
            <TabList>
              <Tab icon={DocumentChartBarIcon}>HTML</Tab>
              <Tab icon={DocumentTextIcon}>Text</Tab>
              <Tab icon={TableCellsIcon}>Metadata</Tab>
              <Tab icon={PaperClipIcon}>Attachments</Tab>
              <Tab icon={CodeBracketIcon}>Raw</Tab>
            </TabList>
            <TabPanels>
              <TabPanel>
                <iframe
                  id="iframe-html"
                  className="w-full"
                  srcDoc={
                    selectedMail?.data?.html ??
                    '<body><p>Not available as HTML.</p></body>'
                  }
                  sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin"
                  // @ts-expect-error Does this propertly not exist? I thought it was a thing
                  csp="script-src 'none'"
                />
              </TabPanel>
              <TabPanel>
                <iframe
                  id="iframe-text"
                  className="w-full"
                  srcDoc={
                    selectedMail?.data?.textAsHtml
                      ? `<body>${selectedMail?.data?.textAsHtml}</body>`
                      : '<body><p>Not available as text.</p></body>'
                  }
                  sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin"
                  // @ts-expect-error Does this propertly not exist? I thought it was a thing
                  csp="script-src 'none'"
                />
              </TabPanel>
              <TabPanel>
                <Flex
                  className="w-full"
                  justifyContent="start"
                  alignItems="start"
                  flexDirection="col"
                >
                  <Title className="mt-6">General Information</Title>
                  <Text>...</Text>
                  <Divider />
                  <Title>Envelope</Title>
                  <Text>...</Text>
                  <Divider />
                  <Title>Header Lines</Title>
                  <Table className="mt-5 w-full">
                    <TableHead>
                      <TableRow>
                        <TableHeaderCell>Key</TableHeaderCell>
                        <TableHeaderCell>Line</TableHeaderCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedMail?.data.headerLines.map((entry: any) => (
                        <TableRow key={entry.key}>
                          <TableCell>{entry.key}</TableCell>
                          <TableCell>{entry.line}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <Divider />
                  <Title>Headers</Title>
                  <Text>...</Text>
                  <Divider />
                  <Title>Attachments</Title>
                  <Text>...</Text>
                </Flex>
              </TabPanel>
              <TabPanel>
                {selectedMail?.data?.attachments.length === 0 ? (
                  <Text>No attachments</Text>
                ) : (
                  <Flex
                    className="w-full"
                    justifyContent="start"
                    alignItems="start"
                    flexDirection="col"
                  >
                    <Table className="mt-5 w-full">
                      <TableHead>
                        <TableRow>
                          <TableHeaderCell>Filename</TableHeaderCell>
                          <TableHeaderCell>Content Type</TableHeaderCell>
                          <TableHeaderCell>Download Link</TableHeaderCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedMail?.data.attachments.map(
                          (attachment: any) => (
                            <TableRow key={attachment.checksum}>
                              <TableCell>{attachment.filename}</TableCell>
                              <TableCell>{attachment.contentType}</TableCell>
                              <TableCell>
                                <Button
                                  variant="light"
                                  onClick={() => {
                                    downloadAttachment(attachment)
                                  }}
                                >
                                  Download
                                </Button>
                              </TableCell>
                            </TableRow>
                          )
                        )}
                      </TableBody>
                    </Table>
                  </Flex>
                )}
              </TabPanel>
              <TabPanel>
                <pre className="w-full overflow-auto font-mono">
                  {JSON.stringify(
                    {
                      data: selectedMail.data,
                      envelope: selectedMail.envelope,
                    },
                    undefined,
                    2
                  )}
                </pre>
              </TabPanel>
            </TabPanels>
          </TabGroup>
        </Card>
      )}
    </div>
  )
}

export default MailSink
