export const APPS_STDERR_NOT_LOGGED_IN = ' ▸    Application error.'

export const APPS_SPAWN_NOT_LOGGED_IN = {
  shortMessage: 'Command failed with exit code 1: heroku apps --json',
  command: 'heroku apps --json',
  escapedCommand: 'heroku apps --json',
  exitCode: 1,
  stdout: '',
  stderr: ' ▸    Application error.',
  failed: true,
  timedOut: false,
  isCanceled: false,
  killed: false,
}

export const APPS_STDOUT_FOUND = [
  {
    acm: false,
    archived_at: null,
    buildpack_provided_description: null,
    build_stack: {
      id: '5fc4e202-3efa-40a9-9789-3e104b74cf89',
      name: 'heroku-22',
    },
    created_at: '2022-12-08T15:43:39Z',
    id: '6f58c1f8-3b64-49c9-8d71-2fa029baa935',
    git_url: 'https://git.heroku.com/redwood-dev-app.git',
    maintenance: false,
    name: 'redwood-dev-app',
    owner: {
      email: 'ryan.lewis@codingzeal.com',
      id: 'e7c50ec7-7170-4f47-9c5c-9f4f82fd56cd',
    },
    region: {
      id: '59accabd-516d-4f0e-83e6-6e3757701145',
      name: 'us',
    },
    organization: null,
    team: null,
    space: null,
    internal_routing: null,
    released_at: '2022-12-08T15:43:39Z',
    repo_size: null,
    slug_size: null,
    stack: {
      id: '5fc4e202-3efa-40a9-9789-3e104b74cf89',
      name: 'heroku-22',
    },
    updated_at: '2022-12-08T15:43:44Z',
    web_url: 'https://redwood-dev-app.herokuapp.com/',
  },
]

export const APPS_SPAWN_FOUND = {
  command: 'heroku apps --json',
  escapedCommand: 'heroku apps --json',
  exitCode: 0,
  stdout:
    '[\n  {\n    "acm": false,\n    "archived_at": null,\n    "buildpack_provided_description": null,\n    "build_stack": {\n      "id": "5fc4e202-3efa-40a9-9789-3e104b74cf89",\n      "name": "heroku-22"\n    },\n    "created_at": "2022-12-08T15:43:39Z",\n    "id": "6f58c1f8-3b64-49c9-8d71-2fa029baa935",\n    "git_url": "https://git.heroku.com/redwood-dev-app.git",\n    "maintenance": false,\n    "name": "redwood-dev-app",\n    "owner": {\n      "email": "ryan.lewis@codingzeal.com",\n      "id": "e7c50ec7-7170-4f47-9c5c-9f4f82fd56cd"\n    },\n    "region": {\n      "id": "59accabd-516d-4f0e-83e6-6e3757701145",\n      "name": "us"\n    },\n    "organization": null,\n    "team": null,\n    "space": null,\n    "internal_routing": null,\n    "released_at": "2022-12-08T15:43:39Z",\n    "repo_size": null,\n    "slug_size": null,\n    "stack": {\n      "id": "5fc4e202-3efa-40a9-9789-3e104b74cf89",\n      "name": "heroku-22"\n    },\n    "updated_at": "2022-12-08T15:43:44Z",\n    "web_url": "https://redwood-dev-app.herokuapp.com/"\n  }\n]',
  stderr: '',
  failed: false,
  timedOut: false,
  isCanceled: false,
  killed: false,
}

export const APPS_STDOUT_NONE = []

export const APPS_SPAWN_NONE = {
  command: 'heroku apps',
  escapedCommand: 'heroku apps',
  exitCode: 0,
  stdout: 'You have no apps.',
  stderr: '',
  failed: false,
  timedOut: false,
  isCanceled: false,
  killed: false,
}
