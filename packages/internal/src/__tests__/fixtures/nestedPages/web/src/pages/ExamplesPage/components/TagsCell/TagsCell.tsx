import type { CellFailureProps, CellSuccessProps } from '@redwoodjs/web'
import { useTranslation } from 'react-i18next'
import Display from 'src/components/Tag/Display'
import useFilters from 'src/pages/ExamplesPage/components/Filters/useFilters'
import type { FindTags } from 'types/graphql'

export const QUERY = gql`
  query FindTags {
    tags {
      id
      label
    }
  }
`

export const Loading = () => <div>Loading...</div>

export const Empty = () => {
  return <></>
}

export const Failure = ({ error }: CellFailureProps) => <></>

export const Success = ({ tags }: CellSuccessProps<FindTags>) => {
  const { t } = useTranslation()
  const filters = useFilters()

  return (
    <div>
      <p className="w-full text-center text-xl">
        {t('ExamplesPage.filters.browseBy')}
      </p>
      <div
        className={'flex flex-row flex-wrap m-auto justify-center w-64 md:w-96 my-8'}
      >
        {tags.map((tag) => (
          <Display
            key={`Browse tags - ${tag.label}`}
            {...tag}
            onClick={filters.onTagClick}
          />
        ))}
      </div>
    </div>
  )
}
