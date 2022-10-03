import { getExecOutput, exec } from '@actions/exec'

const runAllContributors = (args) => {
  args = Array.isArray(args) ? args : [args]

  return getExecOutput('yarn', [
    'run',
    'all-contributors',
    '--config=.all-contributorsrc',
    ...args
  ], {
    cwd: './tasks/all-contributors'
  })
}

const ALL_CONTRIBUTORS_IGNORE_LIST = [
  // core team
  'agiannelli',
  'ajcwebdev',
  'alicelovescake',
  'aldonline',
  'callingmedic911',
  'cannikin',
  'dac09',
  'dthyresson',
  'forresthayes',
  'jtoar',
  'kimadeline',
  'KrisCoulson',
  'mojombo',
  'noire-munich',
  'peterp',
  'realStandal',
  'RobertBroersma',
  'simoncrypta',
  'Tobbe',
  'thedavidprice',
  'virtuoushub',

  // bots
  'codesee-maps[bot]',
  'dependabot[bot]',
  'dependabot-preview[bot]',
  'redwoodjsbot',
  'renovate[bot]',
]

const { stdout } = await runAllContributors('check')

const contributors = stdout
  .trim()
  .split('\n')[1]
  .split(',')
  .map((contributor) => contributor.trim())
  .filter(
    (contributor) => !ALL_CONTRIBUTORS_IGNORE_LIST.includes(contributor)
  )

if (contributors.length === 0) {
  console.log('No contributors to add')
} else {
  for (const contributor of contributors) {
    await runAllContributors(['add', contributor, 'code'])
  }

  await runAllContributors(['generate', '--contributorsPerLine=5'])

  await exec('git', ['config', 'user.name', 'github-actions'])
  await exec('git', ['config', 'user.email', 'github-actions@github.com'])
  await exec('git', ['commit', '-am chore: update all contributors'])
  await exec('git', ['push'])
}
