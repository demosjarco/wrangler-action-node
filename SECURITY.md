# SECURITY.md

## Security Policy

This document outlines the security procedures and general policies for the "Deploy to Cloudflare Workers with Wrangler using Node" GitHub Action.

### Supported Versions

As of the latest update to this policy, we are providing support and security updates to the following version of the action:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

### Reporting a Vulnerability

If you discover a vulnerability in the GitHub Action, please follow the guidelines provided by GitHub for privately reporting a security vulnerability. You can find these instructions at the following link: [Privately reporting a security vulnerability](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing/privately-reporting-a-security-vulnerability).

If you discover a vulnerability in `wrangler` itself, please report it directly to Cloudflare as per their instructions outlined [here](https://www.cloudflare.com/.well-known/security.txt).

### Security Aspects of the Action

1. **Authentication:** The action uses GitHub's Secrets feature for configuring Wrangler. The secrets feature allows you to store sensitive information, such as your Cloudflare API token, securely in your repository. The action also supports using your global API key and email as an authentication method, although API tokens are preferred.

2. **Log Safety:** Your API token is encrypted by GitHub, and the action won't print it into logs, so it should be safe.

3. **Worker Secrets:** Worker secrets can be optionally passed as a new line delimited string of names in `secrets`. Each secret name must match an environment variable name specified in the `env` attribute. Creates or replaces the value for the Worker secret using the `wrangler secret put` command.

4. **Additional Commands:** If you need to run additional shell commands before or after your command, you can specify them as input to `preCommands` (before `publish`) or `postCommands` (after `publish`). These can include additional `wrangler` commands or any other commands available inside the `wrangler-action` context.

5. **Event Triggers:** There are a number of possible events, like `push`, that can be used to trigger a workflow. For more details on the events available, refer to the GitHub Actions documentation.

### Regular Updates

To ensure the security of your project, it is recommended that you keep the action updated to the latest version. Regular updates ensure that you are protected from any known vulnerabilities and also gain access to any new features and improvements. You can also use the major version tag (e.g., `@v1`) as the suffix to the command to ensure that you are using the latest release within that major version. Example:
```yaml
- uses: demosjarco/wrangler-action-node@v1
```

### Additional Security Practices

For any security-related issues or inquiries not covered in this document, please refer to the general GitHub security practices and policies.

This policy will be updated as new security procedures are implemented or existing procedures are modified. Please check back regularly for any updates.
