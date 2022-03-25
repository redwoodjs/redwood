import EditShowcaseLocalizationCell from 'src/components/ShowcaseLocalization/EditShowcaseLocalizationCell'

type ShowcaseLocalizationPageProps = {
  id: number
}

const EditShowcaseLocalizationPage = ({ id }: ShowcaseLocalizationPageProps) => {
  return <EditShowcaseLocalizationCell id={id} />
}

export default EditShowcaseLocalizationPage
