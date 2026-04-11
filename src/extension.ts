import * as vscode from 'vscode';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { NecoViewProvider } from './NecoViewProvider';
import { addCommentFromSelection } from './commands/addCommentCommand';
import { handleSelectionChange } from './services/selectionSyncService';

export function activate(context: vscode.ExtensionContext) {
	const envPath = path.join(context.extensionPath, '.env');
	dotenv.config({ path: envPath });

	console.log('[NECO] envPath:', envPath);
	console.log('[NECO] env GEMINI:', !!process.env.GEMINI_API_KEY);

	const provider = new NecoViewProvider(context.extensionUri);

	context.subscriptions.push(
		vscode.commands.registerCommand('neco.addComment', addCommentFromSelection),
		vscode.window.registerWebviewViewProvider('necoSidebarView', provider),
		handleSelectionChange(provider),
	);
}

export function deactivate() {}