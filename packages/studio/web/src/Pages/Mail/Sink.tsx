import { Buffer } from 'buffer'

import React, { useEffect, useMemo, useState } from 'react'

import { gql, useQuery } from '@apollo/client'
import { DocumentDuplicateIcon as DocumentDuplicateIconSolid } from '@heroicons/react/20/solid'
import {
  DocumentDuplicateIcon as DocumentDuplicationIconOutline,
  MagnifyingGlassIcon,
  PaperClipIcon,
  TableCellsIcon,
} from '@heroicons/react/24/outline'
import {
  Title,
  Text,
  Card,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Flex,
  Button,
  TableHead,
  TableHeaderCell,
  Badge,
  Tab,
} from '@tremor/react'

import MailRenderer from '../../Components/Mail/MailRenderer'
import { LIST_POLLING_INTERVAL } from '../../util/polling'

const QUERY_GET_ALL_MAILS = gql`
  query GetAllMails {
    mails {
      id
      data
      envelope
      created_at
    }
  }
`

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
  const [selectedMailID, setSelectedMailID] = useState<string | null>(null)
  const [selectedMail, setSelectedMail] = useState<any | undefined>()

  const getAllMailsQuery = useQuery(QUERY_GET_ALL_MAILS, {
    pollInterval: LIST_POLLING_INTERVAL,
  })

  const mails = useMemo(() => {
    return getAllMailsQuery.data?.mails ?? []
  }, [getAllMailsQuery.data?.mails])

  useEffect(() => {
    if (selectedMailID) {
      setSelectedMail(mails.find((mail: any) => mail.id === selectedMailID))
    }
  }, [selectedMailID, mails])

  return (
    <div className="p-6 h-full">
      <Title>Mail Sink</Title>
      <Text>
        RedwoodJS Studio serves a local SMTP server which you can use to capture
        outgoing emails in development.
      </Text>
      <Card className="mt-6">
        <Flex justifyContent="between" alignItems="center">
          <div>
            <Title>Inbox</Title>
          </div>
          <div>
            <Button
              loadingText=""
              loading={getAllMailsQuery.loading}
              disabled={getAllMailsQuery.loading}
              onClick={() => getAllMailsQuery.refetch()}
            >
              Reload
            </Button>
          </div>
        </Flex>
        <Table className="mt-3 max-h-[40vh]">
          {mails.length === 0 ? (
            <TableBody>
              <TableRow>
                <TableCell className="text-center">
                  <Text>No mails found</Text>
                </TableCell>
              </TableRow>
            </TableBody>
          ) : (
            <>
              <TableHead>
                <TableHeaderCell className="bg-white">
                  Timestamp
                </TableHeaderCell>
                <TableHeaderCell className="bg-white">Subject</TableHeaderCell>
                <TableHeaderCell className="bg-white">From</TableHeaderCell>
                <TableHeaderCell className="bg-white">To</TableHeaderCell>
                <TableHeaderCell className="bg-white">Features</TableHeaderCell>
              </TableHead>
              <TableBody>
                {mails?.map((mail: any) => {
                  const to =
                    mail.data?.to?.value?.map((entry: any) => {
                      return entry.name
                        ? `${entry.name} <${entry.address}>`
                        : entry.address
                    }) ?? []
                  const from =
                    mail.data?.from?.value?.map((entry: any) => {
                      return entry.name
                        ? `${entry.name} <${entry.address}>`
                        : entry.address
                    }) ?? []
                  const cc =
                    mail.data?.cc?.value?.map((entry: any) => {
                      return entry.name
                        ? `${entry.name} <${entry.address}>`
                        : entry.address
                    }) ?? []
                  const bcc = mail.envelope?.rcptTo
                    ?.filter((entry: any) => {
                      return (
                        !to.includes(entry.address) &&
                        !cc.includes(entry.address)
                      )
                    })
                    .map((entry: any) => {
                      return entry.address
                    })

                  const attachments = mail.data?.attachments?.value ?? []

                  return (
                    <TableRow
                      key={mail.id}
                      className={
                        mail.id === selectedMailID
                          ? 'bg-gray-300 cursor-pointer'
                          : 'cursor-pointer'
                      }
                      onClick={() => setSelectedMailID(mail.id)}
                    >
                      <TableCell>
                        {new Date(mail.created_at * 1000).toLocaleString()}
                      </TableCell>
                      <TableCell>{mail.data?.subject}</TableCell>
                      <TableCell className="truncate">
                        {from.map((entry: any) => (
                          <span key={mail.id}>{entry}</span>
                        ))}
                      </TableCell>
                      <TableCell className="truncate">
                        {to.map((entry: any) => (
                          <span key={mail.id}>{entry}</span>
                        ))}
                      </TableCell>
                      <TableCell>
                        <Flex
                          justifyContent="start"
                          alignItems="center"
                          className="space-x-1"
                        >
                          {attachments.length > 0 && (
                            <div>
                              <Badge
                                color="gray"
                                icon={PaperClipIcon}
                                tooltip="Attachment"
                              >
                                x{attachments.length}
                              </Badge>
                            </div>
                          )}
                          {bcc.length > 0 && (
                            <div>
                              <Badge
                                color="gray"
                                icon={DocumentDuplicateIconSolid}
                                tooltip="Bcc"
                              >
                                x{bcc.length}
                              </Badge>
                            </div>
                          )}
                          {cc.length > 0 && (
                            <div>
                              <Badge
                                color="gray"
                                icon={DocumentDuplicationIconOutline}
                                tooltip="Cc"
                              >
                                x{cc.length}
                              </Badge>
                            </div>
                          )}
                        </Flex>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </>
          )}
        </Table>
      </Card>
      {selectedMailID === null ? (
        <Card className="mt-6">
          <Flex
            justifyContent="center"
            alignItems="center"
            className="space-x-2"
          >
            <MagnifyingGlassIcon className="h-5 w-5" />
            <Text className="text-center">Select a mail above to inspect</Text>
          </Flex>
        </Card>
      ) : (
        <MailRenderer
          html={selectedMail?.data?.html}
          text={selectedMail?.data?.text}
          additionalTabHeaders={
            <>
              <Tab icon={TableCellsIcon}>Metadata</Tab>
              <Tab icon={PaperClipIcon}>Attachments</Tab>
            </>
          }
          additionalTabPanels={[
            <Flex
              className="mt-2 gap-y-4"
              flexDirection="col"
              justifyContent="start"
              key="_metadataPanelTab"
            >
              <div className="overflow-auto w-full">
                <pre>
                  {JSON.stringify(
                    {
                      ...selectedMail?.data,
                      html: undefined,
                      text: undefined,
                      textAsHtml: undefined,
                      attachments: undefined,
                      envelope: selectedMail?.envelope,
                    },
                    undefined,
                    2
                  )}
                </pre>
              </div>
            </Flex>,
            <Flex
              className="mt-2 overflow-auto w-full"
              flexDirection="col"
              justifyContent="start"
              key="_attachmentsPanelTab"
            >
              {(selectedMail?.data.attachments.length ?? 0) === 0 ? (
                <Text className="text-start w-full mt-2">No attachments</Text>
              ) : (
                <Table className="w-full">
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell>Filename</TableHeaderCell>
                      <TableHeaderCell>Content Type</TableHeaderCell>
                      <TableHeaderCell>Download Link</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedMail?.data.attachments.map((attachment: any) => (
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
                    ))}
                  </TableBody>
                </Table>
              )}
            </Flex>,
          ]}
        />
      )}
    </div>
  )
}

export default MailSink
