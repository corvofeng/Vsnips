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

  /**
   * 根据tokens构建参数列表
   * @param tokens 
   */
  static constructArgFromTokens(tokens: Array<string>): Array<FuncArg> {
    let argList: Array<FuncArg> = [];
    tokens.forEach((tok) => {
      const tokPattern = /^(\w+)(?:\s*:\s*([^=]+))?(?:\s*=\s*(.+))?/;
      let [_, argName, argType, argDefault] = tokPattern.exec(tok) as RegExpExecArray;

      argList.push(new FuncArg(argName, argType, argDefault));
    });
    return argList;
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
  if (!main()) {
    process.exit(-1);
  }
}