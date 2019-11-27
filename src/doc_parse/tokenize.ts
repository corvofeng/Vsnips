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
import { PyFuncToken, FuncArg, TsFuncToken } from "./token_obj";

function pythonTokenizer(defs: string): PyFuncToken | undefined {
  const definitionPattern = /(def|class)\s+(\w+)\s*\(([\s\S]*)\)\s*(->\s*[\w\[\], \.]*)?:\s*$/;
  const match = definitionPattern.exec(defs) as RegExpExecArray;
  if (match === null) {
    Logger.info("Can't get token in:", defs);
    return undefined;
  }

  let [_, tokType, tokName, tokArgsRaw, tokRet] = match;
  if (tokArgsRaw === undefined) {
    Logger.warn(tokType, tokName, tokArgsRaw, tokRet);
    return undefined;
  }

  const tokArgs = tokenizeParameterString(tokArgsRaw);

  if (tokRet !== undefined) {
    if (tokRet.startsWith('->')) {
      tokRet = tokRet.substr(2);
      tokRet = tokRet.replace(/\s+/g, '');
    }
  } else {
    tokRet = '';
  }
  if (tokType === 'def') {
    return new PyFuncToken(tokName,
      PyFuncToken.constructArgFromTokens(tokArgs),
      PyFuncToken.constructRetFromTokens([tokRet]),
    );
  } else if (tokType === 'class') {
    return undefined
  }

  return undefined;
}

// 从函数的所有参数列表中解析出每个参数
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

function tsTokenizer(defs: string): TsFuncToken | undefined {
  // 要支持做解析的函数类型
  // 普通JS函数: function add(x, y)
  // 普通TS函数: function add(x: number, y: number): number {
  // 可选参数的TS函数: function me(firstName: string, lastName?: string) {
  // 缺省参数的TS函数: function buildName(firstName: string, lastName = "Smith")
  // 可变参数的TS函数: function buildName(firstName: string, ...restOfName: string[]) {
  // lambda函数(一般不写注释): let myAdd: (baseValue: number, increment: number) => number =
  // 普通函数(一般不会写注释): let myAdd = function(x: number, y: number): number { return  x + y; };

  // const definitionPattern = /(function)\s+(\w+)\s*\(([\s\S]*)\)\s*(->\s*[\w\[\], \.]*)?(:|=>)\s*(?:{\s*}?)?$/;
  const definitionPattern = /(function)\s+(\w+)\s*\(([\s\S]*)\)\s*(:\s*[\w\[\], \.]*)?(?:\s*\{\s*\n*)?$/;
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

  // 正则中解析出的tokRet是带有开头的冒号的
  if (tokRet !== undefined) {
    if (tokRet.startsWith(':')) {
      tokRet = tokRet.substr(1);
      tokRet = tokRet.replace(/\s+/g, '');
    }
  } else {
    tokRet = '';
  }

  Logger.debug("Get ", defs, " result:\n", "type", tokType, "name", tokName, "args", tokArgsRaw, "ret", tokRet);
  const tokArgs = tokenizeParameterString(tokArgsRaw);

  return new TsFuncToken(tokName,
    TsFuncToken.constructArgFromTokens(tokArgs),
    TsFuncToken.constructRetFromTokens([tokRet]),
  );
}


function parseTokenizer(defs: string, defsType: string) {
  if (defsType === 'python') {
    return pythonTokenizer(defs);
  } else if (defsType === 'javascript' || defsType === 'typescript') {
    return tsTokenizer(defs);

  }
}

export { parseTokenizer };
