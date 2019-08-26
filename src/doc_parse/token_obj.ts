"use strict";
// vim: ts=2 sw=2 sts=2 et:
/*
 *=======================================================================
 *    Filename: funcToken
 *
 *     Version: 1.0
 *  Created on: August 15, 2019
 *
 *      Author: corvofeng
 *=======================================================================
 */

import { Logger } from "../logger";

class FuncArg {
  argName: string;
  argType: string;
  argDefault: string;

  constructor(argName: string, argType: string = '', argDefault: string = '') {
    this.argName = argName;
    this.argType = argType;
    this.argDefault = argDefault;
  }
}

class FuncToken {
  funcName: string;
  funcArgs: Array<FuncArg>;
  funcRets: Array<FuncArg>;

  constructor(
    funcName: string,
    funcArgs: Array<FuncArg>,
    funcRets: Array<FuncArg>,
  ) {
    this.funcName = funcName;
    this.funcArgs = funcArgs;
    this.funcRets = funcRets;
  }
}

class ClassToken {
  className: string;
  superClasses: Array<string>;
  constructor(
    className: string,
    superClasses: Array<string>,
  ) {
    this.className = className;
    this.superClasses = superClasses;
  }
}

class PyFuncToken extends FuncToken {

  static NORMAL = 0x1;
  static DOXYGEN = 0x2;
  static SPHINX = 0x3;
  static GOOGLE = 0x4;
  static NUMPY = 0x5;
  static JEDI = 0x6;

  /**
   * 根据tokens构建参数列表
   * @param tokens 
   */
  static constructArgFromTokens(tokens: Array<string>): Array<FuncArg> {
    let argList: Array<FuncArg> = [];
    tokens.forEach((tok) => {
      const tokPattern = /^(\**\w+)(?:\s*:\s*([^=]+))?(?:\s*=\s*(.+))?/;
      let [_, argName, argType, argDefault] = tokPattern.exec(tok) as RegExpExecArray;

      argList.push(new FuncArg(argName, argType, argDefault));
    });
    return argList;
  }

  getSnip(style: number) {
    function format_arg(arg: FuncArg, style: number) {
      if (style == PyFuncToken.DOXYGEN) {
      }
      let rlt = '';
      switch (style) {
        case PyFuncToken.DOXYGEN:
          rlt = `@param ${arg.argName} TODO`;
          break;

        case PyFuncToken.SPHINX:
          rlt = `:param ${arg.argName}: TODO`;
          if (arg.argType) {
            rlt += '\n'
            rlt += `:type ${arg.argName}: ${arg.argType}`;
          }
          break;

        case PyFuncToken.GOOGLE:
          rlt = `${arg.argName} (${arg.argType || "TODO"}): TODO`;
          break;
        case PyFuncToken.JEDI:
          rlt = `:type ${arg.argName}: TODO`;
          break;

        case PyFuncToken.NUMPY:
          rlt = `${arg.argName} : TODO`
          break;

        default:
          break;
      }
      return rlt;
    }

    function format_return(style: number) {
      let rlt = '';
      switch (style) {
        case PyFuncToken.DOXYGEN:
          rlt = "@return: TODO";
          break;

        case PyFuncToken.NORMAL:
        case PyFuncToken.SPHINX:
        case PyFuncToken.JEDI:
          rlt = ":returns: TODO";
          break;

        case PyFuncToken.GOOGLE:
          rlt = "Returns: TODO";
          break;

        default:
          break;
      }
      return rlt;
    }

    let doc = '';
    this.funcArgs.forEach((arg) => {
      if (arg.argName == 'self') {
        return;
      }
      doc += format_arg(arg, style) + '\n';
    });
    doc += format_return(style);
    return doc;
  }
}

class PyClassToken extends ClassToken {

}

export { FuncArg, PyFuncToken, PyClassToken };

function main() {

  let TEST_CASES = [
    [['q_str'], [new FuncArg('q_str')]],
    [['q_str:string'], [new FuncArg('q_str', 'string')]],
    [['q_str:string=""'], [new FuncArg('q_str', 'string', '""')]],
    [['eggs=None'], [new FuncArg('eggs', '', 'None')]],
    [['eggs: obj=None'], [new FuncArg('eggs', 'obj', 'None')]],
    [['*args'], [new FuncArg('*args', '', '')]],
    [['**kwargs'], [new FuncArg('**kwargs', '', '')]],
  ];
  TEST_CASES.forEach((c) => {
    let funcArgs = PyFuncToken.constructArgFromTokens(c[0] as Array<string>);
    let a1 = funcArgs[0];
    let a2: FuncArg = c[1][0] as any;
    if (a1.argName != a2.argName || a1.argType != a2.argType || a1.argDefault != a2.argDefault) {
      // console.log(a1.argName, a2.argName);
      Logger.error("Fetal in parse: ", c[0], "get: ", funcArgs);
      return -1;
    }
  });
  return 0;
}
if (require.main === module) {
  if (main() < 0) {
    process.exit(-1);
  }
}
