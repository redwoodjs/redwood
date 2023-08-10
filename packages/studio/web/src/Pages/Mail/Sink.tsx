import React, { useEffect, useMemo, useRef, useState } from 'react'

import { gql, useQuery } from '@apollo/client'
import { DocumentDuplicateIcon as DocumentDuplicateIconSolid } from '@heroicons/react/20/solid'
import {
  ArrowPathIcon,
  CodeBracketIcon,
  ComputerDesktopIcon,
  DevicePhoneMobileIcon,
  DeviceTabletIcon,
  DocumentChartBarIcon,
  DocumentDuplicateIcon as DocumentDuplicationIconOutline,
  DocumentTextIcon,
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
  TabGroup,
  TabList,
  TabPanel,
  TabPanels,
  Select,
  SelectItem,
} from '@tremor/react'

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

const PREVIEW_DIMENSIONS = [
  {
    label: 'Desktop',
    width: null,
    height: null,
    icon: ComputerDesktopIcon,
  },
  {
    label: 'iPhone 12 Pro',
    width: 390,
    height: 844,
    icon: DevicePhoneMobileIcon,
  },
  {
    label: 'Pixel 5',
    width: 393,
    height: 851,
    icon: DevicePhoneMobileIcon,
  },
  {
    label: 'iPad Air',
    width: 820,
    height: 1180,
    icon: DeviceTabletIcon,
  },
  {
    label: 'Surface Pro 7',
    width: 912,
    height: 1368,
    icon: DeviceTabletIcon,
  },
]

function MailSink() {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const [selectedMailID, setSelectedMailID] = useState<string | null>(null)
  const [selectedMail, setSelectedMail] = useState<any | undefined>()
  const [selectedMailPreprocessedHTML, setSelectedMailPreprocessedHTML] =
    useState<string | undefined>()
  const [selectedTabIndex, setSelectedTabIndex] = useState(0)

  const [selectedPreviewDimensionLabel, setSelectedPreviewDimensionLabel] =
    useState<string>(PREVIEW_DIMENSIONS[0].label)
  const [selectedPreviewWidth, setSelectedPreviewWidth] = useState<
    number | null
  >(PREVIEW_DIMENSIONS[0].width)
  const [selectedPreviewHeight, setSelectedPreviewHeight] = useState<
    number | null
  >(PREVIEW_DIMENSIONS[0].height)

  const [isPreviewHorizontal, setIsPreviewHorizontal] = useState(false)

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

  useEffect(() => {
    const selectedPreviewDimension = PREVIEW_DIMENSIONS.find(
      (entry) => entry.label === selectedPreviewDimensionLabel
    )
    const width = selectedPreviewDimension?.width ?? null
    const height = selectedPreviewDimension?.height ?? null
    setSelectedPreviewWidth(isPreviewHorizontal ? height : width)
    setSelectedPreviewHeight(isPreviewHorizontal ? width : height)
  }, [selectedPreviewDimensionLabel, isPreviewHorizontal])

  useEffect(() => {
    if (selectedMail?.data?.html === undefined) {
      return
    }

    // Introduce tags to:
    // - Open links in new tab
    // - Disable scripts
    const withHeadItemsInserted = selectedMail.data.html.replace(
      '</head>',
      "<base target='_blank'><meta http-equiv='Content-Security-Policy' content=\"script-src 'none'\"></head>"
    )

    setSelectedMailPreprocessedHTML(withHeadItemsInserted)
  }, [selectedMail])

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
      <Card className="mt-6">
        {selectedMailID === null ? (
          <Flex
            justifyContent="center"
            alignItems="center"
            className="space-x-2"
          >
            <MagnifyingGlassIcon className="h-5 w-5" />
            <Text className="text-center">Select a mail above to inspect</Text>
          </Flex>
        ) : (
          <TabGroup
            index={selectedTabIndex}
            onIndexChange={setSelectedTabIndex}
          >
            <Flex alignItems="center" className="space-x-2">
              <TabList className="flex-1">
                <Tab icon={DocumentChartBarIcon}>HTML</Tab>
                <Tab icon={DocumentTextIcon}>Text</Tab>
                <Tab icon={TableCellsIcon}>Metadata</Tab>
                <Tab icon={PaperClipIcon}>Attachments</Tab>
                <Tab icon={CodeBracketIcon}>Raw Data</Tab>
              </TabList>
              <div className="flex justify-end space-x-2">
                <Select
                  value={selectedPreviewDimensionLabel}
                  onValueChange={setSelectedPreviewDimensionLabel}
                >
                  {PREVIEW_DIMENSIONS.map((entry) => (
                    <SelectItem
                      key={entry.label}
                      value={entry.label}
                      icon={entry.icon}
                    >
                      {entry.label}
                    </SelectItem>
                  ))}
                </Select>
                <Button
                  variant="secondary"
                  onClick={() => setIsPreviewHorizontal(!isPreviewHorizontal)}
                >
                  <ArrowPathIcon
                    className={`h-5 w-5 ${
                      isPreviewHorizontal ? '' : 'rotate-90'
                    }`}
                  />
                </Button>
              </div>
            </Flex>
            <TabPanels>
              <TabPanel className="flex justify-center">
                <iframe
                  hidden={selectedTabIndex !== 0}
                  ref={iframeRef}
                  className={'border border-gray-600'}
                  width={selectedPreviewWidth?.toString() ?? '100%'}
                  height={selectedPreviewHeight?.toString() ?? '100%'}
                  srcDoc={selectedMailPreprocessedHTML}
                  sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin"
                  // @ts-expect-error Does this propertly not exist? I thought it was a thing
                  csp="script-src 'none'"
                />
              </TabPanel>
              <TabPanel>
                <Flex className="mt-2 overflow-auto">
                  <pre>{selectedMail?.data.text}</pre>
                </Flex>
              </TabPanel>
              <TabPanel>
                <Flex className="mt-2">
                  <pre>metadata</pre>
                </Flex>
              </TabPanel>
              <TabPanel>
                <Flex className="mt-2">
                  <pre>
                    {JSON.stringify(
                      selectedMail?.data.attachments,
                      undefined,
                      2
                    )}
                  </pre>
                </Flex>
              </TabPanel>
              <TabPanel>
                <Flex className="mt-2 overflow-auto">
                  <pre>
                    {JSON.stringify(
                      {
                        data: selectedMail?.data,
                        envelope: selectedMail?.envelope,
                      },
                      undefined,
                      2
                    )}
                  </pre>
                </Flex>
              </TabPanel>
            </TabPanels>
          </TabGroup>
        )}
      </Card>
    </div>
  )
}

export default MailSink
