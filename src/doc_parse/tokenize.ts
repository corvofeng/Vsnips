"use strict";

import { Logger } from "../logger";

// vim: ts=2 sw=2 sts=2 et:
/*
 *=======================================================================
 *    Filename: tokenize
 *
 *     Version: 1.0
 *  Created on: August 15, 2019
 *
 *      Author: corvofeng
 * 
 * This file refer to:
 *   https://github.com/NilsJPWerner/autoDocstring/blob/master/src/parse/tokenize_definition.ts
 *=======================================================================
 */


function pythonTokenizer(defs: string) {
  const definitionPattern = /(?:def|class)\s+\w+\s*\(([\s\S]*)\)\s*(->\s*[\w\[\], \.]*)?:\s*$/;
  const match = definitionPattern.exec(defs);
  if (match == undefined || match[1] == undefined) {
    return [];
  }
  // let _, 
  // Logger.debug("Get matched: ", match);

  const tokens = tokenizeParameterString(match[1]);
  Logger.debug(match[0], tokens);

  if (match[2] != undefined) {
    tokens.push(match[2]);
  }

  return tokens;
}

function tokenizeParameterString(parameterString: string): string[] {
  const stack = [];
  const parameters = [];
  let arg = "";

  let position = parameterString.length - 1;

  while (position >= 0) {

    const top = stack[stack.length - 1];
    const char = parameterString.charAt(position);

    /* todo
        '<' char,
        error management
    */
    switch (true) {
      // 1. Check for top level comma and push arg to array
      case char === "," && stack.length === 0:
        parameters.unshift(arg);
        arg = "";
        position -= 1;
        continue;

      // 2. Check for closing double or single quote of string
      case char === '"' && top === '"':
      case char === "'" && top === "'":
        stack.pop();
        break;

      // 3.  Do nothing if quote at the top of stack
      case top === '"':
      case top === "'":
        break;

      // 4. Push single and double quotes to stack
      case char === '"':
      case char === "'":
        stack.push(char);
        break;

      // 5. Check for closing of tuples, arrays, or dicts
      case char === "(" && top === ")":
      case char === "[" && top === "]":
      case char === "{" && top === "}":
        stack.pop();
        break;

      // 6. Do nothing if closing char but no matching char on stack
      case char === "(":
      case char === "[":
      case char === "{":
        break;

      // 7. Push opening char to stack
      case char === ")":
      case char === "]":
      case char === "}":
        stack.push(char);
        break;

      // 8. Disregard whitespace at top level of stack
      case char === " " && stack.length === 0:
      case char === "\n" && stack.length === 0:
      case char === "\t" && stack.length === 0:
        position -= 1;
        continue;
    }

    arg = char + arg;
    position -= 1;
  }

  if (arg.length > 0) { parameters.unshift(arg); }

  return parameters;
}

function parseTokenizer(defs: string, defsType: string) {
  if (defsType === 'python') {
    return pythonTokenizer(defs);
  }
}



function parseFunc() {
  let TEST_FUNCS = [
    ['def query_docs(q_str):', 'python'],
    ['def query_docs(q_str: string):', 'python'],
    ['def query_docs(q_str: string=""):', 'python'],
    ['def query_docs(eggs=None):', 'python'],
    [`def query_docs(
        arg1,
        q_str: string
      ):
      `,
      'python'],
    ['class example_cls(object):', 'python'],
    ['def greeting(name: str) -> str:', 'python'],
  ];
  TEST_FUNCS.forEach(c => {
    parseTokenizer(c[0], c[1])
  });

}

function main() {
  parseFunc()
}
if (require.main === module) {
  main();
}

