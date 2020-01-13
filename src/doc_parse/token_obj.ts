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
import { trim } from "../util";

class FuncArg {
  argName: string;
  argType: string;
  argDefault: string;

  constructor(argName: string, argType: string = "", argDefault: string = "") {
    this.argName = argName;
    this.argType = argType;
    this.argDefault = trim(argDefault, ['"', "'"]);
  }
  isSameArgs(args: FuncArg): boolean {
    if (
      this.argName !== args.argName ||
      this.argType !== args.argType ||
      this.argDefault !== args.argDefault
    ) {
      return false;
    }
    return true;
  }
}

class FuncToken {
  static NORMAL = 0x1;
  static DOXYGEN = 0x2;
  static SPHINX = 0x3;
  static GOOGLE = 0x4;
  static NUMPY = 0x5;
  static JEDI = 0x6;

  funcName: string;
  funcArgs: Array<FuncArg>;
  funcRets: Array<FuncArg>;

  constructor(
    funcName: string,
    funcArgs: Array<FuncArg>,
    funcRets: Array<FuncArg>
  ) {
    this.funcName = funcName;
    this.funcArgs = funcArgs;
    this.funcRets = funcRets;
  }

  static constructRetFromTokens(tokens: Array<string>): Array<FuncArg> {
    let retList: Array<FuncArg> = [];
    if (tokens.length === 0) {
      return retList;
    }
    let retType = tokens[0];

    if (tokens.length > 1) {
      Logger.warn("The ts return type length is bigger than 1: ", tokens);
    }
    if (retType === "") {
      return retList;
    }

    retList.push(new FuncArg("", retType));

    return retList;
  }

  static format_arg(arg: FuncArg, style: number, prefix: string = "") {
    let rlt = "";
    switch (style) {
      case FuncToken.DOXYGEN:
        rlt = `${prefix}@param ${arg.argName} TODO`;
        break;

      case FuncToken.SPHINX:
        rlt = `${prefix}:param ${arg.argName}: TODO`;
        if (arg.argType) {
          rlt += `${prefix}\n`;
          rlt += `${prefix}:type ${arg.argName}: ${arg.argType}`;
        }
        break;

      case FuncToken.GOOGLE:
        rlt = `${prefix}${arg.argName} (${arg.argType || "TODO"}): TODO`;
        break;
      case FuncToken.JEDI:
        rlt = `${prefix}:type ${arg.argName}: TODO`;
        break;

      case FuncToken.NUMPY:
        rlt = `${prefix}${arg.argName} : TODO`;
        break;

      default:
        break;
    }
    return rlt;
  }

  static format_return(style: number, prefix: string = "") {
    let rlt = "";
    switch (style) {
      case FuncToken.DOXYGEN:
        rlt = `${prefix}@return: TODO`;
        break;

      case FuncToken.NORMAL:
      case FuncToken.SPHINX:
      case FuncToken.JEDI:
        rlt = `${prefix}:returns: TODO`;
        break;

      case FuncToken.GOOGLE:
        rlt = `${prefix}Returns: TODO`;
        break;

      default:
        break;
    }
    return rlt;
  }
}

class ClassToken {
  className: string;
  superClasses: Array<string>;
  constructor(className: string, superClasses: Array<string>) {
    this.className = className;
    this.superClasses = superClasses;
  }
}

export { FuncToken, FuncArg, ClassToken };
