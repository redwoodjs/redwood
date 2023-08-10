import React, { useEffect, useState } from 'react'

import { gql, useQuery } from '@apollo/client'
import {
  DocumentChartBarIcon,
  DocumentTextIcon,
} from '@heroicons/react/20/solid'
import {
  Title,
  Text,
  Card,
  SearchSelect,
  SearchSelectItem,
  Tab,
  TabGroup,
  TabList,
  TabPanel,
  TabPanels,
  TextInput,
  Col,
  Grid,
  Metric,
  Subtitle,
} from '@tremor/react'

import LoadingSpinner from '../../Components/LoadingSpinner'
import ErrorPanel from '../../Components/Panels/ErrorPanel'
import { LIST_POLLING_INTERVAL } from '../../util/polling'

const QUERY_GET_MAIL_TEMPLATES = gql`
  query GetMailTemplates {
    mailTemplateFiles {
      name
      path
      pathRelativeToProjectRoot
    }
    mailRenderers {
      id
      name
    }
  }
`

const QUERY_GET_MAIL_TEMPLATE = gql`
  query GetMailTemplate($templatePath: String!) {
    mailTemplateFileExports(templatePath: $templatePath)
  }
`

const QUERY_GET_PROPS_FOR_TEMPLATE = gql`
  query GetPropsForTemplate($templatePath: String!, $exportName: String!) {
    mailTemplateProps(templatePath: $templatePath, exportName: $exportName)
  }
`

const QUERY_GET_RENDERED_TEMPLATE = gql`
  query GetMailTemplate(
    $templatePath: String!
    $exportName: String!
    $jsonData: String
  ) {
    mailRenderTemplate(
      templatePath: $templatePath
      exportName: $exportName
      jsonData: $jsonData
    ) {
      html
      text
      error
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

// {
//   path: string,
//   name: string,
//   components: {
//     name: string,
//     dataTemplate: string,
//   }[]
// }

function MailPreview() {
  // return (
  //   <div className="py-12 sm:py-16">
  //     <div className="mx-auto max-w-7xl px-6 lg:px-8">
  //       <div className="mx-auto max-w-2xl lg:text-center">
  //         <h2 className="text-base font-semibold leading-7 text-slate-600">
  //           Coming soon...
  //         </h2>
  //         <p className="mt-2 text-3xl font-bold tracking-tight text-rich-black sm:text-4xl">
  //           Mail Template Previews
  //         </p>
  //         <p className="mt-6 text-lg leading-8 text-gray-600">
  //           Easily preview your mail templates in development so you can craft
  //           the perfect messages to your users. View any of your templates, fill
  //           in example data and see the mail right here live in studio.
  //         </p>
  //       </div>
  //     </div>
  //   </div>
  // )

  const [selectedTemplateFilepath, setSelectedTemplateFilepath] =
    useState<string>('')
  const [selectedTemplateExport, setSelectedTemplateExport] =
    useState<string>('')
  const [selectedTemplateProps, setSelectedTemplateProps] = useState<
    Record<string, string>
  >({})
  const updateSelectedTemplateProps = (key: string, value: string) => {
    setSelectedTemplateProps((prev) => ({ ...prev, [key]: value }))
  }

  const [selectedTabIndex, setSelectedTabIndex] = useState<number | undefined>()

  // Update the iframe heights
  useEffect(() => {
    updateIframeHeights()
  }, [selectedTabIndex])

  const templateFilesQuery = useQuery(QUERY_GET_MAIL_TEMPLATES, {
    pollInterval: LIST_POLLING_INTERVAL,
    fetchPolicy: 'no-cache',
  })

  const templateExportsQuery = useQuery(QUERY_GET_MAIL_TEMPLATE, {
    pollInterval: LIST_POLLING_INTERVAL,
    variables: {
      templatePath: selectedTemplateFilepath,
    },
    skip: selectedTemplateFilepath === '',
    fetchPolicy: 'no-cache',
  })

  const templatePropsQuery = useQuery(QUERY_GET_PROPS_FOR_TEMPLATE, {
    pollInterval: LIST_POLLING_INTERVAL,
    variables: {
      templatePath: selectedTemplateFilepath,
      exportName: selectedTemplateExport,
    },
    skip: selectedTemplateFilepath === '' || selectedTemplateExport === '',
    fetchPolicy: 'no-cache',
  })

  const templateRenderedQuery = useQuery(QUERY_GET_RENDERED_TEMPLATE, {
    pollInterval: LIST_POLLING_INTERVAL,
    variables: {
      templatePath: selectedTemplateFilepath,
      exportName: selectedTemplateExport,
      jsonData: JSON.stringify(selectedTemplateProps),
    },
    skip: selectedTemplateFilepath === '' || selectedTemplateExport === '',
    fetchPolicy: 'no-cache',
  })

  if (templateFilesQuery.error) {
    return <ErrorPanel error={templateFilesQuery.error} />
  }

  if (templateFilesQuery.loading) {
    return (
      <div className="mx-auto py-6 px-4 max-w-[97.5%] md:max-w-[90%] sm:px-6 lg:px-8 flex justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  const templateFiles = templateFilesQuery.data?.mailTemplateFiles ?? []
  const templateExports =
    templateExportsQuery.data?.mailTemplateFileExports ?? []

  const templateProps = templatePropsQuery.data?.mailTemplateProps ?? {}

  const renderedHTML = templateRenderedQuery.data?.mailRenderTemplate?.html
  const renderedText = templateRenderedQuery.data?.mailRenderTemplate?.text
  const renderedError = templateRenderedQuery.data?.mailRenderTemplate?.error

  return (
    <div className="p-6 h-full">
      <Title>Mail Template Preview</Title>
      <Text>
        RedwoodJS Studio can detect all your mail templates and provide previews
        of how they look when rendered.
      </Text>

      <Card className="mt-6">
        <Title>Preview Options</Title>
        <Grid numItems={1} numItemsSm={3} numItemsLg={3} className="gap-2 mt-2">
          <Col>
            <Subtitle>Template</Subtitle>
            <SearchSelect
              className="pt-2"
              value={selectedTemplateFilepath}
              onValueChange={(v) => {
                setSelectedTemplateFilepath(v)
                setSelectedTemplateExport('')
              }}
            >
              {templateFiles.map((template: any) => (
                <SearchSelectItem key={template.path} value={template.path}>
                  <Text>{template.name}</Text>
                </SearchSelectItem>
              ))}
            </SearchSelect>
          </Col>
          <Col>
            <Subtitle>Component</Subtitle>
            <SearchSelect
              className="pt-2"
              disabled={
                selectedTemplateFilepath === '' ||
                templateExports.length === 0 ||
                templateExportsQuery.loading
              }
              value={selectedTemplateExport}
              onValueChange={setSelectedTemplateExport}
            >
              {templateExports.map((template: string) => (
                <SearchSelectItem key={template} value={template}>
                  <Text>{template}</Text>
                </SearchSelectItem>
              ))}
            </SearchSelect>
          </Col>
          <Col>
            <Subtitle>Renderer</Subtitle>
          </Col>
        </Grid>
        {/* {templateProps.type !== undefined && (
          <>
            <Title className="pt-4">Data</Title>
            {templateProps.type === 'Identifier' ? (
              <textarea
                className="mt-2"
                placeholder="Component props... (JSON object)"
                onChange={(e) => {
                  try {
                    setSelectedTemplateProps(JSON.parse(e.target.value))
                  } catch (e) {
                    console.log('Could not update template props')
                  }
                }}
              />
            ) : (
              Object.entries(templateProps.fields).map(([key, value]) => (
                <TextInput
                  className="mt-2"
                  key={key}
                  placeholder={`${key} (${value})`}
                  onChange={(e) => {
                    try {
                      updateSelectedTemplateProps(
                        key,
                        JSON.parse(e.target.value)
                      )
                    } catch (e) {
                      console.log(
                        'Could not update template props with key:',
                        key
                      )
                    }
                  }}
                />
              ))
            )}
          </>
        )} */}
      </Card>

      {/* Mail Content */}
      {templateRenderedQuery.data === undefined ? (
        <Card className="mt-6 text-center">
          <Text>
            Use the dropdowns above to select a template and component to render
          </Text>
        </Card>
      ) : renderedError !== null ? (
        <ErrorPanel error={renderedError} />
      ) : (
        <Card className="mt-6">
          <TabGroup onIndexChange={setSelectedTabIndex}>
            <TabList>
              <Tab icon={DocumentChartBarIcon}>HTML</Tab>
              <Tab icon={DocumentTextIcon}>Text</Tab>
            </TabList>
            <TabPanels>
              <TabPanel>
                <iframe
                  id="iframe-html"
                  className="w-full"
                  srcDoc={
                    renderedHTML ?? '<body><p>Not available as HTML.</p></body>'
                  }
                  sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin"
                  // @ts-expect-error Does this propertly not exist? I thought it was a thing
                  csp="script-src 'none'"
                />
              </TabPanel>
              <TabPanel>
                <pre>{renderedText}</pre>
              </TabPanel>
            </TabPanels>
          </TabGroup>
        </Card>
      )}

      <pre className="mt-6">
        {JSON.stringify(templateFilesQuery.data?.mailRenderers, undefined, 2)}
      </pre>
    </div>
  )
}

export default MailPreview
