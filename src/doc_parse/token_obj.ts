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

class FuncArg {
  argName: string;
  argType: string;
  argDefault: string;

  constructor(argName: string, argType: string, argDefault: string = '') {
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
   *  'q_str:string'
   *  'q_str:string=""'
   *  'eggs=None'
   * @param tokens 
   */
  static constructArgFromTokens(tokens: Array<string>): Array<FuncArg> {
    let argList: Array<FuncArg> = [];
    tokens.forEach((tok) => {
      const tokPattern = /^(\w+)(?:\s*:\s*([^=]+))?(?:\s*=\s*(.+))?/;
      console.log(tokPattern.exec(tok));

      // let ret = tok.split(':');
      // console.log(ret);
    });
    return argList;
  }
}

class PyClassToken extends ClassToken {

}

export { FuncArg, PyFuncToken, PyClassToken };

function main() {

  let TEST_CASES = [
    'q_str',
    'q_str:string',
    'q_str:string=""',
    'eggs=None',
  ];
  PyFuncToken.constructArgFromTokens(TEST_CASES);
}
if (require.main === module) {
  main();
}
