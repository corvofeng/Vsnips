"use strict";
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

import { Logger } from "../logger";
import { PyFuncToken, FuncArg } from "./token_obj";

function pythonTokenizer(defs: string): PyFuncToken | undefined {
  const definitionPattern = /(def|class)\s+(\w+)\s*\(([\s\S]*)\)\s*(->\s*[\w\[\], \.]*)?:\s*$/;
  const match = definitionPattern.exec(defs) as RegExpExecArray;
  if (match === null) {
    Logger.info("Can't get token in:", defs);
    return undefined;
  }

  let [_, tokType, tokName, tokArgsRaw, tokRet] = match;
  if (tokArgsRaw == undefined) {
    Logger.warn(tokType, tokName, tokArgsRaw, tokRet);
    return undefined;
  }

  const tokArgs = tokenizeParameterString(tokArgsRaw);

  if (tokType === 'def') {
    return new PyFuncToken(tokName, PyFuncToken.constructArgFromTokens(tokArgs), []);
  } else if (tokType === 'class') {
    return undefined
  }

  return undefined;
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

export { parseTokenizer };


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
    ['    def greeting(name: str="") -> str:', 'python'], // 包含缩进
    ['import IPython; IPython.embed()', 'python'],  // 非函数定义
    ['def greeting(*args, **kwargs) -> str:', 'python'],
    ['def greeting(name: str=""', 'python'],   // 不完整的函数定义
  ];
  TEST_FUNCS.forEach(c => {
    let tok = parseTokenizer(c[0], c[1])
    Logger.debug("Get tokobj: ", tok);
  });
}

function main() {
  parseFunc()
}
if (require.main === module) {
  main();
}

