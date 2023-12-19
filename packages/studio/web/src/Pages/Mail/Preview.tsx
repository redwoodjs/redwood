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

import MailRenderer from '../../Components/Mail/MailRenderer'
import { LIST_POLLING_INTERVAL } from '../../util/polling'

const QUERY_GET_TEMPLATES_COMPONENTS_AND_RENDERERS = gql`
  query GetTemplates {
    mailTemplates {
      id
      name
    }
    mailComponents {
      id
      mailTemplateId
      name
      propsTemplate
    }
    mailRenderers {
      id
      name
      isDefault
    }
  }
`

const QUERY_GET_RENDERED_MAIL = gql`
  query GetRenderedMail(
    $componentId: Int!
    $rendererId: Int!
    $propsJSON: String!
  ) {
    mailRenderedMail(
      componentId: $componentId
      rendererId: $rendererId
      propsJSON: $propsJSON
    ) {
      html
      text
      error
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

  const [templateComponents, setTemplateComponents] = useState<any[]>([])
  const [propsJSON, setPropsJSON] = useState<string>('{}')

  const templatesComponentsAndRenderersQuery = useQuery(
    QUERY_GET_TEMPLATES_COMPONENTS_AND_RENDERERS,
    {
      pollInterval: LIST_POLLING_INTERVAL,
      fetchPolicy: 'no-cache',
    }
  )

  const renderedMailQuery = useQuery(QUERY_GET_RENDERED_MAIL, {
    fetchPolicy: 'no-cache',
    variables: {
      componentId: selectedComponentId,
      rendererId: selectedRendererId,
      propsJSON,
    },
    skip:
      selectedTemplateId < 1 ||
      selectedComponentId < 1 ||
      selectedRendererId < 1,
    pollInterval: 2000,
  })

  useEffect(() => {
    if (templatesComponentsAndRenderersQuery.data) {
      setTemplates(templatesComponentsAndRenderersQuery.data.mailTemplates)
      setComponents(templatesComponentsAndRenderersQuery.data.mailComponents)
      setRenderers(templatesComponentsAndRenderersQuery.data.mailRenderers)
    }
  }, [templatesComponentsAndRenderersQuery.data])

  useEffect(() => {
    if (renderers.length === 1) {
      setSelectedRendererId(renderers[0].id)
    } else if (selectedRendererId < 1) {
      // Get the default renderer
      const defaultRenderer = renderers.find((r) => r.isDefault)
      if (defaultRenderer) {
        setSelectedRendererId(defaultRenderer.id)
      }
    }
  }, [renderers, selectedRendererId])

  useEffect(() => {
    if (selectedTemplateId > 0) {
      const validComponents = components.filter(
        (c) => c.mailTemplateId === selectedTemplateId
      )
      setTemplateComponents(validComponents)
      if (validComponents.length === 1) {
        setSelectedComponentId(validComponents[0].id)
      } else {
        setSelectedComponentId(0)
      }
    }
  }, [selectedTemplateId, components])

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
                templatesComponentsAndRenderersQuery.loading ||
                templates.length < 1
              }
              placeholder={
                templatesComponentsAndRenderersQuery.loading
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
                templatesComponentsAndRenderersQuery.loading ||
                templateComponents.length < 2 ||
                selectedTemplateId < 1
              }
              placeholder={
                templatesComponentsAndRenderersQuery.loading
                  ? 'Loading...'
                  : selectedTemplateId < 1
                  ? 'Select a template'
                  : templateComponents.length < 1
                  ? 'No components found in this template'
                  : 'Select a component'
              }
            >
              {templateComponents.length > 0 ? (
                templateComponents.map((template: any) => (
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
            <Title>Renderer</Title>
            <SearchSelect
              className="pt-2"
              value={selectedRendererId.toString()}
              onValueChange={(v) => setSelectedRendererId(parseInt(v))}
              disabled={
                templatesComponentsAndRenderersQuery.loading ||
                renderers.length < 2
              }
              placeholder={
                templatesComponentsAndRenderersQuery.loading
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
            {/* TODO: Add renderer options modal? */}
          </Col>
          {selectedComponentId > 0 &&
            components.find((c) => c.id === selectedComponentId)
              ?.propsTemplate && (
              <Col numColSpan={1} numColSpanSm={3} numColSpanLg={3}>
                <Title>Props</Title>
                <textarea
                  className="w-full h-24"
                  placeholder={
                    components.find((c) => c.id === selectedComponentId)
                      ?.propsTemplate
                  }
                  onChange={(e) => setPropsJSON(e.target.value)}
                />
              </Col>
            )}
        </Grid>
      </Card>

      <MailRenderer
        html={renderedMailQuery.data?.mailRenderedMail?.html}
        text={renderedMailQuery.data?.mailRenderedMail?.text}
        error={renderedMailQuery.data?.mailRenderedMail?.error}
      />
    </div>
  )
}

export default MailPreview
