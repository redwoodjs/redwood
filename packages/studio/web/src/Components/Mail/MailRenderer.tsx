import React, { useEffect, useRef, useState } from 'react'

import {
  ComputerDesktopIcon,
  DevicePhoneMobileIcon,
  DeviceTabletIcon,
} from '@heroicons/react/20/solid'
import {
  DocumentChartBarIcon,
  DocumentTextIcon,
  CodeBracketIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline'
import {
  Text,
  Card,
  Button,
  Flex,
  Select,
  SelectItem,
  Tab,
  TabGroup,
  TabList,
  TabPanel,
  TabPanels,
  Italic,
} from '@tremor/react'

import ErrorPanel from '../Panels/ErrorPanel'

// Note: the "+2" is to account for the borders
const PREVIEW_DIMENSIONS = [
  {
    label: 'Desktop',
    width: null,
    height: null,
    icon: ComputerDesktopIcon,
  },
  {
    label: 'iPhone 12 Pro',
    width: 390 + 2,
    height: 844 + 2,
    icon: DevicePhoneMobileIcon,
  },
  {
    label: 'Pixel 5',
    width: 393 + 2,
    height: 851 + 2,
    icon: DevicePhoneMobileIcon,
  },
  {
    label: 'iPad Air',
    width: 820 + 2,
    height: 1180 + 2,
    icon: DeviceTabletIcon,
  },
  {
    label: 'Surface Pro 7',
    width: 912 + 2,
    height: 1368 + 2,
    icon: DeviceTabletIcon,
  },
]

function MailPreview({
  html,
  text,
  error,
  additionalTabHeaders,
  additionalTabPanels,
}: {
  html: string | null
  text: string | null
  error?: any
  additionalTabHeaders?: React.ReactElement
  additionalTabPanels?: React.ReactElement[]
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const [selectedTabIndex, setSelectedTabIndex] = useState(0)
  const [selectedPreviewDimension, setSelectedPreviewDimension] = useState(
    PREVIEW_DIMENSIONS[0]
  )
  const [isPreviewHorizontal, setIsPreviewHorizontal] = useState(false)
  const [iframeWidth, setIframeWidth] = useState<string>('100%')
  const [iframeHeight, setIframeHeight] = useState<string>('100%')
  const [iframeContentHeight, setIframeContentHeight] = useState<number>(0)

  useEffect(() => {
    if (selectedPreviewDimension.label === 'Desktop') {
      setIframeWidth('100%')
      setIframeHeight(`${iframeContentHeight}px`)
    } else {
      if (isPreviewHorizontal) {
        setIframeWidth(`${selectedPreviewDimension.height}px`)
        setIframeHeight(`${selectedPreviewDimension.width}px`)
      } else {
        setIframeWidth(`${selectedPreviewDimension.width}px`)
        setIframeHeight(`${selectedPreviewDimension.height}px`)
      }
    }
  }, [selectedPreviewDimension, isPreviewHorizontal, iframeContentHeight])

  // Note: I just couldn't get the iframe to resize properly on its own
  //       so I'm just going to poll and update the height if it changes
  setInterval(() => {
    setIframeContentHeight(
      (iframeRef.current?.contentWindow?.document.body?.scrollHeight ?? 0) + 82
    )
  }, 250)

  const preprocessedHTML =
    html?.replace(
      '</head>',
      "<base target='_blank'><meta http-equiv='Content-Security-Policy' content=\"script-src 'none'\"></head>"
    ) ?? ''

  if (error) {
    return (
      <div className="mt-6">
        <ErrorPanel error={error} />
      </div>
    )
  }

  return (
    <Card className="mt-6">
      <TabGroup index={selectedTabIndex} onIndexChange={setSelectedTabIndex}>
        <Flex alignItems="center" className="space-x-2">
          <TabList className="flex-1">
            <Tab icon={DocumentChartBarIcon}>HTML</Tab>
            <Tab icon={DocumentTextIcon}>Text</Tab>
            <Tab icon={CodeBracketIcon}>Raw HTML</Tab>
            {additionalTabHeaders ?? <></>}
          </TabList>
          <div className="flex justify-end space-x-2">
            <Select
              value={selectedPreviewDimension.label}
              onValueChange={(v) =>
                setSelectedPreviewDimension(
                  PREVIEW_DIMENSIONS.find((d) => d.label === v) ??
                    PREVIEW_DIMENSIONS[0]
                )
              }
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
              disabled={selectedPreviewDimension.label === 'Desktop'}
            >
              <ArrowPathIcon
                className={`h-5 w-5 ${isPreviewHorizontal ? '' : 'rotate-90'}`}
              />
            </Button>
          </div>
        </Flex>
        <TabPanels>
          <TabPanel>
            {preprocessedHTML ? (
              <div hidden={selectedTabIndex !== 0} className="overflow-auto">
                <iframe
                  ref={iframeRef}
                  className="border border-gray-600 mx-auto"
                  width={iframeWidth}
                  height={iframeHeight}
                  srcDoc={preprocessedHTML}
                  sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin"
                  // @ts-expect-error Does this propertly not exist? I thought it was a thing
                  csp="script-src 'none'"
                />
              </div>
            ) : (
              <Text className="pt-6 text-center w-full">
                <Italic>No HTML version available</Italic>
              </Text>
            )}
          </TabPanel>
          <TabPanel>
            <Flex className="mt-2 overflow-auto">
              {text ? (
                <pre>{text}</pre>
              ) : (
                <Text className="pt-6 text-center w-full">
                  <Italic>No text version available</Italic>
                </Text>
              )}
            </Flex>
          </TabPanel>
          <TabPanel>
            <Flex className="mt-2 overflow-auto">
              {html ? (
                <pre>{html}</pre>
              ) : (
                <Text className="pt-6 text-center w-full">
                  <Italic>No HTML version available</Italic>
                </Text>
              )}
            </Flex>
          </TabPanel>
          {additionalTabPanels?.map((panel, index) => (
            <TabPanel key={index}>{panel}</TabPanel>
          )) ?? <></>}
        </TabPanels>
      </TabGroup>
    </Card>
  )
}

export default MailPreview
