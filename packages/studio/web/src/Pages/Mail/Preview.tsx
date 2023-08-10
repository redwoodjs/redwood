import React, { useEffect, useState } from 'react'

import { gql, useQuery } from '@apollo/client'
import {
  Title,
  Text,
  Card,
  SearchSelect,
  SearchSelectItem,
  Col,
  Grid,
} from '@tremor/react'

// import LoadingSpinner from '../../Components/LoadingSpinner'
// import ErrorPanel from '../../Components/Panels/ErrorPanel'
import { LIST_POLLING_INTERVAL } from '../../util/polling'

const QUERY_GET_TEMPLATES_AND_RENDERERS = gql`
  query GetTemplates {
    mailTemplates {
      id
      name
    }
    mailRenderers {
      id
      name
    }
  }
`

const QUERY_GET_COMPONENT = gql`
  query GetComponent($templateId: Int!) {
    mailComponents(templateId: $templateId) {
      id
      name
      propsTemplate
    }
  }
`

function MailPreview() {
  const [selectedTemplateId, setSelectedTemplateId] = useState(0)
  const [selectedComponentId, setSelectedComponentId] = useState(0)
  const [selectedRendererId, setSelectedRendererId] = useState(0)

  const [templates, setTemplates] = useState<any[]>([])
  const [components, setComponents] = useState<any[]>([])
  const [renderers, setRenderers] = useState<any[]>([])

  const templatesAndRenderersQuery = useQuery(
    QUERY_GET_TEMPLATES_AND_RENDERERS,
    {
      pollInterval: LIST_POLLING_INTERVAL,
      fetchPolicy: 'no-cache',
    }
  )

  const componentsQuery = useQuery(QUERY_GET_COMPONENT, {
    pollInterval: LIST_POLLING_INTERVAL,
    skip: selectedTemplateId === 0,
    variables: {
      templateId: selectedTemplateId,
    },
    fetchPolicy: 'no-cache',
  })

  useEffect(() => {
    if (templatesAndRenderersQuery.data) {
      setTemplates(templatesAndRenderersQuery.data.mailTemplates)
      setRenderers(templatesAndRenderersQuery.data.mailRenderers)
    }
  }, [templatesAndRenderersQuery.data])

  useEffect(() => {
    const comps = componentsQuery.data?.mailComponents
    if (comps !== undefined) {
      setComponents(componentsQuery.data.mailComponents)
      if (comps.length < 2) {
        setSelectedComponentId(comps[0]?.id ?? 0)
      }
    }
  }, [componentsQuery.data])

  return (
    <div className="p-6 h-full">
      <Title>Mail Template Preview</Title>
      <Text>
        RedwoodJS Studio can detect your mail templates and provide an
        approximate preview of how they look when rendered.
      </Text>

      <Card className="mt-6">
        <Grid numItems={1} numItemsSm={3} numItemsLg={3} className="gap-2">
          <Col>
            <Title>Template</Title>
            <SearchSelect
              className="pt-2"
              value={selectedTemplateId.toString()}
              onValueChange={(v) => setSelectedTemplateId(parseInt(v))}
              disabled={
                templatesAndRenderersQuery.loading || templates.length < 1
              }
              placeholder={
                templatesAndRenderersQuery.loading
                  ? 'Loading...'
                  : templates.length < 1
                  ? 'No templates found'
                  : 'Select a template'
              }
            >
              {templates.length > 0 ? (
                templates.map((template: any) => (
                  <SearchSelectItem
                    key={template.id}
                    value={template.id.toString()}
                  >
                    {template.name}
                  </SearchSelectItem>
                ))
              ) : (
                <SearchSelectItem value="" />
              )}
            </SearchSelect>
          </Col>
          <Col>
            <Title>Component</Title>
            <SearchSelect
              className="pt-2"
              value={selectedComponentId.toString()}
              onValueChange={(v) => setSelectedComponentId(parseInt(v))}
              disabled={
                templatesAndRenderersQuery.loading || components.length < 1
              }
              placeholder={
                templatesAndRenderersQuery.loading
                  ? 'Loading...'
                  : components.length < 1
                  ? 'No components found'
                  : 'Select a component'
              }
            >
              {components.length > 0 ? (
                components.map((template: any) => (
                  <SearchSelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SearchSelectItem>
                ))
              ) : (
                <SearchSelectItem value="" />
              )}
            </SearchSelect>
          </Col>
          <Col>
            <Title>Renderer</Title>
            <SearchSelect
              className="pt-2"
              value={selectedRendererId.toString()}
              onValueChange={(v) => setSelectedRendererId(parseInt(v))}
              disabled={
                templatesAndRenderersQuery.loading || renderers.length < 1
              }
              placeholder={
                templatesAndRenderersQuery.loading
                  ? 'Loading...'
                  : renderers.length < 1
                  ? 'No renderers found'
                  : 'Select a renderer'
              }
            >
              {renderers.length > 0 ? (
                renderers.map((template: any) => (
                  <SearchSelectItem
                    key={template.id}
                    value={template.id.toString()}
                  >
                    {template.name}
                  </SearchSelectItem>
                ))
              ) : (
                <SearchSelectItem value="" />
              )}
            </SearchSelect>
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

      <pre className="mt-6">
        {JSON.stringify(
          {
            selectedTemplateId,
            selectedComponentId,
            selectedRendererId,
            templates,
            renderers,
            components,
          },
          undefined,
          2
        )}
      </pre>
    </div>
  )
}

export default MailPreview
