import ShowcaseLocalizationCell from 'src/components/ShowcaseLocalization/ShowcaseLocalizationCell'

type ShowcaseLocalizationPageProps = {
  id: number
}

const ShowcaseLocalizationPage = ({ id }: ShowcaseLocalizationPageProps) => {
  return <ShowcaseLocalizationCell id={id} />
}

export default ShowcaseLocalizationPage
