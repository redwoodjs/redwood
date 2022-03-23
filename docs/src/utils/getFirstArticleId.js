import config from '../../docusaurus.config'

const { defaultSectionLandingPages } = config.customFields

function getFirstArticleId(section) {
  if (!defaultSectionLandingPages || !section) {
    return undefined
  }
  return defaultSectionLandingPages[section]
}

export default getFirstArticleId
