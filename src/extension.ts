'use strict';
import * as vscode from 'vscode';
import * as path from 'path';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    const languages = ['typescript', 'javascript'];
    const window = vscode.window;
    const workspace = vscode.workspace;
    const isTestRegex = /^((\s*)(it|describe)(\s*)\((\s*)('|"))/g;
    const isTestSetRegex = /^((\s*)(describe)(\s*)\((\s*)('|"))/g;
    const testNameRegex = /(("|')(.*?)("|'))/;

    let disposable = vscode.commands.registerCommand('extension.executeProtractorTest', (match) => {
        let terminal: vscode.Terminal = window.terminals.length > 0 ? window.terminals[0] : window.createTerminal();
        terminal.show();
        const protactorConfigPath = getProtractorConfig();
        const testFile = match.testFile;
        const testName = match.testName;
        terminal.sendText(`cd "${workspace.rootPath}"`);
        terminal.sendText(`protractor ${protactorConfigPath} --specs='${testFile}' --grep="${testName}"`);  
    });

    languages.forEach(language => {
        context.subscriptions.push(vscode.languages.registerCodeLensProvider(language, { provideCodeLenses }));
    });

    function getProtractorConfig() {
        const config = workspace.getConfiguration('run-protractor');
        let protactorConfigPath = '';
        if (workspace && workspace.rootPath && config && config.protractorConfiguration) {
            protactorConfigPath = path.join(workspace.rootPath, config.protractorConfiguration);
        }
        return protactorConfigPath;
    }

    function provideCodeLenses(document: vscode.TextDocument, token: vscode.CancellationToken) {
        
        if (!window || !window.activeTextEditor) {
            return;
        }

        let matches: Match[] = [];
        var doc = window.activeTextEditor.document;
        
        for (let index = 0; index < doc.lineCount; index++) {
            const line = doc.lineAt(index).text;
            if (isTestRegex.test(line)) {
                const testNameMatch = line.match(testNameRegex);
                let match: Match = {
                    range: new vscode.Range(new vscode.Position(index, 0), new vscode.Position(index, 5)),
                    testName: testNameMatch ? testNameMatch[3] : "",
                    testFile: doc.fileName,
                    isTestSet: isTestSetRegex.test(line)
                };

                matches.push(match);
            }           
        }

        return matches.map(match => new vscode.CodeLens(match.range, {
            title: match.isTestSet ? 'Run tests' : 'Run test',
            command: 'extension.executeProtractorTest',
            arguments: [ match ]
        }));
    }

    context.subscriptions.push(disposable);
}

export interface Match {
    range: vscode.Range;
    testName: string;
    testFile: string;
    isTestSet: boolean;
}

// this method is called when your extension is deactivated
export function deactivate() {
}