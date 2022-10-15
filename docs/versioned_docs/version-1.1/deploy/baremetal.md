---
description: Have complete control by hosting your own code
---

# Introduction to Baremetal

Once you've grown beyond the confines and limitations of the cloud deployment providers, it's time to get serious: hosting your own code on big iron. Prepare for performance like you've only dreamed of! Also be prepared for IT and infrastructure responsibilities like you've only had nightmares of.

With Redwood's Baremetal deployment option, the source (like your dev machine) will SSH into one or more remote machines and execute commands in order to update your codebase, run any database migrations and restart services.

Deploying from a client (like your own development machine) consists of running a single command:

First time deploy

```bash
yarn rw deploy baremetal --first run
```

Subsequent deploys

```bash
yarn rw deploy baremetal
```

## Deployment Lifecycle

The baremetal deploy runs several commands in sequence. These can be customized, to an extent, and some of them skipped completely:

1. `git pull` - gets latest code
2. `yarn install` - installs dependencies
3. `yarn rw prisma migrate deploy` - runs db migrations
3. `yarn rw prisma generate` - generates latest Prisma Client libs
4. `yarn rw dataMigrate up` - runs data migrations, ignoring them if not installed
5. `yarn rw build` - builds the web and/or api sides
6. `yarn pm2 restart [service]` - restarts the serving process(es)

### First Run Lifecycle

If the `--first-run` flag is specified step 6. above will be skipped and the following commands will run instead:
  - `yarn pm2 start [service]` - starts the serving process(es)
  - `yarn pm2 save` - saves the running services to the deploy users config file for future startup. See [Starting on Reboot](#starting-on-reboot) for further information

> We're working on making the commands in this stack more customizable, for example `clone`ing your code instead of doing a `git pull` to avoid issues like not being able to pull because your `yarn.lock` file has changes that would be overwritten.

## Setup

Run the following to add the required config files:

```bash
yarn rw setup deploy baremetal
```

This will create a couple of files and add a dependency or two to your `package.json`:

1. `deploy.toml` contains server config for knowing which machines to connect to and which commands to run
2. `ecosystem.config.js` for [PM2](https://pm2.keymetrics.io/) to know what service(s) to monitor

> **A Note about PM2 Licensing**
>
> PM2 is licensed under [AGPL v3.0](https://opensource.org/licenses/AGPL-3.0) ([here's a plain english interpretation](https://snyk.io/learn/agpl-license/)) which may have implications for your codebase. We are not lawyers, but some interpretations of the license say that if you include any software that is AGPL v3.0 then your own codebase must be released under AGPL v3.0 as well. In the case of baremetal deploys, we not including any PM2 code in your app, just counting on the PM2 daemon to monitor your web/api services to be sure they continue running.

If you see an error from `gyp` you may need to add some additional dependencies before `yarn install` will be able to complete. See the README for `node-type` for more info: https://github.com/nodejs/node-gyp#installation

## Configuration

Before your first deply you'll need to add some configuration.

### ecosystem.config.js

By default, baremetal assumes you want to run the `yarn rw serve` command, which provides both the web and api sides. The web side will be available on port 8910 unless you update your `redwood.toml` file to make it available on another port. The default generated `ecosystem.config.js` will contain this config only, within a service called "serve":

```jsx title="ecosystem.config.js"
module.exports = {
  apps: [
    {
      name: 'serve',
      script: 'node_modules/.bin/rw',
      args: 'serve',
      instances: 'max',
      exec_mode: 'cluster',
      wait_ready: true,
      listen_timeout: 10000,
    },
  ],
}
```

If you follow our recommended config [below](#redwood-serves-api-nginx-serves-web-side), you could update this to only serve the api side, because the web side will be handled by [nginx](https://www.nginx.com/). That could look like:

```jsx title="ecosystem.config.js"
module.exports = {
  apps: [
    {
      name: 'api',
      script: 'node_modules/.bin/rw',
      args: 'serve api',
      instances: 'max',
      exec_mode: 'cluster',
      wait_ready: true,
      listen_timeout: 10000,
    },
  ],
}
```

### deploy.toml

This file contains your server configuration: which servers to connect to and which commands to run on them.

```toml title="deploy.toml"
[[servers]]
host = "server.com"
username = "user"
agentForward = true
sides = ["api","web"]
path = "/var/www/app"
processNames = ["serve"]
```

This lists a single server, providing the hostname and connection details (`username` and `agentForward`), which `sides` are hosted on this server (by default it's both web and api sides), the `path` to the app code and then which PM2 service names should be (re)started on this server.

#### Config Options

* `host` - hostname to the server
* `username` - the user to login as
* `password` - [optional] if you are using password authentication, include that here
* `privateKey` - [optional] if you connect with a private key, include the path to the key here
* `passphrase` - [optional] if your private key contains a passphrase, enter it here
* `agentForward` - [optional] if you have [agent forwarding](https://docs.github.com/en/developers/overview/using-ssh-agent-forwarding) enabled, set this to `true` and your own credentials will be used for further ssh connections from the server (like when connecting to GitHub)
* `sides` - An array of sides that will be built on this server
* `path` - The absolute path to the root of the application on the server
* `migrate` - [optional] Whether or not to run migration processes on this server, defaults to `true`
* `processNames` - An array of service names from `ecosystem.config.js` which will be (re)started on a successful deploy
* `symlinkWeb` - [optional] If using nginx or another server to serve the web side, you can have the compiled `web/dist` files symlinked in a new directory so that they are not overwritten on the next deploy. See the [Redwood Serves Api, Nginx Serves Web Side](#redwood-serves-api-nginx-serves-web-side) section for more info.

The easiest connection method is generally to include your own public key in the server's `~/.ssh/authorized_keys` file, [enable agent forwarding](https://docs.github.com/en/developers/overview/using-ssh-agent-forwarding), and then set `agentForward = true` in `deploy.toml`. This will allow you to use your own credentials when pulling code from GitHub (required for private repos). Otherwise you can create a [deploy key](https://docs.github.com/en/developers/overview/managing-deploy-keys) and keep it on the server.

> **SSH and non-interactive sessions - Possible Issues**
>
> The deployment process uses a '[non-interactive](https://tldp.org/LDP/abs/html/intandnonint.html)' ssh session to run commands on the remote server. A non-interactive session will often load a minimal amount of settings for better compatibility and speed. In some versions of Linux `.bashrc` by default does not load (by design) from a non-interactive session. This can lead to `yarn` (or other commands) not being found by the deployment script, even though they are in your path. A quick fix for this on Ubuntu is to edit the deployment users `.bashrc` and comment out the lines that stop non-interactive processing.

```shell title=".bashrc"
# If not running interactively, don't do anything
#case $- in
#    *i*) ;;
#      *) return;;
#esac
```

#### Multiple Servers

If you start horizontally scaling your application you may find it necessary to have the web and api sides served from different servers. The configuration files can accommodate this:

```toml title="deploy.toml"
[[servers]]
host = "api.server.com"
username = "user"
agentForward = true
sides = ["api"]
path = "/var/www/app"
processNames = ["api"]

[[servers]]
host = "web.server.com"
username = "user"
agentForward = true
sides = ["web"]
path = "/var/www/app"
migrate = false
processNames = ["web"]
```


```jsx title="ecosystem.config.js"
module.exports = {
  apps: [
    {
      name: 'api',
      script: 'node_modules/.bin/rw',
      args: 'serve api',
      instances: 'max',
      exec_mode: 'cluster',
      wait_ready: true,
      listen_timeout: 10000,
    },
    {
      name: 'web',
      script: 'node_modules/.bin/rw',
      args: 'serve web',
      instances: 'max',
      exec_mode: 'cluster',
      wait_ready: true,
      listen_timeout: 10000,
    },
  ],
}
```

Note the inclusion of `migrate = false` so that migrations are not run again on this server (they only need to run once and it makes sense to keep them with the api side).

You can add as many `[[servers]]` blocks as you need.

## Server Setup

You will need to log into your server and `git clone` your codebase somewhere. The path to the root of your app will be set as the `path` var in `deploy.toml`. Make sure the username you will connect as in `deploy.toml` has permission to read/write/execute files in this directory. This might look something like:

```bash
sudo mkdir -p /var/www
sudo chown myuser:myuser /var/www
git clone git@github.com:johndoe/example.git /var/www/example
```

You'll want to create an `.env` file containing any environment variables that are needed by the server.

### Verification

You should do a `yarn install` and `yarn rw build` and finally `yarn rw serve` to make sure everything works before getting the deploy process involved. If they worked for you, the deploy process should have no problem as it runs the same commands. Once `yarn rw serve` is running, make sure your processes start and are accessible (by default on port 8910):

```bash
curl http://localhost:8910
# or
wget http://localhost:8910
```

If you don't see the content of your `web/src/index.html` file then something isn't working. You'll need to fix those issues before you can deploy. Verify the api side is responding:

```bash
curl http://localhost:8910/.redwood/functions/graphql?query={redwood{version}}
# or
wget http://localhost:8910/.redwood/functions/graphql?query={redwood{version}}
```

You should see something like:

```json
{
  "data": {
    "redwood": {
      "version": "1.0.0"
    }
  }
}
```

If so then your API side is up and running! The only thing left to test is that the api side has access to the database. This call would be pretty specific to your app, but assuming you have port 8910 open to the world you could simply open a browser to click around to find a page that makes a database request.

## First Deploy

Back on your development machine, enter your details in `deploy.toml` and then try a first deploy:

```bash
yarn rw deploy baremetal --first-run
```

If there are any issues the deploy should stop and you'll see the error message printed to the console. Assume it worked, hooray! You're deployed to BAREMETAL.

### Starting on Reboot

The `pm2` service requires some system "hooks" to be installed so it can boot up using your systems service manager.  Otherwise, your services will need to be manually started again on reboot.  These steps only need to be run the first time you deploy to a machine.

1. SSH into your server as you did for the "Server Setup".  Navigate to your source folder.  For example `cd /var/www/example`
2. Run the command `yarn pm2 startup`.  You will see some output similar to the output below. See the output after "copy/paste the following command:"? You'll need to do just that: copy the command starting with `sudo` and then paste and execute it. *Note* this command uses `sudo` so you'll need the root password to the machine in order for it to complete successfully.

> The below text is an *example* output.  Yours will be different

```bash
deploy@redwood:/var/www/my-app$ yarn pm2 startup
[PM2] Init System found: systemd
[PM2] To setup the Startup Script, copy/paste the following command:
sudo env PATH=$PATH:/home/deploy/.nvm/versions/node/v17.8.0/bin /var/www/my-app/node_modules/pm2/bin/pm2 startup systemd -u deploy --hp /home/deploy
```


In this example, you would copy `sudo env PATH=$PATH:/home/deploy/.nvm/versions/node/v17.8.0/bin /var/www/my-app/node_modules/pm2/bin/pm2 startup systemd -u deploy --hp /home/deploy` and run it.

### Customizing the Deploy

If you want to speed things up you can skip one or more steps during the deploy. For example, if you have no database migrations, you can skip those steps completely:

```bash
yarn rw deploy baremetal --no-migrate
```

Run `yarn rw deploy baremetal --help` for the full list of flags. You can set them as `--migrate=false` or use the `--no-migrate` variant.

## Example Configurations

The default configuration, which requires the least amount of manual configuration, is to serve both the web and api sides, with the web side being bound to port 8910. This isn't really feasible for a general web app which should be available on port 80 (for HTTP) and/or port 443 (for HTTPS). Here are some custom configs that would enable

### Redwood Serves Web and Api Sides, Bind to Port 80

This is almost as easy as the default configuration, you just need to tell Redwood to bind to port 80. However, most *nix distributions will not allow a process to bind to ports lower than 1024 without root/sudo permissions. There is a command you can run to allow access to a specific binary (node, in this case) to bind to one of those ports anyway.

#### redwood.toml

Update the `[web]` port:

```toml title="redwood.toml"
[web]
  title = "My Application"
  // highlight-next-line
  port = 80
  apiUrl = "/.netlify/functions"
[api]
  port = 8911
[browser]
  open = true
```

#### Allow Binding to Port 80

Use the [setcap](https://man7.org/linux/man-pages/man7/capabilities.7.html) utility to provide access to lower ports by a given process:

```bash
sudo setcap CAP_NET_BIND_SERVICE=+eip $(which node)
```

Now restart your service and it should be available on port 80:

```bash
yarn pm2 restart serve
```

### Redwood Serves Api, Nginx Serves Web Side

Coming soon!
