import * as vscode from 'vscode';
import * as fs from 'fs';
import * as os from 'os';
import { join } from 'path';

function rndName() {
	return Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 10);
}

export function createRandomFile(contents = '', fileExtension = 'txt'): Thenable<vscode.Uri> {
	return new Promise((resolve, reject) => {
		const tmpFile = join(os.tmpdir(), rndName() + '.' + fileExtension);
		fs.writeFile(tmpFile, contents, (error) => {
			if (error) {
				return reject(error);
			}

			resolve(vscode.Uri.file(tmpFile));
		});
	});
}

export function deleteFile(file: vscode.Uri): Thenable<boolean> {
	return new Promise((resolve, reject) => {
		fs.unlink(file.fsPath, (err) => {
			if (err) {
				reject(err);
			} else {
				resolve(true);
			}
		});
	});
}

export function closeAllEditors(): Thenable<any> {
	return vscode.commands.executeCommand('workbench.action.closeAllEditors');
}
