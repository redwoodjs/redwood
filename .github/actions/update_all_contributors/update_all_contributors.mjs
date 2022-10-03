import {  getExecOutput, exec } from '@actions/exec'

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
  'peterp',
  'thedavidprice',
  'renovate[bot]',
  'jtoar',
  'dac09',
  'cannikin',
  'Tobbe',
  'dependabot[bot]',
  'dthyresson',
  'mojombo',
  'RobertBroersma',
  'kimadeline',
  'callingmedic911',
  'aldonline',
  'forresthayes',
  'simoncrypta',
  'KrisCoulson',
  'realStandal',
  'virtuoushub',
  'alicelovescake',
  'dependabot-preview[bot]',
  'ajcwebdev',
  'agiannelli',
  'codesee-maps[bot]',
  'noire-munich',
  'redwoodjsbot',
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

for (const contributor of contributors) {
  await runAllContributors(['add', contributor, 'code'])
}

await runAllContributors(['generate', '--contributorsPerLine=5'])

await exec('git', ['config', 'user.name', 'github-actions'])
await exec('git', ['config', 'user.email', 'github-actions@github.com'])
await exec('git', ['commit', '-am chore: update all contributors'])
await exec('git', ['push'])
