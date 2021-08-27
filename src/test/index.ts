//
// PLEASE DO NOT MODIFY / DELETE UNLESS YOU KNOW WHAT YOU ARE DOING
//
// This file is providing the test runner to use when running extension tests.
// By default the test runner in use is Mocha based.
//
// You can provide your own test runner if you want to override it by exporting
// a function run(testsRoot: string, clb: (error: Error, failures?: number) => void): void
// that the extension host can call to run the tests. The test runner is expected to use console.log
// to report the results back to the caller. When the tests are finished, return
// a possible error to the callback or null if none.

// import * as testRunner from "vscode/lib/testrunner";
import { runTests } from "@vscode/test-electron";

import * as path from "path";
import * as Mocha from "mocha";
import * as glob from "glob";
// import { window } from "vscode";
// import * as assert from "assert";

// You can directly control Mocha options by configuring the test runner below
// See https://github.com/mochajs/mocha/wiki/Using-mocha-programmatically#set-options
// for more info
// testRunner.configure({
//     ui: 'tdd', 		// the TDD UI is being used in extension.test.ts (suite, test, etc.)
//     useColors: true // colored output from test results
// });

// module.exports = testRunner;

export function run(): Promise<void> {
  // Create the mocha test
  const mocha = new Mocha({
    ui: "bdd",
    reporter: "list",
  });
  mocha.useColors(true);

  const testsRoot = path.resolve(__dirname, "..");

  return new Promise((c, e) => {
    glob("./test/**/*.spec.js", { cwd: testsRoot }, (err, files) => {
      if (err) {
        return e(err);
      }
      // Add files to the test suite
      files.forEach((f) => mocha.addFile(path.resolve(testsRoot, f)));

      try {
        // Run the mocha test
        mocha.run((failures) => {
          if (failures > 0) {
            // eslint-disable-next-line
            console.error(failures);
            e(new Error(`${failures} tests failed.`));
          } else {
            c();
          }
        });
      } catch (err) {
        // eslint-disable-next-line
        console.error(err);
        e(err);
      }
    });
  });
}
