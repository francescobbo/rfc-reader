import * as vscode from 'vscode';
import axios from 'axios';
import { JSDOM } from 'jsdom';

async function openRfc(number: number) {
	const response = await axios({
		method: 'GET',
		url: `https://datatracker.ietf.org/doc/html/rfc${number}`,
		responseType: 'document'
	});
	if (response.status !== 200) {
		vscode.window.showErrorMessage('Error fetching RFC');
		return;
	}

	const html = response.data;
	const dom = new JSDOM(html);

	const body = dom.window.document.querySelector('div.rfcmarkup');
	if (!body) {
		vscode.window.showErrorMessage('Error fetching RFC');
		return;
	}

	body.querySelectorAll('a').forEach((a) => {
		if (a.href.match(/\/doc\/html\/rfc\d+/)) {
			const number = a.href.match(/\/doc\/html\/rfc(\d+)/)?.[1];
			a.setAttribute('href', `command:rfc-reader.open?${number}`);
		}
	});

	const doc = vscode.window.createWebviewPanel(
		'rfcReader',
		`RFC ${number}`,
		vscode.ViewColumn.One,
		{
			enableCommandUris: true,
		}
	);

	doc.webview.html = body.innerHTML;
}

export function activate(context: vscode.ExtensionContext) {
	let disposable = vscode.commands.registerCommand('rfc-reader.open', async (args) => {
		if (args) {
			const number = Number(args);
			openRfc(number);
			return;
		}

		const numberString = await vscode.window.showInputBox({
			placeHolder: 'RFC Number',
			prompt: 'Enter the RFC number you want to read',
			validateInput: (value: string) => {
				if (isNaN(Number(value))) {
					return 'Please enter a valid number';
				}
			}
		});

		const number = Number(numberString);
		openRfc(number);
	});

	context.subscriptions.push(disposable);
}

export function deactivate() {}
