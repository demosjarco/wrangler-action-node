# Wrangler GitHub Action (Node Edition)

> This is a direct logic copy of [@cloudflare/wrangler-action](https://github.com/cloudflare/wrangler-action) but written in pure Node.JS without any external dependencies

Easy-to-use GitHub Action to use [Wrangler](https://developers.cloudflare.com/workers/cli-wrangler/). Makes deploying Workers, Pages or modifying R2 easy to do.

## Usage

Add `wrangler-action` to the workflow for your Workers/Pages application. The below example will publish a Worker on a `git push` to the `main` branch:

```yaml
name: Deploy

on:
    push:
        branches:
            - main

jobs:
    deploy:
        runs-on: ubuntu-latest
        name: Deploy
        steps:
            - uses: actions/checkout@v2
            - name: Publish
              uses: demosjarco/wrangler-action-node@v1
              with:
                  apiToken: ${{ secrets.CF_API_TOKEN }}
```

## Authentication

You'll need to configure Wrangler using GitHub's Secrets feature - go to "Settings -> Secrets" and add your Cloudflare API token (for help finding this, see the [Workers documentation](https://developers.cloudflare.com/workers/quickstart/#api-token)). Your API token is encrypted by GitHub, and the action won't print it into logs, so it should be safe!

With your API token set as a secret for your repository, pass it to the action in the `with` block of your workflow. Below, I've set the secret name to `CF_API_TOKEN`:

```yaml
jobs:
    deploy:
        name: Deploy
        steps:
            uses: demosjarco/wrangler-action-node@v1
            with:
                apiToken: ${{ secrets.CF_API_TOKEN }}
```

`wrangler-action` also supports using your [global API key and email](https://developers.cloudflare.com/workers/quickstart/#global-api-key) as an authentication method, although API tokens are preferred. Pass in `apiKey` and `email` to the GitHub Action to use this method:

```yaml
jobs:
    deploy:
        name: Deploy
        steps:
            uses: demosjarco/wrangler-action-node@v1
            with:
                apiKey: ${{ secrets.CF_API_KEY }}
                email: ${{ secrets.CF_EMAIL }}
```

## Configuration

If you need to install a specific version of Wrangler to use for deployment, you can also pass the input `wranglerVersion` to install a specific version of Wrangler from NPM. This should be a [SemVer](https://semver.org/)-style version number, such as `1.6.0`:

```yaml
jobs:
    deploy:
        steps:
            uses: demosjarco/wrangler-action-node@v1
            with:
                apiToken: ${{ secrets.CF_API_TOKEN }}
                wranglerVersion: '1.6.0'
```

Optionally, you can also pass a `workingDirectory` key to the action. This will allow you to specify a subdirectory of the repo to run the Wrangler command from.

```yaml
jobs:
    deploy:
        steps:
            uses: demosjarco/wrangler-action-node@v1
            with:
                apiToken: ${{ secrets.CF_API_TOKEN }}
                workingDirectory: 'subfoldername'
```

[Worker secrets](https://developers.cloudflare.com/workers/tooling/wrangler/secrets/) can be optionally passed as a new line deliminated string of names in `secrets`. Each secret name must match an environment variable name specified in the `env` attribute. Creates or replaces the value for the Worker secret using the `wrangler secret put` command.

```yaml
jobs:
    deploy:
        steps:
            uses: demosjarco/wrangler-action-node@v1
            with:
                apiToken: ${{ secrets.CF_API_TOKEN }}
                secrets: |
                    SECRET1
                    SECRET2
            env:
                SECRET1: ${{ secrets.SECRET1 }}
                SECRET2: ${{ secrets.SECRET2 }}
```

If you need to run additional shell commands before or after your command, you can specify them as input to `preCommands` (before `publish`) or `postCommands` (after `publish`). These can include additional `wrangler` commands (that is, `whoami`, `kv:key put`) or any other commands available inside the `wrangler-action` context.

```yaml
jobs:
    deploy:
        steps:
            uses: demosjarco/wrangler-action-node@v1
            with:
                apiToken: ${{ secrets.CF_API_TOKEN }}
                preCommands: echo "*** pre command ***"
                postCommands: |
                    echo "*** post commands ***"
                    wrangler kv:key put --binding=MY_KV key2 value2
                    echo "******"
```

You can use the `command` option to do specific actions such as running `wrangler whoami` against your project:

```yaml
jobs:
    deploy:
        steps:
            uses: demosjarco/wrangler-action-node@v1
            with:
                apiToken: ${{ secrets.CF_API_TOKEN }}
                command: whoami
```

## Sponsors

[![James](https://github.com/Cherry.png?size=90)](https://github.com/Cherry)[![ChainFuse](https://github.com/ChainFuse.png?size=90)](https://github.com/ChainFuse)

## More Info
See the [wiki](../../wiki) for more information
