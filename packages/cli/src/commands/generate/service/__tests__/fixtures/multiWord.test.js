import { userProfiles } from './userProfiles'

describe('userProfiles', () => {
  scenario('returns all userProfiles', async (scenario) => {
    const result = await userProfiles()

    expect(result.length).toEqual(Object.keys(scenario.userProfile).length)
  })
})
