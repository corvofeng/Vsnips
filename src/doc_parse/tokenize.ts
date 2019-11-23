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
  const definitionPattern = /(function)\s+(\w+)\s*\(([\s\S]*)\)\s*(:\s*[\w\[\], \.]*)?(?:\s*\{)?$/;
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


function parsePYFunc() {
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


function parseTSFunc() {
  // [args] + [期望的返回值]
  let TEST_JS_AND_TS_FUNCS = [
    [ // 简单的JS函数
      ['function query_docs(q_str):', 'javascript'],
      [new TsFuncToken(
        "query_docs",
        [new FuncArg('q_str')],
        []
      )],
    ],
    [ // 基础的TS函数, 带返回类型
      ['function add(x: number, y: number): number', 'typescript'],
      [new TsFuncToken(
        "add",
        [new FuncArg('x', 'number', ''), new FuncArg('y', 'number', '')],
        [new FuncArg('', 'number', ''),]
      )],
    ],
    [ // 基础TS函数, 带返回类型, 增加了末尾的`{`
      ['function add(x: number, y: number): number {', 'typescript'],
      [new TsFuncToken(
        "add",
        [new FuncArg('x', 'number', ''), new FuncArg('y', 'number', '')],
        [new FuncArg('', 'number', ''),]
      )],
    ],
    [ // 可选参数的TS函数
      ['function me(firstName: string, lastName?: string)', 'typescript'],
      [new TsFuncToken(
        "me",
        [new FuncArg('firstName', 'string', ''), new FuncArg('lastName', 'string', '')],
        []
      )],
    ],
    [ // 携带缺省值的函数
      ['function buildName(firstName: string, lastName = "Smith")', 'typescript'],
      [new TsFuncToken(
        "buildName",
        [new FuncArg('firstName', 'string', ''), new FuncArg('lastName', '', 'Smith')],
        []
      )],
    ],
    [ // 可变参数 有自己的类型
      ['function buildName(firstName: string, ...restOfName: string[]) {', 'typescript'],
      [new TsFuncToken(
        "buildName",
        [new FuncArg('firstName', 'string', ''), new FuncArg('restOfName', 'string[]', '')],
        []
      )],
    ],
    [ // 可变参数, 但是没有自己的类型
      ['function buildName(firstName: string, ...restOfName) {', 'typescript'],
      [new TsFuncToken(
        "buildName",
        [new FuncArg('firstName', 'string', ''), new FuncArg('restOfName', 'object[]', '')],
        []
      )],
    ],
  ]
  TEST_JS_AND_TS_FUNCS.forEach(c => {
    let tok = parseTokenizer(c[0][0] as string, c[0][1] as string);
    Logger.debug("Get tokobj: ", tok);

    if (c.length == 2) {
      let expectToke = c[1][0] as TsFuncToken;
      if (tok !== undefined) {
        if (!expectToke.isSameToken(tok)) {
          Logger.error("Fatal in parse", c[0], "get", tok);
        }
      }
      Logger.debug("Wanna get ", expectToke);
    }
  });
}

function main() {
  parsePYFunc()
  Logger.debug("==============")
  parseTSFunc()
}
if (require.main === module) {
  main();
}

