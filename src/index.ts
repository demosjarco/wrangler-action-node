import * as core from '@actions/core';
import * as github from '@actions/github';

import path from 'node:path';
import { access, constants } from 'node:fs';
import semver from 'semver';
import { exec } from 'node:child_process';

class Wrangler {
	private workingDirectory: string = '';

	public async main() {
		this.workingDirectory = await this.setupWorkingDirectory(core.getInput('workingDirectory', { trimWhitespace: true }));
		await this.installWrangler(core.getInput('wranglerVersion', { trimWhitespace: true }));
	}

	private setupWorkingDirectory(workingDirectory: string = ''): Promise<string> {
		let normalizedPath: string = '';
		try {
			normalizedPath = path.normalize(workingDirectory);
		} catch (error) {
			console.error(workingDirectory, 'not a valid path', error);
			console.warn('Ignoring `workingDirectory` and using current directory');
			normalizedPath = path.normalize('');
		}

		return new Promise<string>((resolve, reject) => {
			access(normalizedPath, constants.R_OK | constants.W_OK | constants.X_OK, (error) => {
				if (error) reject(error);

				console.info('Using', normalizedPath, 'as working directory');
				resolve(normalizedPath);
			});
		});
	}

	private installWrangler(version: string): Promise<void> {
		let versionToUse = '';

		if (semver.valid(version)) {
			versionToUse = `@${version}`;
		} else {
			console.error('Invalid version:', version.length > 0 ? version : typeof undefined, 'using currently installed or latest version');
		}

		const command = `npm install --save-dev wrangler${versionToUse}`;
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
