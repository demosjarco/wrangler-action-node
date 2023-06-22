import * as core from '@actions/core';
import * as github from '@actions/github';

import path from 'node:path';
import { exec } from 'node:child_process';

class Wrangler {
	private workingDirectory: string = this.setupWorkingDirectory(core.getInput('workingDirectory', { trimWhitespace: true }));

	public async main() {
		await this.installWrangler(core.getInput('wranglerVersion', { trimWhitespace: true }));
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

		if (version.length > 0) {
			versionToUse = `@${version}`;
			// If Wrangler version starts with 1 then install wrangler v1
			if (version.startsWith('1')) {
				// v1 Wrangler uses `@cloudflare` scope
				packageName = '@cloudflare/wrangler';
			}
		} else {
			// If no Wrangler version is specified install latest.
			console.warn('Using currently installed or latest version from npm of `wrangler`');
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

	private execute_commands() {}

	private secret_not_found() {}
}

await new Wrangler().main();
