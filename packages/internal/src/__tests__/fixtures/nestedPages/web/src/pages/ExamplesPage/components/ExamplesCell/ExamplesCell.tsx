import Card, { CardVariant } from 'src/components/Card/Card'
import i18n from 'src/i18n'
import useFilters from 'src/pages/ExamplesPage/components/Filters/useFilters'
import { FindExamples } from 'types/graphql'

interface SuccessProps extends FindExamples {
  tag?: string
  variant: CardVariant
}

export const beforeQuery = (variables) => {
  return {
    variables: {
      ...variables,
      language: i18n.language,
    },
  }
}

export const QUERY = gql`
  query FindExamples($tag: String, $language: String) {
    examples(input: { tag: $tag }, language: $language) {
      id
      link
      label
      title
      subtitle
      description
      media {
        id
        src
      }
      tags {
        id
        label
      }
    }
  }
`

export const Success: React.FC<SuccessProps> = ({
  examples,
  variant = CardVariant.standard,
  tag,
  ...props
}) => {
  const { filterOn } = useFilters()

  return (
    <>
      {examples
        .filter((e) => filterOn(e, tag))
        .map((example, index) => (
          <Card
            key={`Example #${index} - #${example.id}`}
            variant={variant}
            imgProps={{ src: example?.media?.src }}
            excludeTag={tag}
            {...example}
            {...props}
          />
        ))}
    </>
  )
}
