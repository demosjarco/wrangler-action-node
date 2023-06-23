import * as core from '@actions/core';
import * as github from '@actions/github';

import path from 'node:path';
import { exec, spawn } from 'node:child_process';

class Wrangler {
	private API_CREDENTIALS: string = '';
	private workingDirectory: string = this.setupWorkingDirectory(core.getInput('workingDirectory'));
	private WRANGLER_VERSION: number = 2;

	private CF_API_TOKEN?: string;
	private CLOUDFLARE_API_TOKEN?: string;
	private CF_EMAIL?: string;
	private CF_API_KEY?: string;
	private CF_ACCOUNT_ID?: string;
	private CLOUDFLARE_ACCOUNT_ID?: string;

	constructor() {
		this.authenticationSetup(core.getInput('apiToken'), core.getInput('apiKey'), core.getInput('email'), core.getInput('accountId'));
	}

	public async main() {
		await this.installWrangler(core.getInput('wranglerVersion'));
		await this.execute_commands(core.getMultilineInput('preCommands'));
		await this.putSecrets(core.getMultilineInput('secrets'), core.getInput('environment'));
		// TODO
		await this.execute_commands(core.getMultilineInput('postCommands'));
	}

	private setupWorkingDirectory(workingDirectory: string = ''): string {
		let normalizedPath: string = '';
		try {
			normalizedPath = path.normalize(workingDirectory);
		} catch (error) {
			console.error(workingDirectory, 'not a valid path', error);
			console.warn('Ignoring `workingDirectory` and using current directory');
			normalizedPath = path.normalize('');
		}

		return normalizedPath;
	}

	private installWrangler(version: string): Promise<void> {
		let packageName = 'wrangler';
		let versionToUse = '';

		if (version.length === 0) {
			// If no Wrangler version is specified install v2.
		} else if (version.startsWith('1')) {
			// If Wrangler version starts with 1 then install wrangler v1
			packageName = '@cloudflare/wrangler';
			versionToUse = `@${version}`;
			this.WRANGLER_VERSION = 1;
		} else {
			// Else install Wrangler 2
			versionToUse = `@${version}`;
			this.WRANGLER_VERSION = 2;
		}

		const command = `npm install --save-dev ${packageName}${versionToUse}`;
		console.info(command);
		return new Promise((resolve, reject) => {
			exec(command, { cwd: this.workingDirectory, env: process.env }, (error, stdout, stderr) => {
				if (error) {
					console.error(error);
					core.setFailed(error.message);
					reject(error);
				}
				console.log(stdout);
				resolve();
			});
		});
	}

	private authenticationSetup(INPUT_APITOKEN: string, INPUT_APIKEY: string, INPUT_EMAIL: string, INPUT_ACCOUNTID: string) {
		// If an API token is detected as input
		if (INPUT_APITOKEN.length !== 0) {
			// Wrangler v1 uses CF_API_TOKEN but v2 uses CLOUDFLARE_API_TOKEN
			if (this.WRANGLER_VERSION === 1) {
				this.CF_API_TOKEN = INPUT_APITOKEN;
			} else {
				this.CLOUDFLARE_API_TOKEN = INPUT_APITOKEN;
			}

			this.API_CREDENTIALS = 'API Token';
		}

		// If an API key and email are detected as input
		if (INPUT_APIKEY.length !== 0 && INPUT_EMAIL.length !== 0) {
			if (this.WRANGLER_VERSION === 1) {
				this.CF_EMAIL = INPUT_EMAIL;
				this.CF_API_KEY = INPUT_APIKEY;
			} else {
				const errorMsg = '::error::Wrangler v2 does not support using the API Key. You should instead use an API token.';
				core.setFailed(errorMsg);
				throw new Error(errorMsg);
			}

			this.API_CREDENTIALS = 'Email and API Key';
		}

		if (INPUT_ACCOUNTID.length !== 0) {
			if (this.WRANGLER_VERSION === 1) {
				this.CF_ACCOUNT_ID = INPUT_ACCOUNTID;
			} else {
				this.CLOUDFLARE_ACCOUNT_ID = INPUT_ACCOUNTID;
			}
		}

		if (INPUT_APIKEY.length !== 0 && INPUT_EMAIL.length === 0) {
			console.warn("Provided an API key without an email for authentication. Please pass in 'apiKey' and 'email' to the action.");
		}

		if (INPUT_APIKEY.length === 0 && INPUT_EMAIL.length !== 0) {
			core.setFailed("Provided an email without an API key for authentication. Please pass in 'apiKey' and 'email' to the action.");
		}

		if (this.API_CREDENTIALS.length === 0) {
			core.setFailed("Unable to find authentication details. Please pass in an 'apiToken' as an input to the action, or a legacy 'apiKey' and 'email'.");
		} else {
			console.log(`Using ${this.API_CREDENTIALS} authentication`);
		}
	}

	private execute_commands(commands: string[]): Promise<void> {
		// Global promise to safely wait for all subcommands to finish
		return new Promise<void>(async (mainResolve, mainReject) => {
			let childError = false;
			for (const command of commands) {
				// Print out command before running
				console.info(`$ Running: ${command}`);
				// Promise to wait for subcommand to finish before moving to next
				await new Promise<void>((childResolve, childReject) => {
					exec(command, { cwd: this.workingDirectory, env: process.env }, (error, stdout, stderr) => {
						if (error) {
							childError = true;
							console.error(error);
							core.setFailed(error.message);
							childReject(error);
						}
						console.log(stdout);
						childResolve();
					});
				});
			}
			if (childError) {
				core.setFailed('command failure');
				mainReject();
			} else {
				mainResolve();
			}
		});
	}

	private putSecrets(INPUT_SECRETS: string[], INPUT_ENVIRONMENT: string): Promise<void> {
		return new Promise<void>(async (mainResolve, mainReject) => {
			let childError = false;
			for (const secret of INPUT_SECRETS) {
				let VALUE: string;
				if (process.env[secret] && process.env[secret]?.length !== 0) {
					VALUE = process.env[secret]!;
				} else {
					this.secret_not_found(secret);
					mainReject();
				}

				if (INPUT_ENVIRONMENT.length === 0) {
					await new Promise<void>((childResolve, childReject) => {
						const child = spawn(`wrangler secret put ${secret}`, [], { cwd: this.workingDirectory, env: process.env, stdio: 'pipe' });

						child.stdin.write(VALUE);
						child.stdin.end();

						child.stdout.on('data', (data) => console.log(data));

						child.once('error', (error) => {
							console.error(error);
							core.setFailed(error.message);
							childReject(error);
						});

						child.once('close', (code) => {
							if (code !== 0) {
								const errorMsg = `child process exited with code ${code}`;
								console.error(errorMsg);
								core.setFailed(errorMsg);
								childReject(new Error(errorMsg));
							} else {
								childResolve();
							}
						});
					});
				} else {
					await new Promise<void>((childResolve, childReject) => {
						const child = spawn(`wrangler secret put ${secret} --env ${INPUT_ENVIRONMENT}`, [], { cwd: this.workingDirectory, env: process.env, stdio: 'pipe' });

						child.stdin.write(VALUE);
						child.stdin.end();

						child.stdout.on('data', (data) => console.log(data));

						child.once('error', (error) => {
							console.error(error);
							core.setFailed(error.message);
							childReject(error);
						});

						child.once('close', (code) => {
							if (code !== 0) {
								const errorMsg = `child process exited with code ${code}`;
								console.error(errorMsg);
								core.setFailed(errorMsg);
								childReject(new Error(errorMsg));
							} else {
								childResolve();
							}
						});
					});
				}
			}
			if (childError) {
				core.setFailed('command failure');
				mainReject();
			} else {
				mainResolve();
			}
		});
	}

	private secret_not_found(secret: string) {
		const errorMsg = `::error::Specified secret ${secret} not found in environment variables.`;
		core.setFailed(errorMsg);
		throw new Error(errorMsg);
	}
}

await new Wrangler().main();
