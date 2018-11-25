'use strict';

const concatStream = require('concat-stream');
const langServer = require('vscode-languageserver');
const spawn = require('child_process').spawn;
const whichPromise = require('which-promise');
const parser = require('./parser');
const join = require('path').join;
const existsSync = require('fs').existsSync;

let cwd;
let swiftLintPath;

const connection = langServer.createConnection(process.stdin, process.stdout);
const documents = new langServer.TextDocuments();

function getMessage(err, document) {
  if (typeof err.message === 'string') {
    return err.message;
  }

  return 'An unknown error occurred while validating file:' +
         langServer.Files.uriToFilePath(document.uri);
}

function validate(document) {
  const uri = document.uri;

  const cp = spawn(swiftLintPath, ['lint', '--use-stdin'], {cwd});
  cp.stdout.setEncoding('utf8');
  cp.stdout.pipe(concatStream({encoding: 'string'}, out => {
    connection.sendDiagnostics({uri, diagnostics: parser(out)});
  }));

  cp.on('error', err => connection.window.showErrorMessage(getMessage(err, document)));

  cp.stdin.end(new Buffer(document.getText()));
}

function validateAll() {
  documents.all().forEach(document => validate(document));
}

connection.onInitialize(params => {
  cwd = params.rootPath;

  const possibleLocalPaths = ['.build/debug/swiftlint', '.build/release/swiftlint'];
  for (const path of possibleLocalPaths) {
    // Grab the project root from the local workspace
    const fullPath = join(cwd, path);

    if (existsSync(fullPath)) {
      swiftLintPath = fullPath;
      return new Promise();
    }
  }

  return whichPromise('swiftlint').then(binPath => {
    swiftLintPath = binPath;
  }, () => Promise.reject(new langServer.ResponseError(
    99,
    '`swiftlint` command is not installed. Install it and then press Retry. ' +
    'https://github.com/realm/SwiftLint#installation',
    {retry: true}
  )))
  .catch(err => Promise.reject(new langServer.ResponseError(99, err.message, {retry: false})));
});

connection.onDidChangeConfiguration(() => validateAll());
connection.onDidChangeWatchedFiles(() => validateAll());

documents.onDidChangeContent(event => validate(event.document));
documents.listen(connection);

connection.listen();
