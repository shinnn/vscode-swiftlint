'use strict';

const langServer = require('vscode-languageserver');

function parseSeverity(severity) {
  if (severity === 'error') {
    return langServer.DiagnosticSeverity.Error;
  }

  return langServer.DiagnosticSeverity.Warning;
}

module.exports = function parseSwiftLintStdout(str) {
  if (typeof str !== 'string') {
    throw new TypeError(
      String(str) +
      ' is not a string. Expected a standard output of SwiftLint.'
    );
  }

  const regex = /^([^:]+):(\d+):(?:(\d+):)? (error|warning): (.+): (.+) \((.+)\)$/gm;
  const results = [];
  let matched;

  while ((matched = regex.exec(str)) !== null) {
    results.push({
      message: `SwiftLint: ${matched[5]}: ${matched[6]} (${matched[7]})`,
      severity: parseSeverity(matched[4]),
      range: {
        start: {
          line: Number(matched[2]) - 1,
          character: matched[3] === undefined ? 0 : Number(matched[3]) - 1
        },
        end: {
          line: Number(matched[2]) - 1,
          character: matched[3] === undefined ? Number.MAX_SAFE_INTEGER : Number(matched[3]) - 1
        }
      }
    });
  }

  return results;
};
