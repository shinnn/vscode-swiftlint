'use strict';

const path = require('path');

const langClient = require('vscode-languageclient');
const LanguageClient = langClient.LanguageClient;
const SettingMonitor = langClient.SettingMonitor;
const vscode = require('vscode');

exports.activate = function activateSwiftLint(context) {
  const serverModule = path.join(__dirname, 'server.js');

  // Provides some visibility into the server-side of the LSP
  const outputChannel = vscode.window.createOutputChannel('SwiftLint');

  const client = new LanguageClient('Standard Linter', {
    run: {
      module: serverModule
    },
    debug: {
      module: serverModule
    }
  }, {
    documentSelector: ['swift'],
    synchronize: {
      fileEvents: vscode.workspace.createFileSystemWatcher('.swiftlint.yml')
    },
    outputChannel
  });

  context.subscriptions.push(new SettingMonitor(client, 'swiftlint.enable').start());
};
