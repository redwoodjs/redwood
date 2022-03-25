import { useTranslation } from 'react-i18next'
import Display from 'src/components/Tag/Display'
import Context from 'src/pages/ExamplesPage/components/Filters/Context'

const Filters = () => {
  const { t } = useTranslation()

  const context = React.useContext(Context)

  const onTagClick = React.useCallback(
    (label) => {
      context.dispatch({ toggleFilter: label })
    },
    [context]
  )

  return (
    <>
      {Boolean(context.filters.tags.length) && (
        <div className={'filters'}>
          <div className="bar">
            <p className={'text-lg font-bold place-self-start'}>
              {t('ExamplesPage.filters.text')}
            </p>
            {context.filters.tags.map((tag) => (
              <Display
                key={tag}
                label={tag}
                onClick={() => {
                  onTagClick(tag)
                }}
              />
            ))}
            <div>
              <button
                type={'button'}
                className={'ml-4 button'}
                onClick={() => {
                  context.dispatch({ clear: true })
                }}
              >
                {t('ExamplesPage.filters.clear')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Filters
